// Video engine: one paused <video>, its currentTime driven by scroll.
//
// Lessons from the AC site (25-28.10), all on a real iPhone:
//  - iOS loads a video only after play(), and paints the seeks of a paused
//    video only once it has played: play() then pause() right away, and on
//    the first touch again (Low Power Mode refuses the first one).
//  - The file is downloaded whole and played from a blob: seeking a file
//    that is still streaming stalls.
//  - One seek at a time. While one is running the newest target waits, and
//    'seeked' sends it. A seek per scroll event queues up and lags.
//  - 60 frames a second with a keyframe every 6 felt "like a film"; a file
//    where every frame is a keyframe was not better.
import type { Renderer } from "./types";
import type { AssetLoader } from "./AssetLoader";

export class VideoScrubController implements Renderer {
  firstPaint: number | null = null;
  private url: string | null = null;
  private dead = false;
  private ready = false;
  private want = 0; // seconds
  private presented: number | null = null; // media time of the frame on screen
  private size = 0;

  constructor(
    private el: HTMLVideoElement,
    src: string,
    private fps: number,
    loader: AssetLoader,
  ) {
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.preload = "auto";
    el.addEventListener("seeked", this.onSeeked);
    window.addEventListener("touchstart", this.onTouch, { passive: true });
    loader
      .blob(src)
      .then((b) => {
        if (this.dead) return;
        this.size = b.size;
        this.url = URL.createObjectURL(b);
        el.src = this.url;
        if ("requestVideoFrameCallback" in el) {
          const onFrame = (_: number, meta: VideoFrameCallbackMetadata) => {
            if (this.dead) return;
            this.presented = meta.mediaTime;
            if (this.firstPaint === null) this.firstPaint = performance.now();
            el.requestVideoFrameCallback(onFrame);
          };
          el.requestVideoFrameCallback(onFrame);
        }
        return this.prime();
      })
      .catch(() => {});
  }

  private prime = () =>
    this.el
      .play()
      .then(() => {
        this.el.pause();
        this.ready = true;
        this.seek();
      })
      .catch(() => {});

  // The first touch primes again (Low Power Mode refuses the play() at load),
  // and then the touch is left alone. It used to prime on every touch: each
  // swipe made every scene loaded so far play and pause, the one on screen
  // jumped a few frames ahead and back, and the further down the film the more
  // videos did it (Daniel, 02.11: it stuck from the camera scene on).
  private onTouch = () => {
    if (!this.url) return; // not here yet: the load primes it
    this.prime().then(() => {
      if (this.ready) window.removeEventListener("touchstart", this.onTouch);
    });
  };

  private onSeeked = () => {
    if (this.firstPaint === null) this.firstPaint = performance.now();
    this.seek(); // the newest target, if it moved while this seek ran
  };

  private seek() {
    const el = this.el;
    if (!this.ready || el.seeking || !el.duration) return;
    // a seek closer than half a frame paints the same frame: skip it
    if (Math.abs(el.currentTime - this.want) > 0.5 / this.fps) el.currentTime = this.want;
  }

  render(p: number): number {
    const d = this.el.duration;
    if (!d) return 0;
    // stop half a frame short of the end: seeking to the very end shows black on some Safari versions
    this.want = Math.min(p * d, d - 0.5 / this.fps);
    this.seek();
    const shown = this.presented ?? this.el.currentTime;
    return Math.min(1, shown / d);
  }

  bytes() {
    return this.size;
  }

  destroy() {
    this.dead = true;
    this.el.removeEventListener("seeked", this.onSeeked);
    window.removeEventListener("touchstart", this.onTouch);
    this.el.removeAttribute("src");
    this.el.load();
    if (this.url) URL.revokeObjectURL(this.url);
  }
}
