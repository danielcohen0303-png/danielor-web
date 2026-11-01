import SceneFilm from "@/film/SceneFilm";
import ScrollGuide from "@/film/ScrollGuide";
import Opening from "@/components/Opening";
import { About, Cta, Faq, Footer, Services } from "@/components/Sections";
import { scenes, site } from "@/site.config";

// The page: the opening in the dark, the film (five scenes cut from one
// continuous take, each loaded a couple of screens before it), then the
// sections on Danielor's lilac glow. Everything comes from src/site.config.ts.
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
        <a href="/wa" className="kit-btn kit-btn-sm dn-btn" target="_blank" rel="noopener">
          {site.voice.cta}
        </a>
      </header>

      <Opening />

      <div className="screen">
        {scenes.map((s) => (
          <SceneFilm key={s.name} {...s} />
        ))}
      </div>

      <div id="content" className="dn-after">
        <Services />
        <About />
        <Faq />
        <Cta />
        <Footer />
      </div>

      <ScrollGuide hint={site.voice.scrollHint} />
    </main>
  );
}
