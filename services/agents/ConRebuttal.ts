import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, ProConArguments, EvidenceBoard, RebuttalItem, RebuttalSet } from "../../types";

export class ConRebuttal extends BaseAgent {
  async generateRebuttalTurn(
    args: ProConArguments, 
    evidence: EvidenceBoard, 
    language: Language,
    history: RebuttalSet,
    lastOpponentRebuttal: RebuttalItem | null,
    turnIndex: number,
    focusTopic?: string
  ): Promise<RebuttalItem> {
    const langInstruction = this.getLangInstruction(language);
    const focusInstruction = focusTopic ? `<focus>\nAddress topic: "${focusTopic}".\n</focus>` : '';
    
    const contextPrompt = lastOpponentRebuttal 
      ? `###IMMEDIATE CONTEXT###\nOpponent Argued: "${lastOpponentRebuttal.rebuttal}".\nLogic Issue: "${lastOpponentRebuttal.logical_issue_identified}".\nTask: Defend specifically against this point.`
      : `###IMMEDIATE CONTEXT###\nStart of rebuttal phase. No attack to defend yet.`;

    const systemPrompt = `###Instruction###
<role>
You are the NEGATIVE REBUTTAL SPEAKER.
</role>

<style_guidelines>
1. **NO RHETORIC**: Remove "My opponent claims," "We firmly disagree," etc. Start immediately with the logic.
2. **CONCISE**: Use short, punchy sentences or bullet points.
3. **FORMAT**:
   - **Defense**: "[Logic/Evidence] -> Refutes attack."
   - **Rebuttal**: "[Weakness in Pro] -> [Impact]."
</style_guidelines>

<rules>
1. **Defense**: Directly answer the opponent's last rebuttal. Explain WHY it fails concisely.
2. **Rebuttal**: Attack a new/critical point from Affirmative Constructive.
3. Use specific evidence IDs.
</rules>

${focusInstruction}
${langInstruction}
`;
    
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        rebuttal_item: { 
            type: Type.OBJECT,
            properties: {
                target_claim: { type: Type.STRING, description: "The claim from Aff Constructive you are attacking" },
                sector: { type: Type.STRING },
                defense: { type: Type.STRING, description: "Direct logical defense (concise)" },
                rebuttal: { type: Type.STRING, description: "Direct counter-attack (concise)" },
                evidence_used: { type: Type.ARRAY, items: { type: Type.STRING } },
                logical_issue_identified: { type: Type.STRING },
            },
            required: ["target_claim", "sector", "defense", "rebuttal", "evidence_used", "logical_issue_identified"]
        },
      },
      required: ["rebuttal_item"],
    };

    return this.retryOperation(async () => {
      const historySummary = history.con_rebuttals.map(r => `Attacked: ${r.target_claim}`).join("; ");

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Input Data###
Evidence: ${JSON.stringify(evidence.evidence_board)}
Constructive Speeches: ${JSON.stringify(args)}
Past My Attacks: ${historySummary}
${contextPrompt}`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: schema },
      });
      
      const parsed = JSON.parse(response.text!);
      return parsed.rebuttal_item;
    });
  }
}