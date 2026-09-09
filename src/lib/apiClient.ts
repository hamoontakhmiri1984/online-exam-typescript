// لایه‌ی مشترک ارتباط با بک‌اند واقعی - هنوز جایی استفاده نمی‌شه (همه‌ی
// api/*.ts فعلاً mock هستن)، ولی از الان آماده‌ست تا روزی که بک‌اند
// (طبق Prompt.md: Node.js + PostgreSQL) وصل شد، فقط بدنه‌ی هر تابع تو
// api/*.ts عوض بشه و به‌جای setTimeout، از همین apiRequest استفاده کنه -
// بدون این‌که امضای تابع‌ها یا کامپوننت‌ها/هوک‌ها دست بخوره.

// آدرس بک‌اند از یه متغیر محیطی Vite خونده می‌شه - تا وقتی .env نداریم،
// یه مقدار پیش‌فرض محلی می‌ذاریم که بعداً به‌راحتی عوض می‌شه
const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:4000/api';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

// تا وقتی authApi.ts واقعی نشده (هنوز فقط User تو localStorage ذخیره
// می‌شه، بدون توکن)، این فقط یه placeholder ـه - روز پیاده‌سازی auth
// واقعی، لاگین باید همین کلید رو با توکن واقعی پر کنه
function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

// خطای یکسان برای همه‌ی خطاهای بک‌اند - به‌جای این‌که هر api/*.ts خودش
// جدا شکل خطای fetch رو تفسیر کنه، همه از همین یک نوع استفاده می‌کنن.
// status رو نگه می‌داریم تا لایه‌های بالاتر (مثلاً هوک‌ها) بتونن رفتار
// متفاوتی برای 401/403/404/... داشته باشن، بدون این‌که به جزئیات fetch
// وابسته بشن
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

// تابع اصلی و تنها نقطه‌ای که واقعاً fetch صدا می‌زنه. هر api/*.ts فقط
// یه wrapper نازک دور همینه، مثلاً:
//   export function getExams() { return apiRequest<Exam[]>('/exams'); }
//   export function addExam(exam) {
//     return apiRequest<Exam>('/exams', { method: 'POST', body: exam });
//   }
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    // خطای شبکه (سرور خاموشه، اینترنت قطعه، و ...) - نه یه خطای معتبر
    // HTTP، پس status صفر می‌ذاریم تا از خطاهای واقعی سرور قابل‌تشخیص باشه
    throw new ApiError(0, 'اتصال به سرور برقرار نشد');
  }

  // پاسخ‌های بدون بدنه (مثل 204 موقع حذف) رو نباید سعی کنیم JSON پارس کنیم
  const hasBody = response.status !== 204;
  const data = hasBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message?: unknown }).message)
        : null) ?? `درخواست با خطا مواجه شد (${response.status})`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
