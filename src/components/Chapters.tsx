// What each chapter of the film shows besides its caption (Daniel, 02.11:
// "dress it in the elements of my existing site"): the WhatsApp agent talking,
// the app's screens, the studio's reel, the businesses we already built for,
// who is behind Danielor, and the sites we made. One element per chapter,
// driven by the film's progress like the captions, so it plays backwards too.
//
// On a computer it sits in the left-hand column (the caption has the right one,
// the story's object the middle). On a phone it takes the caption's place once
// the caption has gone, so the two never stack, and long lists come one item
// at a time. Every window is in film progress of its own scene:
//   data-from / data-to       a computer
//   data-mfrom / data-mto     a phone (no window: not shown on a phone)
//   data-at                   when a child arrives, as a share of the window
//   data-one                  a phone shows one child at a time
// Motion: chapterAt(host, p, reduced) every frame.
import { behind, bizapp, built, chat, sites, studio, waLink, work, agent } from "@/live";

type Win = { from: number; to: number; mfrom?: number; mto?: number; place?: "top" | "bottom" };

function Ch({ w, kind, one, children }: { w: Win; kind: string; one?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`ch ch-${kind} ch-m-${w.place ?? "bottom"}`}
      data-from={w.from}
      data-to={w.to}
      data-mfrom={w.mfrom}
      data-mto={w.mto}
      data-one={one ? "" : undefined}
    >
      {children}
    </div>
  );
}

/** the demo conversation, as a WhatsApp screen; each message arrives at its turn */
export function ChatPhone({ stagger = true }: { stagger?: boolean }) {
  const n = chat.msgs.length;
  return (
    <div className="wa" aria-label="שיחה לדוגמה עם סוכן וואטסאפ של קליניקה">
      <div className="wa-top">
        <span className="wa-av" aria-hidden>
          {chat.initial}
        </span>
        <span className="wa-who">
          <b>{chat.who}</b>
          <small>מקליד/ה...</small>
        </span>
      </div>
      <div className="wa-body">
        {chat.msgs.map((m, i) => (
          <div key={i} className={`wa-msg wa-${m.side}${m.voice ? " wa-voice" : ""}`} data-at={stagger ? (0.04 + (i / n) * 0.78).toFixed(3) : undefined}>
            {m.voice ? (
              <>
                <span className="wa-play" aria-hidden />
                <span className="wa-wave" aria-hidden>
                  {Array.from({ length: 16 }, (_, k) => (
                    <i key={k} style={{ "--k": k } as React.CSSProperties} />
                  ))}
                </span>
              </>
            ) : (
              <p>
                {m.label && <b>{m.label} </b>}
                {m.text}
              </p>
            )}
            {m.link && <span className="wa-link">{m.link}</span>}
            <time>{m.time}</time>
          </div>
        ))}
      </div>
    </div>
  );
}

function Spark() {
  return (
    <Ch w={{ from: 0.4, to: 1, mfrom: 0.78, mto: 1, place: "top" }} kind="chat" one>
      <ChatPhone />
      <a className="ch-cta ch-keep" href={waLink(agent.ctaText)} target="_blank" rel="noopener" data-at="0.86">
        {agent.cta}
      </a>
    </Ch>
  );
}

