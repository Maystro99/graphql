const LOGIN_API = "https://learn.reboot01.com/api/auth/signin";

async function login() {
  const id = document.getElementById("login").value.trim();
  const pw = document.getElementById("password").value.trim();

  try {
    const res = await fetch(LOGIN_API, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${id}:${pw}`),
      },
    });

    if (!res.ok) throw new Error("Invalid credentials");

    const token = await res.json();
    localStorage.setItem("jwt", token);
    location.href = "templates/profile.html";
  } catch (e) {
    let err = document.querySelector(".error");
    if (!err) {
      err = document.createElement("div");
      err.className = "error";
      document.querySelector(".auth-card").appendChild(err);
    }
    err.textContent = e.message;
  }
}

function logout() {
  localStorage.removeItem("jwt");
  location.href = "../index.html";
}
