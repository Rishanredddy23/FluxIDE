/* ═══════════════════════════════════════
   FluxIDE
   script.js — Full App Logic
═══════════════════════════════════════ */

// ── State ──────────────────────────────
const state = {
  currentPage: 'generate',
  currentTab: 'ino',
  generatedCode: '',
  isGenerating: false,
  particlesEnabled: true,
  voiceActive: false,
  projectFolder: '',
  projectName: 'fluxide-project',
  agentConfigured: false,
  agentModel: 'gpt-4.1-mini',
  agentApiUrl: 'https://api.openai.com/v1/chat/completions',
  serialPorts: [],
  selectedPort: '',
  projects: [
    { id: 1, name: 'LED Blink Demo', desc: 'Basic blink with serial output', board: 'Arduino Uno', lang: 'C++', date: '2 days ago' },
    { id: 2, name: 'DHT Weather Station', desc: 'Temperature & humidity logger with OLED', board: 'ESP32', lang: 'C++', date: '1 week ago' },
    { id: 3, name: 'Servo Controller', desc: 'Multi-servo sweep with potentiometer', board: 'Arduino Mega', lang: 'C++', date: '2 weeks ago' },
    { id: 4, name: 'OLED Clock', desc: 'Real-time clock on 128×64 display', board: 'ESP32', lang: 'MicroPython', date: '3 weeks ago' },
  ],
  templates: [
    { icon: '💡', name: 'Blink LED', desc: 'Toggle pin high/low with delay', tag: 'Beginner' },
    { icon: '🌡️', name: 'DHT Sensor', desc: 'Read temperature and humidity', tag: 'Sensor' },
    { icon: '⚙️', name: 'Servo Control', desc: 'Sweep servo motor 0–180°', tag: 'Motor' },
    { icon: '📺', name: 'OLED Display', desc: 'Print text to I2C OLED', tag: 'Display' },
    { icon: '🔊', name: 'Buzzer Melody', desc: 'Play tones with passive buzzer', tag: 'Audio' },
    { icon: '🚗', name: 'Motor Driver', desc: 'DC motors via L298N', tag: 'Motor' },
    { icon: '📶', name: 'WiFi Connect', desc: 'Connect to WiFi (ESP32)', tag: 'Network' },
    { icon: '🔴', name: 'IR Remote', desc: 'Decode IR remote signals', tag: 'Sensor' },
    { icon: '📊', name: 'Analog Logger', desc: 'Read and log analog pins', tag: 'Data' },
    { icon: '🔵', name: 'Bluetooth UART', desc: 'Serial over Bluetooth (ESP32)', tag: 'Network' },
    { icon: '🎛️', name: 'Encoder Input', desc: 'Rotary encoder with menu', tag: 'Input' },
    { icon: '🌊', name: 'Ultrasonic', desc: 'Distance with HC-SR04', tag: 'Sensor' },
  ],
  historyItems: [
    { prompt: 'Servo sweep 0–180°', board: 'Arduino Uno', lines: 42 },
    { prompt: 'DHT11 temp + humidity', board: 'Arduino Uno', lines: 58 },
    { prompt: 'OLED clock display', board: 'ESP32', lines: 91 },
  ]
};

// ── Splash Sequence ────────────────────
const splashMessages = [
  'Initializing AI core...',
  'Preparing agent bridge...',
  'Loading board profiles...',
  'Scanning USB ports...',
  'System ready.'
];

let splashIdx = 0;
const splashStatus = document.getElementById('splashStatus');

function cycleSplash() {
  if (splashIdx < splashMessages.length - 1) {
    splashIdx++;
    splashStatus.textContent = splashMessages[splashIdx];
    setTimeout(cycleSplash, 520);
  }
}
setTimeout(cycleSplash, 400);

window.addEventListener('DOMContentLoaded', () => {
  initParticles();

  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.classList.add('hidden');
      const app = document.getElementById('app');
      app.classList.remove('hidden');
      requestAnimationFrame(() => {
        app.classList.add('visible');
        animateIn();
      });
    }, 800);
  }, 3200);

  renderProjects();
  renderTemplates();
  renderPinout();
});

