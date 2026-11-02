"use client";

// The whole film on ONE pinned stage (Daniel, 01.11: "the screen that comes up
// between every scene"). The kit gives each scene its own pinned stage and
// hands over by hiding one and showing the next as they scroll past each
// other; on an iPhone the scroll runs ahead of the script, so for a moment the
// two stages showed half and half with the dark between them. Here nothing
// scrolls past anything: one stage stays pinned for the whole film, every
// scene has its own picture layer in it, and the scroll only decides which
// layer is on. A scene ends on the very frame the next one starts with, so the
// switch is invisible.
//
// Each scene keeps its own engine (frames on a computer, video on a phone),
// driven by its own stretch of the scroll: an invisible spacer as long as
// that scene's film, laid end to end under the stage.
import { useEffect, useRef } from "react";
import { AssetLoader } from "./AssetLoader";
import { Film } from "./Film";
import { KineticCaption, kinetic, type KineticProps } from "./Kinetic";
import { Finale, finaleAt } from "@/components/Finale";
import { introAt } from "@/components/intro";
import { LETTERS } from "@/components/Sign";
import { chapterAt } from "@/components/Chapters";
import type { FilmMedia } from "./types";
import "./film.css";

export type OneScene = {
  name: string;
  label: string;
  media: FilmMedia;
  /** scroll per second of film, in svh */
  pace?: number;
  captions?: KineticProps[];
  /** the brand sign lights up over the end of this scene */
  finale?: boolean;
};

const len = (s: OneScene) => (s.media.frames / s.media.fps) * (s.pace ?? 100);

