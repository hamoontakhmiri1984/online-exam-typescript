import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import TextBox from '../TextBox/TextBox';
import Captcha from '../Captcha/Captcha';
import { registerMockUser } from '../../api/authApi';

function SignupForm() {
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [captchaValid, setCaptchaValid] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();

    if (!fullName || !username || !password || !confirmPassword) {
      setError('لطفاً همه فیلدها را پر کنید');
      return;
    }

    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    if (!captchaValid) {
      setError('پاسخ چالش امنیتی درست نیست');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await registerMockUser(
        fullName,
        username,
        joinCode || undefined
      );

      if (result.status === 'username_taken') {
        setError('این نام کاربری قبلاً ثبت شده است');
        return;
      }

      if (result.status === 'invalid_join_code') {
        setError('کد عضویت وارد شده معتبر نیست - از مدرست بگیر یا خالی بذارش');
        return;
      }

      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4">
      {error && (
        <p className="text-danger-600 dark:text-danger-400 text-sm bg-danger-50 dark:bg-danger-950/40 border border-danger-100 dark:border-danger-900 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          نام و نام خانوادگی
        </label>
        <TextBox
          type="text"
          placeholder="مثلاً علی رضایی"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          نام کاربری
        </label>
        <TextBox
          type="text"
          placeholder="یه نام کاربری دلخواه"
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
          placeholder="حداقل ۶ کاراکتر"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          تکرار رمز عبور
        </label>
        <TextBox
          type="password"
          placeholder="دوباره وارد کن"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-300">
          کد عضویت گروه (اختیاری)
        </label>
        <TextBox
          type="text"
          placeholder="اگه مدرست بهت کد داده، اینجا وارد کن"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
        />
        <p className="text-xs text-gray-400">
          بدون کد هم می‌تونی ثبت‌نام کنی، بعداً از تنظیمات می‌تونی به گروه
          بپیوندی
        </p>
      </div>

      <Captcha onChange={setCaptchaValid} />

      <Button type="submit" disabled={loading || !captchaValid}>
        {loading ? 'در حال ساخت حساب...' : 'ساخت حساب رایگان'}
      </Button>
    </form>
  );
}

export default SignupForm;
