// Kinetic captions (Daniel, 30.10: "sexier captions, more impressive motion").
// One caption = a big English word in the signature hand, rose gold, written
// across the screen behind the title; the Hebrew title in 3D (an ivory face on
// a rose-gold edge), each word swinging up out of the depth, blurred to sharp; a fine gold rule drawn under it; a glass
// pill with the line. On its way out everything lifts and dissolves and the
// script's letters drift apart. Driven by film progress, so it plays backwards.
//
// A "card" caption (Daniel, 30.10: "it must not hide anything") is set on the
// white between scenes instead of over the picture: onyx letters on a rose-gold
// edge, and on its way out the camera flies through it, the words swelling past
// the lens as the white opens onto the scene.
//
// A "neon" caption (Daniel, 30.10: "a neon sketch in the brand colours, as if
// written in the air in 3D") draws its English word instead: a point of light
// writes it like a pen, leaving a rose neon tube with a white-hot core and a
// blush glow, the sign turning towards us in 3D; when the word is done the tube
// flickers on.
//
// Markup: <KineticCaption .../>; motion: kinetic(el, p, reduced) every frame.
import { NEON } from "./neon-paths";
import { NEON_LOGO } from "./neon-logo";

// the Neonderthaw words, and Adele's own logo traced from her hand (Daniel, 30.10)
const SIGNS: Record<string, { parts: string[]; w: number; h: number }> = { ...NEON, ...Object.fromEntries(Object.entries(NEON_LOGO).map(([k, v]) => [`logo:${k}`, v])) };

export type KineticProps = {
  from: number;
  to: number;
  script?: string;
  kicker?: string;
  /** the title; "|" breaks it into lines */
  title: string;
  line?: string;
  /** set on the white between scenes, not over the picture */
  card?: boolean;
  /** over the picture, on a soft ivory panel at the bottom (onyx letters) */
  panel?: boolean;
  /** the English word written in neon (it must be one of the words in neon-paths) */
  neon?: boolean;
  /** over the picture, small, at the top above the people */
  top?: boolean;
  /** a real result under the title, as a small before and after pair (Daniel, 30.10; real photos only) */
  photos?: { before: string; after: string };
  /** a portrait under the title, in an arched frame (Adele herself, on the welcome) */
  portrait?: string;
  /** one real result under the title (when there is no before photo) */
  result?: string;
};

