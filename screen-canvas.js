'use strict';
// The DOM remains the accessible transcript and the source of exact line wrapping.
// Only the visible surface is rasterized; CSS projects that surface into perspective.
(() => {
  const source = document.getElementById('terminal-output');
  const host = source.parentElement;
  const surface = document.createElement('div');
  surface.className = 'screen-surface';

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  surface.append(canvas);
  host.prepend(surface);
  const ctx = canvas.getContext('2d');
  if (!ctx) { surface.remove(); return; }
  host.classList.add('canvas-enabled');
  const replay = document.getElementById('terminal-replay');
  surface.append(replay);
  let queued = false;
  function paint() {
    queued = false;
    const bounds = source.getBoundingClientRect();
    const width = bounds.width, height = Math.max(bounds.height, source.scrollHeight) + 30;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.ceil(width * ratio), h = Math.ceil(height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    surface.style.height = height + 'px';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    // Phosphor triads: the perspective enlarges these naturally at the near edge.
    const colors = ['rgba(108,147,119,.10)', 'rgba(164,117,113,.07)', 'rgba(111,128,168,.08)'];
    for (let y = 1; y < height; y += 3) {
      for (let x = 1; x < width; x += 3) {
        ctx.fillStyle = colors[Math.round(x / 3) % 3];
        ctx.fillRect(x, y, .7, .9);
      }
    }
    source.querySelectorAll('.terminal-candidate, .terminal-line.winner').forEach(node => {
      const rect = node.getBoundingClientRect();
      ctx.fillStyle = getComputedStyle(node).borderLeftColor;
      ctx.fillRect(rect.left - bounds.left, rect.top - bounds.top, 1, rect.height);
    });
    source.querySelectorAll('.terminal-line').forEach(node => {
      if (!node.firstChild || !node.textContent) return;
      const style = getComputedStyle(node);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = style.color;
      const text = node.firstChild;
      const range = document.createRange();
      let run = '', origin, previous;
      function flush() {
        if (!run) return;
        ctx.fillText(run, origin.left - bounds.left, origin.top - bounds.top + origin.height / 2);
        run = '';
      }
      for (let i = 0; i < text.length; i++) {
        range.setStart(text, i); range.setEnd(text, i + 1);
        const rect = range.getBoundingClientRect();
        if (previous && Math.abs(previous.top - rect.top) > 1) flush();
        if (!run) origin = rect;
        run += text.textContent[i]; previous = rect;
      }
      flush();
      if (node.classList.contains('is-typing') && previous) {
        ctx.globalAlpha = .65;
        ctx.fillRect(previous.right - bounds.left + 1, previous.top - bounds.top + 1, 3, previous.height - 2);
        ctx.globalAlpha = 1;
      }
    });
    // Neutral scan lines, with a pure white screen background.
    ctx.fillStyle = 'rgba(50,50,50,.025)';
    for (let y = 0; y < height; y += 2) ctx.fillRect(0, y, width, .5);
    if (!replay.hidden) {
      ctx.font = '11px Consolas, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#666666';
      ctx.fillText('Replay ↻', width - 8, height - 13);
      if (replay.matches(':focus-visible')) {
        ctx.strokeStyle = '#999999';
        ctx.strokeRect(width - 66, height - 26, 64, 24);
      }
      ctx.textAlign = 'left';
    }

  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }
  new MutationObserver(schedule).observe(replay, { attributes: true });
  replay.addEventListener('focus', schedule);
  replay.addEventListener('blur', schedule);
  new MutationObserver(schedule).observe(source, { subtree: true, childList: true, characterData: true, attributes: true });
  const observer = new ResizeObserver(schedule);
  observer.observe(source); observer.observe(host);
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  schedule();
})();
