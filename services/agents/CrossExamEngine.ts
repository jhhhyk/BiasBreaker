import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, ProConArguments, EvidenceBoard, CrossExamSet } from "../../types";

export class CrossExamEngine extends BaseAgent {
  async conductCrossExam(
    args: ProConArguments, 
    evidence: EvidenceBoard, 
    language: Language,
    focusTopic?: string
  ): Promise<CrossExamSet> {
    const langInstruction = this.getLangInstruction(language);
    const focusInstruction = focusTopic ? `<focus>\nConduct cross-examination specifically regarding the topic: "${focusTopic}".\n</focus>` : '';

    // Applied Principles: CEDA Format (CX Periods), Role Playing, Natural Language
    const systemPrompt = `###Instruction###
<role>
You are the CROSS-EXAMINATION ENGINE in a modified CEDA debate.
Your task is to simulate the questioning periods that follow the Constructive speeches.
</role>

<directives>
1. **Cross-Exam 1 (Con -> Pro):** The Negative speaker questions the Affirmative speaker to clarify their Constructive arguments, expose logical fallacies, or demand evidence.
2. **Cross-Exam 2 (Pro -> Con):** The Affirmative speaker questions the Negative speaker to clarify their Constructive arguments, expose logical fallacies, or demand evidence.
3. Pro MUST ask 3-5 critical questions to Con.
4. Con MUST ask 3-5 critical questions to Pro.
5. Provide sharp, direct answers for each question based on the established context and evidence.
6. Ensure the dialogue sounds natural, human-like, and rigorous (Principle 11).
</directives>

${focusInstruction}
${langInstruction}
`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        pro_questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Questions asked BY Pro TO Con" },
        con_answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Answers BY Con TO Pro's questions" },
        con_questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Questions asked BY Con TO Pro" },
        pro_answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Answers BY Pro TO Con's questions" },
      },
      required: ["pro_questions", "con_answers", "con_questions", "pro_answers"],
    };

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Input Data###\nConstructive Arguments: ${JSON.stringify(args)}\nEvidence: ${JSON.stringify(evidence.evidence_board)}`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: schema },
      });
      return JSON.parse(response.text!);
    });
  }
}