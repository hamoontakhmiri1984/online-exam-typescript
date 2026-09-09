import AppLayout from '../../components/AppLayout/AppLayout';
import Modal from '../../components/Modal/Modal';
import Spinner from '../../components/Spinner/Spinner';
import Toast from '../../components/Toast/Toast';
import useQuestionBank from '../../hooks/useQuestionBank';
import { getExamById, type Exam } from '../../api/examApi';
import type { Question } from '../../api/questionApi';
import {
  parseQuestionsFromExcel,
  downloadQuestionTemplate,
  type ParsedQuestion,
} from '../../utils/questionExcel';
import {
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  X,
  Upload,
  Download,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Crown,
} from 'lucide-react';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../api/authApi';
import {
  getRemainingQuestionQuota,
  type RemainingQuota,
} from '../../api/subscriptionApi';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

function limitMessage(quota: Extract<RemainingQuota, { limited: true }>) {
  return quota.expired
    ? 'اشتراکت منقضی شده. برای افزودن سوال جدید اول باید پلنت رو تمدید کنی.'
    : `پلن فعلیت اجازه‌ی حداکثر ${quota.limit.toLocaleString(
        'fa-IR'
      )} سوال تو بانک سوال رو می‌ده و همین الان ${quota.used.toLocaleString(
        'fa-IR'
      )} تا داری. برای سوال بیشتر باید پلنت رو ارتقا بدی.`;
}

function QuestionsPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [exam, setExam] = useState<Exam | null>(null);

  const {
    questions,
    loading,
    error,
    clearError,
    addItem,
    addMany,
    updateItem,
    deleteItem,
  } = useQuestionBank(examId ?? '');

  useEffect(() => {
    if (!examId) return;
    getExamById(examId).then((data) => setExam(data ?? null));
  }, [examId]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const [text, setText] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- Import state ---
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>('');

  const [limitQuota, setLimitQuota] = useState<Extract<
    RemainingQuota,
    { limited: true }
  > | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);

  // چک محدودیت پلن قبل از اجازه‌ی افزودن سوال - فقط برای Instructor
  // (SuperAdmin محدودیتی نداره). چون هم فرم تکی و هم ایمپورت اکسل هر دو
  // باعث اضافه شدن سوال می‌شن، هر دو مسیر از همین یک تابع رد می‌شن.
  async function checkQuestionLimit(): Promise<boolean> {
    if (currentUser?.role !== 'Instructor') return true;
    setCheckingLimit(true);
    const quota = await getRemainingQuestionQuota(currentUser.id);
    setCheckingLimit(false);
    if (quota.limited && (quota.expired || quota.remaining === 0)) {
      setLimitQuota(quota);
      return false;
    }
    return true;
  }

  async function openAddModal() {
    if (!(await checkQuestionLimit())) return;
    setEditingId(null);
    setText('');
    setOptions(['', '']);
    setCorrectOptionIndex(0);
    setIsModalOpen(true);
  }

  function openEditModal(question: Question) {
    setEditingId(question.id);
    setText(question.text);
    setOptions(question.options);
    setCorrectOptionIndex(question.correctOptionIndex);
    setIsModalOpen(true);
  }

  function askDelete(question: Question) {
    setDeleteTarget(question);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  }

  function updateOptionText(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (correctOptionIndex === index) {
      setCorrectOptionIndex(0);
    } else if (correctOptionIndex > index) {
      setCorrectOptionIndex((prev) => prev - 1);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedOptions = options.map((opt) => opt.trim());

    if (!text.trim() || trimmedOptions.some((opt) => !opt)) {
      setValidationError('لطفاً متن سوال و همه‌ی گزینه‌ها را پر کنید');
      return;
    }

    const questionData = {
      text: text.trim(),
      options: trimmedOptions,
      correctOptionIndex,
    };

    if (editingId) {
      await updateItem(editingId, questionData);
    } else {
      await addItem(questionData);
    }

    setIsModalOpen(false);
  }

  // --- Import handlers ---
  async function openImportModal() {
    if (!(await checkQuestionLimit())) return;
    setImportPreview([]);
    setImportError('');
    setIsImportModalOpen(true);
  }

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportError('');

    try {
      const parsed = await parseQuestionsFromExcel(file);
      if (parsed.length === 0) {
        setImportError(
          'هیچ سوال معتبری تو فایل پیدا نشد. مطمئن شو از قالب درست استفاده کردی.'
        );
      }
      setImportPreview(parsed);
    } catch {
      setImportError('خطا در خواندن فایل. مطمئن شو فرمتش Excel یا CSV است.');
    } finally {
      setIsParsing(false);
      event.target.value = '';
    }
  }

  async function confirmImport() {
    if (importPreview.length === 0) return;

    // ظرفیت رو دوباره تازه چک می‌کنیم (نه از رو state قبلی) چون ممکنه
    // بین باز شدن مودال و همین لحظه، جای دیگه‌ای سوال اضافه شده باشه
    if (currentUser?.role === 'Instructor') {
      const quota = await getRemainingQuestionQuota(currentUser.id);
      if (quota.limited) {
        if (quota.expired || quota.remaining === 0) {
          setIsImportModalOpen(false);
          setLimitQuota(quota);
          return;
        }
        if (importPreview.length > quota.remaining) {
          setImportError(
            `این فایل ${importPreview.length.toLocaleString(
              'fa-IR'
            )} سوال داره ولی پلن فعلیت فقط ${quota.remaining.toLocaleString(
              'fa-IR'
            )} سوال دیگه جا داره. فایل رو کوچیک‌تر کن یا پلنت رو ارتقا بده.`
          );
          return;
        }
      }
    }

    setIsImporting(true);
    await addMany(importPreview);
    setIsImporting(false);
    setIsImportModalOpen(false);
    setImportPreview([]);
  }

  return (
    <AppLayout title={exam ? `بانک سوال — ${exam.title}` : 'بانک سوال'}>
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
      <button
        onClick={() => navigate('/exams')}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition"
      >
        <ArrowRight size={16} />
        بازگشت به لیست آزمون‌ها
      </button>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-bold dark:text-white">
              سوالات {exam?.title}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={openImportModal}
                disabled={checkingLimit}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition disabled:opacity-60"
              >
                <Upload size={16} />
                ایمپورت از اکسل
              </button>
              <button
                onClick={openAddModal}
                disabled={checkingLimit}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
              >
                + سوال جدید
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="هنوز سوالی برای این آزمون ثبت نشده"
              description="با دکمه‌ی «سوال جدید» بساز، یا سوالات رو یک‌جا از اکسل ایمپورت کن."
              action={{ label: '+ سوال جدید', onClick: openAddModal }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium text-gray-800 dark:text-white">
                      <span className="text-gray-400 dark:text-gray-500">
                        {(index + 1).toLocaleString('fa-IR')}.
                      </span>
                      {question.text}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => openEditModal(question)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition"
                        title="ویرایش"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => askDelete(question)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-danger-50 hover:text-danger-600 dark:text-gray-400 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 transition"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`rounded-xl border px-4 py-2 text-sm ${
                          optionIndex === question.correctOptionIndex
                            ? 'border-success-500/40 bg-success-500/10 text-success-600 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-500'
                            : 'border-gray-100 text-gray-600 dark:border-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {editingId ? 'ویرایش سوال' : 'سوال جدید'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              متن سوال
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition resize-none"
              placeholder="متن سوال را بنویسید..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              گزینه‌ها (گزینه‌ی درست را انتخاب کنید)
            </label>

            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectOptionIndex(index)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                    correctOptionIndex === index
                      ? 'border-success-500 bg-success-500 text-white'
                      : 'border-gray-300 text-gray-400 hover:border-success-500 dark:border-gray-600'
                  }`}
                  title="علامت‌گذاری به‌عنوان جواب درست"
                >
                  {String.fromCharCode(65 + index)}
                </button>
                <input
                  value={option}
                  onChange={(e) => updateOptionText(index, e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
                  placeholder={`گزینه ${String.fromCharCode(65 + index)}`}
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-950/40 transition"
                    title="حذف گزینه"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}

            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="mt-1 flex items-center gap-1.5 self-start text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition"
              >
                <Plus size={16} />
                افزودن گزینه
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition"
          >
            {editingId ? 'ذخیره تغییرات' : 'افزودن سوال'}
          </button>
        </form>
      </Modal>
      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h2 className="text-lg font-bold mb-2 dark:text-white">حذف سوال</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          آیا از حذف این سوال مطمئنی؟ این عملیات قابل بازگشت نیست.
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
      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      >
        <h2 className="text-lg font-bold mb-2 dark:text-white">
          ایمپورت سوال از اکسل
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          فایل Excel یا CSV را طبق قالب زیر آپلود کن.
        </p>

        <button
          onClick={downloadQuestionTemplate}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition"
        >
          <Download size={16} />
          دانلود قالب نمونه
        </button>

        <label className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-800 dark:hover:bg-brand-950/20 transition">
          <Upload size={20} />
          فایل را انتخاب کن (xlsx یا csv)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelected}
            className="hidden"
          />
        </label>

        {isParsing && (
          <p className="mb-4 text-sm text-gray-400">در حال خواندن فایل...</p>
        )}

        {importError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-600 dark:border-danger-900 dark:bg-danger-950/30 dark:text-danger-400">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {importError}
          </div>
        )}

        {importPreview.length > 0 && (
          <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
            {importPreview.map((question, index) => (
              <div
                key={index}
                className="border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800"
              >
                <p className="mb-1 text-sm font-medium text-gray-800 dark:text-white">
                  {(index + 1).toLocaleString('fa-IR')}. {question.text}
                </p>
                <p className="text-xs text-gray-400">
                  {question.options.length.toLocaleString('fa-IR')} گزینه — جواب
                  درست: {String.fromCharCode(65 + question.correctOptionIndex)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(false)}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            انصراف
          </button>
          <button
            onClick={confirmImport}
            disabled={importPreview.length === 0 || isImporting}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            {isImporting
              ? 'در حال افزودن...'
              : `افزودن ${
                  importPreview.length
                    ? importPreview.length.toLocaleString('fa-IR')
                    : ''
                } سوال`}
          </button>
        </div>
      </Modal>
      {/* Plan Limit Modal */}
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

export default QuestionsPage;
