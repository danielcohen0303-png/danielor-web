// Image-sequence engine: numbered WebP frames painted on a canvas.
//
// Two layers of cache, both from the AC site (25.10):
//  - compressed bytes, fetched nearest-first in the direction of travel;
//  - decoded bitmaps, only a window of ±RADIUS frames around the playhead,
//    released with close(). A whole film decoded at 1080p is gigabytes.
// It never paints a frame from the wrong side of the playhead: when the
// visitor scrolls faster than frames decode, the picture holds the last
// frame on the way to the target instead of jumping back and forth.
//
// The bytes come through the AssetLoader's queue (this renderer is one of its
// owners). With prefetchAll the whole scene is fetched, not just a window, and
// rank says how urgent the scene is: 0 is the one on screen, 1 the next...
// A scene that is not on screen keeps only a few frames decoded around its
// playhead (its first frames, or its last ones once it has been passed), so it
// is ready the moment it takes over without holding a screenful of bitmaps.
import type { Renderer } from "./types";
import type { AssetLoader, FetchOwner } from "./AssetLoader";

const pad = (n: number) => String(n).padStart(4, "0");

const RADIUS = 30; // decoded frames kept each side of the playhead (scene on screen)
const RADIUS_IDLE = 2; // the same for a scene that is not on screen
const AHEAD = 240; // compressed frames fetched ahead, in the direction of travel
const BEHIND = 60;
const DECODE_SLOTS = 3;

export class FrameSequenceRenderer implements Renderer, FetchOwner {
  firstPaint: number | null = null;
  private ctx: CanvasRenderingContext2D;
  private blobs: (Blob | null)[];
  private bitmaps: (ImageBitmap | null)[];
  private index = new Map<string, number>();
  private decoding = new Set<number>();
  private head = 0;
  private dir: 1 | -1 = 1;
  private shown = -1; // index (with blend fraction) last painted
  private dead = false;
  private cw = 0;
  private ch = 0;
  private rank = 0;
  private ord: number[] | null = null; // fetch order, rebuilt when the playhead moves
  private cur = 0; // first entry of ord that may still be missing

  constructor(
    private canvas: HTMLCanvasElement,
    private url: (i: number) => string,
    private n: number,
    private loader: AssetLoader,
    /** mix the two neighbouring frames while moving (smoother at 24/s) */
    private blend = true,
    /** fetch every frame of the scene, not just a window around the playhead */
    private prefetchAll = false,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.blobs = Array(n).fill(null);
    this.bitmaps = Array(n).fill(null);
    for (let i = 0; i < n; i++) this.index.set(url(i), i);
    this.resize();
    this.loader.register(this);
    this.pump();
  }

