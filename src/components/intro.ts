// The opening's motion, scroll-driven (q: 0..1 across the opening's stretch
// of scroll), so it plays backwards too:
//   the line and the cue lift away and blur out first;
//   the sign's letters fly in towards its middle one after another (the
//   order they lit up in) while the whole sign glides to the centre of the
//   screen and shrinks, burning brighter, into a single point;
//   the dark of the opening clears and the point blooms once: it is the pink
//   spark the film's first frame holds in the same place;
//   the drifting sparks are drawn into it.
import { LETTERS } from "./Sign";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => clamp01(x) * clamp01(x) * (3 - 2 * clamp01(x));
const inQuad = (x: number) => clamp01(x) * clamp01(x);

const last = new WeakMap<HTMLElement, string>();
function set(el: HTMLElement | null, css: Record<string, string>) {
  if (!el) return;
  const key = JSON.stringify(css);
  if (last.get(el) === key) return;
  last.set(el, key);
  Object.assign(el.style, css);
}

// the order the letters lit up in: they fly in in the same order
const ORDER = [...LETTERS.keys()].sort((a, b) => LETTERS[a].d - LETTERS[b].d);

export function introAt(root: HTMLElement, q: number, reduced: boolean) {
  set(root, { visibility: q >= 0.999 ? "hidden" : "visible" });
  if (q >= 0.999) return;

  if (reduced) {
    set(root, { visibility: q >= 0.999 ? "hidden" : "visible", opacity: String(1 - smooth(q / 0.6)) });
    return;
  }

  const bg = root.querySelector<HTMLElement>(".dn-intro-bg");
  set(bg, { opacity: String(1 - smooth((q - 0.3) / 0.55)) });

  const copy = root.querySelector<HTMLElement>(".dn-intro-copy");
  const c = smooth(q / 0.32);
  set(copy, {
    opacity: String(1 - c),
    transform: `translate3d(0, ${(-46 * c).toFixed(1)}px, 0) scale(${(1 + 0.1 * c).toFixed(3)})`,
    filter: `blur(${(10 * c).toFixed(2)}px)`,
  });
  const cue = root.querySelector<HTMLElement>(".dn-intro-cue");
  const u = smooth(q / 0.12);
  set(cue, { opacity: String(1 - u), transform: `translate3d(0, ${(24 * u).toFixed(1)}px, 0)` });

  // the sign: glides to the centre of the screen and shrinks into a point
  const wrap = root.querySelector<HTMLElement>(".dn-intro-sign");
  if (wrap) {
    const cx = root.clientWidth / 2;
    const cy = root.clientHeight / 2;
    // its place before any transform (offsets ignore transforms, so no feedback)
    const sx = wrap.offsetLeft + wrap.offsetWidth / 2;
    const sy = wrap.offsetTop + wrap.offsetHeight / 2;
    const t = smooth((q - 0.06) / 0.72);
    const s = 1 - 0.985 * inQuad(t * 1.05);
    set(wrap, {
      transform: `translate3d(${((cx - sx) * t).toFixed(1)}px, ${((cy - sy) * t).toFixed(1)}px, 0) scale(${Math.max(0.012, s).toFixed(4)})`,
      filter: `brightness(${(1 + 1.6 * t).toFixed(3)}) saturate(${(1 + 0.6 * t).toFixed(3)})`,
      opacity: String(1 - smooth((q - 0.8) / 0.1)),
    });
    // the letters fly in towards the middle of the sign, one after another
    const w = wrap.offsetWidth;
    const lit = wrap.querySelectorAll<HTMLElement>(".dn-sign-on");
    const off = wrap.querySelector<HTMLElement>(".dn-sign-off");
    set(off, { opacity: String(0.32 * (1 - smooth(q / 0.25))) });
    ORDER.forEach((idx, n) => {
      const L = LETTERS[idx];
      const mid = (L.l + (100 - L.r)) / 2; // the letter's centre, % across the sign
      const k = smooth((q - 0.04 - n * 0.035) / 0.42);
      set(lit[idx], {
        transformOrigin: `${mid.toFixed(2)}% 55%`,
        transform: `translate3d(${(((50 - mid) / 100) * w * k).toFixed(1)}px, 0, 0) scale(${(1 - 0.55 * k).toFixed(3)})`,
      });
    });
    const star = wrap.querySelector<HTMLElement>(".dn-sign-star");
    set(star, { opacity: String(1 - smooth(q / 0.2)) });
  }

  // the drifting sparks are drawn into the point
  const sky = root.querySelector<HTMLElement>(".dn-intro-sky");
  const k = smooth((q - 0.05) / 0.7);
  set(sky, { transform: `scale(${(1 - 0.92 * k).toFixed(3)})`, opacity: String(1 - smooth((q - 0.55) / 0.3)) });

  // the point blooms once, and leaves the film's own spark
  const bloom = root.querySelector<HTMLElement>(".dn-intro-bloom");
  const b = clamp01((q - 0.7) / 0.28);
  set(bloom, {
    opacity: String(Math.sin(Math.PI * b) * 0.95),
    transform: `translate(-50%, -50%) scale(${(0.15 + 1.9 * smooth(b)).toFixed(3)})`,
  });
}
