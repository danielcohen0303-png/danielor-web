import { NextResponse } from "next/server";
import { site } from "@/site.config";

// A lead from the site's form. Checked, then sent on: an email to the
// business (Resend, if RESEND_API_KEY is set) and a JSON post to a webhook
// (LEAD_WEBHOOK_URL: Make → CRM / Zoho, if set). With neither set (a
// preview), the lead is logged and the form still says thanks, so a test
// never reaches anyone (the AC rule: never a real lead from a test).
//
// Env: RESEND_API_KEY · LEAD_NOTIFY_EMAIL (where it goes) · LEAD_FROM
// ("Site <noreply@your-domain>", a domain verified in Resend) ·
// LEAD_WEBHOOK_URL.

type Lead = { name?: string; phone?: string; email?: string; marketing?: boolean; website?: string; path?: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  let b: Lead;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  // the hidden field: a person never fills it, a bot does. Thank it and drop it.
  if (b.website) return NextResponse.json({ ok: true });
  const name = (b.name || "").trim().slice(0, 80);
  const phone = (b.phone || "").trim().slice(0, 30);
  const email = (b.email || "").trim().slice(0, 120);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const lead = { name, phone, email, marketing: !!b.marketing, path: (b.path || "").slice(0, 200), at: new Date().toISOString(), site: site.name };

  let emailSent = false;
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (key && to) {
    const wa = `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "972")}`;
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
      <h2 style="margin:0 0 12px">ליד חדש מהאתר · ${esc(site.name)}</h2>
      <p><b>שם:</b> ${esc(name)}<br><b>טלפון:</b> ${esc(phone)} · <a href="${wa}">וואטסאפ</a><br>
      <b>אימייל:</b> ${email ? esc(email) : "-"}<br><b>אישור דיוור שיווקי:</b> ${lead.marketing ? "כן" : "לא"}<br>
      <b>עמוד:</b> ${esc(lead.path || "/")}</p></div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM || "Site <onboarding@resend.dev>",
        to,
        ...(email ? { reply_to: email } : {}),
        subject: `ליד חדש: ${name}`,
        html,
      }),
    }).catch(() => null);
    emailSent = !!r?.ok;
  }

  let webhookSent = false;
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) }).catch(() => null);
    webhookSent = !!r?.ok;
  }

  if (!key && !hook) console.log("[lead] no RESEND_API_KEY or LEAD_WEBHOOK_URL: logged only", { path: lead.path });
  return NextResponse.json({ ok: true, emailSent, webhookSent });
}
