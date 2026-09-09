import { TimerOff } from 'lucide-react';
import AppLayout from '../../../components/AppLayout/AppLayout';
import type { Exam } from '../../../api/examApi';

interface ResultScreenProps {
  exam: Exam;
  score: { correctCount: number; total: number };
  endedByTimeout: boolean;
  onBackToList: () => void;
}

function ResultScreen({
  exam,
  score,
  endedByTimeout,
  onBackToList,
}: ResultScreenProps) {
  const percentage = Math.round((score.correctCount / score.total) * 100);

  return (
    <AppLayout title={exam.title}>
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        {endedByTimeout && (
          <div className="mb-5 flex items-center justify-center gap-1.5 rounded-xl bg-danger-50 py-2 text-xs font-bold text-danger-600 dark:bg-danger-950/40 dark:text-danger-400">
            <TimerOff size={14} />
            زمان آزمون به پایان رسید و به‌صورت خودکار ثبت شد
          </div>
        )}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          آزمون به پایان رسید
        </h2>
        <p className="mb-6 text-sm text-gray-400">{exam.title}</p>

        <div className="mb-6 text-5xl font-extrabold text-brand-600">
          {percentage.toLocaleString('fa-IR')}٪
        </div>

        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          {score.correctCount.toLocaleString('fa-IR')} پاسخ درست از{' '}
          {score.total.toLocaleString('fa-IR')} سوال
        </p>

        <button
          onClick={onBackToList}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700"
        >
          بازگشت به لیست آزمون‌ها
        </button>
      </div>
    </AppLayout>
  );
}

export default ResultScreen;
