import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, ProConArguments, EvidenceBoard, RebuttalSet } from "../../types";

export class RebuttalEngine extends BaseAgent {
  async generateRebuttals(
    args: ProConArguments, 
    evidence: EvidenceBoard, 
    language: Language,
    focusTopic?: string
  ): Promise<RebuttalSet> {
    const langInstruction = this.getLangInstruction(language);
    const focusInstruction = focusTopic ? `<focus>\nThese arguments were generated in response to the topic: "${focusTopic}". Ensure rebuttals address this specific context.\n</focus>` : '';
    
    // Applied Principles: CEDA Format (Rebuttal Phase), No new constructive args, Impact Calculus
    const systemPrompt = `###Instruction###
<role>
You are the REBUTTAL SPEAKER ENGINE in a modified CEDA debate.
Your task is to generate the Rebuttal speeches for both sides based on the previous Constructive Speeches.
</role>

<rules>
1. **Negative Rebuttal:** Attack the Affirmative's Contentions and Value Criterion. Defend the Negative's disadvantages.
2. **Affirmative Rebuttal:** Defend the Affirmative case against attacks. Extend the impact of advantages.
3. Do NOT introduce entirely new constructive arguments. Focus on weighing existing contentions.
4. Think step by step to identify logical fallacies in the opponent's case.
</rules>

${focusInstruction}
${langInstruction}
`;
    
    const rebuttalSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        pro_rebuttals: { type: Type.ARRAY, items: this.getItemSchema(), description: "Affirmative Rebuttal points" },
        con_rebuttals: { type: Type.ARRAY, items: this.getItemSchema(), description: "Negative Rebuttal points" },
      },
      required: ["pro_rebuttals", "con_rebuttals"],
    };

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Input Data###\nEvidence: ${JSON.stringify(evidence.evidence_board)}\nConstructive Speeches: ${JSON.stringify(args)}`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: rebuttalSchema },
      });
      return JSON.parse(response.text!);
    });
  }

  private getItemSchema(): Schema {
    return {
      type: Type.OBJECT,
      properties: {
        target_claim: { type: Type.STRING },
        sector: { type: Type.STRING },
        rebuttal: { type: Type.STRING },
        evidence_used: { type: Type.ARRAY, items: { type: Type.STRING } },
        logical_issue_identified: { type: Type.STRING },
      },
      required: ["target_claim", "sector", "rebuttal", "evidence_used", "logical_issue_identified"],
    };
  }
}