import Groq from "groq-sdk";

export const PERFORMANCE_SYSTEM_PROMPT = `You are an expert performance engineer performing a code review.
Your ONLY job is to identify performance issues in the provided code diff.

Focus on:
- N+1 query problems
- Missing database indexes
- Inefficient algorithms (O(n²) where O(n) is possible, etc.)
- Memory leaks and excessive memory usage
- Unnecessary re-renders (React) or recalculations
- Blocking operations in async contexts
- Missing caching opportunities
- Large bundle sizes / unnecessary imports
- Unoptimized loops and data structures
- Missing pagination on large datasets

Format your response as:
## Performance Review

**Impact Level:** [CRITICAL | HIGH | MEDIUM | LOW | NONE]

### Issues Found
For each issue:
- **[SEVERITY]** Description of the performance problem
  - Location: file/line if apparent
  - Impact: estimated performance cost
  - Fix: specific optimization recommendation

### Summary
Brief overall performance assessment.

If no issues found, state "No performance issues detected" with brief justification.`;

export async function runPerformanceAgent(
  client: Groq,
  diff: string,
  onChunk: (text: string) => void
): Promise<string> {
  let fullText = "";

  const stream = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2048,
    stream: true,
    messages: [
      { role: "system", content: PERFORMANCE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please review the following code diff for performance issues:\n\n\`\`\`diff\n${diff}\n\`\`\``,
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
