"use client";

// The visit counter, the same one the other danielor.ai pages use (site/index.html in
// danielor-web): one row per event in site_events, read by the control app. No cookies
// and no personal details: a random id per browser tab, the path, where the visit came
// from, and which WhatsApp button was pressed.
import { useEffect } from "react";

const URL_ = "https://pdtzwlhskwmwizgcdhsx.supabase.co/rest/v1/site_events";
// a publishable key: it can only add rows to site_events
const KEY = "sb_publishable_Vfs-4S0AuiricAVOIoJX8Q_g4wTQE6w";

function visitId() {
  try {
    let v = sessionStorage.getItem("dv");
    if (!v) { v = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("dv", v); }
    return v;
  } catch { return Math.random().toString(36).slice(2, 12); }
}

// what a WhatsApp button is called in the numbers
function labelOf(a: HTMLAnchorElement) {
  if (a.classList.contains("float")) return "כפתור צף";
  if (a.classList.contains("send")) return "טופס הזמנה";
  if (a.classList.contains("mnav-wa")) return "תפריט";
  if (a.classList.contains("lv-wa-num")) return "מספר הוואטסאפ";
  const t = (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim();
  return t || "וואטסאפ";
}

export default function SiteCounter() {
  useEffect(() => {
    if (!/(^|\.)danielor\.ai$/.test(location.hostname)) return;
    const visit = visitId();
    const device = window.matchMedia("(max-width: 820px)").matches ? "mobile" : "desktop";
    let ref = "";
    try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch { /* no referrer */ }
    if (ref === location.hostname) ref = "";
    const q = new URLSearchParams(location.search);
    const utm = [q.get("utm_source"), q.get("utm_campaign")].filter(Boolean).join("/");
    const send = (event: string, label?: string) => {
      try {
        fetch(URL_, {
          method: "POST", keepalive: true,
          headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ event, label: label ? label.slice(0, 120) : null, path: location.pathname.slice(0, 200),
            ref: ref.slice(0, 120) || null, utm: utm.slice(0, 120) || null, device, visit }),
        }).catch(() => {});
      } catch { /* never break the page */ }
    };
    // /wa is the hop to WhatsApp: its click was already counted on the page that sent here
    if (location.pathname.replace(/\/$/, "") !== "/wa") send("view");
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!/wa\.me|whatsapp/.test(a.href || href) && !/^\/wa\/?(\?|$)/.test(href)) return;
      // the order form only opens WhatsApp once there is a name
      if (a.classList.contains("send") && !(document.getElementById("f-name") as HTMLInputElement | null)?.value.trim()) return;
      send("wa_click", labelOf(a));
    };
    document.addEventListener("click", onClick, true);
    let seen = false;
    const onScroll = () => {
      if (seen) return;
      const h = document.documentElement;
      if ((h.scrollTop + innerHeight) / h.scrollHeight > 0.75) { seen = true; send("scroll_75"); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("scroll", onScroll); };
  }, []);
  return null;
}
