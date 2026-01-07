import {
  loadUser,
  auditRatio,
  loadXP,
  loadXPHistory,
  mySkills,
  passAndFailProject,
} from "./queries.js";

import { renderSkillsRadar, renderXPChart } from "./svg.js";

import {
  convertBytes,
  doneConvertor,
  readCssNumber,
  reciveConvertor,
} from "./convertor.js";

const infoEl = document.getElementById("info");
const statsEl = document.getElementById("stats");

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
    <div class="ratio-fill ratio-width-${ratioWidth}"></div>
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
      // skill.myAnaaaaaaaaa = 5;
      // skill.mybbbbbbbbbbbbbbbbbbbb = 5;
      // skill.myAnaaaaaaaaa = 5;
      // skill.mybbbbbbbbbbbbbbbbbbbb = 5;
      // skill.myAnaaaaaaqqaaa = 5;
      // skill.mybbbbbbbbbqqbbbbbbbbbbb = 5;
      // skill.myAnaaaaaaabfdveaa = 5;
      // skill.mybbbbbbbbbdvsdebbbbbbbbbbb = 5;
      // skill.myAnaaaaaaafbeedaa = 5;
      // skill.mybbbbbbbbbdfwdbbbbbbbbbbb = 5;
      // skill.myAnaaaaaafbfbweefaaa = 5;
      // skill.mybbbbbbbbasasabbbbbbbbbbbb = 5;
      // skill.myAnaaaaaabwbwbaaa = 5;
      // skill.mybbbbbbbbcwcwbbbbbbbbbbbb = 5;
      // skill.myAnaaaaabdedaaaa = 5;
      // skill.mybbbbbbbevwdwfbbbbbbbbbbbbb = 5;
      const chartEntries = Object.entries(skill || {}).sort(
        ([, countA], [, countB]) => countB - countA
      );

      if (chartEntries.length > 16) {
        skillsChartEl.classList.add("scrollable");
      } else {
        skillsChartEl.classList.remove("scrollable");
      }

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
        const barHeight = readCssNumber("--skills-bar-height", 16);
        const barGap = readCssNumber("--skills-bar-gap", 12);
        const labelWidth = readCssNumber("--skills-label-width", 120);
        const barMaxWidth = readCssNumber("--skills-bar-max-width", 220);
        const barRadius = readCssNumber("--skills-bar-radius", 8);
        const chartPadding = readCssNumber("--skills-chart-padding", 4);
        const chartRightPad = readCssNumber("--skills-chart-right-pad", 40);
        const textOffsetY = readCssNumber("--skills-text-offset-y", 2);
        const countOffsetX = readCssNumber("--skills-count-offset-x", 8);
        const maxVisibleSkills = chartEntries.length;
        const chartHeight =
          maxVisibleSkills * (barHeight + barGap) + chartPadding * 2;
        const chartWidth = labelWidth + barMaxWidth + chartRightPad;
        const bars = chartEntries
          .map(([name, count], index) => {
            const label = name.replace(/^skill_/, "").replace(/_/g, " ");
            const barWidth =
              maxCount === 0 ? 0 : Math.round((count / maxCount) * barMaxWidth);
            const y = index * (barHeight + barGap) + chartPadding;
            return `
    <text class="chart-label" x="0" y="${
      y + barHeight - textOffsetY
    }">${label}</text>
    <rect class="bar-track" x="${labelWidth}" y="${y}" width="${barMaxWidth}" height="${barHeight}" rx="${barRadius}" />
    <rect class="bar-fill" x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${barRadius}" />
    <text class="chart-count" x="${
      labelWidth + barMaxWidth + countOffsetX
    }" y="${y + barHeight - textOffsetY}">${count}</text>
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
      const donutWidth = readCssNumber("--donut-viewbox-width", 180);
      const donutHeight = readCssNumber("--donut-viewbox-height", 160);
      const donutCenterX = donutWidth / 2;
      const donutCenterY = donutHeight / 2;
      const radius = readCssNumber("--donut-radius", 52);
      const donutRotation = readCssNumber("--donut-rotation", -90);
      const donutTotalOffsetY = readCssNumber("--donut-total-offset-y", -2);
      const donutSubOffsetY = readCssNumber("--donut-sub-offset-y", 18);
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
  <svg class="donut-chart" viewBox="0 0 ${donutWidth} ${donutHeight}" role="img" aria-label="Projects pass and fail donut chart">
    <g transform="translate(${donutCenterX} ${donutCenterY}) rotate(${donutRotation})">
      <circle class="donut-track" r="${radius}" cx="0" cy="0"></circle>
      <circle class="donut-pass" r="${radius}" cx="0" cy="0"
        stroke-dasharray="${passLength} ${circumference - passLength}"></circle>
      <circle class="donut-fail" r="${radius}" cx="0" cy="0"
        stroke-dasharray="${failLength} ${circumference - failLength}"
        stroke-dashoffset="-${passLength}"></circle>
    </g>
    <text class="donut-total" x="${donutCenterX}" y="${
        donutCenterY + donutTotalOffsetY
      }">${totalProjects}</text>
    <text class="donut-sub" x="${donutCenterX}" y="${
        donutCenterY + donutSubOffsetY
      }">projects</text>
  </svg>
  <div class="chart-legend">
    <span class="legend-item"><span class="legend-swatch pass"></span>${passProjects} passed</span>
    <span class="legend-item"><span class="legend-swatch fail"></span>${failProjects} failed</span>
  </div>
`;
    }

    if (auditChartEl) {
      const totalAudit = done + receive;
      const containerPadding = readCssNumber("--flow-container-padding", 120);
      const barMin = readCssNumber("--flow-bar-min", 200);
      const barMaxLimit = readCssNumber("--flow-bar-max", 360);
      const barDefault = readCssNumber("--flow-bar-default", 220);
      const labelWidth = readCssNumber("--flow-label-width", 70);
      const rightPad = readCssNumber("--flow-right-pad", 50);
      const chartHeight = readCssNumber("--flow-chart-height", 90);
      const barHeight = readCssNumber("--flow-bar-height", 14);
      const doneY = readCssNumber("--flow-done-y", 14);
      const receiveY = readCssNumber("--flow-receive-y", 50);
      const barRadius = readCssNumber("--flow-bar-radius", 7);
      const textOffsetY = readCssNumber("--flow-text-offset-y", 2);
      const valueOffsetX = readCssNumber("--flow-value-offset-x", 8);
      const availableWidth = auditChartEl.clientWidth - containerPadding;
      const barMax =
        Math.max(barMin, Math.min(barMaxLimit, availableWidth || 0)) ||
        barDefault;
      const doneWidth = totalAudit ? (done / totalAudit) * barMax : 0;
      const receiveWidth = totalAudit ? (receive / totalAudit) * barMax : 0;
      const chartWidth = labelWidth + barMax + rightPad;

      auditChartEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Audits</p>
      <h2>Flow balance</h2>
    </div>
    <div class="badge">${ratioValue}</div>
  </div>
  <svg class="flow-chart" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Audit flow bar chart">
    <text class="flow-label" x="0" y="${
      doneY + barHeight - textOffsetY
    }">Done</text>
    <rect class="flow-track" x="${labelWidth}" y="${doneY}" width="${barMax}" height="${barHeight}" rx="${barRadius}"></rect>
    <rect class="flow-done" x="${labelWidth}" y="${doneY}" width="${doneWidth}" height="${barHeight}" rx="${barRadius}"></rect>
    <text class="flow-value" x="${labelWidth + barMax + valueOffsetX}" y="${
        doneY + barHeight - textOffsetY
      }">${doneMB}</text>
    <text class="flow-label" x="0" y="${
      receiveY + barHeight - textOffsetY
    }">Received</text>
    <rect class="flow-track" x="${labelWidth}" y="${receiveY}" width="${barMax}" height="${barHeight}" rx="${barRadius}"></rect>
    <rect class="flow-receive" x="${labelWidth}" y="${receiveY}" width="${receiveWidth}" height="${barHeight}" rx="${barRadius}"></rect>
    <text class="flow-value" x="${labelWidth + barMax + valueOffsetX}" y="${
        receiveY + barHeight - textOffsetY
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
