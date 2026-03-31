import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { runSecurityAgent } from "@/lib/agents/security";
import { runPerformanceAgent } from "@/lib/agents/performance";
import { runStyleAgent } from "@/lib/agents/style";
import { runOrchestratorAgent } from "@/lib/agents/orchestrator";
import { fetchGitHubPRDiff, parseGitHubPRUrl } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 120;

// SSE helper
function createSSEMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const { prUrl, diffText, githubToken } = await request.json();

  if (!prUrl && !diffText) {
    return new Response(JSON.stringify({ error: "Provide a PR URL or diff text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Groq({ apiKey });

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(createSSEMessage(event, data)));
      };

      try {
        // Step 1: Get the diff
        let diff: string;
        let prMeta = { title: "", author: "", description: "" };

        if (prUrl) {
          const parsed = parseGitHubPRUrl(prUrl);
          if (!parsed) {
            send("error", { message: "Invalid GitHub PR URL format" });
            controller.close();
            return;
          }

          send("status", { message: "Fetching PR from GitHub...", stage: "fetch" });

          try {
            const prInfo = await fetchGitHubPRDiff(
              parsed.owner,
              parsed.repo,
              parsed.prNumber,
              githubToken || process.env.GITHUB_TOKEN
            );
            diff = prInfo.diff;
            prMeta = {
              title: prInfo.title,
              author: prInfo.author,
              description: prInfo.description,
            };
            send("pr_meta", prMeta);
          } catch (err) {
            send("error", {
              message: err instanceof Error ? err.message : "Failed to fetch PR",
            });
            controller.close();
            return;
          }
        } else {
          diff = diffText;
        }

        if (!diff || diff.trim().length === 0) {
          send("error", { message: "No diff content to review" });
          controller.close();
          return;
        }

        send("status", {
          message: "Spawning 3 specialized sub-agents in parallel...",
          stage: "agents_start",
        });

        // Step 2: Run 3 sub-agents IN PARALLEL
        const agentResults = { security: "", performance: "", style: "" };

        send("agent_start", { agent: "security", label: "Security Analyzer" });
        send("agent_start", { agent: "performance", label: "Performance Analyzer" });
        send("agent_start", { agent: "style", label: "Style & Quality Analyzer" });

        await Promise.all([
          // Security sub-agent
          runSecurityAgent(client, diff, (chunk) => {
            agentResults.security += chunk;
            send("agent_chunk", { agent: "security", chunk });
          }).then((result) => {
            agentResults.security = result;
            send("agent_complete", { agent: "security" });
          }),

          // Performance sub-agent
          runPerformanceAgent(client, diff, (chunk) => {
            agentResults.performance += chunk;
            send("agent_chunk", { agent: "performance", chunk });
          }).then((result) => {
            agentResults.performance = result;
            send("agent_complete", { agent: "performance" });
          }),

          // Style sub-agent
          runStyleAgent(client, diff, (chunk) => {
            agentResults.style += chunk;
            send("agent_chunk", { agent: "style", chunk });
          }).then((result) => {
            agentResults.style = result;
            send("agent_complete", { agent: "style" });
          }),
        ]);

        // Step 3: Orchestrator synthesizes all reports
        send("status", {
          message: "Orchestrator agent synthesizing findings...",
          stage: "orchestrator_start",
        });
        send("agent_start", { agent: "orchestrator", label: "Master Orchestrator" });

        await runOrchestratorAgent(
          client,
          agentResults.security,
          agentResults.performance,
          agentResults.style,
          diff,
          (chunk) => {
            send("agent_chunk", { agent: "orchestrator", chunk });
          }
        );

        send("agent_complete", { agent: "orchestrator" });
        send("done", { message: "Review complete!" });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "An unexpected error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
