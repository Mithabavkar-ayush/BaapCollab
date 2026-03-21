"use client";

import { useEffect } from "react";

export default function ConsoleSuppressor() {
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalDebug = console.debug;

    const filterLogs = (originalFn: any) => {
      return (...args: any[]) => {
        const message = args.join(" ");
        if (message.includes("forward-logs-shared.ts") || message.includes("receive-logs.js")) {
          return;
        }
        originalFn(...args);
      };
    };

    console.log = filterLogs(originalLog);
    console.warn = filterLogs(originalWarn);
    console.debug = filterLogs(originalDebug);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.debug = originalDebug;
    };
  }, []);

  return null;
}
