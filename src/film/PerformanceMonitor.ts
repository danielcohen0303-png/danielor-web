// What can be measured honestly in a browser, on the device itself:
//  - display frames per second and the slowest frame (rAF gaps);
//  - lag: how far the picture on screen is behind the scroll, in film frames;
//  - stalls: the scroll moved but the picture stood still for 120 ms+;
//  - time to first picture, and megabytes downloaded.
// Memory only where the browser exposes it (Chrome's performance.memory);
// Safari has nothing, so it is not shown there.

export type Sample = { target: number; shown: number; moving: boolean };

export class PerformanceMonitor {
  private el: HTMLElement | null = null;
  private gaps: number[] = [];
  private lags: number[] = [];
  private stillSince = 0;
  private stalled = false;
  private lastShown = -1;
  stalls = 0;
  worstGap = 0;
  maxLag = 0;

  constructor(
    private frames: number,
    show: boolean,
    private extra: () => Record<string, string> = () => ({}),
  ) {
    if (!show) return;
    const el = document.createElement("div");
    el.dir = "rtl";
    el.style.cssText =
      // top left, under the lab's switches: at the bottom it covered the captions
      "position:fixed;left:8px;top:150px;z-index:50;padding:6px 8px;border-radius:10px;white-space:pre;opacity:.85;" +
      "font:600 10px/1.4 ui-monospace,Menlo,monospace;color:#fff;background:rgba(55,38,48,.82);pointer-events:none";
    document.body.appendChild(el);
    this.el = el;
  }

  sample(dtMs: number, s: Sample, now: number) {
    this.gaps.push(dtMs);
    if (this.gaps.length > 120) this.gaps.shift();
    // the first second after load has long frames from loading itself
    if (now > 2500) this.worstGap = Math.max(this.worstGap, dtMs);
    const lag = Math.abs(s.target - s.shown) * (this.frames - 1);
    this.lags.push(lag);
    if (this.lags.length > 120) this.lags.shift();
    if (s.moving) this.maxLag = Math.max(this.maxLag, lag);
    const changed = Math.abs(s.shown - this.lastShown) > 1e-4;
    if (changed || !s.moving || lag < 1) {
      this.stillSince = now;
      this.stalled = false;
    } else if (!this.stalled && now - this.stillSince > 120) {
      this.stalled = true;
      this.stalls++;
    }
    this.lastShown = s.shown;
  }

  reset() {
    this.stalls = 0;
    this.worstGap = 0;
    this.maxLag = 0;
  }

  draw(firstPaintMs: number | null, mb: number) {
    if (!this.el) return;
    const avg = this.gaps.reduce((a, b) => a + b, 0) / Math.max(1, this.gaps.length);
    const lagAvg = this.lags.reduce((a, b) => a + b, 0) / Math.max(1, this.lags.length);
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const rows: Record<string, string> = {
      "פריימים בשנייה": (1000 / avg).toFixed(0),
      "פריים הכי איטי": `${this.worstGap.toFixed(0)}ms`,
      "פיגור עכשיו": `${lagAvg.toFixed(1)} פריימים`,
      "פיגור מקסימלי": `${this.maxLag.toFixed(1)} פריימים`,
      "תקיעות": String(this.stalls),
      "תמונה ראשונה": firstPaintMs === null ? "…" : `${(firstPaintMs / 1000).toFixed(2)}s`,
      "ירד": `${mb.toFixed(1)}MB`,
      ...this.extra(),
    };
    if (mem) rows["זיכרון JS"] = `${(mem.usedJSHeapSize / 1e6).toFixed(0)}MB`;
    this.el.textContent = Object.entries(rows)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }

  destroy() {
    this.el?.remove();
  }
}
