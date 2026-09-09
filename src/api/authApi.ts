import { generateId } from '../utils/generateId';
import { getGroupByJoinCode, addStudentToGroup } from './groupApi';
import { addStudentWithId } from './studentApi';

export type Role = 'SuperAdmin' | 'Instructor' | 'Student';

export type User = {
  id: string;
  username: string;
  role: Role;
  name?: string; // نام نمایشی - تو صفحه‌ی تنظیمات قابل ویرایشه
};

// نکته‌ی مهم: برای Studentها، id همیشه باید دقیقاً همون Student.id (تو
// studentApi.ts) باشه - چون Group.studentIds بر همین اساس عضویت رو تشخیص
// می‌ده. برای همین آی‌دی این دو نفر رو با آی‌دیشون تو studentApi.ts یکی
// نگه داشتیم ('1' و '2'، نه چیز دیگه‌ای)
const SEED_USERS: Record<string, User> = {
  admin: {
    id: 'admin-1',
    username: 'admin',
    role: 'SuperAdmin',
  },
  instructor1: {
    id: 'instructor-1',
    username: 'instructor1',
    role: 'Instructor',
  },
  // دانشجوی نمونه‌ی صرفاً تستی - رکورد متناظری تو studentApi.ts نداره،
  // پس عضو هیچ گروهی نیست و چیزی نمی‌بینه (طبیعیه، فقط برای تست ورود بود)
  student1: {
    id: 'student-demo',
    username: 'student1',
    role: 'Student',
  },
  'ali.rezaei': {
    id: '1',
    username: 'ali.rezaei',
    role: 'Student',
  },
  'sara.ahmadi': {
    id: '2',
    username: 'sara.ahmadi',
    role: 'Student',
  },
};

const MOCK_USERS_STORAGE_KEY = 'mockUsers';

// کاربرهایی که با ثبت‌نام یا اضافه‌کردن دانشجو ساخته می‌شن رو تو localStorage
// هم ذخیره می‌کنیم، وگرنه با هر رفرش صفحه فقط همون کاربرهای اولیه باقی می‌مونن
function loadMockUsers(): Record<string, User> {
  try {
    const stored = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    return stored
      ? { ...SEED_USERS, ...JSON.parse(stored) }
      : { ...SEED_USERS };
  } catch {
    return { ...SEED_USERS };
  }
}

let mockUsers: Record<string, User> = loadMockUsers();

function persistMockUsers() {
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
}

export function getCurrentUser(): User | null {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
}

export function loginAsMockUser(username: string): User | null {
  const user = mockUsers[username];
  if (!user) return null;

  localStorage.setItem('currentUser', JSON.stringify(user));
  return user;
}

export type RegisterOutcome =
  | { status: 'success'; user: User; groupJoined: boolean }
  | { status: 'username_taken' }
  | { status: 'invalid_join_code' };

