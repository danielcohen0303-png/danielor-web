import Link from "next/link";
import { about, faq, services, site } from "@/site.config";

// The page after the film, on Danielor's lilac glow (danielor.ai): the four
// solutions as neon-edged cards, how the team works, questions, and the way
// to talk to us. The film carries the motion; here the light does.

export function Services() {
  return (
    <section className="kit-sec dn-sec dn-services" aria-labelledby="dn-services-h">
      <p className="kit-kicker dn-kicker">מה ראיתם בסרט</p>
      <h2 className="kit-h2 dn-h2" id="dn-services-h">
        ארבעה עולמות. <span className="dn-grad">צוות אחד.</span>
      </h2>
      <div className="dn-cards">
        {services.map((s, i) => (
          <article key={s.key} className={`dn-card dn-card-${s.key}`} style={{ "--n": i } as React.CSSProperties}>
            <span className="dn-card-en" dir="ltr">
              {s.en}
            </span>
            <h3 className="dn-card-title">{s.title}</h3>
            <p className="dn-card-body">{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function About() {
  const [a, b] = about.title.split("|");
  return (
    <section className="kit-sec dn-sec dn-about">
      <p className="kit-kicker dn-kicker">{about.kicker}</p>
      <h2 className="kit-h2 dn-h2">
        {a} <span className="dn-grad">{b}</span>
      </h2>
      {about.body.map((p) => (
        <p key={p} className="kit-p dn-p">
          {p}
        </p>
      ))}
    </section>
  );
}

export function Faq() {
  if (!faq.length) return null;
  return (
    <section className="kit-sec dn-sec kit-faq" aria-label="שאלות נפוצות">
      <h2 className="kit-h2 dn-h2">שאלות נפוצות</h2>
      {faq.map((f) => (
        <details key={f.q} className="kit-faq-item dn-faq-item">
          <summary>{f.q}</summary>
          <p className="kit-p">{f.a}</p>
        </details>
      ))}
    </section>
  );
}

export function Cta() {
  return (
    <section className="kit-sec dn-sec dn-cta" aria-labelledby="dn-cta-h">
      <h2 className="dn-cta-title" id="dn-cta-h">
        רוצים כזה <span className="dn-grad">לעסק שלכם?</span>
      </h2>
      <p className="kit-p dn-p">כתבו לנו בוואטסאפ. הסוכן שלנו עונה מיד, ודניאל חוזר אליכם אישית.</p>
      <a className="kit-btn dn-btn dn-btn-lg" href="/wa" target="_blank" rel="noopener">
        {site.voice.cta} בוואטסאפ
      </a>
    </section>
  );
}

export function Footer() {
  const c = site.contact;
  return (
    <footer className="kit-foot dn-foot">
      <p className="dn-foot-brand" dir="ltr">
        DANI<span>ELOR</span>
      </p>
      <p className="dn-foot-tag">{site.tagline}</p>
      <div className="dn-foot-links">
        <a href="https://danielor.ai" target="_blank" rel="noopener">
          danielor.ai
        </a>
        <a href={`mailto:${c.email}`}>{c.email}</a>
        {c.instagram && (
          <a href={c.instagram} target="_blank" rel="noopener">
            אינסטגרם
          </a>
        )}
      </div>
      <nav className="kit-foot-legal">
        <Link href="/accessibility">הצהרת נגישות</Link>
        <Link href="/privacy">מדיניות פרטיות</Link>
      </nav>
      <a className="kit-credit" href={site.credit.url} target="_blank" rel="noopener">
        {site.credit.text}
      </a>
    </footer>
  );
}
