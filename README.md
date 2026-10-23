## 0.8.5 — store update

Manifest ID: `com.dantheman.yevamos-family` for a separate store listing. Author: DanTheMan. Existing cases may need to be transferred using backup/import. Includes the death banners and simplified person bubbles from 0.8.4.

## 0.8.4 — clearer person labels

The person picker uses זכר / נקבה; bubbles omit gender badges. Deceased people show a dark lower banner with white נפטר / נפטרה text, without the large X or dagger. Names and notes remain above the banner. Fresh empty sessions no longer immediately count as unsaved, and exported SVGs omit the selection highlight.

Review findings and validation are recorded in [REVIEW.md](REVIEW.md).

## 0.8.2 — Otzaria theme colors

Header and text now use matching surface roles, optional roles fall back to the current host palette, and person/death fills are subtle tints of the current panel. Scrims use transparency rather than an opaque host color. Light, dark, live changes and older theme payloads are tested.

## 0.8.1 — scroll to move, arrows to zoom

Two-finger scrolling and the mouse wheel move the canvas vertically/horizontally without changing magnification. Pixel, line and page wheel units are normalized to the SVG coordinate system. Up/Down arrow keys zoom in/out outside text inputs, dialogs and other interactive controls. Existing plus/minus buttons and drag-to-pan remain available. Manual one-click Save from 0.8.0 is retained.

## 0.8.0 — one manual Save button

Click **שמור** to save all cases on this device, with their automatically derived titles. There is no save name, file picker, or dialog. Edits remain in memory until Save (or Ctrl/Cmd+S). A small status indicates unsaved changes. The browser can warn before leaving with unsaved changes. Existing saved cases load as before; storage keys and case data are unchanged. Backup/import/recovery tools are available under **כלים → גיבוי ושחזור**.

# חידושי גרסה 0.7.0

נוסף איתור דמות לפי שם או הערה במקרה הפתוח. בחירת תוצאה ממקדת את התרשים בדמות ומגדילה אותה לתצוגה קריאה, בלי לשנות את קשרי המשפחה.

שחזור נתונים אינו דורס את השמירה המקורית כאשר אי אפשר לשמור את עותק השחזור. אפשר להוריד את הנתונים המקוריים כקובץ טקסט גם אם אינם גיבוי JSON תקין. אם לא ניתן לקרוא את השמירה בפתיחת התוסף, נשמרת העבודה בזיכרון בלבד עד פתיחה מחדש, כדי שלא להחליף נתונים שלא נקראו.

# משפחות יבמות — גרסה 0.6.0

תוסף אוצריא לבניית תרשימי משפחה ללימוד יבמות, בעברית וללא אינטרנט.

לחצו על התרשים או על „דמות”, ובחרו זכר או נקבה. השם נוסף אוטומטית. לחיצה ימנית על דמות פותחת קו משפחה: למעלה יוצרים הורה, למטה ילד או ילדה, ולצד אח או אחות. קו נישואין מציג רק את המין המתאים לדמות המקור. אפשר לחבר גם דמויות קיימות. לחיצה כפולה עורכת שם, מצב והערה; גרירה מזיזה את הבועה.

ילדים שיש להם שני הורים מחוברים לפס משפחה משותף. כאשר לדמות יש בן או בת זוג יחידים, הם נבחרים כברירת מחדל כהורה השני בעת הוספת ילד; אפשר לשנות את הבחירה ל„לא מוגדר”. כאשר יש כמה בני זוג, יש לבחור את ההורה השני. נישואין שנוספו אחרי ילדים אינם מוסיפים הורות למפרע: אפשר לחבר את ההורה השני לילד הקיים באמצעות קו משפחה.

הערות קצרות כמו „ממזר”, „כהן”, „קטן”, „יבמה” ו„צרה” מופיעות מתחת לשם. עד שתי שורות מוצגות בבועה; ההערה המלאה נשמרת לעריכה ולתצוגה בריחוף. אלו נתוני מקרה שמוזנים ידנית, ולא מסקנות הלכתיות.

עד 12 מקרים פתוחים עם 100 דמויות בכל אחד. כותרת המקרה נוצרת לפי המשפחה. המקרים נשמרים במכשיר ואפשר לגבות אותם בהעתקה והדבקה. ביטול פעולה מחזיר עד 50 עריכות. נתונים מגרסאות קודמות נשמרים, ושמות ברירת מחדל באנגלית מוחלפים בשמות עבריים. שמות מותאמים אישית נשמרים כפי שהוזנו.

תנועת עכבר מעדכנת בועות ותצוגת קו קיימות, ואינה יוצרת מחדש את כל בועות התרשים בכל תזוזה. קווי ההורות והאחים מחושבים מחדש תוך שמירת הבועות עצמן.

