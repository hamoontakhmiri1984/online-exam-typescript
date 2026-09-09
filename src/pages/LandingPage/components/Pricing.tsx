import { useNavigate } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  variant: 'plain' | 'accent' | 'highlighted' | 'dark';
  badge?: string;
}

const PLANS: Plan[] = [
  {
    name: 'رایگان',
    price: '۰',
    period: 'همیشه رایگان',
    description: 'برای شروع و تست سامانه، بدون نیاز به کارت بانکی.',
    features: [
      'تا ۵۰ سوال در بانک سوال',
      '۱ آزمون فعال هم‌زمان',
      'گزارش‌گیری پایه',
    ],
    cta: 'شروع رایگان',
    variant: 'plain',
  },
  {
    name: 'طلایی',
    price: '۹۹,۰۰۰',
    period: 'تومان / ماه',
    description: 'برای مدرس‌هایی که چند آزمون رو هم‌زمان مدیریت می‌کنن.',
    features: [
      'تا ۵۰۰ سوال در بانک سوال',
      '۱۰ آزمون فعال هم‌زمان',
      'ایمپورت نامحدود از اکسل',
      'گزارش‌گیری پیشرفته',
    ],
    cta: 'انتخاب طلایی',
    variant: 'accent',
  },
  {
    name: 'پلاتینیوم',
    price: '۱۹۹,۰۰۰',
    period: 'تومان / ماه',
    description: 'مناسب آموزشگاه‌ها و تیم‌های چند مدرسه.',
    features: [
      'بانک سوال و آزمون نامحدود',
      'چند مدرس هم‌زمان با دسترسی جدا',
      'گزارش‌گیری تحلیلی و نموداری',
      'پشتیبانی در ساعات اداری',
    ],
    cta: 'انتخاب پلاتینیوم',
    variant: 'highlighted',
    badge: 'پیشنهاد محبوب',
  },
  {
    name: 'VIP',
    price: '۳۴۹,۰۰۰',
    period: 'تومان / ماه',
    description: 'همه‌چیز نامحدود، به‌علاوه‌ی برندینگ اختصاصی خودت.',
    features: [
      'همه‌ی امکانات پلاتینیوم',
      'برندینگ اختصاصی (لوگو و رنگ سایت)',
      'پشتیبانی اختصاصی ۲۴ ساعته',
      'دسترسی زودهنگام به امکانات جدید',
    ],
    cta: 'انتخاب VIP',
    variant: 'dark',
  },
];

const VARIANT_STYLES: Record<Plan['variant'], string> = {
  plain:
    'bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-800',
  accent:
    'bg-white border border-accent-500/30 dark:bg-gray-900 dark:border-accent-500/30',
  highlighted:
    'bg-white border-2 border-brand-600 shadow-xl shadow-brand-600/10 lg:-translate-y-3 dark:bg-gray-900',
  dark: 'bg-gray-900 border border-gray-800 text-white',
};

function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          تعرفه‌ای متناسب با نیازت
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-500 dark:text-gray-400">
          از یه آزمون کوچیک تا مدیریت چند آموزشگاه — هر وقت خواستی ارتقا بده.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isDark = plan.variant === 'dark';
          const isHighlighted = plan.variant === 'highlighted';

          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-6 transition duration-300 hover:-translate-y-1 ${
                VARIANT_STYLES[plan.variant]
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-2">
                {isDark && <Crown size={18} className="text-accent-400" />}
                <h3
                  className={`text-base font-bold ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.name}
                </h3>
              </div>

              <p
                className={`mt-2 text-xs leading-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {plan.description}
              </p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span
                  className={`text-3xl font-extrabold ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={`text-xs ${
                      isDark
                        ? 'text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-2 text-xs leading-6 ${
                      isDark
                        ? 'text-gray-300'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Check
                      size={15}
                      className={`mt-0.5 shrink-0 ${
                        isDark ? 'text-success-500' : 'text-success-600'
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className={`mt-7 w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 hover:-translate-y-0.5 ${
                  isDark
                    ? 'bg-white text-gray-900 hover:shadow-lg hover:shadow-white/10'
                    : isHighlighted
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/40'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Pricing;
