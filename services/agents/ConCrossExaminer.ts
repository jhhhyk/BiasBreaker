import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, ProConArguments, EvidenceBoard } from "../../types";

export class ConCrossExaminer extends BaseAgent {
  async conductCrossExam(
    args: ProConArguments, 
    evidence: EvidenceBoard, 
    language: Language,
    focusTopic?: string
  ): Promise<{ con_questions: string[], pro_answers: string[] }> {
    const langInstruction = this.getLangInstruction(language);
    const focusInstruction = focusTopic ? `<focus>\nFocus questioning on: "${focusTopic}".\n</focus>` : '';

    const systemPrompt = `###Instruction###
<role>
You are the NEGATIVE CROSS-EXAMINER.
</role>

<style_guidelines>
1. **NO POLITE FILLERS**: Remove "Thank you," "Could you please," "I appreciate that."
2. **QUESTIONS**: Short, aggressive, demand-verification questions.
   - Example: "You claimed X. What is your source?" or "Does evidence Y not contradict your claim?"
3. **ANSWERS**: Defensive, short, factual. No evasion rhetoric.
</style_guidelines>

<task>
1. Generate **1 to 2** critical questions probing logical fallacies.
2. Simulate the Affirmative's answers.
</task>

<constraints>
- Max 2 questions.
- Keep output concise.
</constraints>

${focusInstruction}
${langInstruction}
`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        con_questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Direct questions (Max 2)" },
        pro_answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Direct answers" },
      },
      required: ["con_questions", "pro_answers"],
    };

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Input Data###\nAffirmative Speech: ${JSON.stringify(args.pro_speech)}\nEvidence: ${JSON.stringify(evidence.evidence_board)}`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: schema },
      });
      return JSON.parse(response.text!);
    });
  }
}