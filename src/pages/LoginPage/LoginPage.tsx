import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/LoginForm/LoginForm';
import Logo from '../../components/Logo/Logo';
import useTheme from '../../hooks/useTheme';
import { Sun, Moon, ArrowRight } from 'lucide-react';

function LoginPage() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-linear-to-br from-brand-50 via-white to-brand-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 transition-colors">
      {/* بلاب‌های محو برای عمق بیشتر پس‌زمینه */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-600/20" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-600/10" />

      <button
        onClick={toggleTheme}
        className="fixed top-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition duration-300 hover:rotate-45 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="mx-auto mb-6 flex justify-center cursor-pointer"
        >
          <Logo size="lg" showText={false} />
        </button>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-brand-100 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
            سامانه آزمون آنلاین
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-400 text-center mt-1 mb-6">
            برای ادامه وارد حساب خود شوید
          </p>
          <LoginForm />

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
            حساب نداری؟{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-bold text-brand-600 hover:underline dark:text-brand-400"
            >
              ثبت‌نام رایگان
            </button>
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="group mx-auto mt-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-white cursor-pointer"
        >
          <ArrowRight
            size={15}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          بازگشت به صفحه اصلی
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          © ۱۴۰۵ سامانه آزمون آنلاین
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
