import React, { useState, useEffect, useRef } from 'react';
import CanvasContainer from './components/CanvasContainer';
import WarehouseScene from './components/WarehouseScene';
import ParticleField from './components/ParticleField';
import AIIntelligenceCore from './components/AIIntelligenceCore';
import NetworkMap from './components/NetworkMap';
import DashboardHUD from './components/DashboardHUD';

// Default baseline sensors configuration (matches backend coordinates)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/api/v1/ws';

const DEFAULT_SENSORS = [
  { id: 1, node_name: "SILO_01_BOTTOM", x_pos: -4.0, y_pos: 0.8, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 22.0, humidity: 58.0, moisture: 12.2, gas: 410.0 }, prediction: { risk_score: 12.0, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 2, node_name: "SILO_01_MID", x_pos: -4.0, y_pos: 2.5, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 21.8, humidity: 57.5, moisture: 12.1, gas: 405.0 }, prediction: { risk_score: 11.5, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 3, node_name: "SILO_01_TOP", x_pos: -4.0, y_pos: 4.2, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 22.5, humidity: 59.0, moisture: 12.4, gas: 415.0 }, prediction: { risk_score: 13.2, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  
  { id: 4, node_name: "SILO_02_BOTTOM", x_pos: 0.0, y_pos: 0.8, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 20.0, humidity: 55.0, moisture: 11.8, gas: 390.0 }, prediction: { risk_score: 9.8, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 5, node_name: "SILO_02_MID", x_pos: 0.0, y_pos: 2.5, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 19.8, humidity: 54.5, moisture: 11.7, gas: 385.0 }, prediction: { risk_score: 9.2, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 6, node_name: "SILO_02_TOP", x_pos: 0.0, y_pos: 4.2, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 20.2, humidity: 56.0, moisture: 11.9, gas: 395.0 }, prediction: { risk_score: 10.5, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  
  { id: 7, node_name: "SILO_03_BOTTOM", x_pos: 4.0, y_pos: 0.8, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 23.0, humidity: 60.0, moisture: 12.0, gas: 420.0 }, prediction: { risk_score: 14.5, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 8, node_name: "SILO_03_MID", x_pos: 4.0, y_pos: 2.5, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 22.8, humidity: 59.5, moisture: 11.9, gas: 415.0 }, prediction: { risk_score: 13.8, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 9, node_name: "SILO_03_TOP", x_pos: 4.0, y_pos: 4.2, z_pos: 0.0, status: "NORMAL", telemetry: { temperature: 23.2, humidity: 61.0, moisture: 12.1, gas: 425.0 }, prediction: { risk_score: 15.0, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  
  { id: 10, node_name: "WH_HALL_EAST", x_pos: -2.5, y_pos: 1.0, z_pos: 4.0, status: "NORMAL", telemetry: { temperature: 21.0, humidity: 56.0, moisture: 10.5, gas: 400.0 }, prediction: { risk_score: 8.5, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 11, node_name: "WH_HALL_CENTER", x_pos: 0.0, y_pos: 1.0, z_pos: 4.0, status: "NORMAL", telemetry: { temperature: 20.8, humidity: 55.5, moisture: 10.4, gas: 395.0 }, prediction: { risk_score: 8.0, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } },
  { id: 12, node_name: "WH_HALL_WEST", x_pos: 2.5, y_pos: 1.0, z_pos: 4.0, status: "NORMAL", telemetry: { temperature: 21.2, humidity: 56.5, moisture: 10.6, gas: 405.0 }, prediction: { risk_score: 9.0, risk_category: "NORMAL", contributing_factors: ["Atmospheric readings are within optimal specifications."], recommended_action: "No action required." } }
];

export default function App() {
  // State Machine
  const [phase, setPhase] = useState('BOOT'); // BOOT, STORY, OPERATIONAL
  const [activeScene, setActiveScene] = useState('HERO'); // HERO, PROBLEM, INVISIBLE, SENSING, INTELLIGENCE, PREDICTION, ACTION, NETWORK, OPERATIONAL
  
  // Custom cursor
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isCursorHovered, setIsCursorHovered] = useState(false);

  // Sound Control
  const [isSoundOn, setIsSoundOn] = useState(false);

  // Boot sequence console logs
  const [bootLogs, setBootLogs] = useState([]);
  const [bootProgress, setBootProgress] = useState(0);

  // Operational Telemetry Data
  const [sensors, setSensors] = useState(DEFAULT_SENSORS);
  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Simulation Variables (Overrides)
  const [simValues, setSimValues] = useState({
    temperature: 22.0,
    humidity: 58.0,
    moisture: 12.0,
    gas: 410.0,
    exposure_days: 5
  });
  const [grainType, setGrainType] = useState('RICE');
  const [activePreset, setActivePreset] = useState('NORMAL');
  
  // Offline-First Variables
  const [isOffline, setIsOffline] = useState(false);
  const [syncRecords, setSyncRecords] = useState([]); // Array of locally buffered telemetry points
  
  // Historical chart data
  const [historicalData, setHistoricalData] = useState({
    labels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"],
    temperature: [20, 21, 22, 23, 22.8, 22, 21.5, 22, 23, 23.5, 23, 22, 21],
    humidity: [55, 57, 58, 60, 59.5, 58, 57.5, 58, 60, 62, 61, 59, 56],
    moisture: [12.0, 12.0, 12.1, 12.1, 12.2, 12.2, 12.3, 12.3, 12.4, 12.4, 12.5, 12.5, 12.6],
    risk_score: [10, 12, 14, 16, 15, 12, 11, 12, 15, 18, 16, 12, 10]
  });

  const wsRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // --- BOOT SEQUENCE ANIMATION ---
  useEffect(() => {
    if (phase !== 'BOOT') return;

    const lines = [
      "GRAINSHIELD SECURE CORE BOOTING...",
      "LOCAL SENSOR INTERFACES DEPLOYING...",
      "ESTABLISHING CRYPTOGRAPHIC API ROUTINGS...",
      "SYSTEM CHECK: TEMPERATURE SENSORS ....... ONLINE",
      "SYSTEM CHECK: INFRARED HYGROMETERS ....... ONLINE",
      "SYSTEM CHECK: CO2 RESPIRED GAS NODES ...... ONLINE",
      "AI PREDICTIVE RISK CLASSIFIER .......... STANDBY",
      "DATABASE READ/WRITE CONSTRAINTS ......... SEEDED",
      "SYSTEM STATUS: PREVENTATIVE TELEMETRY CORE ONLINE"
    ];

    let timer = 0;
    lines.forEach((line, idx) => {
      timer += 350;
      setTimeout(() => {
        setBootLogs(prev => [...prev, line]);
        setBootProgress(Math.round(((idx + 1) / lines.length) * 100));
      }, timer);
    });

    // Auto boot finished in 4 seconds
    setTimeout(() => {
      setPhase('STORY');
    }, 4200);
  }, [phase]);

  // --- CUSTOM CURSOR TRACKER ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- AUDIO ENVIRONMENT SYNTHESIS ---
  const playBeep = (freq, duration, type = 'sine') => {
    if (!isSoundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log("Audio not allowed yet", e);
    }
  };

  // Click Sound effect
  const handleNavClick = () => {
    playBeep(880, 0.08, 'square');
  };

  // Trigger alert sound if critical alert rises
  useEffect(() => {
    const criticals = sensors.filter(s => s.status === 'CRITICAL');
    if (criticals.length > 0) {
      // Play a double caution low beep
      const interval = setInterval(() => {
        playBeep(220, 0.3, 'sawtooth');
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [sensors, isSoundOn]);

  // --- WEBSOCKETS DATA INTEGRATION ---
  useEffect(() => {
    if (phase !== 'OPERATIONAL' || isOffline) {
      if (wsRef.current) wsRef.current.close();
      return;
    }

    const connectWS = () => {
      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] WebSocket pipeline linked to live telemetry server.`]);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.sensors) {
          setSensors(data.sensors);
          
          // Log random telemetry update to console
          const randS = data.sensors[Math.floor(Math.random() * data.sensors.length)];
          setLogs(prev => {
            const nextLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${randS.node_name}: T:${randS.telemetry.temperature}°C, H:${randS.telemetry.humidity}%, M:${randS.telemetry.moisture}% [AI RISK: ${randS.prediction.risk_score}%]`];
            // Keep logs array clean
            return nextLogs.slice(-25);
          });
        }
      };

      socket.onerror = (e) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] WebSocket error. Falling back to local data simulator.`]);
      };

      socket.onclose = () => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] WebSocket disconnected.`]);
        // Retry logic after 5s
        setTimeout(() => {
          if (phase === 'OPERATIONAL' && !isOffline) connectWS();
        }, 5000);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [phase, isOffline]);

  // Fetch historical analytical details
  useEffect(() => {
    if (phase !== 'OPERATIONAL') return;

    fetch(`${API_URL}/analytics/historical?grain_type=${grainType}`)
      .then(res => res.json())
      .then(data => {
        setHistoricalData(data);
      })
      .catch(() => {
        // Safe heuristic fallback if backend API is not responding
        const size = 13;
        const labels = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];
        let baseTemp = simValues.temperature;
        let baseHum = simValues.humidity;
        let baseMoist = simValues.moisture;

        const temp = Array.from({ length: size }, (_, i) => Math.round((baseTemp + Math.sin(i / 2) * 1.5 + Math.random() * 0.5) * 10) / 10);
        const hum = Array.from({ length: size }, (_, i) => Math.round((baseHum + Math.sin(i / 2.5) * 2 + Math.random() * 0.8) * 10) / 10);
        const moist = Array.from({ length: size }, (_, i) => Math.round((baseMoist + i * 0.01 + Math.random() * 0.05) * 100) / 100);
        
        // Calculate risks heuristic
        const risk = temp.map((t, idx) => {
          const m = moist[idx];
          const h = hum[idx];
          let r = (t > 25 ? (t - 25) * 4 : 0) + (h > 70 ? (h - 70) * 1.5 : 0) + (m > 13 ? (m - 13) * 20 : 0);
          return Math.min(Math.round(r), 100);
        });

        setHistoricalData({ labels, temperature: temp, humidity: hum, moisture: moist, risk_score: risk });
      });
  }, [phase, grainType, simValues]);

  // --- SIMULATION OVERRIDE SYNC TO BACKEND ---
  useEffect(() => {
    if (phase !== 'OPERATIONAL' || isOffline) return;

    const syncOverride = async () => {
      try {
        await fetch(`${API_URL}/simulation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: true,
            temperature: simValues.temperature,
            humidity: simValues.humidity,
            moisture: simValues.moisture,
            gas: simValues.gas,
            exposure_days: 5,
            grain_type: grainType
          })
        });
      } catch (err) {
        console.warn("Override sync failed. Running locally.");
      }
    };

    const delayDebounce = setTimeout(() => {
      syncOverride();
    }, 400); // Debounce slider events to prevent API spamming

    return () => clearTimeout(delayDebounce);
  }, [simValues, grainType, phase, isOffline]);

  // --- LOCAL SIMULATION (OFFLINE MODE / FALLBACK) ---
  useEffect(() => {
    let interval = null;

    if (isOffline || phase !== 'OPERATIONAL') {
      // Run local physics simulation loops
      interval = setInterval(() => {
        setSensors(prevSensors => {
          const nextSensors = prevSensors.map(s => {
            // Apply slider overrides with realistic variations
            const tempNoise = Math.sin(Date.now() / 5000 + s.id) * 0.3;
            const humidityNoise = Math.cos(Date.now() / 6000 + s.id) * 0.5;
            
            const temp = Math.min(Math.max(simValues.temperature + tempNoise, 10), 45);
            const humidity = Math.min(Math.max(simValues.humidity + humidityNoise, 40), 95);
            const moisture = Math.min(Math.max(simValues.moisture + (Math.sin(s.id) * 0.1), 8), 25);
            const gas = Math.min(Math.max(simValues.gas + (Math.cos(s.id) * 10), 350), 1500);

            // Risk calculation
            let r = 0;
            const m_thresh = grainType === 'PULSES' ? 12 : grainType === 'WHEAT' ? 14 : 13.5;
            if (moisture > m_thresh) r += (moisture - m_thresh) * 12;
            else r += (moisture / m_thresh) * 5;
            
            if (humidity > 70) r += (humidity - 70) * 1.2;
            if (temp > 25) r += (temp - 25) * 1.5;
            if (gas > 600) r += (gas - 600) * 0.03;
            
            const score = Math.min(Math.max(Math.round(r), 0), 100);
            
            let status = "NORMAL";
            if (score >= 70) status = "CRITICAL";
            else if (score >= 30) status = "WARNING";

            const factors = [];
            if (moisture > m_thresh) factors.append ? factors.push(`High Grain Moisture (${moisture.toFixed(1)}%)`) : factors.push(`High Moisture (${moisture.toFixed(1)}%)`);
            if (humidity > 70) factors.push(`High Humidity (${humidity.toFixed(1)}%)`);
            if (temp > 28) factors.push(`Elevated Temp (${temp.toFixed(1)}°C)`);
            if (factors.length === 0) factors.push("Optimal storage conditions.");

            const recAction = status === "CRITICAL" 
              ? "DEPLOY DRYING AND VENTILATION SYSTEM IMMEDIATELY" 
              : status === "WARNING" 
              ? "Activate secondary exhaust fans." 
              : "No actions required.";

            return {
              ...s,
              status,
              telemetry: { temperature: parseFloat(temp.toFixed(1)), humidity: parseFloat(humidity.toFixed(1)), moisture: parseFloat(moisture.toFixed(1)), gas: parseFloat(gas.toFixed(0)) },
              prediction: { risk_score: score, risk_category: status, contributing_factors: factors, recommended_action: recAction }
            };
          });

          // Buffer log item
          if (isOffline) {
            const randS = nextSensors[Math.floor(Math.random() * nextSensors.length)];
            setSyncRecords(prev => {
              const newRecord = {
                node_name: randS.node_name,
                temperature: randS.telemetry.temperature,
                humidity: randS.telemetry.humidity,
                moisture: randS.telemetry.moisture,
                gas: randS.telemetry.gas,
                timestamp: new Date().toISOString()
              };
              return [...prev, newRecord];
            });

            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [LOCAL INTERACTION] ${randS.node_name} logged offline`].slice(-25));
          }

          return nextSensors;
        });
      }, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simValues, grainType, isOffline, phase]);

  // --- OFFLINE TO ONLINE SYNCHRONIZATION ---
  useEffect(() => {
    // When flipping back to online, sync our buffered records
    if (!isOffline && syncRecords.length > 0) {
      const runSync = async () => {
        setLogs(prev => [...prev, `[SYNC INITIATED] Uploading ${syncRecords.length} offline cached entries to primary server...`]);
        try {
          const res = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncRecords)
          });
          const data = await res.json();
          if (data.status === "success") {
            setLogs(prev => [...prev, `[SYNC COMPLETE] ${data.synchronized_records} records successfully synchronized and alerts flushed.`]);
            setSyncRecords([]);
            playBeep(1200, 0.4, 'sine');
          }
        } catch (e) {
          setLogs(prev => [...prev, `[SYNC FAILED] API server unreachable. Local cache retained.`]);
        }
      };

      runSync();
    }
  }, [isOffline]);

  // --- ENVIRONMENT PRESET HANDLERS ---
  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    handleNavClick();
    
    switch (presetName) {
      case 'NORMAL':
        setSimValues({ temperature: 20.0, humidity: 55.0, moisture: 11.5, gas: 400.0, exposure_days: 3 });
        break;
      case 'HOT_STORAGE':
        setSimValues({ temperature: 34.5, humidity: 62.0, moisture: 12.0, gas: 480.0, exposure_days: 7 });
        break;
      case 'HIGH_HUMIDITY':
        setSimValues({ temperature: 24.0, humidity: 82.5, moisture: 13.0, gas: 500.0, exposure_days: 5 });
        break;
      case 'HIGH_MOISTURE':
        setSimValues({ temperature: 25.0, humidity: 65.0, moisture: 18.2, gas: 520.0, exposure_days: 9 });
        break;
      case 'GAS_BUILDUP':
        setSimValues({ temperature: 26.5, humidity: 68.0, moisture: 13.5, gas: 980.0, exposure_days: 12 });
        break;
      case 'CRITICAL_SPOILAGE':
        setSimValues({ temperature: 38.0, humidity: 88.0, moisture: 21.5, gas: 1420.0, exposure_days: 18 });
        break;
      default:
        break;
    }
  };

  // --- CINEMATIC SCROLL DETECTION ---
  useEffect(() => {
    if (phase !== 'STORY') return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollPos = container.scrollTop;
      const height = container.clientHeight;
      
      // Divide positions into sections
      const activeIdx = Math.round(scrollPos / height);
      const scenes = ['HERO', 'PROBLEM', 'INVISIBLE', 'SENSING', 'INTELLIGENCE', 'PREDICTION', 'ACTION', 'NETWORK'];
      
      if (scenes[activeIdx] && activeScene !== scenes[activeIdx]) {
        setActiveScene(scenes[activeIdx]);
        // Trigger subtle click navigation feedback sound
        playBeep(440, 0.05, 'sine');
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [phase, activeScene]);

  // Jump to specific scene from Navigation links
  const jumpToScene = (sceneName) => {
    handleNavClick();
    if (sceneName === 'OPERATIONAL') {
      setPhase('OPERATIONAL');
      setActiveScene('OPERATIONAL');
    } else {
      setPhase('STORY');
      setActiveScene(sceneName);
      
      const scenes = ['HERO', 'PROBLEM', 'INVISIBLE', 'SENSING', 'INTELLIGENCE', 'PREDICTION', 'ACTION', 'NETWORK'];
      const idx = scenes.indexOf(sceneName);
      if (idx !== -1 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = idx * scrollContainerRef.current.clientHeight;
      }
    }
  };

  return (
    <>
      {/* Scanline Filter */}
      <div className="scanlines"></div>

      {/* Cyber Custom Cursor */}
      <div 
        className={`custom-cursor ${isCursorHovered ? 'hovered' : ''}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      ></div>
      <div 
        className="custom-cursor-dot"
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      ></div>

      {/* Grid Lines Border Visual Framer */}
      <div className="grid-lines"></div>

      {/* 1. Cinematic Loading Boot Screen */}
      {phase === 'BOOT' && (
        <div className="boot-screen">
          <div className="boot-title">GRAINSHIELD AI</div>
          <div className="boot-console">
            {bootLogs.map((log, i) => (
              <div key={i}>&gt;&gt; {log}</div>
            ))}
          </div>
          <div style={{ width: '200px', height: '2px', background: 'var(--panel-border)', position: 'relative' }}>
            <div style={{ width: `${bootProgress}%`, height: '100%', background: 'var(--accent-cyan)', transition: 'width 0.2s' }}></div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>INITIALIZING TELEMETRY: {bootProgress}%</div>
          <button 
            className="tech-button" 
            style={{ marginTop: '40px' }}
            onClick={() => {
              handleNavClick();
              setPhase('STORY');
            }}
          >
            BYPASS SYSTEMS BOOT
          </button>
        </div>
      )}

      {/* Common Background 3D Engine Canvas (Persists for transitions) */}
      {phase !== 'BOOT' && (
        <CanvasContainer activeScene={activeScene}>
          <WarehouseScene 
            sensors={sensors}
            onHoverSensor={(s, e) => {
              if (s) setIsCursorHovered(true);
              else setIsCursorHovered(false);
            }}
            onClickSensor={(s) => {
              setSelectedSensorId(s.id);
              playBeep(660, 0.05, 'triangle');
            }}
            selectedSensorId={selectedSensorId}
          />
          <ParticleField sensors={sensors} activeScene={activeScene} />
          <AIIntelligenceCore activeScene={activeScene} />
          <NetworkMap activeScene={activeScene} />
        </CanvasContainer>
      )}

      {/* HUD HEADER NAVBAR (Common across layer 1 and layer 2) */}
      {phase !== 'BOOT' && (
        <div className="hud-frame">
          <div className="header-nav">
            <div className="brand" onClick={() => jumpToScene('HERO')} style={{ cursor: 'pointer' }}>
              🛡️ GRAINSHIELD <span>v1.0-AI</span>
            </div>
            
            <div className="nav-links">
              <span className={`nav-link ${activeScene === 'HERO' ? 'active' : ''}`} onClick={() => jumpToScene('HERO')}>VISION</span>
              <span className={`nav-link ${activeScene === 'INTELLIGENCE' ? 'active' : ''}`} onClick={() => jumpToScene('INTELLIGENCE')}>AI MODEL</span>
              <span className={`nav-link ${activeScene === 'NETWORK' ? 'active' : ''}`} onClick={() => jumpToScene('NETWORK')}>SIM NETWORK</span>
              <span className={`nav-link ${phase === 'OPERATIONAL' ? 'active' : ''}`} onClick={() => jumpToScene('OPERATIONAL')}>ENTER OPERATIONAL SYSTEM</span>
            </div>

            <div className="system-status-indicator">
              <button 
                className="tech-button"
                style={{ padding: '4px 8px', fontSize: '0.6rem', border: '1px solid var(--panel-border)', marginRight: '16px' }}
                onClick={() => {
                  setIsSoundOn(!isSoundOn);
                  playBeep(880, 0.1);
                }}
              >
                SOUND: {isSoundOn ? 'ON' : 'OFF'}
              </button>
              <span className={`status-dot ${isOffline ? 'warning' : 'normal'}`}></span>
              <span className="mono">{isOffline ? 'LOCAL BUFFERS' : 'SYSTEM ONLINE'}</span>
            </div>
          </div>
        </div>
      )}

      {/* LAYER 1: CINEMATIC STORY SCROLL EXPERIENCE */}
      {phase === 'STORY' && (
        <div 
          ref={scrollContainerRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          {/* SCENE 01: HERO */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content" style={{ marginTop: '10vh' }}>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>MSME IDEA HACKATHON 6.0</div>
              <h2 style={{ fontSize: '3rem', lineHeight: '1.1', textTransform: 'uppercase' }}>Intelligent Storage Infrastructure</h2>
              <p>Predict deterioration. Prevent post-harvest spoilage. GrainShield applies advanced computational volumetric forecasting and real-time gas tracking to preserve agricultural assets.</p>
              <button className="tech-button" onClick={() => jumpToScene('OPERATIONAL')}>
                [ ENTER SYSTEM ]
              </button>
            </div>
          </section>

          {/* SCENE 02: PROBLEM */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--status-critical)', marginBottom: '8px' }}>SCENE 01 // THE ANOMALY</div>
              <h2>Post-Harvest Waste</h2>
              <p>Millions of tons of grains rot in standard warehouse containers worldwide due to temperature spikes and undetected moisture accumulation. By the time mold becomes visible, the batch is already lost.</p>
            </div>
          </section>

          {/* SCENE 03: INVISIBLE PROBLEM */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--status-warning)', marginBottom: '8px' }}>SCENE 02 // THERMAL DRIFT</div>
              <h2>Deterioration Begins Invisibly</h2>
              <p>Localized moisture pockets trigger grain respiration, generating heat and carbon dioxide. As the heat rises, a volumetric risk field develops inside the core of the silo before manifesting on the surface.</p>
            </div>
          </section>

          {/* SCENE 04: SENSING */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>SCENE 03 // SENSE ARRAY</div>
              <h2>Dense Spatial Probes</h2>
              <p>GrainShield uses arrays of multi-sensor columns placed deep within the storage bins, tracking temperature gradients, relative humidity, grain moisture contents, and VOC gas PPM in real-time.</p>
            </div>
          </section>

          {/* SCENE 05: INTELLIGENCE */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>SCENE 04 // COMPUTE CORE</div>
              <h2>Predictive ML Engine</h2>
              <p>Raw physical telemetry converges into the central Artificial Intelligence processor. The model calculates spoilage curves, isolating risk vectors before deterioration propagates.</p>
            </div>
          </section>

          {/* SCENE 06: PREDICTION */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--status-critical)', marginBottom: '8px' }}>SCENE 05 // ADVANCED ALERTING</div>
              <h2>Forecasting Spoilage</h2>
              <p>Using synthetic mapping trained on agricultural datasets, the AI calculates a risk score index. Warning notifications propagate immediately through the operational center.</p>
            </div>
          </section>

          {/* SCENE 07: ACTION */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--status-normal)', marginBottom: '8px' }}>SCENE 06 // ACTIVE MITIGATION</div>
              <h2>Sense → Predict → Act</h2>
              <p>Once high risk is logged, the system automates secondary mitigation arrays: activating localized exhaust ventilation, initiating drying cycles, and routing warning maps directly to operators.</p>
            </div>
          </section>

          {/* SCENE 08: THE WAREHOUSE NETWORK */}
          <section className="cinematic-section" style={{ scrollSnapAlign: 'start' }}>
            <div className="cinematic-content">
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>SCENE 07 // SCALED LOGISTICS</div>
              <h2>National Network Map</h2>
              <p>Synchronized central servers network individual silo infrastructures. Command facilities monitor national agricultural grain stocks from a centralized control dashboard.</p>
              <button className="tech-button" onClick={() => jumpToScene('OPERATIONAL')}>
                LAUNCH OPERATIONAL SYSTEM
              </button>
            </div>
          </section>
        </div>
      )}

      {/* LAYER 2: INTERACTIVE OPERATIONAL SYSTEM DASHBOARD */}
      {phase === 'OPERATIONAL' && (
        <div style={{ position: 'absolute', top: '70px', left: 0, width: '100%', height: 'calc(100% - 90px)', zIndex: 10, padding: 'var(--hud-padding)' }}>
          <DashboardHUD
            sensors={sensors}
            alerts={sensors.filter(s => s.status !== 'NORMAL')}
            logs={logs}
            simValues={simValues}
            setSimValues={setSimValues}
            grainType={grainType}
            setGrainType={setGrainType}
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            syncRecords={syncRecords.length}
            activePreset={activePreset}
            applyPreset={applyPreset}
            historicalData={historicalData}
          />
        </div>
      )}
    </>
  );
}
