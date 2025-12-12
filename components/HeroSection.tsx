
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  t: any;
  originalTopic: string;
  setOriginalTopic: (val: string) => void;
  startSimulation: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ t, originalTopic, setOriginalTopic, startSimulation }) => {
  return (
    <div className="w-full max-w-6xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 serif mb-4 sm:mb-6 leading-tight">
        {t.heroTitle}
      </h2>
      <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-8 max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto whitespace-pre-line leading-relaxed px-2">
        {t.heroDesc}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl mx-auto">
        <input 
          type="text"
          value={originalTopic}
          onChange={(e) => setOriginalTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && startSimulation()}
          placeholder={t.placeholder}
          className="flex-grow w-full p-4 pl-6 text-base sm:text-lg text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:shadow-md text-center sm:text-left"
        />
        <button 
          onClick={startSimulation}
          disabled={!originalTopic.trim()}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95"
        >
          {t.simulateBtn} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-8 flex justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400 flex-wrap">
        <span>{t.tryLabel}</span>
        {t.suggestions.map((s: string, i: number) => (
          <React.Fragment key={i}>
             <span className="cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setOriginalTopic(s)}>"{s}"</span>
             {i < t.suggestions.length - 1 && <span className="hidden sm:inline">•</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
