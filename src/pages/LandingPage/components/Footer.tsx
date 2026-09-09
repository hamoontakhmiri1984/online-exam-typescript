import Logo from '../../../components/Logo/Logo';
import {
  InstagramIcon,
  TelegramIcon,
  LinkedinIcon,
  TwitterXIcon,
  YoutubeIcon,
} from '../../../components/SocialIcons/SocialIcons';

const FOOTER_LINKS = [
  { label: 'ویژگی‌ها', href: '#features' },
  { label: 'اخبار', href: '#news' },
  { label: 'درباره ما', href: '#about' },
  { label: 'تعرفه‌ها', href: '#pricing' },
];

// آدرس واقعی هر پیج رو جایگزین '#' کن. طبق قانون رنگ‌بندی پروژه (فقط
// brand/accent/success/danger)، همه‌ی آیکون‌ها یه هاور یکسان و برند دارن -
// نه رنگ‌های مخصوص هر پلتفرم (که رنگ‌های پیش‌فرض Tailwind رو وارد می‌کرد)
const SOCIAL_LINKS = [
  { label: 'اینستاگرام', href: '#', Icon: InstagramIcon },
  { label: 'تلگرام', href: '#', Icon: TelegramIcon },
  { label: 'لینکدین', href: '#', Icon: LinkedinIcon },
  { label: 'توییتر', href: '#', Icon: TwitterXIcon },
  { label: 'یوتیوب', href: '#', Icon: YoutubeIcon },
];

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-surface-dark">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <Logo />
            <p className="max-w-xs text-center text-xs leading-6 text-gray-500 dark:text-gray-400 sm:text-right">
              سامانه‌ی ساده و حرفه‌ای برای برگزاری آزمون‌های آنلاین، از بانک
              سوال تا اعلام نتیجه.
            </p>

            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-900 dark:hover:bg-brand-950/40 dark:hover:text-brand-400"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © ۱۴۰۵ سامانه آزمون آنلاین. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
