import { useState } from 'react';
import type { Category } from '../constants/categories';
import type { LessonSession, VideoSource } from '../api/lessonApi';

type SessionInput = Omit<LessonSession, 'id'>;
type UploadedFile = { fileName: string; objectUrl: string };

type UseSessionFormModalParams = {
  groupId: string | undefined;
  category: Category | undefined;
  addItem: (input: SessionInput) => Promise<unknown>;
  updateItem: (id: string, input: SessionInput) => Promise<unknown>;
};

function useSessionFormModal({
  groupId,
  category,
  addItem,
  updateItem,
}: UseSessionFormModalParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'link' | 'upload'>('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setVideoType('link');
    setVideoUrl('');
    setUploadedFile(null);
    setIsOpen(true);
  }

  function openEdit(session: LessonSession) {
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
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
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
    if (!groupId || !category) return;

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

    const sessionData: SessionInput = {
      category,
      groupIds: [groupId],
      title: title.trim(),
      description: description.trim(),
      video,
    };

    if (editingId) {
      await updateItem(editingId, sessionData);
    } else {
      await addItem(sessionData);
    }

    setIsOpen(false);
  }

  return {
    isOpen,
    editingId,
    title,
    setTitle,
    description,
    setDescription,
    videoType,
    setVideoType,
    videoUrl,
    setVideoUrl,
    uploadedFile,
    handleFileChange,
    validationError,
    dismissValidationError: () => setValidationError(null),
    openAdd,
    openEdit,
    close,
    handleSubmit,
  };
}

export default useSessionFormModal;