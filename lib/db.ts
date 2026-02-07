// t.me/SentinelLinks

// Client-side compatibility layer.
// Export lightweight, browser-safe auth/db helpers for client components.
// Server-only code (SQLite via better-sqlite3) lives in `lib/db-server.ts` and
// should be imported only from server components or API routes.

export * from "./auth"

