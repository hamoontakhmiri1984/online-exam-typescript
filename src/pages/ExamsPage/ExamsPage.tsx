import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getExams,
  addExam,
  updateExam,
  deleteExam,
  type Exam,
} from '../../api/examApi';
import { getAllAttempts, type ExamAttempt } from '../../api/examAttemptApi';
import {
  Pencil,
  Trash2,
  PlayCircle,
  ListChecks,
  Clock,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Crown,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import AppLayout from '../../components/AppLayout/AppLayout';
import useCrud from '../../hooks/useCrud';
import Spinner from '../../components/Spinner/Spinner';
import useScope from '../../hooks/useScope';
import Toast from '../../components/Toast/Toast';
import EmptyState from '../../components/EmptyState/EmptyState';
import { getCurrentUser } from '../../api/authApi';
import {
  getRemainingActiveExamQuota,
  type RemainingQuota,
} from '../../api/subscriptionApi';
import { MANAGEMENT_ROLES } from '../../constants/roles';
import { CATEGORIES } from '../../constants/categories';
import {
  getGroups,
  getGroupsByInstructor,
  type Group,
} from '../../api/groupApi';

function limitMessage(quota: Extract<RemainingQuota, { limited: true }>) {
  return quota.expired
    ? 'اشتراکت منقضی شده. برای ساختن آزمون جدید اول باید پلنت رو تمدید کنی.'
    : `پلن فعلیت اجازه‌ی حداکثر ${quota.limit.toLocaleString(
        'fa-IR'
      )} آزمون فعال هم‌زمان رو می‌ده و همین الان ${quota.used.toLocaleString(
        'fa-IR'
      )} تا داری. برای آزمون بیشتر باید پلنت رو ارتقا بدی.`;
}

function ExamsPage() {
  const navigate = useNavigate();

  const {
    items: exams,
    loading,
    error,
    clearError,
    addItem,
    updateItem,
    deleteItem,
  } = useCrud<Exam, Omit<Exam, 'id'>>({
    getAll: getExams,
    add: addExam,
    update: updateExam,
    remove: deleteExam,
  });

  const { visibleItems: visibleExams } = useScope(
    exams,
    (exam) => exam.groupIds
  );
  const currentUser = getCurrentUser();
  const canManage =
    !!currentUser && MANAGEMENT_ROLES.includes(currentUser.role);

  // گروه‌هایی که موقع ساخت/ویرایش آزمون می‌شه بهش انتخاب کرد - مدرس فقط
  // گروه‌های خودش، SuperAdmin همه‌ی گروه‌ها رو می‌بینه
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const request =
      currentUser.role === 'Instructor'
        ? getGroupsByInstructor(currentUser.id)
        : getGroups();
    request.then(setAvailableGroups);
  }, [currentUser?.id, currentUser?.role]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);

  useEffect(() => {
    getAllAttempts().then(setAttempts);
  }, []);

  // تعداد شرکت‌کننده‌ی واقعی هر آزمون - از روی تلاش‌های واقعاً ثبت‌شده،
  // نه یه عدد دستی
  function getParticipantCount(examId: string) {
    const uniqueStudents = new Set(
      attempts.filter((a) => a.examId === examId).map((a) => a.studentId)
    );
    return uniqueStudents.size;
  }

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [allowReview, setAllowReview] = useState<boolean>(true);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [limitQuota, setLimitQuota] = useState<Extract<
    RemainingQuota,
    { limited: true }
  > | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  const DURATION_PRESETS = [10, 15, 30, 60];

  function openAddModal() {
    if (currentUser?.role === 'Instructor') {
      setCheckingLimit(true);
      getRemainingActiveExamQuota(currentUser.id).then((quota) => {
        setCheckingLimit(false);
        if (quota.limited && (quota.expired || quota.remaining === 0)) {
          setLimitQuota(quota);
          return;
        }
        resetAndOpenAddModal();
      });
      return;
    }
    resetAndOpenAddModal();
  }

  function resetAndOpenAddModal() {
    setEditingId(null);
    setTitle('');
    setCategory('');
    setDurationMinutes(30);
    setAllowReview(true);
    setGroupIds([]);
    setIsModalOpen(true);
  }

  function openEditModal(exam: Exam) {
    setEditingId(exam.id);
    setTitle(exam.title);
    setCategory(exam.category);
    setDurationMinutes(exam.durationMinutes);
    setAllowReview(exam.allowReview);
    setGroupIds(exam.groupIds);
    setIsModalOpen(true);
  }

  function askDelete(exam: Exam) {
    setDeleteTarget(exam);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (
      !title.trim() ||
      !category.trim() ||
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      setValidationError(
        'لطفاً عنوان، دسته‌بندی و مدت زمان معتبر آزمون را پر کنید'
      );
      return;
    }

    if (groupIds.length === 0) {
      setValidationError(
        'حداقل یک گروه رو انتخاب کن، وگرنه این آزمون برای هیچ‌کس قابل دیدن نیست'
      );
      return;
    }

    const existingExam = editingId
      ? exams.find((exam) => exam.id === editingId)
      : undefined;

    const examData = {
      title,
      category: category as Exam['category'],
      date: existingExam?.date ?? '۱۴۰۵/۰۶/۱۵',
      participants: existingExam?.participants ?? 0,
      status: existingExam?.status ?? ('upcoming' as const),
      durationMinutes,
      allowReview,
      groupIds,
    };

    if (editingId) {
      await updateItem(editingId, examData);
    } else {
      await addItem(examData);
    }

    setIsModalOpen(false);
  }

  return (
    <AppLayout title="آزمون‌ها">
      {error && (
        <Toast
          message={error}
          tone="danger"
          icon={XCircle}
          onDismiss={clearError}
        />
      )}
      {validationError && (
        <Toast
          message={validationError}
          tone="warning"
          icon={AlertTriangle}
          onDismiss={() => setValidationError(null)}
        />
      )}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold dark:text-white">آزمون‌ها</h1>
            {canManage && (
              <button
                onClick={openAddModal}
                disabled={checkingLimit}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
              >
                + آزمون جدید
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
            {visibleExams.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={
                  canManage ? 'هنوز آزمونی نساختی' : 'هنوز آزمونی برات ثبت نشده'
                }
                description={
                  canManage
                    ? 'با دکمه‌ی «آزمون جدید» اولین آزمونت رو بساز و به یک یا چند گروه وصلش کن.'
                    : 'وقتی مدرس آزمونی برای گروهت تعریف کنه، اینجا نشون داده می‌شه.'
                }
                action={
                  canManage
                    ? { label: '+ آزمون جدید', onClick: openAddModal }
                    : undefined
                }
              />
            ) : (
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2">عنوان</th>
                    <th className="py-2">دسته‌بندی</th>
                    <th className="py-2">تاریخ</th>
                    {canManage && <th className="py-2">شرکت‌کنندگان</th>}
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      <td className="py-3">{exam.title}</td>
                      <td className="py-3">{exam.category}</td>
                      <td className="py-3">{exam.date}</td>
                      {canManage && (
                        <td className="py-3">
                          {getParticipantCount(exam.id).toLocaleString('fa-IR')}
                        </td>
                      )}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/exams/${exam.id}/take`)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-success-500/10 hover:text-success-600 dark:text-gray-400 dark:hover:bg-success-500/15 dark:hover:text-success-500 transition"
                            title="شروع آزمون"
                          >
                            <PlayCircle size={16} />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() =>
                                  navigate(`/exams/${exam.id}/questions`)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-accent-500/10 hover:text-accent-600 dark:text-gray-400 dark:hover:bg-accent-500/15 dark:hover:text-accent-500 transition"
                                title="بانک سوال"
                              >
                                <ListChecks size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(exam)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition"
                                title="ویرایش"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => askDelete(exam)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-danger-50 hover:text-danger-600 dark:text-gray-400 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 transition"
                                title="حذف"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {editingId ? 'ویرایش آزمون' : 'آزمون جدید'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              عنوان آزمون
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
              placeholder="مثلاً: مبانی جاوااسکریپت"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              دسته‌بندی
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
            >
              <option value="">انتخاب کنید</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              مدت زمان آزمون (دقیقه)
            </label>
            <div className="relative">
              <Clock
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl pr-11 pl-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
                placeholder="مثلاً: ۳۰"
              />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDurationMinutes(preset)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    durationMinutes === preset
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.toLocaleString('fa-IR')} دقیقه
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                اجازه‌ی مرور قبل از ثبت نهایی
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                دانشجو بتونه به سوالات قبلی برگرده و قبل از اتمام، پاسخ‌ها رو
                مرور کنه
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowReview((prev) => !prev)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                allowReview ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                  allowReview ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              گروه‌های مجاز به دیدن این آزمون
            </label>
            {availableGroups.length === 0 ? (
              <p className="text-xs text-gray-400">
                هنوز هیچ گروهی نساختی — اول از صفحه‌ی گروه‌ها یکی بساز.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                {availableGroups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={groupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition"
          >
            {editingId ? 'ذخیره تغییرات' : 'افزودن'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h2 className="text-lg font-bold mb-2 dark:text-white">حذف آزمون</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          آیا از حذف آزمون «{deleteTarget?.title}» مطمئنی؟ این عملیات قابل
          بازگشت نیست.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            انصراف
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 rounded-xl bg-danger-600 py-2.5 text-sm font-medium text-white hover:bg-danger-700 transition"
          >
            حذف
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!limitQuota} onClose={() => setLimitQuota(null)}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-500">
            <Crown size={22} />
          </div>
          <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
            محدودیت پلن فعلی
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {limitQuota && limitMessage(limitQuota)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setLimitQuota(null)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              باشه
            </button>
            <button
              onClick={() => navigate('/plans')}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              رفتن به صفحه‌ی پکیج
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

export default ExamsPage;
