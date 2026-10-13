# Choci Store — החזית החדשה של צ'וקי

חנות מהירה (Next.js) שמציגה את המוצרים של צ'וקי. ווקומרס באתר הקיים נשאר "המחסן":
מוצרים, מחירים, מלאי, הזמנות, תשלום (יעד שריג) וחשבוניות — הכול מנוהל שם כמו היום.

- נתונים: WooCommerce Store API (`WC_URL`, ברירת מחדל https://choci.kinsta.cloud)
- כל עמוד נבנה מראש ומתרענן לבד כל 10 דקות (`REVALIDATE`)
- כתובות זהות לאתר בוורדפרס (`/product/...`, `/product-category/...`) — חשוב לגוגל
- גוגל חסום עד ההשקה; להשקה מגדירים `ALLOW_INDEX=1`

## הרצה
```
npm install
npm run build && npm start
```
משתני סביבה: `WC_URL`, `SITE_URL`, `REVALIDATE`, `ALLOW_INDEX`, `MOCK=1` (נתוני דוגמה לפיתוח בלי חיבור).
