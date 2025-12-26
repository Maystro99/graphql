const FULLDATA_API = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

const loginNameEl = document.getElementById("login-name");
const infoEl = document.getElementById("info");
const statsEl = document.getElementById("stats");

async function gql(query) {
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

  if (json.errors) {
    console.error("GraphQL errors:", json.errors);
    throw new Error("GraphQL query failed");
  }

  return json.data;
}

async function loadUser() {
  const query = `
    query {
      user {
        login
      }
    }
  `;

  const data = await gql(query);
  loginNameEl.textContent = `Welcome ${data.user[0].login}`;
}

async function loadXP() {
  const query = `
    query {
      transaction(where: { type: { _eq: "xp" } }) {
        amount
        createdAt
      }
    }
  `;

  return (await gql(query)).transaction;
}

async function loadResults() {
  const query = `
    query {
      result {
        grade
      }
    }
  `;

  return (await gql(query)).result;
}

function renderXPGraph(xp) {
  let cumulative = 0;
  const values = xp.map((t) => (cumulative += t.amount));
  const maxXP = Math.max(...values);

  const width = 700;
  const height = 260;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - (v / maxXP) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <h2>XP Progress Over Time</h2>
    <svg viewBox="0 0 ${width} ${height}">
      <polyline points="${points}" />
    </svg>
  `;
}

function renderPassFail(results) {
  const passed = results.filter((r) => r.grade === 1).length;
  const failed = results.length - passed;

  const total = passed + failed;
  const passPercent = Math.round((passed / total) * 100);

  return `
    <h2>Pass / Fail Ratio</h2>
    <p>${passed} passed · ${failed} failed</p>
    <svg viewBox="0 0 400 20">
      <rect width="${passPercent * 4}" height="20" class="pass" />
      <rect x="${passPercent * 4}" width="${
    400 - passPercent * 4
  }" height="20" class="fail" />
    </svg>
  `;
}

async function init() {
  try {
    await loadUser();

    const xp = await loadXP();
    const results = await loadResults();

    const totalXP = xp.reduce((sum, t) => sum + t.amount, 0);
    const passed = results.filter((r) => r.grade === 1).length;

    infoEl.innerHTML = `
      <h2>Profile Overview</h2>
      <p><strong>Total XP:</strong> ${totalXP}</p>
      <p><strong>Projects Passed:</strong> ${passed}</p>
    `;

    statsEl.innerHTML = renderXPGraph(xp) + renderPassFail(results);
  } catch (err) {
    console.error(err);
    infoEl.innerHTML = `<p>Error loading profile data.</p>`;
  }
}

init();
