"use client";

// The page after the film, from the live danielor.ai homepage (Daniel, 02.11):
// the solutions with their prices, the work, how we work and who is behind
// Danielor, the studio, the price list, the order form that opens WhatsApp with
// the message written, and the questions. Content in src/live.ts; every
// WhatsApp button goes to the agent (wa.me/972507149677).
import { useEffect, useMemo, useRef, useState } from "react";
import {
  agent,
  behind,
  bizapp,
  built,
  bundle,
  chat,
  company,
  faq,
  legal,
  orderOptions,
  orderUnsure,
  priceRows,
  sites,
  solutions,
  steps,
  studio,
  waLink,
  WA_DISPLAY,
  work,
  type Solution,
} from "@/live";
import { ChatPhone } from "./Chapters";

const Ic = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d={d} />
  </svg>
);

/** pick a product in the order form and scroll to it */
function pickProduct(name: string) {
  window.dispatchEvent(new CustomEvent("dn:pick", { detail: name }));
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Incl({ items }: { items: string[][] }) {
  return (
    <ul className="lv-incl">
      {items.map(([b, t]) => (
        <li key={b}>
          <b>{b}</b>
          {t}
        </li>
      ))}
    </ul>
  );
}

function H({ t, className = "lv-h3" }: { t: string[]; className?: string }) {
  return (
    <h3 className={className}>
      {t[0]} <span className="dn-grad">{t[1]}</span>
    </h3>
  );
}

function Price({ price, from, per }: { price: string; from?: boolean; per: string }) {
  return (
    <>
      <div className="lv-pp">
        {from && <small>החל מ־</small>}
        {price}
      </div>
      <div className="lv-pm">{per}</div>
    </>
  );
}

/** videos play only while on screen (and load only then). Each sits over its
 * poster picture and stays see-through until it really shows frames: on an
 * iPhone a video drops its poster the moment it starts loading and is black
 * until the first frame (Daniel, 02.11: "a black screen before they play") */
function useAutoplay(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // the posters, all at once as the section nears: a card further along a
    // carousel is hidden by it, so it never "nears" on its own
    const near = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        el.querySelectorAll<HTMLImageElement>("img.lv-poster[data-src]").forEach((im) => {
          if (!im.getAttribute("src") && im.dataset.src) im.src = im.dataset.src;
        });
        near.disconnect();
      },
      { rootMargin: "150% 0px" },
    );
    // a video shows itself once a frame of it is really on screen
    const shown = (v: HTMLVideoElement) => {
      const on = () => v.classList.add("lv-on");
      const t = () => {
        if (v.currentTime <= 0) return;
        on();
        v.removeEventListener("timeupdate", t);
      };
      if (typeof v.requestVideoFrameCallback === "function") v.requestVideoFrameCallback(() => on());
      else v.addEventListener("timeupdate", t);
    };
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            if (!v.src && v.dataset.src) {
              shown(v);
              v.src = v.dataset.src;
            }
            v.play().catch(() => {});
          } else v.pause();
        }),
      { threshold: 0.25 },
    );
    near.observe(el);
    el.querySelectorAll("video").forEach((v) => io.observe(v));
    return () => (io.disconnect(), near.disconnect());
  }, [root]);
}

