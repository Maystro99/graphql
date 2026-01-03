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

const convertor = (value) => {
  if (value >= 1000000) {
    return (
      String((Math.floor((value / 1_000_000) * 100) / 100).toFixed(2)) + " MB"
    );
  }
  // show kB
  return String((Math.floor((value / 1_000) * 100) / 100).toFixed(2)) + " KB";
};

const init = async () => {
  try {
    const userID = await loadUser();

    const totalXP = await loadXP(userID);
    const displayXP = String(Math.round(totalXP / 1000)).slice(0, 3);
    const passAndFail = await passAndFailProject();
    console.log(passAndFail);
    const pass = passAndFail?.pass ?? 0;
    const fail = passAndFail?.fail ?? 0;
    const ratio = await auditRatio();

    const done = ratio?.done ?? 0;
    const receive = ratio?.receive ?? 0;

    const doneMB = convertor(done);
    const receiveMB = convertor(receive);

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
  } catch (err) {
    console.error(err);
    infoEl.innerHTML = `<p>Error loading profile data.</p>`;
    statsEl.innerHTML = "";
  }
};

init();
