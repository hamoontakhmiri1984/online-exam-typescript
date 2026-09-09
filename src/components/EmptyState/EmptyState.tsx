import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

// یه قالب یکسان برای همه‌ی صفحاتی که وقتی لیست خالیه، به‌جای یه جدول/گرید
// خالی و بی‌روح، یه پیام راهنمای واضح + CTA نشون بدن
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-14 text-center shadow-sm dark:bg-gray-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400">
        <Icon size={22} />
      </div>
      <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-gray-400 dark:text-gray-500">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