function animateIn() {
  const items = document.querySelectorAll('.glass-card, .stat-card, .nav-item');
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.4s ease ${i * 40}ms, transform 0.4s ease ${i * 40}ms`;
    requestAnimationFrame(() => {
      el.style.opacity = '';
      el.style.transform = '';
    });
  });
}

// ── Particles ─────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.3;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.color = Math.random() > 0.5 ? '139,92,246' : '6,182,212';
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function connect() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139,92,246,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    if (!state.particlesEnabled) { animId = requestAnimationFrame(loop); ctx.clearRect(0,0,W,H); return; }
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    connect();
    animId = requestAnimationFrame(loop);
  }
  loop();
}

function toggleParticles(on) {
  state.particlesEnabled = on;
}

// ── Navigation ─────────────────────────
function switchPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const labels = { generate: 'Generate Code', projects: 'My Projects', templates: 'Templates' };
  document.getElementById('bcCurrent').textContent = labels[page] || page;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── Tab Switching ───────────────────────
function switchTab(tab) {
  state.currentTab = tab;
  ['ino', 'output', 'explain', 'connections', 'terminal'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`code-${t}`).classList.toggle('hidden', t !== tab);
  });
}

async function handleTerminalCommand(event) {
  if (event.key !== 'Enter') return;
  const inputEl = event.target;
  const cmd = inputEl.value.trim();
  if (!cmd) return;
  
  const outputEl = document.getElementById('terminalOutput');
  outputEl.innerHTML += `<div style="color: var(--accent); margin-top: 8px;">> ${escapeHtml(cmd)}</div>`;
  inputEl.value = '';
  inputEl.disabled = true;

  try {
    const result = await window.fluxAPI.runTerminalCommand(cmd);
    const color = result.ok ? 'var(--text-primary)' : 'var(--danger)';
    outputEl.innerHTML += `<div style="color: ${color}; opacity: 0.9; margin-top: 4px;">${escapeHtml(result.output)}</div>`;
  } catch (err) {
    outputEl.innerHTML += `<div style="color: var(--danger); opacity: 0.9; margin-top: 4px;">Error: ${escapeHtml(err.message)}</div>`;
  }
  
  outputEl.scrollTop = outputEl.scrollHeight;
  inputEl.disabled = false;
  inputEl.focus();
}

// ── Code Generation ─────────────────────
async function generateCode() {
  if (state.isGenerating) return;
  const prompt = document.getElementById('promptInput').value.trim();
  const subPrompt = document.getElementById('subPromptInput').value.trim();
  if (!prompt) { showToast('Please enter a prompt first', 'error'); return; }
  if (!state.agentConfigured) { openAgentSettings(); showToast('Confirm your agent API and model first', 'error'); return; }
  const board = document.getElementById('boardSelect').value;
  const lang = document.getElementById('langSelect').value;

  state.isGenerating = true;
  const btn = document.getElementById('generateBtn');
  const genStatus = document.getElementById('genStatus');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Generating...';
  genStatus?.classList.remove('hidden');

  const genLabels = ['Analyzing prompt...', 'Designing architecture...', 'Writing code...', 'Adding comments...', 'Optimizing...'];
  let li = 0;
  const labelInterval = setInterval(() => {
    if (genStatus && li < genLabels.length) genStatus.innerHTML = `<span class="gen-check">✓</span> ${genLabels[li++]}`;
  }, 600);

  const startTime = Date.now();

  try {
    let rawText = '';
    let totalTokens = 0;
    const stopChunk = window.fluxAPI.onAgentChunk((chunk) => {
      rawText += chunk;
      state.generatedCode = rawText;
      renderLiveCode(rawText, true);
    });
    const stopDone = window.fluxAPI.onAgentDone((data) => {
      if (typeof data === 'object') {
        rawText = data.text || rawText;
        totalTokens = data.tokens || 0;
      } else {
        rawText = data || rawText;
      }
    });

    const result = await window.fluxAPI.generateCode({ prompt, subPrompt, board, lang, port: state.selectedPort });
    if (result && result.tokens) totalTokens = result.tokens;
    
    stopChunk();
    stopDone();
    clearInterval(labelInterval);
    if (genStatus) genStatus.innerHTML = '<span class="gen-check">✓</span> Code generated';

    // Split code, explanation, and pinout
    let codeText = rawText, explainText = '', pinoutText = '';
    const explainIdx = rawText.indexOf('// EXPLAIN:');
    const pinoutIdx = rawText.indexOf('// PINOUT:');
    
    let endOfCodeIdx = rawText.length;
    if (explainIdx !== -1 && (pinoutIdx === -1 || explainIdx < pinoutIdx)) endOfCodeIdx = explainIdx;
    else if (pinoutIdx !== -1) endOfCodeIdx = pinoutIdx;
    
    codeText = rawText.substring(0, endOfCodeIdx).trim();

    if (explainIdx !== -1) {
      let endIdx = pinoutIdx !== -1 && pinoutIdx > explainIdx ? pinoutIdx : rawText.length;
      explainText = rawText.substring(explainIdx + 11, endIdx).trim();
    }
    if (pinoutIdx !== -1) {
      let endIdx = explainIdx !== -1 && explainIdx > pinoutIdx ? explainIdx : rawText.length;
      pinoutText = rawText.substring(pinoutIdx + 10, endIdx).trim();
    }

    state.generatedCode = codeText;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const lines = codeText.split('\n').length;
    const size = Math.floor(codeText.length * 0.9 + 800);

    renderLiveCode(codeText);

    // Update output log
    const now = new Date();
    document.getElementById('outputDisplay').textContent =
      `[${now.toLocaleTimeString()}] Generation complete\n[${now.toLocaleTimeString()}] Lines: ${lines}\n[${now.toLocaleTimeString()}] Estimated flash size: ${size} bytes\n[${now.toLocaleTimeString()}] Tokens used: ${totalTokens}\n[${now.toLocaleTimeString()}] Board target: ${board}\n[${now.toLocaleTimeString()}] Language: ${lang}\n[${now.toLocaleTimeString()}] Status: READY TO FLASH`;

    // Update explanation
    const explainEl = document.getElementById('explainDisplay');
    let explainHTML = '';
    if (explainText) explainHTML += `<h3>What this code does</h3><p>${explainText.replace(/\n/g, '</p><p>')}</p>`;
    if (!explainText) explainHTML += `<h3>Generation complete</h3><p>Code generated for <code>${board}</code> in <code>${lang}</code>. ${lines} lines written in ${elapsed}s.</p>`;
    else explainHTML += `<h3>Board & Language</h3><p>${board} · ${lang}</p>`;
    explainEl.innerHTML = explainHTML;

    // Update connections
    const connEl = document.getElementById('connectionsDisplay');
    if (pinoutText) {
      connEl.innerHTML = `<h3 style="color: var(--success); margin-bottom: 12px; font-size: 13px;">AI Recommended Pinout</h3><p style="font-family: var(--font-code); color: var(--text-primary); background: rgba(0,0,0,0.2); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">${pinoutText.replace(/\n/g, '<br>')}</p>`;
    } else {
      connEl.innerHTML = `<p style="color:var(--text-muted)">No specific hardware connections detected for this prompt.</p>`;
    }

    // Stats
    animateStat('stat-tokens', totalTokens || Math.floor((prompt.length + subPrompt.length) * 4 + lines * 12));
    animateStat('stat-lines', lines);
    document.getElementById('stat-size').textContent = `${(size / 1024).toFixed(1)}KB`;
    document.getElementById('stat-time').textContent = elapsed;

    // Flash section
    document.getElementById('compileStatus').textContent = '✓ Ready';
    document.getElementById('compileStatus').style.color = 'var(--success)';
    document.getElementById('sketchSize').textContent = `${size} / 32,256 B`;
    document.getElementById('flashBoard').textContent = board;
    document.getElementById('flashBoardName').textContent = state.selectedPort ? `${board} (${state.selectedPort})` : 'Select port';

    await saveGeneratedCodeSilently();
    showToast('Code generated successfully!', 'success');

  } catch (err) {
    clearInterval(labelInterval);
    document.getElementById('codeDisplay').textContent = `// Error generating code\n// ${err.message}\n// Please check your connection and try again.`;
    showToast('Generation failed. Check console.', 'error');
    console.error(err);
  }

  state.isGenerating = false;
  btn.disabled = false;
  btn.querySelector('.btn-text').textContent = 'Generate Code';
  setTimeout(() => genStatus?.classList.add('hidden'), 1300);
}

