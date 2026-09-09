import { useState } from 'react';
import {
  Check,
  Crown,
  AlertTriangle,
  Layers,
  FileQuestion,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import Spinner from '../../components/Spinner/Spinner';
import Toast from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import { getCurrentUser } from '../../api/authApi';
import { selectPlan, renewSubscription } from '../../api/subscriptionApi';
import {
  PLAN_ORDER,
  PLANS,
  type PlanId,
  type Plan,
} from '../../constants/plans';
import useSubscription from '../../hooks/useSubscription';

const VARIANT_STYLES: Record<PlanId, string> = {
  free: 'bg-white border border-gray-100 dark:bg-gray-900 dark:border-gray-800',
  gold: 'bg-white border border-accent-500/30 dark:bg-gray-900 dark:border-accent-500/30',
  platinum:
    'bg-white border-2 border-brand-600 shadow-xl shadow-brand-600/10 lg:-translate-y-3 dark:bg-gray-900',
  vip: 'bg-gray-900 border border-gray-800 text-white',
};

function formatLimit(value: number | null): string {
  return value === null ? 'نامحدود' : value.toLocaleString('fa-IR');
}

function UsageRow({
  icon: Icon,
  label,
  used,
  limit,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  limit: number | null;
}) {
  const percent =
    limit === null ? 0 : Math.min(100, (used / Math.max(limit, 1)) * 100);
  const isNearLimit = limit !== null && used >= limit;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <Icon size={14} />
          {label}
        </span>
        <span
          className={`font-medium ${
            isNearLimit
              ? 'text-danger-600 dark:text-danger-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {used.toLocaleString('fa-IR')} / {formatLimit(limit)}
        </span>
      </div>
      {limit !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-danger-500' : 'bg-brand-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PlansPage() {
  const currentUser = getCurrentUser();
  const {
    loading,
    subscription,
    plan,
    usage,
    remainingDays,
    isExpired,
    refresh,
  } = useSubscription();

  const [pendingPlanId, setPendingPlanId] = useState<PlanId | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'danger';
  } | null>(null);

  const currentIndex = subscription
    ? PLAN_ORDER.indexOf(subscription.planId)
    : -1;
  const pendingPlan = pendingPlanId ? PLANS[pendingPlanId] : null;

  async function handleRenew() {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await renewSubscription(currentUser.id);
      setToast({ message: 'اشتراک با موفقیت تمدید شد', tone: 'success' });
      refresh();
    } catch {
      setToast({ message: 'تمدید اشتراک با خطا مواجه شد', tone: 'danger' });
    } finally {
      setActionLoading(false);
    }
  }

  function handleCardClick(planId: PlanId) {
    if (subscription && planId === subscription.planId) {
      if (isExpired) handleRenew();
      return;
    }
    setPendingPlanId(planId);
  }

  async function confirmPlanChange() {
    if (!currentUser || !pendingPlanId) return;
    setActionLoading(true);
    try {
      await selectPlan(currentUser.id, pendingPlanId);
      setToast({
        message: `پلن با موفقیت به «${PLANS[pendingPlanId].name}» تغییر کرد`,
        tone: 'success',
      });
      refresh();
    } catch {
      setToast({ message: 'تغییر پلن با خطا مواجه شد', tone: 'danger' });
    } finally {
      setActionLoading(false);
      setPendingPlanId(null);
    }
  }

  function buttonLabel(planId: PlanId, index: number): string {
    if (subscription && planId === subscription.planId) {
      return isExpired ? 'تمدید' : 'پلن فعلی';
    }
    if (currentIndex === -1) return 'انتخاب پلن';
    return index > currentIndex ? 'ارتقا' : 'تغییر به این پلن';
  }

  return (
    <AppLayout title="پکیج من">
      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      )}

      <Modal isOpen={!!pendingPlan} onClose={() => setPendingPlanId(null)}>
        {pendingPlan && (
          <div className="text-center">
            <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
              تغییر به پلن «{pendingPlan.name}»
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              {pendingPlan.price === 0
                ? 'یه دوره‌ی جدید از همین الان با پلن رایگان شروع می‌شه.'
                : `یه دوره‌ی ${pendingPlan.durationDays} روزه به قیمت ${pendingPlan.priceLabel} تومان از همین الان شروع می‌شه.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingPlanId(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                انصراف
              </button>
              <button
                onClick={confirmPlanChange}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {actionLoading ? 'در حال ثبت...' : 'تایید'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        پکیج من
      </h1>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {subscription && plan && usage && (
            <div className="mb-8 max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                    <Crown size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">پلن فعلی</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </p>
                  </div>
                </div>

                {remainingDays === null ? (
                  <span className="rounded-full bg-success-500/10 px-3 py-1 text-xs font-semibold text-success-600 dark:text-success-500">
                    بدون تاریخ انقضا
                  </span>
                ) : isExpired ? (
                  <span className="rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold text-danger-600 dark:bg-danger-950/40 dark:text-danger-400">
                    منقضی شده
                  </span>
                ) : (
                  <span className="rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600 dark:text-accent-500">
                    {remainingDays.toLocaleString('fa-IR')} روز باقی‌مانده
                  </span>
                )}
              </div>

              {isExpired && (
                <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-danger-50 px-4 py-3 text-xs text-danger-700 dark:bg-danger-950/30 dark:text-danger-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    اشتراکت منقضی شده. تا وقتی تمدید نکنی امکاناتی که به سقف پلن
                    رایگان محدودن رو نمی‌تونی افزایش بدی.
                  </span>
                  <button
                    onClick={handleRenew}
                    disabled={actionLoading}
                    className="shrink-0 rounded-lg bg-danger-600 px-3 py-1.5 font-bold text-white transition hover:bg-danger-700 disabled:opacity-60"
                  >
                    تمدید
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <UsageRow
                  icon={FileQuestion}
                  label="بانک سوال"
                  used={usage.questions}
                  limit={plan.maxQuestions}
                />
                <UsageRow
                  icon={PlayCircle}
                  label="آزمون فعال هم‌زمان"
                  used={usage.activeExams}
                  limit={plan.maxActiveExams}
                />
                <UsageRow
                  icon={Layers}
                  label="گروه"
                  used={usage.groups}
                  limit={plan.maxGroups}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((planId, index) => {
              const p: Plan = PLANS[planId];
              const isDark = planId === 'vip';
              const isHighlighted = planId === 'platinum';
              const isCurrent = subscription?.planId === planId;
              const isCurrentActive = isCurrent && !isExpired;

              return (
                <div
                  key={planId}
                  className={`relative flex flex-col rounded-2xl p-6 transition duration-300 ${
                    isCurrentActive ? '' : 'hover:-translate-y-1'
                  } ${VARIANT_STYLES[planId]}`}
                >
                  {isHighlighted && !isCurrent && (
                    <span className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      پیشنهاد محبوب
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-success-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      پلن فعلی تو
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {isDark && <Crown size={18} className="text-accent-400" />}
                    <h3
                      className={`text-base font-bold ${
                        isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span
                      className={`text-3xl font-extrabold ${
                        isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {p.priceLabel}
                    </span>
                    <span
                      className={`text-xs ${
                        isDark
                          ? 'text-gray-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {p.durationDays === null ? 'همیشه رایگان' : 'تومان / ماه'}
                    </span>
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {p.features.map((feature) => (
                      <li
                        key={feature}
                        className={`flex items-start gap-2 text-xs leading-6 ${
                          isDark
                            ? 'text-gray-300'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Check
                          size={15}
                          className={`mt-0.5 shrink-0 ${
                            isDark ? 'text-success-500' : 'text-success-600'
                          }`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCardClick(planId)}
                    disabled={isCurrentActive || actionLoading}
                    className={`mt-7 w-full rounded-xl px-4 py-2.5 text-sm font-bold transition duration-300 disabled:cursor-not-allowed ${
                      isCurrentActive
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        : isDark
                        ? 'bg-white text-gray-900 hover:shadow-lg hover:shadow-white/10'
                        : isHighlighted
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/40'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {buttonLabel(planId, index)}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
}

export default PlansPage;
