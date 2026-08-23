import React, { useState, useEffect } from 'react';
import SimulationControls from './SimulationControls';
import TelemetryStream from './TelemetryStream';

// A minimal, engineering-style SVG Line Chart component
function SVGLineChart({ data, labels, color }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)' }}>Calculating trajectory...</div>;

  const width = 500;
  const height = 110;
  const padding = 15;

  const minVal = Math.min(...data) * 0.95;
  const maxVal = Math.max(...data) * 1.05;
  const valRange = maxVal - minVal || 1;

  // Map data to SVG points
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    // Invert Y axis for SVG coordinates
    const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
        {/* Draw subtle grid background lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = padding + r * (height - padding * 2);
          return (
            <line
              key={idx}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#191c20"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Draw main line path */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          style={{ transition: 'd 0.5s ease' }}
        />

        {/* Draw small data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill="#060708"
              stroke={color}
              strokeWidth="1"
            />
            {/* Show value on hover */}
            <title>{p.val.toFixed(1)}</title>
          </g>
        ))}

        {/* Draw X-Axis labels (times) */}
        {labels && labels.map((lbl, idx) => {
          if (idx % 2 !== 0) return null; // Show every alternate label to avoid overlap
          const x = padding + (idx / (labels.length - 1)) * (width - padding * 2);
          return (
            <text
              key={idx}
              x={x}
              y={height - 2}
              fill="var(--text-muted)"
              fontSize="6"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function DashboardHUD({
  sensors,
  alerts,
  logs,
  simValues,
  setSimValues,
  grainType,
  setGrainType,
  isOffline,
  setIsOffline,
  syncRecords,
  activePreset,
  applyPreset,
  historicalData
}) {
  const [activeChartTab, setActiveChartTab] = useState('RISK');

  // Find selected sensor to display detailed HUD statistics
  const selectedSensor = sensors.find(s => s.status === 'CRITICAL') || sensors.find(s => s.status === 'WARNING') || sensors[0];

  const getChartConfig = () => {
    switch (activeChartTab) {
      case 'TEMP':
        return { data: historicalData.temperature, color: 'var(--status-warning)' };
      case 'HUMIDITY':
        return { data: historicalData.humidity, color: 'var(--accent-cyan)' };
      case 'MOISTURE':
        return { data: historicalData.moisture, color: '#b58900' };
      case 'RISK':
      default:
        return { data: historicalData.risk_score, color: 'var(--status-critical)' };
    }
  };

  const chart = getChartConfig();

  return (
    <div className="dashboard-grid">
      {/* LEFT PANEL */}
      <div className="dashboard-left">
        {/* System Overview HUD */}
        <div className="hud-panel">
          <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px', fontSize: '0.9rem', letterSpacing: '0.05em', marginBottom: '12px' }}>
            SYSTEM DIRECTORY
          </h3>
          <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>SYSTEM STATUS</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`status-dot ${isOffline ? 'offline' : 'online'}`}></span>
                {isOffline ? 'LOCAL ONLY' : 'API SYNCHRONIZED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ACTIVE SENSORS</span>
              <span style={{ color: 'var(--accent-cyan)' }}>12 / 12 ONLINE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>SILO BATCHES</span>
              <span style={{ color: 'var(--accent-cyan)' }}>4 ACTIVE BATCHES</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>AI PREDICTION ENGINE</span>
              <span style={{ color: 'var(--status-normal)' }}>ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Live logs telemetry terminal */}
        <TelemetryStream logs={logs} />
      </div>

      {/* CENTER SPACE (Bottom analytics) */}
      <div className="dashboard-center">
        <div className="hud-panel" style={{ pointerEvents: 'auto', width: '100%', maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>PREDICTIVE HISTORICAL TRAJECTORY (24H)</span>
            
            {/* Chart selection tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['RISK', 'TEMP', 'HUMIDITY', 'MOISTURE'].map(tab => (
                <button
                  key={tab}
                  className="tech-button"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.6rem',
                    borderColor: activeChartTab === tab ? 'var(--accent-cyan)' : 'var(--panel-border)',
                    background: activeChartTab === tab ? 'rgba(0, 240, 255, 0.08)' : 'transparent'
                  }}
                  onClick={() => setActiveChartTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ height: '90px', width: '100%' }}>
            <SVGLineChart data={chart.data} labels={historicalData.labels} color={chart.color} />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="dashboard-right">
        {/* Predictive AI HUD Panel */}
        <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
            AI DIAGNOSTICS & PREDICTIONS
          </h3>

          {selectedSensor ? (
            <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PRIMARY BATCH IN FOCUS</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{selectedSensor.node_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SPOILAGE RISK INDEX</span>
                <span style={{ 
                  color: selectedSensor.prediction.risk_score >= 70 ? 'var(--status-critical)' : selectedSensor.prediction.risk_score >= 30 ? 'var(--status-warning)' : 'var(--status-normal)',
                  fontWeight: 'bold'
                }}>
                  {selectedSensor.prediction.risk_score}% {selectedSensor.prediction.risk_category}
                </span>
              </div>
              
              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CONTRIBUTING ANOMALIES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem' }}>
                  {selectedSensor.prediction.contributing_factors.map((fact, i) => (
                    <div key={i} style={{ color: 'var(--text-primary)', borderLeft: '2px solid var(--panel-border)', paddingLeft: '6px' }}>
                      ↳ {fact}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AUTOMATED REVENUE RISK ACTION</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', lineHeight: '1.4' }}>
                  {selectedSensor.prediction.recommended_action}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculating prediction matrices...</div>
          )}
        </div>

        {/* Sliders and Override Configuration Panel */}
        <SimulationControls
          simValues={simValues}
          setSimValues={setSimValues}
          grainType={grainType}
          setGrainType={setGrainType}
          isOffline={isOffline}
          setIsOffline={setIsOffline}
          syncRecords={syncRecords}
          activePreset={activePreset}
          applyPreset={applyPreset}
        />
      </div>
    </div>
  );
}
