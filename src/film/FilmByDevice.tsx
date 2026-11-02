"use client";

// Which film this device gets (Daniel, 02.11): a phone gets the reel, where
// every scene simply plays and a swipe moves between them (src/film/ReelFilm.tsx);
// a computer, and a tablet, keep the whole scroll film (src/film/OneFilm.tsx).
// ?mode=reel or ?mode=scroll forces one, to compare on any device.
// Until the device is known (the first moment after load) the stage shows the
// opening alone, so the first paint is the same either way.
import { useSyncExternalStore } from "react";
import OneFilm, { type OneScene } from "./OneFilm";
import ReelFilm from "./ReelFilm";

type Mode = "scroll" | "reel";

const noSubscribe = () => () => {};
const noMode = () => null;
const pickMode = (): Mode => {
  const asked = new URLSearchParams(location.search).get("mode");
  if (asked === "reel" || asked === "scroll") return asked;
  const phone = window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 700;
  return phone ? "reel" : "scroll";
};

export default function FilmByDevice({
  scenes,
  intro,
  introLen,
  extras,
  outroLen,
  landOn,
}: {
  scenes: OneScene[];
  intro?: React.ReactNode;
  introLen?: number;
  extras?: Record<string, React.ReactNode>;
  outroLen?: number;
  landOn?: string;
}) {
  // nothing during the server render and hydration, the device's mode right after
  const mode = useSyncExternalStore(noSubscribe, pickMode, noMode);
  if (mode === "reel") return <ReelFilm scenes={scenes} intro={intro} extras={extras} landOn={landOn} />;
  if (mode === "scroll")
    return <OneFilm scenes={scenes} intro={intro} introLen={introLen} extras={extras} outroLen={outroLen} landOn={landOn} />;
  return (
    <section className="hf hf-one hf-wait-stage" aria-hidden>
      <div className="hf-stage">{intro && <div className="dn-intro-host">{intro}</div>}</div>
    </section>
  );
}
