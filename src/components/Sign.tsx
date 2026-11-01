// The Danielor neon sign (the folded-ribbon wordmark from danielor.ai, with
// DANI in white and ELOR in pink, Daniel's rule): an unlit copy underneath
// and one lit copy per letter, so each letter can catch on its own like a
// real neon tube. The opening lights it on a timer (CSS); the finale lights it
// with the scroll (Finale.tsx).

// each letter's slice of the sign, in % from the left and from the right,
// and the order the opening lights them in (seconds)
export const LETTERS = [
  { l: 0, r: 82.15, d: 0.15 },
  { l: 17.85, r: 69.44, d: 0.32 },
  { l: 30.56, r: 56.95, d: 0.24 },
  { l: 43.05, r: 51.37, d: 0.48 },
  { l: 48.63, r: 40.17, d: 0.78 },
  { l: 59.83, r: 30.09, d: 0.95 },
  { l: 69.91, r: 17.64, d: 0.86 },
  { l: 82.36, r: 0, d: 1.08 },
];

export default function Sign({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div className={`dn-sign ${className}`} role="img" aria-label="Danielor">
      <img className="dn-sign-off" src="/brand/sign-off.webp" alt="" width={900} height={398} />
      {LETTERS.map((x, i) => (
        <img
          key={i}
          className="dn-sign-on"
          src="/brand/sign-on.webp"
          alt=""
          width={900}
          height={398}
          style={{ "--l": `${x.l}%`, "--r": `${x.r}%`, "--d": `${(x.d + delay).toFixed(2)}s` } as React.CSSProperties}
        />
      ))}
      <span className="dn-sign-star" aria-hidden />
    </div>
  );
}
