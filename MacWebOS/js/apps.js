(() => {
  const dock = document.getElementById('dock');
  const icons = document.getElementById('desktopIcons');

  const installed = new Set(JSON.parse(localStorage.getItem('macwebos.installedApps') || '["finder","app-store","notes","calculator","calendar","music-player","settings","snake","tetris","terminal"]'));
  const running = new Set();

  const categories = {
    games: 'Games',
    productivity: 'Productivity',
    media: 'Media',
    utilities: 'Utilities'
  };

  const baseApps = [
    app('finder', 'Finder', '📁', 'utilities', () => ({ title: 'Finder', content: FinderApp.finderView() })),
    app('browser', 'Browser', '🌐', 'utilities', () => ({ title: 'Browser', content: '<iframe src="apps/browser.html"></iframe>' })),
    app('music-player', 'Music Player', '🎵', 'media', musicPlayerFactory),
    app('video-player', 'Video Player', '🎬', 'media', () => ({ title: 'Video Player', content: MediaApps.createVideoPlayer() })),
    app('notes', 'Notes', '📝', 'productivity', notesFactory),
    app('calculator', 'Calculator', '🧮', 'productivity', calculatorFactory),
    app('calendar', 'Calendar', '📅', 'productivity', calendarFactory),
    app('weather', 'Weather', '⛅', 'utilities', weatherFactory),
    app('clock', 'Clock', '🕒', 'utilities', clockFactory),
    app('settings', 'Settings', '⚙️', 'utilities', settingsFactory),
    app('code-editor', 'Code Editor', '💻', 'productivity', codeEditorFactory),
    app('drawing', 'Drawing', '🎨', 'media', drawingFactory),
    app('terminal', 'Terminal', '⌨️', 'utilities', terminalFactory),
    app('app-store', 'App Store', '🏪', 'utilities', appStoreFactory),
    app('snake', 'Snake', '🐍', 'games', snakeFactory),
    app('tetris', 'Tetris', '🧱', 'games', tetrisFactory),
    app('pong', 'Pong', '🏓', 'games', pongFactory),
    app('memory-match', 'Memory Match', '🧠', 'games', memoryFactory),
    app('clicker', 'Clicker', '🖱️', 'games', clickerFactory),
    app('platformer', 'Platformer', '🦘', 'games', () => miniGameFactory('Platformer', 'Jump over virtual blocks with timed taps.')),
    app('racing', 'Racing', '🏎️', 'games', () => miniGameFactory('Racing', 'Steer left/right and avoid obstacles in lane mode.')),
    app('rhythm', 'Rhythm', '🥁', 'games', () => miniGameFactory('Rhythm', 'Hit beats on time to build combo.'))
  ];

  const fillerNames = [
    ['kanban','Kanban'],['focus-timer','Focus Timer'],['mail-lite','Mail Lite'],['pdf-reader','PDF Reader'],['voice-memos','Voice Memos'],['stocks','Stocks'],['map','Maps'],['dictionary','Dictionary'],
    ['translator','Translator'],['podcasts','Podcasts'],['tasks','Tasks'],['mindmap','Mind Map'],['habit-tracker','Habit Tracker'],['budget','Budget'],['todo-board','Todo Board'],['markdown','Markdown'],
    ['pixel-painter','Pixel Painter'],['gif-studio','GIF Studio'],['photo-viewer','Photo Viewer'],['clip-manager','Clipboard'],['unit-convert','Unit Convert'],['qr-tool','QR Tool'],['password-vault','Password Vault'],
    ['network-monitor','Network Monitor'],['disk-usage','Disk Usage'],['process-monitor','Process Monitor'],['emoji-studio','Emoji Studio'],['chat-sim','Chat Sim'],['notepad-pro','Notepad Pro'],['archive-manager','Archive Manager'],
    ['space-shooter','Space Shooter'],['maze-runner','Maze Runner'],['bubble-pop','Bubble Pop'],['chess-lite','Chess Lite'],['solitaire','Solitaire'],['2048','2048'],['sudoku','Sudoku'],['mines','Mines'],
    ['word-scramble','Word Scramble'],['typing-race','Typing Race'],['color-match','Color Match'],['tower-defense','Tower Defense'],['idle-city','Idle City'],['farm-sim','Farm Sim'],['pet-care','Pet Care'],
    ['drum-pad','Drum Pad'],['synth-lab','Synth Lab'],['stream-deck','Stream Deck'],['screen-recorder','Screen Recorder']
  ];

  fillerNames.forEach(([id, label], idx) => {
    const category = idx % 4 === 0 ? 'games' : idx % 4 === 1 ? 'productivity' : idx % 4 === 2 ? 'media' : 'utilities';
    baseApps.push(app(id, label, randomIcon(category), category, () => miniAppFactory(label, category)));
  });

  const appRegistry = new Map(baseApps.map((a) => [a.id, a]));

  function app(id, label, icon, category, open, permissions = ['files']) {
    return {
      id,
      label,
      icon,
      category,
      description: `${label} for ${categories[category].toLowerCase()} workflows in MacWebOS.`,
      permissions,
      open
    };
  }

  function randomIcon(category) {
    const iconMap = {
      games: ['🎮', '🕹️', '🧩', '🏁'],
      productivity: ['📌', '📊', '📋', '🗂️'],
      media: ['🎧', '📷', '🎞️', '🎚️'],
      utilities: ['🧰', '🔧', '🧭', '🔋']
    };
    const arr = iconMap[category];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function requestPermissions(appDef) {
    const key = `macwebos.perm.${appDef.id}`;
    if (localStorage.getItem(key) === 'granted') return true;
    const allow = confirm(`${appDef.label} requests permissions: ${appDef.permissions.join(', ')}. Allow?`);
    if (allow) localStorage.setItem(key, 'granted');
    return allow;
  }

  function launch(appDef) {
    if (!requestPermissions(appDef)) {
      MacWebOS.notify('Permission denied', appDef.label);
      return;
    }
    const cfg = appDef.open();
    WindowManager.openApp({ id: appDef.id, ...cfg });
    setRunning(appDef.id, true);
    MacWebOS.playUISound('launch');
  }

  function setRunning(id, on) {
    if (on) running.add(id); else running.delete(id);
    dock.querySelectorAll('.dock-app').forEach(btn => btn.classList.toggle('running', running.has(btn.dataset.id)));
  }

  function renderInstalled() {
    dock.innerHTML = '';
    icons.innerHTML = '';
    [...installed].forEach((id, index) => {
      const appDef = appRegistry.get(id);
      if (!appDef) return;
      addDockIcon(appDef);
      addDesktopIcon(appDef, index);
    });
  }

  function addDockIcon(appDef) {
    const btn = document.createElement('button');
    btn.className = 'dock-app';
    btn.dataset.id = appDef.id;
    btn.draggable = true;
    btn.textContent = appDef.icon;
    btn.title = appDef.label;
    btn.onclick = () => launch(appDef);
    btn.ondragstart = (e) => e.dataTransfer.setData('text/plain', appDef.id);
    dock.append(btn);
  }

  function addDesktopIcon(appDef, index = 0) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.dataset.id = appDef.id;
    const pos = MacWebOS.getIconPosition(appDef.id) || { left: `${24 + (index % 6) * 100}px`, top: `${24 + Math.floor(index / 6) * 92}px` };
    icon.style.left = pos.left;
    icon.style.top = pos.top;
    icon.innerHTML = `<span class="desktop-glyph">${appDef.icon}</span><div>${appDef.label}</div>`;
    icon.ondblclick = () => launch(appDef);
    makeDraggableIcon(icon, appDef.id);
    icons.append(icon);
  }

  function makeDraggableIcon(icon, id) {
    let dragging = false; let sx = 0; let sy = 0; let bx = 0; let by = 0;
    icon.addEventListener('pointerdown', (e) => {
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      bx = parseFloat(icon.style.left); by = parseFloat(icon.style.top);
      icon.setPointerCapture(e.pointerId);
    });
    icon.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      icon.style.left = `${bx + e.clientX - sx}px`;
      icon.style.top = `${by + e.clientY - sy}px`;
    });
    icon.addEventListener('pointerup', () => {
      dragging = false;
      MacWebOS.saveIconPosition(id, { left: icon.style.left, top: icon.style.top });
    });
  }

  dock.ondragover = (e) => e.preventDefault();
  dock.ondrop = (e) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    const existing = [...dock.children].find(c => c.dataset.id === appId);
    if (existing) dock.append(existing);
  };

  dock.oncontextmenu = (e) => {
    e.preventDefault();
    const target = e.target.closest('.dock-app');
    if (target && dock.children.length > 1) target.remove();
  };

  function installApp(id) {
    if (!installed.has(id)) {
      installed.add(id);
      localStorage.setItem('macwebos.installedApps', JSON.stringify([...installed]));
      renderInstalled();
      MacWebOS.notify(`${appRegistry.get(id).label} installed`, 'App Store');
    }
  }

  function createDesktopFolder(smart = false) {
    const folder = {
      id: `folder-${Date.now()}`,
      label: smart ? 'Smart Folder' : 'New Folder',
      icon: smart ? '🧠' : '📂',
      open: () => ({ title: smart ? 'Smart Folder' : 'Folder', content: `<p>${smart ? 'Rules-based folder ready.' : 'Folder created on desktop.'}</p>` })
    };
    appRegistry.set(folder.id, folder);
    installed.add(folder.id);
    renderInstalled();
    MacWebOS.notify(`${folder.label} created`);
  }

  function miniAppFactory(label, category) {
    const panel = document.createElement('div');
    panel.innerHTML = `<h3>${label}</h3><p>Lightweight ${category} app loaded lazily.</p><button>Run Action</button><p class="result"></p>`;
    panel.querySelector('button').onclick = () => {
      panel.querySelector('.result').textContent = `Executed at ${new Date().toLocaleTimeString()}`;
    };
    return { title: label, content: panel };
  }

  function miniGameFactory(title, desc) {
    const panel = document.createElement('div');
    let score = 0;
    panel.innerHTML = `<h3>${title}</h3><p>${desc}</p><button>Play</button><strong id="s">0</strong>`;
    panel.querySelector('button').onclick = () => panel.querySelector('#s').textContent = String(++score);
    return { title, content: panel };
  }

  function appStoreFactory() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <h3>App Store</h3>
      <input id="storeSearch" placeholder="Search apps" style="width:100%;padding:8px;border-radius:8px;border:none;margin-bottom:8px" />
      <select id="storeFilter" style="padding:8px;border-radius:8px;border:none;margin-bottom:10px">
        <option value="all">All Categories</option>
        ${Object.entries(categories).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
      </select>
      <div class="app-grid" id="storeGrid"></div>`;
    const grid = wrap.querySelector('#storeGrid');
    const search = wrap.querySelector('#storeSearch');
    const filter = wrap.querySelector('#storeFilter');

    const render = () => {
      const q = search.value.toLowerCase();
      const f = filter.value;
      const apps = [...appRegistry.values()].filter((a) => (f === 'all' || a.category === f) && a.label.toLowerCase().includes(q));
      grid.innerHTML = apps.map((a) => `
        <article class="app-card">
          <div style="font-size:30px">${a.icon}</div>
          <strong>${a.label}</strong>
          <p>${a.description}</p>
          <button data-id="${a.id}">${installed.has(a.id) ? 'Installed' : 'Install'}</button>
        </article>`).join('');
    };

    grid.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (id && !installed.has(id)) installApp(id);
      render();
    });
    search.oninput = render;
    filter.onchange = render;
    render();

    return { title: 'App Store', content: wrap, width: 860, height: 560 };
  }

  function notesFactory() {
    const area = document.createElement('textarea');
    area.style.cssText = 'width:100%;height:100%;border:none;border-radius:10px;padding:12px;background:rgba(255,255,255,.85)';
    area.value = localStorage.getItem('macwebos.notes') || '';
    area.oninput = () => localStorage.setItem('macwebos.notes', area.value);
    return { title: 'Notes', content: area };
  }

  function calculatorFactory() {
    const box = document.createElement('div');
    box.innerHTML = `<input id="expr" placeholder="12*4+2" /><button>=</button><h3 id="out">0</h3>`;
    box.querySelector('button').onclick = () => {
      try { box.querySelector('#out').textContent = String(Function(`return (${box.querySelector('#expr').value || 0})`)()); }
      catch { box.querySelector('#out').textContent = 'Error'; }
    };
    return { title: 'Calculator', content: box, width: 360, height: 320 };
  }

  function calendarFactory() {
    const now = new Date();
    const el = document.createElement('div');
    el.innerHTML = `<h3>${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}</h3><p>Today is ${now.toDateString()}.</p>`;
    return { title: 'Calendar', content: el, width: 380, height: 300 };
  }

  function musicPlayerFactory() {
    const el = document.createElement('div');
    el.innerHTML = `<h3>Global Music</h3><button data-track="Lo-fi Focus">Play Lo-fi</button> <button data-track="Synth Wave">Play Synth</button><button id="stop">Stop</button>`;
    el.addEventListener('click', (e) => {
      const track = e.target.dataset.track;
      if (track) MacWebOS.setNowPlaying(track);
      if (e.target.id === 'stop') MacWebOS.setNowPlaying('');
    });
    return { title: 'Music Player', content: el };
  }

  function weatherFactory() {
    return { title: 'Weather', content: `<h3>72°F • Sunny</h3><p>Feels futuristic outside.</p>`, width: 340, height: 260 };
  }

  function clockFactory() {
    const el = document.createElement('div');
    const tick = () => { el.innerHTML = `<h2>${new Date().toLocaleTimeString()}</h2>`; requestAnimationFrame(() => setTimeout(tick, 1000)); };
    tick();
    return { title: 'Clock', content: el, width: 300, height: 200 };
  }

  function settingsFactory() {
    const el = document.createElement('div');
    el.innerHTML = `<h3>Settings</h3><button id="dark">Toggle Theme</button><button id="notify">Test Notification</button>`;
    el.querySelector('#dark').onclick = () => document.getElementById('desktop').classList.toggle('dark-mode');
    el.querySelector('#notify').onclick = () => MacWebOS.notify('Settings test notification', 'Settings');
    return { title: 'Settings', content: el, width: 420, height: 320 };
  }

  function codeEditorFactory() {
    const el = document.createElement('textarea');
    el.style.cssText = 'width:100%;height:100%;font-family:monospace;background:#0f172a;color:#bfdbfe;border-radius:10px;padding:12px';
    el.value = '// Start coding in MacWebOS';
    return { title: 'Code Editor', content: el };
  }

  function drawingFactory() {
    const canvas = document.createElement('canvas');
    canvas.width = 700; canvas.height = 430;
    canvas.style.width = '100%'; canvas.style.height = '100%';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let draw = false;
    canvas.addEventListener('pointerdown', () => draw = true);
    canvas.addEventListener('pointerup', () => draw = false);
    canvas.addEventListener('pointermove', (e) => {
      if (!draw) return;
      const r = canvas.getBoundingClientRect();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height), 3, 0, Math.PI * 2); ctx.fill();
    });
    return { title: 'Drawing', content: canvas };
  }

  function terminalFactory() {
    const el = document.createElement('div');
    el.innerHTML = `<pre id="termOut">MacWebOS Terminal\nType help</pre><input id="termIn" placeholder="command" style="width:100%">`;
    const out = el.querySelector('#termOut');
    el.querySelector('#termIn').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const cmd = e.target.value.trim();
      const responses = { help: 'Commands: help, date, apps, clear', date: new Date().toString(), apps: `${appRegistry.size} apps installed:${installed.size}` };
      out.textContent = cmd === 'clear' ? '' : `${out.textContent}\n$ ${cmd}\n${responses[cmd] || 'command not found'}`;
      e.target.value = '';
    });
    return { title: 'Terminal', content: el };
  }

  function snakeFactory() {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 300;
    const ctx = c.getContext('2d');
    let snake = [{ x: 10, y: 10 }], dir = { x: 1, y: 0 }, food = { x: 14, y: 12 }, score = 0;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') dir = { x: 0, y: -1 };
      if (e.key === 'ArrowDown') dir = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft') dir = { x: -1, y: 0 };
      if (e.key === 'ArrowRight') dir = { x: 1, y: 0 };
    });
    const loop = () => {
      const head = { x: (snake[0].x + dir.x + 20) % 20, y: (snake[0].y + dir.y + 20) % 20 };
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) { score++; food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) }; }
      else snake.pop();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#22d3ee'; snake.forEach((p) => ctx.fillRect(p.x * 15, p.y * 15, 14, 14));
      ctx.fillStyle = '#f43f5e'; ctx.fillRect(food.x * 15, food.y * 15, 14, 14);
      ctx.fillStyle = '#fff'; ctx.fillText(`Score ${score}`, 10, 14);
    };
    setInterval(loop, 120);
    return { title: 'Snake', content: c, width: 340, height: 380 };
  }

  function tetrisFactory() { return miniGameFactory('Tetris', 'Stack blocks and clear rows in simplified mode.'); }
  function pongFactory() { return miniGameFactory('Pong', 'Control the paddle and bounce forever.'); }
  function memoryFactory() { return miniGameFactory('Memory Match', 'Match symbol cards quickly.'); }
  function clickerFactory() { return miniGameFactory('Clicker', 'Click fast for high score.'); }

  renderInstalled();

  window.Dock = { setRunning, installApp };
  window.Apps = { createDesktopFolder, appRegistry };
})();
