// Image-sequence engine: numbered WebP frames painted on a canvas.
//
// Two layers of cache, both from the AC site (25.10):
//  - compressed bytes, fetched nearest-first in the direction of travel;
//  - decoded bitmaps, only a window of ±RADIUS frames around the playhead,
//    released with close(). A whole film decoded at 1080p is gigabytes.
// It never paints a frame from the wrong side of the playhead: when the
// visitor scrolls faster than frames decode, the picture holds the last
// frame on the way to the target instead of jumping back and forth.
import type { Renderer } from "./types";
import type { AssetLoader } from "./AssetLoader";

const pad = (n: number) => String(n).padStart(4, "0");

const RADIUS = 30; // decoded frames kept each side of the playhead
const AHEAD = 240; // compressed frames fetched ahead, in the direction of travel
const BEHIND = 60;
const DECODE_SLOTS = 3;

export class FrameSequenceRenderer implements Renderer {
  firstPaint: number | null = null;
  private ctx: CanvasRenderingContext2D;
  private blobs: (Blob | null)[];
  private bitmaps: (ImageBitmap | null)[];
  private decoding = new Set<number>();
  private head = 0;
  private dir: 1 | -1 = 1;
  private shown = -1; // index (with blend fraction) last painted
  private dead = false;
  private cw = 0;
  private ch = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private url: (i: number) => string,
    private n: number,
    private loader: AssetLoader,
    /** mix the two neighbouring frames while moving (smoother at 24/s) */
    private blend = true,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.blobs = Array(n).fill(null);
    this.bitmaps = Array(n).fill(null);
    this.resize();
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

  /** fetch order: the playhead, then outward, the direction of travel first */
  private order(): number[] {
    const out: number[] = [];
    const ahead = this.dir;
    for (let d = 0; d <= Math.max(AHEAD, BEHIND); d++) {
      if (d <= AHEAD) out.push(this.head + ahead * d);
      if (d > 0 && d <= BEHIND) out.push(this.head - ahead * d);
    }
    return out.filter((i) => i >= 0 && i < this.n);
  }

  private pump() {
    if (this.dead) return;
    // bytes
    for (const i of this.order()) {
      if (this.blobs[i] || this.loader.pending(this.url(i))) continue;
      if (!this.loader.hasSlot()) break;
      this.loader
        .blob(this.url(i))
        .then((b) => {
          if (this.dead) return;
          this.blobs[i] = b;
          this.pump();
        })
        .catch(() => {});
    }
    // decode: a window around the playhead, nearest first
    for (let d = 0; d <= RADIUS && this.decoding.size < DECODE_SLOTS; d++) {
      for (const i of [this.head + this.dir * d, this.head - this.dir * d]) {
        if (i < 0 || i >= this.n || this.bitmaps[i] || this.decoding.has(i) || !this.blobs[i]) continue;
        if (this.decoding.size >= DECODE_SLOTS) break;
        this.decoding.add(i);
        createImageBitmap(this.blobs[i]!)
          .then((bm) => {
            this.decoding.delete(i);
            if (this.dead || Math.abs(i - this.head) > RADIUS + 4) return bm.close();
            this.bitmaps[i] = bm;
            this.pump();
          })
          .catch(() => this.decoding.delete(i));
      }
    }
    // release what fell out of the window
    for (let i = 0; i < this.n; i++) {
      if (this.bitmaps[i] && Math.abs(i - this.head) > RADIUS + 4 && i !== 0) {
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

  bytes() {
    return this.blobs.reduce((s, b) => s + (b?.size ?? 0), 0);
  }

  destroy() {
    this.dead = true;
    this.bitmaps.forEach((b) => b?.close());
    this.bitmaps = [];
    this.blobs = [];
  }
}
