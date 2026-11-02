// What each chapter of the film shows besides its caption (Daniel, 02.11:
// "dress it in the elements of my existing site"): the WhatsApp agent talking,
// the app's screens, the studio's reel, the businesses we already built for,
// who is behind Danielor, and the sites we made.
//
// The spark draws each of them in the air (Daniel, 02.11: "no banal
// background, floating on the screen like magic"): a point of light leaves the
// object in the picture (the phone on the table, the tablet on the desk, the
// lens) and pulls a neon thread to where the element will be; there it draws a
// neon outline and the element materialises, blurred to sharp, flying out from
// the object. Nothing sits on a card; everything floats, weightless.
// Driven by the film's progress like the captions, so it plays backwards too.
//
// On a computer it sits in the left-hand column (the caption has the right one,
// the story's object the middle). On a phone it takes the caption's place once
// the caption has gone, so the two never stack, and lists come one at a time.
// Windows are in film progress of the element's own scene:
//   data-from / data-to       a computer      data-ax / data-ay    where the thread starts (% of the frame)
//   data-mfrom / data-mto     a phone         data-max / data-may  the same on a phone
//   data-at                   when an item arrives, as a share of the window
//   data-one                  a phone shows one item at a time
// Motion: chapterAt(host, p, reduced) every frame.
import { Fragment } from "react";
import { agent, behind, bizapp, built, chat, sites, studio, waLink, work } from "@/live";

type Win = { from: number; to: number; mfrom?: number; mto?: number; place?: "top" | "bottom" };
type Pt = [number, number];