function typewriterCode(code) {
  renderLiveCode(code, true);
}

function renderLiveCode(code, streaming = false) {
  const el = document.getElementById('codeDisplay');
  const text = code || '// Waiting for agent output...';
  el.innerHTML = highlightCode(text) + (streaming ? '<span class="typing-cursor"></span>' : '');
  el.parentElement.scrollTop = el.parentElement.scrollHeight;
}

function highlightCode(code) {
  return String(code).split('\n').map(highlightLine).join('\n');
}

function highlightLine(line) {
  const commentAt = line.indexOf('//');
  const codePart = commentAt >= 0 ? line.slice(0, commentAt) : line;
  const commentPart = commentAt >= 0 ? line.slice(commentAt) : '';
  return highlightCodePart(codePart) + (commentPart ? '<span class="c-comment">' + escapeHtml(commentPart) + '</span>' : '');
}

function highlightCodePart(part) {
  const tokens = [];
  let escaped = escapeHtml(part).replace(/&quot;[^&]*(?:&quot;|$)/g, (match) => {
    const key = `~~str${tokens.length}~~`;
    tokens.push(`<span class="c-str">${match}</span>`);
    return key;
  });

  escaped = escaped
    .replace(/\b(void|int|const|float|double|bool|char|long|unsigned|byte|String|boolean|return|if|else|for|while|do|switch|case|break|continue|class|struct|setup|loop)\b/g, '<span class="c-kw">$1</span>')
    .replace(/#(include|define)\b/g, '<span class="c-kw">#$1</span>')
    .replace(/\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|millis|Serial|begin|println|print|write|available|read|attach|detach|map|constrain|random|abs|min|max|sqrt|pow)\b/g, '<span class="c-fn">$1</span>')
    .replace(/\b([A-Z_][A-Z0-9_]{2,})\b/g, '<span class="c-var">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="c-num">$1</span>');

  tokens.forEach((token, idx) => {
    escaped = escaped.replace(`~~str${idx}~~`, token);
  });
  return escaped;
}

