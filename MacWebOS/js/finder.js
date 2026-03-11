(() => {
  const files = [
    { name: 'Projects', type: 'folder' },
    { name: 'Videos', type: 'folder' },
    { name: 'Music', type: 'folder' },
    { name: 'Notes.txt', type: 'file' },
    { name: 'Roadmap.md', type: 'file' }
  ];

  function finderView() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div>
        <input id="finderSearch" placeholder="Search files" />
        <button id="finderGridBtn">Grid</button>
        <button id="finderListBtn">List</button>
      </div>
      <div class="mini">Macintosh HD / Users / Guest</div>
      <div class="finder-layout">
        <aside class="finder-sidebar">
          <h4>Favorites</h4>
          <ul><li>Desktop</li><li>Documents</li><li>Downloads</li></ul>
        </aside>
        <section id="finderContent" class="finder-content grid"></section>
      </div>
    `;
    const content = wrap.querySelector('#finderContent');
    const render = (q = '') => {
      const filtered = files.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
      content.innerHTML = filtered.map(f => `<article class="finder-item" draggable="true">${f.type === 'folder' ? '📁' : '📄'} ${f.name}</article>`).join('');
      content.querySelectorAll('.finder-item').forEach(item => {
        item.ondblclick = () => window.MacWebOS.notify(`Opened ${item.textContent.trim()}`);
        item.ondragstart = (e) => e.dataTransfer.setData('text/plain', item.textContent.trim());
      });
    };
    render();

    wrap.querySelector('#finderSearch').oninput = (e) => render(e.target.value);
    wrap.querySelector('#finderGridBtn').onclick = () => content.className = 'finder-content grid';
    wrap.querySelector('#finderListBtn').onclick = () => content.className = 'finder-content';

    return wrap;
  }

  window.FinderApp = { finderView };
})();
