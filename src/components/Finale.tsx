// The end of the film: over the sea of pink clouds the Danielor sign catches
// letter by letter with the scroll, sparks
// rise from the clouds into it, then the line and the way to talk to us.
// (Each letter lights smoothly and stays lit: no flicker on this site, Daniel 02.11.)
// Driven by film progress, so it plays backwards too.
import { site } from "@/site.config";
import { LETTERS } from "./Sign";
import Sign from "./Sign";

const SPARKS = Array.from({ length: 22 }, (_, i) => i);

export function Finale() {
  return (
    <div className="dn-fin" aria-hidden={false}>
      <div className="dn-fin-sparks" aria-hidden>
        {SPARKS.map((i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <Sign className="dn-fin-sign" />
      <p className="dn-fin-line">
        פתרונות AI לעסקים. <b>צוות סוכני AI, ובן אדם שמאשר כל דבר.</b>
      </p>
      <a className="kit-btn dn-btn dn-fin-cta" href="/wa" target="_blank" rel="noopener">
        {site.voice.cta} בוואטסאפ
      </a>
    </div>
  );
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => clamp01(x) * clamp01(x) * (3 - 2 * clamp01(x));

const last = new WeakMap<HTMLElement, string>();
function set(el: HTMLElement, css: Record<string, string>) {
  const key = JSON.stringify(css);
  if (last.get(el) === key) return;
  last.set(el, key);
  Object.assign(el.style, css);
}

/** the finale at film progress p (it starts at `from`) */
export function finaleAt(root: HTMLElement, p: number, reduced: boolean, from = 0.5) {
  const k = clamp01((p - from) / (1 - from)); // 0..1 across the finale
  set(root, { visibility: k > 0 ? "visible" : "hidden" });
  if (k <= 0) return;

  const sign = root.querySelector<HTMLElement>(".dn-fin-sign");
  if (sign) {
    const t = smooth(k / 0.18);
    set(sign, {
      opacity: String(t),
      transform: reduced
        ? ""
        : `perspective(1000px) translate3d(0, ${((1 - t) * 40).toFixed(1)}px, ${((1 - t) * -220).toFixed(0)}px) rotateX(${((1 - t) * 24).toFixed(1)}deg)`,
    });
    // the letters catch one after another, in the opening's order
    const order = [...LETTERS.keys()].sort((a, b) => LETTERS[a].d - LETTERS[b].d);
    const lit = sign.querySelectorAll<HTMLElement>(".dn-sign-on");
    order.forEach((idx, n) => {
      const s = 0.12 + n * 0.045;
      const f = (k - s) / 0.06;
      // lights and stays lit, no flicker (Daniel, 02.11)
      const o = smooth(f);
      set(lit[idx], { opacity: String(reduced ? (k > s ? 1 : 0) : o), animation: "none" });
    });
    const star = sign.querySelector<HTMLElement>(".dn-sign-star");
    if (star) {
      const t2 = smooth((k - 0.52) / 0.1);
      set(star, { opacity: String(t2), transform: `translate(-50%, -50%) scale(${(0.3 + t2 * 0.7).toFixed(3)}) rotate(${(t2 * 90).toFixed(1)}deg)`, animation: "none" });
    }
  }

  // sparks rise out of the clouds into the sign
  root.querySelectorAll<HTMLElement>(".dn-fin-sparks i").forEach((s, i) => {
    const t = clamp01((k - (i % 7) * 0.02) / 0.6);
    set(s, { opacity: String(Math.sin(Math.PI * t) * 0.95), transform: `translate3d(0, ${(-t * 46).toFixed(1)}vh, 0) scale(${(1 - t * 0.5).toFixed(3)})` });
  });

  const line = root.querySelector<HTMLElement>(".dn-fin-line");
  if (line) {
    const t = smooth((k - 0.6) / 0.14);
    set(line, { opacity: String(t), transform: `translate3d(0, ${((1 - t) * 18).toFixed(1)}px, 0)`, filter: `blur(${((1 - t) * 6).toFixed(2)}px)` });
  }
  const cta = root.querySelector<HTMLElement>(".dn-fin-cta");
  if (cta) {
    const t = smooth((k - 0.7) / 0.14);
    set(cta, { opacity: String(t), transform: `translate3d(0, ${((1 - t) * 22).toFixed(1)}px, 0) scale(${(0.92 + 0.08 * t).toFixed(3)})`, pointerEvents: t > 0.5 ? "auto" : "none" });
  }
}
