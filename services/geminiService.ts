import { IssueFramer } from "./agents/IssueFramer";
import { NeutralResearcher } from "./agents/NeutralResearcher";
import { ProAdvocate } from "./agents/ProAdvocate";
import { ConAdvocate } from "./agents/ConAdvocate";
import { ProRebuttal } from "./agents/ProRebuttal";
import { ConRebuttal } from "./agents/ConRebuttal";
import { ProCrossExaminer } from "./agents/ProCrossExaminer";
import { ConCrossExaminer } from "./agents/ConCrossExaminer";
import { MetaAnalyst } from "./agents/MetaAnalyst";
import { DebateRound, FramedIssue, EvidenceBoard, Language, RebuttalSet } from "../types";

// --- Orchestrator ---
export class DebateOrchestrator {
  public issueFramer = new IssueFramer();
  public neutralResearcher = new NeutralResearcher();
  public proAdvocate = new ProAdvocate();
  public conAdvocate = new ConAdvocate();
  // Split Rebuttal Agents
  public proRebuttal = new ProRebuttal();
  public conRebuttal = new ConRebuttal();
  // Split Cross-Exam Agents
  public proCrossExaminer = new ProCrossExaminer();
  public conCrossExaminer = new ConCrossExaminer();
  
  public metaAnalyst = new MetaAnalyst();

  async conductFollowUpRound(
    framedIssue: FramedIssue,
    evidence: EvidenceBoard,
    language: Language,
    focusTopic: string
  ): Promise<DebateRound> {
    
    // Run Pro and Con answers in parallel for efficiency
    const [proRes, conRes] = await Promise.all([
      this.proAdvocate.answerUserQuestion(framedIssue, evidence, language, focusTopic),
      this.conAdvocate.answerUserQuestion(framedIssue, evidence, language, focusTopic)
    ]);

    return {
      id: `qa-${Date.now()}`,
      type: 'qa',
      focusTopic,
      qa_response: {
        pro_answer: proRes.answer,
        con_answer: conRes.answer
      },
      timestamp: Date.now()
    };
  }
}

export const orchestrator = new DebateOrchestrator();