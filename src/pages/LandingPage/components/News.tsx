import { Sparkles } from 'lucide-react';

const NEWS_ITEMS = [
  {
    date: '۱۴۰۵/۰۶/۱۰',
    title: 'امکان ایمپورت گروهی سوال از اکسل',
    excerpt:
      'حالا می‌تونی صدها سوال رو یک‌جا از یه فایل اکسل وارد کنی، با پیش‌نمایش کامل قبل از ثبت نهایی.',
    tag: 'قابلیت جدید',
  },
  {
    date: '۱۴۰۵/۰۵/۲۲',
    title: 'گزارش‌گیری لحظه‌ای برای مدرس‌ها',
    excerpt:
      'نمره‌ها و آمار شرکت‌کننده‌ها همون لحظه‌ای که آزمون تموم می‌شه در دسترسه، بدون تصحیح دستی.',
    tag: 'به‌روزرسانی',
  },
  {
    date: '۱۴۰۵/۰۴/۰۳',
    title: 'شروع رسمی سامانه‌ی آزمون آنلاین',
    excerpt:
      'نسخه‌ی اول سامانه با بانک سوال، اجرای آزمون زمان‌دار و پنل مدیریتی راه‌اندازی شد.',
    tag: 'اعلامیه',
  },
];

function News() {
  return (
    <section id="news" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          اخبار و به‌روزرسانی‌ها
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
          دورهم‌های کوچیک از چیزهایی که به سامانه اضافه می‌کنیم.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {NEWS_ITEMS.map((item) => (
          <article
            key={item.title}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-none"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 dark:bg-brand-600/10 dark:text-brand-400">
                <Sparkles size={12} />
                {item.tag}
              </span>
              <span className="text-xs text-gray-400">{item.date}</span>
            </div>

            <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
              {item.title}
            </h3>
            <p className="text-xs leading-6 text-gray-500 dark:text-gray-400">
              {item.excerpt}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default News;
