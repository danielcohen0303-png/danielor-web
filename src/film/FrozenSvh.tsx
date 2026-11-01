"use client";
import { useEffect } from "react";

// --svh: one svh in px, fixed from the viewport the page opened in. Every
// tall film section is sized `calc(var(--svh, 1svh) * N)`, not `Nsvh`.
//
// Instagram's (and Facebook's) in-app browser resizes the page as its bars
// show and hide, and in svh a film 10-40 screens long grows and shrinks by
// that many times the bar: on the AC site (31.10) 50 px of bar moved
// everything below a 37-screen film by 1,860 px, and a reader past it was
// thrown back into it. Safari keeps svh still; a touch screen refits only
// when its width changes (it turned), a desktop on any resize. Until the
// first fit the fallback (1svh) gives the same height, so nothing moves.
// Films re-measure on the "film:measure" event this sends after a refit.
export default function FrozenSvh() {
  useEffect(() => {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    let width = -1;
    const fit = () => {
      if (touch && window.innerWidth === width) return;
      const first = width < 0;
      width = window.innerWidth;
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;top:0;width:0;height:100svh;visibility:hidden";
      document.body.appendChild(probe);
      const px = probe.getBoundingClientRect().height / 100;
      probe.remove();
      document.documentElement.style.setProperty("--svh", `${px}px`);
      if (!first) window.dispatchEvent(new Event("film:measure"));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return null;
}
