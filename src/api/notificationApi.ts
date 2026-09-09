import { generateId } from '../utils/generateId';
import type { Role } from './authApi';

export type NotificationIcon = 'info' | 'people' | 'award';

export type Notification = {
  id: string;
  // اگه userId ست بشه، فقط برای همون یه کاربر خاصه (مثلاً «به گروه X اضافه
  // شدی»). اگه نه، بر اساس targetRoles برای همه‌ی کاربرهای اون نقش‌هاست
  // (مثلاً یه اطلاع‌رسانی عمومی به همه‌ی دانشجوها)
  userId?: string;
  targetRoles?: Role[];
  title: string;
  createdAt: string; // ISO timestamp
  read: boolean;
  icon: NotificationIcon;
};

const STORAGE_KEY = 'notifications';
// همون کلیدی که useNotificationsEnabled.ts استفاده می‌کنه - از همینجا هم
// می‌خونیمش تا وقتی کاربر «دریافت اعلان» رو خاموش کرده، اعلان تازه‌ای
// ساخته نشه (تاریخچه‌ی قبلی دست‌نخورده می‌مونه، فقط جدید اضافه نمی‌شه)
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

function seedNotifications(): Notification[] {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  return [
    {
      id: 'seed-1',
      targetRoles: ['Student'],
      title: 'آزمون «مبانی ری‌اکت» فردا شروع می‌شود',
      createdAt: new Date(now - 2 * HOUR).toISOString(),
      read: false,
      icon: 'info',
    },
    {
      id: 'seed-2',
      targetRoles: ['Instructor', 'SuperAdmin'],
      title: '۵ دانشجوی جدید در سامانه ثبت‌نام کردند',
      createdAt: new Date(now - DAY).toISOString(),
      read: false,
      icon: 'people',
    },
    {
      id: 'seed-3',
      targetRoles: ['Student'],
      title: 'نتایج آزمون «مبانی پایگاه داده» آماده شد',
      createdAt: new Date(now - 2 * DAY).toISOString(),
      read: false,
      icon: 'award',
    },
  ];
}

function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? (JSON.parse(stored) as Notification[])
      : seedNotifications();
  } catch {
    return seedNotifications();
  }
}

let notifications: Notification[] = loadNotifications();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function isReceivingEnabled(): boolean {
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false';
}

// هسته‌ی ساخت اعلان جدید - همه‌ی generator های پایین از همین رد می‌شن.
// اگه کاربر «دریافت اعلان» رو خاموش کرده باشه، هیچی ساخته نمی‌شه (ولی
// اعلان‌های قبلی که از قبل تو تاریخچه بودن دست‌نخورده می‌مونن)
function pushNotification(
  input: Omit<Notification, 'id' | 'createdAt' | 'read'>
): void {
  if (!isReceivingEnabled()) return;

  notifications = [
    {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
      read: false,
    },
    ...notifications,
  ];
  persist();
}

export function getNotificationsForUser(
  userId: string,
  role: Role
): Promise<Notification[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const visible = notifications.filter(
        (n) =>
          (n.userId && n.userId === userId) ||
          (!n.userId && n.targetRoles?.includes(role))
      );
      const sorted = [...visible].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      resolve(sorted);
    }, 250);
  });
}

export function markNotificationRead(id: string): void {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  persist();
}

// فقط اعلان‌هایی که آی‌دیشون داده شده رو خونده‌شده علامت می‌زنه - چون
// خودِ notifications ممکنه شامل اعلان‌های کاربرهای دیگه هم باشه، این‌جوری
// «خواندن همه» یه کاربر رو محدود به اعلان‌های خودش نگه می‌داریم
export function markAllNotificationsRead(ids: string[]): void {
  const idSet = new Set(ids);
  notifications = notifications.map((n) =>
    idSet.has(n.id) ? { ...n, read: true } : n
  );
  persist();
}

// --- Generator ها: هرجای واقعی اپ که یه رویداد مرتبط رخ می‌ده، از همینا
// صدا زده می‌شن (نه این‌که یه‌جا هاردکد باشن) ---

export function notifyStudentAddedToGroup(
  studentId: string,
  groupName: string
): void {
  pushNotification({
    userId: studentId,
    title: `به گروه «${groupName}» اضافه شدی`,
    icon: 'people',
  });
}

export function notifyInstructorOfAttempt(
  instructorId: string,
  studentName: string,
  examTitle: string,
  correctCount: number,
  totalQuestions: number
): void {
  pushNotification({
    userId: instructorId,
    title: `${studentName} آزمون «${examTitle}» رو با نمره‌ی ${correctCount} از ${totalQuestions} تموم کرد`,
    icon: 'award',
  });
}
