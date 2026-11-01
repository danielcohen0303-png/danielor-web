// The frame of the legal pages (accessibility statement, privacy): plain and
// readable, with the way back to the site at the top.
import Link from "next/link";
import { site } from "@/site.config";
import "./legal.css";

export function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="legal" id="content">
      <Link href="/" className="legal-back">
        → חזרה לאתר
      </Link>
      <p className="legal-brand">{site.latin}</p>
      <h1>{title}</h1>
      <p className="legal-updated">עודכן לאחרונה: {site.legal.updated}</p>
      {children}
    </main>
  );
}

export function Contact() {
  const c = site.contact;
  return (
    <div className="legal-contact">
      <p>
        <b>{site.legal.owner}</b>
      </p>
      <p>
        טלפון: <span dir="ltr">{c.phoneDisplay}</span>
      </p>
      <p>
        דוא&quot;ל: <a href={`mailto:${c.email}`}>{c.email}</a>
      </p>
    </div>
  );
}
