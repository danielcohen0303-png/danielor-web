"use client";
import { useEffect, useRef } from "react";
import "./film.css";

// The scroll guide: a bead on a line at the side shows how far down the page
// the reader is, and when they stop it asks them to keep scrolling (Adele's
// site, 30.10). The hint is in the site's voice (Adele's said "המשיכי לגלול").
export default function ScrollGuide({ hint = "גללו להמשך" }: { hint?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    let idle = 0;
    const pct = el.querySelector<HTMLElement>(".sg-pct");
    const draw = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const f = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      el.style.setProperty("--f", f.toFixed(4));
      if (pct) pct.textContent = `${Math.round(f * 100)}%`;
      el.classList.toggle("sg-end", f > 0.985);
      el.classList.toggle("sg-top", scrollY < innerHeight * 0.5);
      // over the text sections after the film it would sit on the cards: it bows out there
      const c = document.getElementById("content");
      el.classList.toggle("sg-off", !!c && c.getBoundingClientRect().top < innerHeight * 0.7);
    };
    const onScroll = () => {
      el.classList.remove("sg-idle");
      clearTimeout(idle);
      idle = window.setTimeout(() => el.classList.add("sg-idle"), 1800);
      if (!raf) raf = requestAnimationFrame(draw);
    };
    draw();
    idle = window.setTimeout(() => el.classList.add("sg-idle"), 1800);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, []);
  return (
    <div ref={root} className="sg" aria-hidden>
      <i className="sg-line" />
      <span className="sg-bead">
        <span className="sg-pct">0%</span>
        <span className="sg-hint">
          {hint}
          <b>⌄</b>
        </span>
      </span>
    </div>
  );
}