export function KineticCaption({ from, to, script, kicker, title, line, card, panel, neon, top, photos, portrait, result }: KineticProps) {
  const cls = ["kc", card && "kc-card", panel && "kc-panel", top && "kc-top", (card || panel) && "kc-onyx"].filter(Boolean).join(" ");
  const sign = neon && script ? SIGNS[script] : undefined;
  return (
    <div className={cls} data-kfrom={from} data-kto={to} aria-label={[kicker, title.replace(/\|/g, " "), line].filter(Boolean).join(" · ")}>
      {sign && (
        <span className="kc-neon" aria-hidden>
          <svg viewBox={`0 0 ${sign.w} ${sign.h}`} style={{ aspectRatio: `${sign.w} / ${sign.h}` }}>
            {["glow", "tube", "core"].map((layer) => (
              <g key={layer} className={`kc-neon-${layer}`}>
                {sign.parts.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            ))}
            <circle className="kc-neon-pen" r={9} />
          </svg>
        </span>
      )}
      {script && !sign && (
        // sized to its length, so a long word still fits the phone's width
        <span className="kc-script" aria-hidden style={{ fontSize: `min(180px, ${(185 / Math.max(6, script.length)).toFixed(1)}cqw)` }}>
          {script}
        </span>
      )}
      {kicker && (
        <span className="kc-kicker" aria-hidden>
          {kicker}
        </span>
      )}
      {title && (
      <span className="kc-title" aria-hidden>
        {title.split("|").map((row, r) => (
          <span className="kc-row" key={r}>
            {row.trim().split(" ").map((w, i) => (
              <span className="kc-slot" key={i}>
                <span className="kc-word">{w}</span>
              </span>
            ))}
          </span>
        ))}
      </span>
      )}
      {title && <span className="kc-rule" aria-hidden />}
      {line && (
        <span className="kc-line" aria-hidden>
          {line}
        </span>
      )}
      {portrait && (
        <span className="kc-photos" aria-hidden>
          <span className="kc-photo kc-portrait" data-tilt="0">
            <img src={portrait} alt="" />
          </span>
        </span>
      )}
      {result && (
        <span className="kc-photos" aria-hidden>
          <span className="kc-photo kc-result" data-tilt="-3">
            <img src={result} alt="" />
            <i>התוצאה</i>
          </span>
        </span>
      )}
      {photos && (
        <span className="kc-photos" aria-hidden>
          <span className="kc-photo kc-photo-before">
            <img src={photos.before} alt="" />
            <i>לפני</i>
          </span>
          <span className="kc-photo kc-photo-after">
            <img src={photos.after} alt="" />
            <i>אחרי</i>
          </span>
        </span>
      )}
    </div>
  );
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => clamp01(x) * clamp01(x) * (3 - 2 * clamp01(x));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

const last = new WeakMap<HTMLElement, string>();
/** write a style only when it changed */
function set(el: HTMLElement, css: Record<string, string>) {
  const key = JSON.stringify(css);
  if (last.get(el) === key) return;
  last.set(el, key);
  Object.assign(el.style, css);
}

/** every kinetic caption inside `root`, at film progress p */
export function kinetic(root: HTMLElement, p: number, reduced: boolean) {
  root.querySelectorAll<HTMLElement>(".kc").forEach((el) => {
    const from = Number(el.dataset.kfrom);
    const to = Number(el.dataset.kto);
    const k = (p - from) / (to - from); // 0..1 across its slice
    if (k <= 0 || k >= 1) {
      set(el, { visibility: "hidden" });
      return;
    }
    const card = el.classList.contains("kc-card");
    // the way out: a card swells past the lens as the camera flies through it;
    // a caption over the picture lifts and dissolves
    // (a card is gone by 0.86, so the white then opens onto a sharp scene, never under a ghost of the card)
    const out = card ? smooth((k - 0.55) / 0.31) : smooth((k - 0.82) / 0.18);
    const lift = reduced || card ? 0 : -28 * out;
    const fade = 1 - out;
    set(el, {
      visibility: "visible",
      transform: card && !reduced ? `scale(${(1 + 1.6 * out * out).toFixed(3)})` : "",
      filter: card ? `blur(${(out * 14).toFixed(2)}px)` : "",
      opacity: card ? String(1 - smooth((k - 0.64) / 0.22)) : "",
    });

    const script = el.querySelector<HTMLElement>(".kc-script");
    if (script) {
      // written left to right, a light sweeping across it; the letters spread as it leaves
      const w = outCubic(k / 0.32);
      const sheen = -40 + k * 280;
      set(script, {
        // generous top and bottom: the script's loops reach far above and below the line
        clipPath: reduced ? "none" : `inset(-90% ${((1 - w) * 100).toFixed(1)}% -90% -12%)`,
        opacity: String(0.92 * fade),
        letterSpacing: `${(out * 0.18).toFixed(3)}em`,
        transform: `translate3d(${reduced ? 0 : ((0.5 - k) * 18).toFixed(2)}px, ${(lift * 1.4).toFixed(1)}px, 0)`,
        filter: `blur(${(out * 6).toFixed(2)}px)`,
      });
      script.style.setProperty("--sheen", `${sheen.toFixed(0)}%`);
    }

    const neon = el.querySelector<HTMLElement>(".kc-neon");
    if (neon) neonAt(neon, k, out, reduced);

    const kicker = el.querySelector<HTMLElement>(".kc-kicker");
    if (kicker) {
      const t = smooth((k - 0.1) / 0.16);
      set(kicker, {
        opacity: String(t * fade),
        letterSpacing: `${(0.6 - 0.32 * t).toFixed(3)}em`,
        transform: `translate3d(0, ${lift.toFixed(1)}px, 0)`,
      });
    }

    // the title: word by word, each rising out of its slot, blurred to sharp
    const words = el.querySelectorAll<HTMLElement>(".kc-word");
    const n = words.length;
    words.forEach((word, i) => {
      // Hebrew reads right to left, and the words are laid out that way: the first word in the DOM is read first
      const t = outCubic((k - 0.12 - (i * 0.08) / Math.max(1, n - 1) - i * 0.03) / 0.2);
      // in 3D: each word swings up from lying flat, out of the depth, and settles facing us
      set(word, {
        transform: reduced
          ? "none"
          : `translate3d(0, ${((1 - t) * 30).toFixed(1)}%, ${((1 - t) * -260).toFixed(0)}px) rotateX(${((1 - t) * -82).toFixed(1)}deg)`,
        filter: `blur(${((1 - t) * 8 + out * 8).toFixed(2)}px)`,
        opacity: String(Math.min(1, t * 1.6) * fade),
      });
    });
    const title = el.querySelector<HTMLElement>(".kc-title");
    if (title) set(title, { transform: `translate3d(0, ${lift.toFixed(1)}px, 0)` });

    const rule = el.querySelector<HTMLElement>(".kc-rule");
    if (rule) {
      const t = outCubic((k - 0.34) / 0.16);
      set(rule, { transform: `translate3d(0, ${lift.toFixed(1)}px, 0) scaleX(${t.toFixed(3)})`, opacity: String(fade) });
    }

    // the pair of photos: dealt onto the white one after the other, tilting into place
    el.querySelectorAll<HTMLElement>(".kc-photo").forEach((ph, i) => {
      const t = outCubic((k - 0.3 - i * 0.07) / 0.2);
      const tilt = ph.dataset.tilt ? Number(ph.dataset.tilt) : i === 0 ? 5 : -5;
      set(ph, {
        opacity: String(t),
        transform: reduced
          ? `rotate(${tilt}deg)`
          : `translate3d(0, ${((1 - t) * 60).toFixed(1)}px, ${((1 - t) * -140).toFixed(0)}px) rotateX(${((1 - t) * 40).toFixed(1)}deg) rotate(${(tilt * t + (1 - t) * tilt * 3).toFixed(2)}deg)`,
      });
    });

    const line = el.querySelector<HTMLElement>(".kc-line");
    if (line) {
      const t = outCubic((k - 0.42) / 0.16);
      set(line, {
        opacity: String(t * fade),
        transform: `translate3d(0, ${((1 - t) * 14 + lift).toFixed(1)}px, 0) scale(${(0.94 + 0.06 * t).toFixed(3)})`,
      });
    }
  });
}

/** each outline's share of the word, measured once per sign: the pen writes them one after another */
type Outline = { from: number; len: number; total: number; path: SVGPathElement };
const signs = new WeakMap<HTMLElement, Outline[][]>();
function measure(neon: HTMLElement) {
  let m = signs.get(neon);
  if (!m) {
    const groups = [...neon.querySelectorAll("g")];
    const lens = [...groups[0].querySelectorAll("path")].map((p) => p.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0);
    m = groups.map((g) => {
      let from = 0;
      return [...g.querySelectorAll("path")].map((path, i) => {
        const o = { from, len: lens[i], total, path };
        path.style.strokeDasharray = `${lens[i] + 1} ${lens[i] + 1}`;
        from += lens[i];
        return o;
      });
    });
    signs.set(neon, m);
  }
  return m;
}

/** the neon word at caption progress k: written by a pen of light, turning towards us, then lit */
function neonAt(neon: HTMLElement, k: number, out: number, reduced: boolean) {
  const t = reduced ? 1 : smooth((k - 0.02) / 0.4); // how much of the word is written
  const layers = measure(neon);
  const at = t * layers[0][0].total;
  let pen: DOMPoint | null = null;
  for (const layer of layers) {
    for (const o of layer) {
      const drawn = Math.min(o.len, Math.max(0, at - o.from));
      // (an outline not begun yet is hidden: its round cap would show as a dot. Opacity, not
      // visibility: a child set visible would show through a caption that has been hidden)
      set(o.path as unknown as HTMLElement, { strokeDashoffset: (o.len + 1 - drawn).toFixed(1), opacity: drawn > 0 ? "1" : "0" });
      if (layer === layers[1] && drawn > 0 && drawn < o.len) pen = o.path.getPointAtLength(drawn);
    }
  }
  const dot = neon.querySelector<SVGCircleElement>(".kc-neon-pen");
  if (dot) {
    if (pen) {
      dot.setAttribute("cx", pen.x.toFixed(1));
      dot.setAttribute("cy", pen.y.toFixed(1));
    }
    dot.style.opacity = pen ? "1" : "0";
  }
  // the tube catches when the word is done: a few quick flickers, then steady
  const f = (k - 0.42) / 0.1;
  const flick = f > 0 && f < 1 ? [1, 0.35, 1, 0.55, 0.9, 0.4, 1][Math.floor(f * 7)] : 1;
  const lit = t >= 0.999 ? 1 : 0.8;
  set(neon, {
    opacity: String((1 - out) * flick),
    transform: reduced
      ? ""
      : `perspective(900px) translate3d(0, ${(-18 * out).toFixed(1)}px, ${((1 - t) * -120).toFixed(0)}px) rotateY(${((1 - t) * 26 - 3 * Math.sin(k * 3)).toFixed(2)}deg) rotateX(${((1 - t) * 14).toFixed(2)}deg)`,
    filter: `brightness(${lit}) blur(${(out * 6).toFixed(2)}px)`,
  });
}
