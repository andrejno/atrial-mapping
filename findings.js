(() => {
  "use strict";

  const studies = [
    {
      key: "ring",
      label: "Ring model",
      headline: "All confident reports were focal",
      text: "Eight electrodes on a matched-speed quarter ring classified 229 of 320 runs correctly. At a posterior confidence threshold of 0.90, the classifier reported 62 of 160 focal runs and 0 of 160 reentrant runs.",
      chart: "Quarter-ring classification accuracy",
      description: "The ceiling assumes a homogeneous ring, equal mechanism priors, equally likely circulation directions, and uniform focal position and temporal origin.",
      maximum: 100,
      axisEnd: "100%",
      rows: [
        { label: "Eight electrodes", value: 100 * 229 / 320, display: "71.6%" },
        { label: "Continuous, noiseless arc", value: 75, display: "75% ceiling", tone: "coral" }
      ]
    },
    {
      key: "sheet",
      label: "Excitable sheet",
      headline: "The contour had to enclose the spiral core",
      text: "A 512-site contour around the core detected a complete phase rotation at every sampled time. Moving the same contour away from the core gave zero winding throughout the same simulated spiral trajectory.",
      chart: "Snapshots with unit absolute winding",
      description: "Both contours had radius 6 in model units. The 1,001 observations came from one spiral trajectory.",
      maximum: 1001,
      axisEnd: "1,001 snapshots",
      rows: [
        { label: "Around the core", value: 1001, display: "1,001 / 1,001" },
        { label: "Away from the core", value: 0, display: "0 / 1,001", tone: "coral" }
      ]
    },
    {
      key: "human",
      label: "Human recordings",
      headline: "Preprocessing changed which bipoles ranked highest",
      text: "In 22 of 160 comparisons, the baseline and alternative processing settings selected entirely different bipoles. This occurred at 10 of 20 right-atrial catheter placements across five participants with atrial fibrillation.",
      chart: "Disjoint comparisons by participant",
      description: "Each participant contributed 32 comparisons. High-frequency sets included bipoles within 0.2 Hz of the local maximum.",
      maximum: 10,
      axisEnd: "10 comparisons",
      rows: [
        { label: "iaf1", value: 9, display: "9 / 32" },
        { label: "iaf2", value: 4, display: "4 / 32" },
        { label: "iaf3", value: 2, display: "2 / 32" },
        { label: "iaf4", value: 4, display: "4 / 32" },
        { label: "iaf6", value: 3, display: "3 / 32" }
      ]
    }
  ];

  function renderChart(study) {
    const rows = study.rows.map(({ label, value, display, tone }) => `
      <div class="finding-chart-row">
        <span class="finding-row-label">${label}</span>
        <span class="finding-bar-track" aria-hidden="true">
          <span class="finding-bar${tone === "coral" ? " finding-bar-coral" : ""}" style="width:${100 * value / study.maximum}%"></span>
        </span>
        <span class="finding-row-value">${display}</span>
      </div>`).join("");
    return `
      <figure class="finding-chart">
        <figcaption>${study.chart}</figcaption>
        ${rows}
        <div class="finding-scale" aria-hidden="true"><span>0</span><span>${study.axisEnd}</span></div>
        <p class="finding-chart-note">${study.description}</p>
      </figure>`;
  }

  function initFindings(root) {
    const tabs = studies.map(({key, label}, index) => `
      <button class="finding-tab" type="button" role="tab" id="finding-tab-${key}" aria-controls="finding-panel-${key}"
        aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${label}</button>`).join("");
    const panels = studies.map((study, index) => `
      <div class="finding-panel" role="tabpanel" id="finding-panel-${study.key}" aria-labelledby="finding-tab-${study.key}"
        tabindex="0"${index ? " hidden" : ""}>
        <div class="finding-copy"><h3>${study.headline}</h3><p>${study.text}</p></div>
        ${renderChart(study)}
      </div>`).join("");
    root.innerHTML = `<div class="finding-tab-list" role="tablist" aria-label="Study results">${tabs}</div>${panels}`;
    const buttons = [...root.querySelectorAll('[role="tab"]')];
    const regions = [...root.querySelectorAll('[role="tabpanel"]')];

    function select(index, focus = false) {
      buttons.forEach((button, i) => {
        const selected = i === index;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        regions[i].hidden = !selected;
      });
      if (focus) buttons[index].focus();
    }

    buttons.forEach((button, i) => {
      button.addEventListener("click", () => select(i));
      button.addEventListener("keydown", (event) => {
        const destinations = { ArrowRight: (i + 1) % buttons.length, ArrowLeft: (i + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        select(destinations[event.key], true);
      });
    });
  }

  function initSupplement(root) {
    root.innerHTML = `
      <details class="finding-detail">
        <summary><span class="finding-detail-ref">Table S7</span><span>Speed interval coverage and width</span></summary>
        <div class="finding-detail-body">
          <p>On full-ring maps with regional slowing, all 320 mechanisms were identified correctly, yet nominal 95% speed intervals contained the true value in only 102 of 160 focal runs. In a sensitivity subset of 80 focal runs, allowing more variation in conduction widened the intervals and improved coverage.</p>
          <table aria-label="Slow-sector focal-speed interval coverage and width">
            <thead><tr><th scope="col">Discrepancy</th><th scope="col">Coverage</th><th scope="col">Mean width</th></tr></thead>
            <tbody>
              <tr><th scope="row">0</th><td>27.5%</td><td>0.131</td></tr>
              <tr><th scope="row">0.018</th><td>66.3%</td><td>0.274</td></tr>
              <tr><th scope="row">0.036</th><td>95.0%</td><td>0.461</td></tr>
            </tbody>
          </table>
        </div>
      </details>
      <details class="finding-detail">
        <summary><span class="finding-detail-ref">Fig. S10</span><span>Phase noise and electrode spacing</span></summary>
        <div class="finding-detail-body"><p>With noiseless state-space phase and the reference array orientation, 4, 8 and 16 electrodes recovered spiral winding at 21.8%, 60.4% and 100% of the 101 sampled times. With independent phase noise of standard deviation 1 radian, the focal trajectory gave false nonzero winding in 7.7% of measurements with 4 electrodes and 58.7% with 64.</p></div>
      </details>
      <details class="finding-detail">
        <summary><span class="finding-detail-ref">Table S3</span><span>Local bipole selection and participant medians</span></summary>
        <div class="finding-detail-body"><p>In 21 of the 22 comparisons with disjoint bipole sets, the participant’s median dominant frequency shifted by 0.2 Hz or less. Widening the tolerance for inclusion in the high-frequency set from 0.2 to 0.5 Hz gave disjoint sets in 17 of 160 comparisons.</p></div>
      </details>`;
  }

  function initialize() {
    const findings = document.getElementById("study-findings");
    const supplement = document.getElementById("study-supplement");
    if (findings) initFindings(findings);
    if (supplement) initSupplement(supplement);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
