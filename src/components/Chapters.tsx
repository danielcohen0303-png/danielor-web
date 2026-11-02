// What each chapter of the film shows besides its caption (Daniel, 02.11:
// "dress it in the elements of my existing site"): the WhatsApp agent talking,
// the app's screens, the studio's reel, the businesses we already built for,
// who is behind Danielor, and the sites we made.
//
// The spark draws each of them in the air (Daniel, 02.11: "no banal
// background, floating on the screen like magic"). A point of light leaves the
// object in the picture (the phone on the table, the tablet on the desk, the
// lens) and pulls a neon ribbon to the element; there the ribbon wraps itself
// around the whole group and stays alive while it is on screen: light flows
// through it, it breathes, and it grows around every new item as it arrives
// (Daniel, 02.11: "the neon should be alive, wrap the things, flow with them,
// not a line that shoots out"). Nothing sits on a card; everything floats.
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
//   data-ax / data-ay         where the ribbon starts on a computer (% of the frame)
//   data-max / data-may       the same on a phone
//   data-at (on items)        when an item arrives, as a share of the window
//   data-one                  a phone shows one item at a time
// Motion: chapterAt(host, p, reduced) every frame.
import { Fragment } from "react";
import { agent, behind, bizapp, built, chat, sites, studio, waLink, work } from "@/live";
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
  /** the object in the picture the ribbon starts from, % of the frame (computer, phone) */
  anchor?: Pt;
  manchor?: Pt;
  children: React.ReactNode;
}) {
  const w = win(scene, cap);
  return (
    <>
      <svg className="ch-rb" aria-hidden>
        <path className="rb-glow" />
        <path className="rb-tube" />
        <path className="rb-core" />
        <path className="rb-flow-glow" />
        <path className="rb-flow" />
        <path className="rb-m" />
        <circle className="rb-dot" r="3.6" />
      </svg>
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

/** a neon outline the spark draws around its box (a rounded rectangle, or a circle) */
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
            <Trace r={18} />
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
              <Trace r={28} />
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
                <video muted loop playsInline preload="none" poster={r.poster} data-src={r.video} aria-hidden />
                <Trace r={18} />
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

// a neon ring draws itself around the photo, and the ribbon wraps photo and words
function Who() {
  return (
    <Ch scene="city" cap={1} place="top" kind="who">
      <It at={0.02} i={0} className="ch-who-ph">
        <img src={behind.photo} alt="דניאל כהן" width={160} height={160} loading="lazy" decoding="async" />
        <Trace circle />
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

// the three sites rise out of the clouds, each at its own depth
function Sites() {
  const list = work.filter((w) => w.k !== "סוכן וואטסאפ" && !w.img);
  return (
    <Ch scene="sky" place="top" kind="sites" anchor={[48, 96]} manchor={[50, 96]}>
      <span className="ch-k ch-keep" data-at="0">
        {sites.tiers[2].name}
      </span>
      <div className="ch-phones">
        {list.map((w, i) => (
          <It key={w.name} at={0.08 + i * 0.12} i={i} className={`ch-phone ch-depth-${i}`}>
            <span className="ch-dev">
              <span className="ch-screen">
                <video muted loop playsInline preload="none" poster={w.poster} data-src={w.video} data-wide-only aria-label={`גלילה באתר של ${w.name}`} />
                <i className="ch-sheen" aria-hidden />
              </span>
              <Trace r={28} />
            </span>
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

/** build a trace's outline for its own box; returns the outline's length */
function traceLen(svg: SVGSVGElement): number {
  const c = traced.get(svg);
  if (c && c.v === geo && c.len > 0) return c.len;
  // the svg's own box (it may stand off its parent), not the parent's: a
  // parent that also holds a caption made the outline shrink into the screen
  const host = svg.parentElement!;
  const w = svg.clientWidth || host.offsetWidth;
  const h = svg.clientHeight || host.offsetHeight;
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

// ---------- the ribbon: one neon line that wraps the whole group ----------

type Box = { l: number; t: number; r: number; b: number };
const PAD = 15; // how far the neon stands off the elements
const ROUND = 24; // its corners
const AMP = 2.4; // how much it breathes, px
const SPEED = 70; // the light flowing through it, px a second
const PULSE = 42; // length of one pulse of light
const SPACING = 250; // pulses around the loop, about one per this many px

/** boxes whose heights overlap sit side by side: one row; rows top to bottom */
function rowsOf(boxes: Box[]) {
  const s = [...boxes].sort((a, b) => a.t - b.t);
  const rows: Box[][] = [];
  for (const bx of s) {
    const row = rows[rows.length - 1];
    if (row && bx.t < Math.max(...row.map((q) => q.b)) - 6) row.push(bx);
    else rows.push([bx]);
  }
  rows.forEach((r) => r.sort((a, b) => a.l - b.l));
  return rows;
}

/** even out steps too small to read as a shape */
function evenOut(v: number[], outward: 1 | -1) {
  for (let i = 1; i < v.length; i++)
    if (Math.abs(v[i] - v[i - 1]) < 14) v[i] = v[i - 1] = outward > 0 ? Math.max(v[i], v[i - 1]) : Math.min(v[i], v[i - 1]);
}

/** a row pulled in between two that stand further out is a pocket, not a shape: fill it */
function fillPockets(v: number[], outward: 1 | -1) {
  for (let pass = 0; pass < 3; pass++)
    for (let i = 1; i < v.length - 1; i++) {
      const lim = outward > 0 ? Math.min(v[i - 1], v[i + 1]) : Math.max(v[i - 1], v[i + 1]);
      if (outward > 0 ? v[i] < lim : v[i] > lim) v[i] = lim;
    }
}

/** the outline that hugs the group, clockwise: along the tops, down the right, along the bottoms, up the left */
function hull(boxes: Box[], P: number): Pt[] {
  const rows = rowsOf(boxes);
  const n = rows.length;
  const top = rows.map((r) => Math.min(...r.map((q) => q.t)));
  const bot = rows.map((r) => Math.max(...r.map((q) => q.b)));
  const R = rows.map((r) => Math.max(...r.map((q) => q.r)) + P);
  const L = rows.map((r) => Math.min(...r.map((q) => q.l)) - P);
  fillPockets(R, 1);
  fillPockets(L, -1);
  evenOut(R, 1);
  evenOut(L, -1);
  const mid = rows.slice(0, -1).map((_, i) => (bot[i] + top[i + 1]) / 2);
  const pts: Pt[] = [];
  // the tops of the first row, left to right
  const f = rows[0];
  const ft = f.map((q) => q.t - P);
  fillPockets(ft, -1);
  evenOut(ft, -1);
  f.forEach((q, j) => {
    const x0 = j === 0 ? L[0] : (f[j - 1].r + q.l) / 2;
    const x1 = j === f.length - 1 ? R[0] : (q.r + f[j + 1].l) / 2;
    pts.push([x0, ft[j]], [x1, ft[j]]);
  });
  // down the right
  for (let i = 0; i < n; i++) {
    if (i > 0) pts.push([R[i], mid[i - 1]]);
    if (i < n - 1) pts.push([R[i], mid[i]]);
  }
  // the bottoms of the last row, right to left
  const l = rows[n - 1];
  const lb = l.map((q) => q.b + P);
  fillPockets(lb, 1);
  evenOut(lb, 1);
  for (let j = l.length - 1; j >= 0; j--) {
    const q = l[j];
    const x1 = j === l.length - 1 ? R[n - 1] : (q.r + l[j + 1].l) / 2;
    const x0 = j === 0 ? L[n - 1] : (l[j - 1].r + q.l) / 2;
    pts.push([x1, lb[j]], [x0, lb[j]]);
  }
  // up the left
  for (let i = n - 1; i >= 0; i--) {
    if (i < n - 1) pts.push([L[i], mid[i]]);
    if (i > 0) pts.push([L[i], mid[i - 1]]);
  }
  // drop repeats and points in the middle of a straight run
  const out: Pt[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5) out.push(p);
  }
  if (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 0.5) out.pop();
  const clean = out.filter((p, i) => {
    const a = out[(i - 1 + out.length) % out.length];
    const b = out[(i + 1) % out.length];
    return !((Math.abs(a[0] - p[0]) < 0.5 && Math.abs(b[0] - p[0]) < 0.5) || (Math.abs(a[1] - p[1]) < 0.5 && Math.abs(b[1] - p[1]) < 0.5));
  });
  return clean.length >= 3 ? clean : out;
}

/** the point of the outline nearest to A: which edge, and where on it */
function nearestOn(poly: Pt[], A: Pt) {
  let best = { i: 0, S: poly[0] as Pt, d: Infinity };
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const L2 = vx * vx + vy * vy || 1;
    const t = clamp01(((A[0] - a[0]) * vx + (A[1] - a[1]) * vy) / L2);
    const S: Pt = [a[0] + vx * t, a[1] + vy * t];
    const d = Math.hypot(A[0] - S[0], A[1] - S[1]);
    if (d < best.d) best = { i, S, d };
  }
  // never start on a corner: slide a little along the edge
  const a = poly[best.i];
  const b = poly[(best.i + 1) % poly.length];
  const seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const from = Math.hypot(best.S[0] - a[0], best.S[1] - a[1]);
  const keep = Math.min(seg / 2, ROUND + 6);
  const at = Math.min(Math.max(from, keep), seg - keep);
  best.S = [a[0] + ((b[0] - a[0]) * at) / seg, a[1] + ((b[1] - a[1]) * at) / seg];
  return best;
}

const f1 = (n: number) => n.toFixed(1);
const unit = (x: number, y: number): Pt => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** the closed loop from S (on edge i) all the way round, with rounded corners */
function loopPath(poly: Pt[], i: number, S: Pt) {
  const n = poly.length;
  let d = "";
  for (let c = 1; c <= n; c++) {
    const cur = poly[(i + c) % n];
    const prev = c === 1 ? S : poly[(i + c - 1) % n];
    const next = c === n ? S : poly[(i + c + 1) % n];
    const lp = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    const ln = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const r = Math.min(ROUND, c === 1 ? lp : lp / 2, c === n ? ln : ln / 2);
    const u1 = unit(prev[0] - cur[0], prev[1] - cur[1]);
    const u2 = unit(next[0] - cur[0], next[1] - cur[1]);
    d += ` L ${f1(cur[0] + u1[0] * r)} ${f1(cur[1] + u1[1] * r)} Q ${f1(cur[0])} ${f1(cur[1])} ${f1(cur[0] + u2[0] * r)} ${f1(cur[1] + u2[1] * r)}`;
  }
  return d + ` L ${f1(S[0])} ${f1(S[1])}`;
}

// Everything the ribbon keeps from frame to frame, so nothing in it ever jumps
// (Daniel, 02.11: "the line flickers, it jumps"): the group's boxes, eased per
// element; which way round it runs; where it meets the thread; and its pulses
// of light, each a share of the way round that only ever moves forward.
type Rb = { t: number; boxes: Map<Element, Box>; dir: 1 | -1 | 0; S: Pt | null; pulses: number[] };
const rbState = new WeakMap<SVGSVGElement, Rb>();

/** the group's boxes, eased towards where they are now; one that leaves folds away instead of vanishing */
function easeBoxes(st: Rb, now: Map<Element, Box>, dt: number) {
  const a = 1 - Math.exp(-dt / 0.12);
  now.forEach((q, el) => {
    const b = st.boxes.get(el);
    if (!b) st.boxes.set(el, { ...q });
    else {
      b.l += (q.l - b.l) * a;
      b.t += (q.t - b.t) * a;
      b.r += (q.r - b.r) * a;
      b.b += (q.b - b.b) * a;
    }
  });
  st.boxes.forEach((b, el) => {
    if (now.has(el)) return;
    b.b += (b.t - b.b) * a;
    if (b.b - b.t < 2) st.boxes.delete(el);
  });
  return [...st.boxes.values()];
}

/** the ribbon at window share k: drawn out of the object, wrapped round the group, alive */
function ribbonAt(svg: SVGSVGElement, now: Map<Element, Box>, anchor: Pt | null, W: number, H: number, k: number, op: number, reduced: boolean, pad: number) {
  if (!now.size || op <= 0.001) {
    set(svg, { visibility: "hidden" });
    rbState.delete(svg);
    return;
  }
  const t = performance.now() / 1000;
  let st = rbState.get(svg);
  if (!st) {
    st = { t, boxes: new Map(), dir: 0, S: null, pulses: [] };
    rbState.set(svg, st);
  }
  const dt = Math.min(0.1, Math.max(0, t - st.t));
  st.t = t;
  const bx = reduced ? [...now.values()] : easeBoxes(st, now, dt);
  if (!bx.length) return;
  let poly = hull(bx, pad + (reduced ? 0 : 1.5 * Math.sin(t * 1.3)));
  // it breathes: every corner drifts a little, on a beat set by where it is (so a corner keeps its beat)
  if (!reduced)
    poly = poly.map(([x, y]) => [x + AMP * Math.sin(t * 0.8 + x * 0.013 + y * 0.007), y + AMP * Math.cos(t * 0.65 + x * 0.009 + y * 0.015)] as Pt);
  // and never leaves the screen
  poly = poly.map(([x, y]) => [Math.min(W - 5, Math.max(5, x)), Math.min(H - 5, Math.max(5, y))] as Pt);

  // which way round: decided once, the way the thread comes in (with no object, clockwise)
  if (!st.dir) {
    if (!anchor) st.dir = 1;
    else {
      const { i, S } = nearestOn(poly, anchor);
      const dv = unit(poly[(i + 1) % poly.length][0] - poly[i][0], poly[(i + 1) % poly.length][1] - poly[i][1]);
      st.dir = dv[0] * (S[0] - anchor[0]) + dv[1] * (S[1] - anchor[1]) < 0 ? -1 : 1;
    }
  }
  if (st.dir < 0) poly = poly.slice().reverse();
  const n = poly.length;

  // the main line: the thread from the object, then the loop from where they meet
  let main = "";
  let thread = "";
  let i = 0;
  if (anchor) {
    // where they meet glides when the group grows, never jumps
    const target = nearestOn(poly, anchor).S;
    st.S = st.S ? [st.S[0] + (target[0] - st.S[0]) * (1 - Math.exp(-dt / 0.15)), st.S[1] + (target[1] - st.S[1]) * (1 - Math.exp(-dt / 0.15))] : target;
    const m = nearestOn(poly, st.S);
    i = m.i;
    const S = m.S;
    const dir = unit(poly[(i + 1) % n][0] - poly[i][0], poly[(i + 1) % n][1] - poly[i][1]);
    const dist = Math.hypot(S[0] - anchor[0], S[1] - anchor[1]);
    const c1: Pt = [anchor[0], anchor[1] - dist * 0.42];
    const c2: Pt = [S[0] - dir[0] * dist * 0.42, S[1] - dir[1] * dist * 0.42];
    thread = `M ${f1(anchor[0])} ${f1(anchor[1])} C ${f1(c1[0])} ${f1(c1[1])}, ${f1(c2[0])} ${f1(c2[1])}, ${f1(S[0])} ${f1(S[1])}`;
    main = thread + loopPath(poly, i, S);
  }
  // the loop on its own, from a fixed point (the middle of the group's first edge), for the light to run on
  const i0 = st.dir < 0 ? n - 1 : 0;
  const a0 = poly[i0];
  const b0 = poly[(i0 + 1) % n];
  const S0: Pt = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2];
  const loop = `M ${f1(S0[0])} ${f1(S0[1])}` + loopPath(poly, i0, S0);
  if (!main) main = loop;

  if (svg.dataset.vb !== `${W}x${H}`) {
    svg.dataset.vb = `${W}x${H}`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }
  const lines = svg.querySelectorAll<SVGPathElement>(".rb-glow, .rb-tube, .rb-core");
  const flows = svg.querySelectorAll<SVGPathElement>(".rb-flow, .rb-flow-glow");
  const meas = svg.querySelector<SVGPathElement>(".rb-m")!;
  lines.forEach((p) => p.setAttribute("d", main));
  flows.forEach((p) => p.setAttribute("d", loop));
  meas.setAttribute("d", thread || "M 0 0");
  const total = lines[0].getTotalLength();
  const thLen = thread ? meas.getTotalLength() : 0;
  const loopLen = Math.max(1, flows[0].getTotalLength());

  // drawn: the spark pulls it out of the object and round the group, then the
  // tail lets go of the object and the loop lives on its own around the group
  const head = reduced ? total : total * smooth(k / 0.2);
  const tail = reduced ? thLen : thLen * smooth((k - 0.22) / 0.16);
  const BIG = total * 3 + loopLen * 3 + 10;
  const dash = `0 ${f1(tail)} ${f1(Math.max(0, head - tail))} ${f1(BIG)}`;
  lines.forEach((p) => (p.style.strokeDasharray = dash));

  // light runs round the loop once it is drawn: each pulse a share of the way
  // round, only ever moving forward, as many as the loop is long
  let fa = `0 ${f1(BIG)}`;
  const flowOn = reduced ? 0 : smooth((k - 0.16) / 0.08);
  if (!reduced) {
    const want = Math.min(8, Math.max(2, Math.round(loopLen / SPACING)));
    if (!st.pulses.length) for (let j = 0; j < want; j++) st.pulses.push(j / want);
    while (st.pulses.length < want) {
      // a new pulse in the middle of the widest gap
      const s = [...st.pulses].sort((x, y) => x - y);
      let g = 0;
      let at = 0;
      s.forEach((u, j) => {
        const nx = j + 1 < s.length ? s[j + 1] : s[0] + 1;
        if (nx - u > g) (g = nx - u), (at = (u + (nx - u) / 2) % 1);
      });
      st.pulses.push(at);
    }
    while (st.pulses.length > want) st.pulses.pop();
    const step = (dt * SPEED) / loopLen;
    st.pulses = st.pulses.map((u) => (u + step) % 1);
    const segs: [number, number][] = [];
    for (const u of st.pulses) {
      const s0 = u * loopLen;
      const e = s0 + PULSE;
      if (e <= loopLen) segs.push([s0, PULSE]);
      else segs.push([s0, loopLen - s0], [0, e - loopLen]);
    }
    segs.sort((x, y) => x[0] - y[0]);
    const arr = [0];
    let cur = 0;
    for (const [s0, len] of segs) {
      if (s0 < cur) continue;
      arr.push(s0 - cur, len);
      cur = s0 + len;
    }
    arr.push(BIG);
    fa = arr.map(f1).join(" ");
  }
  flows.forEach((p) => {
    p.style.strokeDasharray = fa;
    p.style.opacity = flowOn.toFixed(3);
  });

  // the spark: at the drawing head, then riding the first pulse round
  const dot = svg.querySelector<SVGCircleElement>(".rb-dot")!;
  let pt: DOMPoint | null = null;
  if (head < total - 1) pt = lines[0].getPointAtLength(head);
  else if (st.pulses.length && flowOn > 0) pt = flows[0].getPointAtLength(Math.min(loopLen, st.pulses[0] * loopLen + PULSE));
  if (pt) {
    dot.setAttribute("cx", f1(pt.x));
    dot.setAttribute("cy", f1(pt.y));
  }
  set(dot, { opacity: pt ? "1" : "0" });
  set(svg, { visibility: "inherit", opacity: op.toFixed(3) });
}

// what an item's transforms add to its box (the arc of the clips, the tilt of
// the phones), measured once it has arrived; the ribbon then works from layout,
// which does not move with the floating, so it never shivers
type Ext = { v: number; l: number; t: number; r: number; b: number };
const exts = new WeakMap<HTMLElement, Ext>();
function boxOf(c: HTMLElement, host: HTMLElement, a: number, lift: number): Box {
  const b = posIn(c, host);
  let e = exts.get(c);
  if ((!e || e.v !== geo) && a >= 0.999 && lift === 0) {
    const hr = host.getBoundingClientRect();
    const r = (c.querySelector<HTMLElement>(":scope > .fl") ?? c).getBoundingClientRect();
    if (r.width && r.height) {
      e = {
        v: geo,
        l: Math.min(0, r.left - hr.left - b.x),
        t: Math.min(0, r.top - hr.top - b.y + 7),
        r: Math.max(0, r.right - hr.left - (b.x + b.w)),
        b: Math.max(0, r.bottom - hr.top - (b.y + b.h) + 7),
      };
      exts.set(c, e);
    }
  }
  const x = e && e.v === geo ? e : { l: 0, t: 0, r: 0, b: 0 };
  const grown = a >= 0.999 ? b.h + x.b : Math.max(8, b.h * a);
  return { l: b.x + x.l, t: b.y + x.t + lift, r: b.x + b.w + x.r, b: b.y + grown + lift };
}

type Fly = { v: number; dx: number; dy: number };
const flies = new WeakMap<HTMLElement, Fly>();

export function chapterAt(host: HTMLElement, p: number, reduced: boolean) {
  const wide = isWide();
  const W = host.offsetWidth;
  const H = host.offsetHeight;
  host.querySelectorAll<HTMLElement>(".ch").forEach((el) => {
    const d = el.dataset;
    const from = Number(d.from);
    const to = Number(d.to);
    const k = to > from ? (p - from) / (to - from) : -1;
    const on = k > 0 && k < 1;
    const rb = el.previousElementSibling instanceof SVGSVGElement ? el.previousElementSibling : null;
    if (!on) {
      set(el, { visibility: "hidden", opacity: "0" });
      if (rb) set(rb, { visibility: "hidden" });
      el.querySelectorAll("video").forEach((v) => playIf(v, false));
      return;
    }
    // in with the caption, out with the caption: the same curve (src/film/Kinetic.tsx)
    const inn = reduced ? 1 : smooth(k / 0.06);
    const out = reduced ? 0 : smooth((k - 0.82) / 0.18);
    const op = inn * (1 - out);

    // the anchor: the object in the picture the spark leaves from
    const ax = Number(wide ? d.ax : d.max);
    const ay = Number(wide ? d.ay : d.may);
    const hasAnchor = (wide ? d.ax !== undefined : d.max !== undefined) && !Number.isNaN(ax);
    const A: Pt = [(ax / 100) * W, (ay / 100) * H];

    // items arrive at their turn; on a phone a "one" element shows only the newest
    const kids = Array.from(el.querySelectorAll<HTMLElement>("[data-at]"));
    const one = !wide && "one" in d;
    let newest = -1;
    if (one) kids.forEach((c, i) => Number(c.dataset.at) <= k && !c.classList.contains("ch-keep") && (newest = i));
    const arr = kids.map((c, i) => {
      const at = Number(c.dataset.at);
      const gone = one && i !== newest && !c.classList.contains("ch-keep");
      const a = gone ? 0 : reduced ? (k >= at ? 1 : 0) : smooth((k - at) / 0.08);
      return { c, at, a, gone };
    });

    // where the group is, for the ribbon (from layout: steady while things float)
    const boxes = new Map<Element, Box>();
    if (rb)
      for (const { c, a, gone } of arr) {
        if (gone || a <= 0.001) continue;
        const bx = boxOf(c, host, a, -out * 28);
        if (bx.r > bx.l && bx.b > bx.t) boxes.set(c, bx);
      }

    set(el, {
      visibility: "inherit",
      opacity: op.toFixed(3),
      transform: `translate3d(0, ${(-out * 28).toFixed(1)}px, 0)`,
      filter: out > 0 ? `blur(${(out * 7).toFixed(2)}px)` : "none",
    });

    arr.forEach(({ c, at, a, gone }) => {
      // where it flies in from: towards the anchor, a third of the way
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
        filter: a > 0 && a < 1 ? `blur(${(r * 9).toFixed(2)}px)` : "none",
        display: gone ? "none" : "",
      });
      // its own outline is drawn a moment ahead of it, then settles back so the ribbon leads
      c.querySelectorAll<SVGSVGElement>("svg.tr").forEach((svg) => {
        const t = reduced ? (a > 0 ? 1 : 0) : smooth((k - at + 0.02) / 0.1);
        const len = t > 0 ? traceLen(svg) : 0;
        if (len) drawPath(svg.querySelectorAll("path"), svg.querySelector("circle"), len, t, 1 - 0.5 * smooth((k - at - 0.1) / 0.1));
      });
      c.querySelectorAll("video").forEach((v) => playIf(v, a > 0.05));
    });

    if (rb) ribbonAt(rb, boxes, hasAnchor ? A : null, W, H, k, inn * (1 - out) * (1 - out), reduced, wide ? PAD : 10);
    // a screen that scrolls with the film
    el.style.setProperty("--s", clamp01(k).toFixed(3));
  });
}
