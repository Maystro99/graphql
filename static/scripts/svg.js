import { convertBytes, formatShortDate, readCssNumber } from "./convertor.js";

export const renderXPChart = (container, rows) => {
  if (!container) return;
  if (!rows || rows.length === 0) {
    container.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">XP</p>
      <h2>Learning curve</h2>
    </div>
    <div class="badge">No data</div>
  </div>
  <p class="stat-meta">No XP activity yet.</p>
  `;
    return;
  }

  const sortedRows = [...rows].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  let running = 0;
  const series = sortedRows.map((row) => {
    running += row.amount || 0;
    return {
      time: new Date(row.createdAt).getTime(),
      value: running,
    };
  });

  const startTime = series[0]?.time ?? 0;
  const endTime = series[series.length - 1]?.time ?? startTime + 1;
  const timeSpan = Math.max(endTime - startTime, 1);
  const maxValue = Math.max(series[series.length - 1]?.value ?? 0, 1);

  const width = readCssNumber("--xp-chart-width", 720);
  const height = readCssNumber("--xp-chart-height", 580);
  const margin = {
    top: readCssNumber("--xp-margin-top", 20),
    right: readCssNumber("--xp-margin-right", 36),
    bottom: readCssNumber("--xp-margin-bottom", 34),
    left: readCssNumber("--xp-margin-left", 40),
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const frameRadius = readCssNumber("--xp-frame-radius", 16);
  const dotRadius = readCssNumber("--xp-dot-radius", 4);
  const labelOffsetY = readCssNumber("--xp-label-offset-y", 12);
  const totalOffsetX = readCssNumber("--xp-total-offset-x", 8);
  const totalOffsetY = readCssNumber("--xp-total-offset-y", 10);
  const totalMinY = readCssNumber("--xp-total-min-y", 12);

  const toX = (time) =>
    margin.left + ((time - startTime) / timeSpan) * plotWidth;
  const toY = (value) =>
    margin.top + plotHeight - (value / maxValue) * plotHeight;

  const points = [];
  let prev = series[0];
  points.push(`${toX(prev.time)},${toY(prev.value)}`);
  for (let i = 1; i < series.length; i += 1) {
    const current = series[i];
    points.push(`${toX(current.time)},${toY(prev.value)}`);
    points.push(`${toX(current.time)},${toY(current.value)}`);
    prev = current;
  }

  const startLabel = formatShortDate(sortedRows[0]?.createdAt);
  const endLabel = formatShortDate(
    sortedRows[sortedRows.length - 1]?.createdAt
  );
  const totalLabel = convertBytes(series[series.length - 1]?.value ?? 0);
  const lastPoint = points[points.length - 1]?.split(",") || [];
  const lastX = Number(lastPoint[0]) || margin.left;
  const lastY = Number(lastPoint[1]) || margin.top + plotHeight;

  container.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">XP</p>
      <h2>Learning curve</h2>
    </div>
    <div class="badge">${totalLabel} total</div>
  </div>
  <svg class="xp-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="XP over time chart">
    <rect class="xp-frame" x="${margin.left}" y="${
    margin.top
  }" width="${plotWidth}" height="${plotHeight}" rx="${frameRadius}"></rect>
    <path class="xp-line" d="M ${points.join(" L ")}"></path>
    <circle class="xp-dot" cx="${lastX}" cy="${lastY}" r="${dotRadius}"></circle>
    <text class="xp-label" x="${margin.left}" y="${
    height - labelOffsetY
  }">${startLabel}</text>
    <text class="xp-label" x="${width - margin.right}" y="${
    height - labelOffsetY
  }" text-anchor="end">${endLabel}</text>
    <text class="xp-total" x="${Math.min(
      lastX + totalOffsetX,
      width - margin.right
    )}" y="${Math.max(
    lastY - totalOffsetY,
    margin.top + totalMinY
  )}">${totalLabel}</text>
  </svg>
`;
};

export const renderSkillsRadar = (container, skills) => {
  if (!container) return;
  const entries = Object.entries(skills || {}).sort(
    ([, countA], [, countB]) => countB - countA
  );
  if (!entries.length) {
    container.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Skills</p>
      <h2>All skills</h2>
    </div>
    <div class="badge">0 total</div>
  </div>
  <p class="stat-meta">No skills yet.</p>
  `;
    return;
  }

  const labels = entries.map(([name]) =>
    name.replace(/^skill_/, "").replace(/_/g, " ")
  );
  const values = entries.map(([, count]) => count);
  const maxValue = Math.max(...values, 1);

  const size = readCssNumber("--radar-size", 360);
  const center = size / 2;
  const radius = readCssNumber("--radar-radius", 130);
  const rings = Math.round(readCssNumber("--radar-rings", 5));
  const dotRadius = readCssNumber("--radar-dot-radius", 3);

  const ringCircles = Array.from({ length: rings }, (_, index) => {
    const r = (radius / rings) * (index + 1);
    return `<circle class="radar-grid" cx="${center}" cy="${center}" r="${r}"></circle>`;
  }).join("");

  const axisLines = labels
    .map((_, index) => {
      const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      return `<line class="radar-axis" x1="${center}" y1="${center}" x2="${x}" y2="${y}"></line>`;
    })
    .join("");

  const areaPoints = values
    .map((value, index) => {
      const ratio = value / maxValue;
      const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
      const x = center + Math.cos(angle) * radius * ratio;
      const y = center + Math.sin(angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(" ");

  const dots = values
    .map((value, index) => {
      const ratio = value / maxValue;
      const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
      const x = center + Math.cos(angle) * radius * ratio;
      const y = center + Math.sin(angle) * radius * ratio;
      return `<circle class="radar-dot" cx="${x}" cy="${y}" r="${dotRadius}"></circle>`;
    })
    .join("");

  const labelOffset = readCssNumber("--radar-label-offset", 18);
  const axisLabels = labels
    .map((label, index) => {
      const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
      const x = center + Math.cos(angle) * (radius + labelOffset);
      const y = center + Math.sin(angle) * (radius + labelOffset);
      const anchor =
        Math.cos(angle) > 0.2
          ? "start"
          : Math.cos(angle) < -0.2
          ? "end"
          : "middle";
      const dy =
        Math.sin(angle) > 0.3
          ? "0.9em"
          : Math.sin(angle) < -0.3
          ? "-0.3em"
          : "0.35em";
      return `<text class="radar-label" x="${x}" y="${y}" text-anchor="${anchor}" dy="${dy}">${label}</text>`;
    })
    .join("");

  container.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Skills</p>
      <h2>Strength map</h2>
    </div>
    <div class="badge">${entries.length} total</div>
  </div>
  <svg class="radar-plot" viewBox="0 0 ${size} ${size}" role="img" aria-label="Skills radar chart">
    ${ringCircles}
    ${axisLines}
    <polygon class="radar-area" points="${areaPoints}"></polygon>
    ${dots}
    ${axisLabels}
  </svg>
`;
};
