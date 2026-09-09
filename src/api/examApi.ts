import type { Category } from '../constants/categories';
import { generateId } from '../utils/generateId';

export type Exam = {
  id: string;
  title: string;
  category: Category;
  groupIds: string[]; // این آزمون به کدوم گروه(ها) تعلق داره - همینا تعیین می‌کنن کی می‌بینتش
  date: string;
  participants: number;
  status: 'completed' | 'upcoming';
  durationMinutes: number;
  allowReview: boolean;
};

let exams: Exam[] = [
  {
    id: '1',
    title: 'مبانی پایگاه داده',
    category: 'دیتابیس',
    groupIds: ['g1'], // گروه «کلاس ریاضی - ترم پاییز»
    date: '۱۴۰۵/۰۶/۰۳',
    participants: 45,
    status: 'completed',
    durationMinutes: 10,
    allowReview: true,
  },
  {
    id: '2',
    title: 'مبانی ری‌اکت',
    category: 'فرانت‌اند',
    groupIds: ['g1'],
    date: '۱۴۰۵/۰۶/۱۱',
    participants: 30,
    status: 'upcoming',
    durationMinutes: 15,
    allowReview: true,
  },
];

export function getExams(): Promise<Exam[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...exams]), 500);
  });
}

export function addExam(exam: Omit<Exam, 'id'>): Promise<Exam> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExam: Exam = { ...exam, id: generateId() };
      exams.push(newExam);
      resolve(newExam);
    }, 500);
  });
}

export function deleteExam(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = exams.some((e) => e.id === id);
      if (!exists) {
        reject(new Error('آزمون یافت نشد'));
        return;
      }
      exams = exams.filter((e) => e.id !== id);
      resolve();
    }, 500);
  });
}

export function updateExam(
  id: string,
  updated: Omit<Exam, 'id'>
): Promise<Exam> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = exams.some((e) => e.id === id);
      if (!exists) {
        reject(new Error('آزمون یافت نشد'));
        return;
      }
      exams = exams.map((e) => (e.id === id ? { ...updated, id } : e));
      resolve({ ...updated, id });
    }, 500);
  });
}

export function getExamById(id: string): Promise<Exam | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(exams.find((e) => e.id === id));
    }, 300);
  });
}
