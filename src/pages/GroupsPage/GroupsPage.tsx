import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RotateCw,
  KeyRound,
  Crown,
} from 'lucide-react';
import {
  getGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  regenerateJoinCode,
  type Group,
} from '../../api/groupApi';
import { getCurrentUser } from '../../api/authApi';
import { getStudents, type Student } from '../../api/studentApi';
import {
  getRemainingGroupQuota,
  type RemainingQuota,
} from '../../api/subscriptionApi';
import { CATEGORIES, type Category } from '../../constants/categories';
import useCrud from '../../hooks/useCrud';
import AppLayout from '../../components/AppLayout/AppLayout';
import Modal from '../../components/Modal/Modal';
import Spinner from '../../components/Spinner/Spinner';
import Toast from '../../components/Toast/Toast';
import EmptyState from '../../components/EmptyState/EmptyState';

function limitMessage(quota: Extract<RemainingQuota, { limited: true }>) {
  return quota.expired
    ? 'اشتراکت منقضی شده. برای ساختن گروه جدید اول باید پلنت رو تمدید کنی.'
    : `پلن فعلیت اجازه‌ی حداکثر ${quota.limit.toLocaleString(
        'fa-IR'
      )} گروه رو می‌ده و همین الان ${quota.used.toLocaleString(
        'fa-IR'
      )} تا داری. برای گروه بیشتر باید پلنت رو ارتقا بدی.`;
}

