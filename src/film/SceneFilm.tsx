"use client";

// One treatment scene after the opening: its own pinned stage and film, on
// the same engine and settings as the opening (video on phones, frames on
// computers, 40 ms ease). It can open out of the white of the light that
// ended the scene before it: the white fades as the film starts. Its title can
// be a card on that white (Daniel, 30.10: captions must not cover the
// treatment): the film holds its first frame while the card plays, the camera
// flies through the card, and the white opens onto the scene.
import { useEffect, useRef } from "react";
import { Film } from "./Film";
import { stageShown } from "./stageShown";
import type { FilmMedia } from "./types";
import { KineticCaption, kinetic, type KineticProps } from "./Kinetic";
import "./film.css";
import { Finale, finaleAt } from "@/components/Finale";

type Props = {
  name: string;
  media: FilmMedia;
  /** scroll per second of film, in svh */
  pace?: number;
  /** film progress over which the white the scene opens from fades away (0 = no white) */
  fromWhite?: number;
  /** film progress from which the scene fades out to white, for the next scene to open from (0 = none) */
  toWhite?: number;
  captions?: KineticProps[];
  /** the title card on the white before the film starts */
  card?: Omit<KineticProps, "from" | "to" | "card">;
  /** share of the section's scroll the card takes before the film starts */
  cardLen?: number;
  /** the treatment's steps, shown one at a time across this stretch of the film */
  steps?: { from: number; to: number; items: string[] };
  /** the brand sign lights up over the end of this scene, with the call to action */
  finale?: boolean;
  label: string;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => clamp01(x) * clamp01(x) * (3 - 2 * clamp01(x));

export default function SceneFilm({
  name,
  media,
  pace = 110,
  fromWhite = 0,
  toWhite = 0,
  captions = [],
  card,
  cardLen = 0.3,
  steps,
  finale,
  label,
}: Props) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const white = useRef<HTMLDivElement>(null);
  const caps = useRef<HTMLDivElement>(null);
  const cardHost = useRef<HTMLDivElement>(null);
  const stepsBox = useRef<HTMLDivElement>(null);
  const fin = useRef<HTMLDivElement>(null);
  const lead = card ? cardLen : 0;
  const svh = ((media.frames / media.fps) * pace) / (1 - lead);

  useEffect(() => {
    if (!section.current || !canvas.current || !video.current) return;
    // the film (and its download) starts only when the scene is a couple of screens away:
    // on a phone the four films together are ~45 MB, and the first one should not wait for the others
    let film: Film | null = null;
    const start = () => {
      if (film || !section.current || !canvas.current || !video.current) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      film = new Film(section.current, canvas.current, video.current, {
        engine: "hybrid",
        media,
        smoothMs: 40,
        blend: true,
        lenis: "off",
        monitor: /[?&]debug=film\b/.test(location.search),
        captions: [],
        lead,
      });
      film.track((p, raw) => {
        // the section rides up under the one before it (margin -100svh), so it is on screen only once it is pinned:
        // it takes over exactly where the white of the scene before ends, with no seam scrolling through (Daniel, 30.10)
        if (stage.current && section.current)
          stage.current.style.visibility = stageShown(stage.current, section.current) ? "visible" : "hidden";
        // captions over the picture follow the film; the card follows the scroll before the film starts
        if (caps.current) kinetic(caps.current, p, reduced);
        if (cardHost.current) kinetic(cardHost.current, raw, reduced);
        if (fin.current) finaleAt(fin.current, p, reduced, 0.5);
        if (stepsBox.current && steps)
          stepsAt(stepsBox.current, p, steps, reduced);
        if (white.current) {
          // with a card: white while the card plays, opening onto the scene as the camera flies through it
          // (it waits until the card is gone, then bursts open quickly: no washed-out scene under a fading card)
          const inn = lead
            ? 1 - smooth((raw - lead * 0.86) / (lead * 0.14))
            : fromWhite
              ? 1 - smooth(p / fromWhite)
              : 0;
          const out = toWhite ? smooth((p - toWhite) / (1 - toWhite)) : 0;
          white.current.style.opacity = String(Math.max(inn, out));
        }
      });
    };
    const io = new IntersectionObserver(
      (e) => e.some((x) => x.isIntersecting) && (start(), io.disconnect()),
      { rootMargin: "250% 0px" },
    );
    io.observe(section.current);
    return () => {
      io.disconnect();
      film?.destroy();
    };
  }, [media, fromWhite, toWhite, lead, steps]);

  return (
    <section
      ref={section}
      className={`hf hf-scene hf-${name}`}
      style={{ height: `calc(var(--svh, 1svh) * ${svh})` }}
      aria-label={label}
    >
      <div ref={stage} className="hf-stage">
        <canvas ref={canvas} className="hf-pic" aria-hidden />
        <video
          ref={video}
          className="hf-pic"
          muted
          playsInline
          preload="auto"
          poster={`${media.base}/poster.webp`}
          aria-hidden
        />
        {finale && (
          <div ref={fin} className="dn-fin-host">
            <Finale />
          </div>
        )}
        <div ref={caps}>
          {captions.map((c) => (
            <KineticCaption key={c.from} {...c} />
          ))}
        </div>
        {steps && (
          <div
            ref={stepsBox}
            className="st"
            aria-label={`איך זה עובד אצלי: ${steps.items.join(", ")}`}
          >
            <div className="st-head" aria-hidden>
              <span className="st-title">איך זה עובד אצלי</span>
              <span className="st-count">
                שלב <span className="st-count-n">1</span> מתוך{" "}
                {steps.items.length}
              </span>
            </div>
            <div className="st-body" aria-hidden>
              <span className="st-num">
                <span className="st-roll">
                  {steps.items.map((_, i) => (
                    <span key={i}>{String(i + 1).padStart(2, "0")}</span>
                  ))}
                </span>
              </span>
              <span className="st-labels">
                {steps.items.map((t) => (
                  <span className="st-label" key={t}>
                    {t.split(" ").map((w, j) => (
                      <span className="st-w" key={j}>
                        {w}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </div>
            <div className="st-bar" aria-hidden>
              <i className="st-fill" />
              {steps.items.map((t, i) => (
                <b
                  key={t}
                  style={{
                    insetInlineStart: `${(i / steps.items.length) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {(fromWhite > 0 || toWhite > 0 || card) && (
          <div
            ref={white}
            className={`hf-flash${fromWhite > 0 || card ? " hf-flash-in" : ""}`}
            aria-hidden
          />
        )}
        {card && (
          <div ref={cardHost} className="kc-card-host">
            <KineticCaption {...card} from={0} to={lead} card />
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The steps (Daniel, 30.10: "say what these are, and make them sexier"): a frosted card
 * titled "how I work", the step number rolling like a counter to the next one, the step's
 * words rising out of the depth one by one, and a gold line filling across all the steps
 * with a glowing bead at its tip. Everything follows the film, so it plays backwards too.
 */
function stepsAt(
  box: HTMLElement,
  p: number,
  steps: { from: number; to: number; items: string[] },
  reduced: boolean,
) {
  const n = steps.items.length;
  const seg = (steps.to - steps.from) / n;
  const u = (p - steps.from) / (steps.to - steps.from); // 0..1 across all the steps
  // the card rises in at the start and sinks away at the end
  const inn = smooth(u / 0.05);
  const out = smooth((u - 0.96) / 0.04);
  const vis = Math.min(inn, 1 - out);
  box.style.visibility = vis > 0.001 ? "visible" : "hidden";
  box.style.opacity = String(vis);
  box.style.transform = reduced
    ? ""
    : `translate3d(0, ${((1 - inn) * 30 + out * 16).toFixed(1)}px, 0) scale(${(0.94 + 0.06 * inn).toFixed(3)})`;

  const at = Math.min(n - 1, Math.max(0, Math.floor((p - steps.from) / seg)));
  const k = (p - steps.from - at * seg) / seg; // 0..1 within the current step
  // the counter rolls to the next number in the last moment of a step
  const roll = at + smooth((k - 0.86) / 0.14) * (at < n - 1 ? 1 : 0);
  const r = box.querySelector<HTMLElement>(".st-roll");
  if (r) r.style.transform = `translate3d(0, ${(-roll * 100) / n}%, 0)`;
  const c = box.querySelector<HTMLElement>(".st-count-n");
  if (c) c.textContent = String(Math.round(roll) + 1);

  box.querySelectorAll<HTMLElement>(".st-label").forEach((el, i) => {
    const kk = (p - steps.from - i * seg) / seg;
    const leave = smooth((kk - 0.84) / 0.16);
    el.style.visibility = kk > -0.05 && kk < 1.02 ? "visible" : "hidden";
    el.querySelectorAll<HTMLElement>(".st-w").forEach((w, j) => {
      // each word swings up out of the depth, a little after the one before it
      const t = smooth((kk - 0.02 - j * 0.06) / 0.2);
      w.style.opacity = String(Math.min(t, 1 - leave));
      w.style.transform = reduced
        ? ""
        : `translate3d(0, ${((1 - t) * 60 - leave * 40).toFixed(1)}%, ${((1 - t) * -120).toFixed(0)}px) rotateX(${((1 - t) * -70 + leave * 55).toFixed(1)}deg)`;
      w.style.filter = `blur(${((1 - t) * 6 + leave * 6).toFixed(2)}px)`;
    });
  });

  const fill = box.querySelector<HTMLElement>(".st-fill");
  if (fill) fill.style.transform = `scaleX(${clamp01(u).toFixed(4)})`;
  box
    .querySelectorAll<HTMLElement>(".st-bar b")
    .forEach((b, i) => b.classList.toggle("on", u >= i / n));
  box.style.setProperty("--tip", `${(clamp01(u) * 100).toFixed(2)}%`);
}
