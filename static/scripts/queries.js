const FULLDATA_API = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";
const loginNameEl = document.getElementById("login-name");

export const gql = async (query) => {
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

export const loadUser = async () => {
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

export const loadXP = async () => {
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

export const loadXPHistory = async () => {
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

export const passAndFailProject = async () => {
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

export const auditRatio = async () => {
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

export const mySkills = async () => {
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