function Ch({
  w,
  kind,
  one,
  anchor,
  manchor,
  children,
}: {
  w: Win;
  kind: string;
  one?: boolean;
  /** the object in the picture the thread starts from, % of the frame (computer, phone) */
  anchor?: Pt;
  manchor?: Pt;
  children: React.ReactNode;
}) {
  return (
    <>
      {(anchor || manchor) && (
        <svg className="ch-thread" aria-hidden>
          <path className="th-glow" />
          <path className="th-line" />
          <circle className="th-dot" r="4" />
        </svg>
      )}
      <div
        className={`ch ch-${kind} ch-m-${w.place ?? "bottom"}`}
        data-from={w.from}
        data-to={w.to}
        data-mfrom={w.mfrom}
        data-mto={w.mto}
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

/** a neon outline the spark draws around its parent (a rounded rectangle, or a circle) */
function Trace({ r = 16, circle }: { r?: number; circle?: boolean }) {
  return (
    <svg className="tr" aria-hidden data-r={r} data-circle={circle ? "" : undefined}>
      <path className="tr-glow" />
      <path className="tr-line" />
      <circle className="tr-dot" r="3.5" />
    </svg>
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
  const n = chat.msgs.length;
  return (
    <Ch w={{ from: 0.4, to: 1, mfrom: 0.78, mto: 1, place: "top" }} kind="chat" one anchor={[50, 72]} manchor={[50, 80]}>
      <It at={0} i={0} className="ch-tag" keep>
        <span className="ch-tag-av" aria-hidden>
          {chat.initial}
        </span>
        <b>{chat.who}</b>
        <small>מקליד/ה...</small>
      </It>
      <div className="ch-bubbles" aria-label="שיחה לדוגמה עם סוכן וואטסאפ של קליניקה">
        {chat.msgs.map((m, i) => (
          <It key={i} at={0.05 + (i / n) * 0.74} i={i + 1} className={`bub bub-${m.side}${m.voice ? " bub-voice" : ""}`}>
            <Trace r={18} />
            <Msg m={m} />
          </It>
        ))}
      </div>
      <a className="ch-cta ch-keep" href={waLink(agent.ctaText)} target="_blank" rel="noopener" data-at="0.86">
        {agent.cta}
      </a>
    </Ch>
  );
}

// the app's two screens float up out of the tablet on the reception desk, tilted, scrolling
function Clinic() {
  return (
    <Ch w={{ from: 0.3, to: 0.94, mfrom: 0.62, mto: 0.95, place: "top" }} kind="app" anchor={[61, 60]} manchor={[56, 62]}>
      <div className="ch-phones">
        {bizapp.screens.map((s, i) => (
          <It key={s.src} at={0.06 + i * 0.16} i={i} className={`ch-phone ch-phone-${i}`}>
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
            <Trace r={24} />
            <span className="ch-cap">
              <b>{s.name}</b>
              <span>{s.sub}</span>
            </span>
          </It>
        ))}
      </div>
      <p className="ch-note ch-keep halo" data-at="0.4">
        {bizapp.caption}
      </p>
    </Ch>
  );
}

// the studio's clips fly out of the lens and settle in an arc
function Studio() {
  return (
    <Ch w={{ from: 0.36, to: 0.96, mfrom: 0.78, mto: 1, place: "bottom" }} kind="studio" anchor={[50, 50]} manchor={[50, 45]}>
      <span className="ch-k ch-keep" data-at="0">
        {studio.k}
      </span>
      <div className="ch-reel">
        {studio.reel.map((r, i) => (
          <It key={r.label} at={0.06 + i * 0.07} i={i} className="ch-clip">
            <span className="ch-clip-v" style={{ "--n": i - 2 } as React.CSSProperties}>
              <video muted loop playsInline preload="none" poster={r.poster} data-src={r.video} aria-hidden />
              <Trace r={14} />
              <i>{r.label}</i>
            </span>
          </It>
        ))}
      </div>
      <a className="ch-go ch-keep" href={studio.href} target="_blank" rel="noopener" data-at="0.5">
        {studio.go} ←
      </a>
    </Ch>
  );
}

// neon pins over the city, joined by one thread like a constellation
function Built() {
  return (
    <Ch w={{ from: 0.08, to: 0.46, mfrom: 0.44, mto: 0.76, place: "bottom" }} kind="built" one>
      <svg className="ch-const" aria-hidden>
        <path className="th-glow" />
        <path className="th-line" />
      </svg>
      <p className="ch-h ch-keep halo" data-at="0">
        {built.title} <span>{built.hl}</span>
      </p>
      {built.items.map((b, i) => (
        <It key={b.name} at={0.12 + i * 0.2} i={i} className="ch-pin">
          <span className="ch-pin-ic">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={b.icon} />
            </svg>
            <Trace circle />
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

// a neon ring draws itself around the photo
function Who() {
  return (
    <Ch w={{ from: 0.81, to: 1, mfrom: 0.8, mto: 1, place: "top" }} kind="who">
      <It at={0.02} i={0} className="ch-who-ph">
        <img src={behind.photo} alt="דניאל כהן" width={160} height={160} loading="lazy" decoding="async" />
        <Trace circle />
        {Array.from({ length: 6 }, (_, k) => (
          <i key={k} className="ch-twinkle" style={{ "--k": k } as React.CSSProperties} aria-hidden />
        ))}
      </It>
      <It at={0.12} i={1} className="ch-who-t">
        <p className="halo">
          <b>{behind.title}</b>
          {behind.text}
        </p>
      </It>
    </Ch>
  );
}

// the three sites rise out of the clouds, each at its own depth
function Sites() {
  const list = work.filter((w) => w.k !== "סוכן וואטסאפ" && !w.img);
  return (
    <Ch w={{ from: 0.07, to: 0.48, mfrom: 0.3, mto: 0.47, place: "top" }} kind="sites" anchor={[48, 96]} manchor={[50, 96]}>
      <span className="ch-k ch-keep" data-at="0">
        {sites.tiers[2].name}
      </span>
      <div className="ch-phones">
        {list.map((w, i) => (
          <It key={w.name} at={0.08 + i * 0.12} i={i} className={`ch-phone ch-depth-${i}`}>
            <span className="ch-screen">
              <video muted loop playsInline preload="none" poster={w.poster} data-src={w.video} data-wide-only aria-label={`גלילה באתר של ${w.name}`} />
              <i className="ch-sheen" aria-hidden />
            </span>
            <Trace r={22} />
            <span className="ch-cap">
              <b>{w.name}</b>
              <span>{w.k}</span>
            </span>
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

type Traced = { v: number; len: number };
const traced = new WeakMap<SVGSVGElement, Traced>();

/** build a trace's outline for its current size; returns the outline's length */
function traceLen(svg: SVGSVGElement): number {
  const c = traced.get(svg);
  if (c && c.v === geo && c.len > 0) return c.len;
  const host = svg.parentElement!;
  const w = host.offsetWidth;
  const h = host.offsetHeight;
  if (!w || !h) return 0;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  let d: string;
  if ("circle" in svg.dataset) {
    const r = Math.min(w, h) / 2 - 1;
    const cx = w / 2;
    const cy = h / 2;
    // from the top, clockwise
    d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  } else {
    const r = Math.min(Number(svg.dataset.r ?? 16), w / 2, h / 2);
    const a = 1;
    const W = w - 1;
    const H = h - 1;
    // from the top middle, clockwise
    d = `M ${w / 2} ${a} H ${W - r} A ${r} ${r} 0 0 1 ${W} ${a + r} V ${H - r} A ${r} ${r} 0 0 1 ${W - r} ${H} H ${a + r} A ${r} ${r} 0 0 1 ${a} ${H - r} V ${a + r} A ${r} ${r} 0 0 1 ${a + r} ${a} Z`;
  }
  const paths = svg.querySelectorAll("path");
  paths.forEach((p) => p.setAttribute("d", d));
  const len = (paths[0] as SVGPathElement).getTotalLength();
  traced.set(svg, { v: geo, len });
  return len;
}

/** draw a path to share t of its length, with the spark at its head */
function drawPath(paths: NodeListOf<SVGPathElement>, dot: SVGCircleElement | null, len: number, t: number, opacity = 1) {
  paths.forEach((p) =>
    set(p, {
      strokeDasharray: `${len.toFixed(1)} ${(len + 2).toFixed(1)}`,
      strokeDashoffset: (len * (1 - t)).toFixed(1),
      opacity: t > 0 ? String(opacity) : "0",
    }),
  );
  if (!dot) return;
  if (t > 0.001 && t < 0.999) {
    const pt = paths[0].getPointAtLength(len * t);
    dot.setAttribute("cx", pt.x.toFixed(1));
    dot.setAttribute("cy", pt.y.toFixed(1));
    set(dot, { opacity: "1" });
  } else set(dot, { opacity: "0" });
}

type Fly = { v: number; dx: number; dy: number };
const flies = new WeakMap<HTMLElement, Fly>();

export function chapterAt(host: HTMLElement, p: number, reduced: boolean) {
  const wide = isWide();
  const W = host.offsetWidth;
  const H = host.offsetHeight;
  host.querySelectorAll<HTMLElement>(".ch").forEach((el) => {
    const d = el.dataset;
    const from = Number(wide ? d.from : d.mfrom);
    const to = Number(wide ? d.to : d.mto);
    const has = wide ? d.from !== undefined : d.mfrom !== undefined;
    const k = has && to > from ? (p - from) / (to - from) : -1;
    const on = has && k > 0 && k < 1;
    const thread = el.previousElementSibling instanceof SVGSVGElement ? el.previousElementSibling : null;
    if (!on) {
      set(el, { visibility: "hidden", opacity: "0" });
      if (thread) set(thread, { visibility: "hidden" });
      el.querySelectorAll("video").forEach((v) => playIf(v, false));
      return;
    }
    const inn = reduced ? 1 : smooth(k / 0.06);
    const out = reduced ? 0 : to >= 1 ? 0 : smooth((k - 0.9) / 0.1);
    set(el, {
      visibility: "inherit",
      opacity: (inn * (1 - out)).toFixed(3),
      transform: `translate3d(0, ${(-out * 30).toFixed(1)}px, 0)`,
      filter: out > 0 ? `blur(${(out * 10).toFixed(2)}px)` : "none",
    });

    // the anchor: the object in the picture the spark leaves from
    const ax = Number(wide ? d.ax : d.max);
    const ay = Number(wide ? d.ay : d.may);
    const hasAnchor = !Number.isNaN(ax) && (wide ? d.ax !== undefined : d.max !== undefined);
    const A = { x: (ax / 100) * W, y: (ay / 100) * H };
    const box = posIn(el, host);

    // the thread: drawn from the object to the element as it arrives, then it fades
    if (thread) {
      if (!hasAnchor || reduced) set(thread, { visibility: "hidden" });
      else {
        const tt = smooth(k / 0.12);
        const fade = 1 - smooth((k - 0.14) / 0.12);
        // to the nearest point of the element's box
        const B = {
          x: Math.min(Math.max(A.x, box.x + 12), box.x + box.w - 12),
          y: Math.min(Math.max(A.y, box.y + 12), box.y + box.h - 12),
        };
        const mx = (A.x + B.x) / 2;
        const dPath = `M ${A.x.toFixed(1)} ${A.y.toFixed(1)} C ${mx.toFixed(1)} ${(A.y - 40).toFixed(1)}, ${mx.toFixed(1)} ${(B.y + 40).toFixed(1)}, ${B.x.toFixed(1)} ${B.y.toFixed(1)}`;
        const paths = thread.querySelectorAll("path");
        if (paths[0].getAttribute("d") !== dPath) {
          thread.setAttribute("viewBox", `0 0 ${W} ${H}`);
          paths.forEach((q) => q.setAttribute("d", dPath));
        }
        set(thread, { visibility: fade > 0 ? "inherit" : "hidden", opacity: fade.toFixed(3) });
        if (fade > 0) drawPath(paths, thread.querySelector("circle"), paths[0].getTotalLength(), tt);
      }
    }

    // items arrive at their turn; on a phone a "one" element shows only the newest
    const kids = Array.from(el.querySelectorAll<HTMLElement>("[data-at]"));
    const one = !wide && "one" in d;
    let newest = -1;
    if (one) kids.forEach((c, i) => Number(c.dataset.at) <= k && !c.classList.contains("ch-keep") && (newest = i));
    const pins: { x: number; y: number }[] = [];
    let pinsShown = 0;
    kids.forEach((c, i) => {
      const at = Number(c.dataset.at);
      const gone = one && i !== newest && !c.classList.contains("ch-keep");
      let a = reduced ? (k >= at ? 1 : 0) : smooth((k - at) / 0.08);
      if (gone) a = 0;
      // where it flies in from: towards the anchor, a third of the way
      let f = flies.get(c);
      if (!f || f.v !== geo) {
        const b = posIn(c, host);
        const vx = hasAnchor ? A.x - (b.x + b.w / 2) : 0;
        const vy = hasAnchor ? A.y - (b.y + b.h / 2) : 40;
        const len = Math.hypot(vx, vy) || 1;
        const s = Math.min(160, len * 0.35) / len;
        f = { v: geo, dx: vx * s, dy: vy * s };
        if (c.offsetWidth) flies.set(c, f);
      }
      const r = 1 - a;
      set(c, {
        opacity: a.toFixed(3),
        transform: `translate3d(${(f.dx * r).toFixed(1)}px, ${(f.dy * r).toFixed(1)}px, 0) scale(${(0.78 + 0.22 * a).toFixed(3)})`,
        filter: a > 0 && a < 1 ? `blur(${(r * 9).toFixed(2)}px)` : "none",
        display: gone ? "none" : "",
      });
      // its outline is drawn a moment ahead of it
      c.querySelectorAll<SVGSVGElement>("svg.tr").forEach((svg) => {
        const t = reduced ? (a > 0 ? 1 : 0) : smooth((k - at + 0.02) / 0.1);
        const len = t > 0 ? traceLen(svg) : 0;
        if (len) drawPath(svg.querySelectorAll("path"), svg.querySelector("circle"), len, t, 1 - 0.45 * smooth((k - at - 0.1) / 0.1));
      });
      c.querySelectorAll("video").forEach((v) => playIf(v, a > 0.05));
      if (c.classList.contains("ch-pin")) {
        const ic = c.querySelector<HTMLElement>(".ch-pin-ic");
        if (ic) {
          const b = posIn(ic, el);
          pins.push({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
          if (a > 0) pinsShown = pins.length - 1 + a;
        }
      }
    });

    // the constellation: one thread through the pins, as far as they have arrived
    const cst = el.querySelector<SVGSVGElement>("svg.ch-const");
    if (cst) {
      if (one || pins.length < 2) set(cst, { visibility: "hidden" });
      else {
        const dPath = pins.map((q, i) => `${i ? "L" : "M"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
        const paths = cst.querySelectorAll("path");
        if (paths[0].getAttribute("d") !== dPath) {
          cst.setAttribute("viewBox", `0 0 ${el.offsetWidth} ${el.offsetHeight}`);
          paths.forEach((q) => q.setAttribute("d", dPath));
        }
        set(cst, { visibility: "inherit" });
        drawPath(paths, null, paths[0].getTotalLength(), clamp01(pinsShown / (pins.length - 1)), 0.8);
      }
    }
    // a screen that scrolls with the film
    el.style.setProperty("--s", clamp01(k).toFixed(3));
  });
}
