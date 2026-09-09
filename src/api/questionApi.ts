import { generateId } from '../utils/generateId';

export type Question = {
  id: string;
  examId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
};

let questions: Question[] = [
  {
    id: '1',
    examId: '1',
    text: 'کدام دستور در SQL برای حذف رکورد استفاده می‌شود؟',
    options: ['REMOVE', 'DELETE', 'DROP', 'CLEAR'],
    correctOptionIndex: 1,
  },
  {
    id: '2',
    examId: '1',
    text: 'کلید اصلی (Primary Key) چه ویژگی‌ای دارد؟',
    options: [
      'می‌تواند تکراری باشد',
      'منحصربه‌فرد و غیرتهی است',
      'همیشه رشته است',
      'اختیاری است',
    ],
    correctOptionIndex: 1,
  },
  {
    id: '3',
    examId: '2',
    text: 'هوک useState در React چه کاری انجام می‌دهد؟',
    options: [
      'فراخوانی API',
      'مدیریت state محلی کامپوننت',
      'روتینگ صفحات',
      'استایل‌دهی',
    ],
    correctOptionIndex: 1,
  },
];

export function getQuestionsByExamId(examId: string): Promise<Question[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(questions.filter((q) => q.examId === examId));
    }, 500);
  });
}

export function addQuestion(question: Omit<Question, 'id'>): Promise<Question> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newQuestion: Question = { ...question, id: generateId() };
      questions.push(newQuestion);
      resolve(newQuestion);
    }, 500);
  });
}

export function updateQuestion(
  id: string,
  updated: Omit<Question, 'id'>
): Promise<Question> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = questions.some((q) => q.id === id);
      if (!exists) {
        reject(new Error('سوال یافت نشد'));
        return;
      }
      questions = questions.map((q) => (q.id === id ? { ...updated, id } : q));
      resolve({ ...updated, id });
    }, 500);
  });
}

export function deleteQuestion(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = questions.some((q) => q.id === id);
      if (!exists) {
        reject(new Error('سوال یافت نشد'));
        return;
      }
      questions = questions.filter((q) => q.id !== id);
      resolve();
    }, 500);
  });
}
export function addQuestionsBulk(
  newQuestions: Omit<Question, 'id'>[]
): Promise<Question[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const created = newQuestions.map((q) => ({
        ...q,
        id: generateId(),
      }));
      questions.push(...created);
      resolve(created);
    }, 500);
  });
}