function animateStat(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = target / 30;
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString();
    if (current >= target) clearInterval(interval);
  }, 30);
}

// ── Flash ───────────────────────────────
async function flashCode() {
  const code = state.generatedCode || document.getElementById('codeDisplay').textContent.trim();
  const board = document.getElementById('boardSelect').value;
  const progress = document.getElementById('flashProgress');
  const fill = document.getElementById('fpFill');
  const label = document.getElementById('fpLabel');
  const flashBtn = document.getElementById('flashBtn');

  if (!code) {
    showToast('Generate or write code first', 'error');
    return;
  }
  if (!state.selectedPort) {
    openBoardManager();
    showToast('Detect and select a COM port before upload', 'error');
    return;
  }

  progress.style.display = 'block';
  fill.style.width = '8%';
  label.textContent = `Uploading to ${state.selectedPort}...`;
  flashBtn.disabled = true;

  try {
    const result = await window.fluxAPI.uploadBoard({ code, board, port: state.selectedPort });
    fill.style.width = '100%';
    label.textContent = 'Upload complete';
    document.getElementById('compileStatus').textContent = 'Uploaded';
    document.getElementById('compileStatus').style.color = 'var(--success)';
    document.getElementById('errorBox').classList.add('hidden');
    showToast(`Uploaded to ${board} on ${state.selectedPort}`, 'success');
    const log = document.getElementById('serialLog');
    const ts = new Date().toLocaleTimeString();
    log.innerHTML += `<div class="log-line"><span class="log-ts">${ts}</span> Upload complete - ${escapeHtml(board)} on ${escapeHtml(state.selectedPort)}</div>`;
    if (result.output) log.innerHTML += `<div class="log-line"><span class="log-ts">${ts}</span> ${escapeHtml(result.output).slice(0, 400)}</div>`;
    log.scrollTop = log.scrollHeight;
  } catch (err) {
    fill.style.width = '0%';
    label.textContent = 'Upload failed';
    document.getElementById('compileStatus').textContent = 'Upload failed';
    document.getElementById('compileStatus').style.color = 'var(--danger)';
    showToast('Upload failed', 'error');
    const eb = document.getElementById('errorBox');
    eb.classList.remove('hidden');
    document.getElementById('errorContent').textContent = err.message || 'Unknown error occurred.';
  } finally {
    setTimeout(() => {
      progress.style.display = 'none';
      fill.style.width = '0%';
      flashBtn.disabled = false;
    }, 1200);
  }
}

// Copy / Download
function copyCode() {
  const text = document.getElementById('codeDisplay').textContent;
  if (!text) { showToast('Nothing to copy', 'error'); return; }
  navigator.clipboard.writeText(text).then(() => showToast('Code copied to clipboard!', 'success'));
}

function downloadCode() {
  const code = state.generatedCode || document.getElementById('codeDisplay').textContent;
  if (!code) { showToast('Nothing to download', 'error'); return; }
  const board = document.getElementById('boardSelect').value;
  const fname = board.toLowerCase().replace(/\s+/g, '_') + '_sketch.ino';
  const blob = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();
  showToast(`Downloaded ${fname}`, 'success');
}

function toggleFullscreen() {
  const codeCard = document.querySelector('.code-card');
  codeCard.style.position = codeCard.style.position === 'fixed' ? '' : 'fixed';
  codeCard.style.inset = codeCard.style.inset ? '' : '16px';
  codeCard.style.zIndex = codeCard.style.zIndex ? '' : '100';
  codeCard.style.margin = codeCard.style.margin ? '' : '0';
}

