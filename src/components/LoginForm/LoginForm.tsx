import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import TextBox from '../TextBox/TextBox';
import Captcha from '../Captcha/Captcha';
import { loginAsMockUser } from '../../api/authApi';

function LoginForm() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [captchaValid, setCaptchaValid] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (!username || !password) {
      setError('لطفاً همه فیلدها را پر کنید');
      return;
    }

    if (!captchaValid) {
      setError('لطفاً حاصل چالش امنیتی را درست وارد کنید');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // شبیه‌سازی تأخیر شبکه (چون دیگه fakeLogin رو صدا نمی‌زنیم)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const user = loginAsMockUser(username);

      if (user) {
        navigate('/dashboard');
      } else {
        setError('نام کاربری یا رمز عبور اشتباه است');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      {error && (
        <p className="text-danger-600 dark:text-danger-400 text-sm bg-danger-50 dark:bg-danger-950/40 border border-danger-100 dark:border-danger-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          نام کاربری
        </label>
        <TextBox
          type="text"
          placeholder="admin یا instructor1 یا student1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          رمز عبور
        </label>
        <TextBox
          type="password"
          placeholder="هر مقداری"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Captcha onChange={setCaptchaValid} />

      <Button type="submit" disabled={loading || !captchaValid}>
        {loading ? 'در حال ورود...' : 'ورود'}
      </Button>
    </form>
  );
}

export default LoginForm;
