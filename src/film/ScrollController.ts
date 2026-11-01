// Scroll position of one tall section -> film progress (0..1).
//
// The section is position:sticky inside (no ScrollTrigger pin: no pin-spacer
// to jump on iOS when the address bar hides). Its offsets are cached on
// resize, so a frame costs one read of scrollY, no layout.
//
// smoothMs: 0 = the picture follows the finger exactly; otherwise an
// exponential ease with this time constant (40 is what the AC site uses:
// it evens out uneven touch events without trailing the finger; 100 is
// about GSAP's scrub: 0.3).

export class ScrollController {
  target = 0;
  current = 0;
  dir: 1 | -1 = 1;
  private top = 0;
  private span = 1;

  constructor(
    private section: HTMLElement,
    private smoothMs = 0,
  ) {
    this.measure();
    this.current = this.target = this.read();
  }

  measure() {
    const r = this.section.getBoundingClientRect();
    this.top = r.top + window.scrollY;
    this.span = Math.max(1, r.height - window.innerHeight);
  }

  private read() {
    return Math.min(1, Math.max(0, (window.scrollY - this.top) / this.span));
  }

  /** advance one display frame; returns the progress to render */
  tick(dtMs: number) {
    const t = this.read();
    if (t !== this.target) this.dir = t > this.target ? 1 : -1;
    this.target = t;
    if (this.smoothMs <= 0) this.current = t;
    else {
      const k = 1 - Math.exp(-dtMs / this.smoothMs);
      this.current += (t - this.current) * k;
      if (Math.abs(t - this.current) < 1e-5) this.current = t;
    }
    return this.current;
  }
}
