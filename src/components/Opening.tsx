import { site } from "@/site.config";
import Sign from "./Sign";
import SwipeCue from "./SwipeCue";

// The first screen, in the dark the film opens from: the Danielor sign
// catching letter by letter, one line of what it is, and the move that plays
// the film (a hand on a phone, a mouse wheel on a computer). Pink sparks
// drift up the way the film's spark will in a moment.
const SPARKS = Array.from({ length: 18 }, (_, i) => i);

export default function Opening() {
  return (
    <section className="kit-open dn-open" aria-label={site.name}>
      <div className="dn-open-sky" aria-hidden>
        {SPARKS.map((i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <Sign className="dn-open-sign" delay={0.35} />
      <h1 className="dn-open-title">
        <span>פתרונות AI</span> <span className="dn-hot">לעסקים</span>
      </h1>
      <p className="dn-open-sub">סרט אחד, טייק אחד, כולו נוצר ב-AI. גללו ותראו מה אנחנו בונים.</p>
      <div className="kit-open-cue">
        <SwipeCue label={site.voice.openingCue} />
      </div>
    </section>
  );
}
