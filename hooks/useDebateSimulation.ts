
import { useState, useEffect, useRef } from 'react';
import { orchestrator } from '../services/geminiService';
import { SimulationState, ChatMessage, RebuttalSet, EvidenceItem, Language, Sector, SectorStatus, DebateRound } from '../types';
import { SECTORS, getSectorTranslation, getUIText } from '../constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Adjusted delays for better reading experience
const TYPING_DELAY = 1500; // Time for "agent is typing" bubble
const READING_DELAY = 1000; // Time to read a block of text

export const useDebateSimulation = (language: Language) => {
  const [researchStatus, setResearchStatus] = useState<string>('');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stepReady, setStepReady] = useState(false);
  const [visibleEvidence, setVisibleEvidence] = useState<EvidenceItem[]>([]);
  
  const nextStepTrigger = useRef<(() => void) | null>(null);
  const isAutoPlayRef = useRef(isAutoPlay);
  const isPausedRef = useRef(isPaused);
  const isRunningRef = useRef(false); // Abort controller flag

  // Sync refs
  useEffect(() => { isAutoPlayRef.current = isAutoPlay; }, [isAutoPlay]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const [state, setState] = useState<SimulationState>({
    status: 'idle',
    originalTopic: '',
    framedIssue: null,
    framingChat: [],
    evidenceBoard: null,
    sectorStatuses: SECTORS.reduce((acc, sector) => ({ ...acc, [sector]: 'pending' }), {} as Record<Sector, SectorStatus>),
    arguments: null,
    rebuttals: null,
    crossExam: null,
    analysis: null,
    additionalRounds: [],
    isGeneratingRound: false,
    isTyping: false
  });

  const t = getUIText(language);

  const checkpoint = async () => {
    setStepReady(true);
    let elapsed = 0;
    const duration = 2000; 

    await new Promise<void>(resolve => {
        const interval = setInterval(() => {
            // Abort check
            if (!isRunningRef.current) {
                clearInterval(interval);
                setStepReady(false);
                resolve();
                return;
            }

            if (nextStepTrigger.current) {
                clearInterval(interval);
                nextStepTrigger.current = null;
                setStepReady(false);
                resolve();
                return;
            }
            if (isPausedRef.current) return;

            if (isAutoPlayRef.current) {
                elapsed += 100;
                if (elapsed >= duration) {
                    clearInterval(interval);
                    setStepReady(false);
                    resolve();
                }
            }
        }, 100);
    });
  };

  const waitAndType = async (ms: number) => {
    if (!isRunningRef.current) return;
    setState(prev => ({ ...prev, isTyping: true }));
    await delay(ms);
    if (!isRunningRef.current) return;
    setState(prev => ({ ...prev, isTyping: false }));
  };

  const startSimulation = async () => {
    if (!state.originalTopic.trim()) return;

    isRunningRef.current = true; // Start running

    try {
      setState(prev => ({ 
        ...prev, 
        status: 'framing', 
        error: undefined, 
        framingChat: [], 
        additionalRounds: [],
        sectorStatuses: SECTORS.reduce((acc, sector) => ({ ...acc, [sector]: 'pending' }), {} as Record<Sector, SectorStatus>)
      }));

      const framedIssue = await orchestrator.issueFramer.frameIssue(state.originalTopic, language);
      if (!isRunningRef.current) return; // Abort Check
      
      const initialMsg: ChatMessage = {
        role: 'model',
        text: t.chatWelcome,
        timestamp: Date.now()
      };

      setState(prev => ({ 
        ...prev, 
        framedIssue, 
        framingChat: [initialMsg],
        status: 'waiting_confirmation' 
      }));

    } catch (err: any) {
      if (!isRunningRef.current) return;
      console.error(err);
      setState(prev => ({ ...prev, status: 'error', error: err.message || "An error occurred during issue framing." }));
    }
  };

  const handleRefineIssue = async (chatInput: string) => {
    if (!chatInput.trim() || !state.framedIssue) return;

    isRunningRef.current = true;

    const userMsg: ChatMessage = {
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      framingChat: [...prev.framingChat, userMsg],
      status: 'refining'
    }));

    try {
      const refinement = await orchestrator.issueFramer.refineIssue(
        [...state.framingChat, userMsg],
        state.framedIssue,
        language
      );
      if (!isRunningRef.current) return;

      const modelMsg: ChatMessage = {
        role: 'model',
        text: refinement.message,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        framedIssue: refinement.draft,
        framingChat: [...prev.framingChat, modelMsg],
        status: 'waiting_confirmation'
      }));

    } catch (err: any) {
      if (!isRunningRef.current) return;
      console.error(err);
      setState(prev => ({ ...prev, status: 'error', error: err.message }));
    }
  };

  const handleStartResearch = async () => {
    if (!state.framedIssue) return;

    isRunningRef.current = true;

    try {
      setState(prev => ({ 
        ...prev, 
        status: 'researching', 
        evidenceBoard: { evidence_board: [] },
        sectorStatuses: SECTORS.reduce((acc, sector) => ({ ...acc, [sector]: 'pending' }), {} as Record<Sector, SectorStatus>)
      }));
      setVisibleEvidence([]);
      
      setResearchStatus(language === 'ko' ? "전체 섹터 동시 분석 중..." : "Analyzing all sectors simultaneously...");

      const researchPromises = SECTORS.map(async (sector) => {
        if (!isRunningRef.current) return;
        
        setState(prev => ({
          ...prev,
          sectorStatuses: { ...prev.sectorStatuses, [sector]: 'loading' }
        }));

        try {
          const sectorEvidence = await orchestrator.neutralResearcher.conductSectorResearch(
              state.framedIssue!, 
              sector, 
              language, 
              [] 
          );
          
          if (!isRunningRef.current) return;

          if (sectorEvidence.length > 0) {
              setVisibleEvidence(prev => [...prev, ...sectorEvidence]);
              
              setState(prev => ({ 
                  ...prev, 
                  evidenceBoard: { evidence_board: [...(prev.evidenceBoard?.evidence_board || []), ...sectorEvidence] },
                  sectorStatuses: { ...prev.sectorStatuses, [sector]: 'completed' }
              }));
          } else {
             setState(prev => ({
               ...prev,
               sectorStatuses: { ...prev.sectorStatuses, [sector]: 'completed' }
             }));
          }
        } catch (e) {
           if (!isRunningRef.current) return;
           console.warn(`Failed to research sector ${sector}`, e);
           setState(prev => ({
             ...prev,
             sectorStatuses: { ...prev.sectorStatuses, [sector]: 'completed' }
           }));
        }
      });

      await Promise.all(researchPromises);

      if (!isRunningRef.current) return;

      setState(prev => {
        return { ...prev, status: 'research_completed' };
      });

      setResearchStatus(t.researchComplete);
      
    } catch (err: any) {
      if (!isRunningRef.current) return;
      console.error(err);
      setState(prev => ({ ...prev, status: 'error', error: err.message || "An error occurred during research." }));
    }
  };

  const handleStartDebate = async () => {
      if (!state.framedIssue || !state.evidenceBoard) return;

      isRunningRef.current = true;

      try {
        setIsPaused(false);
        setStepReady(false);

        setState(prev => ({ ...prev, status: 'pro_constructive' }));

        // 2. Pro Constructive Generation
        const proArgs = await orchestrator.proAdvocate.generateArguments(state.framedIssue!, state.evidenceBoard!, language);
        if (!isRunningRef.current) return;

        const fullProSpeech = proArgs.pro_speech;

        // -- Sequential Reveal: Pro Intro --
        await waitAndType(TYPING_DELAY);
        if (!isRunningRef.current) return;
        
        setState(prev => ({ 
          ...prev, 
          arguments: { 
            pro_speech: {
                ...fullProSpeech,
                contentions: [], // Hide contentions initially
                conclusion: undefined as any // Hide conclusion initially
            }, 
            con_speech: {} as any 
          }
        }));
        await delay(READING_DELAY);
        if (!isRunningRef.current) return;

        // -- Sequential Reveal: Pro Contentions --
        const proContentionsAccumulator: any[] = [];
        for (const contention of fullProSpeech.contentions) {
            proContentionsAccumulator.push(contention);
            await waitAndType(TYPING_DELAY);
            if (!isRunningRef.current) return;

            setState(prev => ({
                ...prev,
                arguments: {
                    ...prev.arguments!,
                    pro_speech: {
                        ...prev.arguments!.pro_speech,
                        contentions: [...proContentionsAccumulator]
                    }
                }
            }));
            await delay(READING_DELAY);
            if (!isRunningRef.current) return;
        }

        // -- Sequential Reveal: Pro Conclusion --
        await waitAndType(TYPING_DELAY);
        if (!isRunningRef.current) return;

        setState(prev => ({
            ...prev,
            arguments: {
                ...prev.arguments!,
                pro_speech: {
                    ...prev.arguments!.pro_speech,
                    conclusion: fullProSpeech.conclusion
                }
            }
        }));
        await delay(READING_DELAY);
        if (!isRunningRef.current) return;

        // Transition to Con CX
        setState(prev => ({ ...prev, status: 'con_cx' }));
        await checkpoint();
        if (!isRunningRef.current) return;

        // 3. Con Cross-Examines Pro
        const conCX = await orchestrator.conCrossExaminer.conductCrossExam(
          { pro_speech: fullProSpeech, con_speech: {} as any }, 
          state.evidenceBoard!, 
          language
        );
        if (!isRunningRef.current) return;
        
        setState(prev => ({ 
          ...prev, 
          crossExam: {
            con_questions: [],
            pro_answers: [],
            pro_questions: [],
            con_answers: []
          }
        }));

        for (let i = 0; i < conCX.con_questions.length; i++) {
           await waitAndType(TYPING_DELAY); 
           if (!isRunningRef.current) return;

           setState(prev => ({
             ...prev,
             crossExam: {
               ...prev.crossExam!,
               con_questions: [...(prev.crossExam?.con_questions || []), conCX.con_questions[i]]
             }
           }));
           await delay(READING_DELAY); 
           if (!isRunningRef.current) return;

           if (conCX.pro_answers[i]) {
             await waitAndType(TYPING_DELAY);
             if (!isRunningRef.current) return;

             setState(prev => ({
               ...prev,
               crossExam: {
                 ...prev.crossExam!,
                 pro_answers: [...(prev.crossExam?.pro_answers || []), conCX.pro_answers[i]]
               }
             }));
             await delay(READING_DELAY); 
             if (!isRunningRef.current) return;
           }
        }
        
        setState(prev => ({ ...prev, status: 'con_constructive' }));
        await checkpoint();
        if (!isRunningRef.current) return;

        // 4. Con Constructive Generation
        const conArgs = await orchestrator.conAdvocate.generateArguments(state.framedIssue!, state.evidenceBoard!, language);
        if (!isRunningRef.current) return;
        
        const fullConSpeech = conArgs.con_speech;

        const combinedArgs = { 
          pro_speech: fullProSpeech, 
          con_speech: fullConSpeech 
        };

        // -- Sequential Reveal: Con Intro --
        await waitAndType(TYPING_DELAY);
        if (!isRunningRef.current) return;

        // Note: We MUST preserve existing pro_speech
        setState(prev => ({ 
          ...prev, 
          arguments: {
            pro_speech: fullProSpeech,
            con_speech: {
                ...fullConSpeech,
                contentions: [],
                conclusion: undefined as any
            }
          }
        }));
        await delay(READING_DELAY);
        if (!isRunningRef.current) return;

        // -- Sequential Reveal: Con Contentions --
        const conContentionsAccumulator: any[] = [];
        for (const contention of fullConSpeech.contentions) {
            conContentionsAccumulator.push(contention);
            await waitAndType(TYPING_DELAY);
            if (!isRunningRef.current) return;

            setState(prev => ({
                ...prev,
                arguments: {
                    ...prev.arguments!,
                    con_speech: {
                        ...prev.arguments!.con_speech,
                        contentions: [...conContentionsAccumulator]
                    }
                }
            }));
            await delay(READING_DELAY);
            if (!isRunningRef.current) return;
        }

        // -- Sequential Reveal: Con Conclusion --
        await waitAndType(TYPING_DELAY);
        if (!isRunningRef.current) return;

        setState(prev => ({
            ...prev,
            arguments: {
                ...prev.arguments!,
                con_speech: {
                    ...prev.arguments!.con_speech,
                    conclusion: fullConSpeech.conclusion
                }
            }
        }));
        await delay(READING_DELAY);
        if (!isRunningRef.current) return;

        setState(prev => ({ ...prev, status: 'pro_cx' }));
        await checkpoint();
        if (!isRunningRef.current) return;

        // 5. Pro Cross-Examines Con
        const proCX = await orchestrator.proCrossExaminer.conductCrossExam(combinedArgs, state.evidenceBoard!, language);
        if (!isRunningRef.current) return;
        
        for (let i = 0; i < proCX.pro_questions.length; i++) {
            await waitAndType(TYPING_DELAY);
            if (!isRunningRef.current) return;

            setState(prev => ({
              ...prev,
              crossExam: {
                ...prev.crossExam!,
                pro_questions: [...(prev.crossExam?.pro_questions || []), proCX.pro_questions[i]]
              }
            }));
            await delay(READING_DELAY);
            if (!isRunningRef.current) return;
 
            if (proCX.con_answers[i]) {
              await waitAndType(TYPING_DELAY);
              if (!isRunningRef.current) return;

              setState(prev => ({
                ...prev,
                crossExam: {
                  ...prev.crossExam!,
                  con_answers: [...(prev.crossExam?.con_answers || []), proCX.con_answers[i]]
                }
              }));
              await delay(READING_DELAY);
              if (!isRunningRef.current) return;
            }
        }

        const combinedCX = {
          con_questions: conCX.con_questions,
          pro_answers: conCX.pro_answers,
          pro_questions: proCX.pro_questions,
          con_answers: proCX.con_answers
        };
        
        setState(prev => ({ 
          ...prev, 
          crossExam: combinedCX,
          status: 'rebuttal'
        }));
        await checkpoint();
        if (!isRunningRef.current) return;

        // 6. Ping-Pong Rebuttal Phase
        let currentRebuttals: RebuttalSet = { pro_rebuttals: [], con_rebuttals: [] };
        setState(prev => ({ ...prev, rebuttals: currentRebuttals }));

        for (let i = 0; i < 3; i++) {
          if (!isRunningRef.current) return;

          // --- Con Turn ---
          const lastProRebuttal = i > 0 ? currentRebuttals.pro_rebuttals[i-1] : null;
          const conTurn = await orchestrator.conRebuttal.generateRebuttalTurn(
            combinedArgs, 
            state.evidenceBoard!, 
            language, 
            currentRebuttals, 
            lastProRebuttal, 
            i
          );
          if (!isRunningRef.current) return;
          
          currentRebuttals = {
            ...currentRebuttals,
            con_rebuttals: [...currentRebuttals.con_rebuttals, conTurn]
          };
          await waitAndType(TYPING_DELAY);
          if (!isRunningRef.current) return;

          setState(prev => ({ ...prev, rebuttals: currentRebuttals }));
          await delay(READING_DELAY); // Rebuttal reading time
          await checkpoint();
          if (!isRunningRef.current) return;

          // --- Pro Turn ---
          const lastConRebuttal = currentRebuttals.con_rebuttals[i];
          const proTurn = await orchestrator.proRebuttal.generateRebuttalTurn(
            combinedArgs, 
            state.evidenceBoard!, 
            language, 
            currentRebuttals, 
            lastConRebuttal, 
            i
          );
          if (!isRunningRef.current) return;

          currentRebuttals = {
             ...currentRebuttals,
             pro_rebuttals: [...currentRebuttals.pro_rebuttals, proTurn]
          };
          await waitAndType(TYPING_DELAY);
          if (!isRunningRef.current) return;

          setState(prev => ({ ...prev, rebuttals: currentRebuttals }));
          await delay(READING_DELAY); // Rebuttal reading time
          await checkpoint();
          if (!isRunningRef.current) return;
        }

        setState(prev => ({ ...prev, status: 'analyzing' }));
        await delay(3000);
        if (!isRunningRef.current) return;

        // 7. Meta Analysis
        const analysis = await orchestrator.metaAnalyst.analyzeDebate(
          state.framedIssue!, 
          state.evidenceBoard!, 
          combinedArgs, 
          currentRebuttals, 
          combinedCX, 
          language
        );
        if (!isRunningRef.current) return;

        setState(prev => ({ ...prev, analysis, status: 'complete' }));
        setStepReady(false);
        setIsPaused(false);
        
      } catch (err: any) {
        if (!isRunningRef.current) return;
        console.error(err);
        setState(prev => ({ ...prev, status: 'error', error: err.message || "An error occurred during the debate simulation." }));
      }
  };

  const handleFollowUp = async (topic: string) => {
    if (!topic.trim() || !state.framedIssue || !state.evidenceBoard) return;

    isRunningRef.current = true;
    setState(prev => ({ ...prev, isGeneratingRound: true }));

    // 1. Immediately push the "Question" round to the state with empty answers
    const tempRound: DebateRound = {
      id: `qa-${Date.now()}`,
      type: 'qa',
      focusTopic: topic,
      qa_response: {}, // Empty initially
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      additionalRounds: [...prev.additionalRounds, tempRound]
    }));

    try {
      // 2. Fetch the data in background
      const roundData = await orchestrator.conductFollowUpRound(
        state.framedIssue,
        state.evidenceBoard,
        language,
        topic
      );
      if (!isRunningRef.current) return;

      const proAnswer = roundData.qa_response?.pro_answer;
      const conAnswer = roundData.qa_response?.con_answer;

      // 3. Pro Side Typing & Reveal
      await waitAndType(TYPING_DELAY);
      if (!isRunningRef.current) return;

      // Update state with Pro Answer
      setState(prev => {
        const rounds = [...prev.additionalRounds];
        const lastIndex = rounds.length - 1;
        rounds[lastIndex] = {
           ...rounds[lastIndex],
           qa_response: { ...rounds[lastIndex].qa_response, pro_answer: proAnswer }
        };
        return { ...prev, additionalRounds: rounds };
      });
      await delay(READING_DELAY);

      // 4. Con Side Typing & Reveal
      await waitAndType(TYPING_DELAY);
      if (!isRunningRef.current) return;

      // Update state with Con Answer
      setState(prev => {
        const rounds = [...prev.additionalRounds];
        const lastIndex = rounds.length - 1;
        rounds[lastIndex] = {
           ...rounds[lastIndex],
           qa_response: { ...rounds[lastIndex].qa_response, con_answer: conAnswer }
        };
        return { ...prev, additionalRounds: rounds };
      });

      setState(prev => ({ ...prev, isGeneratingRound: false }));

    } catch (err: any) {
      if (!isRunningRef.current) return;
      console.error(err);
      setState(prev => ({ ...prev, isGeneratingRound: false, error: err.message }));
    }
  };

  const reset = () => {
    // Abort active operations
    isRunningRef.current = false;
    
    setState({
      status: 'idle',
      originalTopic: '',
      framedIssue: null,
      framingChat: [],
      evidenceBoard: null,
      sectorStatuses: SECTORS.reduce((acc, sector) => ({ ...acc, [sector]: 'pending' }), {} as Record<Sector, SectorStatus>),
      arguments: null,
      rebuttals: null,
      crossExam: null,
      analysis: null,
      additionalRounds: [],
      isGeneratingRound: false,
      isTyping: false
    });
    setVisibleEvidence([]);
    setIsPaused(false);
    setStepReady(false);
    setIsAutoPlay(false);
  };

  return {
    state,
    setState,
    researchStatus,
    visibleEvidence,
    isAutoPlay,
    isPaused,
    stepReady,
    actions: {
      startSimulation,
      handleRefineIssue,
      handleStartResearch,
      handleStartDebate,
      handleFollowUp,
      reset,
      toggleAutoPlay: () => setIsAutoPlay(!isAutoPlay),
      togglePause: () => setIsPaused(!isPaused),
      triggerNext: () => { nextStepTrigger.current = () => {}; }
    }
  };
};