// ── Prompt Helpers ──────────────────────
function insertPrompt(text) {
  const ta = document.getElementById('promptInput');
  ta.value = text;
  autoResize(ta);
  ta.focus();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.max(110, el.scrollHeight) + 'px';
}

function loadHistory(idx) {
  const item = state.historyItems[idx];
  if (item) insertPrompt(item.prompt);
}

// ── Board Update ─────────────────────────
function updateBoard() {
  const board = document.getElementById('boardSelect').value;
  document.getElementById('boardName').textContent = board;
  document.getElementById('flashBoardName').textContent = state.selectedPort ? `${board} (${state.selectedPort})` : 'Select port';
  document.getElementById('flashBoard').textContent = state.selectedPort ? `${board} on ${state.selectedPort}` : board;
  const portText = state.selectedPort ? `${state.selectedPort} · Selected` : 'No COM port selected';
  document.getElementById('boardPort').textContent = portText;
  renderDetectedPorts();
  showToast(`Board set to ${board}`, 'success');
}

// ── Model Cycle ──────────────────────────
const models = [
  'gpt-4.1-mini',
  'gpt-4.1',
  'claude-sonnet-4-5',
];
let modelIdx = 0;
function cycleModel() {
  modelIdx = (modelIdx + 1) % models.length;
  document.getElementById('agentModel').value = models[modelIdx];
  document.getElementById('modelLabel').textContent = `${models[modelIdx]} · Not confirmed`;
  showToast(`Model: ${models[modelIdx]}`, 'success');
}

// ── Voice ────────────────────────────────
function toggleVoice() {
  const btn = document.querySelector('[title="Voice Input"]');
  state.voiceActive = !state.voiceActive;
  btn.classList.toggle('voice-active', state.voiceActive);

  if (state.voiceActive && 'webkitSpeechRecognition' in window) {
    const recog = new webkitSpeechRecognition();
    recog.lang = 'en-US';
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      document.getElementById('promptInput').value = transcript;
      state.voiceActive = false;
      btn.classList.remove('voice-active');
      showToast('Voice captured!', 'success');
    };
    recog.onerror = () => { state.voiceActive = false; btn.classList.remove('voice-active'); };
    recog.start();
    showToast('Listening... speak now', 'success');
  } else if (state.voiceActive) {
    showToast('Voice input activated (demo)', 'success');
    setTimeout(() => {
      state.voiceActive = false;
      btn.classList.remove('voice-active');
    }, 2000);
  }
}

