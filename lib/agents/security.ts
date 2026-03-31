import Groq from "groq-sdk";

export const SECURITY_SYSTEM_PROMPT = `You are an expert security engineer performing a code review.
Your ONLY job is to identify security vulnerabilities in the provided code diff.

Focus on:
- Injection vulnerabilities (SQL, command, LDAP, XPath)
- XSS (Cross-Site Scripting)
- Authentication & authorization flaws
- Sensitive data exposure (API keys, passwords, PII)
- Insecure direct object references
- Security misconfigurations
- Cryptographic issues
- Input validation failures
- Path traversal vulnerabilities
- Dependency vulnerabilities

Format your response as:
## Security Review

**Risk Level:** [CRITICAL | HIGH | MEDIUM | LOW | NONE]

### Issues Found
For each issue:
- **[SEVERITY]** Description of the vulnerability
  - Location: file/line if apparent
  - Impact: what could go wrong
  - Fix: specific recommendation

### Summary
Brief overall security assessment.

If no issues found, state "No security vulnerabilities detected" with brief justification.`;

export async function runSecurityAgent(
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
      { role: "system", content: SECURITY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Please review the following code diff for security vulnerabilities:\n\n\`\`\`diff\n${diff}\n\`\`\``,
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
