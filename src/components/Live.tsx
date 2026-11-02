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
  const [at, setAt] = useState(0);
  useAutoplay(root);
  // one slide's step (the gap included), as the live site measures it
  const step = () => {
    const sl = track.current?.querySelectorAll<HTMLElement>(".wslide");
    return sl && sl.length > 1 ? Math.abs(sl[1].offsetLeft - sl[0].offsetLeft) : (track.current?.clientWidth ?? 300);
  };
  const go = (dir: number) => track.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const mark = () => {
      raf = 0;
      setAt(Math.min(work.length - 1, Math.round(Math.abs(t.scrollLeft) / Math.max(1, step()))));
    };
    const on = () => (raf ||= requestAnimationFrame(mark));
    t.addEventListener("scroll", on, { passive: true });
    return () => (t.removeEventListener("scroll", on), cancelAnimationFrame(raf));
  }, []);
  return (
    <section ref={root} className="kit-sec dn-sec lv-sec og" id="work" aria-labelledby="lv-work-h">
      <h2 className="dn-h2" id="lv-work-h">
        עבודות <span className="dn-grad">שבנינו</span>
      </h2>
      <p className="lead sec-lead">מערכות ואתרים שעובדים היום אצל עסקים, כמו שהם נראים בטלפון. מחליקים הצידה לעוד.</p>
      <div className="wcar">
        <div ref={track} className="wcar-track" tabIndex={0} aria-label="עבודות שבנינו">
          {work.map((w) => (
            <article key={w.name} className="wslide">
              <div className={`site-phone wphone${w.phone ? " " + w.phone : ""}`}>
                {w.img ? (
                  <img className="as-content" src={w.poster} alt={w.name} loading="lazy" decoding="async" />
                ) : (
                  <>
                    <img className="lv-poster" data-src={w.poster} alt="" decoding="async" aria-hidden />
                    <video className="lv-vid" data-src={w.video} muted loop playsInline preload="none" aria-label={`${w.k}: ${w.name}`} />
                  </>
                )}
              </div>
              <div className="wtxt">
                <span className="tier-k">{w.k}</span>
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
        <div className="wcar-nav">
          <button type="button" className="wcar-btn" aria-label="הקודם" onClick={() => go(1)}>
            <Ic d="M9.5 6l6 6-6 6" />
          </button>
          <span className="wcar-dots" aria-hidden>
            {work.map((w, k) => (
              <i key={w.name} className={k === at ? "on" : undefined} />
            ))}
          </span>
          <button type="button" className="wcar-btn" aria-label="הבא" onClick={() => go(-1)}>
            <Ic d="M14.5 6l-6 6 6 6" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Process() {
  const list = useRef<HTMLOListElement>(null);
  // the steps come in one by one; on a phone the step in the middle of the screen lights up
  useEffect(() => {
    const ol = list.current;
    if (!ol || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...ol.children] as HTMLElement[];
    ol.classList.add("reveal");
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = items.indexOf(e.target as HTMLElement);
          window.setTimeout(() => e.target.classList.add("in"), innerWidth > 760 ? i * 160 : 60);
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.3 },
    );
    items.forEach((li) => io.observe(li));
    let tick = 0;
    const act = () => {
      tick = 0;
      if (innerWidth > 760) return;
      const mid = innerHeight * 0.5;
      let best: HTMLElement | null = null;
      let bd = 1e9;
      items.forEach((li) => {
        const r = li.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < bd) {
          bd = d;
          best = li;
        }
      });
      items.forEach((li) => li.classList.toggle("on", li === best && bd < innerHeight * 0.35));
    };
    const on = () => (tick ||= requestAnimationFrame(act));
    window.addEventListener("scroll", on, { passive: true });
    act();
    return () => (io.disconnect(), window.removeEventListener("scroll", on), cancelAnimationFrame(tick));
  }, []);
  return (
    <section className="kit-sec dn-sec lv-sec og" id="process" aria-labelledby="lv-proc-h">
      <h2 className="dn-h2" id="lv-proc-h">
        איך עובדים <span className="dn-grad">איתנו</span>
      </h2>
      <ol ref={list} className="steps">
        {steps.map((s) => (
          <li key={s.name}>
            <h3>{s.name}</h3>
            <p>{s.text}</p>
            <span className="bar" aria-hidden />
          </li>
        ))}
      </ol>
      <div className="behind">
        <img className="bh-ph" src={behind.photo} alt="דניאל כהן" width={64} height={64} loading="lazy" decoding="async" />
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
  const [c, setC] = useState(0);
  const [shown, setShown] = useState(0);
  const [out, setOut] = useState(false);
  useAutoplay(root);
  const n = studio.reel.length;
  // the phones turn like a carousel while the card is on screen (and stop under the mouse)
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const spin = (on: boolean) => {
      clearInterval(timer);
      // the label under the front phone fades out, takes the new name and comes back
      if (on)
        timer = window.setInterval(() => {
          setC((k) => (k + 1) % n);
          setOut(true);
          window.setTimeout(() => (setShown((k) => (k + 1) % n), setOut(false)), 300);
        }, 2800);
    };
    const io = new IntersectionObserver((es) => spin(es[0].isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    const door = el.querySelector(".studio-door");
    const stop = () => spin(false);
    const go = () => spin(true);
    door?.addEventListener("mouseenter", stop);
    door?.addEventListener("mouseleave", go);
    return () => (clearInterval(timer), io.disconnect(), door?.removeEventListener("mouseenter", stop), door?.removeEventListener("mouseleave", go));
  }, [n]);
  return (
    <section ref={root} className="kit-sec dn-sec lv-sec og" id="studio-door" aria-label="Danielor Studio">
      <a className="studio-door" href={studio.href} target="_blank" rel="noopener">
        <span className="sdr-stage" aria-hidden>
          <span className="sdr-spot" />
          {studio.reel.map((r, i) => (
            <span key={r.label} className="sdr-ph" data-pos={(i - c + n) % n}>
              <img className="lv-poster" data-src={r.poster} alt="" decoding="async" />
              <video className="lv-vid" data-src={r.video} muted loop playsInline preload="none" />
            </span>
          ))}
          <span className={`sdr-label${out ? " out" : ""}`}>{studio.reel[shown].label}</span>
          <i className="bs-sp q1" />
          <i className="bs-sp q2" />
          <i className="bs-sp q3" />
          <i className="bs-sp q4" />
        </span>
        <span className="sdr-text">
          <span className="sdr-k" dir="ltr">
            {studio.k}
          </span>
          <b>
            {studio.title} <span className="sdr-hl">{studio.hl}</span>
          </b>
          <span className="sdr-d">{studio.text}</span>
          <span className="sdr-go">
            {studio.go} <span className="sdr-arr">←</span>
          </span>
        </span>
        <span className="sdr-tape" aria-hidden>
          <span className="sdr-track">
            {[...studio.tape, ...studio.tape].map((t, i) => (
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
    <section className="kit-sec dn-sec lv-sec og" id="prices" aria-labelledby="lv-price-h">
      <h2 className="dn-h2" id="lv-price-h">
        מחירים
      </h2>
      <p className="price-hint">לחיצה פותחת את המחירון, לחיצה נוספת סוגרת.</p>
      <div className="price-acc">
        <button type="button" className="pt-btn" aria-expanded={open} aria-controls="pb-biz" onClick={() => setOpen((o) => !o)}>
          <span className="pt-ic" aria-hidden>
            <svg viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
            </svg>
          </span>
          <span className="pt-t">
            <b>מחירון לעסקים</b>
            <small>סוכן, אפליקציה ואתר</small>
          </span>
          <span className="pt-chev" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M6 9.5l6 6 6-6" />
            </svg>
          </span>
        </button>
        <div className="pt-panel" id="pb-biz" hidden={!open}>
          <div className="board">
            <header>
              <span className="vat">המחירים כוללים מע״מ</span>
            </header>
            {priceRows.map((r, i) => (
              <div key={r.name} className={`row${i === 0 ? " entry" : ""}`}>
                <span className="name">{r.name}</span>
                <span className={`price${/הצעה/.test(r.price) ? " quote" : ""}`}>{r.price}</span>
                <p className="desc">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <a className="pt-btn pt-link" href={`${studio.href}#prices`} target="_blank" rel="noopener">
          <span className="pt-ic" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
              <path d="M10.2 11.4v5.2l4.3-2.6z" />
            </svg>
          </span>
          <span className="pt-t">
            <b>מחירון הסטודיו</b>
            <small>סרטונים, פודקאסטים וטרנדים</small>
          </span>
          <span className="pt-chev" aria-hidden>
            ←
          </span>
        </a>
      </div>
      <p className="note">המחירים כוללים מע״מ. את ההקמה אפשר לפרוס לשלושה תשלומים.</p>
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
    <section className="kit-sec dn-sec lv-sec og" id="order" aria-labelledby="lv-order-h">
      <div className="order">
        <div>
          <h2 className="dn-h2" id="lv-order-h">
            ספרו לנו <span className="dn-grad">מה העסק צריך</span>
          </h2>
          <p className="lead">ממלאים כמה שורות, לוחצים על הכפתור, וההודעה נפתחת אצלכם בוואטסאפ מוכנה לשליחה. אנחנו חוזרים עם הצעה ומועד.</p>
        </div>
        <form className="slip" noValidate onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="f-name">שם</label>
            <input id="f-name" value={name} onChange={(e) => (setName(e.target.value), setErr(false))} autoComplete="name" enterKeyHint="next" required />
          </div>
          <div className="field">
            <label htmlFor="f-product">מה מעניין אתכם</label>
            <select id="f-product" value={product} onChange={(e) => setProduct(e.target.value)}>
              {orderOptions.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </optgroup>
              ))}
              <option>{orderUnsure}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-idea">ספרו בקצרה מה הרעיון</label>
            <textarea id="f-idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={hint(product)} />
          </div>
          <div className="field">
            <label htmlFor="f-link">לינק לחומרים (דרייב, לא חובה)</label>
            <input id="f-link" value={link} onChange={(e) => setLink(e.target.value)} type="url" dir="ltr" placeholder="https://drive.google.com/..." />
          </div>
          {err && <p className="err">חסר שם, כדי שנדע איך לפנות אליכם.</p>}
          <a
            className="btn btn-pink send"
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
          <p className="small send-note">
            ההודעה נפתחת בוואטסאפ, ואתם רק לוחצים שליחה.{" "}
            <button
              type="button"
              className="linkish"
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
          <p className="small" aria-live="polite">
            {copied}
          </p>
        </form>
      </div>
    </section>
  );
}

export function Faq() {
  const box = useRef<HTMLDivElement>(null);
  // open and close with a smooth height and fade; opening one closes the others (as on the live site)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLDetailsElement>("details")];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EASE = "cubic-bezier(.3,.9,.3,1)";
    const anims = new Map<HTMLDetailsElement, Animation>();
    const run = (d: HTMLDetailsElement, opening: boolean) => {
      const ans = d.querySelector<HTMLElement>(".ans");
      const p = ans?.firstElementChild as HTMLElement | null;
      anims.get(d)?.cancel();
      anims.delete(d);
      if (opening) {
        d.open = true;
        d.classList.add("is-open");
      } else d.classList.remove("is-open");
      if (reduce || !ans || !p || !ans.animate) {
        if (!opening) d.open = false;
        return;
      }
      const from = opening ? 0 : ans.offsetHeight;
      const to = opening ? ans.scrollHeight : 0;
      const a = ans.animate([{ height: from + "px" }, { height: to + "px" }], { duration: opening ? 480 : 380, easing: EASE });
      p.animate(opening ? [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }] : [{ opacity: 1 }, { opacity: 0 }], {
        duration: opening ? 420 : 220,
        delay: opening ? 90 : 0,
        easing: EASE,
        fill: "backwards",
      });
      anims.set(d, a);
      a.onfinish = () => {
        anims.delete(d);
        if (!opening) d.open = false;
      };
    };
    const offs = items.map((d) => {
      const s = d.querySelector("summary");
      const on = (e: Event) => {
        e.preventDefault();
        const opening = !d.classList.contains("is-open");
        if (opening) items.forEach((o) => o !== d && o.classList.contains("is-open") && run(o, false));
        run(d, opening);
      };
      s?.addEventListener("click", on);
      return () => s?.removeEventListener("click", on);
    });
    return () => offs.forEach((f) => f());
  }, []);
  return (
    <section className="kit-sec dn-sec lv-sec og" id="faq" aria-labelledby="lv-faq-h">
      <h2 className="dn-h2" id="lv-faq-h">
        שאלות <span className="dn-grad">נפוצות</span>
      </h2>
      <div ref={box} className="faq">
        {faq.map((f, i) => (
          <details key={f.q}>
            <summary>
              <span className="q-n" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="q-t">{f.q}</span>
              <span className="q-i" aria-hidden />
            </summary>
            <div className="ans">
              <p>{f.a}</p>
            </div>
          </details>
        ))}
      </div>
      <div className="faq-cta">
        <div>
          <b>יש שאלה שלא מופיעה כאן?</b>
          <span>כתבו לנו בוואטסאפ ונחזור אליכם.</span>
        </div>
        <a className="btn btn-pink" href={waLink("היי, יש לי שאלה")} target="_blank" rel="noopener">
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
