
import { ProConArguments, RebuttalSet, CrossExamSet, DebateRound, ConstructiveSpeech, Sector, SimulationState, SimulationStep } from '../types';

export type TimelineItemType = 'intro' | 'argument' | 'conclusion' | 'rebuttal' | 'question' | 'answer' | 'user-query' | 'divider' | 'loading' | 'analyzing';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  side: 'pro' | 'con' | 'user' | 'center'; 
  sector?: string;
  content: string; 
  defense?: string; 
  title?: string;
  refId?: string;
  evidence?: string[];
  label?: string; 
  meta?: any;
}

export const getTimelineItems = (
  state: SimulationState,
  stepReady: boolean,
  isPaused: boolean,
  labels: any
): TimelineItem[] => {
  const items: TimelineItem[] = [];
  const renderedSteps = new Set<string>();

  const { arguments: args, rebuttals, crossExam, additionalRounds, status, isGeneratingRound } = state;

  // 1. Calculate typingSide in advance for MAIN DEBATE phase
  let typingSide: 'pro' | 'con' | null = null;
  if (state.isTyping && !isGeneratingRound) { // Only for main debate
    switch (status) {
      case 'pro_constructive':
      case 'pro_cx': 
        if (status === 'pro_cx' && (crossExam?.pro_questions?.length || 0) > (crossExam?.con_answers?.length || 0)) {
           typingSide = 'con';
        } else {
           typingSide = 'pro';
        }
        break;
      
      case 'con_constructive':
      case 'con_cx':
        if (status === 'con_cx' && (crossExam?.con_questions?.length || 0) > (crossExam?.pro_answers?.length || 0)) {
           typingSide = 'pro';
        } else {
           typingSide = 'con';
        }
        break;
      
      case 'rebuttal':
         const conRebLen = rebuttals?.con_rebuttals?.length || 0;
         const proRebLen = rebuttals?.pro_rebuttals?.length || 0;
         typingSide = conRebLen > proRebLen ? 'pro' : 'con';
         break;
    }
  }

  // --- Helper Functions ---
  const addSpeech = (speech: ConstructiveSpeech, side: 'pro' | 'con', prefix: string) => {
    if (speech.introduction) {
      items.push({
        id: `${prefix}-intro`,
        type: 'intro',
        side,
        content: `${speech.introduction.definitions}\n\n${speech.introduction.roadmap}`,
        title: "Introduction & Definitions",
        meta: { value: speech.introduction.value_criterion, hook: speech.introduction.hook }
      });
    }

    if (speech.contentions) {
      speech.contentions.forEach((c, idx) => {
        items.push({
          id: `${prefix}-point-${idx}`,
          type: 'argument',
          side,
          content: c.reasoning,
          title: `${c.signpost}: ${c.claim}`,
          evidence: c.evidence_id,
          sector: c.sector
        });
      });
    }

    if (speech.conclusion) {
      items.push({
        id: `${prefix}-conclusion`,
        type: 'conclusion',
        side,
        content: speech.conclusion.final_appeal,
        title: "Conclusion"
      });
    }
  };

  const addRoundToTimeline = (
    roundArgs: ProConArguments | null, 
    roundRebs: RebuttalSet | null, 
    roundCross: CrossExamSet | null, 
    roundIdPrefix: string = ''
  ) => {
      // 1. Pro Constructive
      if (roundArgs && roundArgs.pro_speech && roundArgs.pro_speech.introduction) {
        if (!renderedSteps.has(`${roundIdPrefix}pro_constructive`)) {
            items.push({ id: `${roundIdPrefix}divider-pro-const`, type: 'divider', content: labels.arguing_pro, side: 'pro' });
            renderedSteps.add(`${roundIdPrefix}pro_constructive`);
        }
        addSpeech(roundArgs.pro_speech, 'pro', `${roundIdPrefix}pro`);
      }

      // 2. Con CX
      if (roundCross && roundCross.con_questions && roundCross.con_questions.length > 0) {
           if (!renderedSteps.has(`${roundIdPrefix}con_cx`)) {
               items.push({ id: `${roundIdPrefix}divider-con-cx`, type: 'divider', content: labels.cx_con, side: 'con' });
               renderedSteps.add(`${roundIdPrefix}con_cx`);
           }
           const maxConQs = roundCross.con_questions.length;
           for (let i = 0; i < maxConQs; i++) {
               items.push({
                 id: `${roundIdPrefix}con-q-${i}`,
                 type: 'question',
                 side: 'con',
                 content: roundCross.con_questions[i],
                 label: "Negative CX (Q)"
               });
               if (roundCross.pro_answers && roundCross.pro_answers[i]) {
                 items.push({
                   id: `${roundIdPrefix}pro-a-${i}`,
                   type: 'answer',
                   side: 'pro',
                   content: roundCross.pro_answers[i],
                   label: "Answer (A)"
                 });
               }
           }
      }

      // 3. Con Constructive
      if (roundArgs && roundArgs.con_speech && roundArgs.con_speech.introduction) {
        if (!renderedSteps.has(`${roundIdPrefix}con_constructive`)) {
            items.push({ id: `${roundIdPrefix}divider-con-const`, type: 'divider', content: labels.arguing_con, side: 'con' });
            renderedSteps.add(`${roundIdPrefix}con_constructive`);
        }
        addSpeech(roundArgs.con_speech, 'con', `${roundIdPrefix}con`);
      }

      // 4. Pro CX
      if (roundCross && roundCross.pro_questions && roundCross.pro_questions.length > 0) {
           if (!renderedSteps.has(`${roundIdPrefix}pro_cx`)) {
               items.push({ id: `${roundIdPrefix}divider-pro-cx`, type: 'divider', content: labels.cx_pro, side: 'pro' });
               renderedSteps.add(`${roundIdPrefix}pro_cx`);
           }
           const maxProQs = roundCross.pro_questions.length;
           for (let i = 0; i < maxProQs; i++) {
               items.push({
                 id: `${roundIdPrefix}pro-q-${i}`,
                 type: 'question',
                 side: 'pro',
                 content: roundCross.pro_questions[i],
                 label: "Affirmative CX (Q)"
               });
               if (roundCross.con_answers && roundCross.con_answers[i]) {
                 items.push({
                   id: `${roundIdPrefix}con-a-${i}`,
                   type: 'answer',
                   side: 'con',
                   content: roundCross.con_answers[i],
                   label: "Answer (A)"
                 });
               }
           }
      }

      // 5 & 6. Rebuttals
      if (roundRebs && (roundRebs.con_rebuttals || roundRebs.pro_rebuttals)) {
        if ((roundRebs.con_rebuttals.length > 0 || roundRebs.pro_rebuttals.length > 0) && !renderedSteps.has(`${roundIdPrefix}rebuttal`)) {
           items.push({ id: `${roundIdPrefix}divider-rebuttal`, type: 'divider', content: labels.rebuttal_con, side: 'con' });
           renderedSteps.add(`${roundIdPrefix}rebuttal`);
        }

        const conList = roundRebs.con_rebuttals || [];
        const proList = roundRebs.pro_rebuttals || [];
        const maxLen = Math.max(conList.length, proList.length);

        for (let i = 0; i < maxLen; i++) {
          if (conList[i]) {
            items.push({
              id: `${roundIdPrefix}con-reb-${i}`,
              type: 'rebuttal',
              side: 'con',
              sector: conList[i].sector,
              defense: conList[i].defense,
              content: conList[i].rebuttal,
              refId: conList[i].target_claim,
              evidence: conList[i].evidence_used
            });
          }
          if (proList[i]) {
            items.push({
              id: `${roundIdPrefix}pro-reb-${i}`,
              type: 'rebuttal',
              side: 'pro',
              sector: proList[i].sector,
              defense: proList[i].defense,
              content: proList[i].rebuttal,
              refId: conList[i].target_claim,
              evidence: proList[i].evidence_used
            });
          }
        }
      }
  };

  // Main Debate Render
  addRoundToTimeline(args, rebuttals, crossExam);

  // --- Unified Loading/Typing Logic ---
  const isLoading = !stepReady && !isPaused;

  const appendPending = (step: SimulationStep) => {
    switch (step) {
      case 'pro_constructive':
        if (!renderedSteps.has('pro_constructive')) {
           items.push({ id: `divider-pro-const`, type: 'divider', content: labels.arguing_pro, side: 'pro' });
        }
        // (Data missing) OR (Typing + My Turn) -> Use same ID 'loading-pro'
        if ((isLoading && !args?.pro_speech?.introduction) || (state.isTyping && typingSide === 'pro')) {
           items.push({ id: 'loading-pro', type: 'loading', side: 'pro', content: '' });
        }
        break;

      case 'con_cx':
        if (!renderedSteps.has('con_cx')) {
           items.push({ id: `divider-con-cx`, type: 'divider', content: labels.cx_con, side: 'con' });
        }
        // Con Question Turn (Data missing or Typing)
        if ((isLoading && (!crossExam?.con_questions || crossExam.con_questions.length === 0)) || (state.isTyping && typingSide === 'con')) {
           items.push({ id: 'loading-con', type: 'loading', side: 'con', content: '' }); 
        }
        // Pro Answer Turn (Only when typing)
        else if (state.isTyping && typingSide === 'pro') {
           items.push({ id: 'loading-pro', type: 'loading', side: 'pro', content: '' });
        }
        break;

      case 'con_constructive':
        if (!renderedSteps.has('con_constructive')) {
           items.push({ id: `divider-con-const`, type: 'divider', content: labels.arguing_con, side: 'con' });
        }
        if ((isLoading && !args?.con_speech?.introduction) || (state.isTyping && typingSide === 'con')) {
           items.push({ id: 'loading-con', type: 'loading', side: 'con', content: '' });
        }
        break;

      case 'pro_cx':
        if (!renderedSteps.has('pro_cx')) {
           items.push({ id: `divider-pro-cx`, type: 'divider', content: labels.cx_pro, side: 'pro' });
        }
        // Pro Question Turn
        if ((isLoading && (!crossExam?.pro_questions || crossExam.pro_questions.length === 0)) || (state.isTyping && typingSide === 'pro')) {
           items.push({ id: 'loading-pro', type: 'loading', side: 'pro', content: '' });
        }
        // Con Answer Turn
        else if (state.isTyping && typingSide === 'con') {
           items.push({ id: 'loading-con', type: 'loading', side: 'con', content: '' });
        }
        break;

      case 'rebuttal':
        if (!renderedSteps.has('rebuttal')) {
           items.push({ id: `divider-rebuttal`, type: 'divider', content: labels.rebuttal_con, side: 'con' });
        }
        
        const conLen = rebuttals?.con_rebuttals?.length || 0;
        const proLen = rebuttals?.pro_rebuttals?.length || 0;
        
        // Con Turn (If equal length, Con goes first)
        if ((isLoading && conLen === proLen) || (state.isTyping && typingSide === 'con')) {
           items.push({ id: 'loading-con-reb', type: 'loading', side: 'con', content: '' });
        } 
        // Pro Turn
        else if ((isLoading && conLen > proLen) || (state.isTyping && typingSide === 'pro')) {
           items.push({ id: 'loading-pro-reb', type: 'loading', side: 'pro', content: '' });
        }
        break;
        
      case 'analyzing':
         if (isLoading) {
            items.push({ 
                id: 'loading-analyzing', 
                type: 'analyzing', 
                side: 'center', 
                content: labels.analyzing_loading // Use specific loading text
            });
         }
         break;
    }
  };

  if (status !== 'complete' && status !== 'error' && status !== 'idle' && status !== 'researching') {
     appendPending(status);
  }

  // Additional Rounds (QA Flow)
  additionalRounds.forEach((round, index) => {
     // 1. Always show Divider First
     items.push({
         id: `divider-qa-${index}`,
         type: 'divider',
         content: labels.followUpTitle || "Follow Up",
         side: 'center' // Neutral side for divider
     });

     // 2. Show User Question
     items.push({
       id: `user-query-${index}`,
       type: 'user-query',
       side: 'user',
       content: round.focusTopic
     });

     if (round.type === 'qa') {
       const qa = round.qa_response || {};
       
       // 3. Show Pro Answer if available
       if (qa.pro_answer) {
           items.push({
             id: `qa-pro-${index}`,
             type: 'answer',
             side: 'pro',
             content: qa.pro_answer,
             label: "Direct Answer"
           });
       }

       // 4. Show Con Answer if available
       if (qa.con_answer) {
           items.push({
            id: `qa-con-${index}`,
            type: 'answer',
            side: 'con',
            content: qa.con_answer,
            label: "Direct Answer"
          });
       }
     } else {
       // Legacy Debate Round
       addRoundToTimeline(round.arguments || null, round.rebuttals || null, round.crossExam || null, `round-${index}-`);
     }
  });

  // Follow-up Generation Loading Bubble Logic
  if (isGeneratingRound) {
      const lastRound = additionalRounds[additionalRounds.length - 1];
      
      // If we have a last round, check its state to decide who is typing
      if (lastRound && lastRound.type === 'qa') {
          const qa = lastRound.qa_response || {};
          
          if (!qa.pro_answer) {
              // Pro hasn't answered yet -> Pro is typing
              items.push({ id: 'loading-qa-pro', type: 'loading', side: 'pro', content: '' });
          } else if (!qa.con_answer) {
              // Pro answered, Con hasn't -> Con is typing
              items.push({ id: 'loading-qa-con', type: 'loading', side: 'con', content: '' });
          }
      } else {
          // Fallback if no round yet (very start of generation) or legacy type
          items.push({ id: 'loading-followup', type: 'loading', side: 'pro', content: '' });
      }
  }

  return items;
};

export const getAnchorId = (item: TimelineItem, assignedStepIds: Set<string>, labels: any): string | undefined => {
  if (item.side === 'user') return undefined;
  
  let stepKey = '';

  if (item.type === 'divider' && item.content === labels.arguing_pro && !assignedStepIds.has('pro_constructive')) {
    stepKey = 'pro_constructive';
  } else if (item.type === 'divider' && item.content === labels.cx_con && !assignedStepIds.has('con_cx')) {
    stepKey = 'con_cx';
  } else if (item.type === 'divider' && item.content === labels.arguing_con && !assignedStepIds.has('con_constructive')) {
    stepKey = 'con_constructive';
  } else if (item.type === 'divider' && item.content === labels.cx_pro && !assignedStepIds.has('pro_cx')) {
    stepKey = 'pro_cx';
  } else if (item.type === 'divider' && item.content === labels.rebuttal_con && !assignedStepIds.has('rebuttal')) {
    stepKey = 'rebuttal';
  }

  if (stepKey) {
    assignedStepIds.add(stepKey);
    return `step-${stepKey}`;
  }
  return undefined;
};