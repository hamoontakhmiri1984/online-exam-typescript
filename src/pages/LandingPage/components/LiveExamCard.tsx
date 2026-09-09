import { useEffect, useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

type Phase = 'question' | 'timer' | 'result';

const PHASE_ORDER: Phase[] = ['question', 'timer', 'result'];
const PHASE_DURATION_MS = 3400;

const DEMO_QUESTION = {
  meta: 'سوال ۳ از ۱۰',
  text: 'کدام هوک برای مدیریت state محلی در React استفاده می‌شود؟',
  options: ['useEffect', 'useState', 'useRef', 'useMemo'],
  correctIndex: 1,
};

function LiveExamCard() {
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(12);

  const phase = PHASE_ORDER[phaseIndex];

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASE_ORDER.length);
    }, PHASE_DURATION_MS);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    if (phase === 'question') {
      setSelectedOption(null);
      const pick = setTimeout(
        () => setSelectedOption(DEMO_QUESTION.correctIndex),
        1300
      );
      return () => clearTimeout(pick);
    }

    if (phase === 'timer') {
      setCountdown(12);
      const tick = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 240);
      return () => clearInterval(tick);
    }
  }, [phase]);

  return (
    <div className="relative w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-brand-600/10 dark:border-gray-800 dark:bg-gray-900">
      <div key={phase} className="animate-fade-slide min-h-[220px]">
        {phase === 'question' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                {DEMO_QUESTION.meta}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-brand-600/10 px-3 py-1 text-xs font-bold text-brand-600 dark:text-brand-500">
                <Clock size={13} />
                ۰۰:۴۸
              </span>
            </div>

            <p className="mb-4 text-sm font-bold leading-relaxed text-gray-900 dark:text-white">
              {DEMO_QUESTION.text}
            </p>

            <div className="flex flex-col gap-2">
              {DEMO_QUESTION.options.map((option, index) => {
                const isSelected = selectedOption === index;
                return (
                  <div
                    key={option}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs transition-all duration-300 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-600/5 text-brand-700 dark:text-brand-500'
                        : 'border-gray-100 text-gray-600 dark:border-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'timer' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="mb-4 text-xs font-medium text-gray-400">
              زمان باقی‌مانده
            </span>
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gray-100 text-3xl font-extrabold text-brand-600 dark:border-gray-800 dark:text-brand-500">
              {countdown}
            </div>
            <p className="mt-5 text-xs text-gray-400">
              آزمون به‌صورت خودکار ادامه پیدا می‌کند
            </p>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center py-5 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-600/10 text-success-600">
              <CheckCircle2 size={28} />
            </div>
            <div className="mb-1 text-4xl font-extrabold text-gray-900 dark:text-white">
              ۹۲٪
            </div>
            <p className="text-xs text-gray-400">۹ پاسخ درست از ۱۰ سوال</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveExamCard;
