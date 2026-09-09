import type { PlanId } from '../constants/plans';
import { getPlan } from '../constants/plans';
import { getGroupsByInstructor } from './groupApi';
import { getExams } from './examApi';
import { getQuestionsByExamId } from './questionApi';

export type Subscription = {
  instructorId: string;
  planId: PlanId;
  startDate: string;
  endDate: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

let subscriptions: Subscription[] = [
  {
    instructorId: 'instructor-1',
    planId: 'free',
    startDate: new Date().toISOString(),
    endDate: null,
  },
];

function computeEndDate(planId: PlanId, from: Date): string | null {
  const plan = getPlan(planId);
  if (plan.durationDays === null) return null;
  return new Date(from.getTime() + plan.durationDays * DAY_MS).toISOString();
}

export function getSubscription(instructorId: string): Promise<Subscription> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = subscriptions.find(
        (s) => s.instructorId === instructorId
      );
      if (existing) {
        resolve(existing);
        return;
      }
      const fresh: Subscription = {
        instructorId,
        planId: 'free',
        startDate: new Date().toISOString(),
        endDate: null,
      };
      subscriptions = [...subscriptions, fresh];
      resolve(fresh);
    }, 300);
  });
}

export function getAllSubscriptions(): Promise<Subscription[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...subscriptions]), 400);
  });
}

export function selectPlan(
  instructorId: string,
  planId: PlanId
): Promise<Subscription> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const updated: Subscription = {
        instructorId,
        planId,
        startDate: now.toISOString(),
        endDate: computeEndDate(planId, now),
      };
      subscriptions = [
        ...subscriptions.filter((s) => s.instructorId !== instructorId),
        updated,
      ];
      resolve(updated);
    }, 400);
  });
}

export function renewSubscription(instructorId: string): Promise<Subscription> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = subscriptions.find(
        (s) => s.instructorId === instructorId
      );
      if (!current) {
        reject(new Error('اشتراکی برای این مدرس یافت نشد'));
        return;
      }
      const now = new Date();
      const updated: Subscription = {
        ...current,
        startDate: now.toISOString(),
        endDate: computeEndDate(current.planId, now),
      };
      subscriptions = subscriptions.map((s) =>
        s.instructorId === instructorId ? updated : s
      );
      resolve(updated);
    }, 400);
  });
}

export function assignSubscription(
  instructorId: string,
  planId: PlanId
): Promise<Subscription> {
  return selectPlan(instructorId, planId);
}

export function isSubscriptionExpired(sub: Subscription): boolean {
  if (!sub.endDate) return false;
  return new Date(sub.endDate).getTime() < Date.now();
}

export function getRemainingDays(sub: Subscription): number | null {
  if (!sub.endDate) return null;
  const diff = new Date(sub.endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / DAY_MS));
}

export type UsageSummary = {
  groups: number;
  activeExams: number;
  questions: number;
};

export async function getInstructorUsage(
  instructorId: string
): Promise<UsageSummary> {
  const instructorGroups = await getGroupsByInstructor(instructorId);
  const groupIds = instructorGroups.map((g) => g.id);

  const allExams = await getExams();
  const instructorExams = allExams.filter((exam) =>
    exam.groupIds.some((gid) => groupIds.includes(gid))
  );
  const activeExams = instructorExams.filter((e) => e.status === 'upcoming');

  const questionLists = await Promise.all(
    instructorExams.map((exam) => getQuestionsByExamId(exam.id))
  );
  const questions = questionLists.reduce((sum, list) => sum + list.length, 0);

  return {
    groups: instructorGroups.length,
    activeExams: activeExams.length,
    questions,
  };
}

export type LimitCheck =
  | { allowed: true }
  | { allowed: false; reason: 'plan_expired' | 'limit_reached' };

export type RemainingQuota =
  | { limited: false }
  | {
      limited: true;
      expired: boolean;
      limit: number;
      used: number;
      remaining: number;
    };

// هسته‌ی مشترک همه‌ی چک‌های محدودیت پلن - ظرفیت دقیق (سقف/مصرف‌شده/باقی‌مونده)
// رو برمی‌گردونه، هم برای چک ساده‌ی «اجازه هست یا نه» کافیه، هم برای جاهایی
// مثل ایمپورت اکسل یا پیام‌های دقیق که به عدد واقعی نیاز دارن
async function getRemainingQuota(
  instructorId: string,
  getLimit: (planId: PlanId) => number | null,
  getUsed: (usage: UsageSummary) => number
): Promise<RemainingQuota> {
  const sub = await getSubscription(instructorId);
  const limit = getLimit(sub.planId);
  if (limit === null) return { limited: false };

  const usage = await getInstructorUsage(instructorId);
  const used = getUsed(usage);
  const expired = isSubscriptionExpired(sub);

  return {
    limited: true,
    expired,
    limit,
    used,
    remaining: expired ? 0 : Math.max(0, limit - used),
  };
}

async function checkLimit(
  instructorId: string,
  getLimit: (planId: PlanId) => number | null,
  getUsed: (usage: UsageSummary) => number
): Promise<LimitCheck> {
  const quota = await getRemainingQuota(instructorId, getLimit, getUsed);
  if (!quota.limited) return { allowed: true };
  if (quota.expired) return { allowed: false, reason: 'plan_expired' };
  return quota.remaining > 0
    ? { allowed: true }
    : { allowed: false, reason: 'limit_reached' };
}

export function canCreateGroup(instructorId: string): Promise<LimitCheck> {
  return checkLimit(
    instructorId,
    (planId) => getPlan(planId).maxGroups,
    (usage) => usage.groups
  );
}

export function canActivateExam(instructorId: string): Promise<LimitCheck> {
  return checkLimit(
    instructorId,
    (planId) => getPlan(planId).maxActiveExams,
    (usage) => usage.activeExams
  );
}

export function canAddQuestion(instructorId: string): Promise<LimitCheck> {
  return checkLimit(
    instructorId,
    (planId) => getPlan(planId).maxQuestions,
    (usage) => usage.questions
  );
}

export function getRemainingGroupQuota(
  instructorId: string
): Promise<RemainingQuota> {
  return getRemainingQuota(
    instructorId,
    (planId) => getPlan(planId).maxGroups,
    (usage) => usage.groups
  );
}

export function getRemainingActiveExamQuota(
  instructorId: string
): Promise<RemainingQuota> {
  return getRemainingQuota(
    instructorId,
    (planId) => getPlan(planId).maxActiveExams,
    (usage) => usage.activeExams
  );
}

export function getRemainingQuestionQuota(
  instructorId: string
): Promise<RemainingQuota> {
  return getRemainingQuota(
    instructorId,
    (planId) => getPlan(planId).maxQuestions,
    (usage) => usage.questions
  );
}
