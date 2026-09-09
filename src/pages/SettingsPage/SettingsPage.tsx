import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout/AppLayout';
import useTheme from '../../hooks/useTheme';
import { getCurrentUser, updateCurrentUserName } from '../../api/authApi';
import {
  getGroupsByStudent,
  getGroupByJoinCode,
  addStudentToGroup,
  type Group,
} from '../../api/groupApi';
import {
  User,
  Bell,
  Palette,
  Check,
  Users,
  LogIn,
  XCircle,
} from 'lucide-react';
import useNotificationsEnabled from '../../hooks/useNotificationsEnabled';
import Toast from '../../components/Toast/Toast';

function SettingsPage() {
  const { enabled: notifications, toggleEnabled: handleNotificationsToggle } =
    useNotificationsEnabled();
  const { isDark, toggleTheme } = useTheme();
  const currentUser = getCurrentUser();

  const [name, setName] = useState<string>(
    () => currentUser?.name ?? currentUser?.username ?? ''
  );
  const [justSaved, setJustSaved] = useState(false);

  // این بخش قبلاً فقط تو متن صفحه‌ی ثبت‌نام وعده داده شده بود («بعداً از
  // تنظیمات می‌تونی به گروه بپیوندی») بدون این‌که واقعاً پیاده شده باشه -
  // فقط برای Student معنی داره، چون Instructor/SuperAdmin اصلاً از این راه
  // عضو گروه نمی‌شن
  const isStudent = currentUser?.role === 'Student';

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState<boolean>(isStudent);
  const [refreshKey, setRefreshKey] = useState(0);

  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isStudent || !currentUser) return;
    setGroupsLoading(true);
    getGroupsByStudent(currentUser.id).then((groups) => {
      setMyGroups(groups);
      setGroupsLoading(false);
    });
  }, [isStudent, currentUser?.id, refreshKey]);

  async function handleJoinGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUser) return;

    const trimmed = joinCode.trim();
    if (!trimmed) {
      setJoinError('کد عضویت رو وارد کن');
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      const group = await getGroupByJoinCode(trimmed);
      if (!group) {
        setJoinError('کد عضویت وارد شده معتبر نیست');
        return;
      }
      if (myGroups.some((g) => g.id === group.id)) {
        setJoinError(`قبلاً عضو «${group.name}» هستی`);
        return;
      }

      await addStudentToGroup(group.id, currentUser.id);
      setJoinCode('');
      setJoinSuccess(`با موفقیت به «${group.name}» پیوستی`);
      setRefreshKey((k) => k + 1);
    } finally {
      setJoining(false);
    }
  }

  function handleNameBlur() {
    const trimmed = name.trim();
    if (!trimmed) {
      // اسم خالی معنی نداره - برش می‌گردونیم به آخرین مقدار معتبر
      setName(currentUser?.name ?? currentUser?.username ?? '');
      return;
    }
    updateCurrentUserName(trimmed);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  return (
    <AppLayout title="تنظیمات">
      {joinError && (
        <Toast
          message={joinError}
          tone="danger"
          icon={XCircle}
          onDismiss={() => setJoinError(null)}
        />
      )}
      {joinSuccess && (
        <Toast
          message={joinSuccess}
          tone="success"
          onDismiss={() => setJoinSuccess(null)}
        />
      )}
      <h1 className="text-2xl font-bold mb-6 dark:text-white">تنظیمات</h1>

      <div className="flex flex-col gap-4 max-w-xl">
        {/* پروفایل */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <User size={18} />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              پروفایل
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                نام
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
              />
              {justSaved && (
                <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-500">
                  <Check size={13} />
                  ذخیره شد
                </span>
              )}
            </div>
          </div>
        </div>

        {/* گروه‌های من - فقط برای Student */}
        {isStudent && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                <Users size={18} />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                گروه‌های من
              </h2>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {groupsLoading ? (
                <p className="text-xs text-gray-400">در حال بارگذاری...</p>
              ) : myGroups.length > 0 ? (
                myGroups.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-400"
                  >
                    <Users size={12} />
                    {g.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">
                  هنوز عضو هیچ گروهی نیستی
                </p>
              )}
            </div>

            <form
              onSubmit={handleJoinGroup}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  پیوستن با کد عضویت
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="مثلاً MATH01"
                  className="mt-1 w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
                />
              </div>
              <button
                type="submit"
                disabled={joining}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                <LogIn size={15} />
                {joining ? 'در حال بررسی...' : 'پیوستن'}
              </button>
            </form>
          </div>
        )}

        {/* ظاهر */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-500">
              <Palette size={18} />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              ظاهر
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              حالت شب
            </span>
            <button
              onClick={toggleTheme}
              className={`relative h-6 w-11 rounded-full transition ${
                isDark ? 'bg-brand-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  isDark ? 'right-0.5' : 'right-5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* اعلان‌ها */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-500/10 text-success-600 dark:bg-success-500/15 dark:text-success-500">
              <Bell size={18} />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              اعلان‌ها
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              دریافت اعلان آزمون‌های جدید
            </span>
            <button
              onClick={handleNotificationsToggle}
              className={`relative h-6 w-11 rounded-full transition ${
                notifications ? 'bg-brand-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  notifications ? 'right-0.5' : 'right-5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default SettingsPage;
