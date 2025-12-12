
import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { EvidenceItem, Language, Sector, SectorStatus } from '../types';
import { SECTORS, getSectorTranslation } from '../constants';

interface EvidenceSectorTableProps {
  sectorStatuses: Record<Sector, SectorStatus>;
  visibleEvidence: EvidenceItem[];
  language: Language;
}

const EvidenceSectorTable: React.FC<EvidenceSectorTableProps> = ({ 
  sectorStatuses, 
  visibleEvidence, 
  language 
}) => {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  const toggleExpand = (sector: string) => {
    setExpandedSectors(prev => ({ ...prev, [sector]: !prev[sector] }));
  };
  
  const getEvidenceForSector = (sector: Sector) => {
    return visibleEvidence.filter(e => e.sector === sector);
  };

  const getStatusIcon = (status: SectorStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-300" />;
    }
  };

  const getStatusText = (status: SectorStatus) => {
    switch (status) {
      case 'loading': return language === 'ko' ? '분석 중...' : 'Analyzing...';
      case 'completed': return language === 'ko' ? '완료' : 'Done';
      case 'error': return 'Error';
      default: return language === 'ko' ? '대기' : 'Pending';
    }
  };

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">
              Sector
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell w-24">
              Items
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Key Findings (Preview)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {SECTORS.map((sector) => {
            const status = sectorStatuses[sector];
            const items = getEvidenceForSector(sector);
            const isDone = status === 'completed';
            const isExpanded = expandedSectors[sector];

            // Show first 2 items by default, or all if expanded
            const displayItems = isExpanded ? items : items.slice(0, 2);
            const hiddenCount = items.length - 2;

            return (
              <tr key={sector} className={`transition-colors ${status === 'loading' ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className={`text-xs font-medium ${status === 'loading' ? 'text-indigo-600' : 'text-slate-500'}`}>
                       {getStatusText(status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="text-sm font-bold text-slate-900">
                    {getSectorTranslation(language, sector)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell align-top">
                  {isDone && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${items.length === 0 ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-800'}`}>
                      {items.length}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 align-top">
                  {items.length > 0 ? (
                    <div className="space-y-1">
                       {displayItems.map((item, i) => (
                         <div key={i} className="flex items-start gap-1 text-xs text-slate-600">
                            <span className="text-indigo-400 mt-0.5 min-w-[6px]">•</span>
                            <span className={isExpanded ? "" : "line-clamp-1"}>{item.content}</span>
                         </div>
                       ))}
                       
                       {hiddenCount > 0 && (
                         <button 
                            onClick={() => toggleExpand(sector)}
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium pl-3 flex items-center gap-1 mt-1 transition-colors"
                         >
                            {isExpanded ? (
                                <>Show Less <ChevronUp className="w-3 h-3" /></>
                            ) : (
                                <>+ {hiddenCount} more <ChevronDown className="w-3 h-3" /></>
                            )}
                         </button>
                       )}
                       
                       {isExpanded && hiddenCount <= 0 && items.length > 2 && (
                          <button 
                            onClick={() => toggleExpand(sector)}
                            className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium pl-3 flex items-center gap-1 mt-1 transition-colors"
                         >
                            Show Less <ChevronUp className="w-3 h-3" />
                         </button>
                       )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {status === 'loading' 
                         ? 'Gathering evidence...' 
                         : (status === 'completed' ? (language === 'ko' ? '관련 데이터 없음' : 'No significant data found') : '-')}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EvidenceSectorTable;
