// What each chapter of the film shows besides its caption (Daniel, 02.11:
// "dress it in the elements of my existing site"): the WhatsApp agent talking,
// the app's screens, the studio's reel, the businesses we already built for,
// who is behind Danielor, and the sites we made.
//
// Nothing sits on a card; everything floats, and comes out of the object in
// the picture (the phone on the table, the tablet on the desk, the lens). When
// a chapter's last item has arrived, one neon line wraps the whole group, fast,
// once, and stays there breathing softly (Daniel, 02.11: "when something
// ends, the line just goes round it, fast and beautiful. Simple"). It is drawn
// once and then left to the browser: no work every frame, so the scroll stays
// light on a phone.
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
  /** the object in the picture the items fly out of, % of the frame (computer, phone) */
  anchor?: Pt;
  manchor?: Pt;
  children: React.ReactNode;
}) {
  const w = win(scene, cap);
  return (
    <>
      <div className="ch-rbw" aria-hidden>
        <svg className="ch-rb">
          <path className="rb-glow" />
          <path className="rb-line" />
        </svg>
      </div>
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

/** a neon outline drawn round one item as it arrives (a rounded rectangle, or a circle) */
function Trace({ r = 16, circle }: { r?: number; circle?: boolean }) {
  return (
    <svg className="tr" aria-hidden data-r={r} data-circle={circle ? "" : undefined}>
      <path className="tr-glow" />
      <path className="tr-line" />
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
                <video muted loop playsInline preload="none" poster={r.poster} data-src={r.video} data-wide-only aria-hidden />
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

let liteQ: MediaQueryList | null = null;
/** a phone: no blur while things move (it is costly there) */
const isLite = () => (liteQ ??= window.matchMedia("(pointer: coarse)")).matches;

/** build a trace's outline for its own box, once per layout; its length goes to --len for the CSS that draws it */
const traced = new WeakMap<SVGSVGElement, number>();
function buildTrace(svg: SVGSVGElement) {
  if (traced.get(svg) === geo) return true;
  // the svg's own box (it may stand off its parent), not the parent's
  const host = svg.parentElement!;
  const w = svg.clientWidth || host.offsetWidth;
  const h = svg.clientHeight || host.offsetHeight;
  if (!w || !h) return false;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  let d: string;
  if ("circle" in svg.dataset) {
    const r = Math.min(w, h) / 2 - 1;
    const cx = w / 2;
    const cy = h / 2;
    d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  } else {
    const r = Math.min(Number(svg.dataset.r ?? 16), w / 2, h / 2);
    const a = 1;
    const W = w - 1;
    const H = h - 1;
    d = `M ${w / 2} ${a} H ${W - r} A ${r} ${r} 0 0 1 ${W} ${a + r} V ${H - r} A ${r} ${r} 0 0 1 ${W - r} ${H} H ${a + r} A ${r} ${r} 0 0 1 ${a} ${H - r} V ${a + r} A ${r} ${r} 0 0 1 ${a + r} ${a} Z`;
  }
  const paths = svg.querySelectorAll("path");
  paths.forEach((p) => p.setAttribute("d", d));
  svg.style.setProperty("--len", (paths[0] as SVGPathElement).getTotalLength().toFixed(1));
  traced.set(svg, geo);
  return true;
}

/** a class on or off, touching the element only when it changes */
function flag(el: Element, cls: string, on: boolean) {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

// ---------- the wrap: one neon line round the whole group, once it is complete ----------

type Box = { l: number; t: number; r: number; b: number };
const PAD = 15; // how far the neon stands off the elements
const ROUND = 26; // its corners

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
    if (Math.abs(v[i] - v[i - 1]) < 18) v[i] = v[i - 1] = outward > 0 ? Math.max(v[i], v[i - 1]) : Math.min(v[i], v[i - 1]);
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
  const f = rows[0];
  const ft = f.map((q) => q.t - P);
  fillPockets(ft, -1);
  evenOut(ft, -1);
  f.forEach((q, j) => {
    const x0 = j === 0 ? L[0] : (f[j - 1].r + q.l) / 2;
    const x1 = j === f.length - 1 ? R[0] : (q.r + f[j + 1].l) / 2;
    pts.push([x0, ft[j]], [x1, ft[j]]);
  });
  for (let i = 0; i < n; i++) {
    if (i > 0) pts.push([R[i], mid[i - 1]]);
    if (i < n - 1) pts.push([R[i], mid[i]]);
  }
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
  for (let i = n - 1; i >= 0; i--) {
    if (i < n - 1) pts.push([L[i], mid[i]]);
    if (i > 0) pts.push([L[i], mid[i - 1]]);
  }
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

const f1 = (n: number) => n.toFixed(1);
const unit = (x: number, y: number): Pt => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** the closed outline with rounded corners, starting from the middle of its top edge on the right (where Hebrew starts) */
function outline(poly: Pt[]) {
  const n = poly.length;
  // the top edge is the first one (left to right); start three quarters along it
  const a = poly[0];
  const b = poly[1 % n];
  const S: Pt = [a[0] + (b[0] - a[0]) * 0.75, a[1] + (b[1] - a[1]) * 0.75];
  let d = `M ${f1(S[0])} ${f1(S[1])}`;
  for (let c = 1; c <= n; c++) {
    const cur = poly[c % n];
    const prev = c === 1 ? S : poly[(c - 1) % n];
    const next = c === n ? S : poly[(c + 1) % n];
    const lp = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    const ln = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const r = Math.min(ROUND, c === 1 ? lp : lp / 2, c === n ? ln : ln / 2);
    const u1 = unit(prev[0] - cur[0], prev[1] - cur[1]);
    const u2 = unit(next[0] - cur[0], next[1] - cur[1]);
    d += ` L ${f1(cur[0] + u1[0] * r)} ${f1(cur[1] + u1[1] * r)} Q ${f1(cur[0])} ${f1(cur[1])} ${f1(cur[0] + u2[0] * r)} ${f1(cur[1] + u2[1] * r)}`;
  }
  return d + ` L ${f1(S[0])} ${f1(S[1])}`;
}

type Wrap = { v: number; built: boolean; armed: boolean; mv: number; wide: boolean; lastAt: number };
const wraps = new WeakMap<HTMLElement, Wrap>();

/** build the wrap round the group as it stands now (its last item has just arrived): read once, then left alone */
function buildWrap(el: HTMLElement, rbw: HTMLElement, host: HTMLElement, items: HTMLElement[], pad: number) {
  const hr = host.getBoundingClientRect();
  const lift = el.getBoundingClientRect().top - (hr.top + posIn(el, host).y); // the group's own movement, if any
  const boxes: Box[] = [];
  for (const c of items) {
    const b = posIn(c, host);
    if (!b.w || !b.h) continue;
    // its layout, and where it really is (the clips' arc, the phones' tilt, the float)
    const r = (c.querySelector<HTMLElement>(":scope > .fl") ?? c).getBoundingClientRect();
    boxes.push({
      l: Math.min(b.x, r.left - hr.left),
      t: Math.min(b.y, r.top - hr.top - lift) - 4,
      r: Math.max(b.x + b.w, r.right - hr.left),
      b: Math.max(b.y + b.h, r.bottom - hr.top - lift) + 4,
    });
  }
  if (!boxes.length) return false;
  const W = host.offsetWidth;
  const H = host.offsetHeight;
  const poly = hull(boxes, pad).map(([x, y]) => [Math.min(W - 5, Math.max(5, x)), Math.min(H - 5, Math.max(5, y))] as Pt);
  const svg = rbw.querySelector<SVGSVGElement>("svg")!;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const d = outline(poly);
  const paths = svg.querySelectorAll<SVGPathElement>("path");
  paths.forEach((p) => p.setAttribute("d", d));
  svg.style.setProperty("--len", paths[0].getTotalLength().toFixed(1));
  return true;
}

type Fly = { v: number; dx: number; dy: number };
const flies = new WeakMap<HTMLElement, Fly>();
const drawnAt = new WeakMap<HTMLElement, number>();
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
    const rbw = el.previousElementSibling instanceof HTMLElement && el.previousElementSibling.classList.contains("ch-rbw") ? el.previousElementSibling : null;
    if (!on) {
      set(el, { visibility: "hidden", opacity: "0" });
      if (rbw) {
        set(rbw, { visibility: "hidden" });
        flag(rbw, "on", false);
        const w = wraps.get(el);
        if (w) w.armed = false;
      }
      el.querySelectorAll("video").forEach((v) => playIf(v, false));
      return;
    }
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

    // the last item to arrive (worked out once per layout: on a phone the call
    // to action is hidden and does not count); once it is in, the wrap goes round them all
    let w = wraps.get(el);
    if (!w) wraps.set(el, (w = { v: -1, built: false, armed: false, mv: -1, wide, lastAt: 0 }));
    if (w.mv !== geo || w.wide !== wide) {
      w.mv = geo;
      w.wide = wide;
      w.lastAt = Math.max(0, ...kids.filter((c) => c.style.display === "none" || getComputedStyle(c).display !== "none").map((c) => Number(c.dataset.at)));
    }
    const lastAt = w.lastAt;
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
      drawnAt.set(c, a);
      set(c, {
        opacity: a.toFixed(3),
        transform: `translate3d(${(f.dx * r).toFixed(1)}px, ${(f.dy * r).toFixed(1)}px, 0) scale(${(0.78 + 0.22 * a).toFixed(3)})`,
        filter: a > 0 && a < 1 && !lite ? `blur(${(r * 9).toFixed(2)}px)` : "none",
        display: gone ? "none" : "",
      });
      // its own outline: drawn by the browser as it lands (built a frame ahead, so it draws from nothing)
      c.querySelectorAll<SVGSVGElement>("svg.tr").forEach((svg) => {
        const want = a > 0.5;
        if (want && traced.get(svg) !== geo) {
          buildTrace(svg);
          return;
        }
        flag(svg, "on", want);
      });
      c.querySelectorAll("video").forEach((v) => playIf(v, a > 0.05));
    });

    // the wrap: once the group is complete, fast, once; it leaves with the group
    if (rbw) {
      const done = reduced || k >= lastAt + 0.1;
      set(rbw, { visibility: "inherit", opacity: op.toFixed(3), transform: `translate3d(0, ${lift.toFixed(1)}px, 0)` });
      if (done) {
        if (!w.built || w.v !== geo) {
          w.built = buildWrap(el, rbw, host, kids.filter((c) => c.offsetWidth > 0), wide ? PAD : 10);
          w.v = geo;
          w.armed = false;
        } else if (!w.armed) {
          // a frame after it is built, so the browser draws it from nothing
          w.armed = true;
          flag(rbw, "on", true);
        }
      } else if (k < lastAt + 0.08) {
        flag(rbw, "on", false);
        w.armed = false;
      }
    }
    // a screen that scrolls with the film
    el.style.setProperty("--s", clamp01(k).toFixed(3));
  });
}
