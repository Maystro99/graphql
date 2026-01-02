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

const loadXP = async (userID) => {
  const query = `
    query {
      transaction_aggregate(
        where: {
          userId: { _eq: ${userID} }
          type: { _eq: "xp" }
          path: { _like: "%/bh-module/%" }
          _or: [
            { path: { _nlike: "%/piscine%" } }
            { path: { _eq: "/bahrain/bh-module/piscine-js" } }
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

const passAndFailProject = async () => {
  const query = `
    query {
      passed_projects: result_aggregate(
        where: {
          grade: { _gt: 1 }
          object: { type: { _eq: "project" } }
        }
      ) {
        aggregate {
          count
        }
      }

      failed_projects: result_aggregate(
        where: {
          grade: { _gt: 0, _lt: 1 }
          object: { type: { _eq: "project" } }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  const data = await gql(query);

  console.log("Passed projects:", data.passed_projects.aggregate.count);
  console.log("Failed projects:", data.failed_projects.aggregate.count);

  return {
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
  console.log("Recive:", data.Receive.aggregate.sum.amount);

  return {
    done: data?.Done?.aggregate?.sum?.amount ?? 0,
    receive: data?.Receive?.aggregate?.sum?.amount ?? 0,
  };
};

// const loadResults = async () => {
//   const query = `
//     query {
//       result {
//         grade
//       }
//     }
//   `;

//   return (await gql(query)).result;
// };

// const renderXPGraph = async (xp) => {
//   let cumulative = 0;
//   const values = xp.map((t) => (cumulative += t.amount));
//   const maxXP = Math.max(...values);

//   const width = 700;
//   const height = 260;

//   const points = values
//     .map((v, i) => {
//       const x = (i / (values.length - 1)) * width;
//       const y = height - (v / maxXP) * height;
//       return `${x},${y}`;
//     })
//     .join(" ");

//   return `
//     <h2>XP Progress Over Time</h2>
//     <svg viewBox="0 0 ${width} ${height}">
//       <polyline points="${points}" />
//     </svg>
//   `;
// };

// const renderPassFail =  (results) => {
//   const passed = results.filter((r) => r.grade === 1).length;
//   const failed = results.length - passed;

//   const total = passed + failed;
//   const passPercent = Math.round((passed / total) * 100);

//   return `
//     <h2>Pass / Fail Ratio</h2>
//     <p>${passed} passed · ${failed} failed</p>
//     <svg viewBox="0 0 400 20">
//       <rect width="${passPercent * 4}" height="20" class="pass" />
//       <rect x="${passPercent * 4}" width="${
//     400 - passPercent * 4
//   }" height="20" class="fail" />
//     </svg>
//   `;
// };
const toMB = (value) => (Math.floor(value / 10000) / 100).toFixed(2);

const init = async () => {
  try {
    const userID = await loadUser();

    const totalXP = await loadXP(userID);
    const displayXP = String(Math.floor(totalXP)).slice(0, 3);
    const passAndFail = await passAndFailProject();
    console.log(passAndFail);
    const pass = passAndFail?.pass ?? 0;
    const fail = passAndFail?.fail ?? 0;
    const ratio = await auditRatio();

    const done = ratio?.done ?? 0;
    const receive = ratio?.receive ?? 0;

    const doneMB = toMB(done);
    const receiveMB = toMB(receive);

    const ratioNumber = receive > 0 ? done / receive : null;
    const ratioValue = ratioNumber !== null ? ratioNumber.toFixed(1) : "N/A";
    const ratioClass =
      ratioNumber === null
        ? "ratio-unknown"
        : ratioNumber < 0.8
        ? "ratio-low"
        : ratioNumber < 1.0
        ? "ratio-mid"
        : "ratio-high";
    const ratioWidth =
      ratioNumber === null
        ? 30
        : ratioNumber < 0.8
        ? 40
        : ratioNumber < 1.0
        ? 70
        : 100;
    const ratioMessage =
      ratioNumber === null
        ? "No ratio yet"
        : ratioNumber < 0.8
        ? "Careful buddy!"
        : ratioNumber < 1.0
        ? "Not Enough"
        : "Good";

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
      <p class="stat-value">${displayXP} KB</p>
    </div>
    <div class="stat">
      <p class="stat-label">Projects</p>
      <p class="stat-value">${pass + fail}</p>
      <p class="stat-meta">${pass} passed · ${fail} failed</p>
    </div>
    <div class="stat">
      <p class="stat-label">Audit Ratio</p>
      <p class="stat-value">${ratioValue}</p>
      <p class="stat-meta">Done vs received</p>
    </div>
  </div>
`;

    statsEl.innerHTML = `
  <div class="card-header">
    <div>
      <p class="eyebrow">Audits</p>
      <h2>Flow</h2>
    </div>
    <div class="badge">Ratio ${ratioValue}</div>
  </div>
  <div class="split">
    <div class="stat">
      <p class="stat-label">Done</p>
      <p class="stat-value">${doneMB} MB</p>
    </div>
    <div class="stat">
      <p class="stat-label">Received</p>
      <p class="stat-value">${receiveMB} MB</p>
    </div>
  </div>
  <div class="ratio-bar ${ratioClass}">
    <div class="ratio-fill" style="width: ${ratioWidth}%;"></div>
  </div>
  <p class="stat-meta">${ratioMessage}</p>
`;
  } catch (err) {
    console.error(err);
    infoEl.innerHTML = `<p>Error loading profile data.</p>`;
    statsEl.innerHTML = "";
  }
};

init();
