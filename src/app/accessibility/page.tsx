import type { Metadata } from "next";
import { site } from "@/site.config";
import { Legal } from "../Legal";

export const metadata: Metadata = { title: `הצהרת נגישות · ${site.name}` };

// From Adele's statement (30.10.2026), for a scroll-film site with a text
// page after it. Keep it true: update it whenever the site changes (a new
// form, a new kind of content, a physical place with its own arrangements).
export default function Accessibility() {
  const k = site.legal.accessibilityCoordinator;
  return (
    <Legal title="הצהרת נגישות">
      <p>
        אתר {site.name} (להלן &quot;האתר&quot;) רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל הגולשים, לרבות אנשים עם מוגבלות. אנו פועלים
        כדי שכל אחד ואחת יוכלו לגלוש באתר, לקבל את המידע וליצור קשר בקלות ובעצמאות.
      </p>

      <h2>רמת הנגישות באתר</h2>
      <p>
        האתר נבנה בהתאם להנחיות תקן ישראלי 5568 המבוסס על הנחיות WCAG 2.0 ברמה AA, ובהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות
        (התאמות נגישות לשירות), התשע&quot;ג-2013.
      </p>

      <h2>מה הונגש באתר</h2>
      <ul>
        <li>מבנה קוד סמנטי, שפה וכיוון כתיבה מוגדרים (עברית, מימין לשמאל), ותמיכה בקוראי מסך.</li>
        <li>קישור &quot;דלג לתוכן&quot; בראש העמוד, שמדלג על הסרט אל המידע הכתוב.</li>
        <li>תיאור כתוב לכל סצנה בסרט, וכל מידע שמופיע בסרט מופיע גם בטקסט רגיל.</li>
        <li>ניווט מלא במקלדת, עם חיווי מיקוד (focus) ברור, כולל הטופס ושאלות ותשובות.</li>
        <li>כיבוד הגדרת המכשיר להפחתת תנועה (prefers-reduced-motion): האנימציות נעצרות או מתקצרות.</li>
        <li>התאמה לטלפון, לטאבלט ולמחשב, ואפשרות להגדיל את הטקסט בדפדפן בלי לאבד תוכן.</li>
        <li>ניגודיות צבעים תקינה בין הטקסט לרקע בתוכן הכתוב.</li>
      </ul>

      <h2>מגבלות ידועות</h2>
      <p>
        בראש האתר מוצג סרט שמתקדם עם הגלילה. הסרט הוא חוויה חזותית, ואין בו מידע שלא מופיע גם בטקסט. אפשר לדלג עליו בקישור &quot;דלג
        לתוכן&quot;. אם נתקלתם ברכיב שאינו נגיש, נשמח לדעת ולתקן.
      </p>

      <h2>נתקלתם בבעיה? נשמח לדעת</h2>
      <p>אנו משתדלים לשמור על רמת נגישות גבוהה. אם נתקלתם בקושי או בבעיית נגישות, נשמח שתדווחו לנו ונטפל בכך בהקדם.</p>

      <h2>רכז/ת הנגישות</h2>
      <div className="legal-contact">
        <p>
          <b>{k.name}</b>
        </p>
        <p>
          טלפון: <span dir="ltr">{k.phone}</span>
        </p>
        <p>
          דוא&quot;ל: <a href={`mailto:${k.email}`}>{k.email}</a>
        </p>
      </div>
    </Legal>
  );
}
