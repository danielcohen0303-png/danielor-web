// The one file the site starts from: who it is, how to reach them, the
// colours, the scenes and the sections. Everything on the page reads from
// here; the engine (src/film) and the plumbing (/wa, the legal pages) don't
// change from site to site.
//
// Danielor's scroll film, "שעת הלילך" (01.11.2026): one continuous take at
// lilac dusk where a pink spark links the business worlds, each chapter a
// Danielor service. Hebrew in plural ("גללו"), for everyone.
import type { FilmMedia } from "@/film/types";
import type { KineticProps } from "@/film/Kinetic";

export type Scene = {
  /** used in class names and as the section's id */
  name: string;
  /** what the scene shows, for screen readers */
  label: string;
  media: FilmMedia;
  /** scroll per second of film, in svh (~95-110 played smoothly on an iPhone) */
  pace?: number;
  fromWhite?: number;
  toWhite?: number;
  captions?: KineticProps[];
  card?: Omit<KineticProps, "from" | "to" | "card">;
  steps?: { from: number; to: number; items: string[] };
  /** the brand sign lights up over the end of this scene, with the call to action */
  finale?: boolean;
};

// media: one 16:9 master per scene, cut from the film so each scene ends on
// the very frame the next one starts with (no seam between scenes). Computers
// play 1920x1080 WebP frames; phones play a 9:16 crop as video.
const film = (name: string, frames: number): FilmMedia => ({
  base: `/film/${name}/v1`,
  frames,
  fps: 24,
  framesPhone: "frames/wide",
  framesDesk: "frames/wide",
  video: "video/p720-60.mp4",
  videoLite: "video/lite-60.mp4",
  videoFps: 60,
});

export const site = {
  name: "Danielor · שעת הלילך",
  latin: "DANIELOR",
  latinSub: "AI",
  tagline: "פתרונות AI לעסקים",
  description: "סוכני וואטסאפ, אפליקציות ניהול, אתרים ותוכן AI. צוות סוכני AI עושה את העבודה, ובן אדם מאשר כל דבר.",
  url: "https://danielor-film.vercel.app",
  /** a sample site for now: not indexed until Daniel says it's live */
  index: false,
  desktop: "wide" as "wide" | "phone",

  voice: {
    cta: "דברו איתנו",
    scrollHint: "גללו להמשך",
    openingCue: "גללו והסרט מתחיל",
  },

  contact: {
    whatsapp: "972507149677",
    whatsappText: "היי, הגעתי מהאתר של Danielor ואשמח לשמוע עוד",
    phoneDisplay: "050-714-9677",
    email: "dc@danielor.ai",
    instagram: "https://www.instagram.com/daniel_ccohen/",
  },

  legal: {
    owner: "דניאלור ייעוץ ויזמות בע״מ",
    accessibilityCoordinator: { name: "דניאל כהן", phone: "050-714-9677", email: "dc@danielor.ai" },
    updated: "1 בנובמבר 2026",
  },

  theme: {
    bg: "#f6f1fb",
    ink: "#1d1033",
    soft: "#5f5480",
    accent: "#ff2fc8",
    cta: "#d9109a",
    ctaInk: "#ffffff",
  },

  lead: {
    enabled: false,
    title: "",
    sub: "",
    button: "",
    success: "",
  },

  credit: { text: "כל פריים בסרט הזה נוצר ב-AI, ונבנה אצלנו ב-Danielor", url: "https://danielor.ai" },
};

