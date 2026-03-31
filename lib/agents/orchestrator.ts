import Groq from "groq-sdk";

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are a senior principal engineer synthesizing a comprehensive code review.
You have received specialist reports from three sub-agents: Security, Performance, and Style reviewers.

Your job is to:
1. Synthesize their findings into a unified, prioritized review
2. Resolve any conflicts or overlaps between reports
3. Provide clear, actionable recommendations in priority order
4. Give an overall verdict on whether the PR should be approved

Format your response as:
## Final Code Review

### Overall Verdict
**[APPROVE ✅ | REQUEST CHANGES ⚠️ | REJECT ❌]**

Brief 1-2 sentence executive summary.

### Priority Action Items
Ordered from most to least critical:
1. **[CRITICAL/HIGH/MEDIUM/LOW]** ...
2. ...

### Must Fix Before Merge
List only the blocking issues (if any).

### Should Fix (Non-blocking)
List important but non-blocking improvements.

### Nice to Have
Optional improvements for future consideration.

### What's Working Well
Positive observations from the review.

---
*Review completed by 3 specialized sub-agents: Security Analyzer, Performance Analyzer, and Style Analyzer*`;

export async function runOrchestratorAgent(
  client: Groq,
  securityReport: string,
  performanceReport: string,
  styleReport: string,
  diff: string,
  onChunk: (text: string) => void
): Promise<string> {
  let fullText = "";

  const stream = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 3000,
    stream: true,
    messages: [
      { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please synthesize the following sub-agent reports into a final code review.

## Original Code Diff
\`\`\`diff
${diff.slice(0, 3000)}${diff.length > 3000 ? "\n... (truncated for brevity)" : ""}
\`\`\`

## Security Sub-Agent Report
${securityReport}

## Performance Sub-Agent Report
${performanceReport}

## Style & Quality Sub-Agent Report
${styleReport}`,
      },
    ],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}
