import { Zap, ShieldCheck, Headphones } from 'lucide-react';

const PILLARS = [
  {
    icon: Zap,
    title: 'سادگی و سرعت',
    description: 'ساخت آزمون و بانک سوال در چند دقیقه، بدون آموزش پیچیده.',
  },
  {
    icon: ShieldCheck,
    title: 'امنیت داده‌ها',
    description:
      'اطلاعات سوال‌ها و نمره‌ها فقط در دسترس خود مدرس و مدیر می‌مونه.',
  },
  {
    icon: Headphones,
    title: 'پشتیبانی واقعی',
    description: 'پشت هر پیام یه آدم واقعی جواب می‌ده، نه ربات خودکار.',
  },
];

function About() {
  return (
    <section
      id="about"
      className="border-y border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            چرا این سامانه رو ساختیم
          </h2>
          <p className="mt-4 text-sm leading-8 text-gray-500 dark:text-gray-400">
            برگزاری آزمون آنلاین نباید نیاز به چند تا ابزار جدا و یه عالمه
            تنظیمات پیچیده داشته باشه. هدف ما اینه که مدرس‌ها با کمترین دردسر،
            آزمونی حرفه‌ای بسازن و دانش‌آموزها هم تجربه‌ای روون و بدون استرس
            داشته باشن.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/10 dark:text-brand-400">
                <Icon size={22} />
              </div>
              <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="max-w-xs text-xs leading-6 text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;
