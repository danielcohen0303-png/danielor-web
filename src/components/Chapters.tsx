// What each chapter of the film shows besides its caption (Daniel, 02.11:
// "dress it in the elements of my existing site"): the WhatsApp agent talking,
// the app's screens, the studio's reel, the businesses we already built for,
// who is behind Danielor, and the sites we made.
//
// Nothing sits on a card; everything floats, and comes out of the object in
// the picture (the phone on the table, the tablet on the desk, the lens).
// (The neon line round the groups is gone: on an iPhone it, and the layers it
// kept alive, weighed down the scroll. Daniel, 02.11: "it is pretty enough
// without it".) A chapter that is not on screen is not rendered at all, so
// nothing of it costs the phone anything.
//
// One window per chapter, shared with its caption (src/site.config.ts): the
// caption and the elements come in together and leave together, so the screen
// is never left half empty (Daniel, 02.11).
//
// On a computer it sits in the left-hand column (the caption has the right one,
// the story's object the middle). On a phone it takes the half of the screen
// the caption leaves free, and lists come one at a time.
// Attributes on .ch:
//   data-from / data-to       the window, in film progress of the scene
//   data-ax / data-ay         the object the items fly out of, on a computer (% of the frame)
//   data-max / data-may       the same on a phone
//   data-at (on items)        when an item arrives, as a share of the window
//   data-one                  a phone shows one item at a time
// Motion: chapterAt(host, p, reduced) every frame.
import { Fragment } from "react";
import { agent, behind, bizapp, built, chat, filmSites, sites, studio, waLink } from "@/live";
import { scenes } from "@/site.config";

type Pt = [number, number];
type Place = "top" | "mid" | "bottom";

/** the window of a scene's caption: its chapter shares it */
function win(scene: string, i = 0) {
  const c = scenes.find((s) => s.name === scene)?.captions?.[i];
  return { from: c?.from ?? 0, to: c?.to ?? 1 };
}

function Ch({
  scene,
  cap = 0,
  place = "bottom",
  kind,
  one,
  anchor,
  manchor,
  children,
}: {
  scene: string;
  /** which of the scene's captions this chapter goes with */
  cap?: number;
  /** where it sits on a phone: the half the caption leaves free */
  place?: Place;
  kind: string;
  one?: boolean;
  /** the object in the picture the items fly out of, % of the frame (computer, phone) */
  anchor?: Pt;
  manchor?: Pt;
  children: React.ReactNode;
}) {
  const w = win(scene, cap);
  return (
    <>
      <div
        className={`ch ch-${kind} ch-m-${place}`}
        data-from={w.from}
        data-to={w.to}
        data-ax={anchor?.[0]}
        data-ay={anchor?.[1]}
        data-max={manchor?.[0]}
        data-may={manchor?.[1]}
        data-one={one ? "" : undefined}
      >
        {children}
      </div>
    </>
  );
}


