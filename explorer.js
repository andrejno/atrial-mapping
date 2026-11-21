(() => {
  "use strict";

  const mount = document.getElementById("ring-explorer");
  if (!mount) return;

  const styleUrl = new URL("explorer.css", document.currentScript?.src || document.baseURI).href;
  if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(link => link.href === styleUrl)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = styleUrl;
    document.head.append(link);
  }

  const circumference = 120;
  const period = 300;
  const speed = circumference / period;
  const count = 8;
  const halfRing = circumference / 2;
  const modulo = position => ((position % circumference) + circumference) % circumference;
  const number = new Intl.NumberFormat("en", {maximumFractionDigits: 1});
  const format = value => number.format(value);

  function distanceToFocus(position) {
    const x = modulo(position);
    return Math.min(x, circumference - x);
  }

  function focalArrival(start, offset) {
    return (distanceToFocus(start + offset) - distanceToFocus(start)) / speed;
  }

  function circulationDirection(start) {
    return modulo(start) < halfRing ? 1 : -1;
  }

  function turningPoints(start, span) {
    const points = [];
    const end = start + span;
    for (let x = halfRing * (Math.floor(start / halfRing) + 1); x < end - 1e-9; x += halfRing) {
      points.push(x);
    }
    return points;
  }

  function electrodeOffsets(span) {
    // A complete circle closes at its first electrode. Give every electrode a distinct site.
    const intervals = Math.abs(span - circumference) < 1e-9 ? count : count - 1;
    return Array.from({length: count}, (_, i) => i * span / intervals);
  }

  function ceiling(fraction) {
    return 0.5 + Math.min(fraction, 0.5);
  }

  mount.innerHTML = `
    <div class="rx-instrument">
      <div class="rx-controls">
        <fieldset class="rx-presets">
          <legend>Array placement</legend>
          <div class="rx-switch">
            <button type="button" data-rx-start="10" aria-pressed="true">One arm</button>
            <button type="button" data-rx-start="45" aria-pressed="false">Across collision</button>
          </div>
        </fieldset>
        <div class="rx-control">
          <label for="rx-start">Start position</label>
          <output for="rx-start" id="rx-start-value">10 mm</output>
          <input id="rx-start" type="range" min="0" max="119" value="10" step="1">
        </div>
        <div class="rx-control">
          <label for="rx-span">Arc coverage</label>
          <output for="rx-span" id="rx-span-value">25%</output>
          <input id="rx-span" type="range" min="5" max="100" value="25" step="1">
        </div>
      </div>
      <div class="rx-diagrams">
        <figure class="rx-ring-panel">
          <figcaption>Electrode placement</figcaption>
          <svg class="rx-ring" viewBox="0 0 270 232" role="img" aria-labelledby="rx-ring-title rx-ring-desc"></svg>
          <div class="rx-ring-key"><i aria-hidden="true"></i>Eight recording sites</div>
        </figure>
        <figure class="rx-plot-panel">
          <figcaption>Arrival times</figcaption>
          <svg class="rx-plot" role="img" aria-labelledby="rx-plot-title rx-plot-desc"></svg>
          <div class="rx-plot-key">
            <span><i class="rx-focal-line" aria-hidden="true"></i>Focal activation</span>
            <span><i class="rx-reentry-line" aria-hidden="true"></i>Reentry</span>
          </div>
        </figure>
      </div>
      <div class="rx-results">
        <div class="rx-placement-result"><div class="rx-small-label">This placement</div><strong id="rx-observation"></strong><p id="rx-explanation"></p></div>
        <div class="rx-bound-result"><div><div class="rx-small-label">Ideal accuracy ceiling</div><p>Across random focal locations at this coverage</p></div><output id="rx-bound" for="rx-span">75%</output></div>
      </div>
      <details class="rx-assumptions"><summary>Model assumptions</summary>
        <div>A homogeneous 120 mm ring has a cycle length of 300 ms and a propagation speed of 0.4 mm/ms. The orange trace shows a focus at 0 mm and a collision at 60 mm. The circulating wave travels in the direction matching the initial focal slope on the selected arc. Lines show continuous model predictions. Symbols mark the eight electrode observations. Both traces use the first electrode as their time origin and follow unwrapped time around the circuit. At full coverage the first electrode also closes the path.</div>
        <div>The accuracy ceiling assumes continuous, noiseless observation of a connected arc, equal probabilities for focal activation and reentry, equally likely circulation directions, a uniformly placed focus and a uniform timing offset. For a sampled fraction <i>a</i>, optimal accuracy is ½ + min(<i>a</i>, ½).</div>
      </details>
    </div>`;

  const find = selector => mount.querySelector(selector);
  const startInput = find("#rx-start");
  const spanInput = find("#rx-span");
  const ring = find(".rx-ring");
  const plot = find(".rx-plot");

  function ringPoint(position) {
    const angle = 2 * Math.PI * position / circumference;
    return {x: 135 + 76 * Math.sin(angle), y: 116 - 76 * Math.cos(angle)};
  }

  function arcPath(start, span) {
    const points = Math.max(4, Math.ceil(span));
    return Array.from({length: points + 1}, (_, i) => {
      const p = ringPoint(start + span * i / points);
      return (i ? "L" : "M") + p.x.toFixed(2) + "," + p.y.toFixed(2);
    }).join(" ");
  }

  function drawRing(start, span, electrodes) {
    const dots = electrodes.map(offset => {
      const p = ringPoint(start + offset);
      return `<circle class="rx-site" cx="${p.x}" cy="${p.y}" r="4.7"/>`;
    }).join("");
    ring.innerHTML = `
      <title id="rx-ring-title">Electrode placement on the ring</title>
      <desc id="rx-ring-desc">Eight sites cover ${format(span)} mm clockwise from ${start} mm. The focal entry is at 0 mm and the collision at 60 mm.</desc>
      <circle class="rx-base-ring" cx="135" cy="116" r="76"/>
      <path class="rx-covered" d="${arcPath(start, span)}"/>
      <path class="rx-rim" d="${arcPath(start, span)}"/>
      ${dots}
      <path class="rx-guide" d="M135 34 V26 M135 198 V207"/>
      <circle class="rx-focus" cx="135" cy="40" r="3.8"/>
      <path class="rx-collision" d="M132 189 L138 195 M138 189 L132 195"/>
      <text x="135" y="17" text-anchor="middle" class="rx-svg-label">Focal entry · 0 mm</text>
      <text x="135" y="225" text-anchor="middle" class="rx-svg-label">Collision · 60 mm</text>
      <text x="135" y="117" text-anchor="middle" class="rx-span-number">${format(span)} mm</text>
      <text x="135" y="138" text-anchor="middle" class="rx-subtext">mapped arc</text>`;
  }

  function gridStep(span, target) {
    const rough = span / target;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const values = [1, 2, 2.5, 5, 10];
    return (values.find(v => v * magnitude >= rough - 1e-10) || 10) * magnitude;
  }

  function pathThrough(offsets, sample, x, y) {
    return offsets.map((offset, i) =>
      (i ? "L" : "M") + x(offset).toFixed(2) + "," + y(sample(offset)).toFixed(2)
    ).join(" ");
  }

  function drawPlot(start, span, turns, electrodes) {
    const width = Math.max(230, Math.round(plot.getBoundingClientRect().width || 470));
    const height = 232;
    plot.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const left = width < 360 ? 54 : 62;
    const right = width - 11;
    const top = 13;
    const bottom = 185;
    const knots = [0, ...turns.map(x => x - start), span];
    const focal = offset => focalArrival(start, offset);
    const direction = circulationDirection(start);
    const reentry = offset => direction * offset / speed;
    const extremes = [...knots.map(focal), reentry(span), 0];
    const min = Math.min(...extremes);
    const max = Math.max(...extremes);
    const step = gridStep(max - min, 4);
    const low = Math.floor((min + 1e-9) / step) * step;
    const high = Math.ceil((max - 1e-9) / step) * step;
    const x = offset => left + (right - left) * offset / span;
    const y = value => bottom - 5 - (value - low) * (bottom - top - 10) / (high - low);
    let grid = "";
    for (let value = low; value <= high + 1e-9; value += step) {
      const py = y(value);
      grid += `<line class="${Math.abs(value) < 1e-9 ? "rx-grid-zero" : "rx-grid"}" x1="${left}" y1="${py}" x2="${right}" y2="${py}"/><text class="rx-tick" x="${left - 8}" y="${py + 4}" text-anchor="end">${format(value)}</text>`;
    }
    const xStep = gridStep(span, width < 360 ? 4 : 5);
    for (let offset = 0; offset <= span + 1e-9; offset += xStep) {
      const px = x(offset);
      grid += `<line class="rx-grid-zero" x1="${px}" y1="${bottom}" x2="${px}" y2="${bottom + 4}"/><text class="rx-tick" x="${px}" y="${bottom + 19}" text-anchor="middle">${format(offset)}</text>`;
    }
    const focalMarkers = electrodes.map(offset => `<circle class="rx-focal-point" cx="${x(offset)}" cy="${y(focal(offset))}" r="3.8"/>`).join("");
    const reentryMarkers = electrodes.map(offset => `<rect class="rx-reentry-point" x="${x(offset) - 2.2}" y="${y(reentry(offset)) - 2.2}" width="4.4" height="4.4"/>`).join("");
    plot.innerHTML = `
      <title id="rx-plot-title">Relative arrival times on the sampled arc</title>
      <desc id="rx-plot-desc">Focal activation and ${direction > 0 ? "clockwise" : "counterclockwise"} reentry across an arc of ${format(span)} millimetres. ${turns.length ? "The focal trace reverses slope." : "The two traces coincide."}</desc>
      ${grid}
      <path class="rx-axis" d="M${left} ${top} V${bottom} H${right}"/>
      <text class="rx-axis-label" transform="translate(15 ${(top + bottom) / 2}) rotate(-90)" text-anchor="middle">Relative arrival time (ms)</text>
      <text class="rx-axis-label" x="${(left + right) / 2}" y="228" text-anchor="middle">Distance from first electrode (mm)</text>
      <path class="rx-focal-trace" d="${pathThrough(knots, focal, x, y)}"/>
      <path class="rx-reentry-trace" d="${pathThrough([0, span], reentry, x, y)}"/>
      ${focalMarkers}${reentryMarkers}`;
  }

  function render() {
    const start = Number(startInput.value);
    const percent = Number(spanInput.value);
    const span = circumference * percent / 100;
    const turns = turningPoints(start, span);
    const electrodes = electrodeOffsets(span);
    find("#rx-start-value").textContent = start + " mm";
    find("#rx-span-value").textContent = percent + "%";
    startInput.setAttribute("aria-valuetext", start + " millimetres clockwise from focal entry");
    spanInput.setAttribute("aria-valuetext", percent + " percent of the ring, " + format(span) + " millimetres");
    startInput.style.setProperty("--rx-progress", (start / 119 * 100) + "%");
    spanInput.style.setProperty("--rx-progress", ((percent - 5) / 95 * 100) + "%");
    mount.querySelectorAll("[data-rx-start]").forEach(button => {
      button.setAttribute("aria-pressed", String(start === Number(button.dataset.rxStart) && percent === 25));
    });
    find("#rx-observation").textContent = turns.length ? "Focal arrival times reverse" : "The arrival times coincide";
    const bounds = format(modulo(start)) + "–" + format(modulo(start + span)) + " mm";
    let explanation;
    if (percent === 100) {
      explanation = "Over a full circuit the focal trace returns to its starting time, while the unwrapped reentry trace advances or retreats by one cycle.";
    } else if (turns.length === 0) {
      explanation = "Both mechanisms produce the same relative times along the " + bounds + " arc.";
    } else if (turns.length === 1) {
      const landmark = modulo(turns[0]) === 0 ? "focal entry at 0 mm" : "collision at 60 mm";
      explanation = "The array crosses the " + landmark + ". The circulating wave keeps its direction.";
    } else {
      explanation = "The array crosses both the focal entry and the collision. The focal trace changes slope twice.";
    }
    find("#rx-explanation").textContent = explanation;
    find("#rx-bound").textContent = format(ceiling(percent / 100) * 100) + "%";
    drawRing(start, span, electrodes);
    drawPlot(start, span, turns, electrodes);
  }

  mount.querySelectorAll("[data-rx-start]").forEach(button => {
    button.addEventListener("click", () => {
      startInput.value = button.dataset.rxStart;
      spanInput.value = "25";
      render();
    });
  });
  startInput.addEventListener("input", render);
  spanInput.addEventListener("input", render);
  if ("ResizeObserver" in window) {
    new ResizeObserver(render).observe(plot);
  } else {
    window.addEventListener("resize", render);
  }
  render();
})();
