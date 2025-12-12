
import React, { useState } from 'react';
import { EvidenceItem, Language } from '../types';
import { ShieldCheck, ShieldAlert, Shield, ExternalLink, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { getSectorTranslation } from '../constants';

interface EvidenceCardProps {
  item: EvidenceItem;
  language: Language;
  className?: string;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ item, language, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getReliabilityIcon = (level: string) => {
    switch (level) {
      case 'High': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'Medium': return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'Low': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default: return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const sectorColors: Record<string, string> = {
    "Statistics": "bg-blue-50 text-blue-700 border-blue-200",
    "PublicOpinion": "bg-purple-50 text-purple-700 border-purple-200",
    "DomesticCases": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "InternationalCases": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Theories": "bg-orange-50 text-orange-700 border-orange-200",
    "Stakeholders": "bg-rose-50 text-rose-700 border-rose-200",
  };

  // Get display label using the helper from constants
  const sectorLabel = getSectorTranslation(language, item.sector);

  // Score color logic
  const getScoreColor = (score?: number) => {
    if (!score) return "text-slate-400";
    if (score >= 80) return "text-emerald-600 font-bold";
    if (score >= 70) return "text-indigo-600 font-bold";
    return "text-yellow-600";
  };

  return (
    <div 
      id={`evidence-${item.id}`}
      className={`bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col scroll-mt-24 focus:ring-2 focus:ring-indigo-500 duration-500 ${className}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sectorColors[item.sector] || "bg-gray-50 text-gray-600"}`}>
          {sectorLabel}
        </span>
        <div className="flex gap-2">
            {item.score && (
                <div className={`flex items-center gap-1 text-xs ${getScoreColor(item.score)} bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100`} title="AI Evaluation Score">
                    <BarChart2 className="w-3 h-3" />
                    <span>{item.score}</span>
                </div>
            )}
            <div className="flex items-center gap-1 text-xs text-slate-500" title={`Reliability: ${item.reliability}`}>
                {getReliabilityIcon(item.reliability)}
                <span>{item.id}</span>
            </div>
        </div>
      </div>
      
      {/* Headline (Content) */}
      <p className="text-sm text-slate-900 font-bold leading-tight mb-1.5">{item.content}</p>
      
      {/* Expandable Details */}
      {isExpanded ? (
        <div className="mt-2 bg-slate-50 p-2.5 rounded-md border border-slate-100 text-xs text-slate-700 whitespace-pre-line animate-in fade-in slide-in-from-top-1 duration-200">
           {item.detail}
        </div>
      ) : (
        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.detail}</p>
      )}

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 w-fit uppercase"
      >
        {isExpanded ? <><ChevronUp size={10} /> Hide Details</> : <><ChevronDown size={10} /> View Details</>}
      </button>

      <div className="pt-2.5 border-t border-slate-100 mt-auto flex justify-between items-end gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 italic truncate" title={item.source_summary}>
            {item.source_summary}
          </p>
        </div>
        {item.url && (
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 flex-shrink-0"
            title="View Source"
          >
            Link <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default EvidenceCard;
