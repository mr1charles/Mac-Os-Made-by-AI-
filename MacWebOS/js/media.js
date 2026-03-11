(() => {
  const demoVideos = [
    { title: 'Product Tour', category: 'Tech' },
    { title: 'Nature Reel', category: 'Travel' },
    { title: 'UI Motion Demo', category: 'Design' }
  ];
  const tracks = [
    { title: 'Skyline', artist: 'Nova', duration: '3:21' },
    { title: 'Night Drive', artist: 'Argo', duration: '4:08' },
    { title: 'Sunbeam', artist: 'Luma', duration: '2:56' }
  ];

  function createVideoPlayer() {
    const node = document.createElement('div');
    node.innerHTML = `
      <input id="videoSearch" placeholder="Search videos" />
      <select id="videoCategory"><option>All</option><option>Tech</option><option>Travel</option><option>Design</option></select>
      <input id="videoFile" type="file" accept="video/*" />
      <video id="videoEl" controls style="width:100%;max-height:260px;border-radius:12px;background:#111"></video>
      <div class="player-controls"><label>Speed <select id="videoSpeed"><option>0.75</option><option selected>1</option><option>1.25</option><option>1.5</option><option>2</option></select></label></div>
      <div id="videoGrid" class="media-grid"></div>
    `;
    const grid = node.querySelector('#videoGrid');
    const render = () => {
      const q = node.querySelector('#videoSearch').value.toLowerCase();
      const c = node.querySelector('#videoCategory').value;
      grid.innerHTML = demoVideos
        .filter(v => v.title.toLowerCase().includes(q) && (c === 'All' || c === v.category))
        .map(v => `<article class="thumb" draggable="true"><b>${v.title}</b><br/>${v.category}</article>`).join('');
    };
    render();

    node.querySelector('#videoSearch').oninput = render;
    node.querySelector('#videoCategory').onchange = render;
    node.querySelector('#videoSpeed').onchange = (e) => node.querySelector('#videoEl').playbackRate = Number(e.target.value);
    node.querySelector('#videoFile').onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      node.querySelector('#videoEl').src = URL.createObjectURL(file);
      window.MacWebOS.notify(`Loaded video: ${file.name}`);
    };
    node.ondragover = (e) => e.preventDefault();
    node.ondrop = (e) => {
      e.preventDefault();
      const file = [...e.dataTransfer.files].find(f => f.type.startsWith('video/'));
      if (file) node.querySelector('#videoEl').src = URL.createObjectURL(file);
    };
    return node;
  }

  function createAudioPlayer() {
    const node = document.createElement('div');
    node.innerHTML = `
      <div style="display:grid;grid-template-columns:180px 1fr;gap:12px;">
        <aside>
          <input id="songSearch" placeholder="Search songs" />
          <ul id="playlist" class="playlist"></ul>
        </aside>
        <section>
          <div style="height:160px;border-radius:12px;background:linear-gradient(135deg,#1db954,#0f2f1d);padding:10px;color:white;">Album Artwork</div>
          <h3 id="trackName">Select a song</h3><div id="trackArtist" class="mini"></div>
          <audio id="audioEl" controls style="width:100%"></audio>
          <canvas id="viz" height="80"></canvas>
          <div class="player-controls">
            <button id="prevBtn">Prev</button><button id="nextBtn">Next</button>
            <button id="shuffleBtn">Shuffle</button><button id="repeatBtn">Repeat</button>
          </div>
        </section>
      </div>
    `;
    const playlist = node.querySelector('#playlist');
    let current = 0;

    const renderList = (query = '') => {
      playlist.innerHTML = tracks
        .filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()))
        .map((t, i) => `<li data-i="${i}">🎵 ${t.title} — ${t.artist}</li>`).join('');
      playlist.querySelectorAll('li').forEach(li => li.onclick = () => loadTrack(Number(li.dataset.i)));
    };

    function loadTrack(i) {
      current = i;
      const t = tracks[i];
      node.querySelector('#trackName').textContent = t.title;
      node.querySelector('#trackArtist').textContent = t.artist;
      window.MacWebOS.setNowPlaying(`${t.title} — ${t.artist}`);
      window.MacWebOS.notify(`Playing ${t.title}`);
    }

    node.querySelector('#songSearch').oninput = (e) => renderList(e.target.value);
    node.querySelector('#nextBtn').onclick = () => loadTrack((current + 1) % tracks.length);
    node.querySelector('#prevBtn').onclick = () => loadTrack((current - 1 + tracks.length) % tracks.length);
    node.querySelector('#shuffleBtn').onclick = () => loadTrack(Math.floor(Math.random() * tracks.length));
    node.querySelector('#repeatBtn').onclick = () => loadTrack(current);

    const canvas = node.querySelector('#viz');
    const ctx = canvas.getContext('2d');
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 20; i++) {
        const h = 10 + Math.random() * 60;
        ctx.fillStyle = '#1db954';
        ctx.fillRect(i * 14, 75 - h, 8, h);
      }
      requestAnimationFrame(draw);
    }
    draw();

    renderList();
    loadTrack(0);
    return node;
  }

  window.MediaApps = { createVideoPlayer, createAudioPlayer };
})();
