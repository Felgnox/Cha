import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const presets = ['Spectrum', 'Mirror', 'Wave', 'Particles', 'Circular', 'Radial', 'Stacked', 'Line'];
const initialColor = '#9b5cff';

function App() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [fileName, setFileName] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [color, setColor] = useState(initialColor);
  const [backgroundColor, setBackgroundColor] = useState('#10142a');
  const [backgroundImageName, setBackgroundImageName] = useState('');
  const [backgroundBeat, setBackgroundBeat] = useState(false);
  const [backgroundDensity, setBackgroundDensity] = useState(50);
  const backgroundImageRef = useRef(null);
  const [preset, setPreset] = useState('Spectrum');
  const [density, setDensity] = useState(64);
  const [height, setHeight] = useState(48);
  const [position, setPosition] = useState(50);
  const [aspect, setAspect] = useState('16:9');
  const [title, setTitle] = useState('YOUR SONG TITLE');
  const [artist, setArtist] = useState('ARTIST NAME');
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [volume, setVolume] = useState(80);
  const exportCleanupRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [motion, setMotion] = useState(55);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textScale, setTextScale] = useState(100);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(23);
  const [exportQuality, setExportQuality] = useState('1080');
  const audioContextRef = useRef(null);
  const streamDestinationRef = useRef(null);
  const [panelCollapsed, setPanelCollapsed] = useState({});
  const togglePanel = (name) => setPanelCollapsed(prev => ({...prev, [name]: !prev[name]}));
  const [settingsReady, setSettingsReady] = useState(false);
  const settingsKey = 'cha-studio-settings-v1';

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || 'null');
      if (saved && saved.version === 1) {
        if (typeof saved.title === 'string') setTitle(saved.title);
        if (typeof saved.artist === 'string') setArtist(saved.artist);
        if (typeof saved.color === 'string') setColor(saved.color);
        if (typeof saved.backgroundColor === 'string') setBackgroundColor(saved.backgroundColor);
        if (Number.isFinite(saved.backgroundDensity)) setBackgroundDensity(saved.backgroundDensity);
        if (typeof saved.backgroundBeat === 'boolean') setBackgroundBeat(saved.backgroundBeat);
        if (presets.includes(saved.preset)) setPreset(saved.preset);
        if (Number.isFinite(saved.density)) setDensity(saved.density);
        if (Number.isFinite(saved.height)) setHeight(saved.height);
        if (Number.isFinite(saved.position)) setPosition(saved.position);
        if (['16:9','9:16','1:1','4:5'].includes(saved.aspect)) setAspect(saved.aspect);
        if (Number.isFinite(saved.motion)) setMotion(saved.motion);
        if (typeof saved.textColor === 'string') setTextColor(saved.textColor);
        if (Number.isFinite(saved.textScale)) setTextScale(saved.textScale);
        if (Number.isFinite(saved.textX)) setTextX(saved.textX);
        if (Number.isFinite(saved.textY)) setTextY(saved.textY);
        if (['720','1080'].includes(String(saved.exportQuality))) setExportQuality(String(saved.exportQuality));
      }
    } catch { /* Ignore corrupted local settings and keep defaults. */ }
    setSettingsReady(true);
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); if (exportCleanupRef.current) exportCleanupRef.current(); }, [audioUrl]);

  useEffect(() => {
    if (!settingsReady) return;
    const settings = { version: 1, title, artist, color, backgroundColor, backgroundDensity, backgroundBeat, preset, density, height, position, aspect, motion, textColor, textScale, textX, textY, exportQuality };
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch { /* Storage may be unavailable or full. */ }
  }, [settingsReady, title, artist, color, backgroundColor, backgroundDensity, backgroundBeat, preset, density, height, position, aspect, motion, textColor, textScale, textX, textY, exportQuality]);






  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    let width = 0, heightPx = 0;
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width; heightPx = box.height;
      const base = Number(exportQuality);
      const targetW = aspect === '16:9' ? (base === 1080 ? 1920 : 1280) : base;
      const scale = Math.max(1, targetW / Math.max(1, width));
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(heightPx * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    let tick = 0;
    const draw = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, heightPx);
      const gradient = ctx.createLinearGradient(0, 0, width, heightPx);
      gradient.addColorStop(0, '#080a13');
      gradient.addColorStop(0.52, backgroundColor);
      gradient.addColorStop(1, '#090912');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, heightPx);
      if (backgroundImageRef.current) {
        const img=backgroundImageRef.current, bass=backgroundBeat?beatEnergy:0;
        const zoom=1+bass*backgroundDensity/180;
        const scale=Math.max(width/img.width,heightPx/img.height)*zoom,dw=img.width*scale,dh=img.height*scale;
        ctx.save();ctx.globalAlpha=Math.min(1,.45+backgroundDensity/180+bass*.35);ctx.drawImage(img,(width-dw)/2,(heightPx-dh)/2,dw,dh);ctx.restore();
      }
      // ambient glow
      const glowX = width * (0.5 + Math.sin(tick * 0.008) * motion / 120);
      const glowY = heightPx * (0.55 + Math.cos(tick * 0.006) * motion / 180);
      const analyser = analyserRef.current;
      let beatEnergy = 0;
      if (analyser) {
        const pulseData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(pulseData);
        const sampleCount = Math.max(1, Math.floor(pulseData.length * 0.22));
        for (let i = 0; i < sampleCount; i++) beatEnergy += pulseData[i];
        beatEnergy = beatEnergy / sampleCount / 255;
      } else {
        beatEnergy = playing ? 0.28 + Math.abs(Math.sin(tick * 0.045)) * 0.22 : 0.04;
      }
      const pulseRadius = width * (0.48 + beatEnergy * 0.24) * (motion / 100);
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, pulseRadius);
      glow.addColorStop(0, color + Math.floor(18 + beatEnergy * 42).toString(16).padStart(2, '0'));
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, heightPx);
      let data = new Uint8Array(density);
      if (analyser) {
        const raw = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(raw);
        data = new Uint8Array(density);
        // Logarithmic frequency sampling gives bass and mids more visual room.
        for (let i = 0; i < density; i++) {
          const normalized = i / Math.max(1, density - 1);
          const lowBin = Math.max(1, Math.floor(Math.pow(normalized, 2.15) * (raw.length - 1)));
          const highBin = Math.min(raw.length - 1, lowBin + Math.max(1, Math.floor(raw.length * 0.008)));
          let band = 0;
          for (let b = lowBin; b <= highBin; b++) band = Math.max(band, raw[b] || 0);
          data[i] = band;
        }
      } else {
        for (let i = 0; i < density; i++) data[i] = 10 + Math.abs(Math.sin(tick * 0.024 + i * 0.19)) * (playing ? 160 : 28) + Math.abs(Math.sin(tick * 0.01 + i * 0.11)) * 20;
      }
      const centerY = heightPx * (position / 100);
      const maxH = heightPx * (height / 100) * 0.82;
      const barW = width / density;
      if (preset === 'Radial') {
        const r=Math.min(width,heightPx)*.22,cx=width*.5;
        for(let i=0;i<density;i++){const a=i/density*Math.PI*2,amp=data[i]/255,outer=r+amp*maxH*.6;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r,centerY+Math.sin(a)*r);ctx.lineTo(cx+Math.cos(a)*outer,centerY+Math.sin(a)*outer);ctx.strokeStyle=color;ctx.lineWidth=Math.max(2,barW*.75);ctx.shadowBlur=10;ctx.shadowColor=color;ctx.stroke();}ctx.shadowBlur=0;
      } else if (preset === 'Stacked') {
        for(let i=0;i<density;i++){const amp=data[i]/255,x=i*barW,w=Math.max(1,barW*.7),h=Math.max(2,amp*maxH);for(let j=0;j<4;j++){ctx.globalAlpha=.35+j*.16;ctx.fillStyle=color;ctx.fillRect(x+(barW-w)/2,centerY-h*(j+1)/4,w,h/4-1);}}ctx.globalAlpha=1;
      } else if (preset === 'Line') {
        ctx.beginPath();for(let i=0;i<density;i++){const x=i*barW,y=centerY+(data[i]/255)*maxH*(Math.sin(i*.2+tick*.025)>=0?1:-1);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor=color;ctx.stroke();ctx.shadowBlur=0;
      } else if (preset === 'Wave') {
        ctx.beginPath();
        for (let i = 0; i < density; i++) {
          const y = centerY + Math.sin(i * 0.13 + tick * 0.03) * (data[i] / 255) * maxH;
          const x = (i / density) * width;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowBlur = 18; ctx.shadowColor = color; ctx.stroke(); ctx.shadowBlur = 0;
      } else if (preset === 'Particles') {
        for (let i = 0; i < density; i++) {
          const amp = data[i] / 255;
          const x = (i / density) * width;
          const y = centerY + Math.sin(tick * 0.03 + i) * amp * maxH * 0.5;
          ctx.beginPath(); ctx.arc(x, y, 1.2 + amp * 4, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (preset === 'Circular') {
        const radius = Math.min(width, heightPx) * 0.2;
        const centerX = width * 0.5;
        for (let i = 0; i < density; i++) {
          const amp = data[i] / 255;
          const angle = (i / density) * Math.PI * 2;
          const outer = radius + Math.max(3, amp * maxH * 0.5);
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
          ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
          ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, barW * 0.72); ctx.lineCap = 'round'; ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        for (let i = 0; i < density; i++) {
          const amp = data[i] / 255;
          const h = Math.max(3, amp * maxH);
          const x = i * barW;
          const w = Math.max(1, barW * 0.62);
          const grad = ctx.createLinearGradient(0, centerY - h, 0, centerY + h);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.18, color);
          grad.addColorStop(1, '#38215e');
          ctx.fillStyle = grad; ctx.shadowBlur = 13; ctx.shadowColor = color;
          if (preset === 'Mirror') {
            ctx.fillRect(x + (barW - w) / 2, centerY - h, w, h);
            ctx.fillRect(x + (barW - w) / 2, centerY, w, h);
          } else {
            ctx.fillRect(x + (barW - w) / 2, centerY - h, w, h);
          }
        }
        ctx.shadowBlur = 0;
      }
      // subtle scanlines and text
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      for (let y = 0; y < heightPx; y += 4) ctx.fillRect(0, y, width, 1);
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.font = '700 ' + (Math.max(14, width * 0.035) * (textScale / 100)) + 'px Inter, Arial, sans-serif';
      ctx.fillText(title || 'YOUR SONG TITLE', width * (textX / 100), heightPx * (textY / 100));
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '500 ' + (Math.max(10, width * 0.016) * (textScale / 100)) + 'px Inter, Arial, sans-serif';
      ctx.fillText(artist || 'ARTIST NAME', width * (textX / 100), heightPx * ((textY + 6) / 100));
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
  }, [color, preset, density, height, position, playing, title, artist, motion, textColor, textScale, textX, textY, exportQuality, aspect, backgroundColor, backgroundBeat, backgroundDensity]);

  const ensureAudioGraph = () => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();
    const streamDest = audioCtx.createMediaStreamDestination();
    analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser); analyser.connect(audioCtx.destination); analyser.connect(streamDest);
    sourceRef.current = source; analyserRef.current = analyser; audioContextRef.current = audioCtx; streamDestinationRef.current = streamDest;
  };

  const loadAudio = (file) => {
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url); setFileName(file.name); setExportMessage('');
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = url; audioRef.current.load(); }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return;
    ensureAudioGraph();
    if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { await audioRef.current.play(); setPlaying(true); }
  };

  const startExport = () => {
    if (!audioUrl) { setExportMessage('Primero carga una canción para exportar.'); return; }
    const canvas = canvasRef.current;
    if (!canvas.captureStream || !window.MediaRecorder || !window.MediaStream) { setExportMessage('Tu navegador no soporta la grabación de canvas.'); return; }
    try {
      ensureAudioGraph();
      const canvasStream = canvas.captureStream(30);
      const audioStream = streamDestinationRef.current?.stream;
      const mixed = new MediaStream([...canvasStream.getVideoTracks(), ...(audioStream?.getAudioTracks() || [])]);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const recorder = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: Number(exportQuality) === 1080 ? 8000000 : 4500000 });
      chunksRef.current = [];
      const originalOnEnded = audioRef.current.onended;
      exportCleanupRef.current = () => {
        mixed.getTracks().forEach(t => t.stop());
        if (audioRef.current) audioRef.current.onended = originalOnEnded;
        exportCleanupRef.current = null;
      };
      recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.onerror = () => { setExportMessage('Error durante la exportación.'); setExporting(false); exportCleanupRef.current?.(); };
      recorder.onstop = () => {
        if (chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: mime });
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = downloadUrl; a.download = (fileName.replace(/\\.[^/.]+$/, '') || 'cha-visualizer') + '.webm'; a.click();
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
          setExportMessage('Exportación terminada. Video WebM descargado en ' + exportQuality + 'p.');
        } else setExportMessage('Exportación detenida antes de crear el video.');
        setExporting(false); exportCleanupRef.current?.();
      };
      setExporting(true); setExportMessage('Grabando visualizador en tiempo real…');
      recorder.start();
      mediaRecorderRef.current = recorder;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => { recorder.stop(); setExportMessage('No se pudo iniciar el audio para exportar.'); });
      audioRef.current.onended = () => { if (recorder.state !== 'inactive') recorder.stop(); setPlaying(false); };
    } catch (err) {
      setExportMessage('No se pudo iniciar la exportación en este navegador.');
      setExporting(false);
      exportCleanupRef.current?.();
    }
  };

  const saveProject = () => {
    const project = { version: 1, title, artist, color, backgroundColor, backgroundDensity, backgroundBeat, preset, density, height, position, aspect, motion, textColor, textScale, textX, textY, exportQuality };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'cha-project.json'; link.click();
    URL.revokeObjectURL(url);
  };
  const loadProject = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        if (p.version !== 1) throw new Error('Unsupported project version');
        if (typeof p.title === 'string') setTitle(p.title);
        if (typeof p.artist === 'string') setArtist(p.artist);
        if (typeof p.color === 'string') setColor(p.color);
        if (typeof p.backgroundColor === 'string') setBackgroundColor(p.backgroundColor);
        if (Number.isFinite(p.backgroundDensity)) setBackgroundDensity(p.backgroundDensity);
        if (typeof p.backgroundBeat === 'boolean') setBackgroundBeat(p.backgroundBeat);
        if (presets.includes(p.preset)) setPreset(p.preset);
        if (Number.isFinite(p.density)) setDensity(p.density);
        if (Number.isFinite(p.height)) setHeight(p.height);
        if (Number.isFinite(p.position)) setPosition(p.position);
        if (['16:9','9:16','1:1','4:5'].includes(p.aspect)) setAspect(p.aspect);
        if (Number.isFinite(p.motion)) setMotion(p.motion);
        if (typeof p.textColor === 'string') setTextColor(p.textColor);
        if (Number.isFinite(p.textScale)) setTextScale(p.textScale);
        if (Number.isFinite(p.textX)) setTextX(p.textX);
        if (Number.isFinite(p.textY)) setTextY(p.textY);
        if (['720','1080'].includes(String(p.exportQuality))) setExportQuality(String(p.exportQuality));
        setExportMessage('Project settings loaded.');
      } catch { setExportMessage('Invalid project file.'); }
    };
    reader.readAsText(file);
  };
  const stopExport = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    audioRef.current?.pause(); setPlaying(false);
  };

  const dimensions = aspect === '16:9' ? 'landscape' : aspect === '9:16' ? 'portrait' : aspect === '4:5' ? 'portrait-45' : 'square';

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">CH</span><span>cha<span className="brand-dot">.</span></span><span className="beta">STUDIO</span></div>
      <div className="top-center"><span className="live-dot" /> AUDIO VISUALIZER <span className="top-divider">/</span> WORKSPACE</div>
      <div className="top-actions"><button className="ghost-btn" onClick={() => setExportMessage('Proyecto listo para seguir editando.')}>↗ Share</button><button className="export-btn" onClick={exporting ? stopExport : startExport}>{exporting ? '■ Stop export' : '⇩ Export video'}</button></div>
    </header>
    <div className="layout">
      <aside className="sidebar">
        <div className="side-heading"><span>EDITOR</span><span className="tiny-tag">BETA</span></div>
        <section className="panel-section">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.audio} onClick={() => togglePanel("audio")}><span className="section-icon">♫</span> Audio <span className="chevron">{panelCollapsed.audio ? '›' : '⌄'}</span></button>
          <label className="upload-zone" htmlFor="audio-upload"><div className="upload-icon">↑</div><strong>{fileName ? 'Replace track' : 'Drop your audio here'}</strong><small>MP3, WAV, M4A · or browse</small><input id="audio-upload" type="file" accept="audio/*" onChange={e => loadAudio(e.target.files?.[0])}/></label>
          {fileName && <div className="loaded-track"><span className="track-icon">♫</span><div><b>{fileName}</b><small>Ready to visualize</small></div><button title="Remove audio" onClick={() => {audioRef.current.pause(); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(''); setFileName(''); setPlaying(false); setCurrentTime(0);}}>×</button></div>}
          <div className="audio-controls"><button className="play-btn" onClick={togglePlay} disabled={!audioUrl}>{playing ? 'Ⅱ' : '▶'}</button><div className="audio-meta"><div className="track-line"><span>{playing ? 'Playing audio' : 'Preview track'}</span><span className="time-label">{audioUrl ? formatTime(currentTime) : '00:00'}</span></div><div className="progress-track"><div className="progress-fill" style={{width: audioRef.current && audioUrl && audioRef.current.duration ? (audioRef.current.currentTime/audioRef.current.duration*100)+'%' : '0%'}} /></div></div><div className="volume-control"><span className="vol-icon">◖))</span><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={e=>{const v=+e.target.value;setVolume(v);if(audioRef.current)audioRef.current.volume=v/100;}}/></div></div>
        </section>
        <section className="panel-section">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.visualizer} onClick={() => togglePanel("visualizer")}><span className="section-icon">◈</span> Visualizer <span className="chevron">{panelCollapsed.visualizer ? '›' : '⌄'}</span></button>
          <div className="preset-grid">{presets.map(p => <button key={p} className={'preset-card ' + (preset === p ? 'active' : '')} onClick={() => setPreset(p)}><div className={'preset-art art-' + p.toLowerCase()}><div className="mini-bars">{Array.from({length:16},(_,i)=><i key={i} style={{height:(8+((i*13)%22))+'px'}} />)}</div></div><span>{p}</span></button>)}</div>
          <div className="slider-row"><label>Density <span>{density}</span></label><input type="range" min="16" max="128" step="4" value={density} onChange={e=>setDensity(+e.target.value)}/></div>
          <div className="slider-row"><label>Amplitude <span>{height}%</span></label><input type="range" min="15" max="100" value={height} onChange={e=>setHeight(+e.target.value)}/></div>
          <div className="slider-row"><label>Vertical position <span>{position}%</span></label><input type="range" min="10" max="90" value={position} onChange={e=>setPosition(+e.target.value)}/></div>
          <div className="slider-row"><label>Background motion <span>{motion}%</span></label><input type="range" min="0" max="100" value={motion} onChange={e=>setMotion(+e.target.value)}/></div>
        </section>
        <section className="panel-section">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.appearance} onClick={() => togglePanel("appearance")}><span className="section-icon">✧</span> Appearance <span className="chevron">{panelCollapsed.appearance ? '›' : '⌄'}</span></button>
          <div className="color-row"><label>Visualizer color</label><div className="color-picker"><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><span>{color.toUpperCase()}</span></div></div>
          <div className="swatches">{['#9b5cff','#37e0ff','#ff4d9d','#b8ff4d','#ffb347','#ffffff'].map(c=><button key={c} style={{background:c}} className={color===c?'selected':''} onClick={()=>setColor(c)} title={c}/>)}</div>
          <div className="color-row"><label>Background color</label><div className="color-picker"><input type="color" value={backgroundColor} onChange={e=>setBackgroundColor(e.target.value)}/><span>{backgroundColor.toUpperCase()}</span></div></div>
          <div className="swatches">{['#10142a','#160a25','#08202a','#22100c','#0b2020','#111111'].map(c=><button key={'bg-'+c} style={{background:c}} className={backgroundColor===c?'selected':''} onClick={()=>setBackgroundColor(c)} title={c}/>)}</div>
          <label className="upload-zone bg-upload" htmlFor="background-upload"><div className="upload-icon">▧</div><strong>{backgroundImageName || 'Add background image'}</strong><small>JPG, PNG, WEBP</small><input id="background-upload" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(!file)return;setBackgroundImageName(file.name);const img=new Image();img.onload=()=>{backgroundImageRef.current=img;};img.src=URL.createObjectURL(file);}}/></label>
          <div className="slider-row"><label>Bass-reactive background <span>{backgroundBeat?'ON':'OFF'}</span></label><button className="toggle-btn" onClick={()=>setBackgroundBeat(v=>!v)}>{backgroundBeat?'Disable bass reaction':'Enable bass reaction'}</button></div>
          <div className="slider-row"><label>Background intensity <span>{backgroundDensity}%</span></label><input type="range" min="0" max="100" value={backgroundDensity} onChange={e=>setBackgroundDensity(+e.target.value)}/></div>

        </section>
        <section className="panel-section">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.text} onClick={() => togglePanel("text")}><span className="section-icon">T</span> Text <span className="chevron">{panelCollapsed.text ? '›' : '⌄'}</span></button>
          <label className="field-label">Song title</label><input className="text-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Song title"/>
          <label className="field-label">Artist</label><input className="text-input" value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Artist name"/>

          <div className="slider-row"><label>Text horizontal <span>{textX}%</span></label><input type="range" min="5" max="95" value={textX} onChange={e=>setTextX(+e.target.value)}/></div>
          <div className="slider-row"><label>Text vertical <span>{textY}%</span></label><input type="range" min="5" max="85" value={textY} onChange={e=>setTextY(+e.target.value)}/></div>
          <div className="color-row text-color-row"><label>Text color</label><div className="color-picker"><input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)}/><span>{textColor.toUpperCase()}</span></div></div>
          <div className="slider-row"><label>Text size <span>{textScale}%</span></label><input type="range" min="60" max="160" step="5" value={textScale} onChange={e=>setTextScale(+e.target.value)}/></div>
        </section>
        <section className="panel-section last">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.canvas} onClick={() => togglePanel("canvas")}><span className="section-icon">▣</span> Canvas <span className="chevron">{panelCollapsed.canvas ? '›' : '⌄'}</span></button>
          <label className="field-label">Aspect ratio</label><div className="ratio-grid">{['16:9','9:16','1:1','4:5'].map(r=><button key={r} className={aspect===r?'ratio-active':''} onClick={()=>setAspect(r)}>{r}</button>)}</div>
          <div className="project-actions"><button type="button" onClick={saveProject}>Save project</button><label className="project-load">Load project<input type="file" accept="application/json,.json" onChange={e=>loadProject(e.target.files?.[0])}/></label></div>
          <label className="field-label">Export resolution</label><div className="ratio-grid"><button className={exportQuality==='720'?'ratio-active':''} onClick={()=>setExportQuality('720')}>720p</button><button className={exportQuality==='1080'?'ratio-active':''} onClick={()=>setExportQuality('1080')}>1080p</button></div>

        </section>
        <div className="sidebar-footer"><span className="status-indicator"/> Autosaved locally <span>v0.1</span></div>
      </aside>
      <main className="workspace">
        <div className="workspace-head"><div><span className="crumb">PROJECT / </span><strong>Untitled visualizer</strong><span className="save-cloud">✓ Saved</span></div><div className="workspace-tools"><button title="Zoom out">−</button><span>Fit</span><button title="Zoom in">+</button></div></div>
        <div className="preview-stage">
          <div className={'preview-frame ' + dimensions}><canvas ref={canvasRef}/><div className="frame-badge">{aspect} <span>•</span> 30 FPS</div></div>
          <div className="preview-note"><span className="sparkle">✦</span> Preview updates live as you edit</div>
        </div>
        <div className="timeline-area"><div className="timeline-header"><span>Timeline</span><span className="timeline-hint">LIVE PREVIEW</span></div><div className="timeline-track"><div className="timeline-playhead" style={{left:duration?currentTime/duration*100+'%':'0%'}}/><div className="timeline-waveform">{Array.from({length:120},(_,i)=><i key={i} style={{height:(6+((i*17+Math.sin(i)*11)%31))+'px'}}/>)}</div></div><div className="timeline-time"><span>00:00</span><span>{duration ? formatTime(duration) : '--:--'}</span></div><input className="seek-slider" aria-label="Seek playback" type="range" min="0" max={duration||0} step="0.01" value={Math.min(currentTime,duration||0)} disabled={!duration} onChange={e=>{const t=+e.target.value;if(audioRef.current){audioRef.current.currentTime=t;setCurrentTime(t);}}}/></div>
        {exportMessage && <div className="toast-msg">{exportMessage}</div>}
      </main>
    </div>
    <audio ref={audioRef} src={audioUrl || undefined} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||0)} onEnded={()=>setPlaying(false)} onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime)}/>
  </div>;
}

function formatTime(value) {
  if (!Number.isFinite(value)) return '00:00';
  return Math.floor(value / 60).toString().padStart(2, '0') + ':' + Math.floor(value % 60).toString().padStart(2, '0');
}

createRoot(document.getElementById('root')).render(<App />);