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
import { Film } from "./Film";
import { KineticCaption, kinetic, type KineticProps } from "./Kinetic";
import { Finale, finaleAt } from "@/components/Finale";
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

export default function OneFilm({ scenes }: { scenes: OneScene[] }) {
  const section = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const spacers = useRef<(HTMLDivElement | null)[]>([]);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const fins = useRef<(HTMLDivElement | null)[]>([]);

  const starts: number[] = [];
  scenes.reduce((a, s) => (starts.push(a), a + len(s)), 0);
  const total = scenes.reduce((a, s) => a + len(s), 0);

  useEffect(() => {
    const sec = section.current;
    if (!sec) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const debug = /[?&]debug=film\b/.test(location.search);
    const films: (Film | null)[] = scenes.map(() => null);

    // which layer is on: the scene whose stretch of scroll we are in
    let top = 0;
    let at: number[] = [];
    const measure = () => {
      top = sec.getBoundingClientRect().top + window.scrollY;
      at = spacers.current.map((s) => s?.offsetTop ?? 0);
    };
    let on = -1;
    const pick = () => {
      const y = window.scrollY - top;
      let i = 0;
      for (let k = 1; k < at.length; k++) if (y >= at[k]) i = k;
      if (i !== on) {
        layers.current.forEach((l, k) => l && (l.style.visibility = k === i ? "visible" : "hidden"));
        on = i;
      }
    };
    measure();
    pick();
    let raf = 0;
    const loop = () => {
      pick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => {
      measure();
      pick();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("film:measure", onResize);

    // each scene's engine (and its download) starts when its stretch is a couple of screens away
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
        monitor: debug && i === 0,
        captions: [],
      });
      film.track((p) => {
        const c = caps.current[i];
        if (c) kinetic(c, p, reduced);
        const f = fins.current[i];
        if (f) finaleAt(f, p, reduced, 0.5);
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
    spacers.current.forEach((s) => s && io.observe(s));

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("film:measure", onResize);
      films.forEach((f) => f?.destroy());
    };
  }, [scenes]);

  return (
    <section ref={section} className="hf hf-one" style={{ height: `calc(var(--svh, 1svh) * ${total + 100})` }}>
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