/** one thing that arrives: flies out of the anchor, then floats */
function It({ at, i, className = "", keep, children }: { at: number; i: number; className?: string; keep?: boolean; children: React.ReactNode }) {
  return (
    <div className={`it ${className}${keep ? " ch-keep" : ""}`} data-at={at.toFixed(3)}>
      <div className="fl" style={{ "--d": i } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}

/** the demo conversation as a WhatsApp screen (the solutions, after the film) */
export function ChatPhone() {
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
          <div key={i} className={`wa-msg wa-${m.side}${m.voice ? " wa-voice" : ""}`}>
            <Msg m={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Msg({ m }: { m: (typeof chat.msgs)[number] }) {
  return (
    <>
      {m.voice ? (
        <>
          <span className="wa-play" aria-hidden />
          <span className="wa-wave" aria-hidden>
            {Array.from({ length: 16 }, (_, k) => (
              <i key={k} style={{ "--k": k, "--h": (k * 7) % 15 } as React.CSSProperties} />
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
    </>
  );
}

// the messages float out of the phone on the table, one by one
function Spark() {
  return (
    <Ch scene="spark" place="mid" kind="chat" one anchor={[50, 72]} manchor={[50, 80]}>
      <It at={0} i={0} className="ch-tag" keep>
        <span className="ch-tag-av" aria-hidden>
          {chat.initial}
        </span>
        <b>{chat.who}</b>
        <small>מקליד/ה...</small>
      </It>
      <div className="ch-bubbles" aria-label="שיחה לדוגמה עם סוכן וואטסאפ של קליניקה">
        {chat.msgs.map((m, i) => (
          <It key={i} at={0.04 + i * 0.12} i={i + 1} className={`bub bub-${m.side}${m.voice ? " bub-voice" : ""}`}>
            <Msg m={m} />
          </It>
        ))}
      </div>
      <a className="ch-cta ch-keep" href={waLink(agent.ctaText)} target="_blank" rel="noopener" data-at="0.62">
        {agent.cta}
      </a>
    </Ch>
  );
}

// the app's two screens float up out of the tablet on the reception desk, tilted, scrolling
function Clinic() {
  return (
    <Ch scene="clinic" place="bottom" kind="app" anchor={[61, 60]} manchor={[56, 62]}>
      <div className="ch-phones">
        {bizapp.screens.map((s, i) => (
          <It key={s.src} at={0.06 + i * 0.14} i={i} className={`ch-phone ch-phone-${i}`}>
            <span className="ch-dev">
              <span className="ch-screen">
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
                <i className="ch-sheen" aria-hidden />
              </span>
            </span>
            <span className="ch-cap">
              <b>{s.name}</b>
              <span>{s.sub}</span>
            </span>
          </It>
        ))}
      </div>
      <p className="ch-note ch-keep halo" data-at="0.34">
        {bizapp.caption}
      </p>
    </Ch>
  );
}

// the studio's clips fly out of the lens and settle in an arc
function Studio() {
  return (
    <Ch scene="studio" place="top" kind="studio" anchor={[50, 50]} manchor={[50, 45]}>
      <span className="ch-k ch-keep" data-at="0">
        {studio.k}
      </span>
      <div className="ch-reel">
        {studio.reel.map((r, i) => (
          <It key={r.label} at={0.06 + i * 0.07} i={i} className="ch-clip">
            <span className="ch-clip-v" style={{ "--n": i - 2 } as React.CSSProperties}>
              <span className="ch-dev">
                <video muted loop playsInline preload="none" poster={r.poster} data-src={r.video} data-wide-only aria-hidden />
              </span>
              <i>{r.label}</i>
            </span>
          </It>
        ))}
      </div>
      <a className="ch-go ch-keep" href={studio.href} target="_blank" rel="noopener" data-at="0.44">
        {studio.go} ←
      </a>
    </Ch>
  );
}

// the businesses open one by one, and the ribbon flows down around each of them
function Built() {
  return (
    <Ch scene="city" place="top" kind="built" one>
      <p className="ch-h ch-keep halo" data-at="0">
        {built.title} <span>{built.hl}</span>
      </p>
      {built.items.map((b, i) => (
        <It key={b.name} at={0.1 + i * 0.14} i={i} className="ch-pin">
          <span className="ch-pin-ic">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={b.icon} />
            </svg>
          </span>
          <span className="ch-pin-t halo">
            <b>{b.name}</b>
            <span>{b.text}</span>
          </span>
        </It>
      ))}
    </Ch>
  );
}

// the photo glows, with a few sparks twinkling round it
function Who() {
  return (
    <Ch scene="city" cap={1} place="top" kind="who">
      <It at={0.02} i={0} className="ch-who-ph">
        <img src={behind.photo} alt="דניאל כהן" width={160} height={160} loading="lazy" decoding="async" />
        {Array.from({ length: 6 }, (_, k) => (
          <i key={k} className="ch-twinkle" style={{ "--k": k } as React.CSSProperties} aria-hidden />
        ))}
      </It>
      <It at={0.1} i={1} className="ch-who-t">
        <p className="halo">
          <b>{behind.title}</b>
          {behind.text}
        </p>
      </It>
    </Ch>
  );
}

// the three story sites rise out of the clouds, each at its own depth; each one opens its site
function Sites() {
  return (
    <Ch scene="sky" place="top" kind="sites" anchor={[48, 96]} manchor={[50, 96]}>
      <span className="ch-k ch-keep" data-at="0">
        {sites.tiers[2].name}
      </span>
      <div className="ch-phones">
        {filmSites.map((w, i) => (
          <It key={w.name} at={0.08 + i * 0.12} i={i} className={`ch-phone ch-depth-${i}`}>
            <a className="ch-site" href={w.href} {...(w.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} aria-label={`${w.name}, ${w.go}`}>
              <span className="ch-dev">
                <span className="ch-screen">
                  <video muted loop playsInline preload="none" poster={w.poster} data-src={w.video} data-wide-only aria-hidden />
                  <i className="ch-sheen" aria-hidden />
                </span>
              </span>
              <span className="ch-cap">
                <b>{w.name}</b>
                <span className="ch-site-go">{w.go}</span>
              </span>
            </a>
          </It>
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
    <Fragment>
      <Built />
      <Who />
    </Fragment>
  ),
  sky: <Sites />,
};

// ---------- motion ----------

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

const last = new WeakMap<Element, string>();
function set(el: HTMLElement | SVGElement, css: Record<string, string>) {
  const key = JSON.stringify(css);
  if (last.get(el) === key) return;
  last.set(el, key);
  Object.assign(el.style, css);
}

let wideQ: MediaQueryList | null = null;
const isWide = () => (wideQ ??= window.matchMedia("(min-aspect-ratio: 4/3)")).matches;

// layout changes (a resize) make every cached path and offset stale
let geo = 0;
if (typeof window !== "undefined") window.addEventListener("resize", () => geo++);

function playIf(v: HTMLVideoElement, on: boolean) {
  if (on) {
    if (!v.src && v.dataset.src && (isWide() || !("wideOnly" in v.dataset))) v.src = v.dataset.src;
    if (v.src && v.paused) v.play().catch(() => {});
  } else if (!v.paused) v.pause();
}

/** position of el inside root, from layout (transforms ignored, so arrivals don't move the targets) */
function posIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let e: HTMLElement | null = el;
  while (e && e !== root) {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

let liteQ: MediaQueryList | null = null;
/** a phone: no blur while things move (it is costly there) */
const isLite = () => (liteQ ??= window.matchMedia("(pointer: coarse)")).matches;

type Fly = { v: number; dx: number; dy: number };
const flies = new WeakMap<HTMLElement, Fly>();
const kidsOf = new WeakMap<HTMLElement, HTMLElement[]>();

export function chapterAt(host: HTMLElement, p: number, reduced: boolean) {
  const wide = isWide();
  const lite = isLite();
  const W = host.offsetWidth;
  const H = host.offsetHeight;
  host.querySelectorAll<HTMLElement>(".ch").forEach((el) => {
    const d = el.dataset;
    const from = Number(d.from);
    const to = Number(d.to);
    const k = to > from ? (p - from) / (to - from) : -1;
    const on = k > 0 && k < 1;
    if (!on) {
      // not on screen: not rendered at all (no layers, no animations for the phone
      // to keep). A chapter is off until it is on, from the first paint (live.css)
      if (el.classList.contains("ch-on")) {
        el.classList.remove("ch-on");
        last.delete(el);
        el.querySelectorAll("video").forEach((v) => playIf(v, false));
      }
      return;
    }
    if (!el.classList.contains("ch-on")) el.classList.add("ch-on");
    // in with the caption, out with the caption: the same curve (src/film/Kinetic.tsx)
    const inn = reduced ? 1 : smooth(k / 0.06);
    const out = reduced ? 0 : smooth((k - 0.82) / 0.18);
    const op = inn * (1 - out);
    const lift = -out * 28;

    // the object in the picture the items fly out of
    const ax = Number(wide ? d.ax : d.max);
    const ay = Number(wide ? d.ay : d.may);
    const hasAnchor = (wide ? d.ax !== undefined : d.max !== undefined) && !Number.isNaN(ax);
    const A: Pt = [(ax / 100) * W, (ay / 100) * H];

    // items arrive at their turn; on a phone a "one" element shows only the newest
    let kids = kidsOf.get(el);
    if (!kids) kidsOf.set(el, (kids = Array.from(el.querySelectorAll<HTMLElement>("[data-at]"))));
    const one = !wide && "one" in d;
    let newest = -1;
    if (one) kids.forEach((c, i) => Number(c.dataset.at) <= k && !c.classList.contains("ch-keep") && (newest = i));

    set(el, {
      visibility: "inherit",
      opacity: op.toFixed(3),
      transform: `translate3d(0, ${lift.toFixed(1)}px, 0)`,
      filter: out > 0 && !lite ? `blur(${(out * 7).toFixed(2)}px)` : "none",
    });

    kids.forEach((c, i) => {
      const at = Number(c.dataset.at);
      const gone = one && i !== newest && !c.classList.contains("ch-keep");
      const a = gone ? 0 : reduced ? (k >= at ? 1 : 0) : smooth((k - at) / 0.08);
      // where it flies in from: towards the object, a third of the way
      let f = flies.get(c);
      if (!f || f.v !== geo) {
        const b = posIn(c, host);
        const vx = hasAnchor ? A[0] - (b.x + b.w / 2) : 0;
        const vy = hasAnchor ? A[1] - (b.y + b.h / 2) : 40;
        const len = Math.hypot(vx, vy) || 1;
        const s = Math.min(160, len * 0.35) / len;
        f = { v: geo, dx: vx * s, dy: vy * s };
        if (c.offsetWidth) flies.set(c, f);
      }
      const r = 1 - a;
      set(c, {
        opacity: a.toFixed(3),
        transform: `translate3d(${(f.dx * r).toFixed(1)}px, ${(f.dy * r).toFixed(1)}px, 0) scale(${(0.78 + 0.22 * a).toFixed(3)})`,
        filter: a > 0 && a < 1 && !lite ? `blur(${(r * 9).toFixed(2)}px)` : "none",
        display: gone ? "none" : "",
      });
      c.querySelectorAll("video").forEach((v) => playIf(v, a > 0.05));
    });

    // a screen that scrolls with the film
    el.style.setProperty("--s", clamp01(k).toFixed(3));
  });
}
