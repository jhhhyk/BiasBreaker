import React from 'react';
import { Search, RefreshCw, ArrowUp } from 'lucide-react';

interface FollowUpInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isGenerating: boolean;
  t: any;
  className?: string;
}

const FollowUpInput: React.FC<FollowUpInputProps> = ({ value, onChange, onSend, isGenerating, t, className = '' }) => {
  return (
    <div className={`fixed left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-2xl bg-white/90 backdrop-blur-md p-2 rounded-full shadow-2xl border border-slate-200 transition-all duration-300 ${className}`}>
       <div className="flex items-center gap-2">
          {/* Icon Area */}
          <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-indigo-50 rounded-full text-indigo-600 flex-shrink-0 ml-1">
             <Search className="w-5 h-5" />
          </div>

          {/* Input Area */}
          <input 
             type="text" 
             value={value}
             onChange={(e) => onChange(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && !isGenerating && onSend()}
             placeholder={t.followUpPlaceholder}
             disabled={isGenerating}
             className="flex-grow bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm sm:text-base px-2 h-10"
          />

          {/* Button Area */}
          <button 
             onClick={onSend}
             disabled={!value.trim() || isGenerating}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md flex-shrink-0 ${
                !value.trim() || isGenerating 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
             }`}
          >
             {isGenerating ? (
               <RefreshCw className="w-5 h-5 animate-spin" />
             ) : (
               <>
                 <span className="hidden sm:inline text-xs">{t.btnRedebate}</span>
                 <ArrowUp className="w-5 h-5 sm:hidden" />
               </>
             )}
          </button>
       </div>
    </div>
  );
};

export default FollowUpInput;