function Clinic() {
  return (
    <Ch w={{ from: 0.3, to: 0.94, mfrom: 0.62, mto: 0.95, place: "top" }} kind="app">
      <div className="ch-phones">
        {bizapp.screens.map((s, i) => (
          <figure key={s.src} className="ch-phone" data-at={(0.06 + i * 0.16).toFixed(2)}>
            <span className="ch-screen">
              {/* the screen scrolls with the film (--s, set by the driver) */}
              <img
                src={s.src}
                alt={s.alt}
                width={s.w}
                height={s.h}
                loading="lazy"
                decoding="async"
                // how far the screenshot travels: its height beyond the screen
                style={{ "--travel": `-${Math.max(0, Math.round((1 - (19.5 / 9) * (s.w / s.h)) * 100))}%` } as React.CSSProperties}
              />
            </span>
            <figcaption>
              <b>{s.name}</b>
              <span>{s.sub}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="ch-note ch-keep" data-at="0.4">
        {bizapp.caption}
      </p>
    </Ch>
  );
}

function Studio() {
  return (
    <Ch w={{ from: 0.36, to: 0.96, mfrom: 0.78, mto: 1, place: "bottom" }} kind="studio">
      <span className="ch-k ch-keep" data-at="0">
        {studio.k}
      </span>
      <div className="ch-reel">
        {studio.reel.map((r, i) => (
          <figure key={r.label} className="ch-clip" data-at={(0.06 + i * 0.08).toFixed(2)}>
            <video muted loop playsInline preload="none" poster={r.poster} data-src={r.video} aria-hidden />
            <figcaption>{r.label}</figcaption>
          </figure>
        ))}
      </div>
      <a className="ch-go ch-keep" href={studio.href} target="_blank" rel="noopener" data-at="0.5">
        {studio.go} ←
      </a>
    </Ch>
  );
}

function Built() {
  return (
    <Ch w={{ from: 0.08, to: 0.46, mfrom: 0.44, mto: 0.76, place: "bottom" }} kind="built" one>
      <p className="ch-h ch-keep" data-at="0">
        {built.title} <span>{built.hl}</span>
      </p>
      {built.items.map((b, i) => (
        <div key={b.name} className="ch-item" data-at={(0.12 + i * 0.2).toFixed(2)}>
          <span className="ch-ic" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d={b.icon} />
            </svg>
          </span>
          <b>{b.name}</b>
          <span>{b.text}</span>
        </div>
      ))}
    </Ch>
  );
}

function Who() {
  return (
    <Ch w={{ from: 0.81, to: 1, mfrom: 0.8, mto: 1, place: "top" }} kind="who">
      <img className="ch-who-ph" src={behind.photo} alt="דניאל כהן" width={160} height={160} loading="lazy" decoding="async" />
      <p>
        <b>{behind.title}</b>
        {behind.text}
      </p>
    </Ch>
  );
}

function Sites() {
  const list = work.filter((w) => w.k !== "סוכן וואטסאפ" && !w.img);
  return (
    <Ch w={{ from: 0.07, to: 0.48, mfrom: 0.3, mto: 0.47, place: "top" }} kind="sites">
      <span className="ch-k ch-keep" data-at="0">
        {sites.tiers[2].name}
      </span>
      <div className="ch-phones">
        {list.map((w, i) => (
          <figure key={w.name} className="ch-phone" data-at={(0.08 + i * 0.12).toFixed(2)}>
            <span className="ch-screen">
              <video muted loop playsInline preload="none" poster={w.poster} data-src={w.video} data-wide-only aria-label={`גלילה באתר של ${w.name}`} />
            </span>
            <figcaption>
              <b>{w.name}</b>
              <span>{w.k}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Ch>
  );
}

/** the element of each scene, by scene name */
export const chapters: Record<string, React.ReactNode> = {
  spark: <Spark />,
  clinic: <Clinic />,
  studio: <Studio />,
  city: (
    <>
      <Built />
      <Who />
    </>
  ),
  sky: <Sites />,
};

// ---------- motion ----------

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

const last = new WeakMap<HTMLElement, string>();
function set(el: HTMLElement, css: Record<string, string>) {
  const key = JSON.stringify(css);
  if (last.get(el) === key) return;
  last.set(el, key);
  Object.assign(el.style, css);
}

let wideQ: MediaQueryList | null = null;
const isWide = () => (wideQ ??= window.matchMedia("(min-aspect-ratio: 4/3)")).matches;

function playIf(v: HTMLVideoElement, on: boolean) {
  if (on) {
    if (!v.src && v.dataset.src && (isWide() || !("wideOnly" in v.dataset))) v.src = v.dataset.src;
    if (v.src && v.paused) v.play().catch(() => {});
  } else if (!v.paused) v.pause();
}

export function chapterAt(host: HTMLElement, p: number, reduced: boolean) {
  const wide = isWide();
  host.querySelectorAll<HTMLElement>(".ch").forEach((el) => {
    const d = el.dataset;
    const from = Number(wide ? d.from : d.mfrom);
    const to = Number(wide ? d.to : d.mto);
    const has = wide ? d.from !== undefined : d.mfrom !== undefined;
    const k = has && to > from ? (p - from) / (to - from) : -1;
    const on = has && k > 0 && k < 1;
    if (!on) {
      set(el, { visibility: "hidden", opacity: "0" });
      el.querySelectorAll("video").forEach((v) => playIf(v, false));
      return;
    }
    const inn = reduced ? 1 : smooth(k / 0.1);
    const out = reduced ? 0 : to >= 1 ? 0 : smooth((k - 0.9) / 0.1);
    const lift = (1 - inn) * 26 - out * 26;
    set(el, {
      visibility: "inherit",
      opacity: (inn * (1 - out)).toFixed(3),
      transform: `translate3d(0, ${lift.toFixed(1)}px, 0)`,
      filter: inn < 1 || out > 0 ? `blur(${((1 - inn) * 8 + out * 8).toFixed(2)}px)` : "none",
    });
    // children arrive at their turn; on a phone a "one" element shows only the newest
    const kids = Array.from(el.querySelectorAll<HTMLElement>("[data-at]"));
    const one = !wide && "one" in d;
    let newest = -1;
    if (one) kids.forEach((c, i) => Number(c.dataset.at) <= k && !c.classList.contains("ch-keep") && (newest = i));
    kids.forEach((c, i) => {
      const at = Number(c.dataset.at);
      let a = reduced ? (k >= at ? 1 : 0) : smooth((k - at) / 0.07);
      const gone = one && i !== newest && !c.classList.contains("ch-keep");
      if (gone) a = 0;
      set(c, {
        opacity: a.toFixed(3),
        transform: `translate3d(0, ${((1 - a) * 14).toFixed(1)}px, 0) scale(${(0.96 + 0.04 * a).toFixed(3)})`,
        display: gone ? "none" : "",
      });
      c.querySelectorAll("video").forEach((v) => playIf(v, a > 0.05));
    });
    // a screen that scrolls with the film
    el.style.setProperty("--s", clamp01(k).toFixed(3));
  });
}
