// One scroll film: picks the engine, runs one display loop, and ties the
// picture, the HTML layers and the monitor to the same progress.
//
//   engine "frames": image sequence on a canvas (phones get 720p frames)
//   engine "video":  one video file, currentTime driven by scroll
//   engine "hybrid": video on touch screens, frames on computers (the AC setup)
import { gsap } from "gsap";
import Lenis from "lenis";
import { AssetLoader } from "./AssetLoader";
import { FrameSequenceRenderer } from "./FrameSequenceRenderer";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { ScrollController } from "./ScrollController";
import { TimelineController } from "./TimelineController";
import { VideoScrubController } from "./VideoScrubController";
import type { Caption, EngineKind, FilmMedia, Renderer } from "./types";

export type LenisMode = "off" | "wheel" | "touch";

export type FilmOptions = {
  engine: EngineKind;
  media: FilmMedia;
  /** override the video file (relative to media.base) and its frame rate */
  videoFile?: { path: string; fps: number };
  smoothMs: number;
  blend: boolean;
  lenis: LenisMode;
  monitor: boolean;
  captions: Caption[];
  /** share of the section's scroll before the film starts (an opening gate); the film holds its first frame */
  lead?: number;
  /** a loader shared with other films on the page (they queue in one line, most urgent first) */
  loader?: AssetLoader;
  /** frames engine: fetch the whole scene in the background, not just a window around the playhead */
  prefetchAll?: boolean;
};

export class Film {
  private loader: AssetLoader;
  private ownLoader: boolean;
  private renderer: Renderer;
  private scroll: ScrollController;
  private timeline: TimelineController;
  private monitor: PerformanceMonitor;
  private lenis: Lenis | null = null;
  private lastTarget = -1;
  private drawAt = 0;
  readonly usesVideo: boolean;

  constructor(
    section: HTMLElement,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    private o: FilmOptions,
  ) {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const m = o.media;
    this.ownLoader = !o.loader;
    this.loader = o.loader ?? new AssetLoader();
    this.usesVideo = o.engine === "video" || (o.engine === "hybrid" && touch);

    if (o.lenis !== "off" && !reduced) {
      this.lenis = new Lenis({ lerp: 0.12, syncTouch: o.lenis === "touch", syncTouchLerp: 0.1 });
    }

    if (this.usesVideo) {
      const f = o.videoFile ?? { path: m.video, fps: m.videoFps };
      this.renderer = new VideoScrubController(video, `${m.base}/${f.path}`, f.fps, this.loader);
      canvas.style.display = "none";
      video.style.display = "block";
    } else {
      // shown before the renderer measures it: a hidden canvas measures 0x0
      video.style.display = "none";
      canvas.style.display = "block";
      const dir = `${m.base}/${touch ? m.framesPhone : m.framesDesk}`;
      this.renderer = new FrameSequenceRenderer(
        canvas,
        FrameSequenceRenderer.frameUrl(dir),
        m.frames,
        this.loader,
        o.blend,
        o.prefetchAll,
      );
    }

    this.scroll = new ScrollController(section, reduced ? 0 : o.smoothMs);
    this.timeline = new TimelineController(o.captions, reduced);
    this.monitor = new PerformanceMonitor(m.frames, o.monitor, (): Record<string, string> => {
      const r = this.renderer;
      return r instanceof FrameSequenceRenderer
        ? { "פריימים מפוענחים": `${r.decoded()}/${m.frames}`, "פריימים שירדו": `${r.fetched()}/${m.frames}` }
        : {};
    });

    window.addEventListener("resize", this.onResize);
    window.addEventListener("film:measure", this.onResize);
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(this.tick);
  }

  private onResize = () => {
    this.scroll.measure();
    if (this.renderer instanceof FrameSequenceRenderer) this.renderer.resize();
  };

  private tick = (time: number, dtMs: number) => {
    this.lenis?.raf(time * 1000);
    const raw = this.scroll.tick(dtMs);
    const lead = this.o.lead ?? 0;
    const film = (x: number) => (lead ? Math.min(1, Math.max(0, (x - lead) / (1 - lead))) : x);
    const p = film(raw);
    const shown = this.renderer.render(p, this.scroll.dir);
    // captions follow the picture actually on screen, not where it is headed
    this.timeline.update(this.usesVideo ? p : shown, raw);
    const now = performance.now();
    const target = film(this.scroll.target);
    const moving = this.scroll.target !== this.lastTarget || Math.abs(target - shown) > 0.5 / this.o.media.frames;
    this.lastTarget = this.scroll.target;
    this.monitor.sample(dtMs, { target, shown, moving }, now);
    if (now - this.drawAt > 250) {
      this.drawAt = now;
      this.monitor.draw(this.renderer.firstPaint, this.loader.loaded / 1e6);
    }
  };

  /** an extra element driven by the film progress, and the whole section's progress (side layers, gates) */
  track(fn: (p: number, raw: number) => void) {
    this.timeline.add(fn);
  }

  /** how urgent this film's download is: 0 on screen, 1 next, larger later */
  setRank(r: number) {
    if (this.renderer instanceof FrameSequenceRenderer) this.renderer.setRank(r);
  }

  /** how it went so far: times the picture stood still while scrolled, and the worst lag in frames */
  stats() {
    return { stalls: this.monitor.stalls, maxLag: Math.round(this.monitor.maxLag) };
  }

  resetStats() {
    this.monitor.reset();
  }

  destroy() {
    gsap.ticker.remove(this.tick);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("film:measure", this.onResize);
    this.lenis?.destroy();
    this.renderer.destroy();
    if (this.ownLoader) this.loader.destroy();
    this.monitor.destroy();
  }
}
