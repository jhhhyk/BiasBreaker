
import React from 'react';
import { X, BookOpen, Search } from 'lucide-react';
import { EvidenceBoard, Language } from '../types';
import EvidenceCard from './EvidenceCard';

interface EvidenceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceBoard: EvidenceBoard | null;
  language: Language;
  labels: any; // Using any for flexibility to match the t object structure from App.tsx
}

const EvidenceSidebar: React.FC<EvidenceSidebarProps> = ({ isOpen, onClose, evidenceBoard, language, labels }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-slate-50 border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          {labels.toggleEvidence || "Evidence Board"}
          {evidenceBoard && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{evidenceBoard.evidence_board.length}</span>}
        </h3>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
        {!evidenceBoard ? (
           <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-6">
             <Search className="w-12 h-12 mb-4 opacity-20" />
             <p className="text-sm">
               {labels.noEvidence || "No evidence gathered yet."}
             </p>
             <p className="text-xs mt-2 opacity-60">
               {labels.evidenceHint || "Evidence will appear here once the debate starts."}
             </p>
           </div>
        ) : (
          evidenceBoard.evidence_board.map((item) => (
            <EvidenceCard key={item.id} item={item} language={language} />
          ))
        )}
      </div>
    </div>
  );
};

export default EvidenceSidebar;
