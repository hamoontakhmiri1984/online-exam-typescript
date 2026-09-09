import { generateId } from '../utils/generateId';
import { getExamById } from './examApi';
import { getGroupById } from './groupApi';
import { notifyInstructorOfAttempt } from './notificationApi';

export type ExamAttempt = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  correctCount: number;
  totalQuestions: number;
  startedAt: string; // ISO timestamp - وقتی دانشجو واقعاً دکمه‌ی شروع رو زد
  finishedAt: string; // ISO timestamp
  endedByTimeout: boolean;
};

let attempts: ExamAttempt[] = [];

export function submitAttempt(
  attempt: Omit<ExamAttempt, 'id'>
): Promise<ExamAttempt> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAttempt: ExamAttempt = {
        ...attempt,
        id: generateId(),
      };
      attempts.push(newAttempt);
      resolve(newAttempt);
      notifyInstructorsOfAttempt(newAttempt);
    }, 300);
  });
}

// بعد از ثبت هر تلاش، مدرس(های) گروه‌هایی که این آزمون بهشون تعلق داره رو
// مطلع می‌کنه. یه آزمون ممکنه به چند گروه با مدرس‌های متفاوت وصل باشه، پس
// هرکدوم رو (بدون تکرار) جدا اطلاع می‌ده
async function notifyInstructorsOfAttempt(attempt: ExamAttempt): Promise<void> {
  const exam = await getExamById(attempt.examId);
  if (!exam) return;

  const groups = await Promise.all(exam.groupIds.map((id) => getGroupById(id)));
  const instructorIds = new Set(
    groups
      .filter((group): group is NonNullable<typeof group> => !!group)
      .map((group) => group.instructorId)
  );

  instructorIds.forEach((instructorId) => {
    notifyInstructorOfAttempt(
      instructorId,
      attempt.studentName,
      exam.title,
      attempt.correctCount,
      attempt.totalQuestions
    );
  });
}

export function getAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(attempts.filter((a) => a.examId === examId));
    }, 300);
  });
}

export function getAttemptsByStudent(
  studentId: string
): Promise<ExamAttempt[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(attempts.filter((a) => a.studentId === studentId));
    }, 300);
  });
}

export function getAllAttempts(): Promise<ExamAttempt[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...attempts]), 300);
  });
}
