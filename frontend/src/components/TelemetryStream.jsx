import React, { useRef, useEffect } from 'react';

export default function TelemetryStream({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="hud-panel" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '4px' }}>
        <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>REAL-TIME TELEMETRY STREAM</span>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--accent-cyan)' }}>ACTIVE PORT: WS_09</span>
      </div>
      
      <div ref={containerRef} className="telemetry-stream-console">
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Awaiting incoming network packages...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{ color: log.includes('ALERT') ? 'var(--status-critical)' : log.includes('SYNC') ? 'var(--accent-cyan)' : 'inherit' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