// ── Modals ───────────────────────────────
function openSerial() { document.getElementById('serialModal').classList.remove('hidden'); }
function openBoardManager() {
  document.getElementById('boardModal').classList.remove('hidden');
  scanBoards(false);
}
function openPinout() { document.getElementById('pinoutModal').classList.remove('hidden'); }
function openSettings() { document.getElementById('settingsModal').classList.remove('hidden'); }
function openAgentSettings() { document.getElementById('agentModal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

async function confirmAgentSettings() {
  const apiUrl = document.getElementById('agentApiUrl').value.trim();
  const apiKey = document.getElementById('agentApiKey').value.trim();
  const model = document.getElementById('agentModel').value.trim();
  if (!apiUrl || !apiKey || !model) {
    showToast('API URL, key, and model are required', 'error');
    return;
  }
  try {
    const result = await window.fluxAPI.configureAgent({ apiUrl, apiKey, model });
    state.agentConfigured = result.ok;
    state.agentModel = result.model;
    state.agentApiUrl = result.apiUrl;
    document.getElementById('modelLabel').textContent = `${result.model} · Agent Ready`;
    document.getElementById('settingsModelLabel').textContent = `Currently: ${result.model}`;
    closeModal('agentModal');
    showToast('Agent confirmed', 'success');
  } catch (err) {
    showToast(err.message || 'Agent setup failed', 'error');
  }
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

function sendSerial() {
  const input = document.getElementById('serialCmd');
  const cmd = input.value.trim();
  if (!cmd) return;
  const log = document.getElementById('serialLog');
  const now = new Date().toLocaleTimeString();
  log.innerHTML += `<div class="log-line"><span class="log-ts">${now}</span> <span style="color:var(--accent-light)">→ ${cmd}</span></div>`;
  log.scrollTop = log.scrollHeight;
  input.value = '';
  setTimeout(() => {
    const ts = new Date().toLocaleTimeString();
    log.innerHTML += `<div class="log-line"><span class="log-ts">${ts}</span> OK</div>`;
    log.scrollTop = log.scrollHeight;
  }, 300);
}

// ── Render Functions ─────────────────────
function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = state.projects.map(p => `
    <div class="project-card" onclick="loadProject(${p.id})">
      <div class="pc-board">${p.board}</div>
      <div class="pc-name">${p.name}</div>
      <div class="pc-desc">${p.desc}</div>
      <div class="pc-meta">
        <span class="pc-lang">${p.lang}</span>
        <span class="pc-date">${p.date}</span>
      </div>
    </div>
  `).join('');
}

function renderTemplates() {
  const grid = document.getElementById('templatesGrid');
  grid.innerHTML = state.templates.map(t => `
    <div class="template-card" onclick="useTemplate('${t.name}')">
      <div class="tc-preview">${t.icon}</div>
      <div class="tc-body">
        <div class="tc-name">${t.name}</div>
        <div class="tc-desc">${t.desc}</div>
        <span class="tc-tag">${t.tag}</span>
      </div>
    </div>
  `).join('');
}

function filterTemplates(query) {
  const q = query.toLowerCase();
  const filtered = state.templates.filter(t =>
    t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)
  );
  const grid = document.getElementById('templatesGrid');
  grid.innerHTML = filtered.map(t => `
    <div class="template-card" onclick="useTemplate('${t.name}')">
      <div class="tc-preview">${t.icon}</div>
      <div class="tc-body">
        <div class="tc-name">${t.name}</div>
        <div class="tc-desc">${t.desc}</div>
        <span class="tc-tag">${t.tag}</span>
      </div>
    </div>
  `).join('');
}

function renderPinout() {
  const pins = [
    {num:'D0', func:'RX'},{num:'D1', func:'TX'},{num:'D2', func:'INT0'},{num:'D3', func:'PWM'},{num:'D4', func:'GPIO'},
    {num:'D5', func:'PWM'},{num:'D6', func:'PWM'},{num:'D7', func:'GPIO'},{num:'D8', func:'GPIO'},{num:'D9', func:'PWM'},
    {num:'D10', func:'SS/PWM'},{num:'D11', func:'MOSI'},{num:'D12', func:'MISO'},{num:'D13', func:'LED/SCK'},{num:'A0', func:'ADC'},
    {num:'A1', func:'ADC'},{num:'A2', func:'ADC'},{num:'A3', func:'ADC'},{num:'A4', func:'SDA'},{num:'A5', func:'SCL'},
    {num:'3.3V', func:'Power'},{num:'5V', func:'Power'},{num:'GND', func:'Ground'},{num:'GND', func:'Ground'},{num:'VIN', func:'Power'},
  ];
  document.getElementById('pinoutGrid').innerHTML = pins.map(p => `
    <div class="pin-item">
      <div class="pin-num">${p.num}</div>
      <div class="pin-func">${p.func}</div>
    </div>
  `).join('');
}

function loadProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (p) {
    switchPage('generate');
    insertPrompt(`Generate code for: ${p.name} — ${p.desc}`);
    showToast(`Loaded project: ${p.name}`, 'success');
  }
}

async function chooseProjectFolder() {
  const folder = await window.fluxAPI.chooseFolder();
  if (!folder) return;
  state.projectFolder = folder;
  document.getElementById('folderPath').textContent = folder;
  showToast('Project folder selected', 'success');
}

function currentProjectPayload() {
  const prompt = document.getElementById('promptInput').value.trim();
  const subPrompt = document.getElementById('subPromptInput').value.trim();
  const projectSeed = (subPrompt.split('\n')[0] || prompt || 'fluxide-project').replace(/^Project:\s*/i, '');
  state.projectName = projectSeed.slice(0, 48) || 'fluxide-project';
  return {
    folder: state.projectFolder,
    name: state.projectName,
    fileName: 'sketch.ino',
    code: state.generatedCode || document.getElementById('codeDisplay').textContent,
    prompt,
    subPrompt,
  };
}

async function saveGeneratedCodeSilently() {
  if (!state.projectFolder || !state.generatedCode) return;
  try {
    await window.fluxAPI.saveFile(currentProjectPayload());
  } catch (err) {
    console.warn('Auto-save skipped:', err.message);
  }
}

async function saveCurrentFile() {
  if (!state.projectFolder) {
    await chooseProjectFolder();
    if (!state.projectFolder) return;
  }
  try {
    const result = await window.fluxAPI.saveFile(currentProjectPayload());
    showToast(`Saved ${result.filePath}`, 'success');
  } catch (err) {
    showToast(err.message || 'Save failed', 'error');
  }
}