  static frameUrl(dir: string) {
    return (i: number) => `${dir}/f${pad(i + 1)}.webp`;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);
    if (w === this.cw && h === this.ch) return;
    this.canvas.width = this.cw = w;
    this.canvas.height = this.ch = h;
    this.shown = -1; // repaint
  }

  /** how urgent this scene is: 0 on screen, 1 next, larger later */
  setRank(r: number) {
    if (r === this.rank) return;
    this.rank = r;
    this.ord = null;
    this.pump();
  }

  /** fetch order: the playhead, then outward, the direction of travel first */
  private order(): number[] {
    const out: number[] = [];
    const ahead = this.dir;
    const fwd = this.prefetchAll ? this.n : AHEAD;
    for (let d = 0; d <= Math.max(fwd, BEHIND); d++) {
      if (d <= fwd) out.push(this.head + ahead * d);
      if (d > 0 && d <= BEHIND) out.push(this.head - ahead * d);
    }
    // the rest of the scene behind the playhead last
    if (this.prefetchAll) for (let d = BEHIND + 1; d < this.n; d++) out.push(this.head - ahead * d);
    return out.filter((i) => i >= 0 && i < this.n);
  }

  /** for the loader: the most urgent frame still missing */
  next() {
    if (this.dead) return null;
    if (!this.ord) {
      this.ord = this.order();
      this.cur = 0;
    }
    while (this.cur < this.ord.length) {
      const i = this.ord[this.cur];
      const u = this.url(i);
      if (this.blobs[i] || this.loader.pending(u) || this.loader.failed(u)) {
        this.cur++;
        continue;
      }
      return { url: u, prio: this.rank * 1e6 + this.cur };
    }
    return null;
  }

  got(url: string, b: Blob) {
    if (this.dead) return;
    const i = this.index.get(url);
    if (i === undefined) return;
    this.blobs[i] = b;
    this.pump();
  }

  private pump() {
    if (this.dead) return;
    // bytes: through the loader's queue
    this.loader.dispatch();
    // decode: a window around the playhead, nearest first
    const radius = this.rank === 0 ? RADIUS : RADIUS_IDLE;
    for (let d = 0; d <= radius && this.decoding.size < DECODE_SLOTS; d++) {
      for (const i of [this.head + this.dir * d, this.head - this.dir * d]) {
        if (i < 0 || i >= this.n || this.bitmaps[i] || this.decoding.has(i) || !this.blobs[i]) continue;
        if (this.decoding.size >= DECODE_SLOTS) break;
        this.decoding.add(i);
        createImageBitmap(this.blobs[i]!)
          .then((bm) => {
            this.decoding.delete(i);
            const keep = this.rank === 0 ? RADIUS + 4 : RADIUS_IDLE + 1;
            if (this.dead || Math.abs(i - this.head) > keep) return bm.close();
            this.bitmaps[i] = bm;
            this.pump();
          })
          .catch(() => this.decoding.delete(i));
      }
    }
    // release what fell out of the window
    const keep = this.rank === 0 ? RADIUS + 4 : RADIUS_IDLE + 1;
    for (let i = 0; i < this.n; i++) {
      if (this.bitmaps[i] && Math.abs(i - this.head) > keep && i !== 0) {
        this.bitmaps[i]!.close();
        this.bitmaps[i] = null;
      }
    }
  }

  private paint(bm: ImageBitmap, alpha = 1) {
    // cover-fit the frame into the canvas
    const s = Math.max(this.cw / bm.width, this.ch / bm.height);
    const w = bm.width * s;
    const h = bm.height * s;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(bm, (this.cw - w) / 2, (this.ch - h) / 2, w, h);
    this.ctx.globalAlpha = 1;
  }

  render(p: number, dir: 1 | -1): number {
    if (!this.cw) this.resize();
    const f = p * (this.n - 1);
    const target = Math.round(f);
    if (target !== this.head || dir !== this.dir) {
      this.head = target;
      this.dir = dir;
      this.ord = null;
      this.pump();
    }
    // the decoded frame nearest the target, only from between what is shown
    // and the target (never back across it)
    let pick = -1;
    const from = this.shown < 0 ? target : Math.round(this.shown);
    const lo = Math.min(from, target);
    const hi = Math.max(from, target);
    for (let i = target; i >= lo && i <= hi; i += target >= from ? -1 : 1) {
      if (this.bitmaps[i]) {
        pick = i;
        break;
      }
    }
    if (pick < 0) {
      // nothing on the way: nearest decoded anywhere, else keep the picture
      for (let d = 0; d < this.n && pick < 0; d++) {
        if (this.bitmaps[target - d]) pick = target - d;
        else if (this.bitmaps[target + d]) pick = target + d;
      }
      if (pick < 0) return this.shown < 0 ? 0 : this.shown / (this.n - 1);
    }
    // blend between the two frames around f when both are ready
    let shown = pick;
    const a = Math.floor(f);
    const b = Math.min(a + 1, this.n - 1);
    const frac = f - a;
    const canBlend =
      this.blend && (pick === a || pick === b) && this.bitmaps[a] && this.bitmaps[b] && frac > 0.02 && frac < 0.98;
    if (canBlend) shown = f;
    if (Math.abs(shown - this.shown) < 0.01) return shown / (this.n - 1);
    if (canBlend) {
      this.paint(this.bitmaps[a]!);
      this.paint(this.bitmaps[b]!, frac);
    } else {
      this.paint(this.bitmaps[pick]!);
    }
    this.shown = shown;
    if (this.firstPaint === null) this.firstPaint = performance.now();
    return shown / (this.n - 1);
  }

  /** frames ready (decoded) right now, for the monitor */
  decoded() {
    return this.bitmaps.filter(Boolean).length;
  }

  /** frames downloaded so far */
  fetched() {
    return this.blobs.filter(Boolean).length;
  }

  bytes() {
    return this.blobs.reduce((s, b) => s + (b?.size ?? 0), 0);
  }

  destroy() {
    this.dead = true;
    this.loader.unregister(this);
    this.bitmaps.forEach((b) => b?.close());
    this.bitmaps = [];
    this.blobs = [];
  }
}
