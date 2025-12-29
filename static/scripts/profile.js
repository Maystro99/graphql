const FULLDATA_API = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

const loginNameEl = document.getElementById("login-name");
const infoEl = document.getElementById("info");
// const statsEl = document.getElementById("stats");

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
  loginNameEl.textContent = `Welcome ${data.user[0].login}`;
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

const init = async () => {
  try {
    const userID = await loadUser();

    const totalXP = await loadXP(userID);
    const displayXP = String(Math.floor(totalXP)).slice(0, 3);
    // const results = await loadResults();

    // const passed = results.filter((r) => r.grade === 1).length;

    infoEl.innerHTML = `
      <h2>Profile Overview</h2>
      <p><strong>Total XP:</strong> ${displayXP}KB</p>
    `;

    // statsEl.innerHTML = renderPassFail(results);
  } catch (err) {
    console.error(err);
    infoEl.innerHTML = `<p>Error loading profile data.</p>`;
  }
};

init();
