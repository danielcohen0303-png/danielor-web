"use client";

// The way to WhatsApp: every WhatsApp button goes through here, so the visit
// counter counts the clicks as visits to /wa (Adele's site, 30.10: "measure
// what works"), then on to the chat. No emoji in the text: it broke into �.
import { useEffect } from "react";
import { site } from "@/site.config";

const WHATSAPP = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(site.contact.whatsappText)}`;

export default function Wa() {
  useEffect(() => {
    // a moment for the counter to record the visit, then on
    const t = setTimeout(() => location.replace(WHATSAPP), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <p>
        פותחים את הוואטסאפ…
        <br />
        <a href={WHATSAPP}>אם זה לא נפתח, לחצו כאן</a>
      </p>
    </main>
  );
}
