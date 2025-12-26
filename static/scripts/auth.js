const LOGINAPI = "https://learn.reboot01.com/api/auth/signin";

function login() {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;

  fetch(LOGINAPI, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${login}:${password}`),
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Invalid credentials");
      return res.json();
    })
    .then((token) => {
      localStorage.setItem("jwt", token);
    })
    .catch((err) => {
      document.getElementById("error").innerText = err.message;
    });
}

// function logout() {
//   localStorage.removeItem("jwt");
//   window.location.href = "index.html";
// }
