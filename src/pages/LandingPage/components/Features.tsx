import { ListChecks, FileSpreadsheet, Timer, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: ListChecks,
    title: 'بانک سوال منظم',
    description:
      'سوالات چندگزینه‌ای رو دسته‌بندی‌شده بساز، ویرایش کن و برای هر آزمون دوباره استفاده‌شون کن.',
  },
  {
    icon: FileSpreadsheet,
    title: 'ایمپورت از اکسل',
    description:
      'صدها سوال رو یک‌جا از فایل اکسل وارد کن — با قالب آماده و پیش‌نمایش قبل از ثبت نهایی.',
  },
  {
    icon: Timer,
    title: 'تایمر هوشمند',
    description:
      'برای هر آزمون زمان دقیق تعیین کن؛ شمارش معکوس خودکار و پایان به‌موقع بدون دخالت دستی.',
  },
  {
    icon: BarChart3,
    title: 'گزارش‌گیری لحظه‌ای',
    description:
      'نمره‌ها و آمار شرکت‌کننده‌ها رو همون لحظه ببین، بدون نیاز به تصحیح دستی برگه.',
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          همه‌ی چیزی که برای یه آزمون حرفه‌ای لازم داری
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
          از ساخت سوال تا اعلام نتیجه، بدون هیچ ابزار جانبی.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="group rounded-2xl border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-none"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:text-brand-500">
              <Icon size={20} />
            </div>
            <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs leading-6 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
