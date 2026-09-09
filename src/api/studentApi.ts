import { generateId } from '../utils/generateId';

export type Student = {
  id: string;
  name: string;
  email?: string; // دانشجویی که خودش با کد عضویت ثبت‌نام کرده فعلاً ایمیل نداره
  username: string; // همون نام کاربری‌ای که با اون وارد سامانه می‌شه
};

let students: Student[] = [
  {
    id: '1',
    name: 'علی رضایی',
    email: 'ali@example.com',
    username: 'ali.rezaei',
  },
  {
    id: '2',
    name: 'سارا احمدی',
    email: 'sara@example.com',
    username: 'sara.ahmadi',
  },
  {
    id: 'student-demo',
    name: 'دانشجوی دمو',
    username: 'student1',
  },
];

export function getStudents(): Promise<Student[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...students]), 500);
  });
}

export function addStudent(student: Omit<Student, 'id'>): Promise<Student> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newStudent: Student = { ...student, id: generateId() };
      students.push(newStudent);
      resolve(newStudent);
    }, 500);
  });
}

// برخلاف addStudent (که خودش id می‌سازه)، اینجا id از بیرون داده می‌شه.
// فقط از مسیر ثبت‌نام با کد عضویت (authApi.ts) صدا زده می‌شه، چون اونجا
// باید id دانشجو دقیقاً همون id حساب کاربریش باشه
export function addStudentWithId(student: Student): Promise<Student> {
  return new Promise((resolve) => {
    setTimeout(() => {
      students.push(student);
      resolve(student);
    }, 500);
  });
}

export function updateStudent(
  id: string,
  updated: Omit<Student, 'id'>
): Promise<Student> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = students.some((s) => s.id === id);
      if (!exists) {
        reject(new Error('دانشجو یافت نشد'));
        return;
      }
      students = students.map((s) => (s.id === id ? { ...updated, id } : s));
      resolve({ ...updated, id });
    }, 500);
  });
}

export function deleteStudent(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = students.some((s) => s.id === id);
      if (!exists) {
        reject(new Error('دانشجو یافت نشد'));
        return;
      }
      students = students.filter((s) => s.id !== id);
      resolve();
    }, 500);
  });
}
