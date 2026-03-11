(() => {
  const layer = document.getElementById('widgetLayer');

  function mountWidget({ id, title, render, x = 20, y = 20 }) {
    if (typeof render !== 'function') return;
    const el = document.createElement('aside');
    el.className = 'widget';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = `<div class="widget-handle">${title}</div><div class="widget-body"></div>`;

    const body = el.querySelector('.widget-body');
    render(body);

    const key = `macwebos.widget.${id}`;
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (stored) {
      el.style.left = stored.left;
      el.style.top = stored.top;
      el.style.width = stored.width;
      el.style.height = stored.height;
    }

    const save = () => localStorage.setItem(key, JSON.stringify({
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height
    }));

    let drag = false; let sx = 0; let sy = 0; let bx = 0; let by = 0;
    const handle = el.querySelector('.widget-handle');

    handle.addEventListener('pointerdown', (e) => {
      drag = true;
      sx = e.clientX;
      sy = e.clientY;
      bx = parseFloat(el.style.left) || 0;
      by = parseFloat(el.style.top) || 0;
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      el.style.left = `${bx + e.clientX - sx}px`;
      el.style.top = `${by + e.clientY - sy}px`;
    });

    handle.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = false;
      save();
    });

    new ResizeObserver(save).observe(el);
    layer.append(el);
  }

  mountWidget({ id: 'clock', title: 'Clock', render: window.WidgetClock, x: 24, y: 24 });
  mountWidget({ id: 'weather', title: 'Weather', render: window.WidgetWeather, x: 270, y: 24 });
  mountWidget({ id: 'music', title: 'Music', render: window.WidgetMusic, x: 516, y: 24 });

  if (!MacWebOS.state.widgetsVisible) layer.style.display = 'none';
})();