async function exportProjectZip() {
  if (!state.projectFolder) {
    await chooseProjectFolder();
    if (!state.projectFolder) return;
  }
  try {
    const result = await window.fluxAPI.exportZip(currentProjectPayload());
    showToast(`Zip exported: ${result.zipPath}`, 'success');
  } catch (err) {
    showToast(err.message || 'Zip export failed', 'error');
  }
}

function saveCurrentProject() {
  const name = prompt("Enter a name to save this project under 'My Projects':", state.projectName);
  if (!name) return;
  state.projectName = name;
  const desc = document.getElementById('subPromptInput').value.trim().split('\n')[0] || 'My custom project';
  const board = document.getElementById('boardSelect').value;
  const lang = document.getElementById('langSelect').value;
  
  state.projects.unshift({
    id: Date.now(),
    name: name,
    desc: desc.length > 50 ? desc.substring(0, 47) + '...' : desc,
    board: board,
    lang: lang,
    date: 'Just now'
  });
  renderProjects();
  showToast('Project saved to My Projects', 'success');
}

async function promptInstallLib() {
  const libName = prompt("Enter library name to install (e.g. 'DHT sensor library'):");
  if (!libName) return;
  showToast(`Installing library '${libName}'...`, 'info');
  try {
    const result = await window.fluxAPI.installLib(libName);
    showToast(`Library installed successfully!`, 'success');
    const log = document.getElementById('serialLog');
    if (log) {
      log.innerHTML += `<div class="log-line"><span class="log-ts">${new Date().toLocaleTimeString()}</span> Installed ${escapeHtml(libName)}</div>`;
    }
  } catch (err) {
    showToast('Library install failed', 'error');
    const eb = document.getElementById('errorBox');
    eb.classList.remove('hidden');
    document.getElementById('errorContent').textContent = err.message || 'Failed to install library.';
  }
}

async function installZipLib() {
  showToast('Select a .zip library file...', 'info');
  try {
    const result = await window.fluxAPI.installLibZip();
    if (!result.ok) {
      if (result.message !== 'Cancelled') showToast(result.message || 'Install cancelled', 'error');
      return;
    }
    showToast('Zip library installed successfully!', 'success');
    const log = document.getElementById('serialLog');
    if (log) {
      log.innerHTML += `<div class="log-line"><span class="log-ts">${new Date().toLocaleTimeString()}</span> ${escapeHtml(result.output || 'Zip library installed')}</div>`;
    }
  } catch (err) {
    showToast('Zip library install failed', 'error');
    const eb = document.getElementById('errorBox');
    eb.classList.remove('hidden');
    document.getElementById('errorContent').textContent = err.message || 'Failed to install zip library.';
  }
}

async function autoInstallLibraries() {
  const code = state.generatedCode || document.getElementById('codeDisplay').textContent.trim();
  if (!code || code.startsWith('// FluxIDE') || code.startsWith('// Click')) {
    showToast('Generate code first so libraries can be detected', 'error');
    return;
  }
  showToast('Scanning code for libraries...', 'info');
  try {
    const result = await window.fluxAPI.autoInstallLibs({ code });
    if (result.installed && result.installed.length > 0) {
      showToast(`Installed: ${result.installed.join(', ')}`, 'success');
    } else if (result.failed && result.failed.length > 0) {
      showToast(`Could not install: ${result.failed.join(', ')}`, 'error');
    } else {
      showToast(result.message || 'No external libraries to install', 'info');
    }
    const log = document.getElementById('serialLog');
    if (log) {
      const ts = new Date().toLocaleTimeString();
      if (result.installed && result.installed.length) {
        log.innerHTML += `<div class="log-line"><span class="log-ts">${ts}</span> Auto-installed: ${escapeHtml(result.installed.join(', '))}</div>`;
      }
      if (result.failed && result.failed.length) {
        log.innerHTML += `<div class="log-line"><span class="log-ts">${ts}</span> Failed to install: ${escapeHtml(result.failed.join(', '))}</div>`;
      }
    }
  } catch (err) {
    showToast('Auto install failed', 'error');
    const eb = document.getElementById('errorBox');
    eb.classList.remove('hidden');
    document.getElementById('errorContent').textContent = err.message || 'Auto install failed.';
  }
}

