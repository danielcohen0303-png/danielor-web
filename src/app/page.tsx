import OneFilm from "@/film/OneFilm";
import ScrollGuide from "@/film/ScrollGuide";
import Opening from "@/components/Opening";
import { chapters } from "@/components/Chapters";
import { Cta } from "@/components/Sections";
import { Faq, Footer, Order, Prices, Process, Solutions, StudioDoor, Work } from "@/components/Live";
import { nav } from "@/live";
import { scenes, site } from "@/site.config";

// The page: the opening in the dark, the film (five scenes cut from one
// continuous take, on one pinned stage, each chapter with one element from the
// live site), then the live site's sections on Danielor's lilac glow.
// Film settings in src/site.config.ts; the live site's content in src/live.ts.
export default function Home() {
  return (
    <main data-desktop={site.desktop}>
      <a href="#content" className="skip">
        דלג לתוכן
      </a>
      <header className="kit-head dn-head">
        <a href="#" className="dn-brand" dir="ltr" aria-label="Danielor">
          DANI<span>ELOR</span>
        </a>
        <nav className="lv-nav" aria-label="ניווט">
          {nav.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <a href="/wa" className="kit-btn kit-btn-sm dn-btn" target="_blank" rel="noopener">
          {site.voice.cta}
        </a>
      </header>

      <div className="screen">
        <OneFilm scenes={scenes} intro={<Opening />} introLen={150} extras={chapters} />
      </div>

      <div id="content" className="dn-after">
        <Solutions />
        <Work />
        <Process />
        <StudioDoor />
        <Prices />
        <Order />
        <Faq />
        <Cta />
        <Footer />
      </div>

      <ScrollGuide hint={site.voice.scrollHint} />
    </main>
  );
}
