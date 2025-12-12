import React, { useEffect, useState } from "react";

export default function ResolveDebugPanel() {
  // Only enable in non-production dev mode
  if (process.env.NODE_ENV === "production") return null;

  const [visible, setVisible] = useState(true);
  const [data, setData] = useState<any | null>(
    typeof window !== "undefined"
      ? (window as any).__wf_last_resolve || null
      : null
  );

  useEffect(() => {
    const handler = (e: any) => {
      try {
        const d = e?.detail ?? null;
        setData(d || (window as any).__wf_last_resolve || null);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("wf:resolve", handler as EventListener);
    return () =>
      window.removeEventListener("wf:resolve", handler as EventListener);
  }, []);

  return (
    <div className="fixed right-4 bottom-4 z-50 text-xs">
      <div className="bg-black/70 text-white rounded-lg shadow-lg w-80 max-w-full backdrop-blur-sm overflow-hidden border border-white/10">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="font-semibold">Resolve Debug</div>
          <div className="flex items-center gap-2">
            <button
              title="Toggle panel"
              onClick={() => setVisible((s) => !s)}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10"
            >
              {visible ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {visible && (
          <div className="px-3 py-2 max-h-64 overflow-auto">
            {data ? (
              <pre className="whitespace-pre-wrap text-[11px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : (
              <div className="text-muted-foreground">
                No resolve data yet — trigger a category fetch to populate.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
