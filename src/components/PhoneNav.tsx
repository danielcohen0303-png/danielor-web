"use client";

// The live site's two fixed buttons (Daniel, 02.11: "like the original site"):
// on a phone a round menu button at the top that opens every section (it steps
// aside while scrolling down), and the floating WhatsApp button at the bottom.
// Both wait until the film is behind: over the film the header and the reel's
// own bar are what is on screen. html.dn-past says the film is out of view.
import { useEffect, useRef, useState } from "react";
import { studio, waLink } from "@/live";

const links = [
  { href: "#solutions", label: "הפתרונות", sub: "סוכן, אפליקציה, אתר" },
  { href: "#work", label: "עבודות שבנינו", sub: "ככה זה נראה באמת" },
  { href: "#process", label: "איך עובדים איתנו", sub: "ארבעה צעדים" },
  { href: "#prices", label: "מחירים" },
  { href: "#faq", label: "שאלות נפוצות" },
];

export default function PhoneNav() {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // the film out of view: the page's own buttons come in
  useEffect(() => {
    const film = document.querySelector(".screen");
    const root = document.documentElement;
    if (!film) {
      root.classList.add("dn-past");
      return;
    }
    const io = new IntersectionObserver(([e]) => root.classList.toggle("dn-past", !e.isIntersecting), { threshold: 0 });
    io.observe(film);
    return () => (io.disconnect(), root.classList.remove("dn-past"));
  }, []);

  // the menu button steps aside while scrolling down, and comes back on the way up
  useEffect(() => {
    let last = scrollY;
    let tick = 0;
    const on = () => {
      if (tick) return;
      tick = requestAnimationFrame(() => {
        tick = 0;
        const y = scrollY;
        const b = btn.current;
        if (b) {
          if (y > last + 6 && y > 240) b.classList.add("hide");
          else if (y < last - 6 || y < 240) b.classList.remove("hide");
        }
        last = y;
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => (window.removeEventListener("scroll", on), cancelAnimationFrame(tick));
  }, []);

  // open: the page stays put under it, Escape closes it
  useEffect(() => {
    document.documentElement.classList.toggle("mnav-open", open);
    if (!open) return;
    box.current?.querySelector("a")?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="og mnav-btn"
        aria-expanded={open}
        aria-controls="mnav"
        aria-label="תפריט"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>
      <div
        ref={box}
        className="og mnav"
        id="mnav"
        hidden={!open}
        onClick={(e) => {
          const t = e.target as Element;
          if (t === box.current || t.closest(".mnav-x") || t.closest("a")) setOpen(false);
        }}
      >
        <div className="mnav-card" role="dialog" aria-label="תפריט">
          <div className="mnav-head">
            <b>Danielor</b>
            <button type="button" className="mnav-x" aria-label="סגירת התפריט">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav className="mnav-links" aria-label="ניווט בטלפון">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                <span>{l.label}</span>
                {l.sub && <small>{l.sub}</small>}
              </a>
            ))}
            <a href={studio.href} className="priv" target="_blank" rel="noopener">
              <span>Danielor Studio</span>
              <small>סרטונים, פודקאסטים, טרנדים</small>
            </a>
          </nav>
          <a className="btn btn-pink mnav-wa" href={waLink()} target="_blank" rel="noopener">
            דברו איתנו בוואטסאפ
          </a>
        </div>
      </div>
      <aside aria-label="יצירת קשר">
        <a className="og btn btn-pink float" href={waLink()} target="_blank" rel="noopener" aria-label="שלחו לנו בוואטסאפ">
          <svg className="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.3-.6L4 20l1.3-3.7A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5z" />
            <path d="M8.6 11.6h.01M12 11.6h.01M15.4 11.6h.01" strokeWidth="2.8" />
          </svg>
          <span className="lbl">וואטסאפ</span>
        </a>
      </aside>
    </>
  );
}
