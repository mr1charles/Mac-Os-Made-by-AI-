(() => {
  const layer = document.getElementById('windowLayer');
  const windows = new Map();
  let z = 10;

  function savePosition(id, el) {
    localStorage.setItem(`macwebos.window.${id}`, JSON.stringify({
      top: el.style.top, left: el.style.left, width: el.style.width, height: el.style.height
    }));
  }

  function createWindow({ id, title, content, width = 720, height = 460 }) {
    const win = document.createElement('article');
    win.className = 'window';
    win.dataset.appId = id;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${80 + windows.size * 20}px`;
    win.style.top = `${40 + windows.size * 20}px`;

    const stored = localStorage.getItem(`macwebos.window.${id}`);
    if (stored) {
      const pos = JSON.parse(stored);
      Object.assign(win.style, pos);
    }

    win.innerHTML = `
      <header class="window-head">
        <div class="traffic">
          <button class="close"></button>
          <button class="min"></button>
          <button class="max"></button>
        </div>
        <span class="window-title">${title}</span>
        <span></span>
      </header>
      <section class="window-body"></section>
    `;
    const body = win.querySelector('.window-body');
    if (typeof content === 'string') body.innerHTML = content;
    else body.append(content);

    layer.append(win);
    windows.set(id, win);
    focusWindow(win);
    bindWindowActions(win, id);
    requestAnimationFrame(() => win.style.opacity = '1');
    return win;
  }

  function bindWindowActions(win, id) {
    const head = win.querySelector('.window-head');
    let dragging = false;
    let startX = 0, startY = 0, baseL = 0, baseT = 0;

    head.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      baseL = parseFloat(win.style.left); baseT = parseFloat(win.style.top);
      focusWindow(win);
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragging || win.classList.contains('maximized')) return;
      win.style.left = `${baseL + e.clientX - startX}px`;
      win.style.top = `${baseT + e.clientY - startY}px`;
    });
    head.addEventListener('pointerup', () => { dragging = false; savePosition(id, win); });

    win.querySelector('.close').onclick = () => { win.remove(); windows.delete(id); window.Dock?.setRunning(id, false); };
    win.querySelector('.min').onclick = () => { win.classList.toggle('minimized'); };
    win.querySelector('.max').onclick = () => { win.classList.toggle('maximized'); savePosition(id, win); };
    win.addEventListener('mousedown', () => focusWindow(win));
  }

  function focusWindow(win) {
    win.style.zIndex = ++z;
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

  window.WindowManager = { openApp, focusWindow };
})();
