"use client";

// The film on a phone, as a reel (Daniel, 02.11: "for heavy sites, on the
// phone a solution that is not scrolling; the computer keeps the whole
// experience"). Scrubbing a video with the finger means a seek for every frame
// that moves, the hardest thing a phone's decoder does; this film is twice as
// long as Adele's, so on an iPhone it stuck. Here every scene simply plays, the
// way a phone plays any video (smooth, like Instagram), and the visitor moves
// through the film like through Instagram stories (Daniel, 02.11): a tap on
// the left side is the next scene, on the right side the one before; a finger
// held on the left runs the scene fast, held on the right pauses it; a swipe up
// or down does the same as a tap. A scene ends on the
// very frame the next one starts with, so left alone the five scenes play as
// one continuous take. The captions, the chapters' elements and the finale run
// on the video's own clock, through the same functions the scroll film uses.
//
// The first time, the film waits on a guide that shows it works like stories
// (Daniel, 02.11: "people should get at once that it moves like Instagram");
// a tap closes it and the film goes on. A scene that is not on screen waits
// parked on its first frame, so a cut to it never flashes an old frame.
//
// The opening is the same: the sign lights as the first scene arrives, and a
// swipe (or a tap) implodes it into the spark the film starts from. At the end
// a swipe up bursts the star's light over the screen and sets the visitor on
// the first section under it (the same landing as the scroll film).
// The computer, and ?mode=scroll, get OneFilm (src/film/FilmByDevice.tsx).
import { useEffect, useRef } from "react";
import { AssetLoader } from "./AssetLoader";
import { KineticCaption, kinetic } from "./Kinetic";
import { Finale, finaleAt } from "@/components/Finale";
import { introAt } from "@/components/intro";
import { LETTERS } from "@/components/Sign";
import { chapterAt, setChapterStack } from "@/components/Chapters";
import type { OneScene } from "./OneFilm";
import "./film.css";

const INTRO_MS = 1500; // the sign imploding into the spark
const FADE_MS = 320; // a swipe to another scene
const BURST_MS = 1700; // from the star to the full light, at the end
const STEP_AT = 0.8; // the step to the first section, under the full light
const LIFT_MS = 750; // the light lifting off the section
const FAST = 2; // the speed while a finger is held on the left side: what the badge says, and no more frames for an iPhone to decode than that
const BACK_ZONE = 0.35; // the right share of the screen that goes back (Hebrew goes on to the left)
const HOLD_MS = 220; // longer than this, a touch is a hold, not a tap
const GUIDE_MS = 6500; // the guide on the first scene closes by itself after this

type Mode = "intro" | "start" | "play" | "end" | "leave";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

// lucide's "pointer": a hand, index finger up (its tip at 8, 2), drawn twice so it reads over any picture
const HAND = [
  "M22 14a8 8 0 0 1-8 8",
  "M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2",
  "M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1",
  "M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10",
  "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
];
function Hand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {HAND.map((d) => (
        <path key={`u${d}`} d={d} stroke="rgba(0,0,0,0.45)" strokeWidth="4" />
      ))}
      {HAND.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth="1.7" />
      ))}
    </svg>
  );
}

