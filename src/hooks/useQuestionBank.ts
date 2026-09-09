import { useEffect, useState } from 'react';
import {
  getQuestionsByExamId,
  addQuestion,
  addQuestionsBulk,
  updateQuestion,
  deleteQuestion,
  type Question,
} from '../api/questionApi';

type QuestionInput = Omit<Question, 'id' | 'examId'>;

function useQuestionBank(examId: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuestionsByExamId(examId)
      .then(setQuestions)
      .catch(() => setError('دریافت سوال‌ها با خطا مواجه شد'))
      .finally(() => setLoading(false));
  }, [examId]);

  async function addItem(input: QuestionInput) {
    try {
      const newQuestion = await addQuestion({ ...input, examId });
      setQuestions((prev) => [...prev, newQuestion]);
    } catch {
      setError('افزودن سوال با خطا مواجه شد');
    }
  }

  async function addMany(inputs: QuestionInput[]) {
    try {
      const withExamId = inputs.map((input) => ({ ...input, examId }));
      const created = await addQuestionsBulk(withExamId);
      setQuestions((prev) => [...prev, ...created]);
    } catch {
      setError('ایمپورت سوال‌ها با خطا مواجه شد');
    }
  }

  async function updateItem(id: string, input: QuestionInput) {
    try {
      const updated = await updateQuestion(id, { ...input, examId });
      setQuestions((prev) =>
        prev.map((question) => (question.id === id ? updated : question))
      );
    } catch {
      setError('ذخیره سوال با خطا مواجه شد');
    }
  }

  async function deleteItem(id: string) {
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((question) => question.id !== id));
    } catch {
      setError('حذف سوال با خطا مواجه شد');
    }
  }

  return {
    questions,
    loading,
    error,
    clearError: () => setError(null),
    addItem,
    addMany,
    updateItem,
    deleteItem,
  };
}

export default useQuestionBank;
