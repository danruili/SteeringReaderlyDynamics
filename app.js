'use strict';
const $ = selector => document.querySelector(selector);
$('#copy-citation').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText($('#bibtex').textContent);$('#copy-status').textContent='Citation copied.';}
  catch{$('#copy-status').textContent='Select the BibTeX text above and copy it manually.';}
});

const methodTabs = [...document.querySelectorAll('.method-tabs [role="tab"]')];
function selectMethodTab(selected) {
  methodTabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
}
methodTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectMethodTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = methodTabs[(index + 1) % methodTabs.length];
    if (event.key === 'ArrowLeft') next = methodTabs[(index + methodTabs.length - 1) % methodTabs.length];
    if (event.key === 'Home') next = methodTabs[0];
    if (event.key === 'End') next = methodTabs[methodTabs.length - 1];
    if (!next) return;
    event.preventDefault();
    selectMethodTab(next);
    next.focus();
  });
});


// A shared clock types concurrent candidates without external dependencies.
(() => {
  const output = $('#terminal-output');
  if (!output) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const candidates = [
    ['candidate-a', 'A', 'A low growl broke the silence. The tiger turned toward Tom, its eyes fixed on his hiding place.', 92],
    ['candidate-b', 'B', 'Tom heard no sound nearby. Maybe the tiger left… He slowly loosened his grip on the branch.', 42],
    ['candidate-c', 'C', 'A ranger called from the path. The tiger was already behind the fence, and Tom was safe at last.', 12]
  ];
  const steps = [
    [['', '> Then the tiger wandered around. Tom tried to hold his breath…']],
    [['measure', '[Measure model] Current suspense: 80 out of 100']],
    [['predictor', '[Steering model] Predicted next suspense: 40 out of 100']],
    [['writer', '[Writer model] Writing next segment according to the prediction.']],
    candidates.map(([color, name, story]) => [color, `${name} > ${story}`]),
    [['writer', '[Writer model] Pick B as the continuation best aligned with the predicted suspense.']],
    [['winner', `> ${candidates[1][2]}`]]
  ];
  // The complete transcript supplies its real CSS layout as a stable footprint.
  const footprint = document.createElement('div');
  footprint.className = 'terminal-output terminal-footprint';
  footprint.setAttribute('aria-hidden', 'true');
  footprint.inert = true;
  output.before(footprint);
  function buildFootprint() {
    footprint.replaceChildren();
    function appendLine(parent, color, text) {
      const node = document.createElement('p');
      node.className = 'terminal-line ' + color;
      node.textContent = text;
      parent.append(node);
    }
    steps.slice(0, 4).forEach(step => appendLine(footprint, ...step[0]));
    const grid = document.createElement('div');
    grid.className = 'terminal-candidates';
    footprint.append(grid);
    candidates.forEach(([color, name, story, score]) => {
      const column = document.createElement('div');
      column.className = 'terminal-candidate';
      grid.append(column);
      appendLine(column, color, name + ' > ' + story);
      appendLine(column, 'measure', '[Measure model] detected suspense ' + score + ' out of 100');
    });
    steps.slice(-2).forEach(step => appendLine(footprint, ...step[0]));
  }
  let frame, phase, elapsed, last, rows, paused, finished;
  const speed = 17;
  function line(color, parent = output) {
    const node = document.createElement('p');
    node.className = `terminal-line ${color}`;
    parent.append(node);
    return node;
  }
  function animatedRow(node, value, direct = false) {
    const prefix = direct ? '' : value.startsWith('[Measure model]') ? '[Measure model] '
      : value.startsWith('[Steering model]') ? '[Steering model] ' : '';
    const messages = prefix.startsWith('[Measure')
      ? ['How are the readers feeling right now?', 'Reading stories...']
      : prefix ? ['How should the readers feel next?', 'Reading stories and suspense history...'] : [];
    const frames = [];
    let duration = 0;
    function add(from, to, interval) {
      const length = Math.abs(to.length - from.length);
      frames.push({ start: duration, end: duration + length * interval, from, to, interval });
      duration += length * interval;
    }
    if (prefix) {
      add('', prefix, speed);
      for (const message of messages) {
        add(prefix, prefix + message, speed);
        frames.push({ start: duration, end: duration + 1000, from: prefix + message, to: prefix + message, interval: speed });
        duration += 1000;
        add(prefix + message, prefix, 25);
      }
      add(prefix, value, speed);
    } else add('', value, speed);
    return { node, value, frames, duration };
  }

  function begin() {
    let columns;
    if (phase === 4) {
      const grid = document.createElement('div');
      grid.className = 'terminal-candidates';
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', 'Three candidate continuations');
      output.append(grid);
      columns = candidates.map(([, name]) => {
        const column = document.createElement('div');
        column.className = 'terminal-candidate';
        column.setAttribute('aria-label', 'Candidate ' + name);
        grid.append(column);
        return column;
      });
    }
    rows = steps[phase].map(([color, value], index) => animatedRow(line(color, columns ? columns[index] : output), value));
    rows.forEach(row => row.node.classList.add('is-typing'));
    elapsed = 0;
  }
  function render(instant = false) {
    rows.forEach(row => {
      if (instant) { row.node.textContent = row.value; return; }
      const frame = row.frames.find(frame => elapsed < frame.end);
      if (!frame) { row.node.textContent = row.value; return; }
      const count = Math.floor((elapsed - frame.start) / frame.interval);
      row.node.textContent = frame.to.length >= frame.from.length
        ? frame.to.slice(0, frame.from.length + count)
        : frame.from.slice(0, Math.max(frame.to.length, frame.from.length - count));
    });
  }
  function finishPhase() {
    rows.forEach(row => row.node.classList.remove('is-typing'));
    if (phase === 4) {
      // Each score sits directly beneath its corresponding story.
      steps.splice(5, 0, candidates.map(([, , , score]) => ['measure', `[Measure model] detected suspense ${score} out of 100`]));
      const stories = rows;
      phase++;
      rows = steps[phase].map(([color, value], index) => {
        const node = document.createElement('p');
        node.className = `terminal-line ${color} is-typing`;
        stories[index].node.after(node);
        return animatedRow(node, value, true);
      });
      elapsed = 0;
      return;
    }
    phase++;
    if (phase === steps.length) {
      finished = true;
      $('#terminal-replay').hidden = false;
      return;
    }
    begin();
  }
  function tick(now) {
    const delta = last ? Math.min(now - last, 80) : 0;
    last = now;
    if (!paused && !document.hidden) {
      elapsed += delta;
      render();
      if (elapsed >= Math.max(...rows.map(row => row.duration)) + 600) finishPhase();
    }
    if (!finished) frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame);
    $('#terminal-replay').hidden = true;
    // Remove the inserted measurement phase on replay.
    if (steps.length === 8) steps.splice(5, 1);
    output.replaceChildren();
    buildFootprint();
    phase = 0; last = 0; paused = false; finished = false;
    begin();
    if (motion.matches) {
      while (!finished) { render(true); finishPhase(); }
      output.scrollTop = 0;
    } else frame = requestAnimationFrame(tick);
  }
  $('#terminal-replay').addEventListener('click', start);
  motion.addEventListener('change', start);
  start();
})();