async function newProject() {
  switchPage('generate');
  document.getElementById('promptInput').value = '';
  document.getElementById('subPromptInput').value = 'Project: new FluxIDE project.';
  state.generatedCode = '';
  renderLiveCode('// New FluxIDE project\n// Configure the agent, describe what to build, then generate live code.');
  if (!state.projectFolder) await chooseProjectFolder();
  if (state.projectFolder) {
    try {
      const result = await window.fluxAPI.newProject(currentProjectPayload());
      state.projectFolder = result.projectFolder;
      document.getElementById('folderPath').textContent = result.projectFolder;
      showToast('New project created', 'success');
      return;
    } catch (err) {
      showToast(err.message || 'Could not create project', 'error');
      return;
    }
  }
  showToast('New project started', 'success');
}

function useTemplate(name) {
  const t = state.templates.find(x => x.name === name);
  if (t) {
    switchPage('generate');
    insertPrompt(`${t.desc} for Arduino/ESP32`);
    showToast(`Template loaded: ${name}`, 'success');
  }
}

// ── Theme Accent ─────────────────────────
function setAccent(color, light) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-light', light);
  document.documentElement.style.setProperty('--accent-glow', color + '55');
  showToast('Accent color updated', 'success');
}

// ── Toast ────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--accent-light)' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="color:${colors[type]};font-weight:700">${icons[type]}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ── Keyboard Shortcuts ───────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault(); generateCode();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault(); toggleSidebar();
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});

// ── Scan for board (simulated) ──────────
async function scanBoards(showResultToast = false) {
  const chip = document.getElementById('boardChip');
  const status = document.getElementById('portScanStatus');
  chip.style.opacity = '0.5';
  if (status) status.textContent = 'Scanning Windows COM ports...';

  try {
    const ports = await window.fluxAPI.listSerialPorts();
    state.serialPorts = ports;
    renderDetectedPorts();
    chip.style.opacity = '1';
    chip.innerHTML = `<span class="chip-dot"></span> ${ports.length ? `${ports.length} Port${ports.length > 1 ? 's' : ''} Found` : 'No Port Found'}`;
    if (status) status.textContent = ports.length ? `${ports.length} COM port${ports.length > 1 ? 's' : ''} detected` : 'No COM ports detected';
    if (showResultToast) {
      showToast(ports.length ? `Detected ${ports.length} COM port${ports.length > 1 ? 's' : ''}` : 'No COM ports detected', ports.length ? 'success' : 'error');
    }
  } catch (err) {
    chip.style.opacity = '1';
    if (status) status.textContent = 'COM scan failed';
    showToast(err.message || 'Could not scan COM ports', 'error');
  }
}

function renderDetectedPorts() {
  const list = document.getElementById('detectedPortsList');
  if (!list) return;
  if (!state.serialPorts.length) {
    list.innerHTML = '<div class="empty-ports">No connected boards or serial COM ports found.</div>';
    return;
  }

  const selectedBoard = document.getElementById('boardSelect').value;
  list.innerHTML = state.serialPorts.map((port, idx) => `
    <button class="board-item port-choice ${state.selectedPort === port.port ? 'active-board' : ''}" onclick="selectDetectedPort(${idx})">
      <div class="bi-dot ${state.selectedPort === port.port ? '' : 'off'}"></div>
      <div class="port-info">
        <div class="bi-name">${escapeHtml(port.port)} · ${escapeHtml(selectedBoard)}</div>
        <div class="bi-port">${escapeHtml(port.name)}</div>
        <div class="bi-port">${escapeHtml(port.manufacturer || 'Unknown manufacturer')}</div>
      </div>
      <span class="status-chip chip-ai port-active-label">${state.selectedPort === port.port ? 'Active' : 'Select'}</span>
    </button>
  `).join('');
}

function selectDetectedPort(index) {
  const port = state.serialPorts[index];
  if (!port) return;
  const board = document.getElementById('boardSelect').value;
  state.selectedPort = port.port;
  document.getElementById('boardName').textContent = board;
  document.getElementById('boardPort').textContent = `${port.port} · ${port.name}`;
  document.getElementById('flashBoard').textContent = `${board} on ${port.port}`;
  document.getElementById('flashBoardName').textContent = `${board} (${port.port})`;
  document.getElementById('boardChip').innerHTML = '<span class="chip-dot"></span> Port Selected';
  renderDetectedPorts();
  showToast(`Selected ${board} on ${port.port}`, 'success');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Auto scan on load
setTimeout(scanBoards, 4500);

console.log('%cFluxIDE', 'color:#8b5cf6;font-size:18px;font-weight:bold;font-family:monospace');
console.log('%cKeyboard shortcuts: Ctrl+Enter = Generate | Ctrl+B = Toggle sidebar | Esc = Close modal', 'color:#475569;font-size:12px');
