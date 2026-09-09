import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import LiveExamCard from './LiveExamCard';

const TRUST_POINTS = [
  'بدون نیاز به کارت بانکی',
  'راه‌اندازی در کمتر از ۲ دقیقه',
];

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* شکل تزئینی محو در پس‌زمینه، خیلی کم‌رنگ */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl dark:bg-brand-600/20" />
      <div className="pointer-events-none absolute top-32 right-0 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl dark:bg-accent-500/10" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        {/* متن و دکمه‌ها */}
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.3] text-gray-900 dark:text-white sm:text-5xl">
            برگزاری آزمون آنلاین،{' '}
            <span className="text-brand-600 dark:text-brand-500">
              بدون دردسر
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-8 text-gray-500 dark:text-gray-400">
            بانک سوال بساز، آزمون زمان‌دار طراحی کن، و نتیجه رو لحظه‌ای ببین —
            همه‌چیز تو یه پنل ساده و شیک، آماده‌ی استفاده.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40"
            >
              شروع رایگان
            </button>
            <a
              href="#features"
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              مشاهده امکانات
            </a>
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:gap-6">
            {TRUST_POINTS.map((point) => (
              <div
                key={point}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <CheckCircle2 size={14} className="text-success-600" />
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* کارت زنده‌ی آزمون */}
        <div className="flex justify-center md:justify-end">
          <LiveExamCard />
        </div>
      </div>
    </section>
  );
}

export default Hero;
