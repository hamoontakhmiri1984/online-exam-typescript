import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  Link as LinkIcon,
  Upload,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Video,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import Modal from '../../components/Modal/Modal';
import Spinner from '../../components/Spinner/Spinner';
import Toast from '../../components/Toast/Toast';
import EmptyState from '../../components/EmptyState/EmptyState';
import {
  getSessionsByGroupId,
  addSession,
  updateSession,
  deleteSession,
  type LessonSession,
  type VideoSource,
} from '../../api/lessonApi';
import { getGroupById, type Group } from '../../api/groupApi';
import { getCurrentUser } from '../../api/authApi';
import { MANAGEMENT_ROLES } from '../../constants/roles';

// یوتیوب/آپارات لینک معمولی رو به لینک قابل embed تبدیل می‌کنه؛
// برای بقیه لینک‌ها همون آدرس اصلی رو برمی‌گردونه
function toEmbedUrl(url: string): string {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
  );
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

  const aparatMatch = url.match(/aparat\.com\/video\/([\w-]+)/);
  if (aparatMatch)
    return `https://www.aparat.com/video/embed/${aparatMatch[1]}`;

  return url;
}

function GroupLessonsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const canManage =
    !!currentUser && MANAGEMENT_ROLES.includes(currentUser.role);

  const [group, setGroup] = useState<Group | null>(null);
  const [groupLoading, setGroupLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!groupId) return;
    getGroupById(groupId).then((data) => {
      setGroup(data ?? null);
      setGroupLoading(false);
    });
  }, [groupId]);

  // این صفحه با URL مستقیم هم قابل دسترسیه؛ صفحه‌ی لیست درس‌ها فقط
  // گروه‌های قابل‌مشاهده‌ی کاربر رو نشون می‌ده، ولی اگه اینجا چک نشه،
  // دانشجو می‌تونه گروه‌های دیگه رو هم مستقیماً با تایپ لینک ببینه، یا
  // مدرس بتونه گروهی خارج از گروه‌های خودش رو مدیریت کنه
  const hasGroupAccess =
    !!group &&
    (!currentUser ||
      currentUser.role === 'SuperAdmin' ||
      (currentUser.role === 'Instructor' &&
        group.instructorId === currentUser.id) ||
      (currentUser.role === 'Student' &&
        group.studentIds.includes(currentUser.id)));

  const [sessions, setSessions] = useState<LessonSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LessonSession | null>(
    null
  );

  useEffect(() => {
    if (!groupId || groupLoading || !hasGroupAccess) return;
    setLoading(true);
    getSessionsByGroupId(groupId)
      .then((data) => {
        setSessions(data);
        setActiveSession(data[0] ?? null);
      })
      .catch(() => setError('دریافت جلسات با خطا مواجه شد'))
      .finally(() => setLoading(false));
  }, [groupId, groupLoading, hasGroupAccess]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LessonSession | null>(null);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [videoType, setVideoType] = useState<'link' | 'upload'>('link');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    objectUrl: string;
  } | null>(null);

  function openAddModal() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setVideoType('link');
    setVideoUrl('');
    setUploadedFile(null);
    setIsModalOpen(true);
  }

  function openEditModal(session: LessonSession) {
    setEditingId(session.id);
    setTitle(session.title);
    setDescription(session.description);
    setVideoType(session.video.type);
    if (session.video.type === 'link') {
      setVideoUrl(session.video.url);
      setUploadedFile(null);
    } else {
      setVideoUrl('');
      setUploadedFile({
        fileName: session.video.fileName,
        objectUrl: session.video.objectUrl,
      });
    }
    setIsModalOpen(true);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile({
      fileName: file.name,
      objectUrl: URL.createObjectURL(file),
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!groupId || !group) return;

    if (!title.trim()) {
      setValidationError('لطفاً عنوان جلسه را وارد کنید');
      return;
    }

    let video: VideoSource;
    if (videoType === 'link') {
      if (!videoUrl.trim()) {
        setValidationError('لطفاً لینک ویدیو را وارد کنید');
        return;
      }
      video = { type: 'link', url: videoUrl.trim() };
    } else {
      if (!uploadedFile) {
        setValidationError('لطفاً فایل ویدیو را انتخاب کنید');
        return;
      }
      video = { type: 'upload', ...uploadedFile };
    }

    const sessionData = {
      category: group.category,
      groupIds: [groupId],
      title: title.trim(),
      description: description.trim(),
      video,
    };

    try {
      if (editingId) {
        const updated = await updateSession(editingId, sessionData);
        setSessions((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s))
        );
      } else {
        const created = await addSession(sessionData);
        setSessions((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch {
      setError('ذخیره جلسه با خطا مواجه شد');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSession(deleteTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (activeSession?.id === deleteTarget.id) {
        setActiveSession(null);
      }
    } catch {
      setError('حذف جلسه با خطا مواجه شد');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AppLayout title={group ? `درس ${group.name}` : 'درس'}>
      {error && (
        <Toast
          message={error}
          tone="danger"
          icon={XCircle}
          onDismiss={() => setError(null)}
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
        onClick={() => navigate('/lessons')}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition"
      >
        <ArrowRight size={16} />
        بازگشت به درس‌ها
      </button>

      {groupLoading ? (
        <Spinner />
      ) : !hasGroupAccess ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
          دسترسی به این گروه برای شما مجاز نیست.
        </div>
      ) : loading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold dark:text-white">
              {group?.name}
            </h1>
            {canManage && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition text-sm"
              >
                <Plus size={16} />
                جلسه جدید
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={Video}
              title="هنوز جلسه‌ای برای این درس ثبت نشده"
              description={
                canManage
                  ? 'با دکمه‌ی «جلسه جدید» اولین ویدیوی این گروه رو اضافه کن.'
                  : 'وقتی مدرس ویدیویی برای این گروه اضافه کنه، اینجا نشون داده می‌شه.'
              }
              action={
                canManage
                  ? { label: '+ جلسه جدید', onClick: openAddModal }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* پخش‌کننده */}
              <div className="lg:col-span-2">
                {activeSession ? (
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
                    <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-black">
                      {activeSession.video.type === 'link' ? (
                        <iframe
                          key={activeSession.id}
                          src={toEmbedUrl(activeSession.video.url)}
                          className="h-full w-full"
                          allowFullScreen
                          title={activeSession.title}
                        />
                      ) : (
                        <video
                          key={activeSession.id}
                          src={activeSession.video.objectUrl}
                          controls
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                      {activeSession.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {activeSession.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
                    یک جلسه را برای پخش انتخاب کن.
                  </div>
                )}
              </div>

              {/* لیست جلسات */}
              <div className="flex flex-col gap-2">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                      activeSession?.id === session.id
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/30'
                        : 'border-gray-100 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <button
                      onClick={() => setActiveSession(session)}
                      className="flex flex-1 items-center gap-3 text-right"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {(index + 1).toLocaleString('fa-IR')}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {session.title}
                      </span>
                      <PlayCircle
                        size={16}
                        className="mr-auto shrink-0 text-gray-300 dark:text-gray-600"
                      />
                    </button>

                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => openEditModal(session)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition"
                          title="ویرایش"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(session)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-danger-50 hover:text-danger-600 dark:text-gray-400 dark:hover:bg-danger-950/40 dark:hover:text-danger-400 transition"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* افزودن/ویرایش جلسه */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {editingId ? 'ویرایش جلسه' : 'جلسه جدید'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              عنوان جلسه
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
              placeholder="مثلاً: جلسه ۱: معرفی متغیرها"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              توضیحات
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition resize-none"
              placeholder="توضیح کوتاه درباره‌ی این جلسه"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              منبع ویدیو
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoType('link')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  videoType === 'link'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                <LinkIcon size={15} />
                لینک (یوتیوب/آپارات)
              </button>
              <button
                type="button"
                onClick={() => setVideoType('upload')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  videoType === 'upload'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                <Upload size={15} />
                آپلود فایل
              </button>
            </div>

            {videoType === 'link' ? (
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
                placeholder="https://www.aparat.com/video/..."
              />
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-800 dark:hover:bg-brand-950/20 transition">
                <Upload size={18} />
                {uploadedFile
                  ? uploadedFile.fileName
                  : 'فایل ویدیو را انتخاب کن'}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {videoType === 'upload' && (
              <p className="text-xs text-accent-600 dark:text-accent-400">
                توجه: چون بک‌اند فعلاً وصل نیست، فایل آپلودی فقط تو همین تب
                می‌مونه و با رفرش صفحه از بین می‌ره.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-brand-700 transition"
          >
            {editingId ? 'ذخیره تغییرات' : 'افزودن جلسه'}
          </button>
        </form>
      </Modal>

      {/* حذف */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <h2 className="text-lg font-bold mb-2 dark:text-white">حذف جلسه</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          آیا از حذف «{deleteTarget?.title}» مطمئنی؟ این عملیات قابل بازگشت
          نیست.
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
    </AppLayout>
  );
}

export default GroupLessonsPage;