export const scenes: Scene[] = [
  {
    name: "spark",
    label: "ניצוץ ורוד בחושך, שהופך לטלפון במטבח של מסעדה עם שיחת וואטסאפ",
    media: film("spark", 386),
    pace: 100,
    captions: [
      {
        from: 0.34,
        to: 0.78,
        neon: true,
        top: true,
        script: "AI Agent",
        kicker: "סוכן וואטסאפ AI",
        title: "הלקוחות כותבים|הסוכן כבר עונה",
        line: "24/7, בעברית, בטון של העסק שלך",
      },
    ],
  },
  {
    name: "clinic",
    label: "מחלון המטבח אל קליניקה מעבר לרחוב, עם טאבלט ניהול בדלפק",
    media: film("clinic", 337),
    pace: 100,
    captions: [
      {
        from: 0.26,
        to: 0.62,
        neon: true,
        top: true,
        script: "Business App",
        kicker: "אפליקציית ניהול",
        title: "כל העסק|באפליקציה אחת",
        line: "תורים, לקוחות, תשלומים ותוכן, מהטלפון",
      },
    ],
  },
  {
    name: "studio",
    label: "טבעת האור של הקליניקה הופכת לעדשה של מצלמת קולנוע",
    media: film("studio", 289),
    pace: 100,
    captions: [
      {
        from: 0.3,
        to: 0.78,
        neon: true,
        script: "Studio",
        kicker: "Danielor Studio",
        title: "תוכן שעוצר|את הגלילה",
        line: "פרסומות, רילס ותוכן AI ברמת קולנוע",
      },
    ],
  },
  {
    name: "city",
    label: "מתוך העדשה אל העיר, ורחפן שיורד אל משרד שבו דניאל עובד מול מסך",
    media: film("city", 448),
    pace: 100,
    captions: [
      {
        from: 0.06,
        to: 0.42,
        neon: true,
        script: "Every Business",
        kicker: "לכל עסק, בכל תחום",
        title: "מעסק שכונתי|ועד חברה",
        line: "פתרון AI שנבנה בדיוק לעסק שלך",
      },
      {
        from: 0.76,
        to: 1,
        neon: true,
        script: "Human Touch",
        kicker: "הצוות שלנו",
        title: "סוכני AI עובדים|בן אדם מאשר",
        line: "דניאל עובר על כל דבר לפני שהוא יוצא",
      },
    ],
  },
  {
    name: "sky",
    label: "נגיעה במסך, והמצלמה נכנסת לתוכו אל ים של עננים ורודים, והלוגו של Danielor נדלק",
    media: film("sky", 321),
    pace: 105,
    finale: true,
    captions: [
      {
        from: 0.04,
        to: 0.46,
        neon: true,
        script: "Websites",
        kicker: "אתרים",
        title: "אתר שמרגיש|כמו סרט",
        line: "כמו זה שאתם גוללים עכשיו",
      },
    ],
  },
];

export const services = [
  {
    key: "agent",
    en: "AI Agent",
    title: "סוכן וואטסאפ AI",
    body: "עונה ללקוחות 24/7, מבין שאלות לא צפויות, אוסף פרטים ושולח קישור לתשלום. אתם רק מאשרים.",
  },
  {
    key: "app",
    en: "Business App",
    title: "אפליקציית ניהול לעסק",
    body: "תורים, לקוחות, תשלומים, תוכן ואישורים במקום אחד, באפליקציה שמותקנת בטלפון.",
  },
  {
    key: "web",
    en: "Websites",
    title: "אתרים",
    body: "מדף נחיתה ועד אתר סרט כמו זה. מהיר בטלפון, חלק מתוך אינסטגרם, ומוכן לקבל לידים.",
  },
  {
    key: "studio",
    en: "Studio",
    title: "Danielor Studio",
    body: "פרסומות, רילס, עריכת פודקאסטים ומצגות. שולחים תמונות או רפרנס, ומקבלים תוצאה גמורה.",
  },
];

export const about = {
  kicker: "איך זה עובד",
  title: "צוות של סוכני AI.|ובן אדם בסוף.",
  body: [
    "הצוות שלנו הוא צוות של סוכני AI: כל אחד מומחה בתחום שלו, והם עובדים מהר ומדויק.",
    "ולפני שמשהו יוצא אליכם, דניאל עובר עליו, מתקן ומאשר. ככה מקבלים את המהירות של AI עם העין של בן אדם.",
  ],
};

export const faq: { q: string; a: string }[] = [
  { q: "הסרט הזה באמת נוצר ב-AI?", a: "כן. כל פריים, מהניצוץ ועד העננים, נוצר ב-AI ונערך אצלנו לטייק אחד רציף. אנחנו בונים כאלה גם לעסקים." },
  { q: "לאיזה עסקים זה מתאים?", a: "לכל עסק, מכל תחום: מסעדות, קליניקות, משרדים, חנויות ונותני שירות. מתאימים את הפתרון לעסק, לא את העסק לפתרון." },
  { q: "כמה זמן לוקח להתחיל?", a: "תלוי בפתרון. סוכן וואטסאפ עולה מהר, אפליקציה ואתר לוקחים קצת יותר. בשיחה הראשונה נגיד לכם בדיוק." },
  { q: "איך מתחילים?", a: "כותבים לנו בוואטסאפ. הסוכן שלנו עונה מיד, ודניאל חוזר אליכם אישית." },
];
