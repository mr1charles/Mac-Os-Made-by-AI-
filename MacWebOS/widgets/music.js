window.WidgetMusic = (container) => {
  container.innerHTML = '<div>🎧 Quick Music</div><div id="widgetTrack" class="mini">No track playing</div>';
  const track = container.querySelector('#widgetTrack');
  setInterval(() => {
    const now = document.getElementById('quickMusic')?.textContent || 'No track playing';
    track.textContent = now;
  }, 1000);
};