export default function ReelFilm({
  scenes,
  intro,
  extras,
  landOn,
  skipLabel = "לדלג לאתר",
  endLabel = "לחצו או החליקו לאתר",
  ctrlLabel = "כמו סטורי באינסטגרם",
}: {
  scenes: OneScene[];
  intro?: React.ReactNode;
  extras?: Record<string, React.ReactNode>;
  /** the section the visitor is set on after the film (a selector) */
  landOn?: string;
  skipLabel?: string;
  endLabel?: string;
  /** the words in the middle of the bar under the film */
  ctrlLabel?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const chs = useRef<(HTMLDivElement | null)[]>([]);
  const fins = useRef<(HTMLDivElement | null)[]>([]);
  const bars = useRef<(HTMLElement | null)[]>([]);
  const introBox = useRef<HTMLDivElement>(null);
  const outroBox = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const ctrl = useRef<HTMLDivElement>(null);
  const btnFwd = useRef<HTMLSpanElement>(null);
  const btnBack = useRef<HTMLSpanElement>(null);
  const guide = useRef<HTMLDivElement>(null);
  const fastBadge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = section.current;
    if (!sec) return;
    const skipBtn = skip.current;
    const introEl = introBox.current;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = scenes.length;
    const urls = scenes.map((s) => `${s.media.base}/${s.media.video}`);
    const blobs: (string | null)[] = scenes.map(() => null);
    const primed = scenes.map(() => false);
    // a play() of a hidden scene's video, on its way to being stopped on its first frame
    const priming = scenes.map(() => false);
    const rate = (i: number) => scenes[i].reelRate ?? 1;
    const dur = (i: number) => videos.current[i]?.duration || scenes[i].media.frames / scenes[i].media.fps;
    const loader = new AssetLoader(6);
    let destroyed = false;
    let mode = "intro" as Mode;
    // the mode on the stage too, for the CSS (the bars, the cue)
    const setMode = (m: Mode) => {
      mode = m;
      sec.dataset.mode = m;
    };
    sec.dataset.mode = mode;
    let cur = 0;
    let t0 = 0;
    let swiped = false;
    setChapterStack(3);
    root.classList.add("reel-mode");

    // a scene's video rests: stopped now, sent back to its start a moment later, once its layer
    // is surely off the screen (Daniel, 02.11: the sea flashed at the cut to the sky. On an
    // iPhone the frame a seek brings can reach the screen before the layer's hiding does)
    const rest = (k: number) => {
      const v = videos.current[k];
      if (!v) return;
      v.pause();
      window.setTimeout(() => {
        if (k === cur || layers.current[k]?.classList.contains("rl-on")) return;
        if (v.currentTime > 0.05) v.currentTime = 0;
      }, 250);
    };

    // ---------- the scenes' videos: only the one on screen and its neighbours hold one ----------
    const attach = (i: number) => {
      const v = videos.current[i];
      if (!v) return;
      const want = blobs[i] ?? urls[i];
      if (v.dataset.src === want) return;
      // never swap the file under the scene that is playing
      if (v.dataset.src && i === cur && mode === "play") return;
      v.dataset.src = want;
      v.src = want;
      v.load();
      primed[i] = false;
    };
    const detach = (i: number) => {
      const v = videos.current[i];
      if (!v || !v.dataset.src) return;
      v.pause();
      v.removeAttribute("src");
      delete v.dataset.src;
      v.load();
      primed[i] = false;
    };
    // played once and stopped on its first frame: iOS paints a video only after a play()
    const prime = (i: number) => {
      const v = videos.current[i];
      if (!v || i < 0 || i >= n) return;
      attach(i);
      v.playbackRate = rate(i);
      if (primed[i] || (i === cur && mode === "play")) return;
      priming[i] = true;
      v.play()
        .then(() => {
          if (!(i === cur && mode === "play")) {
            v.pause();
            v.currentTime = 0;
          }
          primed[i] = true;
        })
        .catch(() => {})
        .finally(() => (priming[i] = false));
    };
    const near = () => {
      for (let k = 0; k < n; k++) {
        if (Math.abs(k - cur) <= 1) attach(k);
        else detach(k);
      }
      prime(cur + 1);
    };
    // every scene downloads from the start, in the film's order, and waits ready
    (async () => {
      for (let i = 0; i < n; i++) {
        if (destroyed) return;
        const b = await loader.keep(urls[i]).catch(() => null);
        if (destroyed || !b) continue;
        blobs[i] = URL.createObjectURL(b);
        if (Math.abs(i - cur) <= 1) {
          attach(i);
          if (i !== cur || mode !== "play") prime(i);
        }
      }
    })();

    // ---------- what each scene shows besides its picture, on its video's clock ----------
    const drive = (i: number, p: number) => {
      const c = caps.current[i];
      if (c) kinetic(c, p, reduced);
      const f = fins.current[i];
      if (f) finaleAt(f, p, reduced, 0.5);
      const h = chs.current[i];
      if (h) chapterAt(h, p, reduced);
    };
    const setBars = (p: number) =>
      bars.current.forEach((b, k) => {
        if (b) b.style.transform = `scaleX(${(k < cur ? 1 : k > cur ? 0 : clamp01(p)).toFixed(4)})`;
      });
    const showCue = (text: string | null) => {
      const c = cue.current;
      if (!c) return;
      if (text) {
        const label = c.querySelector("span");
        if (label) label.textContent = text;
      }
      c.classList.toggle("on", !!text);
    };
    // the bar under the film while it plays: the two sides, named, and the way out
    const showSkip = (on: boolean) => ctrl.current?.classList.toggle("on", on);
    const side = (s: "fwd" | "back") => (s === "fwd" ? btnFwd.current : btnBack.current);
    // the side that was tapped answers, like a button pressed
    const flash = (s: "fwd" | "back") => {
      const el = side(s);
      if (!el) return;
      el.classList.remove("hit");
      void el.offsetWidth;
      el.classList.add("hit");
      clearTimeout(Number(el.dataset.hit));
      el.dataset.hit = String(window.setTimeout(() => el.classList.remove("hit"), 450));
    };

    // ---------- how to move, shown once; the badge while running fast ----------
    // the guide: once per visitor (remembered in this browser), the film paused under it
    let guided = false;
    let guideOn = false;
    let guideTimer = 0;
    const seen = () => {
      try {
        return localStorage.getItem("dn-reel-guide") === "1";
      } catch {
        return false;
      }
    };
    const openGuide = () => {
      guided = true;
      if (seen()) return;
      guideOn = true;
      guide.current?.classList.add("on");
      videos.current[cur]?.pause();
      guideTimer = window.setTimeout(closeGuide, GUIDE_MS);
    };
    const closeGuide = () => {
      clearTimeout(guideTimer);
      if (!guideOn) return;
      guideOn = false;
      guide.current?.classList.remove("on");
      if (mode === "play") videos.current[cur]?.play().catch(() => {});
      try {
        localStorage.setItem("dn-reel-guide", "1");
      } catch {}
    };
    const hideHint = closeGuide;
    let fast = false;
    const setFast = (on: boolean) => {
      fast = on;
      const v = videos.current[cur];
      if (v) v.playbackRate = on ? FAST : rate(cur);
      fastBadge.current?.classList.toggle("on", on);
    };

    // ---------- moving between scenes ----------
    const show = (i: number, how: "cut" | "fade") => {
      const prev = cur;
      const pv = videos.current[prev];
      cur = i;
      setMode("play");
      const lay = layers.current;
      const next = lay[i];
      if (next) {
        next.style.transition = "none";
        next.style.opacity = how === "fade" && prev !== i ? "0" : "1";
        next.classList.add("rl-on");
        next.style.zIndex = "2";
      }
      lay.forEach((l, k) => l && k !== i && k !== prev && (l.classList.remove("rl-on"), (l.style.zIndex = "")));
      // a scene that is left waits parked on its first frame (a cut to it later shows that frame)
      const park = (pv2: HTMLVideoElement | null | undefined) => {
        if (!pv2 || prev === cur) return;
        rest(prev);
      };
      const nv = videos.current[i];
      // the new scene shows only once its video really presents a frame from its start
      // (Daniel, 02.11: a jump into the camera, and one in the office). An iPhone can show
      // where a hidden video last got to, or skip a seek made while it was hidden: until a
      // frame from the start is on screen the scene before stays over it (at a cut its last
      // frame is that very picture), and a frame from later sends the video back to the start
      const fromStart = (vid: HTMLVideoElement | null | undefined, ok: () => void) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          ok();
        };
        if (vid && typeof vid.requestVideoFrameCallback === "function") {
          let tries = 0;
          let good = 0;
          // two frames from the start in a row: on an iPhone the first can still be painted
          // over by the frame it last had (02.11: one frame of the lens flashed at the cut)
          const check = (_: number, m: VideoFrameCallbackMetadata) => {
            if (done || cur !== i) return finish();
            if (m.mediaTime > 0.3 && tries++ < 3) {
              good = 0;
              vid.currentTime = 0;
              vid.play().catch(() => {});
              vid.requestVideoFrameCallback(check);
              return;
            }
            if (++good < 2) {
              vid.requestVideoFrameCallback(check);
              return;
            }
            finish();
          };
          vid.requestVideoFrameCallback(check);
        } else if (vid) vid.addEventListener("seeked", finish, { once: true });
        // never longer than this (a video that cannot play still lets the scene through)
        window.setTimeout(finish, 900);
      };
      if (how === "fade" && prev !== i && next) {
        // nearly invisible, not invisible: a layer at 0 may not present its video's frames
        next.style.opacity = "0.01";
        const old = lay[prev];
        fromStart(nv, () => {
          if (cur !== i) return park(pv);
          void next.offsetWidth;
          next.style.transition = `opacity ${FADE_MS}ms ease`;
          next.style.opacity = "1";
          window.setTimeout(() => {
            if (cur === i && old && prev !== cur) {
              old.classList.remove("rl-on");
              old.style.zIndex = "";
            }
            park(pv);
          }, FADE_MS + 30);
        });
      } else if (prev !== i) {
        const old = lay[prev];
        if (old) old.style.zIndex = "3";
        fromStart(nv, () => {
          if (old && cur === i) {
            old.classList.remove("rl-on");
            old.style.zIndex = "";
          }
          park(pv);
        });
      }
      near();
      // the videos in the other scenes' elements (the sites' phones) rest while those scenes are away
      chs.current.forEach((h, k) => k !== i && h?.querySelectorAll("video").forEach((cv) => cv.pause()));
      const v = videos.current[i];
      if (v) {
        v.playbackRate = fast ? FAST : rate(i);
        if (how === "fade" || v.ended || v.currentTime > 0.05) v.currentTime = 0;
        v.play().catch(() => {});
      }
      drive(i, 0);
      showCue(null);
      showSkip(true);
      // the first time the film starts: how to move through it, like stories
      if (i === 0 && !swiped && !guided) openGuide();
    };

    // ---------- the opening: the sign lights as the first scene arrives ----------
    let ready = false;
    let pending = false;
    const gate = () => {
      const box = introBox.current;
      const lit = box ? [...box.querySelectorAll<HTMLElement>(".dn-open-sign .dn-sign-on")] : [];
      const order = [...LETTERS.keys()].sort((a, b) => LETTERS[a].d - LETTERS[b].d);
      lit.forEach((el) => (el.style.animation = "none"));
      root.classList.add("hf-wait");
      let got = false;
      loader.keep(urls[0]).then(
        () => (got = true),
        () => (got = true),
      );
      const g0 = performance.now();
      const step = () => {
        if (destroyed) return;
        const t = (performance.now() - g0) / 1000;
        const shown = Math.min(got ? 1 : loader.progress(urls[0]), t / 1.1);
        order.forEach((idx, k) => lit[idx] && (lit[idx].style.opacity = shown >= (k + 1) / order.length - 0.001 ? "1" : "0"));
        if ((got && t >= 1.1) || t >= 6) {
          lit.forEach((el) => (el.style.opacity = "1"));
          root.classList.remove("hf-wait");
          ready = true;
          if (pending) begin();
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const begin = () => {
      if (mode !== "intro") return;
      if (!ready) {
        pending = true;
        return;
      }
      setMode("start");
      t0 = performance.now();
      const l0 = layers.current[0];
      if (l0) {
        l0.classList.add("rl-on");
        l0.style.opacity = "1";
      }
      near();
      unlock();
    };

    // ---------- the end: the star's light, and the first section under it ----------
    const cover = document.createElement("div");
    cover.className = "hf-cover";
    cover.setAttribute("aria-hidden", "true");
    document.body.appendChild(cover);
    let stepped = 0;
    const aimOutro = (ob: HTMLElement) => {
      const star = sec.querySelector<HTMLElement>(".dn-fin .dn-sign-star");
      const st = ob.getBoundingClientRect();
      const r = star?.getBoundingClientRect();
      const visible = r && r.width && star && getComputedStyle(star).opacity !== "0";
      ob.style.setProperty("--sx", `${(visible ? r!.left + r!.width / 2 - st.left : st.width / 2).toFixed(0)}px`);
      ob.style.setProperty("--sy", `${(visible ? r!.top + r!.height / 2 - st.top : st.height * 0.32).toFixed(0)}px`);
    };
    const leave = () => {
      if (mode === "leave" || mode === "start") return;
      if (mode === "intro") {
        // skipped from the opening: the film's last frame under the light
        introAt(introBox.current!, 1, reduced);
        cur = n - 1;
        layers.current.forEach((l, k) => l?.classList.toggle("rl-on", k === cur));
        near();
      }
      videos.current[cur]?.pause();
      setMode("leave");
      t0 = performance.now();
      stepped = 0;
      showCue(null);
      showSkip(false);
      const ob = outroBox.current;
      if (ob) {
        aimOutro(ob);
        ob.style.display = "block";
      }
      root.classList.add("hf-outro");
    };
    const landed = () => {
      const ob = outroBox.current;
      if (ob) ob.style.display = "none";
      cover.style.display = "none";
      root.classList.remove("hf-outro");
      setMode("end");
      // back at the top, the film waits on its last frame with the sign lit
      cur = n - 1;
      layers.current.forEach((l, k) => {
        if (!l) return;
        l.classList.toggle("rl-on", k === cur);
        l.style.opacity = "1";
      });
      near();
      const v = videos.current[cur];
      if (v && v.duration) v.currentTime = Math.max(0, v.duration - 0.05);
      drive(cur, 1);
      setBars(1);
      showCue(endLabel);
    };

    // ---------- every frame, while the film is on screen ----------
    let raf = 0;
    let onScreen = true;
    const frame = () => {
      raf = 0;
      if (destroyed || !onScreen) return;
      const now = performance.now();
      if (mode === "start") {
        const q = clamp01((now - t0) / INTRO_MS);
        if (introBox.current) introAt(introBox.current, reduced ? q : sm(q), reduced);
        if (q >= 1) show(0, "cut");
      } else if (mode === "play" || mode === "end") {
        // the scenes either side wait stopped on their first frame: a hidden one that runs
        // on (an iPhone sometimes lets it) is stopped and sent back, unless it is on its way
        // out on screen (the scene before, fading) or being primed
        for (const k of [cur - 1, cur + 1]) {
          const ov = videos.current[k];
          if (!ov || ov.paused || priming[k] || layers.current[k]?.classList.contains("rl-on")) continue;
          rest(k);
        }
        const v = videos.current[cur];
        const d = dur(cur);
        const p = mode === "end" ? 1 : d && v ? v.currentTime / d : 0;
        drive(cur, p);
        setBars(p);
        if (mode === "play" && v && d && (v.ended || v.currentTime >= d - 0.03)) {
          if (cur < n - 1) show(cur + 1, "cut");
          else {
            setMode("end");
            showCue(endLabel);
            showSkip(false);
          }
        }
      } else if (mode === "leave") {
        const q = clamp01((now - t0) / BURST_MS);
        const ob = outroBox.current;
        if (ob) {
          ob.style.setProperty("--fl", (sm(q / 0.1) * (1 - sm((q - 0.12) / 0.14))).toFixed(4));
          const b = clamp01((q - 0.06) / 0.44);
          ob.style.setProperty("--b", (1 - (1 - b) * (1 - b)).toFixed(4));
          ob.style.setProperty("--rg", Math.sin(Math.PI * clamp01((q - 0.06) / 0.5)).toFixed(4));
          ob.style.setProperty("--w", sm((q - 0.46) / 0.26).toFixed(4));
        }
        if (q >= STEP_AT && !stepped) {
          // the screen is all light: the cover takes its place, unseen, and the page steps
          cover.style.display = "block";
          cover.style.opacity = "1";
          stepped = now;
          const el = landOn ? document.querySelector<HTMLElement>(landOn) : null;
          const y = el ? el.getBoundingClientRect().top + window.scrollY : sec.offsetTop + sec.offsetHeight;
          window.scrollTo(0, Math.round(y));
        }
        if (stepped) {
          const u = clamp01((now - stepped) / LIFT_MS);
          cover.style.opacity = (1 - sm(u)).toFixed(3);
          if (u >= 1) landed();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!raf && !destroyed) raf = requestAnimationFrame(frame);
    };
    // off screen (in the sections below): the film stops, and costs nothing
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting || mode === "leave";
        const v = videos.current[cur];
        // off screen every video in the film rests, the sites' phones too (they start again with the film)
        if (!onScreen) sec.querySelectorAll("video").forEach((sv) => sv.pause());
        else {
          if (mode === "play") v?.play().catch(() => {});
          run();
        }
      },
      { threshold: 0.01 },
    );
    io.observe(sec);

    // ---------- the gestures, like Instagram stories ----------
    const atTop = () => window.scrollY <= 2;
    const next = () => {
      if (mode === "intro") return begin();
      if (mode === "start" || mode === "leave") return;
      swiped = true;
      hideHint();
      if (mode === "play") flash("fwd");
      if (mode === "play" && cur < n - 1) return show(cur + 1, "fade");
      if (mode === "play" && cur === n - 1) {
        // the last scene: to its end, where the sign is lit; the next tap leaves
        const v = videos.current[cur];
        if (v && v.duration && v.currentTime < v.duration - 1.2) {
          v.currentTime = Math.max(0, v.duration - 0.05);
          return;
        }
      }
      leave();
    };
    const back = () => {
      if (mode !== "play" && mode !== "end") return;
      swiped = true;
      hideHint();
      if (mode === "play") flash("back");
      // the scene before; on the first scene, and at the end, the same scene again
      show(Math.max(0, cur - (mode === "end" ? 0 : 1)), "fade");
    };
    // a first touch lets every attached video play on an iPhone in Low Power Mode
    const unlock = () => {
      for (let k = 0; k < n; k++) if (videos.current[k]?.dataset.src && !primed[k]) prime(k);
    };
    const zone = (x: number) => (x > window.innerWidth * (1 - BACK_ZONE) ? "back" : "fwd");
    const onLink = (t: EventTarget | null) => t instanceof Element && !!t.closest("a, button");
    const inStage = (t: EventTarget | null) => t instanceof Node && sec.contains(t);

    // a press: a tap goes on or back, a hold runs fast or pauses, a slide is a swipe
    let y0 = 0;
    let x0 = 0;
    let pressing = false;
    let held: "fwd" | "back" | null = null;
    let holdTimer = 0;
    const press = (x: number, y: number, target: EventTarget | null) => {
      y0 = y;
      x0 = x;
      clearTimeout(holdTimer);
      if (mode === "play" && !guideOn && inStage(target) && !onLink(target)) {
        holdTimer = window.setTimeout(() => {
          held = zone(x0);
          hideHint();
          side(held)?.classList.add("held");
          if (held === "fwd") setFast(true);
          else videos.current[cur]?.pause();
        }, HOLD_MS);
      }
    };
    const unhold = () => {
      clearTimeout(holdTimer);
      if (!held) return false;
      side(held)?.classList.remove("held");
      if (held === "fwd") setFast(false);
      else if (mode === "play") videos.current[cur]?.play().catch(() => {});
      held = null;
      return true;
    };
    const release = (x: number, y: number, target: EventTarget | null) => {
      if (unhold() || mode === "leave") return;
      // the guide is up: this touch only closes it
      if (guideOn) return closeGuide();
      const dy = y - y0;
      const dx = x - x0;
      if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) next();
        else back();
        return;
      }
      if (Math.abs(dy) > 12 || Math.abs(dx) > 12 || !inStage(target) || onLink(target)) return;
      if (mode === "intro") return begin();
      if (zone(x) === "fwd") next();
      else back();
    };

    let lastTouch = 0;
    const onStart = (e: TouchEvent) => {
      lastTouch = performance.now();
      pressing = (atTop() && mode !== "start") || mode === "leave";
      if (!pressing || e.touches.length > 1) return;
      press(e.touches[0].clientX, e.touches[0].clientY, e.target);
    };
    const onMove = (e: TouchEvent) => {
      if (!pressing) return;
      e.preventDefault();
      const t = e.touches[0];
      if (Math.abs(t.clientY - y0) > 12 || Math.abs(t.clientX - x0) > 12) unhold();
    };
    const onEnd = (e: TouchEvent) => {
      lastTouch = performance.now();
      if (!pressing) return;
      pressing = false;
      unlock();
      const t = e.changedTouches[0];
      release(t.clientX, t.clientY, e.target);
    };
    // a computer with ?mode=reel: the mouse does the same (not the clicks a touch also sends)
    const mouseOk = () => performance.now() - lastTouch > 900;
    const onDown = (e: MouseEvent) => {
      if (!mouseOk() || e.button !== 0 || !atTop() || mode === "start") return;
      pressing = true;
      press(e.clientX, e.clientY, e.target);
    };
    const onUp = (e: MouseEvent) => {
      if (!mouseOk() || !pressing) return;
      pressing = false;
      release(e.clientX, e.clientY, e.target);
    };
    // a computer with ?mode=reel: the wheel and the keys, one step per gesture
    let wheelAt = 0;
    const onWheel = (e: WheelEvent) => {
      if (!atTop() && mode !== "leave") return;
      e.preventDefault();
      const now = performance.now();
      const fresh = now - wheelAt > 260;
      wheelAt = now;
      if (!fresh || Math.abs(e.deltaY) < 4 || mode === "leave") return;
      if (e.deltaY > 0) next();
      else back();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!atTop() || mode === "leave") return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    sec.addEventListener("mousedown", onDown);
    // a long press is ours (fast, pause): no copy menu, no picture preview
    const noMenu = (e: Event) => e.preventDefault();
    sec.addEventListener("contextmenu", noMenu);
    window.addEventListener("mouseup", onUp);
    const onSkip = () => leave();
    skipBtn?.addEventListener("click", onSkip);

    // the captions' words too: here the film is watched, not scrolled
    sec.querySelectorAll<HTMLElement>(".kc-line").forEach((el) => {
      if (el.textContent?.includes("גוללים")) el.textContent = el.textContent.replace("גוללים", "רואים");
    });
    // the opening's words: here the film moves with a tap, not a scroll
    introEl?.querySelectorAll<HTMLElement>(".dn-open-sub, .swipe-cue-label").forEach((el) => {
      if (el.textContent?.includes("גללו")) el.textContent = el.textContent.replace("גללו", "לחצו");
    });

    // ---------- where to start ----------
    if (window.scrollY > 50) {
      // came back to the page lower down: the film waits on its last frame
      if (introBox.current) introAt(introBox.current, 1, reduced);
      ready = true;
      landed();
    } else {
      if (introBox.current) introAt(introBox.current, 0, reduced);
      gate();
      attach(0);
      prime(0);
    }
    run();

    return () => {
      destroyed = true;
      setChapterStack(1);
      root.classList.remove("reel-mode", "hf-wait", "hf-outro");
      cancelAnimationFrame(raf);
      io.disconnect();
      cover.remove();
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      skipBtn?.removeEventListener("click", onSkip);
      sec.removeEventListener("mousedown", onDown);
      sec.removeEventListener("contextmenu", noMenu);
      window.removeEventListener("mouseup", onUp);
      clearTimeout(guideTimer);
      clearTimeout(holdTimer);
      for (let k = 0; k < n; k++) detach(k);
      blobs.forEach((u) => u && URL.revokeObjectURL(u));
      loader.destroy();
    };
  }, [scenes, landOn, endLabel]);

  return (
    <section ref={section} className="hf hf-one hf-reel" aria-label="הסרט">
      <div className="hf-stage">
        {scenes.map((s, i) => (
          <div
            key={s.name}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className={`hf-layer hf-${s.name}${i === 0 ? " rl-on" : ""}`}
            role="img"
            aria-label={s.label}
          >
            <video
              ref={(el) => {
                videos.current[i] = el;
              }}
              className="hf-pic"
              muted
              playsInline
              preload="auto"
              poster={`${s.media.base}/poster.webp`}
              aria-hidden
            />
            <div
              ref={(el) => {
                caps.current[i] = el;
              }}
            >
              {(s.captions ?? []).map((c) => (
                <KineticCaption key={c.from} {...c} />
              ))}
            </div>
            {extras?.[s.name] && (
              <div
                ref={(el) => {
                  chs.current[i] = el;
                }}
                className="ch-host"
              >
                {extras[s.name]}
              </div>
            )}
            {s.finale && (
              <div
                ref={(el) => {
                  fins.current[i] = el;
                }}
                className="dn-fin-host"
              >
                <Finale />
              </div>
            )}
          </div>
        ))}
        {intro && (
          <div ref={introBox} className="dn-intro-host">
            {intro}
          </div>
        )}
        <div ref={outroBox} className="dn-outro" aria-hidden>
          <i className="dn-burst" />
          <i className="dn-burst-ring" />
          <i className="dn-flare" />
          <i className="dn-outro-fill" />
        </div>
        <div className="rl-bars" aria-hidden>
          {scenes.map((s, i) => (
            <i key={s.name}>
              <b
                ref={(el) => {
                  bars.current[i] = el;
                }}
              />
            </i>
          ))}
        </div>
        <div ref={cue} className="rl-cue" aria-hidden>
          <i />
          <span>{endLabel}</span>
        </div>
        <div ref={guide} className="rl-guide" aria-hidden>
          <div className="rl-guide-h">
            <span className="rl-guide-bars">
              <i />
              <i />
              <i />
            </span>
            <b>צופים כמו בסטורי</b>
            <span>הסרט עובר כמו סטורי באינסטגרם</span>
          </div>
          <div className="rl-guide-zones">
            <div className="rl-guide-zone rl-guide-fwd">
              <span className="rl-hand">
                <Hand />
              </span>
              <b>לחיצה כאן: הסצנה הבאה</b>
              <small>החזקה: מהר פי 2</small>
            </div>
            <div className="rl-guide-zone rl-guide-back">
              <span className="rl-hand">
                <Hand />
              </span>
              <b>כאן: אחורה</b>
              <small>החזקה: עצירה</small>
            </div>
          </div>
          <span className="rl-guide-go">לחיצה בכל מקום ומתחילים</span>
        </div>
        <div ref={fastBadge} className="rl-fast" aria-hidden>
          <i />
          <i />
          <span>2x</span>
        </div>
        {/* the bar under the film: which side does what, in words, like stories (RTL: back on the right) */}
        <div ref={ctrl} className="rl-ctrl">
          <span ref={btnBack} className="rl-btn rl-btn-back" aria-hidden>
            <i />
            <span>
              <b>אחורה</b>
              <small>החזקה: עצירה</small>
            </span>
          </span>
          <span className="rl-ctrl-mid">
            <b aria-hidden>{ctrlLabel}</b>
            <button ref={skip} type="button" className="rl-skip">
              {skipLabel}
            </button>
          </span>
          <span ref={btnFwd} className="rl-btn rl-btn-fwd" aria-hidden>
            <span>
              <b>הבא</b>
              <small>החזקה: מהר</small>
            </span>
            <i />
          </span>
        </div>
      </div>
    </section>
  );
}
