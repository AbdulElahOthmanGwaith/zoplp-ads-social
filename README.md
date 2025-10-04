# ZOPLP ADS Social 🌐

منصة تواصل اجتماعي متطورة مبنية بـ React و TypeScript

## 🚀 النشر على GitHub Pages

### الرابط النهائي
بعد النشر، ستجد تطبيقك على: `https://[اسمك].github.io/zoplp-ads-social`

### الخطوات المطلوبة

#### 1. إنشاء مستودع GitHub جديد
```bash
# إنشاء مستودع جديد على GitHub بنفس الاسم
# Repository name: zoplp-ads-social
```

#### 2. رفع الملفات
```bash
git init
git add .
git commit -m "Initial commit: ZOPLP ADS Social App"
git branch -M main
git remote add origin https://github.com/[اسمك]/zoplp-ads-social.git
git push -u origin main
```

#### 3. تفعيل GitHub Pages
1. اذهب إلى إعدادات المستودع (Settings)
2. ابحث عن "Pages" في الشريط الجانبي
3. اختر Source: "GitHub Actions"
4. احفظ الإعدادات

#### 4. انتظار البناء
- GitHub Actions ستبني التطبيق تلقائياً
- ستستغرق العملية حوالي 2-5 دقائق
- يمكنك متابعة التقدم في تبويب "Actions"

### 🎯 النتيجة النهائية
رابط تطبيقك: `https://[اسمك].github.io/zoplp-ads-social`

### ⚙️ الإعدادات

#### للتطوير المحلي:
```bash
# تثبيت المتطلبات
pnpm install

# تشغيل الخادم المحلي
pnpm run dev
```

#### للبناء:
```bash
# بناء للإنتاج
pnpm run build

# بناء لـ GitHub Pages
GITHUB_PAGES=true pnpm run build
```

## 🛠️ التقنيات المستخدمة

- **React** - مكتبة واجهة المستخدم
- **TypeScript** - البرمجة المكتوبة
- **Tailwind CSS** - تنسيقات سريعة
- **Vite** - أداة البناء السريعة
- **PWA** - تطبيق ويب تدريجي
- **Supabase** - قاعدة البيانات والاستضافة الخلفية

## 📱 المميزات

✅ واجهة مستخدم عصرية وسريعة الاستجابة  
✅ نظام تسجيل دخول آمن  
✅ منشورات وتفاعلات اجتماعية  
✅ رسائل فورية  
✅ إشعارات في الوقت الفعلي  
✅ البحث عن المستخدمين  
✅ تطبيق ويب تدريجي قابل للتثبيت  
✅ دعم الوضع الليلي  
✅ تصميم متجاوب لجميع الأجهزة  

## 🔧 إدارة الإعدادات

جميع إعدادات التطبيق موجودة في:
- `requirements.config.cjs` - التكوين المركزي
- `scripts/setup.js` - سكريبت الإعداد
- `scripts/generate-env.js` - مولد متغيرات البيئة

## 📞 الدعم

للمساعدة أو الاستفسارات، راجع الدليل الشامل في `COMPREHENSIVE_SYSTEM_GUIDE.md`

---

**المؤلف:** MiniMax Agent  
**الإصدار:** 1.0.0  
**آخر تحديث:** سبتمبر 2025
