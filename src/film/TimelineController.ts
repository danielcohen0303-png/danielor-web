// HTML layers (captions, side elements) driven by the same film progress as
// the picture, so they stay locked to it forward, backward and at rest.
// Only opacity and transform are written, and only when they change.
import type { Caption } from "./types";

type Track = (p: number, raw: number) => void;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);

export class TimelineController {
  private last = new Map<HTMLElement, string>();
  private tracks: Track[] = [];

  constructor(
    private captions: Caption[],
    private reduced = false,
  ) {}

  /** any extra element: called every frame with the film progress and the section's progress */
  add(track: Track) {
    this.tracks.push(track);
  }

  update(p: number, raw = p) {
    for (const c of this.captions) {
      const len = c.to - c.from;
      const fade = Math.min(0.06, len / 3); // never longer than a third of its slice
      const inn = clamp01((p - c.from) / fade);
      const out = clamp01((c.to - p) / fade);
      const v = ease(Math.min(inn, out));
      const y = this.reduced ? 0 : (1 - v) * (p < c.from + fade ? 18 : -18);
      const css = `${v.toFixed(3)}|${y.toFixed(1)}`;
      if (this.last.get(c.el) === css) continue;
      this.last.set(c.el, css);
      c.el.style.opacity = String(v);
      c.el.style.transform = `translate3d(0,${y}px,0)`;
      c.el.style.visibility = v > 0 ? "visible" : "hidden";
    }
    for (const t of this.tracks) t(p, raw);
  }
}
