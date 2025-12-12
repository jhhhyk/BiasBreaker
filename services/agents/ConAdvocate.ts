import { BaseAgent } from "../baseAgent";
import { Type, Schema } from "@google/genai";
import { Language, FramedIssue, EvidenceBoard, ConstructiveSpeech } from "../../types";

export class ConAdvocate extends BaseAgent {
  async generateArguments(
    framedIssue: FramedIssue, 
    evidence: EvidenceBoard, 
    language: Language,
    focusTopic?: string
  ): Promise<{ con_speech: ConstructiveSpeech }> {
    const langInstruction = this.getLangInstruction(language);
    const focusInstruction = focusTopic ? `<focus>\nThe user has asked specifically about: "${focusTopic}". Tailor your constructive speech to address this angle.\n</focus>` : '';

    // Updated to strict CEDA Constructive Speech Structure with Gaejo-style constraints
    const systemPrompt = `###Instruction###
<role>
You are the NEGATIVE CONSTRUCTIVE SPEAKER.
Your goal is to convey logic and evidence as efficiently as possible.
</role>

<style_guidelines>
1. **NO RHETORIC**: ABSOLUTELY FORBIDDEN to use phrases like "Honorable judges," "Ladies and gentlemen," "My worthy opponent," or "I humbly submit."
2. **CONCISE & DIRECT**: Use a "Gaejo-style" (Outline/Bullet-point) format.
   - Example (Korean): "~함.", "~임.", "~것으로 판단됨." ending style.
   - Example (English): Direct statements. "The plan fails because X." instead of "We would like to argue that the plan fails..."
3. **STRUCTURED OUTPUT**:
   - **Claim**: One clear sentence.
   - **Reasoning**: Logical steps in numbered list or bullet points.
   - **Impact**: The direct negative consequence.
</style_guidelines>

<structure_requirements>
1. **Introduction:**
   - **Definitions**: Accept or Reject definitions concisely.
   - **Value Criterion**: State the counter-standard directly.
   - **Roadmap**: List arguments briefly.

2. **Body (Contentions):**
   - **Claim**: Direct assertion (Disadvantage or Counter-plan).
   - **Reasoning**: Logical connection between Evidence and Claim.
   - **Evidence**: Cite specific IDs.

3. **Conclusion:**
   - **Summary**: Recap main points in 1 sentence.
   - **Final Appeal**: One strong final impact statement.
</structure_requirements>

<constraints>
- Eliminate all conversational fillers.
- Focus strictly on logic and data.
- Strictly follow the JSON schema.
</constraints>

${focusInstruction}
${langInstruction}
`;

    const speechSchema: Schema = {
       type: Type.OBJECT,
       properties: {
         con_speech: {
           type: Type.OBJECT,
           properties: {
             introduction: {
               type: Type.OBJECT,
               properties: {
                 hook: { type: Type.STRING, description: "One striking fact or counter-point (No greeting)" },
                 definitions: { type: Type.STRING, description: "Concise definitions" },
                 value_criterion: { type: Type.STRING, description: "The standard for judgment" },
                 roadmap: { type: Type.STRING, description: "Numbered list of arguments" },
               },
               required: ["definitions", "value_criterion", "roadmap"]
             },
             contentions: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   signpost: { type: Type.STRING, description: "e.g. Point 1, Point 2" },
                   claim: { type: Type.STRING, description: "Direct assertion" },
                   reasoning: { type: Type.STRING, description: "Logic explaining the claim (concise)" },
                   evidence_id: { type: Type.ARRAY, items: { type: Type.STRING } },
                   sector: { type: Type.STRING, enum: ["경제적", "사회적", "정치적", "윤리적", "법제도", "집단별"] }
                 },
                 required: ["signpost", "claim", "reasoning", "evidence_id", "sector"]
               }
             },
             conclusion: {
               type: Type.OBJECT,
               properties: {
                 summary: { type: Type.STRING, description: "One sentence recap" },
                 final_appeal: { type: Type.STRING, description: "Final impact statement" }
               },
               required: ["summary", "final_appeal"]
             }
           },
           required: ["introduction", "contentions", "conclusion"]
         }
       },
       required: ["con_speech"]
    };

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Input Data###\nResolution: ${framedIssue.refined_issue}\nEvidence: ${JSON.stringify(evidence.evidence_board)}`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: speechSchema },
      });
      return JSON.parse(response.text!);
    });
  }

  async answerUserQuestion(
    framedIssue: FramedIssue,
    evidence: EvidenceBoard,
    language: Language,
    question: string
  ): Promise<{ answer: string }> {
    const langInstruction = this.getLangInstruction(language);

    const systemPrompt = `###Instruction###
<role>
You are the NEGATIVE (CON) SPEAKER.
Your core objective is to OPPOSE the Resolution: "${framedIssue.refined_issue}".
</role>

<stance_enforcement>
1. **NEVER CONCEDE**: Even if the user's point is valid or generally true, you MUST pivot back to your stance.
2. **"YES, BUT" LOGIC**: Acknowledge the user's point briefly, then immediately counter it with a "However" or "The real issue is" argument that supports the CON side.
   - Example: "While that might sound appealing, **in reality**, such a policy leads to disastrous unintended consequences..."
3. **USE EVIDENCE**: Connect your answer to the existing evidence IDs provided.
</stance_enforcement>

<style_guidelines>
1. **NO RHETORIC**: No greetings, no "Thank you for asking."
2. **FORMAT**: Start directly with the counter-argument/answer. Use bullet points if complex.
3. **TONE**: Skeptical, analytical, firm.
</style_guidelines>

<task>
1. Answer the user's question.
2. If the user attacks you, defend aggressively.
3. If the user supports you, amplify the risk of the Pro plan.
4. Keep it under 150 words.
</task>

${langInstruction}
`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING, description: "Direct answer maintaining CON stance" }
      },
      required: ["answer"]
    };

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `###Context###
Resolution: ${framedIssue.refined_issue}
Con Position: ${framedIssue.positions.con}
Evidence: ${JSON.stringify(evidence.evidence_board)}

###User Question###
"${question}"`,
        config: { systemInstruction: systemPrompt, responseMimeType: "application/json", responseSchema: schema },
      });
      return JSON.parse(response.text!);
    });
  }
}