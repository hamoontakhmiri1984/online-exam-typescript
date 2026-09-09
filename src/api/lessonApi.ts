import type { Category } from '../constants/categories';
import { generateId } from '../utils/generateId';

export type VideoSource =
  | { type: 'link'; url: string }
  | { type: 'upload'; fileName: string; objectUrl: string };

export type LessonSession = {
  id: string;
  category: Category;
  groupIds: string[]; // این جلسه به کدوم گروه(ها) تعلق داره
  title: string;
  description: string;
  video: VideoSource;
};

let sessions: LessonSession[] = [
  {
    id: 's1',
    category: 'ریاضی',
    groupIds: ['g1'], // گروه «کلاس ریاضی - ترم پاییز»
    title: 'جلسه ۱: معرفی متغیرها',
    description: 'آشنایی با مفهوم متغیر و کاربردش در معادلات',
    video: {
      type: 'link',
      url: 'https://www.aparat.com/video/example',
    },
  },
  {
    id: 's2',
    category: 'فرانت‌اند',
    groupIds: [], // هنوز به هیچ گروهی وصل نشده
    title: 'جلسه ۱: مبانی JSX',
    description: 'یادگیری نحو JSX و تفاوتش با HTML',
    video: {
      type: 'link',
      url: 'https://www.aparat.com/video/example',
    },
  },
];

export function getSessions(): Promise<LessonSession[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...sessions]), 500);
  });
}

// دیگه بر پایه‌ی category فیلتر نمی‌کنیم؛ چون category فقط یه برچسبه و
// می‌تونه بین چند گروه مشترک باشه. عضویت واقعی از روی groupIds مشخص می‌شه
export function getSessionsByGroupId(
  groupId: string
): Promise<LessonSession[]> {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(sessions.filter((s) => s.groupIds.includes(groupId))),
      500
    );
  });
}

export function addSession(
  session: Omit<LessonSession, 'id'>
): Promise<LessonSession> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSession: LessonSession = {
        ...session,
        id: generateId(),
      };
      sessions.push(newSession);
      resolve(newSession);
    }, 500);
  });
}

export function updateSession(
  id: string,
  updated: Omit<LessonSession, 'id'>
): Promise<LessonSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = sessions.some((s) => s.id === id);
      if (!exists) {
        reject(new Error('جلسه یافت نشد'));
        return;
      }
      sessions = sessions.map((s) => (s.id === id ? { ...updated, id } : s));
      resolve({ ...updated, id });
    }, 500);
  });
}

export function deleteSession(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = sessions.some((s) => s.id === id);
      if (!exists) {
        reject(new Error('جلسه یافت نشد'));
        return;
      }
      sessions = sessions.filter((s) => s.id !== id);
      resolve();
    }, 500);
  });
}