// ثبت‌نام عمومیه و هیچ تاییدی از سمت مدیر نداره، پس نباید هیچ دسترسی
// مدیریتی بده. کاربر تازه‌ثبت‌نام‌کرده همیشه Student می‌شه.
//
// برخلاف قبل، دیگه مدرس براش username/pass نمی‌سازه - خود دانشجو با کد
// عضویتِ گروه (joinCode، از صفحه‌ی «گروه‌ها» گرفته) ثبت‌نام می‌کنه و اگه کد
// معتبر باشه بلافاصله عضو همون گروه می‌شه. بدون کد هم می‌شه ثبت‌نام کرد
// (حساب ساخته می‌شه ولی عضو هیچ گروهی نیست، بعداً با یه کد معتبر می‌تونه
// عضو بشه - این بخشش تو گام‌های بعدی از صفحه‌ی تنظیمات اضافه می‌شه)
export async function registerMockUser(
  fullName: string,
  username: string,
  joinCode?: string
): Promise<RegisterOutcome> {
  const trimmedUsername = username.trim();
  if (!trimmedUsername || mockUsers[trimmedUsername]) {
    return { status: 'username_taken' };
  }

  const trimmedJoinCode = joinCode?.trim();
  let joinedGroupId: string | null = null;

  // کد عضویت رو قبل از ساخت حساب چک می‌کنیم - اگه کاربر عمداً کد وارد کرده
  // ولی کد اشتباهه، بهتره حساب اصلاً ساخته نشه تا دوباره امتحان کنه، نه
  // این‌که یه حساب یتیمِ بدون گروه براش بمونه
  if (trimmedJoinCode) {
    const group = await getGroupByJoinCode(trimmedJoinCode);
    if (!group) {
      return { status: 'invalid_join_code' };
    }
    joinedGroupId = group.id;
  }

  const id = generateId();

  // یه رکورد تو roster دانشجوها (studentApi.ts) هم می‌سازیم تا تو صفحه‌ی
  // «دانشجویان» مدرس هم دیده بشه - id این رکورد دقیقاً همون id حساب
  // کاربریشه (همون قانونی که بالای فایل توضیح داده شده)
  await addStudentWithId({
    id,
    name: fullName.trim(),
    username: trimmedUsername,
  });

  const newUser: User = {
    id,
    username: trimmedUsername,
    role: 'Student',
    name: fullName.trim(),
  };

  mockUsers = { ...mockUsers, [trimmedUsername]: newUser };
  persistMockUsers();
  localStorage.setItem('currentUser', JSON.stringify(newUser));

  if (joinedGroupId) {
    await addStudentToGroup(joinedGroupId, id);
  }

  return { status: 'success', user: newUser, groupJoined: !!joinedGroupId };
}

// از صفحه‌ی گزارش‌ها (فقط SuperAdmin) صدا زده می‌شه تا لیست مدرس‌ها رو برای
// مدیریت اشتراک نشون بده - رمز و اطلاعات ورود لازم نیست، فقط شناسه/نام
export function getInstructors(): User[] {
  return Object.values(mockUsers).filter((u) => u.role === 'Instructor');
}

export function logout() {
  localStorage.removeItem('currentUser');
}

// از صفحه‌ی تنظیمات صدا زده می‌شه - هم روی کاربر لاگین‌شده‌ی فعلی می‌شینه، هم
// (اگه تو mockUsers باشه) اونجا هم آپدیت می‌شه تا با لاگین دوباره از بین نره
export function updateCurrentUserName(name: string): User | null {
  const current = getCurrentUser();
  if (!current) return null;

  const updated: User = { ...current, name };
  localStorage.setItem('currentUser', JSON.stringify(updated));

  if (mockUsers[current.username]) {
    mockUsers = { ...mockUsers, [current.username]: updated };
    persistMockUsers();
  }

  return updated;
}

// وقتی مدرس یه دانشجو رو تو لیست خودش اضافه/ویرایش می‌کنه، این تابع دسترسی
// ورود اون دانشجو رو می‌سازه یا آپدیت می‌کنه. برخلاف قبل، دیگه category
// نمی‌گیره - چون این‌که دانشجو چی می‌بینه از این به بعد کاملاً به عضویتش تو
// گروه‌ها (Group.studentIds) بستگی داره، نه یه فیلد ثابت روی خودش
export function upsertStudentAccount(id: string, username: string): void {
  const trimmed = username.trim();
  if (!trimmed) return;

  mockUsers = {
    ...mockUsers,
    [trimmed]: {
      id,
      username: trimmed,
      role: 'Student',
    },
  };
  persistMockUsers();
}

// وقتی یه دانشجو حذف می‌شه یا نام کاربریش عوض می‌شه، حساب ورودی قدیمیش هم
// باید پاک بشه - وگرنه یه حساب یتیم می‌مونه که هنوز می‌شه باهاش وارد شد
export function removeUserAccount(username: string): void {
  if (!mockUsers[username]) return;
  const { [username]: _removed, ...rest } = mockUsers;
  mockUsers = rest;
  persistMockUsers();
}
