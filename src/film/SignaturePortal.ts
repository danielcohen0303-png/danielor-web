// The opening gate: a signature over the film, which on scroll turns into
// windows onto the film and then swallows the camera.
//
// Daniel (28.10): the site must say "Adele" before anything else, like the
// AC logo whose bars open as windows into the film. Here the letters are the
// windows: the canvas is a sheet with the words cut out of it, lying over the
// film. Two looks:
//   metal  rose-gold letters on an ivory sheet
//   steam  the sheet is a photo of a fogged mirror, and the words are written
//          in its steam with a finger; as they open, the face behind the
//          mirror shows through them (Daniel's idea, 28.10)
//   fog    the whole screen is fogged glass (the film's first frame, blurred
//          and beaded); writing clears it, so the film shows sharp through
//          every stroke from the first touch, with a wet rim and a few drips
//          running down (Daniel, 29.10: "where there is writing the mirror
//          becomes clear")
//
//   writing  time-based, on load: written left to right, the main word first
//   d 0..A   the letters' fill fades and they become windows onto the film
//   d A..1   the sheet scales up around a point inside a thick stroke until
//            that stroke covers the screen
//
// exit "dust" (the door, Daniel 29.10): no windows and no dive. The words are
// rose gold on a photo of the clinic's door; on scroll a sweep runs across
// them left to right and every bit of gold it passes lifts off as dust and
// drifts away, until only the door is left. The film starts on that same
// door, so the hand-off does not show.
//
// The cut-out is a pre-rendered bitmap scaled with drawImage, not fillText
// at 80x (iOS would rasterise a glyph thousands of pixels high every frame).
// At high zoom its edge softens, which reads as a lens diving in.

const IVORY = "#fbf7f5";
const WINDOW_AT = 0.22; // share of the dive spent opening the windows
const WRITE_MS = 1900;
const SUB = 0.4; // the second line's size, relative to the main word

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const easeIn = (x: number) => x * x * x;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export type PortalOptions = {
  look?: "metal" | "steam" | "fog";
  /** a second, smaller line under the word, written after it */
  sub?: string;
  /** steam: the photo the words are written on (the fogged mirror) */
  sheet?: string;
  /** where the words sit, as a share of the screen, and how wide the main word may be */
  center?: { x: number; y: number };
  width?: number;
  /** how the gate leaves: the letters open as windows and the camera dives (default), or they blow away as dust */
  exit?: "windows" | "dust";
  /** the words float in the air over the brand's blush-to-ivory light, rising and settling gently until the dive */
  float?: boolean;
  /** dive through this letter of the main word (its index), not wherever the stroke is thickest;
   *  Daniel, 30.10: through the "d", so the name comes out at the screen the same on every phone */
  diveLetter?: number;
};

type Line = { text: string; x: number; base: number; w: number; fs: number };
/** a speck of the gold: where it sits in the word, when the sweep reaches it, and where it drifts */
type Speck = { x: number; y: number; at: number; vx: number; vy: number; r: number; tone: number; tw: number };

// rose gold on a white door: warm copper-pinks dark enough to read on white, a few bright glints
const DUST_TONES = ["#c98a7c", "#e2a99a", "#b76e79", "#f3cdbf", "#d4a373", "#fff3ea"];

