
import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, FramedIssue, EvidenceBoard, ProConArguments, RebuttalSet, CrossExamSet, MetaAnalysis } from "../../types";

export class MetaAnalyst extends BaseAgent {
  async analyzeDebate(
    framedIssue: FramedIssue,
    evidence: EvidenceBoard,
    args: ProConArguments,
    rebuttals: RebuttalSet,
    crossExam: CrossExamSet,
    language: Language
  ): Promise<MetaAnalysis> {
    const langInstruction = this.getLangInstruction(language);
    
    // Applied Principles: Structure with XML tags, Audience focus, Unbiased Requirement, Step by step
    const systemPrompt = `###Instruction###
<role>
You are the META-ANALYST (REFEREE).
Your task is to synthesize the entire debate for a neutral audience seeking to overcome confirmation bias.
</role>

<steps>
1. Analyze the issue, evidence, arguments, rebuttals, and cross-examination.
2. Think step by step to identify major agreements and disagreements.
3. **Sector Analysis**: For each sector, identify specific "AnalysisPoints". 
   - For each point, summarize the **Pro argument**, the **Con argument**, and the **Rebuttal/Clash** that occurred during the debate.
4. Evaluate the quality of evidence objectively.
5. Ensure your evaluation is unbiased and avoids relying on stereotypes.
6. Generate "reflection_prompts" that challenge the user to think critically about their own bias.
</steps>

<language_requirement>
CRITICAL: You MUST write all textual values (descriptions, summaries, arguments, prompts) in the language specified below. 
This must match the language the user started the simulation with.
Current Target Language: ${language}
</language_requirement>

${langInstruction}
`;

    const analysisPointSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        issue: { type: Type.STRING, description: "The specific sub-issue or topic of contention" },
        pro_argument: { type: Type.STRING, description: "Summary of the Affirmative's position on this specific issue" },
        con_argument: { type: Type.STRING, description: "Summary of the Negative's position on this specific issue" },
        rebuttal_note: { type: Type.STRING, description: "Summary of how this point was contested or rebutted during the debate" }
      },
      required: ["issue", "pro_argument", "con_argument", "rebuttal_note"]
    };

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        issue_map: {
          type: Type.OBJECT,
          properties: {
             "Statistics": { type: Type.ARRAY, items: analysisPointSchema },
             "PublicOpinion": { type: Type.ARRAY, items: analysisPointSchema },
             "DomesticCases": { type: Type.ARRAY, items: analysisPointSchema },
             "InternationalCases": { type: Type.ARRAY, items: analysisPointSchema },
             "Theories": { type: Type.ARRAY, items: analysisPointSchema },
             "Stakeholders": { type: Type.ARRAY, items: analysisPointSchema },
          }
        },
        evidence_evaluation: {
          type: Type.OBJECT,
          properties: { description: { type: Type.STRING }, score: { type: Type.NUMBER } },
          required: ["description", "score"],
        },
        key_agreements: { type: Type.ARRAY, items: { type: Type.STRING } },
        key_disagreements: { type: Type.ARRAY, items: { type: Type.STRING } },
        uncertainties: { type: Type.ARRAY, items: { type: Type.STRING } },
        reflection_prompts: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["issue_map", "evidence_evaluation", "key_agreements", "key_disagreements", "uncertainties", "reflection_prompts"],
    };

    const context = `###Debate Data###\nIssue: ${JSON.stringify(framedIssue)}\nEvidence: ${JSON.stringify(evidence.evidence_board)}\nArguments: ${JSON.stringify(args)}\nRebuttals: ${JSON.stringify(rebuttals)}\nCross Exam: ${JSON.stringify(crossExam)}`;

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: context,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: schema },
      });
      return JSON.parse(response.text!);
    });
  }
}
