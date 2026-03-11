(() => {
  const dock = document.getElementById('dock');
  const icons = document.getElementById('desktopIcons');
  const appDefs = [
    { id: 'finder', label: 'Finder', icon: '📁', multi: true, open: () => ({ title: 'Finder', content: '<iframe src="apps/finder.html"></iframe>' }) },
    { id: 'browser', label: 'Browser', icon: '🌐', multi: true, open: () => ({ title: 'Browser', content: '<iframe src="apps/browser.html"></iframe>' }) },
    { id: 'mp4', label: 'MP4 Player', icon: '🎬', multi: true, open: () => ({ title: 'VideoHub', content: '<iframe src="apps/mp4-player.html"></iframe>' }) },
    { id: 'mp3', label: 'MP3 Player', icon: '🎵', multi: true, open: () => ({ title: 'SpotLite', content: '<iframe src="apps/mp3-player.html"></iframe>' }) }
  ];
  const running = new Set();

  function launch(app) {
    WindowManager.openApp({ id: app.id, multi: app.multi, ...app.open() });
    setRunning(app.id, true);
  }

  function setRunning(id, on) {
    on ? running.add(id) : running.delete(id);
    dock.querySelectorAll('.dock-app').forEach(btn => btn.classList.toggle('running', running.has(btn.dataset.id)));
  }

  appDefs.forEach((app) => {
    const btn = document.createElement('button');
    btn.className = 'dock-app';
    btn.dataset.id = app.id;
    btn.draggable = true;
    btn.textContent = app.icon;
    btn.title = app.label;
    btn.onclick = () => launch(app);
    btn.ondragstart = (e) => e.dataTransfer.setData('text/plain', app.id);
    dock.append(btn);

    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.innerHTML = `<div style="font-size:40px">${app.icon}</div><div>${app.label}</div>`;
    icon.ondblclick = () => launch(app);
    icons.append(icon);
  });

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

  function createDesktopFolder() {
    const folder = document.createElement('div');
    folder.className = 'desktop-icon';
    folder.innerHTML = '<div style="font-size:40px">📂</div><div>New Folder</div>';
    folder.draggable = true;
    folder.ondblclick = () => WindowManager.openApp({ id: `folder-${Date.now()}`, title: 'Folder', multi: true, content: '<div>Empty folder</div>', width: 420, height: 280 });
    icons.append(folder);
    MacWebOS.notify('New folder created');
  }

  window.Dock = { setRunning };
  window.Apps = { createDesktopFolder };
})();
