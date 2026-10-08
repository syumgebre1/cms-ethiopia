import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('am') ? 'am' : 'en';

  const changeLanguage = (lang: 'en' | 'am') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
        <GlobeAltIcon className="w-5 h-5" />
        <span className="hidden md:inline font-medium">
          {currentLang === 'am' ? 'አማርኛ' : 'English'}
        </span>
      </label>

      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box shadow-lg w-40 mt-2 p-2 z-50"
      >
        <li>
          <button
            onClick={() => changeLanguage('en')}
            className={currentLang === 'en' ? 'active' : ''}
          >
            🇬🇧 English
          </button>
        </li>
        <li>
          <button
            onClick={() => changeLanguage('am')}
            className={currentLang === 'am' ? 'active' : ''}
          >
            🇪🇹 አማርኛ
          </button>
        </li>
      </ul>
    </div>
  );
}