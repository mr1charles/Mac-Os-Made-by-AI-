(() => {
  const layer = document.getElementById('windowLayer');
  const missionControl = document.getElementById('missionControl');
  const missionGrid = document.getElementById('missionGrid');
  const windows = new Map();
  let z = 10;

  function savePosition(id, el) {
    localStorage.setItem(`macwebos.window.${id}`, JSON.stringify({
      top: el.style.top, left: el.style.left, width: el.style.width, height: el.style.height
    }));
  }

  function createWindow({ id, title, content, width = 720, height = 460, onMount }) {
    const win = document.createElement('article');
    win.className = 'window glass';
    win.dataset.appId = id;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${80 + windows.size * 20}px`;
    win.style.top = `${40 + windows.size * 20}px`;

    const stored = localStorage.getItem(`macwebos.window.${id}`);
    if (stored) Object.assign(win.style, JSON.parse(stored));

    win.innerHTML = `
      <header class="window-head">
        <div class="traffic">
          <button class="close"></button>
          <button class="min"></button>
          <button class="max"></button>
        </div>
        <span class="window-title">${title}</span>
        <span>◻︎</span>
      </header>
      <section class="window-body"></section>
      <span class="resize-handle n" data-dir="n"></span>
      <span class="resize-handle s" data-dir="s"></span>
      <span class="resize-handle e" data-dir="e"></span>
      <span class="resize-handle w" data-dir="w"></span>
      <span class="resize-handle ne" data-dir="ne"></span>
      <span class="resize-handle nw" data-dir="nw"></span>
      <span class="resize-handle se" data-dir="se"></span>
      <span class="resize-handle sw" data-dir="sw"></span>
    `;
    const body = win.querySelector('.window-body');
    if (typeof content === 'string') body.innerHTML = content;
    else body.append(content);

    layer.append(win);
    windows.set(id, win);
    focusWindow(win);
    bindWindowActions(win, id);
    onMount?.(body, win);
    requestAnimationFrame(() => win.style.opacity = '1');
    return win;
  }

  function bindWindowActions(win, id) {
    const head = win.querySelector('.window-head');
    let dragging = false;
    let startX = 0, startY = 0, baseL = 0, baseT = 0;
    let vx = 0; let vy = 0;

    head.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      baseL = parseFloat(win.style.left); baseT = parseFloat(win.style.top);
      vx = 0; vy = 0;
      focusWindow(win);
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragging || win.classList.contains('maximized')) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      vx = dx; vy = dy;
      win.style.left = `${baseL + dx}px`;
      win.style.top = `${baseT + dy}px`;
    });
    head.addEventListener('pointerup', () => {
      dragging = false;
      inertia(win, vx * 0.12, vy * 0.12);
      handleSnap(win);
      savePosition(id, win);
    });

    win.querySelectorAll('.resize-handle').forEach((handle) => {
      handle.addEventListener('pointerdown', (e) => beginResize(e, win, handle.dataset.dir, id));
    });

    win.querySelector('.close').onclick = () => { win.remove(); windows.delete(id); window.Dock?.setRunning(id, false); };
    win.querySelector('.min').onclick = () => {
      win.classList.add('minimizing');
      setTimeout(() => { win.classList.remove('minimizing'); win.classList.add('minimized'); }, 180);
    };
    win.querySelector('.max').onclick = () => { win.classList.toggle('maximized'); savePosition(id, win); };
    win.addEventListener('mousedown', () => focusWindow(win));
  }

  function beginResize(e, win, dir, id) {
    e.preventDefault();
    const rect = win.getBoundingClientRect();
    const startX = e.clientX; const startY = e.clientY;
    const base = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

    const move = (evt) => {
      let { left, top, width, height } = base;
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;
      if (dir.includes('e')) width = Math.max(320, base.width + dx);
      if (dir.includes('s')) height = Math.max(220, base.height + dy);
      if (dir.includes('w')) { width = Math.max(320, base.width - dx); left = base.left + dx; }
      if (dir.includes('n')) { height = Math.max(220, base.height - dy); top = base.top + dy; }
      Object.assign(win.style, { width: `${width}px`, height: `${height}px`, left: `${left}px`, top: `${top}px` });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      savePosition(id, win);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function inertia(win, vx, vy) {
    if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return;
    let x = parseFloat(win.style.left);
    let y = parseFloat(win.style.top);
    const step = () => {
      x += vx; y += vy;
      vx *= 0.9; vy *= 0.9;
      win.style.left = `${x}px`;
      win.style.top = `${y}px`;
      if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function handleSnap(win) {
    const r = win.getBoundingClientRect();
    const m = 22;
    if (r.left < m) {
      Object.assign(win.style, { left: '0px', top: '0px', width: '50%', height: '100%' });
      return;
    }
    if (r.right > innerWidth - m) {
      Object.assign(win.style, { left: '50%', top: '0px', width: '50%', height: '100%' });
      return;
    }
    if (r.top < m) {
      win.classList.add('maximized');
    }
  }

  function focusWindow(win) {
    win.style.zIndex = ++z;
    document.querySelectorAll('.window').forEach((w) => w.classList.toggle('inactive', w !== win));
    const id = win.dataset.appId;
    document.getElementById('activeAppName').textContent = id[0].toUpperCase() + id.slice(1);
  }

  function openApp(config) {
    const existing = windows.get(config.id);
    if (existing) {
      existing.classList.remove('minimized');
      focusWindow(existing);
      return existing;
    }
    return createWindow(config);
  }

  function renderMissionControl() {
    missionGrid.innerHTML = '';
    [...windows.values()].forEach((win) => {
      const card = document.createElement('article');
      card.className = 'mission-card';
      card.innerHTML = `<div class="mission-thumb"></div><strong>${win.querySelector('.window-title').textContent}</strong>`;
      card.onclick = () => {
        missionControl.classList.add('hidden');
        focusWindow(win);
      };
      missionGrid.append(card);
    });
  }

  document.getElementById('missionControlBtn').onclick = () => {
    renderMissionControl();
    missionControl.classList.toggle('hidden');
  };
  missionControl.addEventListener('click', (e) => { if (e.target === missionControl) missionControl.classList.add('hidden'); });

  window.WindowManager = { openApp, focusWindow, listWindows: () => [...windows.values()] };
})();