export default function OneFilm({
  scenes,
  intro,
  introLen = 0,
  extras,
  outroLen = 0,
}: {
  scenes: OneScene[];
  /** the opening, laid over the stage; it plays across the first introLen svh of scroll */
  intro?: React.ReactNode;
  introLen?: number;
  /** what each chapter shows besides its caption, by scene name (src/components/Chapters.tsx) */
  extras?: Record<string, React.ReactNode>;
  /** after the last frame the stage stays this long (svh) while the star's light bursts over it into the page below */
  outroLen?: number;
}) {
  const section = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const spacers = useRef<(HTMLDivElement | null)[]>([]);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const fins = useRef<(HTMLDivElement | null)[]>([]);
  const chs = useRef<(HTMLDivElement | null)[]>([]);
  const introBox = useRef<HTMLDivElement>(null);
  const outroBox = useRef<HTMLDivElement>(null);

  const starts: number[] = [];
  scenes.reduce((a, s) => (starts.push(a), a + len(s)), introLen);
  const total = scenes.reduce((a, s) => a + len(s), introLen);

  useEffect(() => {
    const sec = section.current;
    if (!sec) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const debug = /[?&]debug=film\b/.test(location.search);
    // ?ch=0: the film without the chapters' elements (to compare on a phone, Daniel 02.11)
    const noCh = /[?&]ch=0\b/.test(location.search);
    if (noCh) document.documentElement.classList.add("no-ch");
    const films: (Film | null)[] = scenes.map(() => null);
    // one download line for the whole film (Daniel, 02.11: on a computer the
    // picture stuck the first time through, while each scene fetched only a
    // window ahead and only from a couple of screens before it). Computers
    // fetch every frame of every scene, the one on screen first, then the next
    // ones in order, so by the time the visitor gets there it is already here.
    const loader = new AssetLoader(touch ? 6 : 12);
    let destroyed = false;
    const rankOf = (k: number) => (k >= on ? k - on : 10 + (on - k));

    // which layer is on: the scene whose stretch of scroll we are in
    let top = 0;
    let at: number[] = [];
    const measure = () => {
      top = sec.getBoundingClientRect().top + window.scrollY;
      at = spacers.current.map((s) => s?.offsetTop ?? 0);
      introPx = at[0] ?? 0;
      // the film's last frame, and the light's stretch after it
      const lastSp = spacers.current[spacers.current.length - 1];
      endPx = lastSp ? lastSp.offsetTop + lastSp.offsetHeight - window.innerHeight : 0;
      outroPx = (outroLen / 100) * window.innerHeight;
    };
    // the burst comes out of the star over the sign (src/components/Finale.tsx)
    const aimOutro = (ob: HTMLElement) => {
      const star = sec.querySelector<HTMLElement>(".dn-fin .dn-sign-star");
      const st = ob.getBoundingClientRect();
      const r = star?.getBoundingClientRect();
      const x = r && r.width ? r.left + r.width / 2 - st.left : st.width / 2;
      const y = r && r.height ? r.top + r.height / 2 - st.top : st.height * 0.3;
      ob.style.setProperty("--sx", `${x.toFixed(0)}px`);
      ob.style.setProperty("--sy", `${y.toFixed(0)}px`);
    };
    let on = -1;
    let introPx = 0;
    let endPx = 0;
    let outroPx = 0;
    let outroQ = -1;
    let outroS = 0;
    let outroAt = performance.now();
    // The landing (Daniel, 02.11: "like stepping off an escalator: you are thrown
    // forward"). In the film a screen of scroll moves the picture a little; after
    // it the page moves one to one, so the same swing of the finger threw the
    // reader down the page, and the burst flashed past. So when the film's last
    // frame is reached going down, the page takes over for a moment: the swing
    // stops, the page glides itself through the burst, slowly, and lands on the
    // first section's title. Then the scroll is the reader's again.
    const LANDING_MS = 2400;
    let lastY = -1;
    let landing: { t0: number; from: number; to: number } | null = null;
    const block = (e: Event) => e.preventDefault();
    const KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
    const blockKey = (e: KeyboardEvent) => KEYS.has(e.key) && e.preventDefault();
    const lock = (hold: boolean) => {
      // a phone: overflow hidden is what stops a swing that is already running.
      // On the root only: on the body it makes the body a scroll box, and the
      // film's sticky stage then scrolls away with the page (Daniel, 02.11: the
      // end went dark and the burst never showed)
      document.documentElement.style.overflow = hold && touch ? "hidden" : "";
      if (hold) {
        window.addEventListener("wheel", block, { passive: false });
        window.addEventListener("touchmove", block, { passive: false });
        window.addEventListener("keydown", blockKey);
      } else {
        window.removeEventListener("wheel", block);
        window.removeEventListener("touchmove", block);
        window.removeEventListener("keydown", blockKey);
      }
    };
    // The entrance on a phone (Daniel, 02.11): the film there plays from whole
    // video files, and a reader who swung down at once met a still picture. So
    // the opening waits for the first scene: the Danielor sign lights letter by
    // letter as its file arrives (the wait is the show), the cue to scroll comes
    // when it is ready, and only then does the page scroll. Never longer than 6
    // seconds; never shorter than about one, so the sign is seen lighting up.
    const openGate = () => {
      const root = document.documentElement;
      const url = `${scenes[0].media.base}/${scenes[0].media.video}`;
      const box = introBox.current;
      const lit = box ? [...box.querySelectorAll<HTMLElement>(".dn-open-sign .dn-sign-on")] : [];
      const order = [...LETTERS.keys()].sort((a, b) => LETTERS[a].d - LETTERS[b].d);
      lit.forEach((el) => (el.style.animation = "none"));
      root.classList.add("hf-wait");
      lock(true);
      let ready = false;
      loader.keep(url).then(() => (ready = true), () => (ready = true));
      const t0 = performance.now();
      const step = () => {
        if (destroyed) return;
        const t = (performance.now() - t0) / 1000;
        const shown = Math.min(ready ? 1 : loader.progress(url), t / 1.1);
        order.forEach((idx, n) => lit[idx] && (lit[idx].style.opacity = shown >= (n + 1) / order.length - 0.001 ? "1" : "0"));
        if ((ready && t >= 1.1) || t >= 6) {
          lit.forEach((el) => (el.style.opacity = "1"));
          root.classList.remove("hf-wait");
          lock(false);
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const pick = () => {
      let y = window.scrollY - top;
      if (!landing && !reduced && outroPx > 0 && lastY >= 0) {
        const jump = y - lastY;
        // crossing the last frame going down, by scrolling (a jump from the menu is not a landing)
        if (lastY < endPx && y >= endPx && jump > 0 && jump < window.innerHeight * 0.6) {
          landing = { t0: performance.now(), from: endPx, to: endPx + outroPx };
          lock(true);
        }
      }
      if (landing) {
        const u = Math.min(1, (performance.now() - landing.t0) / LANDING_MS);
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        y = landing.from + (landing.to - landing.from) * e;
        window.scrollTo(0, top + y);
        if (u >= 1) {
          landing = null;
          lock(false);
        }
      }
      lastY = y;
      if (introBox.current) introAt(introBox.current, introPx > 0 ? Math.min(1, Math.max(0, y / introPx)) : 1, reduced);
      // the outro (Daniel, 02.11): the star over the sign flares, bursts, and its
      // light fills the screen; the light turns into the lilac the page below
      // starts in, so the film hands over without a seam or a line
      const ob = outroBox.current;
      if (ob && outroPx > 0) {
        const qT = Math.min(1, Math.max(0, (y - endPx) / outroPx));
        // the burst takes its time even when the scroll does not (Daniel, 02.11:
        // "slower, so you really see the flash happen"): a slow scroll drives it
        // directly, a fast one lets it play at its own pace, a second and more from
        // the star to the lilac. Only in the last stretch before the stage lets
        // go does it catch up, so the lilac is always there when the page comes
        const now = performance.now();
        const dt = Math.min(0.1, (now - outroAt) / 1000);
        outroAt = now;
        const rate = 0.62 * dt;
        outroS += Math.max(-rate * 1.5, Math.min(rate, qT - outroS));
        outroS = Math.max(outroS, ((qT - 0.85) / 0.15) * 0.72);
        // while landing the page itself sets the pace: the burst follows it exactly
        if (landing) outroS = qT;
        const q = outroS;
        if (q !== outroQ) {
          if (outroQ <= 0 && q > 0) aimOutro(ob);
          outroQ = q;
          document.documentElement.classList.toggle("hf-outro", q > 0);
          const sm = (x: number) => {
            const t = Math.min(1, Math.max(0, x));
            return t * t * (3 - 2 * t);
          };
          // the star gathers light, then gives it all to the burst
          const flare = sm(q / 0.1) * (1 - sm((q - 0.12) / 0.14));
          const b = Math.min(1, Math.max(0, (q - 0.06) / 0.44));
          const burst = 1 - (1 - b) * (1 - b);
          const ring = Math.sin(Math.PI * Math.min(1, Math.max(0, (q - 0.06) / 0.5)));
          const fill = sm((q - 0.46) / 0.26);
          // not rendered at all until it plays: no layers held for it before
          ob.style.display = q > 0 ? "block" : "none";
          ob.style.setProperty("--fl", flare.toFixed(4));
          ob.style.setProperty("--b", burst.toFixed(4));
          ob.style.setProperty("--rg", ring.toFixed(4));
          ob.style.setProperty("--w", fill.toFixed(4));
        }
      }
      let i = 0;
      for (let k = 1; k < at.length; k++) if (y >= at[k]) i = k;
      if (i !== on) {
        layers.current.forEach((l, k) => l && (l.style.visibility = k === i ? "visible" : "hidden"));
        on = i;
        films.forEach((f, k) => f?.setRank(rankOf(k)));
      }
    };
    measure();
    if (touch && !reduced && window.scrollY < 50 && introBox.current) openGate();
    pick();
    let raf = 0;
    const loop = () => {
      pick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => {
      measure();
      if (outroBox.current && outroQ > 0) aimOutro(outroBox.current);
      pick();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("film:measure", onResize);

    // each scene's engine: on a computer all of them from the start (they share
    // the download line, most urgent first); on a phone, where a scene is one
    // video file, when its stretch is a couple of screens away
    const start = (i: number) => {
      const sp = spacers.current[i];
      const cv = canvases.current[i];
      const vd = videos.current[i];
      if (films[i] || !sp || !cv || !vd) return;
      const film = new Film(sp, cv, vd, {
        engine: "hybrid",
        media: scenes[i].media,
        smoothMs: 40,
        blend: true,
        lenis: "off",
        monitor: debug && i === Math.max(0, on),
        captions: [],
        loader,
        prefetchAll: !touch,
      });
      film.setRank(rankOf(i));
      film.track((p) => {
        const c = caps.current[i];
        if (c) kinetic(c, p, reduced);
        const f = fins.current[i];
        if (f) finaleAt(f, p, reduced, 0.5);
        const h = chs.current[i];
        if (h && !noCh) chapterAt(h, p, reduced);
      });
      films[i] = film;
    };
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = spacers.current.indexOf(e.target as HTMLDivElement);
          if (i >= 0) start(i);
        }),
      { rootMargin: "250% 0px" },
    );
    // ?debug=film: the scenes' stats in the console, for checking the download line
    if (debug) (window as unknown as { __films: () => unknown }).__films = () => films.map((f) => f?.stats() ?? null);
    if (touch) {
      spacers.current.forEach((s) => s && io.observe(s));
      // A phone plays each scene from its whole video file, and showed only the
      // still until the file had arrived. Each file used to start downloading a
      // couple of screens before its scene, too late on the first time through
      // (Daniel, 02.11: "it sticks when I scroll"). Now they all download from
      // the start, one after another in the film's order, and wait ready.
      (async () => {
        for (const s of scenes) {
          if (destroyed) return;
          await loader.keep(`${s.media.base}/${s.media.video}`).catch(() => {});
        }
      })();
    } else scenes.forEach((_, i) => start(i));

    return () => {
      destroyed = true;
      if (landing || document.documentElement.classList.contains("hf-wait")) lock(false);
      document.documentElement.classList.remove("hf-wait");
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("film:measure", onResize);
      films.forEach((f) => f?.destroy());
      loader.destroy();
    };
  }, [scenes, outroLen]);

  return (
    <section ref={section} className="hf hf-one" style={{ height: `calc(var(--svh, 1svh) * ${total + outroLen + 100})` }}>
      <div className="hf-stage">
        {scenes.map((s, i) => (
          <div
            key={s.name}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className={`hf-layer hf-${s.name}`}
            style={{ visibility: i === 0 ? "visible" : "hidden" }}
            role="img"
            aria-label={s.label}
          >
            <canvas
              ref={(el) => {
                canvases.current[i] = el;
              }}
              className="hf-pic"
              aria-hidden
            />
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
        {outroLen > 0 && (
          <div ref={outroBox} className="dn-outro" aria-hidden>
            <i className="dn-burst" />
            <i className="dn-burst-ring" />
            <i className="dn-flare" />
            <i className="dn-outro-fill" />
          </div>
        )}
      </div>
      <div className="hf-spacers" aria-hidden>
        {scenes.map((s, i) => (
          <div
            key={s.name}
            ref={(el) => {
              spacers.current[i] = el;
            }}
            className="hf-spacer"
            style={{ top: `calc(var(--svh, 1svh) * ${starts[i]})`, height: `calc(var(--svh, 1svh) * ${len(s) + 100})` }}
          />
        ))}
      </div>
    </section>
  );
}
