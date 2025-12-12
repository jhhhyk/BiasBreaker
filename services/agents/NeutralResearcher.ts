
import { BaseAgent, extractJSON } from "../baseAgent";
import { Language, FramedIssue, EvidenceBoard, EvidenceItem, Sector } from "../../types";

// InfoQ-4 Raw Metadata Interface
interface ShortEvidence {
  c: string;    // Content (Headline)
  d: string;    // Detail (Specific data with **bolding**)
  src: string;  // Source Name
  u: string;    // URL
  
  // The 4 Pillars of InfoQ (Kenett & Shmueli)
  pub_year: number | null;                // Temporal Relevance
  source_tier: "Tier1" | "Tier2" | "Tier3"; // Reliability (Reputational IQ)
  has_stats: boolean;                     // Resolution (Data Granularity)
  op_fit: "Direct" | "Proxy" | "Weak";    // Contextual Fit (Operationalization)

  // Stakeholder Specific
  st_type?: "Benefit" | "Loss"; 
  st_name?: string;
}

export class NeutralResearcher extends BaseAgent {

  /**
   * Calculates the Geometric Mean of the 4 InfoQ dimensions.
   * Returns both the final score and the detailed breakdown for tooltips.
   */
  private calculateGeometricInfoQ(item: ShortEvidence, sector: Sector): { 
    finalScore: number, 
    breakdown: { objectivity: number, relevance: number, significance: number },
    infoQ: { resolution: number, temporal: number, reliability: number, context: number }
  } {
    const currentYear = new Date().getFullYear();

    // 1. Resolution Score (S_res): Data Granularity
    // Code-side verification: Regex check for digits if has_stats is claimed
    let s_res = 40; // Base for qualitative
    const regexVerified = /\d/.test(item.d);
    
    if (item.has_stats && regexVerified) {
      s_res = 100; // High resolution (Specific numbers)
    } else if (item.has_stats && !regexVerified) {
      s_res = 50; // AI claimed stats but failed regex (Hallucination penalty)
    }

    // 2. Temporal Score (S_temp): Chronology
    // Linear decay: 100 for current/last year, -5 per year gap, floor at 40
    let s_temp = 40;
    if (item.pub_year) {
      const age = currentYear - item.pub_year;
      if (age <= 1) s_temp = 100;
      else if (age <= 3) s_temp = 90;
      else if (age <= 5) s_temp = 80;
      else s_temp = Math.max(40, 80 - (age - 5) * 5);
    }

    // 3. Reliability Score (S_rel): Reputational IQ
    let s_rel = 40;
    if (item.source_tier === "Tier1") s_rel = 100; // Gov, Int'l Org, Academic
    else if (item.source_tier === "Tier2") s_rel = 80; // Major Media
    else s_rel = 40; // Blogs, Minor press

    // 4. Contextual Fit Score (S_ctx): Construct Operationalization
    let s_ctx = 40;
    if (item.op_fit === "Direct") s_ctx = 100; // Measures the exact concept
    else if (item.op_fit === "Proxy") s_ctx = 70; // Measures a related indicator
    else s_ctx = 40; // Weak relation

    // Sector Hard Constraints
    if (sector === "Statistics" && s_res < 80) s_res = 0; // Stats must have numbers
    if (sector === "Theories" && s_rel < 80) s_rel = 0; // Theories must be authoritative

    // Geometric Mean Calculation
    const product = Math.max(1, s_res) * Math.max(1, s_temp) * Math.max(1, s_rel) * Math.max(1, s_ctx);
    const geometricMean = Math.pow(product, 0.25);

    return {
      finalScore: Math.round(geometricMean),
      // Map InfoQ pillars to the Frontend's expected 3-axis format
      breakdown: {
        objectivity: Math.round((s_rel + s_res) / 2), // Reliability + Resolution
        relevance: s_ctx,                             // Operational Fit
        significance: s_temp                          // Recency/Chronology
      },
      // Full InfoQ Breakdown
      infoQ: {
        resolution: s_res,
        temporal: s_temp,
        reliability: s_rel,
        context: s_ctx
      }
    };
  }

  private mapReliabilityLevel(score: number): "High" | "Medium" | "Low" {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  }

