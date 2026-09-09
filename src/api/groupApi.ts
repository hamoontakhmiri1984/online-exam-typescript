import type { Category } from '../constants/categories';
import { generateId } from '../utils/generateId';
import { notifyStudentAddedToGroup } from './notificationApi';

export type Group = {
  id: string;
  name: string;
  category: Category; // فقط یه برچسب موضوعی برای دسته‌بندی/فیلتر، نه ابزار دسترسی
  instructorId: string; // مدرسی که این گروه رو ساخته و مالکشه
  studentIds: string[]; // دانشجوهای عضو این گروه
  joinCode: string; // کد عضویت - دانشجو با این کد از صفحه‌ی ثبت‌نام مستقیم عضو این گروه می‌شه
};

const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون حروف/عدد شبیه‌به‌هم (O/0, I/1)

// کد ۶ کاراکتری یکتا می‌سازه؛ اگه به‌ندرت با یه کد موجود برخورد کرد دوباره می‌سازه
function generateJoinCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () =>
      JOIN_CODE_CHARS.charAt(Math.floor(Math.random() * JOIN_CODE_CHARS.length))
    ).join('');
  } while (groups.some((g) => g.joinCode === code));
  return code;
}

let groups: Group[] = [
  {
    id: 'g1',
    name: 'کلاس ریاضی - ترم پاییز',
    category: 'ریاضی',
    instructorId: 'instructor-1',
    studentIds: ['1', 'student-demo'],
    joinCode: 'MATH01',
  },
  {
    id: 'g2',
    name: 'کلاس فیزیک - ترم پاییز',
    category: 'فیزیک',
    instructorId: 'instructor-1',
    studentIds: ['2'],
    joinCode: 'PHYS01',
  },
];

export function getGroups(): Promise<Group[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...groups]), 400);
  });
}

export function getGroupById(id: string): Promise<Group | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(groups.find((g) => g.id === id)), 300);
  });
}

export function getGroupsByInstructor(instructorId: string): Promise<Group[]> {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(groups.filter((g) => g.instructorId === instructorId)),
      400
    );
  });
}

export function getGroupsByStudent(studentId: string): Promise<Group[]> {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(groups.filter((g) => g.studentIds.includes(studentId))),
      400
    );
  });
}

// موقع ساخت گروه، joinCode توسط خود سیستم تولید می‌شه - نه چیزی که فرم بگیره
export function addGroup(
  group: Omit<Group, 'id' | 'joinCode'>
): Promise<Group> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newGroup: Group = {
        ...group,
        id: generateId(),
        joinCode: generateJoinCode(),
      };
      groups.push(newGroup);
      resolve(newGroup);
    }, 400);
  });
}

// ویرایش گروه (اسم/دسته‌بندی) joinCode رو دست نمی‌زنه - برای عوض کردنش
// regenerateJoinCode جداست تا با ویرایش معمولی گروه قاطی نشه
export function updateGroup(
  id: string,
  updated: Omit<Group, 'id' | 'joinCode'>
): Promise<Group> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = groups.find((g) => g.id === id);
      if (!existing) {
        reject(new Error('گروه یافت نشد'));
        return;
      }
      const result: Group = { ...updated, id, joinCode: existing.joinCode };
      groups = groups.map((g) => (g.id === id ? result : g));
      resolve(result);
    }, 400);
  });
}

// ثبت‌نام دانشجو با کد عضویت از همینجا صدا زده می‌شه - حروف بزرگ/کوچک و
// فاصله‌ی اضافه مهم نیست
export function getGroupByJoinCode(code: string): Promise<Group | undefined> {
  const normalized = code.trim().toUpperCase();
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(groups.find((g) => g.joinCode === normalized)),
      300
    );
  });
}

// از صفحه‌ی گروه‌ها صدا زده می‌شه - وقتی مدرس بخواد کد قدیمی رو باطل و یه
// کد جدید بسازه (مثلاً اگه فکر کنه کدش لو رفته)
export function regenerateJoinCode(groupId: string): Promise<Group> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = groups.find((g) => g.id === groupId);
      if (!existing) {
        reject(new Error('گروه یافت نشد'));
        return;
      }
      const updated: Group = { ...existing, joinCode: generateJoinCode() };
      groups = groups.map((g) => (g.id === groupId ? updated : g));
      resolve(updated);
    }, 300);
  });
}

// عضو کردن یه دانشجو به گروه بدون نیاز به فرستادن کل آبجکت گروه - مسیر
// ثبت‌نام با کد عضویت (authApi.ts) از همین استفاده می‌کنه. اگه از قبل عضو
// بود دوباره اضافه نمی‌شه (idempotent)
export function addStudentToGroup(
  groupId: string,
  studentId: string
): Promise<Group> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = groups.find((g) => g.id === groupId);
      if (!existing) {
        reject(new Error('گروه یافت نشد'));
        return;
      }
      const alreadyMember = existing.studentIds.includes(studentId);
      const updated: Group = alreadyMember
        ? existing
        : { ...existing, studentIds: [...existing.studentIds, studentId] };
      groups = groups.map((g) => (g.id === groupId ? updated : g));

      // فقط وقتی واقعاً یه عضویت تازه اتفاق افتاده اطلاع بده، نه هربار که
      // این تابع (idempotent) صدا زده می‌شه
      if (!alreadyMember) {
        notifyStudentAddedToGroup(studentId, existing.name);
      }

      resolve(updated);
    }, 300);
  });
}

export function deleteGroup(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = groups.some((g) => g.id === id);
      if (!exists) {
        reject(new Error('گروه یافت نشد'));
        return;
      }
      groups = groups.filter((g) => g.id !== id);
      resolve();
    }, 400);
  });
}

// وقتی یه دانشجو حذف می‌شه، باید از تمام گروه‌هایی که توشون عضوه هم پاک بشه
// وگرنه یه آی‌دی یتیم تو studentIds باقی می‌مونه
export function removeStudentFromAllGroups(studentId: string): void {
  groups = groups.map((g) => ({
    ...g,
    studentIds: g.studentIds.filter((id) => id !== studentId),
  }));
}
