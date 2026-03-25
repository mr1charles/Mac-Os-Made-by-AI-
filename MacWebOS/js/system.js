(() => {
  const state = {
    wallpapers: [
      { type: 'gradient', value: 'linear-gradient(135deg,#4f8cff,#78dbff,#9f8eff)' },
      { type: 'gradient', value: 'linear-gradient(135deg,#1d2b64,#f8cdda,#89f7fe)' },
      { type: 'gradient', value: 'linear-gradient(135deg,#5b247a,#1bcedf,#48c6ef)' },
      { type: 'gradient', value: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' }
    ],
    wallpaperIndex: Number(localStorage.getItem('macwebos.wallpaper') || 0),
    notifications: JSON.parse(localStorage.getItem('macwebos.notifications') || '[]'),
    widgetsVisible: localStorage.getItem('macwebos.widgetsVisible') !== 'false',
    iconPositions: JSON.parse(localStorage.getItem('macwebos.iconPositions') || '{}')
  };

  let wallpaperPhase = 0;
  let wallpaperRAF = null;

  const desktop = document.getElementById('desktop');
  const desktopArea = document.getElementById('desktopArea');
  const controlCenter = document.getElementById('controlCenter');
  const notificationCenter = document.getElementById('notificationCenter');
  const contextMenu = document.getElementById('desktopContextMenu');
  const menuClock = document.getElementById('menuClock');
  const list = document.getElementById('notificationList');
  const toastLayer = document.getElementById('toastLayer');

  window.MacWebOS = {
    state,
    notify,
    setNowPlaying,
    playUISound,
    saveIconPosition,
    getIconPosition,
    setGlobalVolume,
    getGlobalVolume: () => globalAudio.gain,
    desktop
  };

  const globalAudio = { gain: Number(localStorage.getItem('macwebos.globalVolume') || 0.8) };

  function renderClock() {
    menuClock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    requestAnimationFrame(() => setTimeout(renderClock, 1000));
  }

  function applyWallpaper() {
    const wp = state.wallpapers[state.wallpaperIndex % state.wallpapers.length];
    desktop.style.background = wp.value;
    if (wallpaperRAF) cancelAnimationFrame(wallpaperRAF);
    const tick = () => {
      wallpaperPhase += 0.25;
      desktop.style.backgroundPosition = `${50 + Math.sin(wallpaperPhase / 40) * 12}% ${50 + Math.cos(wallpaperPhase / 36) * 10}%`;
      wallpaperRAF = requestAnimationFrame(tick);
    };
    tick();
  }

  function renderNotifications() {
    list.innerHTML = state.notifications.map(n => `<li>${n}</li>`).join('');
    localStorage.setItem('macwebos.notifications', JSON.stringify(state.notifications.slice(-30)));
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    toastLayer.prepend(el);
    setTimeout(() => el.remove(), 2800);
  }

  function notify(message, app = 'System') {
    const text = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — [${app}] ${message}`;
    state.notifications.unshift(text);
    renderNotifications();
    toast(`${app}: ${message}`);
  }

  function setNowPlaying(text) {
    const bar = document.getElementById('nowPlayingBar');
    if (!text) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    bar.textContent = `Now Playing: ${text}`;
    document.getElementById('quickMusic').textContent = text;
  }

  function playUISound(type = 'click') {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = type === 'launch' ? 680 : 520;
      gain.gain.value = 0.03 * globalAudio.gain;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (_) {}
  }

  function setGlobalVolume(v) {
    globalAudio.gain = Math.max(0, Math.min(1, v));
    localStorage.setItem('macwebos.globalVolume', String(globalAudio.gain));
  }

  function saveIconPosition(id, pos) {
    state.iconPositions[id] = pos;
    localStorage.setItem('macwebos.iconPositions', JSON.stringify(state.iconPositions));
  }

  function getIconPosition(id) {
    return state.iconPositions[id];
  }

  document.getElementById('controlCenterBtn').onclick = () => controlCenter.classList.toggle('hidden');
  document.getElementById('notificationBtn').onclick = () => notificationCenter.classList.toggle('hidden');
  document.getElementById('clearNotifications').onclick = () => { state.notifications = []; renderNotifications(); };

  document.getElementById('brightnessSlider').oninput = (e) => {
    desktop.style.filter = `brightness(${e.target.value}%)`;
  };
  document.getElementById('volumeSlider').oninput = (e) => setGlobalVolume(Number(e.target.value) / 100);
  document.getElementById('themeToggle').onclick = () => desktop.classList.toggle('dark-mode');
  document.getElementById('wifiToggle').onclick = (e) => e.target.classList.toggle('active');
  document.getElementById('bluetoothToggle').onclick = (e) => e.target.classList.toggle('active');

  desktopArea.addEventListener('contextmenu', (e) => {
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
      notify('Wallpaper switched');
    }
    if (action === 'new-folder' || action === 'new-smart-folder') window.Apps?.createDesktopFolder(action === 'new-smart-folder');
    if (action === 'toggle-widget') {
      state.widgetsVisible = !state.widgetsVisible;
      localStorage.setItem('macwebos.widgetsVisible', String(state.widgetsVisible));
      document.getElementById('widgetLayer').style.display = state.widgetsVisible ? 'block' : 'none';
    }
  };

  window.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--mx', `${(e.clientX / innerWidth) * 100}%`);
    document.documentElement.style.setProperty('--my', `${(e.clientY / innerHeight) * 100}%`);
    desktopArea.style.transform = `perspective(1400px) rotateX(${(0.5 - e.clientY / innerHeight) * 2}deg) rotateY(${(e.clientX / innerWidth - 0.5) * 3}deg)`;
  }, { passive: true });

  let touchStartX = 0;
  window.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (touchStartX < 24 && dx > 70) notificationCenter.classList.toggle('hidden');
    if (touchStartX > innerWidth - 24 && dx < -70) controlCenter.classList.toggle('hidden');
  }, { passive: true });

  function boot() {
    const boot = document.getElementById('bootScreen');
    const bar = document.getElementById('bootBar');
    let p = 0;
    const t = setInterval(() => {
      p += 12;
      bar.style.width = `${Math.min(100, p)}%`;
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => boot.classList.add('hidden'), 240);
      }
    }, 80);
  }

  applyWallpaper();
  renderNotifications();
  renderClock();
  boot();
})();
