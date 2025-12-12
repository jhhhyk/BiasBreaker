
import { BaseAgent, extractJSON } from "../baseAgent";
import { Language, FramedIssue, ChatMessage, IssueRefinement } from "../../types";

export class IssueFramer extends BaseAgent {
  async frameIssue(userTopic: string, language: Language): Promise<FramedIssue> {
    const langInstruction = this.getLangInstruction(language);
    
    // Applied Principles: Structure with XML tags, Role, Constraints, Bias check
    const systemPrompt = `###Instruction###
<role>
You are an expert Political Analyst acting as an ISSUE FRAMER.
Your goal is to eliminate ambiguity and frame the user's input into a precise, neutral research question suitable for a rigorous debate.
</role>

<task>
1. Use Google Search to understand the specific context, definitions, and recent events related to the "User Topic".
2. Formulate a neutral 'definition' of the topic.
3. Rewrite the topic into a precise evaluative question ('refined_issue').
4. Specify the scope (country, timeframe).
5. Clearly define the core stance for both the Affirmative (Pro) and Negative (Con) sides based on the defined issue.
</task>

<constraints>
- You MUST ensure your definition is unbiased and does not rely on stereotypes.
- You will be penalized if the 'refined_issue' favors one side.
- Output MUST be valid JSON only.
</constraints>

<output_format>
JSON object with keys: 
- "refined_issue": string
- "definition": string
- "scope": { "country": string, "timeframe": string }
- "positions": { "pro": string, "con": string }
- "clarification_needed": boolean
</output_format>

${langInstruction}
`;

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `User Topic: ${userTopic}`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemPrompt,
        },
      });

      return extractJSON<FramedIssue>(response.text || "");
    });
  }

  async refineIssue(
    history: ChatMessage[], 
    currentDraft: FramedIssue, 
    language: Language
  ): Promise<IssueRefinement> {
    const langInstruction = this.getLangInstruction(language);
    
    // Applied Principles: Interactive conversation, XML structure, Think step by step
    const systemPrompt = `###Instruction###
<role>
You are a DEBATE CONSULTANT.
Your task is to help the user refine their debate topic to be clear, neutral, and debate-worthy.
</role>

<process>
1. Think step by step regarding the user's latest input and the chat history.
2. If the user requests a change (e.g., "Make it about USA"), verify context with Google Search and update the 'draft'.
3. If the user asks a question, answer it in the 'message' field.
4. If the user is satisfied, confirm the draft is ready.
5. Always ensure 'positions' (pro and con) are updated to reflect any changes in the topic or scope.
</process>

<constraints>
- You MUST return a JSON object.
- Keep the 'message' natural and helpful.
</constraints>

<output_format>
JSON object with keys: "message", "draft" (matching the FramedIssue structure with positions).
</output_format>

${langInstruction}
`;

    // Convert history to string for context
    const chatContext = history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n');
    const draftContext = JSON.stringify(currentDraft);

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `Current Draft: ${draftContext}\n\nChat History:\n${chatContext}\n\nUser Input: ${history[history.length - 1].text}`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemPrompt,
        },
      });

      return extractJSON<IssueRefinement>(response.text || "");
    });
  }
}