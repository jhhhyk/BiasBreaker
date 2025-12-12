
import React from 'react';
import { Check, X, Scale, BrainCircuit } from 'lucide-react';
import { MetaAnalysis, Sector, Language, AnalysisPoint } from '../types';
import { getSectorTranslation } from '../constants';

interface AnalysisViewProps {
  analysis: MetaAnalysis;
  t: any;
  language: Language;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, t, language }) => {
  const getSectorLabel = (sector: Sector) => {
    return getSectorTranslation(language, sector);
  };

  return (
    <div id="step-analyzing" className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12 scroll-mt-48">
      {/* Agreements/Disagreements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl shadow-sm">
          <h4 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
             <Check className="w-4 h-4"/> {t.keyAgreements}
          </h4>
          <ul className="space-y-3">
            {analysis.key_agreements.map((item, i) => (
               <li key={i} className="flex gap-2 text-sm text-emerald-900">
                  <span className="text-emerald-400 mt-1">•</span> {item}
               </li>
            ))}
          </ul>
        </div>
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl shadow-sm">
          <h4 className="text-orange-800 font-bold mb-4 flex items-center gap-2">
             <X className="w-4 h-4"/> {t.keyDisagreements}
          </h4>
           <ul className="space-y-3">
            {analysis.key_disagreements.map((item, i) => (
               <li key={i} className="flex gap-2 text-sm text-orange-900">
                  <span className="text-orange-400 mt-1">•</span> {item}
               </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Issue Map */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-bold serif text-slate-900 mb-6">{t.sectorAnalysis}</h3>
        <div className="space-y-8">
          {Object.entries(analysis.issue_map).map(([sector, issuesRaw]) => {
            const issues = issuesRaw as AnalysisPoint[];
            return (
              issues && issues.length > 0 && (
                <div key={sector} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                  <h5 className="font-bold text-slate-800 mb-3 px-3 py-1 bg-slate-100 inline-block rounded-lg text-sm">{getSectorLabel(sector as Sector)}</h5>
                  <div className="space-y-4">
                    {issues.map((issue, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-sm transition-shadow">
                        <h6 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                           <Scale className="w-4 h-4 text-indigo-500" />
                           {issue.issue}
                        </h6>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                           {/* Pro Side */}
                           <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-md">
                              <span className="font-bold block text-blue-700 text-xs uppercase mb-1 flex items-center gap-1">
                                 Pro Argument
                              </span>
                              <p className="text-slate-700 leading-relaxed">{issue.pro_argument}</p>
                           </div>
                           
                           {/* Con Side */}
                           <div className="bg-red-50/50 border border-red-100 p-3 rounded-md">
                              <span className="font-bold block text-red-700 text-xs uppercase mb-1 flex items-center gap-1">
                                 Con Argument
                              </span>
                              <p className="text-slate-700 leading-relaxed">{issue.con_argument}</p>
                           </div>
                        </div>
                        
                        {/* Rebuttal/Clash Context */}
                        <div className="text-xs bg-white p-3 rounded border border-slate-200 text-slate-600">
                           <span className="font-bold text-slate-500 mr-2 uppercase tracking-wider">Debate Context:</span>
                           <span className="italic">{issue.rebuttal_note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            );
          })}
        </div>
      </div>

      {/* Reflection */}
      <div className="bg-slate-50 text-slate-800 rounded-xl p-8 shadow-sm border border-slate-200">
         <h3 className="text-indigo-900 font-bold text-lg mb-6 flex items-center gap-2">
           <BrainCircuit className="text-indigo-600"/>
           {t.reflection}
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {analysis.reflection_prompts.map((prompt, i) => (
             <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
               <p className="font-medium text-slate-700 leading-relaxed">"{prompt}"</p>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default AnalysisView;
