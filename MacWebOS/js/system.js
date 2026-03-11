(() => {
  const state = {
    wallpapers: [
      'linear-gradient(135deg,#6a82fb,#9dd3ff)',
      'linear-gradient(135deg,#ff9966,#ff5e62)',
      'linear-gradient(135deg,#1d2b64,#f8cdda)'
    ],
    wallpaperIndex: Number(localStorage.getItem('macwebos.wallpaper') || 0),
    notifications: JSON.parse(localStorage.getItem('macwebos.notifications') || '[]'),
    widgetsVisible: localStorage.getItem('macwebos.widgetsVisible') !== 'false'
  };

  window.MacWebOS = { state, notify, setNowPlaying };

  const desktop = document.getElementById('desktop');
  const controlCenter = document.getElementById('controlCenter');
  const notificationCenter = document.getElementById('notificationCenter');
  const contextMenu = document.getElementById('desktopContextMenu');
  const menuClock = document.getElementById('menuClock');
  const list = document.getElementById('notificationList');

  function renderClock() {
    menuClock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    requestAnimationFrame(() => setTimeout(renderClock, 1000));
  }

  function applyWallpaper() {
    desktop.style.background = state.wallpapers[state.wallpaperIndex % state.wallpapers.length];
  }

  function renderNotifications() {
    list.innerHTML = state.notifications.map(n => `<li>${n}</li>`).join('');
    localStorage.setItem('macwebos.notifications', JSON.stringify(state.notifications.slice(-30)));
  }

  function notify(message) {
    state.notifications.unshift(`${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${message}`);
    renderNotifications();
  }

  function setNowPlaying(text) {
    const bar = document.getElementById('nowPlayingBar');
    if (!text) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    bar.textContent = `Now Playing: ${text}`;
    document.getElementById('quickMusic').textContent = text;
  }

  document.getElementById('controlCenterBtn').onclick = () => controlCenter.classList.toggle('hidden');
  document.getElementById('notificationBtn').onclick = () => notificationCenter.classList.toggle('hidden');
  document.getElementById('clearNotifications').onclick = () => { state.notifications = []; renderNotifications(); };

  document.getElementById('brightnessSlider').oninput = (e) => {
    desktop.style.filter = `brightness(${e.target.value}%)`;
  };
  document.getElementById('themeToggle').onclick = () => desktop.classList.toggle('dark-mode');
  document.getElementById('wifiToggle').onclick = (e) => e.target.classList.toggle('active');
  document.getElementById('bluetoothToggle').onclick = (e) => e.target.classList.toggle('active');

  document.getElementById('desktopArea').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.classList.remove('hidden');
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
  });
  window.addEventListener('click', () => contextMenu.classList.add('hidden'));
  contextMenu.onclick = (e) => {
    const action = e.target.dataset.action;
    if (action === 'switch-wallpaper') {
      state.wallpaperIndex = (state.wallpaperIndex + 1) % state.wallpapers.length;
      localStorage.setItem('macwebos.wallpaper', state.wallpaperIndex);
      applyWallpaper();
    }
    if (action === 'new-folder') window.Apps?.createDesktopFolder();
    if (action === 'toggle-widget') {
      state.widgetsVisible = !state.widgetsVisible;
      localStorage.setItem('macwebos.widgetsVisible', String(state.widgetsVisible));
      document.getElementById('widgetLayer').style.display = state.widgetsVisible ? 'block' : 'none';
    }
  };

  applyWallpaper();
  renderNotifications();
  renderClock();
})();
