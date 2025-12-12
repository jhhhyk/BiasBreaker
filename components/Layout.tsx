
import React, { useState, useRef, useEffect } from 'react';
import { Scale, Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  language: Language;
  setLanguage: (lang: Language) => void;
  labels: {
    title: string;
    subtitle: string;
    methodology: string;
    liveStatus: string;
    footer: string;
  };
  showHeader?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'zh-CN', name: '简体中文 (Chinese Simplified)' },
  { code: 'zh-TW', name: '繁體中文 (Chinese Traditional)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'id', name: 'Bahasa Indonesia' },
];

const Layout: React.FC<LayoutProps> = ({ children, language, setLanguage, labels, showHeader = true }) => {
  const currentLangName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || language;

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {showHeader && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 serif">{labels.title}</h1>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">{labels.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Custom Language Dropdown */}
               <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 border ${
                      isDropdownOpen 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                      <Globe className={`w-4 h-4 ${isDropdownOpen ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="text-sm font-medium">{currentLangName}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                      <div className="max-h-80 overflow-y-auto py-1 custom-scrollbar">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                              language === lang.code 
                                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {lang.name}
                            {language === lang.code && <Check className="w-4 h-4 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </header>
      )}
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {labels.footer}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
