import { site } from "@/site.config";
import Sign from "./Sign";
import SwipeCue from "./SwipeCue";

// The first screen, laid over the film's pinned stage (Daniel, 01.11: the
// opening must flow into the film, not slide away from it). On load the
// Danielor sign catches letter by letter and pink sparks drift up; with the
// first scroll the letters fly into the middle and shrink into a point of
// light, the dark opens, and that point is the spark the film starts from.
// The motion is in src/components/intro.ts, driven by OneFilm.
const SPARKS = Array.from({ length: 18 }, (_, i) => i);

export default function Opening() {
  return (
    <div className="dn-intro" aria-label={site.name}>
      <div className="dn-intro-bg" aria-hidden />
      <div className="dn-intro-sky" aria-hidden>
        {SPARKS.map((i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className="dn-intro-sign">
        <Sign className="dn-open-sign" delay={0.35} />
      </div>
      <div className="dn-intro-copy">
        <h1 className="dn-open-title">
          <span>פתרונות AI</span> <span className="dn-hot">לעסקים</span>
        </h1>
        <p className="dn-open-sub">סרט אחד, טייק אחד, כולו נוצר ב-AI. גללו ותראו מה אנחנו בונים.</p>
      </div>
      <div className="dn-intro-cue">
        <div className="kit-open-cue">
          <SwipeCue label={site.voice.openingCue} />
        </div>
      </div>
      <div className="dn-intro-bloom" aria-hidden />
    </div>
  );
}