  private expandEvidence(shortList: ShortEvidence[], sector: Sector): EvidenceItem[] {
    return shortList.map((item, index) => {
      const { finalScore, breakdown, infoQ } = this.calculateGeometricInfoQ(item, sector);

      // Visual Cues for Stakeholders
      let displayContent = item.c;
      if (sector === "Stakeholders" && item.st_type) {
        const prefix = item.st_type === "Benefit" ? "[🟢 Gain] " : "[🔴 Loss] ";
        displayContent = prefix + item.c;
      }

      return {
        id: `EV-${sector.substring(0, 3).toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
        content: displayContent,
        detail: item.d, 
        sector: sector, 
        source_summary: item.src,
        reliability: this.mapReliabilityLevel(finalScore),
        url: item.u,
        score: finalScore,
        score_breakdown: breakdown,
        info_q_breakdown: infoQ, // Pass specific InfoQ dimensions
        stakeholder_type: item.st_type
      };
    });
  }

  // Helper to generalize topic for broader search
  private async generalizeTopic(issue: string, sector: Sector): Promise<string> {
      if (!["Statistics", "DomesticCases", "InternationalCases", "Theories"].includes(sector)) {
          return issue;
      }

      const prompt = `
      Task: Generalize the political/social topic "${issue}" into a broader category or underlying concept for academic/statistical research.
      Example: "Lee Jae-myung's Real Estate Policy" -> "Land Transaction Permit System effectiveness"
      Output ONLY the generalized topic string. No JSON.
      `;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text?.trim() || issue;
  }

  async conductSectorResearch(
    framedIssue: FramedIssue, 
    sector: Sector, 
    language: Language, 
    existingHeadlines: string[] = []
  ): Promise<EvidenceItem[]> {
    const langInstruction = this.getLangInstruction(language);
    const currentDate = new Date().toISOString().split('T')[0];

    // Determine target count and strategy based on Sector
    let targetCount = 5;
    let specificStrategy = "";
    
    // Generalization Step
    const searchTopic = await this.generalizeTopic(framedIssue.refined_issue, sector);
    const isGeneralized = searchTopic !== framedIssue.refined_issue;

    switch(sector) {
        case "Statistics":
            targetCount = 10;
            specificStrategy = `Find **High-Resolution Statistical Data** related to "${searchTopic}". Prioritize recent census data and economic indicators. Look for trends that refute the idea that the current situation was unavoidable.`;
            break;
        case "PublicOpinion":
            targetCount = 10;
            specificStrategy = `Find **Recent Polls** about "${framedIssue.refined_issue}". Identify the exact polling organization and date.`;
            break;
        case "DomesticCases":
            targetCount = 5;
            specificStrategy = `Find **Historical Counterparts** (Domestic Control Groups). Look for similar situations in previous administrations of ${framedIssue.scope.country} where **different policies** were applied. Did the outcome differ?`;
            break;
        case "InternationalCases":
            targetCount = 3;
            specificStrategy = `Find **International Control Groups**. Identify countries that faced similar conditions to ${framedIssue.scope.country} (e.g. GDP, Demographics) but adopted **different policies**. Compare their outcomes to challenge inevitability.`;
            break;
        case "Theories":
            targetCount = 5;
            specificStrategy = `Find **Economic Counterfactuals** and **Opportunity Costs**. Look for academic theories (SSCI/SCI) that discuss what *would* have happened under alternative models (e.g., Supply-side vs Demand-side).`;
            break;
        case "Stakeholders":
            targetCount = 6;
            specificStrategy = `Identify specific **Interest Groups** affected by "${framedIssue.refined_issue}".
            **MANDATORY**: Classify them as either **Benefit (Gain)** or **Loss (Damage)**.
            `;
            break;
    }

    const avoidanceContext = existingHeadlines.length > 0
      ? `<avoid_duplication>\nDo NOT duplicate:\n${existingHeadlines.map(h => `- ${h}`).join('\n')}\n</avoid_duplication>`
      : '';

    const systemPrompt = `###Instruction###
<role>
You are an EVIDENCE VERIFICATION SPECIALIST implementing the **InfoQ Framework** (Kenett & Shmueli).
Current Date: ${currentDate}
Target Language: ${language}
Target Sector: ${sector}
</role>

<forbidden_sources>
EXCLUDE: Namu Wiki, Wikipedia, Personal Blogs, Reddit, Social Media.
</forbidden_sources>

<visual_bolding>
**IMPORTANT**: In the 'd' (detail) field, you MUST wrap the **single most critical statistic, number, or key phrase** in double asterisks (**). 
Example: "Inflation rose by **3.5%** in Q4."
This helps the user visually identify the core data point immediately.
</visual_bolding>

<counter_inevitability_logic>
If the topic involves a policy failure or crisis, do NOT just report what happened.
SEARCH FOR ALTERNATIVES. Did other countries/times handle it differently?
</counter_inevitability_logic>

<infoq_scoring_protocol>
You must extract 4 raw metadata fields for assessment. DO NOT CALCULATE THE SCORE YOURSELF.

1. **Resolution (has_stats)**:
   - Does the 'detail' contain granular numbers? 
   - true = Quantitative, false = Qualitative.

2. **Chronology (pub_year)**:
   - Extract the 4-digit year of the *data source*.

3. **Reputational IQ (source_tier)**:
   - **Tier1**: Government (.go.kr, .gov), Int'l Orgs (OECD, IMF), Academic Journals.
   - **Tier2**: Major Legacy Media (Chosun, NYT, BBC), Established Think Tanks.
   - **Tier3**: Minor press, Op-eds, Corporate PR.

4. **Construct Operationalization (op_fit)**:
   - **Direct**: Measures the exact concept.
   - **Proxy**: Measures a related indicator.
   - **Weak**: Vague connection.
</infoq_scoring_protocol>

<stakeholder_rule>
If Sector == "Stakeholders", you MUST identify 'st_type' as "Benefit" or "Loss".
</stakeholder_rule>

<task>
1. Search and extract ${targetCount} items.
2. Fill all metadata fields strictly.
3. 'c' (Headline) must be under 50 chars.
</task>

<strategy>
${specificStrategy}
</strategy>

${avoidanceContext}

<json_formatting_rules>
1. Output valid JSON only.
2. No double quotes inside strings.
</json_formatting_rules>

<output_format>
JSON object:
{
  "data": [
    { 
      "c": "Short Headline (Max 50 chars)", 
      "d": "Details with **bolded key stats**.", 
      "src": "Source Name", 
      "u": "URL",
      "pub_year": 2024,
      "source_tier": "Tier1" | "Tier2" | "Tier3",
      "has_stats": boolean,
      "op_fit": "Direct" | "Proxy" | "Weak",
      "st_type": "Benefit" | "Loss" (Only for Stakeholders, else null)
    }
  ]
}
</output_format>

${langInstruction}
`;

    return this.retryOperation(async () => {
      const taskPrompt = `###Topic###
Original Issue: ${framedIssue.refined_issue}
Search Concept: ${searchTopic} (${isGeneralized ? 'Generalized' : 'Specific'})

###Task###
Find exactly ${targetCount} high-quality items for sector: ${sector}.
`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: taskPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemPrompt,
          temperature: 0.1, 
        },
      });

      const text = response.text || "";
      let extractedData;
      try {
        extractedData = extractJSON<{ data: ShortEvidence[] }>(text);
      } catch (e) {
        console.warn(`JSON parsing failed for sector ${sector}.`, text.substring(0, 100));
        return [];
      }

      if (!extractedData || !extractedData.data) return [];

      // Expand to EvidenceItems (Calculates Geometric InfoQ Score)
      const evidenceItems = this.expandEvidence(extractedData.data, sector);

      // Filter: Only keep items with Geometric Score >= 60
      const highQualityData = evidenceItems.filter(item => 
        item.url && item.url.startsWith('http') && 
        item.detail && item.detail.length > 10 &&
        (item.score || 0) >= 60 
      );

      return highQualityData.slice(0, targetCount);
    });
  }

  async conductResearch(framedIssue: FramedIssue, language: Language): Promise<EvidenceBoard> {
    return { evidence_board: [] };
  }
}
