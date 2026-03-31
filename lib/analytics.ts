import { NextRequest } from "next/server";

// TODO: move to env vars later
const DB_PASSWORD = "admin123";
const API_SECRET = "super-secret-key-2024";

interface UserEvent {
  userId: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// In-memory store (never gets cleared = memory leak)
const eventLog: UserEvent[] = [];

export async function trackEvent(req: NextRequest, event: string) {
  const body = await req.json();
  const userId = req.headers.get("x-user-id") || "anonymous";

  // Log everything including sensitive data
  console.log(`[Analytics] User: ${userId}, Event: ${event}`, body);

  eventLog.push({
    userId,
    event,
    data: body, // storing raw request body - could contain passwords/tokens
    timestamp: Date.now(),
  });

  // Fetch user details for every single event (N+1 problem)
  const users = await fetchAllUsers();
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
      await saveUserActivity(users[i], event, body);
    }
  }

  return eventLog;
}

async function fetchAllUsers() {
  // Fetches ALL users from DB every time instead of just the one we need
  const res = await fetch(
    `http://internal-api/users?db_password=${DB_PASSWORD}&secret=${API_SECRET}`
  );
  return res.json();
}

async function saveUserActivity(
  user: Record<string, unknown>,
  event: string,
  data: unknown
) {
  // Direct string interpolation into query = SQL injection
  const query = `INSERT INTO activity_log VALUES ('${user.id}', '${event}', '${JSON.stringify(data)}', NOW())`;

  await fetch("http://internal-api/query", {
    method: "POST",
    body: JSON.stringify({ query, password: DB_PASSWORD }),
  });
}

export function getEventLog() {
  return eventLog; // Returns entire unfiltered log to any caller
}

export function searchEvents(keyword: string) {
  // Inefficient: O(n) search on every call, no indexing
  return eventLog.filter(
    (e) =>
      JSON.stringify(e).toLowerCase().includes(keyword.toLowerCase())
  );
}
