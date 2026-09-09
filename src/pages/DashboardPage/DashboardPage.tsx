import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { FileText, GraduationCap, Award, Calendar } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import ProgressChart from '../../components/ProgressChart/ProgressChart';
import TodayExamsChart from '../../components/TodayExamsChart/TodayExamsChart';
import { getCurrentUser } from '../../api/authApi';
import { getExams, type Exam } from '../../api/examApi';
import { getStudents, type Student } from '../../api/studentApi';
import { getAllAttempts, type ExamAttempt } from '../../api/examAttemptApi';
import useGroups from '../../hooks/useGroups';
import useScope from '../../hooks/useScope';

function getTodayJalali(): string {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  return `${get('weekday')}، ${get('day')} ${get('month')} ${get('year')}`;
}

function DashboardPage() {
  const user = getCurrentUser();

  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAttempts, setAllAttempts] = useState<ExamAttempt[]>([]);

  // آمار بالای صفحه و جدول «آزمون‌های اخیر» قبلاً عدد ثابت بودن و هیچ‌وقت
  // با آزمون/دانشجو/نتیجه‌ی واقعی به‌روز نمی‌شدن؛ اینجا از همون APIهایی که
  // بقیه‌ی صفحات استفاده می‌کنن می‌خونیم تا داشبورد واقعاً وضعیت فعلی رو نشون بده
  useEffect(() => {
    getExams().then(setAllExams);
    getStudents().then(setAllStudents);
    getAllAttempts().then(setAllAttempts);
  }, []);

  // این صفحه برای هر سه نقش بازه (ALL_ROLES تو سایدبار)، پس دیتای خامش رو
  // مثل ExamsPage/StudentsPage از فیلتر scope رد می‌کنیم - وگرنه یه
  // Instructor/Student آمار و «آزمون‌های اخیر» کل سیستم رو می‌دید، نه فقط
  // گروه‌های خودش (SuperAdmin مثل قبل همه‌چی رو می‌بینه، بدون فیلتر)
  const { visibleItems: exams } = useScope(allExams, (exam) => exam.groupIds);
  const { groups, visibleGroups, currentUser } = useGroups();

  const relevantGroups =
    currentUser?.role === 'SuperAdmin' ? groups : visibleGroups;

  const studentCount =
    currentUser?.role === 'SuperAdmin'
      ? allStudents.length
      : allStudents.filter((s) =>
          relevantGroups.some((g) => g.studentIds.includes(s.id))
        ).length;

  const visibleExamIds = new Set(exams.map((e) => e.id));
  const attempts =
    currentUser?.role === 'SuperAdmin'
      ? allAttempts
      : allAttempts.filter((a) => visibleExamIds.has(a.examId));

  function getParticipantCount(examId: string) {
    const uniqueStudents = new Set(
      attempts.filter((a) => a.examId === examId).map((a) => a.studentId)
    );
    return uniqueStudents.size;
  }

  const averageScorePercent =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce(
            (sum, a) => sum + a.correctCount / a.totalQuestions,
            0
          ) /
            attempts.length) *
            100
        )
      : 0;

  const stats = [
    {
      label: 'آزمون‌های فعال',
      value: exams.length.toLocaleString('fa-IR'),
      icon: FileText,
      bg: 'bg-linear-to-br from-brand-500 to-brand-600',
    },
    {
      label: 'تعداد دانشجویان',
      value: studentCount.toLocaleString('fa-IR'),
      icon: GraduationCap,
      bg: 'bg-linear-to-br from-purple-500 to-purple-600',
    },
    {
      label: 'میانگین نمرات',
      value:
        attempts.length > 0
          ? `${averageScorePercent.toLocaleString('fa-IR')}٪`
          : '—',
      icon: Award,
      bg: 'bg-linear-to-br from-success-500 to-success-600',
    },
  ];

  const recentExams = [...exams]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // «پرشرکت‌کننده‌ترین آزمون‌ها» - از همون attempts اسکوپ‌شده، نه یه دیتای mock ثابت
  const topExamsData = exams
    .map((exam) => ({
      label: exam.title,
      participants: getParticipantCount(exam.id),
    }))
    .filter((point) => point.participants > 0)
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5);

  // روند میانگین نمره در ماه‌های اخیر - attemptها بر اساس ماه شمسیِ finishedAt
  // گروه‌بندی می‌شن (نه از رو Exam.date، چون اون یه رشته‌ی دستیه نه تاریخ واقعی)
  function jalaliMonthInfo(iso: string): { label: string; sortKey: number } {
    const date = new Date(iso);
    const longParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'long',
    }).formatToParts(date);
    const numericParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(date);

    const label = longParts.find((p) => p.type === 'month')?.value ?? '';
    const year = Number(
      numericParts.find((p) => p.type === 'year')?.value ?? 0
    );
    const month = Number(
      numericParts.find((p) => p.type === 'month')?.value ?? 0
    );

    return { label, sortKey: year * 100 + month };
  }

  const monthBuckets = new Map<
    number,
    { label: string; sumRatio: number; count: number }
  >();

  attempts.forEach((a) => {
    const { label, sortKey } = jalaliMonthInfo(a.finishedAt);
    const bucket = monthBuckets.get(sortKey) ?? {
      label,
      sumRatio: 0,
      count: 0,
    };
    bucket.sumRatio += a.correctCount / (a.totalQuestions || 1);
    bucket.count += 1;
    monthBuckets.set(sortKey, bucket);
  });

  const progressData = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => a - b)
    .slice(-6)
    .map(([, bucket]) => ({
      label: bucket.label,
      averageScore: Math.round((bucket.sumRatio / bucket.count) * 100),
    }));

  return (
    <AppLayout title="داشبورد مدیریتی">
      {/* تاریخ امروز - گوشه‌ی صفحه */}
      <div className="mb-4 flex justify-end">
        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <Calendar size={13} />
          {getTodayJalali()}
        </div>
      </div>

      {/* Welcome banner - باریک */}
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-linear-to-l from-brand-600 to-brand-700 px-6 py-4 text-white shadow-md shadow-brand-600/20 dark:shadow-none">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-white/80">
            <Sparkles size={14} />
            خوش آمدی
          </p>
          <h1 className="text-lg font-bold mt-0.5">
            {user?.name || user?.username || 'کاربر'}
          </h1>
        </div>
        <p className="hidden sm:block text-sm text-white/80">
          امروز وضعیت آزمون‌هایت رو اینجا می‌بینی
        </p>
      </div>

      {/* Stats */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, bg }) => (
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
      </section>

      {/* Charts */}
      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodayExamsChart data={topExamsData} />
        <ProgressChart data={progressData} />
      </section>

      {/* Recent Exams */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              آزمون‌های اخیر
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              آخرین وضعیت آزمون‌های ثبت‌شده
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-6 py-3 font-medium">نام آزمون</th>
                <th className="px-6 py-3 font-medium">تاریخ</th>
                <th className="px-6 py-3 font-medium">شرکت‌کنندگان</th>
                <th className="px-6 py-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {recentExams.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    هنوز آزمونی ثبت نشده
                  </td>
                </tr>
              )}
              {recentExams.map((exam) => (
                <tr
                  key={exam.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-200"
                >
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                    {exam.title}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {exam.date}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {getParticipantCount(exam.id).toLocaleString('fa-IR')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        exam.status === 'completed'
                          ? 'bg-success-500/10 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                          : 'bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400'
                      }`}
                    >
                      {exam.status === 'completed' ? 'پایان‌یافته' : 'پیش‌رو'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

export default DashboardPage;
