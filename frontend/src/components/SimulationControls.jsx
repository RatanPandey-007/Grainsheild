import React from 'react';

export default function SimulationControls({
  simValues,
  setSimValues,
  grainType,
  setGrainType,
  isOffline,
  setIsOffline,
  syncRecords,
  activePreset,
  applyPreset
}) {
  const presets = [
    { name: 'NORMAL', label: 'Optimal Storage' },
    { name: 'HOT_STORAGE', label: 'Thermal Drift' },
    { name: 'HIGH_HUMIDITY', label: 'Humid Ambient' },
    { name: 'HIGH_MOISTURE', label: 'Internal Moisture' },
    { name: 'GAS_BUILDUP', label: 'Gas Buildup' },
    { name: 'CRITICAL_SPOILAGE', label: 'Critical Spoilage' }
  ];

  const handleSliderChange = (key, val) => {
    setSimValues(prev => ({
      ...prev,
      [key]: parseFloat(val)
    }));
  };

  return (
    <div className="hud-panel" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '6px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
        SIMULATOR CONTROLS
      </h3>

      {/* Preset selection buttons */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
          ENVIRONMENT PRESETS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {presets.map(p => (
            <button
              key={p.name}
              className="tech-button"
              style={{
                padding: '6px',
                fontSize: '0.65rem',
                borderColor: activePreset === p.name ? 'var(--accent-cyan)' : 'var(--panel-border)',
                background: activePreset === p.name ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                textAlign: 'left'
              }}
              onClick={() => applyPreset(p.name)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grain Selection */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
          GRAIN BATCH SELECTOR
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
          {['RICE', 'WHEAT', 'MAIZE', 'PULSES'].map(g => (
            <button
              key={g}
              className="tech-button"
              style={{
                padding: '6px 2px',
                fontSize: '0.65rem',
                borderColor: grainType === g ? 'var(--accent-cyan)' : 'var(--panel-border)',
                background: grainType === g ? 'rgba(0, 240, 255, 0.08)' : 'transparent'
              }}
              onClick={() => setGrainType(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="slider-container">
          <div className="slider-header">
            <span>TEMPERATURE</span>
            <span className="mono">{simValues.temperature.toFixed(1)}°C</span>
          </div>
          <input
            type="range"
            min="10"
            max="45"
            step="0.5"
            className="slider-input"
            value={simValues.temperature}
            onChange={(e) => handleSliderChange('temperature', e.target.value)}
          />
        </div>

        <div className="slider-container">
          <div className="slider-header">
            <span>RELATIVE HUMIDITY</span>
            <span className="mono">{simValues.humidity.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            step="0.5"
            className="slider-input"
            value={simValues.humidity}
            onChange={(e) => handleSliderChange('humidity', e.target.value)}
          />
        </div>

        <div className="slider-container">
          <div className="slider-header">
            <span>GRAIN MOISTURE</span>
            <span className="mono">{simValues.moisture.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="8"
            max="25"
            step="0.1"
            className="slider-input"
            value={simValues.moisture}
            onChange={(e) => handleSliderChange('moisture', e.target.value)}
          />
        </div>

        <div className="slider-container">
          <div className="slider-header">
            <span>GAS CONCENTRATION</span>
            <span className="mono">{simValues.gas.toFixed(0)} PPM</span>
          </div>
          <input
            type="range"
            min="350"
            max="1500"
            step="10"
            className="slider-input"
            value={simValues.gas}
            onChange={(e) => handleSliderChange('gas', e.target.value)}
          />
        </div>

        <div className="slider-container">
          <div className="slider-header">
            <span>STORAGE DURATION</span>
            <span className="mono">{simValues.exposure_days.toFixed(0)} DAYS</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            className="slider-input"
            value={simValues.exposure_days}
            onChange={(e) => handleSliderChange('exposure_days', e.target.value)}
          />
        </div>
      </div>

      {/* Offline simulation toggle */}
      <div className="switch-container" style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '10px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>LOW-CONNECTIVITY MODE</span>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
            {isOffline ? `LOCAL BUFFERING: ${syncRecords} RECS` : 'LINKED TO API DATA STREAM'}
          </div>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={isOffline}
            onChange={(e) => setIsOffline(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}
