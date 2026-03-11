window.WidgetClock = (container) => {
  const time = document.createElement('div');
  time.style.fontSize = '28px';
  const date = document.createElement('div');
  date.className = 'mini';
  container.append(time, date);
  const tick = () => {
    const d = new Date();
    time.textContent = d.toLocaleTimeString();
    date.textContent = d.toDateString();
    setTimeout(tick, 1000);
  };
  tick();
};
