// Force absolute URL logic in src/lib/api.ts
const rawUrl = process.env.NEXT_PUBLIC_API_URL || "";

// If it doesn't start with http, prepend https:// automatically
export const API_BASE = rawUrl.startsWith('http') 
  ? rawUrl.replace(/\/$/, "") 
  : `https://${rawUrl}`.replace(/\/$/, "");

console.log("Network targeting:", API_BASE);
