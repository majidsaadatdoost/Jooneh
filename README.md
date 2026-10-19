# جونه 🌱

دفترچه غذایی فارسی با فونت وزیر، غذاهای اختصاصی، دستورهای ساده و باغچه انگیزه.

## سایت و فایل‌ها

آدرس GitHub Pages: https://majidsaadatdoost.github.io/Jooneh/

همه HTML، CSS، JavaScript، کتابخانه ورود و فونت‌ها داخل `docs/` همین ریپازیتوری هستند. سایت بدون build اجرا می‌شود. برای انتشار: Settings → Pages → Deploy from a branch → `main` → `/docs` → Save.

## ورود و نگهداری اطلاعات

اتصال Supabase و دو حساب مجاز راه‌اندازی شده‌اند. نام‌های کاربری: `majid` و `jooneh`. رمزها در ریپازیتوری نیستند. پس از ورود، از تنظیمات سایت می‌توان رمز را تغییر داد.

- GitHub Pages فایل‌های عمومی سایت را ارائه می‌کند.
- Supabase Auth ورود را انجام می‌دهد. نام کاربری در برنامه به یک شناسه ایمیل داخلی با دامنه رزروشده `.invalid` تبدیل می‌شود؛ این شناسه صندوق ایمیل نیست. بازیابی رمز از طریق ایمیل فعال نیست؛ مالک پروژه باید رمز فراموش‌شده را از مسیر مدیریت Auth بازنشانی کند.
- دفترچه و تاریخچه هر حساب در Supabase Postgres ذخیره می‌شود. فقط دو حساب موجود در `jooneh_private.members` اجازه استفاده از دفترچه را دارند. فهرست عضویت و داده‌های شخصی در GitHub نیستند.
- مرورگر نشست ورود را نگه می‌دارد. ثبت‌های تأییدشده با پاک شدن مرورگر حذف نمی‌شوند. برای ثبت جدید اینترنت لازم است و فقط پیام «آنلاین ذخیره شد» تأیید ذخیره است.
- دفترچه‌های دو حساب مستقل‌اند؛ وارد حساب صاحب دفترچه شوید تا اطلاعات او را ببینید.

## دیتابیس

`supabase/001_jooneh.sql` در پروژه اجرا شده است؛ دوباره روی همان دیتابیس اجرا نکنید. جدول‌ها در schema خصوصی با RLS و بدون مجوز مستقیم کاربران هستند. توابع داخلی، شناسه کاربر و عضویت مجاز را بررسی می‌کنند. توابع عمومی واسط با SECURITY INVOKER اجرا می‌شوند. کنترل نسخه مانع بازنویسی بی‌خبر تغییرات دستگاه دیگر می‌شود.

`docs/config.js` فقط آدرس پروژه و publishable key عمومی دارد. رمز، secret key، service-role key، توکن GitHub و پشتیبان شخصی هرگز نباید به ریپازیتوری عمومی اضافه شوند.

برای نصب مستقل در پروژه‌ای تازه: SQL را یک بار اجرا کنید، دو کاربر را از API مدیریتی Auth یا داشبورد بسازید، شناسه‌های واقعی آن‌ها را به جدول `members` اضافه کنید و config را تنظیم کنید. ایمیل داخلی و تبدیل نام کاربری را هماهنگ نگه دارید. ابزار موقت ساخت حساب پروژه فعلی پس از استفاده غیرفعال شده است.

## انتقال و پشتیبان

در نسخه قبلی از تنظیمات «دریافت پشتیبان» بزنید؛ در این سایت با حساب صاحب دفترچه وارد شوید و «بازیابی پشتیبان» را انتخاب کنید. نسخه قبلی Sites جدا باقی می‌ماند و مهاجرت خودکار انجام نمی‌شود. فایل پشتیبان شخصی را در GitHub عمومی قرار ندهید.

حذف خودکار دوره‌ای در برنامه وجود ندارد. پروژه و حساب سرویس را نگه دارید و گاهی پشتیبان مستقل بگیرید؛ ماندگاری همیشگی هیچ سرویس آنلاینی قابل تضمین نیست.

## توسعه

`docs/assets/app.js`: رابط و صف ذخیره با کنترل نسخه.
`docs/assets/auth.js`: ورود و ارتباط با Supabase.
`docs/assets/core.js` و `data.js`: محاسبات و فهرست غذاها.

```sh
node tests/auth.mjs
node --check docs/assets/app.js
node --check docs/assets/auth.js
```

مقادیر غذایی تخمینی‌اند؛ هدف کالری خودکار فعال نیست. اطلاعات محصول را می‌توان در «غذای خودم» وارد کرد.

Vazir v30.1.0: `docs/assets/fonts/OFL.txt`.
Supabase JS v2.102.0: `docs/assets/vendor/SUPABASE-LICENSE`.

## به‌روزرسانی بانک غذا و مدیریت فهرست — ۲۰۲۶/۱۰/۱۸

۱۲۷ گزینه: ۹۹ غذای مرجع USDA، ۲۴ دستور نمونه ایرانی با محاسبه آشکار و ۴ مورد قدیمیِ تخمینی یا تأییدنشده. منبع هر غذا داخل سایت قابل مشاهده است. داده‌ها و روش ساخت در `nutrition/README.md` مستند هستند.

غذاهای آماده و شخصی قابل ویرایش و کپی‌اند. حذف، غذا را به بایگانی قابل‌بازگشت همان حساب می‌برد؛ سابقه وعده‌ها پاک نمی‌شود. انتخاب آیکون و نمایش «مصرف‌شده / از هدف روزانه» در دو خط اضافه شده است. ذخیره فقط پس از عمل کاربر انجام می‌شود؛ بازکردن نسخه جدید داده‌ای نمی‌نویسد. تغییر ساختار دیتابیس، تغییر داده موجود، یا بازنویسی وعده‌ها در این انتشار وجود ندارد.

آزمایش سازگاری و حفظ ثبت‌های قدیمی: `node tests/catalog-client.mjs`.


## Calendar and reports (v4)

The «روند و مقایسه» tab aggregates stored entry snapshots into Saturday–Friday weeks or Persian calendar months. Calendar navigation and reports never call the write API. Averages include only days with at least one food entry (including explicitly logged zero-energy food); unrecorded days are not zero intake. Missing nutrient fields stay marked as partial, and comparisons for those fields are withheld. Current goals are shown as current references, not reconstructed historical targets.

Dates displayed to the user use the Persian calendar and weekday names. Gregorian ISO day keys in Supabase and JSON backups remain unchanged. New optional carb/fat/total-sugar goals use the existing meta document; only an explicit settings save writes them. No migration or backfill is required. Total sugar is a personal cap, not an added-sugar recommendation.

Frontend regression checks: `node tests/auth.mjs`, `node tests/catalog-client.mjs`, and `node tests/analytics.mjs` (also under `TZ=Asia/Tehran` and `TZ=America/New_York`). They use synthetic state and no live database access.
