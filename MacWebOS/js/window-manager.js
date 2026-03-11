(() => {
  const layer = document.getElementById('windowLayer');
  const windows = new Map();
  let z = 10;

  function savePosition(key, el) {
    localStorage.setItem(`macwebos.window.${key}`, JSON.stringify({ top: el.style.top, left: el.style.left, width: el.style.width, height: el.style.height }));
  }

  function createWindow({ key, id, title, content, width = 860, height = 560 }) {
    const win = document.createElement('article');
    win.className = 'window';
    win.dataset.appId = id;
    win.dataset.key = key;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${80 + windows.size * 20}px`;
    win.style.top = `${40 + windows.size * 20}px`;

    const stored = localStorage.getItem(`macwebos.window.${id}`);
    if (stored) Object.assign(win.style, JSON.parse(stored));

    win.innerHTML = `<header class="window-head"><div class="traffic"><button class="close"></button><button class="min"></button><button class="max"></button></div><span class="window-title">${title}</span><span></span></header><section class="window-body"></section>`;
    const body = win.querySelector('.window-body');
    typeof content === 'string' ? body.innerHTML = content : body.append(content);

    layer.append(win);
    windows.set(key, win);
    focusWindow(win);
    bindWindowActions(win, key, id);
    return win;
  }

  function bindWindowActions(win, key, id) {
    const head = win.querySelector('.window-head');
    let dragging = false, startX = 0, startY = 0, baseL = 0, baseT = 0;

    head.addEventListener('pointerdown', (e) => {
      dragging = true; startX = e.clientX; startY = e.clientY;
      baseL = parseFloat(win.style.left); baseT = parseFloat(win.style.top);
      focusWindow(win); head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragging || win.classList.contains('maximized')) return;
      win.style.left = `${baseL + e.clientX - startX}px`;
      win.style.top = `${baseT + e.clientY - startY}px`;
    });
    head.addEventListener('pointerup', () => { dragging = false; savePosition(id, win); });

    win.querySelector('.close').onclick = () => {
      win.remove();
      windows.delete(key);
      const stillRunning = [...windows.values()].some(w => w.dataset.appId === id);
      window.Dock?.setRunning(id, stillRunning);
    };
    win.querySelector('.min').onclick = () => win.classList.toggle('minimized');
    win.querySelector('.max').onclick = () => { win.classList.toggle('maximized'); savePosition(id, win); };
    win.addEventListener('mousedown', () => focusWindow(win));
  }

  function focusWindow(win) {
    win.style.zIndex = ++z;
    const id = win.dataset.appId;
    document.getElementById('activeAppName').textContent = id[0].toUpperCase() + id.slice(1);
  }

  function openApp(config) {
    const key = config.multi ? `${config.id}-${Date.now()}-${Math.floor(Math.random() * 9999)}` : config.id;
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
