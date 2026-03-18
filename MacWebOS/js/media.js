(() => {
  const registry = window.MacWebOSAppRegistry || (window.MacWebOSAppRegistry = {});

  registry.mp4 = {
    id: 'mp4',
    label: 'MP4 Player',
    icon: '🎬',
    multi: true,
    title: 'VideoHub',
    src: 'apps/mp4-player.html'
  };

  registry.mp3 = {
    id: 'mp3',
    label: 'MP3 Player',
    icon: '🎵',
    multi: true,
    title: 'SpotLite',
    src: 'apps/mp3-player.html'
  };
})();
