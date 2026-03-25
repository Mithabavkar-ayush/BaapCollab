const getApiBase = () => {
  let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // Enforce protocol if missing
  if (!base.startsWith('http')) {
    const isLocal = base.includes('localhost') || base.includes('127.0.0.1');
    base = isLocal ? `http://${base}` : `https://${base}`;
  }
  
  // Strip trailing slash to prevent double-slashes in fetch calls
  return base.replace(/\/$/, '');
};

export const API_BASE = getApiBase();

console.log("📡 [API] Base URL configured:", API_BASE);
