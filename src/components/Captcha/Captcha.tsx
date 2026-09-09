import { useState } from 'react';
import { RotateCw } from 'lucide-react';

type CaptchaProps = {
  // هر بار پاسخ کاربر عوض بشه یا چالش جدید ساخته بشه صدا زده می‌شه، تا فرم
  // والد بدونه اجازه‌ی ادامه هست یا نه
  onChange: (isValid: boolean) => void;
};

function generateChallenge() {
  const a = Math.floor(Math.random() * 8) + 1; // ۱ تا ۸
  const b = Math.floor(Math.random() * 8) + 1;
  // تفریق رو طوری می‌سازیم که همیشه مثبت بمونه (بزرگ‌تر منهای کوچیک‌تر)
  const isAddition = Math.random() > 0.5;
  const answer = isAddition ? a + b : Math.max(a, b) - Math.min(a, b);
  const label = isAddition
    ? `${a} + ${b}`
    : `${Math.max(a, b)} - ${Math.min(a, b)}`;
  return { label, answer };
}

// چالش ریاضی ساده به‌جای reCAPTCHA - چون سیستم فعلاً بک‌اند واقعی نداره و
// reCAPTCHA به یه site key واقعی + تایید سمت سرور نیاز داره. وقتی بک‌اند
// اومد، همینجا جایگزین می‌شه (کامپوننت جدا نگه داشته شده دقیقاً برای همین)
function Captcha({ onChange }: CaptchaProps) {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [value, setValue] = useState('');

  function handleChange(raw: string) {
    setValue(raw);
    onChange(raw.trim() !== '' && Number(raw) === challenge.answer);
  }

  function refresh() {
    setChallenge(generateChallenge());
    setValue('');
    onChange(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 dark:text-gray-300">
        سوال امنیتی: حاصل عبارت زیر رو وارد کن
      </label>
      <div dir="ltr" className="flex items-center gap-2">
        <div className="flex h-11 min-w-[84px] items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 px-4 text-sm font-bold tracking-wide text-gray-700 dark:text-gray-200 select-none">
          {`${challenge.label} =`}
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="?"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-20 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-900 transition"
        />
        <button
          type="button"
          onClick={refresh}
          title="چالش جدید"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <RotateCw size={16} />
        </button>
      </div>
    </div>
  );
}

export default Captcha;
