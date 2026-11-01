// Rose-gold dust and soft bokeh that rise with the ribbon. Drawn on its own
// canvas over the film; it runs only while its window of the film is on
// screen, and the scroll speed lifts it (a fast scroll, a gust of dust).

type Mote = { x: number; y: number; z: number; r: number; tw: number; sway: number; bokeh: boolean };

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export class Stardust {
  private ctx: CanvasRenderingContext2D;
  private motes: Mote[] = [];
  private cw = 0;
  private ch = 0;
  private dpr = 1;
  private lastP = 0;
  private lastT = performance.now();
  private gust = 0;
  private shown = false;

  constructor(
    private canvas: HTMLCanvasElement,
    /** film progress where the dust fades in, is full, and is gone */
    private win: { from: number; to: number; fade: number },
    private reduced = false,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = this.cw = Math.round(r.width * this.dpr);
    this.canvas.height = this.ch = Math.round(r.height * this.dpr);
    const n = this.reduced ? 0 : Math.round(70 + (r.width * r.height) / 9000);
    this.motes = Array.from({ length: n }, (_, i) => this.spawn(i % 9 === 0, true));
  }

  private spawn(bokeh: boolean, anywhere: boolean): Mote {
    const z = Math.random(); // 0 far, 1 near
    return {
      x: Math.random() * this.cw,
      y: anywhere ? Math.random() * this.ch : this.ch + 20 * this.dpr,
      z,
      r: (bokeh ? 7 + z * 16 : 0.6 + z * 1.8) * this.dpr,
      tw: Math.random() * Math.PI * 2,
      sway: Math.random() * Math.PI * 2,
      bokeh,
    };
  }

  update(p: number, now = performance.now()) {
    const dt = Math.min(64, now - this.lastT) / 1000;
    this.lastT = now;
    // scroll speed in film per second; a fast scroll lifts the dust
    const v = Math.abs(p - this.lastP) / Math.max(dt, 1 / 120);
    this.lastP = p;
    this.gust += (Math.min(v * 40, 6) - this.gust) * Math.min(1, dt * 4);

    const { from, to, fade } = this.win;
    const a = ease((p - from) / fade) * (1 - ease((p - (to - fade)) / fade));
    if (a <= 0.001) {
      if (this.shown) {
        this.ctx.clearRect(0, 0, this.cw, this.ch);
        this.shown = false;
      }
      return;
    }
    this.shown = true;
    const c = this.ctx;
    c.clearRect(0, 0, this.cw, this.ch);
    const t = now / 1000;
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      const speed = (18 + m.z * 46) * (1 + this.gust) * this.dpr;
      m.y -= speed * dt;
      m.x += Math.sin(t * 0.6 + m.sway) * 6 * this.dpr * dt;
      if (m.y < -40 * this.dpr) this.motes[i] = this.spawn(m.bokeh, false);
      const twinkle = 0.55 + 0.45 * Math.sin(t * (1.5 + m.z * 2) + m.tw);
      if (m.bokeh) {
        const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        g.addColorStop(0, `rgba(236,180,198,${0.22 * a})`);
        g.addColorStop(0.6, `rgba(214,150,172,${0.1 * a})`);
        g.addColorStop(1, "rgba(214,150,172,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        c.fill();
      } else {
        // a bright core in a rose-gold halo
        const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3.2);
        g.addColorStop(0, `rgba(255,246,248,${0.95 * a * twinkle})`);
        g.addColorStop(0.3, `rgba(222,160,182,${0.55 * a * twinkle})`);
        g.addColorStop(1, "rgba(192,125,146,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(m.x, m.y, m.r * 3.2, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}
