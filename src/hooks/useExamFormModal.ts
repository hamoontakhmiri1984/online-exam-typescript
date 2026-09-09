import { useState } from 'react';
import type { Exam } from '../api/examApi';

export const DURATION_PRESETS = [10, 15, 30, 60];

type ExamInput = Omit<Exam, 'id'>;

type UseExamFormModalParams = {
  exams: Exam[];
  addItem: (input: ExamInput) => Promise<unknown>;
  updateItem: (id: string, input: ExamInput) => Promise<unknown>;
};

function useExamFormModal({ exams, addItem, updateItem }: UseExamFormModalParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [allowReview, setAllowReview] = useState(true);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setTitle('');
    setCategory('');
    setDurationMinutes(30);
    setAllowReview(true);
    setGroupIds([]);
    setIsOpen(true);
  }

  function openEdit(exam: Exam) {
    setEditingId(exam.id);
    setTitle(exam.title);
    setCategory(exam.category);
    setDurationMinutes(exam.durationMinutes);
    setAllowReview(exam.allowReview);
    setGroupIds(exam.groupIds);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
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

    const examData: ExamInput = {
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

    setIsOpen(false);
  }

  return {
    isOpen,
    editingId,
    title,
    setTitle,
    category,
    setCategory,
    durationMinutes,
    setDurationMinutes,
    allowReview,
    setAllowReview,
    groupIds,
    toggleGroup,
    validationError,
    dismissValidationError: () => setValidationError(null),
    openAdd,
    openEdit,
    close,
    handleSubmit,
  };
}

export default useExamFormModal;