(() => {
  const registry = window.MacWebOSAppRegistry || (window.MacWebOSAppRegistry = {});

  registry.finder = {
    id: 'finder',
    label: 'Finder',
    icon: '📁',
    multi: true,
    title: 'Finder',
    src: 'apps/finder.html'
  };
})();