נבדקו עברית ומימין לשמאל, הגבלת נישואין, קווי הורים משותפים, אחים, הערות גלויות, יציבות בועות במהלך גרירה ושרטוט, ביטול פעולה, לשוניות ושמירה. התוסף עובר את בדיקות אוצריא הרשמיות. התקנה באוצריא עצמה עדיין טעונה בדיקה.

## חידושי גרסה 0.6.0

נוסף שכפול מקרה בלי שיתוף מזהי דמויות, ביצוע חוזר לצד ביטול פעולה, גיבוי JSON להורדה ולטעינה מקובץ וייצוא תרשים SVG. התצוגה ניתנת להקטנה עד 1% כדי להתאים גם מקרה רחב. נתוני שמירה שאינם ניתנים לקריאה נשמרים לשחזור ואינם נזרקים בשתיקה. כששמירה מקומית נכשלת מופיעה הודעה קבועה להורדת גיבוי; היא אינה נעלמת בעקבות הודעת הצלחה על עריכה.

תוקן כיוון הקשר „ילד/ה של” בחיבור דמויות קיימות. חיבור מורכב שנדחה אינו משאיר קשרים חלקיים. נשמרו שמות עבריים, קווי ילדים משני הורים, פסי אחים, הערות וסימון פטירה בולט. הכלי מצייר את נתוני המקרה ואינו פוסק את דינו.

לבנייה: `python3 build.py`. לבדיקות: `node test_model.cjs`, `node test_placement.cjs`, `node test_session.cjs` ו־`node visual_review.cjs`. בדיקת עומס: `node test_large_case.cjs` מכסה 12 מקרים ובהם 100 דמויות בכל מקרה. בדיקות דפדפן דורשות Playwright ו־Chromium; ניתן להגדיר `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## גרסה 0.4.0

ממשק מחודש עם משטח עבודה המתאים לגודל החלון. ניתן להגדיל ולהקטין באמצעות גלגלת או כפתורים, להזיז באמצעות כלי ההזזה או רווח וגרירה, ולהציג את כל המשפחה באמצעות „כל המשפחה”. כל מקרה שומר את מרכז התצוגה ואת ההגדלה שלו. ניתן לבנות עד 100 דמויות ולמקם אותן גם מחוץ לשטח הראשוני; המרחב מוגבל ל־20,000 יחידות לכל כיוון, וההגדלה הנוכחית היא 1%–250%.

בחלון העריכה של כל בועה מופיעים שדות „אב” ו„אם”, ובהם אפשר לבחור דמות שכבר קיימת בתרשים. לדוגמה: לאחר יצירת יצחק כאביו של אברהם ונישואי יצחק לשרה, פתחו את עריכת אברהם ובחרו שרה בשדה „אם”. הנישואין אינם משנים את ההורות למפרע באופן אוטומטי.

לחיצה ימנית → „קישור לדמות קיימת” מאפשרת להוסיף קשר הורות, אחים או נישואין ללא תלות בכיוון שבו הדמויות מונחות. באותו חלון אפשר להסיר קשרים קיימים. שלושה אחים מופיעים תחת פס אחים משותף עם ענף לכל דמות, ולא באמצעות קווים העוקפים דמויות ביניים.

נבדקו רצף יצירת האב והנישואין והוספת האם, פס משותף לשלושה אחים, הגדלה והקטנה, הזזת התצוגה, התאמה לכל המשפחה, שמירת התצוגה ומרחב מוגדל. גרסה זו מחליפה את המגבלה הקודמת של 40 דמויות ומשטח קבוע.

## גרסה 0.4.1

דמות שנפטרה מסומנת באיקס גדול בתוך הבועה ובמסגרת מודגשת. השם וההערות נשארים קריאים מעל הסימון. האיקס נעלם כאשר הדמות מסומנת שוב בחיים. הצבעים מותאמים לערכת אוצריא.

## גרסה 0.4.2

סדר השמות לגברים מתחיל בראובן, שמעון, לוי ויהודה, ממשיך בשאר השבטים, ורק אחריהם אברהם, יצחק ויעקב. שמות הנשים מתחילים בשרה, רבקה, רחל ולאה. שמות של דמויות קיימות אינם משתנים.

## גרסה 0.4.3

בחירת קו משפחה או נישואין מכבה את מצב הזזת התרשים. לחיצה שמאלית ממקמת את הדמות, ובנישואין בן או בת הזוג נוצרים מיד במין המתאים. נוסף כפתור „הוספה במיקום המסומן” לצורך הצבה מפורשת. תצוגת הנישואין המקדימה מציגה את השם המוצע.
