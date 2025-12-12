
import React from 'react';
import { Loader2, CheckCircle2, PlayCircle, Table, BookOpen } from 'lucide-react';
import EvidenceSectorTable from './EvidenceSectorTable';
import { EvidenceItem, Language, SectorStatus, Sector } from '../types';
import { SECTORS } from '../constants';

interface ResearchViewProps {
  status: string;
  researchStatus: string;
  visibleEvidence: EvidenceItem[];
  sectorStatuses: Record<Sector, SectorStatus>; // Added support for sector statuses
  language: Language;
  onStartDebate: () => void;
  onViewEvidence: () => void;
  t: any;
}

const ResearchView: React.FC<ResearchViewProps> = ({ 
  status, 
  researchStatus, 
  visibleEvidence, 
  sectorStatuses,
  language, 
  onStartDebate,
  onViewEvidence,
  t 
}) => {
  // Determine if we should show table or if statuses are available
  // Fallback to generating 'completed' statuses if sectorStatuses is missing (backward compatibility)
  const safeSectorStatuses = sectorStatuses || SECTORS.reduce((acc, s) => ({ ...acc, [s]: 'completed' }), {} as any);

  return (
    <div className="max-w-6xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-[400px]">
        {/* Research Status Header */}
        <div className="text-center mb-8">
          {status === 'researching' ? (
            <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
            </div>
          )}
          <h3 className="text-xl font-bold text-slate-800 mb-2">{researchStatus}</h3>
          {status === 'researching' && (
            <p className="text-slate-500 text-sm">
              {language === 'ko' ? "AI 에이전트들이 모든 섹터를 동시에 분석하고 있습니다." : "Agents are analyzing all sectors simultaneously."}
            </p>
          )}
        </div>
        
        {/* New Table View */}
        <div className="mb-8">
           <EvidenceSectorTable 
              sectorStatuses={safeSectorStatuses}
              visibleEvidence={visibleEvidence}
              language={language}
           />
        </div>

        {/* Start Debate Button - Only visible when research is done */}
        {status === 'research_completed' && (
           <div className="mt-8 flex justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <button 
                onClick={onStartDebate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 flex items-center gap-3"
              >
                 {t.btnProceedDebate} <PlayCircle className="w-6 h-6" />
              </button>
              
              <button
                onClick={onViewEvidence}
                className="group flex items-center p-4 bg-white text-slate-500 rounded-full shadow-md hover:shadow-xl transition-all duration-300 hover:text-indigo-600"
                aria-label={t.toggleEvidence}
              >
                <BookOpen className="w-6 h-6 flex-shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-90 group-hover:ml-3 transition-all duration-300 whitespace-nowrap font-medium">
                  {t.toggleEvidence} {language === 'ko' ? '보기' : ''}
                </span>
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default ResearchView;