function AgentPanel() {
  return (
    <div className="lv-panel-in">
      <div className="lv-agent">
        <div>
          <H t={agent.title} />
          <p className="lv-lead">{agent.lead}</p>
          <Incl items={agent.incl} />
          <div className="lv-price">
            <span className="lv-price-k">{agent.priceK}</span>
            <Price price={agent.price} from per={agent.priceM} />
          </div>
          <p className="lv-more">{agent.more}</p>
          <div className="lv-cta">
            <a className="kit-btn dn-btn" href={waLink(agent.ctaText)} target="_blank" rel="noopener">
              {agent.cta}
            </a>
            <span>{agent.ctaNote}</span>
          </div>
        </div>
        <figure className="lv-chat">
          <ChatPhone />
          <figcaption>{chat.caption}</figcaption>
        </figure>
      </div>
      <div className="lv-built">
        <h4>
          {built.title} <span className="dn-grad">{built.hl}</span>
        </h4>
        <ul>
          {built.items.map((b) => (
            <li key={b.name}>
              <span className="lv-ic">
                <Ic d={b.icon} />
              </span>
              <b>{b.name}</b>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AppPanel() {
  return (
    <div className="lv-panel-in">
      <H t={bizapp.title} />
      <p className="lv-lead">{bizapp.lead}</p>
      <div className="lv-two">
        <Incl items={bizapp.incl} />
        <figure className="lv-screens">
          <div>
            {bizapp.screens.map((s) => (
              <div key={s.src} className="lv-screen-item">
                <span className="lv-phone">
                  <img src={s.src} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" />
                </span>
                <p>
                  <b>{s.name}</b>
                  <br />
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
          <figcaption>{bizapp.caption}</figcaption>
        </figure>
      </div>
      <div className="lv-plans">
        {bizapp.plans.map((p) => (
          <div key={p.name} className={`lv-plan${p.save ? " lv-hot" : ""}`}>
            {p.save && <span className="lv-save">{p.save}</span>}
            <h4>{p.name}</h4>
            <Price price={p.price} from={p.from} per={p.per} />
            <p>{p.text}</p>
          </div>
        ))}
      </div>
      <p className="lv-small">{bizapp.note}</p>
      <div className="lv-cta">
        <a className="kit-btn dn-btn" href={waLink(bizapp.ctaText)} target="_blank" rel="noopener">
          {bizapp.cta}
        </a>
        <span>{bizapp.ctaNote}</span>
      </div>
    </div>
  );
}

function SitesPanel() {
  return (
    <div className="lv-panel-in">
      <H t={sites.title} />
      <p className="lv-lead">{sites.lead}</p>
      <div className="lv-plans">
        {sites.tiers.map((t) => (
          <div key={t.name} className={`lv-plan${t.hot ? " lv-hot" : ""}`}>
            <span className="lv-tier-k">{t.k}</span>
            <h4>{t.name}</h4>
            <div className="lv-pp">
              {t.from && <small>החל מ־</small>}
              {t.price}
            </div>
            <p>{t.text}</p>
          </div>
        ))}
      </div>
      <Incl items={sites.incl} />
      <div className="lv-cta">
        <button type="button" className="kit-btn dn-btn" onClick={() => pickProduct(sites.pick)}>
          {sites.cta}
        </button>
        <span>{sites.ctaNote}</span>
      </div>
    </div>
  );
}

function BundlePanel() {
  return (
    <div className="lv-panel-in lv-bundle">
      <div>
        <H t={bundle.title} />
        <p className="lv-lead">{bundle.lead}</p>
        <ol className="lv-flow">
          {bundle.flow.map(([b, t]) => (
            <li key={b}>
              <b>{b}</b>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="lv-plan lv-hot lv-bundle-card">
        <span className="lv-save">{bundle.save}</span>
        <h4>{bundle.name}</h4>
        <Price price={bundle.price} from per={bundle.per} />
        <p className="lv-was">{bundle.was}</p>
        <Incl items={bundle.incl} />
        <button type="button" className="kit-btn dn-btn" onClick={() => pickProduct(bundle.pick)}>
          {bundle.cta}
        </button>
      </div>
    </div>
  );
}

const PANELS: Record<Solution["id"], () => React.ReactElement> = {
  agent: AgentPanel,
  bizapp: AppPanel,
  sites: SitesPanel,
  bundle: BundlePanel,
};

export function Solutions() {
  const [open, setOpen] = useState<Solution["id"] | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = (id: Solution["id"]) => {
    setOpen((o) => (o === id ? null : id));
    requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };
  const Open = open ? PANELS[open] : null;
  return (
    <section className="kit-sec dn-sec lv-sec" id="solutions" aria-labelledby="lv-sol-h">
      <h2 className="dn-h2" id="lv-sol-h">
        הפתרונות <span className="dn-grad">לעסק</span>
      </h2>
      <p className="dn-p lv-sec-lead">סוכן וואטסאפ, אפליקציה לניהול ואתר שיגרום ללקוחות שלכם להגיד &quot;וואו&quot;. לחצו על פתרון כדי לפתוח אותו, ולחיצה נוספת סוגרת.</p>
      <div className="lv-tabs" role="tablist" aria-label="מה אנחנו בונים">
        {solutions.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={open === s.id}
            aria-expanded={open === s.id}
            aria-controls="lv-panel"
            className={`dn-card lv-tab${open === s.id ? " lv-on" : ""}`}
            style={{ "--n": i } as React.CSSProperties}
            onClick={() => toggle(s.id)}
          >
            <span className="lv-ic">
              <Ic d={s.icon} />
            </span>
            <b>{s.name}</b>
            <small>{s.sub}</small>
            <em>
              {s.price}
              <i>{s.per}</i>
            </em>
          </button>
        ))}
      </div>
      <div ref={panel} id="lv-panel" role="tabpanel" className={`lv-panel${Open ? " lv-panel-open" : ""}`} hidden={!Open}>
        {Open && <Open />}
      </div>
    </section>
  );
}

export function Work() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useAutoplay(root);
  const go = (dir: number) => {
    const t = track.current;
    if (!t) return;
    const card = t.querySelector<HTMLElement>(".lv-slide");
    t.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + 16), behavior: "smooth" });
  };
  return (
    <section ref={root} className="kit-sec dn-sec lv-sec" id="work" aria-labelledby="lv-work-h">
      <h2 className="dn-h2" id="lv-work-h">
        עבודות <span className="dn-grad">שבנינו</span>
      </h2>
      <p className="dn-p lv-sec-lead">מערכות ואתרים שעובדים היום אצל עסקים, כמו שהם נראים בטלפון. מחליקים הצידה לעוד.</p>
      <div className="lv-car">
        <div ref={track} className="lv-track" tabIndex={0} aria-label="עבודות שבנינו">
          {work.map((w) => (
            <article key={w.name} className="lv-slide">
              <span className="lv-phone">
                {w.img ? (
                  <img src={w.poster} alt={w.name} loading="lazy" decoding="async" />
                ) : (
                  <>
                    <img className="lv-poster" data-src={w.poster} alt="" decoding="async" aria-hidden />
                    <video className="lv-vid" data-src={w.video} muted loop playsInline preload="none" aria-label={`${w.k}: ${w.name}`} />
                  </>
                )}
              </span>
              <div className="lv-slide-t">
                <span className="lv-tier-k">{w.k}</span>
                <b>{w.name}</b>
                <span>{w.text}</span>
                {w.link &&
                  (w.link.wa ? (
                    <a href={waLink(w.link.wa)} target="_blank" rel="noopener">
                      {w.link.label}
                    </a>
                  ) : w.link.href.startsWith("#") ? (
                    <a href={w.link.href}>{w.link.label}</a>
                  ) : (
                    <a href={w.link.href} target="_blank" rel="noopener">
                      {w.link.label}
                    </a>
                  ))}
              </div>
            </article>
          ))}
        </div>
        <div className="lv-car-nav">
          <button type="button" aria-label="הקודם" onClick={() => go(1)}>
            <Ic d="M9.5 6l6 6-6 6" />
          </button>
          <button type="button" aria-label="הבא" onClick={() => go(-1)}>
            <Ic d="M14.5 6l-6 6 6 6" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Process() {
  return (
    <section className="kit-sec dn-sec lv-sec" id="process" aria-labelledby="lv-proc-h">
      <h2 className="dn-h2" id="lv-proc-h">
        איך עובדים <span className="dn-grad">איתנו</span>
      </h2>
      <ol className="lv-steps">
        {steps.map((s, i) => (
          <li key={s.name} style={{ "--n": i } as React.CSSProperties}>
            <span className="lv-step-n" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{s.name}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="lv-behind">
        <img src={behind.photo} alt="דניאל כהן" width={160} height={160} loading="lazy" decoding="async" />
        <p>
          <b>{behind.title}</b>
          {behind.text}
        </p>
      </div>
    </section>
  );
}

export function StudioDoor() {
  const root = useRef<HTMLElement>(null);
  useAutoplay(root);
  return (
    <section ref={root} className="kit-sec dn-sec lv-sec" id="studio-door" aria-label="Danielor Studio">
      <a className="lv-door" href={studio.href} target="_blank" rel="noopener">
        <span className="lv-door-reel" aria-hidden>
          {studio.reel.map((r) => (
            <span key={r.label} className="lv-door-clip">
              <img className="lv-poster" data-src={r.poster} alt="" decoding="async" />
              <video className="lv-vid" data-src={r.video} muted loop playsInline preload="none" />
              <i>{r.label}</i>
            </span>
          ))}
        </span>
        <span className="lv-door-t">
          <span className="lv-door-k" dir="ltr">
            {studio.k}
          </span>
          <b>
            {studio.title} <span className="dn-grad">{studio.hl}</span>
          </b>
          <span className="lv-door-d">{studio.text}</span>
          <span className="lv-door-go">{studio.go} ←</span>
        </span>
        <span className="lv-tape" aria-hidden>
          <span>
            {[...studio.tape, ...studio.tape, ...studio.tape].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </span>
        </span>
      </a>
    </section>
  );
}

export function Prices() {
  const [open, setOpen] = useState(false);
  return (
    <section className="kit-sec dn-sec lv-sec" id="prices" aria-labelledby="lv-price-h">
      <h2 className="dn-h2" id="lv-price-h">
        מחירים
      </h2>
      <p className="lv-hint">לחיצה פותחת את המחירון, לחיצה נוספת סוגרת.</p>
      <div className="lv-acc">
        <button type="button" className="lv-acc-btn" aria-expanded={open} aria-controls="lv-board" onClick={() => setOpen((o) => !o)}>
          <span className="lv-ic">
            <Ic d="M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
          </span>
          <span className="lv-acc-t">
            <b>מחירון לעסקים</b>
            <small>סוכן, אפליקציה ואתר</small>
          </span>
          <span className={`lv-chev${open ? " lv-chev-open" : ""}`} aria-hidden>
            <Ic d="M6 9.5l6 6 6-6" />
          </span>
        </button>
        <div className="lv-board" id="lv-board" hidden={!open}>
          <header>
            <h3>לעסקים</h3>
            <span>המחירים כוללים מע״מ</span>
          </header>
          {priceRows.map((r) => (
            <div key={r.name} className="lv-row">
              <span className="lv-row-n">{r.name}</span>
              <span className="lv-row-p">{r.price}</span>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
        <a className="lv-acc-btn" href={`${studio.href}#prices`} target="_blank" rel="noopener">
          <span className="lv-ic">
            <Ic d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z M10.2 11.4v5.2l4.3-2.6z" />
          </span>
          <span className="lv-acc-t">
            <b>מחירון הסטודיו</b>
            <small>סרטונים, פודקאסטים וטרנדים</small>
          </span>
          <span className="lv-chev" aria-hidden>
            ←
          </span>
        </a>
      </div>
      <p className="lv-small">המחירים כוללים מע״מ. את ההקמה אפשר לפרוס לשלושה תשלומים.</p>
    </section>
  );
}

/** the example in the idea box follows the product (as on the live site) */
function hint(p: string) {
  if (/טרנד/.test(p)) return "לדוגמה: טרנד מדף הטרנדים, או לינק לטרנד שאהבתם";
  if (/קליפ/.test(p)) return "לדוגמה: קליפ ליום ההולדת ה־40 של אמא, על שיר שהיא אוהבת";
  if (/פודקאסט/.test(p)) return "לדוגמה: פודקאסט שבועי על עסקים, רוצים רילסים מהפרק האחרון";
  if (/סוכן/.test(p)) return "לדוגמה: קליניקה שמקבלת הרבה שאלות בוואטסאפ על מחירים ותורים";
  if (/מצגת/.test(p)) return "לדוגמה: הצעת מחיר לשיפוצים שתיראה כמו ברושור";
  return "לדוגמה: סטודיו לכושר, רוצים סרטון לסטורי שמזמין לשיעור ניסיון";
}

export function Order() {
  const [name, setName] = useState("");
  const [product, setProduct] = useState(orderOptions[0].items[0]);
  const [idea, setIdea] = useState("");
  const [link, setLink] = useState("");
  const [err, setErr] = useState(false);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const on = (e: Event) => setProduct((e as CustomEvent<string>).detail);
    window.addEventListener("dn:pick", on);
    return () => window.removeEventListener("dn:pick", on);
  }, []);
  const message = useMemo(
    () =>
      [
        "היי Danielor" + (name.trim() ? ", אני " + name.trim() + "." : "."),
        "מעניין אותי: " + product,
        idea.trim() ? "הרעיון: " + idea.trim() : "",
        link.trim() ? "חומרים: " + link.trim() : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [name, product, idea, link],
  );
  return (
    <section className="kit-sec dn-sec lv-sec" id="order" aria-labelledby="lv-order-h">
      <div className="lv-order">
        <div>
          <h2 className="dn-h2" id="lv-order-h">
            ספרו לנו <span className="dn-grad">מה העסק צריך</span>
          </h2>
          <p className="dn-p">ממלאים כמה שורות, לוחצים על הכפתור, וההודעה נפתחת אצלכם בוואטסאפ מוכנה לשליחה. אנחנו חוזרים עם הצעה ומועד.</p>
        </div>
        <form className="lv-slip" noValidate onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>שם</span>
            <input value={name} onChange={(e) => (setName(e.target.value), setErr(false))} autoComplete="name" enterKeyHint="next" required />
          </label>
          <label>
            <span>מה מעניין אתכם</span>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              {orderOptions.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </optgroup>
              ))}
              <option>{orderUnsure}</option>
            </select>
          </label>
          <label>
            <span>ספרו בקצרה מה הרעיון</span>
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={hint(product)} />
          </label>
          <label>
            <span>לינק לחומרים (דרייב, לא חובה)</span>
            <input value={link} onChange={(e) => setLink(e.target.value)} type="url" dir="ltr" placeholder="https://drive.google.com/..." />
          </label>
          {err && <p className="lv-err">חסר שם, כדי שנדע איך לפנות אליכם.</p>}
          <a
            className="kit-btn dn-btn dn-btn-lg lv-send"
            href={waLink(message)}
            target="_blank"
            rel="noopener"
            onClick={(e) => {
              if (!name.trim()) {
                e.preventDefault();
                setErr(true);
              }
            }}
          >
            שליחה בוואטסאפ
          </a>
          <p className="lv-small">
            ההודעה נפתחת בוואטסאפ, ואתם רק לוחצים שליחה.{" "}
            <button
              type="button"
              className="lv-linkish"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(message)
                  .then(() => setCopied("ההודעה הועתקה. אפשר להדביק בוואטסאפ ל־" + WA_DISPLAY))
                  .catch(() => setCopied(""))
              }
            >
              או העתיקו את ההודעה
            </button>
          </p>
          <p className="lv-small" aria-live="polite">
            {copied}
          </p>
        </form>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="kit-sec dn-sec kit-faq lv-sec" id="faq" aria-labelledby="lv-faq-h">
      <h2 className="dn-h2" id="lv-faq-h">
        שאלות <span className="dn-grad">נפוצות</span>
      </h2>
      {faq.map((f, i) => (
        <details key={f.q} className="kit-faq-item dn-faq-item">
          <summary>
            <span className="lv-faq-n">{String(i + 1).padStart(2, "0")}</span> {f.q}
          </summary>
          <p className="kit-p">{f.a}</p>
        </details>
      ))}
      <div className="lv-faq-more">
        <span>יש שאלה שלא מופיעה כאן? כתבו לנו בוואטסאפ ונחזור אליכם.</span>
        <a className="kit-btn dn-btn" href={waLink("היי, יש לי שאלה")} target="_blank" rel="noopener">
          לשאול בוואטסאפ
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="kit-foot dn-foot lv-foot">
      <p className="dn-foot-brand" dir="ltr">
        DANI<span>ELOR</span>
      </p>
      <span>{company}</span>
      <nav className="lv-legal" aria-label="מידע משפטי">
        {legal.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener">
            {l.label}
          </a>
        ))}
      </nav>
      <span className="lv-contact">
        <a className="lv-wa-num" href={waLink()} target="_blank" rel="noopener" aria-label={`וואטסאפ ${WA_DISPLAY}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.3-.6L4 20l1.3-3.7A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5z" />
          </svg>
          <span dir="ltr">{WA_DISPLAY}</span>
        </a>
        <a href="https://danielor.ai" target="_blank" rel="noopener" dir="ltr">
          danielor.ai
        </a>
      </span>
    </footer>
  );
}
