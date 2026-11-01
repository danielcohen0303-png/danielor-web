# תבנית אתר סרט גלילה

התבנית שממנה בונים אתר ״סרט גלילה״: גוללים, והסרט זז עם האצבע, סצנה אחרי סצנה. היא חלקה באייפון וגם מתוך אינסטגרם.

איך בונים, וכל הלקחים: הסקיל **`scroll-film-site`** (`~/.claude/skills/scroll-film-site/`).

## בקצרה
1. **מעתיקים את התבנית לתיקייה חדשה,** בלי `node_modules`, `.git`, `.vercel` ו-`public/film/*`. אחר כך `npm ci`.
2. **כל ההתאמה ב-`src/site.config.ts`:** שם, קול, פרטי קשר, פרטים משפטיים, צבעים, טופס, סצנות, ״על״ ושאלות.
3. **מדיה לכל סצנה:**
   ```bash
   bash scripts/media/build-film.sh media-src/<scene>.mp4 <scene> v1
   ```
4. **בדיקות:**
   ```bash
   python3 scripts/qa/film.py <url>
   python3 scripts/qa/pages.py <url>
   python3 scripts/qa/form.py <url>
   ```
5. **פריסה:**
   ```bash
   npx vercel deploy --prod --yes --scope team_fPPPT7eZCBNAryq3ZNb1fleH
   ```

## מבנה
| | |
|---|---|
| `src/film/` | המנוע: לא משנים בלי סיבה. ראו `references/engine.md` בסקיל |
| `src/components/` | הדף: פתיחה, ״על״, שאלות, טופס ופוטר |
| `src/app/api/lead` | הטופס: Resend ו/או וובהוק. בלי מפתחות הליד רק נרשם ביומן |
| `src/app/wa` | הקישור לוואטסאפ, נספר במדידה |
| `examples/adele/` | האתר המלא של אדל, לעיון: פתיחת ניאון, ״לפני ואחרי״, כל האתר בתוך אייפון במחשב |
| `scripts/` | `media/build-film.sh` · `og/make-og.py` · `qa/` |

## למה ככה
המנוע של אדל, שהיה חלק באייפון, הוא הבסיס. עליו נוסף מה שלמדנו באתר של AC:
- **אורך קבוע** (`FrozenSvh`), כדי שהסרגלים של אינסטגרם לא יזיזו את הדף.
- **גרסת 720p לצילום עמוס.**
- **היד שמראה איך גוללים.**

ההשוואה המלאה: `~/Desktop/AC HOLDING/סקיל-אתרי-סרט/01-השוואת-מנועים.md`.
