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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Configure Review</h2>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            mode === "url"
              ? "bg-white shadow text-gray-800"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🔗 GitHub PR URL
        </button>
        <button
          type="button"
          onClick={() => setMode("diff")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            mode === "diff"
              ? "bg-white shadow text-gray-800"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📄 Paste Diff
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "url" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub PR URL
              </label>
              <input
                type="text"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Works with public repositories. No token needed.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showToken ? "▼" : "▶"} GitHub Token (optional, for private repos)
              </button>
              {showToken && (
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxx..."
                  className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  disabled={isLoading}
                />
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Paste Git Diff
              </label>
              <button
                type="button"
                onClick={() => setDiffText(SAMPLE_DIFF)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Load sample diff →
              </button>
            </div>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              placeholder={`Paste your git diff here...\n\ndiff --git a/file.js b/file.js\n--- a/file.js\n+++ b/file.js\n@@ -1,5 +1,8 @@\n...`}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono resize-y"
              disabled={isLoading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (mode === "url" ? !prUrl.trim() : !diffText.trim())}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Agents are working...
            </>
          ) : (
            <>
              🚀 Start Code Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}
