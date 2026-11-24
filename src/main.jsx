import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const presets = ['Spectrum', 'Mirror', 'Wave', 'Particles', 'Circular'];
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
  const [currentTime, setCurrentTime] = useState(0);
  const [motion, setMotion] = useState(55);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textScale, setTextScale] = useState(100);
  const [exportQuality, setExportQuality] = useState('1080');
  const audioContextRef = useRef(null);
  const streamDestinationRef = useRef(null);
  const [panelCollapsed, setPanelCollapsed] = useState({});
  const togglePanel = (name) => setPanelCollapsed(prev => ({...prev, [name]: !prev[name]}));






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
      // ambient glow
      const glowX = width * (0.5 + Math.sin(tick * 0.008) * motion / 120);
      const glowY = heightPx * (0.55 + Math.cos(tick * 0.006) * motion / 180);
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, width * 0.62);
      glow.addColorStop(0, color + '28');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, heightPx);
      const analyser = analyserRef.current;
      let data = new Uint8Array(density);
      if (analyser) {
        const raw = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(raw);
        data = new Uint8Array(density);
        for (let i = 0; i < density; i++) {
          const idx = Math.floor(i / density * raw.length);
          data[i] = raw[idx] || 0;
        }
      } else {
        for (let i = 0; i < density; i++) data[i] = 10 + Math.abs(Math.sin(tick * 0.024 + i * 0.19)) * (playing ? 160 : 28) + Math.abs(Math.sin(tick * 0.01 + i * 0.11)) * 20;
      }
      const centerY = heightPx * (position / 100);
      const maxH = heightPx * (height / 100) * 0.82;
      const barW = width / density;
      if (preset === 'Wave') {
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
      ctx.fillText(title || 'YOUR SONG TITLE', width / 2, heightPx * 0.23);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.font = '500 ' + (Math.max(10, width * 0.016) * (textScale / 100)) + 'px Inter, Arial, sans-serif';
      ctx.fillText(artist || 'ARTIST NAME', width / 2, heightPx * 0.29);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
  }, [color, preset, density, height, position, playing, title, artist, motion, textColor, textScale, exportQuality, aspect, backgroundColor]);

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
    if (!canvas.captureStream || !window.MediaRecorder) { setExportMessage('Tu navegador no soporta la grabación de canvas.'); return; }
    ensureAudioGraph();
    const canvasStream = canvas.captureStream(30);
    const audioStream = streamDestinationRef.current?.stream;
    const mixed = new MediaStream([...canvasStream.getVideoTracks(), ...(audioStream?.getAudioTracks() || [])]);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const recorder = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: Number(exportQuality) === 1080 ? 8000000 : 4500000 });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (fileName.replace(/\.[^/.]+$/, '') || 'cha-visualizer') + '.webm'; a.click();
      setExportMessage('Exportación terminada. Video WebM descargado en ' + exportQuality + 'p.');
      setExporting(false);
      mixed.getTracks().forEach(t => t.stop());
    };
    setExporting(true); setExportMessage('Grabando visualizador en tiempo real…');
    recorder.start();
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    audioRef.current.onended = () => { if (recorder.state !== 'inactive') recorder.stop(); setPlaying(false); };
    mediaRecorderRef.current = recorder;
  };

  const stopExport = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
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
          {fileName && <div className="loaded-track"><span className="track-icon">♫</span><div><b>{fileName}</b><small>Ready to visualize</small></div><button title="Remove audio" onClick={() => {audioRef.current.pause(); setAudioUrl(''); setFileName(''); setPlaying(false);}}>×</button></div>}
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

        </section>
        <section className="panel-section">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.text} onClick={() => togglePanel("text")}><span className="section-icon">T</span> Text <span className="chevron">{panelCollapsed.text ? '›' : '⌄'}</span></button>
          <label className="field-label">Song title</label><input className="text-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Song title"/>
          <label className="field-label">Artist</label><input className="text-input" value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Artist name"/>
          <div className="color-row text-color-row"><label>Text color</label><div className="color-picker"><input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)}/><span>{textColor.toUpperCase()}</span></div></div>
          <div className="slider-row"><label>Text size <span>{textScale}%</span></label><input type="range" min="60" max="160" step="5" value={textScale} onChange={e=>setTextScale(+e.target.value)}/></div>
          <div className="color-row text-color-row"><label>Text color</label><div className="color-picker"><input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)}/><span>{textColor.toUpperCase()}</span></div></div>
          <div className="slider-row"><label>Text size <span>{textScale}%</span></label><input type="range" min="60" max="160" step="5" value={textScale} onChange={e=>setTextScale(+e.target.value)}/></div>
        </section>
        <section className="panel-section last">
          <button type="button" className="section-title section-toggle" aria-expanded={!panelCollapsed.canvas} onClick={() => togglePanel("canvas")}><span className="section-icon">▣</span> Canvas <span className="chevron">{panelCollapsed.canvas ? '›' : '⌄'}</span></button>
          <label className="field-label">Aspect ratio</label><div className="ratio-grid">{['16:9','9:16','1:1','4:5'].map(r=><button key={r} className={aspect===r?'ratio-active':''} onClick={()=>setAspect(r)}>{r}</button>)}</div>
          <label className="field-label">Export resolution</label><div className="ratio-grid"><button className={exportQuality==='720'?'ratio-active':''} onClick={()=>setExportQuality('720')}>720p</button><button className={exportQuality==='1080'?'ratio-active':''} onClick={()=>setExportQuality('1080')}>1080p</button></div>
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
        <div className="timeline-area"><div className="timeline-header"><span>Timeline</span><span className="timeline-hint">LIVE PREVIEW</span></div><div className="timeline-track"><div className="timeline-playhead"/><div className="timeline-waveform">{Array.from({length:120},(_,i)=><i key={i} style={{height:(6+((i*17+Math.sin(i)*11)%31))+'px'}}/>)}</div></div><div className="timeline-time"><span>00:00</span><span>{audioRef.current?.duration ? formatTime(audioRef.current.duration) : '--:--'}</span></div></div>
        {exportMessage && <div className="toast-msg">{exportMessage}</div>}
      </main>
    </div>
    <audio ref={audioRef} src={audioUrl || undefined} onEnded={()=>setPlaying(false)} onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime)}/>
  </div>;
}

function formatTime(value) {
  if (!Number.isFinite(value)) return '00:00';
  return Math.floor(value / 60).toString().padStart(2, '0') + ':' + Math.floor(value % 60).toString().padStart(2, '0');
}

createRoot(document.getElementById('root')).render(<App />);