export class SignaturePortal {
  private ctx: CanvasRenderingContext2D;
  private mask: HTMLCanvasElement; // the words, white on transparent, at twice screen size
  private maskOrigin: [number, number, number] = [0, 0, 1];
  private sheet: HTMLImageElement | null = null;
  private cw = 0;
  private ch = 0;
  private dpr = 1;
  private lines: Line[] = [];
  private box = { x: 0, y: 0, w: 0, h: 0 }; // both lines' box on screen
  private focal = { x: 0, y: 0, r: 1 }; // a point deep inside a stroke, on screen
  private t0 = performance.now();
  private last = "";
  private ready = false;
  private dead = false;
  private look: "metal" | "steam" | "fog";
  private written = document.createElement("canvas"); // fog: the mask, cut to how far the finger has got
  private drips: { x: number; y: number; len: number; delay: number }[] = [];
  private specks: Speck[] = [];
  /** called once the font has loaded and the words are measured */
  onReady?: () => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private word: string,
    private family: string,
    private reduced = false,
    private o: PortalOptions = {},
  ) {
    this.look = o.look ?? "metal";
    this.ctx = canvas.getContext("2d")!;
    // the page is right-to-left, and a canvas inherits it: "Adele" is written left to right
    canvas.dir = "ltr";
    this.mask = document.createElement("canvas");
    const sheet = o.sheet
      ? new Promise<void>((res) => {
          const im = new Image();
          im.onload = () => {
            this.sheet = im;
            res();
          };
          im.onerror = () => res();
          im.src = o.sheet!;
        })
      : Promise.resolve();
    Promise.all([document.fonts.load(`100px ${family}`), sheet]).then(() => {
      if (this.dead) return; // the page moved on (another opening was picked) before the font arrived
      this.ready = true;
      this.t0 = performance.now();
      this.resize();
      this.onReady?.();
    });
  }

  private font(px: number) {
    return `${px}px ${this.family}`;
  }

  destroy() {
    this.dead = true;
    this.ready = false;
  }

  resize() {
    if (!this.ready) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = this.cw = Math.round(r.width * this.dpr);
    this.canvas.height = this.ch = Math.round(r.height * this.dpr);
    if (!this.cw || !this.ch) return; // not laid out yet
    const c = this.ctx;
    c.direction = "ltr";
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    const cx = (this.o.center?.x ?? 0.5) * this.cw;
    const cy = (this.o.center?.y ?? 0.42) * this.ch;
    // the main word fills its width share, never taller than a fifth of the screen
    c.font = this.font(100);
    const w100 = c.measureText(this.word).width;
    const fs = Math.min((this.cw * (this.o.width ?? 0.8) * 100) / w100, this.ch * 0.2);
    const texts: [string, number][] = [[this.word, fs]];
    if (this.o.sub) texts.push([this.o.sub, fs * SUB]);
    const m = texts.map(([t, size]) => {
      c.font = this.font(size);
      const mm = c.measureText(t);
      return { t, size, w: mm.width, asc: mm.actualBoundingBoxAscent, desc: mm.actualBoundingBoxDescent };
    });
    const gap = fs * 0.08;
    const h = m.reduce((a, l) => a + l.asc + l.desc, 0) + gap * (m.length - 1);
    let y = cy - h / 2;
    this.lines = m.map((l) => {
      const line = { text: l.t, x: cx - l.w / 2, base: y + l.asc, w: l.w, fs: l.size };
      y += l.asc + l.desc + gap;
      return line;
    });
    const left = Math.min(...this.lines.map((l) => l.x));
    const right = Math.max(...this.lines.map((l) => l.x + l.w));
    this.box = { x: left, y: cy - h / 2, w: right - left, h };
    this.buildMask(fs);
    this.last = "";
  }

  /** the words as a white bitmap, and the point in the main word furthest from any edge */
  private buildMask(fs: number) {
    const k = 2; // drawn twice as large as on screen, so the dive stays sharp longer
    const pad = fs * 0.3;
    const ox = this.box.x - pad;
    const oy = this.box.y - pad;
    const mw = Math.ceil((this.box.w + pad * 2) * k);
    const mh = Math.ceil((this.box.h + pad * 2) * k);
    if (mw < 1 || mh < 1) return;
    this.mask.width = mw;
    this.mask.height = mh;
    const m = this.mask.getContext("2d", { willReadFrequently: true })!;
    m.direction = "ltr";
    m.textAlign = "left";
    m.fillStyle = "#fff";
    for (const l of this.lines) {
      m.font = this.font(l.fs * k);
      m.fillText(l.text, (l.x - ox) * k, (l.base - oy) * k);
    }
    // thickest stroke of the main word (or of one chosen letter of it): for
    // each inside pixel on a grid, the distance to the nearest outside pixel
    // along 16 rays; nearest the word's middle wins ties
    const main = this.lines[0];
    let xFrom = 0;
    let xTo = mw;
    if (this.o.diveLetter !== undefined) {
      m.font = this.font(main.fs * k);
      const i = this.o.diveLetter;
      const a = m.measureText(main.text.slice(0, i)).width;
      const b = m.measureText(main.text.slice(0, i + 1)).width;
      xFrom = Math.floor((main.x - ox) * k + a);
      xTo = Math.ceil((main.x - ox) * k + b);
    }
    const top = Math.floor((main.base - main.fs - oy) * k);
    const bottom = Math.ceil((main.base + main.fs * 0.4 - oy) * k);
    const data = m.getImageData(0, 0, mw, mh).data;
    const inside = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < mw && y < mh && data[(Math.round(y) * mw + Math.round(x)) * 4 + 3] > 160;
    let best = { x: mw / 2, y: mh / 2, r: 1 };
    const step = Math.max(2, Math.round(mw / 220));
    const rays = Array.from({ length: 16 }, (_, i) => [Math.cos((i * Math.PI) / 8), Math.sin((i * Math.PI) / 8)]);
    for (let y = Math.max(0, top); y < Math.min(mh, bottom); y += step)
      for (let x = xFrom; x < xTo; x += step) {
        if (!inside(x, y)) continue;
        let r = 1;
        while (r < 200 && rays.every(([dx, dy]) => inside(x + dx * r, y + dy * r))) r++;
        const mid = Math.abs(x - mw / 2) / mw;
        if (r > best.r + 0.5 || (r >= best.r - 0.5 && mid < Math.abs(best.x - mw / 2) / mw)) best = { x, y, r };
      }
    this.focal = { x: ox + best.x / k, y: oy + best.y / k, r: best.r / k };
    this.maskOrigin = [ox, oy, k];
    // fog: water gathers at the bottom of a few strokes and runs down
    this.drips = [];
    const cols = 26;
    const rnd = (n: number) => ((Math.sin(n * 91.7) + 1) / 2) % 1;
    for (let i = 0; i < cols; i++) {
      const x = Math.round(((i + 0.5) / cols) * mw);
      let low = -1;
      for (let y = mh - 1; y >= 0; y--)
        if (inside(x, y)) {
          low = y;
          break;
        }
      if (low < 0 || rnd(i) > 0.32) continue;
      this.drips.push({
        x: ox + x / k,
        y: oy + low / k,
        len: (18 + rnd(i + 7) * 70) * this.dpr,
        delay: 300 + rnd(i + 3) * 2200,
      });
    }
    // dust: a speck on every few pixels of gold, about 1600 in all
    this.specks = [];
    if (this.o.exit === "dust") {
      let area = 0;
      for (let i = 3; i < data.length; i += 16) if (data[i] > 160) area++;
      const g = Math.max(2, Math.round(Math.sqrt((area * 4) / 1600)));
      let n = 0;
      for (let y = 0; y < mh; y += g)
        for (let x = 0; x < mw; x += g) {
          if (!inside(x, y)) continue;
          const r = (s: number) => ((Math.sin((n + 1) * s) * 43758.5453) % 1 + 1) % 1;
          const sx = ox + x / k;
          // the sweep reaches it by its place across the words, a little ragged
          const across = (sx - this.box.x) / Math.max(1, this.box.w);
          this.specks.push({
            x: sx,
            y: oy + y / k,
            at: clamp01(across * 0.78 + r(12.9) * 0.14),
            // up and to the right, like breath on gold leaf
            vx: (0.15 + r(78.2) * 0.55) * fs * 1.6,
            vy: -(0.35 + r(39.4) * 0.9) * fs * 1.6,
            r: (0.8 + r(93.1) * 1.6) * this.dpr * Math.max(1, fs / 120),
            tone: Math.floor(r(27.7) * DUST_TONES.length),
            tw: r(55.5) * Math.PI * 2,
          });
          n++;
        }
    }
  }

  /**
   * exit "dust": the gold blows off the door. `d` 0..1 across the gate's
   * scroll: the sweep crosses the words from left to right (letters behind it
   * are gone), and each speck it frees drifts up and out, glinting, and fades.
   */
  private dust(d: number, writing: number, now: number) {
    const c = this.ctx;
    const sweep = clamp01(d / 0.75); // the sweep's place across the words (with a soft edge)
    // what is left of the letters: clipped to the right of the sweep
    if (sweep < 1) {
      c.save();
      const edge = this.box.x + this.box.w * (sweep * 1.12 - 0.06);
      c.beginPath();
      c.rect(edge, 0, this.cw - edge, this.ch);
      c.clip();
      this.plate(1, writing, now);
      c.restore();
    }
    // the specks: born when the sweep passes, then 0.35 of the scroll to drift away
    c.save();
    for (const s of this.specks) {
      const a = (d - s.at * 0.75) / 0.35;
      if (a <= 0 || a >= 1) continue;
      const e = 1 - Math.pow(1 - a, 2); // fast off the door, then floating
      const x = s.x + s.vx * e + Math.sin(s.tw + a * 6) * s.r * 3;
      const y = s.y + s.vy * e;
      const glint = 0.65 + 0.35 * Math.sin(s.tw + a * 18);
      c.globalAlpha = Math.pow(1 - a, 1.4) * glint;
      c.fillStyle = DUST_TONES[s.tone];
      c.beginPath();
      c.arc(x, y, s.r * (1 - a * 0.5), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  /** fog: the mask, with what the finger has not reached yet rubbed out again (a soft edge) */
  private writtenMask(writing: number): HTMLCanvasElement {
    if (writing >= 1) return this.mask;
    const [ox, oy, k] = this.maskOrigin;
    const w = this.written;
    if (w.width !== this.mask.width || w.height !== this.mask.height) {
      w.width = this.mask.width;
      w.height = this.mask.height;
    }
    const c = w.getContext("2d")!;
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, w.width, w.height);
    c.drawImage(this.mask, 0, 0);
    c.globalCompositeOperation = "destination-out";
    this.lines.forEach((l, i) => {
      const edge = (l.x + l.w * this.written_(writing, i) * 1.08 - ox) * k;
      const feather = l.fs * 0.35 * k;
      const top = (l.base - l.fs * 1.05 - oy) * k;
      const h = l.fs * 1.6 * k;
      const g = c.createLinearGradient(edge - feather, 0, edge, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      c.fillStyle = g;
      c.fillRect(edge - feather, top, feather, h);
      c.fillStyle = "#000";
      c.fillRect(edge, top, w.width - edge, h);
    });
    return w;
  }

  /** each line's share of the writing: the main word first, then the second line */
  private written_(writing: number, i: number) {
    if (this.lines.length < 2) return clamp01(writing);
    return i === 0 ? clamp01(writing / 0.7) : clamp01((writing - 0.62) / 0.38);
  }

  /** draw every line, clipped to how much of it has been written */
  private eachLine(writing: number, draw: (l: Line) => void) {
    const c = this.ctx;
    this.lines.forEach((l, i) => {
      const w = this.written_(writing, i);
      if (w <= 0) return;
      c.save();
      if (w < 1) {
        c.beginPath();
        c.rect(0, 0, l.x + l.w * w * 1.08, this.ch);
        c.clip();
      }
      c.font = this.font(l.fs);
      draw(l);
      c.restore();
    });
  }

  /**
   * The door's sign: rose-gold letters standing off the door. A solid edge
   * (the metal's thickness, stacked down and to the right), the shadow it
   * casts on the door, then a polished face with a light that sweeps across.
   */
  private plate(alpha: number, writing: number, now: number) {
    const c = this.ctx;
    const { x, y, w, h } = this.box;
    const sweep = this.reduced ? 0.5 : ((now - this.t0) / 3600) % 1.7;
    const face = c.createLinearGradient(x, y, x + w * 0.6, y + h);
    const onyx = !!this.o.float; // the floating title: dark polished stone with a rose-gold edge
    const stops: [number, string][] = onyx
      ? [[0, "#140c0b"], [sweep - 0.3, "#241614"], [sweep - 0.05, "#5d3c34"], [sweep, "#f0cdbd"], [sweep + 0.05, "#5a3a32"], [sweep + 0.3, "#1d1210"], [1, "#0f0908"]]
      : [[0, "#9d5f5c"], [sweep - 0.3, "#c4877a"], [sweep - 0.08, "#ecc1b0"], [sweep, "#fff0e6"], [sweep + 0.08, "#e3ae98"], [sweep + 0.3, "#b97767"], [1, "#8e5150"]];
    for (const [at, col] of stops) face.addColorStop(clamp01(at), col);
    this.eachLine(writing, (l) => {
      const depth = Math.max(2, Math.round(l.fs / (onyx ? 60 : 26))); // thickness in px, bigger letters are deeper
      const step = 0.75 * this.dpr;
      c.globalAlpha = alpha;
      // the shadow the sign casts on the door
      c.shadowColor = "rgba(70,40,35,0.32)";
      c.shadowBlur = l.fs * 0.14;
      c.shadowOffsetX = l.fs * 0.03;
      c.shadowOffsetY = l.fs * 0.07;
      c.fillStyle = "#6f3b3c";
      c.fillText(l.text, l.x + depth * step, l.base + depth * step);
      c.shadowColor = "transparent";
      // the edge: copper, darker toward the back
      for (let i = depth; i >= 1; i--) {
        const t = i / depth;
        c.fillStyle = onyx
          ? `rgb(${Math.round(176 - 60 * t)},${Math.round(120 - 45 * t)},${Math.round(104 - 40 * t)})` // a thin rose-gold side
          : `rgb(${Math.round(150 - 50 * t)},${Math.round(88 - 35 * t)},${Math.round(80 - 30 * t)})`;
        c.fillText(l.text, l.x + i * step, l.base + i * step);
      }
      // the face
      c.fillStyle = face;
      c.fillText(l.text, l.x, l.base);
      // a fine bright bevel up and to the left (on the onyx: a rose-gold rim all round)
      c.globalAlpha = alpha * (onyx ? 0.9 : 0.7);
      c.lineWidth = Math.max(0.6, l.fs / (onyx ? 160 : 170));
      c.strokeStyle = onyx ? "#d7a593" : "#fff6ef";
      c.strokeText(l.text, l.x - c.lineWidth * 0.5, l.base - c.lineWidth * 0.5);
    });
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
  }

  private metal(alpha: number, writing: number, now: number) {
    const c = this.ctx;
    const { x, y, w, h } = this.box;
    // rose gold, with a highlight that sweeps across every 4 s
    const sweep = this.reduced ? 0.5 : ((now - this.t0) / 4000) % 1.6;
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#9c5a71");
    g.addColorStop(clamp01(sweep - 0.25), "#c07d92");
    g.addColorStop(clamp01(sweep - 0.05), "#f3d6df");
    g.addColorStop(clamp01(sweep), "#fff4f7");
    g.addColorStop(clamp01(sweep + 0.05), "#e7b8c6");
    g.addColorStop(clamp01(sweep + 0.25), "#b46c84");
    g.addColorStop(1, "#8f4f66");
    this.eachLine(writing, (l) => {
      c.globalAlpha = alpha;
      // depth: a soft plum shadow under the letters
      c.shadowColor = "rgba(55,38,48,0.28)";
      c.shadowBlur = 10 * this.dpr;
      c.shadowOffsetY = 4 * this.dpr;
      c.fillStyle = "#8f4f66";
      c.fillText(l.text, l.x, l.base);
      // the glow
      c.shadowColor = "rgba(222,150,175,0.75)";
      c.shadowBlur = 28 * this.dpr;
      c.shadowOffsetY = 0;
      c.fillStyle = g;
      c.fillText(l.text, l.x, l.base);
      // a bevel: a thin light edge up and to the left
      c.shadowColor = "transparent";
      c.globalAlpha = alpha * 0.55;
      c.lineWidth = Math.max(0.6, l.fs / 160);
      c.strokeStyle = "#fff";
      c.strokeText(l.text, l.x - c.lineWidth * 0.6, l.base - c.lineWidth * 0.6);
    });
  }

  /**
   * A finger through the fog: the wiped strokes are clearer glass, so a touch
   * darker than the fog around them, with a thin bright rim of beaded water.
   */
  private steam(alpha: number, writing: number) {
    const c = this.ctx;
    this.eachLine(writing, (l) => {
      c.globalAlpha = alpha;
      c.shadowColor = "rgba(255,246,249,0.8)";
      c.shadowBlur = 2.5 * this.dpr;
      c.shadowOffsetY = -1 * this.dpr;
      c.fillStyle = "rgba(72,42,55,0.34)";
      c.fillText(l.text, l.x, l.base);
      c.shadowColor = "transparent";
      c.lineWidth = Math.max(0.8, l.fs / 170);
      c.strokeStyle = "rgba(255,255,255,0.36)";
      c.strokeText(l.text, l.x, l.base);
    });
  }

  /** fog: the strokes are clear glass from the first touch; on scroll the camera dives through */
  private fog(T: [number, number, number, number, number, number], writing: number, open: number, z: number, now: number) {
    const c = this.ctx;
    const [ox, oy, k] = this.maskOrigin;
    c.save();
    c.setTransform(...T);
    c.globalCompositeOperation = "destination-out";
    const m = this.writtenMask(writing);
    c.drawImage(m, ox, oy, m.width / k, m.height / k);
    // the drips: thin clear trails with a bead at the end
    const since = now - this.t0 - WRITE_MS;
    for (const d of this.drips) {
      const t = (since - d.delay) / 2600;
      if (t <= 0) continue;
      const len = d.len * (1 - Math.pow(1 - Math.min(1, t), 3));
      c.lineCap = "round";
      c.lineWidth = 1.6 * this.dpr;
      c.strokeStyle = "rgba(0,0,0,0.85)";
      c.beginPath();
      c.moveTo(d.x, d.y);
      c.lineTo(d.x, d.y + len);
      c.stroke();
      c.beginPath();
      c.arc(d.x, d.y + len, 2.2 * this.dpr, 0, Math.PI * 2);
      c.fillStyle = "rgba(0,0,0,0.9)";
      c.fill();
    }
    c.restore();
    // the wet rim along each stroke, gone as the camera starts to dive
    const rim = (1 - open) * (z < 0.02 ? 1 : 0);
    if (rim > 0) {
      this.eachLine(writing, (l) => {
        c.globalAlpha = rim * 0.55;
        c.shadowColor = "rgba(255,255,255,0.9)";
        c.shadowBlur = 3 * this.dpr;
        c.lineWidth = Math.max(0.8, l.fs / 150);
        c.strokeStyle = "rgba(255,255,255,0.55)";
        c.strokeText(l.text, l.x, l.base);
      });
    }
  }

  /**
   * The brand's light: ivory, warmed by a blush glow behind the words, and a
   * soft shadow on the "floor" under them that tightens as they rise.
   */
  private brandLight(bob: number) {
    const c = this.ctx;
    const { x, y, w, h } = this.box;
    c.fillStyle = IVORY;
    c.fillRect(0, 0, this.cw, this.ch);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(this.cw, this.ch) * 0.75);
    glow.addColorStop(0, "rgba(240,200,210,0.85)");
    glow.addColorStop(0.45, "rgba(246,222,228,0.55)");
    glow.addColorStop(1, "rgba(251,247,245,0)");
    c.fillStyle = glow;
    c.fillRect(0, 0, this.cw, this.ch);
    // the shadow below: the higher the words, the softer and fainter
    const lift = -bob / (this.lines[0].fs * 0.045 || 1); // -1 low .. 1 high
    const sy = y + h + this.lines[0].fs * 0.55;
    const rx = w * (0.42 - 0.04 * lift);
    c.save();
    c.translate(cx, sy);
    c.scale(1, 0.12);
    const sh = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    sh.addColorStop(0, `rgba(120,70,80,${(0.22 - 0.06 * lift).toFixed(3)})`);
    sh.addColorStop(1, "rgba(120,70,80,0)");
    c.fillStyle = sh;
    c.beginPath();
    c.arc(0, 0, rx, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  /** the photo under the words, cover-fitted like the film */
  private drawSheet() {
    const im = this.sheet!;
    const s = Math.max(this.cw / im.naturalWidth, this.ch / im.naturalHeight);
    const w = im.naturalWidth * s;
    const h = im.naturalHeight * s;
    this.ctx.drawImage(im, (this.cw - w) / 2, (this.ch - h) / 2, w, h);
  }

  /** bottom of the written words (descenders included), in CSS pixels, for the lines placed under them */
  bottomCss() {
    return (this.box.y + this.box.h) / this.dpr;
  }

  /** dive: 0 = the signature, 1 = the film fully open. Returns false once the gate is gone. */
  render(dive: number, now = performance.now()): boolean {
    if (!this.ready || !this.cw) return true;
    const writing = this.reduced ? 1 : Math.min(1, (now - this.t0) / WRITE_MS);
    const idle = dive <= 0;
    // nothing moves once written and still: skip the frame (the metal's sweep keeps going while idle)
    const dripping = this.look === "fog" && now - this.t0 < WRITE_MS + 3200;
    const key = `${dive.toFixed(4)}|${writing.toFixed(3)}|${dripping ? Math.floor(now / 16) : 0}`;
    if (!(idle && this.look === "metal") && key === this.last) return dive < 1;
    this.last = key;

    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.cw, this.ch);
    if (dive >= 1) {
      this.canvas.style.visibility = "hidden";
      return false;
    }
    this.canvas.style.visibility = "visible";
    // the page covers the canvas with the sheet's look until this first frame
    // (so the film never flashes before the font and photo arrive); from now
    // on the canvas draws the sheet itself, and its windows must stay clear
    this.canvas.style.background = "transparent";

    if (this.o.exit === "dust") {
      // the door stays still; only the gold leaves it
      if (this.sheet) this.drawSheet();
      else {
        c.fillStyle = IVORY;
        c.fillRect(0, 0, this.cw, this.ch);
      }
      this.dust(dive, writing, now);
      return true;
    }

    const open = ease(dive / WINDOW_AT); // windows opening
    const z = easeIn(Math.max(0, (dive - WINDOW_AT) / (1 - WINDOW_AT))); // zoom
    // floating: a slow breath up and down, settling to rest as the windows open
    const bob =
      this.o.float && !this.reduced
        ? Math.sin((now - this.t0) / 1300) * this.lines[0].fs * 0.045 * (1 - ease(dive / 0.06))
        : 0;
    // the scale at which the focal stroke covers the whole screen
    const sMax = (Math.hypot(this.cw, this.ch) / Math.max(1, this.focal.r)) * 0.75;
    const s = Math.exp(Math.log(sMax) * z);
    // the focal point travels to the centre of the screen as the camera dives
    const fx = this.focal.x + (this.cw / 2 - this.focal.x) * Math.min(1, z * 3);
    const fy = this.focal.y + (this.ch / 2 - this.focal.y) * Math.min(1, z * 3);
    // floating title: the camera banks as it flies into the letter (up to ~14 degrees)
    const a = this.o.float && !this.reduced ? -0.24 * z : 0;
    const sc = s * Math.cos(a);
    const sn = s * Math.sin(a);
    const T: [number, number, number, number, number, number] = [
      sc, sn, -sn, sc,
      fx - (sc * this.focal.x - sn * this.focal.y),
      fy - (sn * this.focal.x + sc * this.focal.y) + bob,
    ];

    // the sheet: ivory, the brand's light, or the mirror photo (which zooms with the dive)
    if (this.sheet) {
      c.save();
      c.setTransform(...T);
      this.drawSheet();
      c.restore();
    } else if (this.o.float) {
      this.brandLight(bob);
    } else {
      c.fillStyle = IVORY;
      c.fillRect(0, 0, this.cw, this.ch);
    }
    if (this.look === "fog") {
      this.fog(T, writing, open, z, now);
      return true;
    }
    // the words cut out of it once the windows start opening
    if (open > 0) {
      const [ox, oy, k] = this.maskOrigin;
      c.save();
      c.globalCompositeOperation = "destination-out";
      c.globalAlpha = open;
      c.setTransform(...T);
      c.drawImage(this.mask, ox, oy, this.mask.width / k, this.mask.height / k);
      c.restore();
    }
    // the written words on top, fading as the windows open
    if (open < 1) {
      c.save();
      c.translate(0, bob);
      if (this.look === "steam") this.steam(1 - open, writing);
      else if (this.o.float) this.plate(1 - open, writing, now);
      else this.metal(1 - open, writing, now);
      c.restore();
    }
    // a hairline around each window while they are open but small
    if (open > 0 && z < 0.08) {
      this.eachLine(1, (l) => {
        c.globalAlpha = open * (1 - z / 0.08) * (this.look === "steam" ? 0.5 : 0.7);
        c.lineWidth = Math.max(1, l.fs / 120);
        c.strokeStyle = this.look === "steam" ? "rgba(255,255,255,0.8)" : "#c07d92";
        c.strokeText(l.text, l.x, l.base);
      });
    }
    return true;
  }
}
