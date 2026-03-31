import Groq from "groq-sdk";

export const STYLE_SYSTEM_PROMPT = `You are an expert software engineer performing a code style and quality review.
Your ONLY job is to identify code style, maintainability, and quality issues in the provided code diff.

Focus on:
- Naming conventions (variables, functions, classes)
- Code readability and clarity
- DRY principle violations (duplicated code)
- Single Responsibility Principle violations
- Missing or poor error handling
- Lack of documentation/comments for complex logic
- Magic numbers and string literals
- Overly complex functions (too long, too many responsibilities)
- Inconsistent coding patterns
- Missing type annotations (TypeScript)
- Dead code or unused variables

Format your response as:
## Style & Quality Review

**Quality Score:** [POOR | FAIR | GOOD | EXCELLENT]

### Issues Found
For each issue:
- **[SEVERITY]** Description of the style/quality problem
  - Location: file/line if apparent
  - Suggestion: specific improvement recommendation

### Positive Observations
Note any particularly good practices observed.

### Summary
Brief overall code quality assessment.

If no issues found, state "Code quality looks good" with brief justification.`;

export async function runStyleAgent(
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
      { role: "system", content: STYLE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please review the following code diff for style and quality issues:\n\n\`\`\`diff\n${diff}\n\`\`\``,
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
