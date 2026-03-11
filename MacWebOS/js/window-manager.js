(() => {
  const layer = document.getElementById('windowLayer');
  const windows = new Map();
  let z = 10;

  function savePosition(appId, el) {
    localStorage.setItem(`macwebos.window.${appId}`, JSON.stringify({
      top: el.style.top,
      left: el.style.left,
      width: el.style.width,
      height: el.style.height,
      maximized: el.classList.contains('maximized')
    }));
  }

  function focusWindow(win) {
    win.style.zIndex = String(++z);
    const id = win.dataset.appId;
    document.getElementById('activeAppName').textContent = id ? id[0].toUpperCase() + id.slice(1) : 'Finder';
  }

  function bindDrag(win, appId) {
    const head = win.querySelector('.window-head');
    let dragging = false;
    let startX = 0; let startY = 0; let baseL = 0; let baseT = 0;

    head.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      baseL = parseFloat(win.style.left) || 0;
      baseT = parseFloat(win.style.top) || 0;
      focusWindow(win);
      head.setPointerCapture(e.pointerId);
    });

    head.addEventListener('pointermove', (e) => {
      if (!dragging || win.classList.contains('maximized')) return;
      win.style.left = `${baseL + e.clientX - startX}px`;
      win.style.top = `${baseT + e.clientY - startY}px`;
    });

    head.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      savePosition(appId, win);
    });
  }

  function bindActions(win, key, appId) {
    win.querySelector('.close').onclick = () => {
      win.remove();
      windows.delete(key);
      const appStillOpen = [...windows.values()].some((w) => w.dataset.appId === appId);
      window.Dock?.setRunning(appId, appStillOpen);
    };
    win.querySelector('.min').onclick = () => win.classList.toggle('minimized');
    win.querySelector('.max').onclick = () => {
      win.classList.toggle('maximized');
      savePosition(appId, win);
    };
    win.addEventListener('mousedown', () => focusWindow(win));
  }

  function createWindow({ key, id, title, content, width = 860, height = 560 }) {
    const win = document.createElement('article');
    win.className = 'window';
    win.dataset.appId = id;
    win.dataset.key = key;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${80 + (windows.size % 8) * 26}px`;
    win.style.top = `${40 + (windows.size % 8) * 20}px`;

    const stored = localStorage.getItem(`macwebos.window.${id}`);
    if (stored) {
      const pos = JSON.parse(stored);
      Object.assign(win.style, pos);
      if (pos.maximized) win.classList.add('maximized');
    }

    win.innerHTML = `<header class="window-head"><div class="traffic"><button class="close"></button><button class="min"></button><button class="max"></button></div><span class="window-title">${title}</span><span></span></header><section class="window-body"></section>`;
    const body = win.querySelector('.window-body');
    if (typeof content === 'string') body.innerHTML = content;
    else body.append(content);

    layer.append(win);
    windows.set(key, win);
    bindDrag(win, id);
    bindActions(win, key, id);
    focusWindow(win);
    return win;
  }

  function openApp(config) {
    const key = config.multi ? `${config.id}-${crypto.randomUUID?.() || Date.now()}` : config.id;
    if (!config.multi && windows.has(config.id)) {
      const existing = windows.get(config.id);
      existing.classList.remove('minimized');
      focusWindow(existing);
      return existing;
    }
    return createWindow({ ...config, key });
  }

  window.WindowManager = { openApp, focusWindow };
})();
