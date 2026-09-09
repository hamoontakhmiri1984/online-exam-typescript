import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Info,
  Users as UsersIcon,
  Award,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Layers,
  type LucideIcon,
  CreditCard,
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import useSidebarCollapse from '../../hooks/useSidebarCollapse';
import { useExamGuard } from '../../context/ExamGuardContext';
import { getCurrentUser, logout, type Role } from '../../api/authApi';
import { ALL_ROLES, MANAGEMENT_ROLES } from '../../constants/roles';
import Logo from '../Logo/Logo';
import useNotifications from '../../hooks/useNotifications';
import type { Notification } from '../../api/notificationApi';

const navigationItems: {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}[] = [
  {
    label: 'داشبورد',
    to: '/dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: 'آزمون‌ها',
    to: '/exams',
    icon: FileText,
    roles: ALL_ROLES,
  },
  {
    label: 'دانشجویان',
    to: '/students',
    icon: Users,
    roles: MANAGEMENT_ROLES,
  },
  {
    label: 'گروه‌ها',
    to: '/groups',
    icon: Layers,
    roles: MANAGEMENT_ROLES,
  },
  {
    label: 'درس‌ها',
    to: '/lessons',
    icon: PlayCircle,
    roles: ALL_ROLES,
  },
  {
    label: 'نتایج من',
    to: '/my-results',
    icon: Award,
    roles: ['Student'],
  },
  { label: 'گزارش‌ها', to: '/reports', icon: BarChart3, roles: ['SuperAdmin'] },
  {
    label: 'تنظیمات',
    to: '/settings',
    icon: Settings,
    roles: ALL_ROLES,
  },
  {
    label: 'پکیج من',
    to: '/plans',
    icon: CreditCard,
    roles: ['Instructor'],
  },
];

// نگاشت icon هر اعلان (که از notificationApi.ts فقط به‌صورت یه رشته‌ی ساده
// می‌رسه، چون خود کامپوننت‌های React قابل ذخیره تو localStorage نیستن) به
// آیکون و رنگ واقعیش برای نمایش
const NOTIFICATION_STYLES: Record<
  Notification['icon'],
  { Icon: LucideIcon; iconBg: string }
> = {
  info: {
    Icon: Info,
    iconBg:
      'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400',
  },
  people: {
    Icon: UsersIcon,
    iconBg:
      'bg-accent-500/10 text-accent-600 dark:bg-accent-500/15 dark:text-accent-500',
  },
  award: {
    Icon: Award,
    iconBg:
      'bg-success-500/10 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  },
};

// زمان دقیق ISO رو به یه برچسب نسبی و فارسی تبدیل می‌کنه، برای نمایش زیر
// عنوان هر اعلان
function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (minutes < 1) return 'همین الان';
  if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه پیش`;
  if (hours < 24) return `${hours.toLocaleString('fa-IR')} ساعت پیش`;
  if (days === 1) return 'دیروز';
  return `${days.toLocaleString('fa-IR')} روز پیش`;
}

type AppLayoutProps = {
  children: React.ReactNode;
  title: string;
};

function AppLayout({ children, title }: AppLayoutProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();
  const { guardNavigation } = useExamGuard();
  const user = getCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { notifications, unreadCount, markOneRead, markAllRead } =
    useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleItems = navigationItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  function handleLogout() {
    guardNavigation(() => {
      logout();
      navigate('/login');
    });
  }

  function handleNavClick(event: React.MouseEvent, to: string) {
    event.preventDefault();
    closeSidebar();
    guardNavigation(() => navigate(to));
  }

  function handleLogoClick() {
    closeSidebar();
    guardNavigation(() => navigate('/dashboard'));
  }

  const roleLabel: Record<Role, string> = {
    SuperAdmin: 'مدیر ارشد',
    Instructor: 'مدرس',
    Student: 'دانشجو',
  };

  const initial =
    (user?.name?.trim() || user?.username?.trim())?.[0]?.toUpperCase() ?? '؟';

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* پس‌زمینه‌ی تیره‌ی موبایل، فقط وقتی سایدبار بازه */}
        {isSidebarOpen && (
          <div
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-s border-gray-200 bg-white shadow-2xl transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 md:relative md:z-auto md:translate-x-0 md:border-e md:border-s-0 md:shadow-none ${
            isCollapsed ? 'md:w-20' : 'md:w-64'
          } ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* دکمه‌ی گرد جمع/باز کردن سایدبار — فقط دسکتاپ */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
            className="absolute -left-3.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-md transition-all duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 dark:hover:border-brand-900 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 md:flex"
          >
            {isCollapsed ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          {/* اسکرول فقط همینجا محدود می‌شه، نه کل سایدبار */}
          <div className="flex h-full flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 dark:border-gray-800">
                <button
                  onClick={handleLogoClick}
                  className="flex cursor-pointer items-center"
                >
                  <Logo size="sm" showText={!isCollapsed} />
                </button>
                <button
                  onClick={closeSidebar}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 md:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5 p-3">
                {visibleItems.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={(e) => handleNavClick(e, to)}
                    title={isCollapsed ? label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-white'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                      } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-600 transition-all duration-200 ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <Icon
                          size={18}
                          className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                        />
                        <span className={isCollapsed ? 'md:hidden' : ''}>
                          {label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div
              className={`m-3 flex items-center rounded-xl bg-gray-50 p-3 transition-all duration-300 dark:bg-gray-800/60 ${
                isCollapsed ? 'flex-col gap-2' : 'justify-between'
              }`}
            >
              <div
                className={`flex min-w-0 items-center gap-2.5 ${
                  isCollapsed ? 'flex-col' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm shadow-brand-600/30">
                  {initial}
                </div>
                <div className={`min-w-0 ${isCollapsed ? 'hidden' : ''}`}>
                  <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user ? roleLabel[user.role] : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition duration-200 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-950/40 dark:hover:text-danger-400"
                title="خروج"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        <main
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? 'md:w-[calc(100%-5rem)]' : 'md:w-[calc(100%-16rem)]'
          }`}
        >
          <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
              >
                <Menu size={18} />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition duration-300 hover:rotate-45 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition duration-200 hover:scale-105 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] text-white">
                      {unreadCount.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        اعلان‌ها
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-xs font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
                        >
                          <CheckCheck size={13} />
                          خواندن همه
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                          اعلان جدیدی نداری
                        </p>
                      ) : (
                        notifications.map((n: Notification) => {
                          const { Icon, iconBg } = NOTIFICATION_STYLES[n.icon];
                          return (
                            <button
                              key={n.id}
                              onClick={() => markOneRead(n.id)}
                              className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-right transition last:border-0 hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-gray-800/50 ${
                                n.read
                                  ? ''
                                  : 'bg-brand-50/40 dark:bg-brand-600/5'
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                              >
                                <Icon size={15} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs leading-5 text-gray-700 dark:text-gray-200">
                                  {n.title}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-gray-400">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </span>
                              {!n.read && (
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
