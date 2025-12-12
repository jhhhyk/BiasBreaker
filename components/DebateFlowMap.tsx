
import React from 'react';
import { ArrowRight, CornerDownRight, ShieldAlert, Target } from 'lucide-react';
import { ConstructiveSpeech, RebuttalSet } from '../types';

interface DebateFlowMapProps {
  proSpeech: ConstructiveSpeech | null;
  conSpeech: ConstructiveSpeech | null;
  rebuttals: RebuttalSet | null;
}

const DebateFlowMap: React.FC<DebateFlowMapProps> = ({ proSpeech, conSpeech, rebuttals }) => {
  if (!proSpeech || !conSpeech) {
    return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
            <p>Map will populate as debate progresses</p>
        </div>
    );
  }

  // Helper to find attacks on a specific claim
  const getAttacksOnClaim = (claimText: string, side: 'pro' | 'con') => {
      if (!rebuttals) return [];
      const list = side === 'pro' ? rebuttals.con_rebuttals : rebuttals.pro_rebuttals;
      // Simple string matching or index matching (assuming order)
      // Since we don't have stable IDs for claims in the types yet, we simulate visual mapping by index if titles match roughly or just by sequence
      return list.filter(r => r.target_claim && (claimText.includes(r.target_claim.substring(0, 10)) || r.target_claim.includes(claimText.substring(0, 10))));
  };

  return (
    <div className="relative space-y-8">
      
      {/* 1. Value Clash */}
      <div className="flex gap-2 text-xs">
          <div className="flex-1 bg-blue-50 border border-blue-200 p-2 rounded text-center">
             <span className="block font-bold text-blue-700 uppercase text-[10px]">Pro Value</span>
             {proSpeech.introduction?.value_criterion || "..."}
          </div>
          <div className="flex items-center text-slate-300">VS</div>
          <div className="flex-1 bg-red-50 border border-red-200 p-2 rounded text-center">
             <span className="block font-bold text-red-700 uppercase text-[10px]">Con Value</span>
             {conSpeech.introduction?.value_criterion || "..."}
          </div>
      </div>

      {/* 2. Contentions Flow */}
      <div className="space-y-6 relative">
         {/* Vertical line connector */}
         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -z-10" />

         {[0, 1, 2].map((idx) => {
             const proArg = proSpeech.contentions?.[idx];
             const conArg = conSpeech.contentions?.[idx];
             
             // Find rebuttals targeting these (approximate matching for demo visualization)
             const conAttack = rebuttals?.con_rebuttals[idx]; // CEDA often goes line-by-line 
             const proAttack = rebuttals?.pro_rebuttals[idx];

             return (
                 <div key={idx} className="relative grid grid-cols-2 gap-8">
                     {/* Pro Node */}
                     <div className={`relative p-3 rounded-lg border text-xs shadow-sm transition-all ${proArg ? 'bg-white border-blue-200 opacity-100' : 'opacity-0'}`}>
                         {proArg && (
                            <>
                                <span className="font-bold text-blue-600 block mb-1">{proArg.signpost}</span>
                                <p className="line-clamp-3 leading-tight">{proArg.claim}</p>
                                
                                {/* Incoming Attack Visualization */}
                                {conAttack && (
                                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full z-10 flex items-center">
                                       <div className="bg-red-100 text-red-600 rounded-full p-1 border border-red-200" title={`Con Attack: ${conAttack.rebuttal}`}>
                                          <Target size={12} />
                                       </div>
                                       <div className="w-4 h-px bg-red-300"></div>
                                    </div>
                                )}
                            </>
                         )}
                     </div>

                     {/* Con Node */}
                     <div className={`relative p-3 rounded-lg border text-xs shadow-sm transition-all ${conArg ? 'bg-white border-red-200 opacity-100' : 'opacity-0'}`}>
                         {conArg && (
                            <>
                                <span className="font-bold text-red-600 block mb-1">{conArg.signpost}</span>
                                <p className="line-clamp-3 leading-tight">{conArg.claim}</p>

                                {/* Incoming Attack Visualization */}
                                {proAttack && (
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full z-10 flex items-center flex-row-reverse">
                                       <div className="bg-blue-100 text-blue-600 rounded-full p-1 border border-blue-200" title={`Pro Attack: ${proAttack.rebuttal}`}>
                                          <Target size={12} />
                                       </div>
                                       <div className="w-4 h-px bg-blue-300"></div>
                                    </div>
                                )}
                            </>
                         )}
                     </div>
                 </div>
             );
         })}
      </div>

      <div className="text-[10px] text-center text-slate-400 mt-4">
         Arguments are plotted sequentially. Arrows indicate direct rebuttals.
      </div>

    </div>
  );
};

export default DebateFlowMap;
