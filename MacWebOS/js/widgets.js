(() => {
  const layer = document.getElementById('widgetLayer');
  const widgets = [];

  function mountWidget({ id, title, render, x = 20, y = 20 }) {
    const el = document.createElement('aside');
    el.className = 'widget';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = `<div class="widget-handle">${title}</div><div class="widget-body"></div>`;
    const body = el.querySelector('.widget-body');
    render(body);

    const stored = JSON.parse(localStorage.getItem(`macwebos.widget.${id}`) || 'null');
    if (stored) { el.style.left = stored.left; el.style.top = stored.top; el.style.width = stored.width; el.style.height = stored.height; }

    let drag = false, sx = 0, sy = 0, bx = 0, by = 0;
    const handle = el.querySelector('.widget-handle');
    handle.addEventListener('pointerdown', (e) => {
      drag = true; sx = e.clientX; sy = e.clientY;
      bx = parseFloat(el.style.left); by = parseFloat(el.style.top);
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      el.style.left = `${bx + e.clientX - sx}px`;
      el.style.top = `${by + e.clientY - sy}px`;
    });
    handle.addEventListener('pointerup', () => {
      drag = false;
      localStorage.setItem(`macwebos.widget.${id}`, JSON.stringify({ left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height }));
    });

    layer.append(el);
    widgets.push(el);
  }

  mountWidget({ id: 'clock', title: 'Clock', render: (body) => window.WidgetClock(body), x: 24, y: 24 });
  mountWidget({ id: 'weather', title: 'Weather', render: (body) => window.WidgetWeather(body), x: 270, y: 24 });
  mountWidget({ id: 'music', title: 'Music', render: (body) => window.WidgetMusic(body), x: 516, y: 24 });

  if (!MacWebOS.state.widgetsVisible) layer.style.display = 'none';
})();
