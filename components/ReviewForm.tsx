"use client";

import { useState } from "react";

interface ReviewFormProps {
  onSubmit: (data: { prUrl?: string; diffText?: string; githubToken?: string }) => void;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [mode, setMode] = useState<"url" | "diff">("url");
  const [prUrl, setPrUrl] = useState("");
  const [diffText, setDiffText] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "url" && prUrl.trim()) {
      onSubmit({ prUrl: prUrl.trim(), githubToken: githubToken.trim() || undefined });
    } else if (mode === "diff" && diffText.trim()) {
      onSubmit({ diffText: diffText.trim() });
    }
  };

  const SAMPLE_DIFF = `diff --git a/src/auth.js b/src/auth.js
--- a/src/auth.js
+++ b/src/auth.js
@@ -1,20 +1,35 @@
+const db = require('./database');
+
 async function loginUser(req, res) {
-  const { username, password } = req.body;
-  const user = await db.query(\`SELECT * FROM users WHERE username = '\${username}'\`);
+  const { username, password } = req.body;
+  // Direct string interpolation - potential SQL injection
+  const user = await db.query(
+    \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`
+  );
   if (user) {
-    res.json({ token: generateToken(user.id) });
+    const token = user.id + '_' + Date.now();
+    res.json({ token, userId: user.id, password: user.password });
   }
 }

+async function getUsers(req, res) {
+  const users = await db.query('SELECT * FROM users');
+  const result = [];
+  for (let i = 0; i < users.length; i++) {
+    const orders = await db.query(\`SELECT * FROM orders WHERE userId = \${users[i].id}\`);
+    result.push({ ...users[i], orders });
+  }
+  res.json(result);
+}
+
 module.exports = { loginUser, getUsers };`;

  const canSubmit = !isLoading && (mode === "url" ? !!prUrl.trim() : !!diffText.trim());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Configure Review</h2>
        <p className="text-xs text-gray-400 mt-0.5">Paste a PR link or raw diff to get started</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Mode toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(["url", "diff"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "url" ? "🔗 GitHub PR URL" : "📄 Paste Diff"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "url" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Pull Request URL
                </label>
                <input
                  type="text"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50 placeholder-gray-300 transition"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400 mt-1.5">Works with public repositories — no token needed.</p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                >
                  <span className={`transition-transform ${showToken ? "rotate-90" : ""}`}>▶</span>
                  GitHub Token (optional, for private repos)
                </button>
                {showToken && (
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxx..."
                    className="mt-2 w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 placeholder-gray-300 transition"
                    disabled={isLoading}
                  />
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Git Diff
                </label>
                <button
                  type="button"
                  onClick={() => setDiffText(SAMPLE_DIFF)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                >
                  Load sample →
                </button>
              </div>
              <textarea
                value={diffText}
                onChange={(e) => setDiffText(e.target.value)}
                placeholder={`Paste your git diff here…\n\ndiff --git a/file.js b/file.js`}
                rows={9}
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs font-mono bg-gray-50 placeholder-gray-300 resize-y transition"
                disabled={isLoading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-indigo-200 hover:shadow-md"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Agents are working…
              </>
            ) : (
              "🚀 Start Code Review"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
