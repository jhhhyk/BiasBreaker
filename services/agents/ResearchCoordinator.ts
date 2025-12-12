
import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, FramedIssue, ProConArguments, ResearchRequest, EvidenceBoard } from "../../types";

export class ResearchCoordinator extends BaseAgent {
  async generateResearchQueries(
    framedIssue: FramedIssue,
    args: ProConArguments,
    currentEvidence: EvidenceBoard,
    language: Language
  ): Promise<ResearchRequest> {
    const langInstruction = this.getLangInstruction(language);

    const systemPrompt = `###Instruction###
<role>
You are the DEBATE STRATEGIST and RESEARCH COORDINATOR.
We are in the middle of a debate. Constructive speeches and cross-examinations have finished.
Before the Rebuttal phase begins, both the Pro and Con agents need ONE critical piece of NEW evidence to strengthen their attacks or fill gaps.
</role>

<task>
1. Analyze the Pro and Con Constructive Arguments.
2. Identify a "weakness" or "missing data point" for the Pro side to attack Con (or defend themselves).
3. Identify a "weakness" or "missing data point" for the Con side to attack Pro (or defend themselves).
4. Formulate a specific search query and select the most relevant sector for each side.
5. The query MUST be distinct from existing evidence.
</task>

<constraints>
- Return exactly one query for Pro and one for Con.
- Queries must be specific.
- Reasoning should explain why this data is needed for the rebuttal.
</constraints>

${langInstruction}
`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        pro_query: { type: Type.STRING, description: "Search query for Pro agent" },
        pro_sector: { type: Type.STRING, enum: ["Statistics", "PublicOpinion", "DomesticCases", "InternationalCases", "Theories", "Stakeholders"] },
        con_query: { type: Type.STRING, description: "Search query for Con agent" },
        con_sector: { type: Type.STRING, enum: ["Statistics", "PublicOpinion", "DomesticCases", "InternationalCases", "Theories", "Stakeholders"] },
        reasoning: { type: Type.STRING, description: "Why these queries are needed" }
      },
      required: ["pro_query", "pro_sector", "con_query", "con_sector", "reasoning"]
    };

    // Summarize existing evidence to avoid duplicates
    const evidenceSummary = currentEvidence.evidence_board.map(e => `- [${e.sector}] ${e.content}`).join("\n");

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Debate Context###
Resolution: ${framedIssue.refined_issue}
Pro Arguments: ${JSON.stringify(args.pro_speech.contentions)}
Con Arguments: ${JSON.stringify(args.con_speech.contentions)}

###Existing Evidence###
${evidenceSummary}
`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: schema },
      });
      return JSON.parse(response.text!);
    });
  }
}