function GroupsPage() {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const {
    items: groups,
    loading,
    error,
    clearError,
    addItem,
    updateItem,
    deleteItem,
    patchItem,
  } = useCrud<Group, Omit<Group, 'id' | 'joinCode'>>({
    getAll: getGroups,
    add: addGroup,
    update: updateGroup,
    remove: deleteGroup,
  });

  // SuperAdmin همه‌ی گروه‌ها رو می‌بینه، مدرس فقط گروه‌های خودش رو
  const visibleGroups =
    currentUser?.role === 'SuperAdmin'
      ? groups
      : groups.filter((g) => g.instructorId === currentUser?.id);

  // برای چک‌لیست عضویت، به لیست دانشجوها نیاز داریم (نه فقط عضوهای فعلی گروه)
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  useEffect(() => {
    getStudents().then(setAllStudents);
  }, []);

  // SuperAdmin کل roster رو تو چک‌لیست می‌بینه؛ Instructor فقط دانشجوهایی که
  // از قبل تو حداقل یکی از گروه‌های خودشه (یعنی می‌تونه بینشون جابه‌جا کنه)
  // نه کل روستر سیستم - همون منطق StudentsPage.tsx
  const students =
    currentUser?.role === 'SuperAdmin'
      ? allStudents
      : allStudents.filter((s) =>
          visibleGroups.some((g) => g.studentIds.includes(s.id))
        );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [limitQuota, setLimitQuota] = useState<Extract<
    RemainingQuota,
    { limited: true }
  > | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);

  async function handleCopyCode(group: Group) {
    try {
      await navigator.clipboard.writeText(group.joinCode);
      setCopiedGroupId(group.id);
      setTimeout(() => setCopiedGroupId(null), 1500);
    } catch {
      // اگه کلیپ‌بورد در دسترس نبود (مثلاً به‌خاطر مجوز مرورگر)، حداقل کد
      // رو تو خود کارت نشون دادیم؛ مدرس می‌تونه دستی سلکت/کپی کنه
    }
  }

  async function handleRegenerateCode(group: Group) {
    setRegeneratingId(group.id);
    try {
      const updated = await regenerateJoinCode(group.id);
      patchItem(updated);
    } finally {
      setRegeneratingId(null);
    }
  }

  async function openAddModal() {
    // محدودیت پلن فقط برای Instructor چک می‌شه؛ SuperAdmin بدون محدودیته
    if (currentUser?.role === 'Instructor') {
      setCheckingLimit(true);
      const quota = await getRemainingGroupQuota(currentUser.id);
      setCheckingLimit(false);
      if (quota.limited && (quota.expired || quota.remaining === 0)) {
        setLimitQuota(quota);
        return;
      }
    }

    setEditingId(null);
    setName('');
    setCategory('');
    setSelectedStudentIds([]);
    setIsModalOpen(true);
  }

  function openEditModal(group: Group) {
    setEditingId(group.id);
    setName(group.name);
    setCategory(group.category);
    setSelectedStudentIds(group.studentIds);
    setIsModalOpen(true);
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !category) {
      setValidationError('لطفاً نام گروه و دسته‌بندی را مشخص کنید');
      return;
    }

    const groupData: Omit<Group, 'id' | 'joinCode'> = {
      name: name.trim(),
      category,
      instructorId: currentUser?.id ?? '',
      studentIds: selectedStudentIds,
    };

    if (editingId) {
      await updateItem(editingId, groupData);
    } else {
      await addItem(groupData);
    }

    setIsModalOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <AppLayout title="گروه‌ها">
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
            <div>
              <h1 className="text-2xl font-bold dark:text-white">گروه‌ها</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                هر گروه یه دسته از دانشجوهاست؛ درس‌ها و آزمون‌ها رو به گروه وصل
                می‌کنی، نه مستقیم به تک‌تک دانشجوها
              </p>
            </div>
            <button
              onClick={openAddModal}
              disabled={checkingLimit}
              className="flex shrink-0 items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition text-sm disabled:opacity-60"
            >
              <Plus size={16} />
              گروه جدید
            </button>
          </div>

          {visibleGroups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="هنوز گروهی نساختی"
              description="اول یه گروه بساز، بعد دانشجوها رو بهش اضافه کن تا بتونی آزمون و درس براشون تعریف کنی."
              action={{ label: '+ گروه جدید', onClick: openAddModal }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
                      <Users size={20} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(group)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition"
                        title="ویرایش"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(group)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-danger-50 hover:text-danger-600 dark:text-gray-400 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 transition"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h2 className="font-bold text-gray-900 dark:text-white">
                    {group.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {group.category}
                  </p>
                  <p className="mt-3 text-xs text-gray-400">
                    {group.studentIds.length.toLocaleString('fa-IR')} دانشجو عضو
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <KeyRound size={14} />
                      <span className="text-xs">کد عضویت</span>
                    </div>
                    <span className="font-mono text-sm font-bold tracking-widest text-gray-800 dark:text-white">
                      {group.joinCode}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCode(group)}
                        title="کپی کد"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-700 transition"
                      >
                        {copiedGroupId === group.id ? (
                          <Check size={14} className="text-success-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleRegenerateCode(group)}
                        title="تولید کد جدید (کد قبلی دیگه کار نمی‌کنه)"
                        disabled={regeneratingId === group.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-700 transition disabled:opacity-50"
                      >
                        <RotateCw
                          size={14}
                          className={
                            regeneratingId === group.id ? 'animate-spin' : ''
                          }
                        />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    این کد رو به دانشجوهات بده تا از صفحه‌ی ثبت‌نام مستقیم عضو
                    همین گروه بشن
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {editingId ? 'ویرایش گروه' : 'گروه جدید'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              نام گروه
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
              placeholder="مثلاً: کلاس ریاضی - ترم پاییز"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              دسته‌بندی موضوعی
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
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

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              اعضای گروه ({selectedStudentIds.length.toLocaleString('fa-IR')}{' '}
              نفر انتخاب‌شده)
            </label>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
              {students.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-400">
                  هنوز دانشجویی ثبت نشده
                </p>
              ) : (
                students.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-sm last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      {student.name}
                    </span>
                    <span className="mr-auto text-xs text-gray-400">
                      {student.username}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition"
          >
            {editingId ? 'ذخیره تغییرات' : 'ساخت گروه'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h2 className="text-lg font-bold mb-2 dark:text-white">حذف گروه</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          آیا از حذف «{deleteTarget?.name}» مطمئنی؟ درس‌ها/آزمون‌های وصل‌شده به
          این گروه دیگه برای اعضاش نمایش داده نمی‌شن (ولی خودشون حذف نمی‌شن).
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

export default GroupsPage;
