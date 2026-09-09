import { useEffect, useState } from 'react';
import { getExams, type Exam } from '../../api/examApi';
import { getStudents, type Student } from '../../api/studentApi';
import { getAllAttempts, type ExamAttempt } from '../../api/examAttemptApi';
import { getInstructors, type User } from '../../api/authApi';
import {
  getSubscription,
  assignSubscription,
  isSubscriptionExpired,
  getRemainingDays,
  type Subscription,
} from '../../api/subscriptionApi';
import { PLAN_ORDER, PLANS, type PlanId } from '../../constants/plans';
import AppLayout from '../../components/AppLayout/AppLayout';
import {
  FileText,
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  TimerOff,
  Crown,
} from 'lucide-react';
import Spinner from '../../components/Spinner/Spinner';

function ReportsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [instructors, setInstructors] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    Record<string, Subscription>
  >({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadInstructorSubscriptions() {
    const instructorList = getInstructors();
    setInstructors(instructorList);
    const subs = await Promise.all(
      instructorList.map((i) => getSubscription(i.id))
    );
    setSubscriptions(Object.fromEntries(subs.map((s) => [s.instructorId, s])));
  }

  useEffect(() => {
    Promise.all([getExams(), getStudents(), getAllAttempts()]).then(
      ([examsData, studentsData, attemptsData]) => {
        setExams(examsData);
        setStudents(studentsData);
        setAttempts(attemptsData);
        setLoading(false);
      }
    );
    loadInstructorSubscriptions();
  }, []);

  async function handlePlanChange(instructorId: string, planId: PlanId) {
    setUpdatingId(instructorId);
    const updated = await assignSubscription(instructorId, planId);
    setSubscriptions((prev) => ({ ...prev, [instructorId]: updated }));
    setUpdatingId(null);
  }

  if (loading) {
    return (
      <AppLayout title="گزارش‌ها">
        <Spinner />
      </AppLayout>
    );
  }

  const completedCount = exams.filter((e) => e.status === 'completed').length;

  const averageScorePercent = attempts.length
    ? Math.round(
        (attempts.reduce(
          (sum, a) => sum + a.correctCount / (a.totalQuestions || 1),
          0
        ) /
          attempts.length) *
          100
      )
    : 0;

  const cards = [
    {
      label: 'کل آزمون‌ها',
      value: exams.length.toLocaleString('fa-IR'),
      icon: FileText,
      bg: 'bg-brand-600',
    },
    {
      label: 'کل دانشجویان',
      value: students.length.toLocaleString('fa-IR'),
      icon: GraduationCap,
      bg: 'bg-gray-500',
    },
    {
      label: 'آزمون‌های پایان‌یافته',
      value: completedCount.toLocaleString('fa-IR'),
      icon: CheckCircle2,
      bg: 'bg-success-600',
    },
    {
      label: 'میانگین نمره',
      value: `${averageScorePercent.toLocaleString('fa-IR')}٪`,
      icon: TrendingUp,
      bg: 'bg-accent-500',
    },
  ];

  const recentAttempts = [...attempts]
    .sort(
      (a, b) =>
        new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    )
    .slice(0, 8);

  function examTitle(examId: string) {
    return exams.find((e) => e.id === examId)?.title ?? 'آزمون حذف‌شده';
  }

  return (
    <AppLayout title="گزارش‌ها">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">گزارش‌ها</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, bg }) => (
          <div
            key={label}
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${bg}`}
            >
              <Icon size={20} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
          مدیریت اشتراک مدرس‌ها
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          پلن هر مدرس رو دستی تغییر بده - مثلاً برای پرداخت آفلاین یا پشتیبانی
        </p>

        {instructors.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            هنوز مدرسی تو سیستم ثبت نشده
          </p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="py-2">مدرس</th>
                <th className="py-2">پلن فعلی</th>
                <th className="py-2">وضعیت</th>
                <th className="py-2">تغییر پلن</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => {
                const sub = subscriptions[instructor.id];
                const expired = sub ? isSubscriptionExpired(sub) : false;
                const remainingDays = sub ? getRemainingDays(sub) : null;

                return (
                  <tr
                    key={instructor.id}
                    className="border-b border-gray-100 text-gray-700 dark:border-gray-800 dark:text-gray-200"
                  >
                    <td className="py-3 font-medium">
                      {instructor.name || instructor.username}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Crown size={14} className="text-accent-500" />
                        {sub ? PLANS[sub.planId].name : '—'}
                      </span>
                    </td>
                    <td className="py-3">
                      {!sub ? (
                        '—'
                      ) : expired ? (
                        <span className="rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold text-danger-600 dark:bg-danger-950/40 dark:text-danger-400">
                          منقضی شده
                        </span>
                      ) : remainingDays === null ? (
                        <span className="rounded-full bg-success-500/10 px-3 py-1 text-xs font-semibold text-success-600 dark:text-success-500">
                          بدون تاریخ انقضا
                        </span>
                      ) : (
                        <span className="rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600 dark:text-accent-500">
                          {remainingDays.toLocaleString('fa-IR')} روز مانده
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <select
                        value={sub?.planId ?? ''}
                        disabled={updatingId === instructor.id}
                        onChange={(e) =>
                          handlePlanChange(
                            instructor.id,
                            e.target.value as PlanId
                          )
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-60"
                      >
                        {PLAN_ORDER.map((planId) => (
                          <option key={planId} value={planId}>
                            {PLANS[planId].name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          آخرین تلاش‌های ثبت‌شده
        </h2>

        {recentAttempts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            هنوز هیچ آزمونی توسط دانشجویی به پایان نرسیده
          </p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="py-2">دانشجو</th>
                <th className="py-2">آزمون</th>
                <th className="py-2">نمره</th>
                <th className="py-2">تاریخ</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((attempt) => (
                <tr
                  key={attempt.id}
                  className="border-b border-gray-100 text-gray-700 transition duration-200 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 font-medium">{attempt.studentName}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {examTitle(attempt.examId)}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex rounded-full bg-success-500/10 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                      {attempt.correctCount.toLocaleString('fa-IR')} از{' '}
                      {attempt.totalQuestions.toLocaleString('fa-IR')}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {new Date(attempt.finishedAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="py-3">
                    {attempt.endedByTimeout && (
                      <span
                        title="با اتمام وقت به پایان رسید"
                        className="inline-flex items-center gap-1 text-xs text-danger-500"
                      >
                        <TimerOff size={13} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}

export default ReportsPage;
