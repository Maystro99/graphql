const FULLDATA_API = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

const loginNameEl = document.getElementById("login-name");
const infoEl = document.getElementById("info");
const statsEl = document.getElementById("stats");

const gql = async (query) => {
  const token = localStorage.getItem("jwt");

  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  const res = await fetch(FULLDATA_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  console.log("API result:", json);

  if (json.errors) {
    console.error("GraphQL errors:", json.errors);
    throw new Error("GraphQL query failed");
  }

  return json.data;
};

const loadUser = async () => {
  const query = `
    query {
      user {
        login
        id
      }
    }
  `;

  const data = await gql(query);
  loginNameEl.textContent = data.user[0].login;
  console.log("user data:", data.user[0]);
  return data.user[0].id;
};

const loadXP = async () => {
  const query = `
    query {
      transaction_aggregate(
        where: {
          type: { _eq: "xp" }
          path: { _like: "%/bh-module/%" }
          _or: [
            { path: { _nlike: "%/piscine%" } }
            { path: { _eq: "/bahrain/bh-module/piscine-js" } }
            { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
          ]
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  `;

  const data = await gql(query);
  console.log("loadOx data:", data.transaction_aggregate.aggregate.sum);

  return data.transaction_aggregate.aggregate.sum.amount ?? 0;
};

const loadXPHistory = async () => {
  const query = `
    query {
      transaction(
        where: {
          type: { _eq: "xp" }
          path: { _like: "%/bh-module/%" }
          _or: [
            { path: { _nlike: "%/piscine%" } }
            { path: { _eq: "/bahrain/bh-module/piscine-js" } }
            { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
          ]
        }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
      }
    }
  `;

  const data = await gql(query);
  return data.transaction || [];
};

const formatShortDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const renderXPChart = (container, rows) => {
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

  const width = 720;
  const height = 580;
  const margin = { top: 20, right: 36, bottom: 34, left: 40 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

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
  const endLabel = formatShortDate(sortedRows[sortedRows.length - 1]?.createdAt);
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
    <rect class="xp-frame" x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" rx="16"></rect>
    <path class="xp-line" d="M ${points.join(" L ")}"></path>
    <circle class="xp-dot" cx="${lastX}" cy="${lastY}" r="4"></circle>
    <text class="xp-label" x="${margin.left}" y="${height - 12}">${startLabel}</text>
    <text class="xp-label" x="${width - margin.right}" y="${height - 12}" text-anchor="end">${endLabel}</text>
    <text class="xp-total" x="${Math.min(lastX + 8, width - margin.right)}" y="${Math.max(lastY - 10, margin.top + 12)}">${totalLabel}</text>
  </svg>
`;
};

const renderSkillsRadar = (container, skills) => {
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

  const size = 360;
  const center = size / 2;
  const radius = 130;
  const rings = 5;

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
      return `<circle class="radar-dot" cx="${x}" cy="${y}" r="3"></circle>`;
    })
    .join("");

  const labelOffset = 18;
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
        Math.sin(angle) > 0.3 ? "0.9em" : Math.sin(angle) < -0.3 ? "-0.3em" : "0.35em";
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

const passAndFailProject = async () => {
  const query = `
    query {
      total_projects: result_aggregate(
        where: {
          object: { type: { _eq: "project" } }
        }
      ) {
        aggregate {
          count(distinct: true, columns: objectId)
        }
      }

      passed_projects: result_aggregate(
        where: {
          grade: { _gt: 1 }
          object: { type: { _eq: "project" } }
        }
      ) {
        aggregate {
          count(distinct: true, columns: objectId)
        }
      }

      failed_projects: result_aggregate(
        where: {
          grade: { _gt: -1, _lt: 1 }
          object: { type: { _eq: "project" } }
        }
      ) {
        aggregate {
          count(distinct: true, columns: objectId)
        }
      }
    }
  `;

  const data = await gql(query);

  return {
    total: data.total_projects.aggregate.count,
    pass: data.passed_projects.aggregate.count,
    fail: data.failed_projects.aggregate.count,
  };
};

const auditRatio = async () => {
  const query = `
    query AuditDoneValue {
      Done: transaction_aggregate(
        where: { type: { _eq: "up" } }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      Receive: transaction_aggregate(
        where: { type: { _eq: "down" } }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  `;

  const data = await gql(query);
  console.log("Done:", data.Done.aggregate.sum.amount);
  console.log("ReciveConvertor:", data.Receive.aggregate.sum.amount);

  return {
    done: data?.Done?.aggregate?.sum?.amount ?? 0,
    receive: data?.Receive?.aggregate?.sum?.amount ?? 0,
  };
};

const mySkills = async () => {
  const query = `
    query {
      transaction(where: { type: { _like: "skill_%" } }) {
        type
      }
    }
  `;

  const data = await gql(query);

  const rows = data.transaction;

  console.log("skills:", rows);

  const skillCounts = {};

  rows.forEach((row) => {
    skillCounts[row.type] = (skillCounts[row.type] || 0) + 1;
  });

  // console.log("counted Skills:", skillCounts);

  return skillCounts;
};

const doneConvertor = (value) => {
  const roundCustom = (num) => {
    const scaled = num * 1000;
    const thirdDecimal = Math.floor(scaled) % 10;

    if (thirdDecimal >= 7) {
      return (Math.ceil(num * 100) / 100).toFixed(2);
    } else {
      return (Math.floor(num * 100) / 100).toFixed(2);
    }
  };

  if (value >= 1_000_000) {
    const mb = value / 1_000_000;
    return `${roundCustom(mb)} MB`;
  }

  const kb = value / 1_000;
  return `${roundCustom(kb)} KB`;
};

const reciveConvertor = (value) => {
  if (value >= 1000000) {
    return (
      String((Math.round((value / 1_000_000) * 100) / 100).toFixed(2)) + " MB"
    );
  }
  console.log("val:", Math.round(value / 1000));

  return String(Math.round(value / 1_000).toFixed(0)) + " KB";
};

const convertBytes = (bytes) => {
  if (bytes >= 1_000_000) {
    const mb = bytes / 1_000_000;

    const thirdDecimal = Math.floor(mb * 1000) % 10;

    let result;
    if (thirdDecimal >= 7) {
      result = Math.ceil(mb * 100) / 100;
    } else {
      result = Math.floor(mb * 100) / 100;
    }

    return `${result.toFixed(2)} MB`;
  }

  const kb = bytes / 1000;
  const roundedKB = Math.round(kb);
  return `${roundedKB} KB`;
};

const init = async () => {
  try {
    const userID = await loadUser();

    const totalXP = await loadXP();
    const xpHistory = await loadXPHistory();
    const displayXP = convertBytes(totalXP);
    const passAndFail = await passAndFailProject();
    console.log(passAndFail);
    const pass = passAndFail?.pass ?? 0;
    const fail = passAndFail?.fail ?? 0;
    const toatl = passAndFail?.total ?? 0;
    const ratio = await auditRatio();

    const done = ratio?.done ?? 0;
    const receive = ratio?.receive ?? 0;

    const doneMB = doneConvertor(done);
    const receiveMB = reciveConvertor(receive);

    const ratioNumber = receive > 0 ? done / receive : null;
    const ratioValue = ratioNumber !== null ? ratioNumber.toFixed(1) : "N/A";
    const ratioClass =
      ratioNumber === null
        ? "ratio-unknown"
        : ratioNumber < 0.8
        ? "ratio-low"
        : ratioNumber < 1.2
        ? "ratio-mid"
        : "ratio-high";
    const ratioWidth =
      ratioNumber === null
        ? 30
        : ratioNumber < 0.8
        ? 40
        : ratioNumber < 1.2
        ? 70
        : 100;
    const ratioMessage =
      ratioNumber === null
        ? "No ratio yet"
        : ratioNumber < 0.8
        ? "Careful buddy!"
        : ratioNumber < 1.2
        ? "Make more audits!"
        : "Good";

    const skill = await mySkills();
    console.log("skillInit:", skill);
    const skillsEl = document.getElementById("skills");
    const skillsChartEl = document.getElementById("skills-chart");
    const projectChartEl = document.getElementById("project-chart");
    const auditChartEl = document.getElementById("audit-chart");
    const xpChartEl = document.getElementById("xp-chart");
    const skillsRadarEl = document.getElementById("skills-radar");

    infoEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Profile</p>
      <h2>Overview</h2>
    </div>
    <div class="badge">ID ${userID}</div>
  </div>
  <div class="stat-grid">
    <div class="stat">
      <p class="stat-label">Total XP</p>
      <p class="stat-value">${displayXP}</p>
    </div>
    <div class="stat">
      <p class="stat-label">Projects</p>
      <p class="stat-value">${toatl}</p>
      <p class="stat-meta">${pass} passed · ${fail} failed</p>
    </div>
    <div class="stat">
      <p class="stat-label">Audit Ratio</p>
      <p class="stat-value">${ratioValue}</p>
    </div>
  </div>
`;

    statsEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Audits</p>
      <h2>Audit ratio</h2>
    </div>
    <div class="badge">Ratio ${ratioValue}</div>
  </div>
  <div class="split">
    <div class="stat">
      <p class="stat-label">Done</p>
      <p class="stat-value">${doneMB}</p>
    </div>
    <div class="stat">
      <p class="stat-label">Received</p>
      <p class="stat-value">${receiveMB}</p>
    </div>
  </div>
  <div class="ratio-bar ${ratioClass}">
    <div class="ratio-fill" style="width: ${ratioWidth}%;"></div>
  </div>
  <p class="stat-meta">${ratioMessage}</p>
`;

    renderXPChart(xpChartEl, xpHistory);
    renderSkillsRadar(skillsRadarEl, skill);

    if (skillsEl) {
      const skillEntries = Object.entries(skill || {});
      const topSkills = skillEntries
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 3);
      const skillCount = skillEntries.length;
      const skillsMarkup = topSkills
        .map(([name, count]) => {
          const label = name.replace(/^skill_/, "").replace(/_/g, " ");
          return `
    <div class="stat">
      <p class="stat-label">${label}</p>
      <p class="stat-value">${count}</p>
    </div>
  `;
        })
        .join("");

      skillsEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Skills</p>
      <h2>Top Three</h2>
    </div>
  </div>
  <div class="stat-grid">
    ${skillsMarkup || `<p class="stat-meta">No skills yet.</p>`}
  </div>
`;
    }

    if (skillsChartEl) {
      const chartEntries = Object.entries(skill || {}).sort(
        ([, countA], [, countB]) => countB - countA
      );
      if (!chartEntries.length) {
        skillsChartEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Skills</p>
      <h2>All skills</h2>
    </div>
    <div class="badge">0 total</div>
  </div>
  <p class="stat-meta">No skills yet.</p>
`;
      } else {
        const maxCount = Math.max(...chartEntries.map(([, count]) => count));
        const barHeight = 16;
        const barGap = 12;
        const labelWidth = 120;
        const barMaxWidth = 220;
        const chartHeight = chartEntries.length * (barHeight + barGap) + 8;
        const chartWidth = labelWidth + barMaxWidth + 40;
        const bars = chartEntries
          .map(([name, count], index) => {
            const label = name.replace(/^skill_/, "").replace(/_/g, " ");
            const barWidth =
              maxCount === 0 ? 0 : Math.round((count / maxCount) * barMaxWidth);
            const y = index * (barHeight + barGap) + 4;
            return `
    <text class="chart-label" x="0" y="${y + barHeight - 2}">${label}</text>
    <rect class="bar-track" x="${labelWidth}" y="${y}" width="${barMaxWidth}" height="${barHeight}" rx="8" />
    <rect class="bar-fill" x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" />
    <text class="chart-count" x="${
      labelWidth + barMaxWidth + 8
    }" y="${y + barHeight - 2}">${count}</text>
  `;
          })
          .join("");

        skillsChartEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Skills</p>
      <h2>All skills</h2>
    </div>
    <div class="badge">${chartEntries.length} total</div>
  </div>
  <svg class="skills-bars" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Skills bar chart">
    ${bars}
  </svg>
`;
      }
    }

    if (projectChartEl) {
      const totalProjects = toatl;
      const passProjects = pass;
      const failProjects = fail;
      const radius = 52;
      const circumference = 2 * Math.PI * radius;
      const passRatio = totalProjects ? passProjects / totalProjects : 0;
      const failRatio = totalProjects ? failProjects / totalProjects : 0;
      const passLength = Math.round(circumference * passRatio);
      const failLength = Math.round(circumference * failRatio);

      projectChartEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Projects</p>
      <h2>Pass vs Fail</h2>
    </div>
    <div class="badge">${totalProjects} total</div>
  </div>
  <svg class="donut-chart" viewBox="0 0 180 160" role="img" aria-label="Projects pass and fail donut chart">
    <g transform="translate(90 80) rotate(-90)">
      <circle class="donut-track" r="${radius}" cx="0" cy="0"></circle>
      <circle class="donut-pass" r="${radius}" cx="0" cy="0"
        stroke-dasharray="${passLength} ${circumference - passLength}"></circle>
      <circle class="donut-fail" r="${radius}" cx="0" cy="0"
        stroke-dasharray="${failLength} ${circumference - failLength}"
        stroke-dashoffset="-${passLength}"></circle>
    </g>
    <text class="donut-total" x="90" y="78">${totalProjects}</text>
    <text class="donut-sub" x="90" y="98">projects</text>
  </svg>
  <div class="chart-legend">
    <span class="legend-item"><span class="legend-swatch pass"></span>${passProjects} passed</span>
    <span class="legend-item"><span class="legend-swatch fail"></span>${failProjects} failed</span>
  </div>
`;
    }

    if (auditChartEl) {
      const totalAudit = done + receive;
      const availableWidth = auditChartEl.clientWidth - 120;
      const barMax = Math.max(200, Math.min(360, availableWidth || 0)) || 220;
      const doneWidth = totalAudit ? (done / totalAudit) * barMax : 0;
      const receiveWidth = totalAudit ? (receive / totalAudit) * barMax : 0;
      const chartWidth = 70 + barMax + 50;
      const chartHeight = 90;
      const barHeight = 14;
      const doneY = 14;
      const receiveY = 50;

      auditChartEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Audits</p>
      <h2>Flow balance</h2>
    </div>
    <div class="badge">${ratioValue}</div>
  </div>
  <svg class="flow-chart" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Audit flow bar chart">
    <text class="flow-label" x="0" y="${doneY + barHeight - 2}">Done</text>
    <rect class="flow-track" x="70" y="${doneY}" width="${barMax}" height="${barHeight}" rx="7"></rect>
    <rect class="flow-done" x="70" y="${doneY}" width="${doneWidth}" height="${barHeight}" rx="7"></rect>
    <text class="flow-value" x="${70 + barMax + 8}" y="${
        doneY + barHeight - 2
      }">${doneMB}</text>
    <text class="flow-label" x="0" y="${receiveY + barHeight - 2}">Received</text>
    <rect class="flow-track" x="70" y="${receiveY}" width="${barMax}" height="${barHeight}" rx="7"></rect>
    <rect class="flow-receive" x="70" y="${receiveY}" width="${receiveWidth}" height="${barHeight}" rx="7"></rect>
    <text class="flow-value" x="${70 + barMax + 8}" y="${
        receiveY + barHeight - 2
      }">${receiveMB}</text>
  </svg>
`;
    }

  } catch (err) {
    console.error(err);
    infoEl.innerHTML = `<p>Error loading profile data.</p>`;
    statsEl.innerHTML = "";
  }
};

init();
