<div dir="rtl">

# דוראק (Durak)

משחק הקלפים הרוסי הקלאסי דוראק כאפליקציית ווב (PWA) לשחקן יחיד מול יריבי מחשב.
כל הממשק בעברית, RTL, מותאם קודם כל למובייל ומתרחב יפה לדסקטופ.

## מה בפנים

- Vite + React 18 + TypeScript (strict)
- CSS Modules ומשתני CSS, אייקוני SVG מוטמעים, בלי ספריות UI ובלי CDN חיצוני
- מנוע משחק טהור ב־`src/engine/` (ללא React) שמפעיל את הממשק דרך `useReducer`
- שלוש רמות קושי של בוטים (קל, רגיל, קשה) שרואים רק מידע גלוי
- בדיקות Vitest ב־`tests/` כולל סימולציות של משחקים שלמים
- PWA עם `vite-plugin-pwa`: עובד אופליין וניתן להתקנה

## דרישות

- Node 20 ומעלה
- npm

## הרצה מקומית

```bash
npm install
npm run dev
```

שרת הפיתוח יודפס בטרמינל, בדרך כלל בכתובת `http://localhost:5173`.

## בדיקות

```bash
npm test
```

## בנייה

```bash
npm run build
```

הפקודה מריצה בדיקת טיפוסים (`tsc`) ואז בונה גרסת פרודקשן לתיקייה `dist/`.
כדי להריץ את הגרסה הבנויה באופן מקומי:

```bash
npm run preview
```

## פריסה ל־Netlify

הפרויקט כולל קובץ `netlify.toml` שמגדיר את פקודת הבנייה, תיקיית הפרסום והפניה של כל הנתיבים ל־`index.html`.

**דרך ממשק Netlify:**

1. דחפו את הקוד ל־GitHub.
2. ב־Netlify בחרו Add new site ואז Import an existing project, וחברו את המאגר.
3. Netlify יקרא את ההגדרות מ־`netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. לחצו Deploy. כל push לענף המחובר יפרוס גרסה חדשה אוטומטית.

**דרך שורת הפקודה (Netlify CLI):**

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

## סקריפטים

| פקודה | מה היא עושה |
| --- | --- |
| `npm run dev` | שרת פיתוח מקומי |
| `npm run build` | בדיקת טיפוסים ובנייה ל־`dist/` |
| `npm run preview` | הרצת הגרסה הבנויה |
| `npm test` | הרצת בדיקות המנוע |
| `npm run typecheck` | בדיקת טיפוסים בלבד |
| `npm run icons` | יצירה מחדש של אייקוני ה־PWA ב־`public/icons` |

## מבנה הפרויקט

```
src/
  engine/        חוקים, חפיסה, ערבוב עם seed, מהלכים חוקיים, reducer
  engine/ai/     אסטרטגיות הבוטים על בסיס מצב גלוי בלבד
  hooks/         useGame: עטיפת ה־reducer, הפעלת הבוטים, יומן ואנימציות
  components/    קלפים, טבעת התקדמות, כפתורים, רכיבי השולחן, icons/
  screens/       תפריט ראשי, הגדרות, חוקים, סטטיסטיקות, משחק
  storage/       הגדרות וסטטיסטיקות ב־localStorage
  audio/         צלילים מסונתזים עם Web Audio
tests/           בדיקות Vitest (חוקים, חלוקה, קלפים, סימולציות)
scripts/         יצירת אייקוני ה־PWA
```

</div>
