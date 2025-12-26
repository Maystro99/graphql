const LOGINAPI = "https://learn.reboot01.com/api/auth/signin";

const login = async () => {
  const identifier = document.getElementById("login").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(LOGINAPI, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${identifier}:${password}`),
      },
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    const token = await res.json();

    localStorage.setItem("jwt", token);

    console.log("🎉 Login successful");

    window.location.href = "/templates/profile.html";
  } catch (err) {
    const error = document.createElement("p");
    error.id = "error";
    error.classList.add("error");
    error.innerText = err.message;
  }
};

// function logout() {
//   localStorage.removeItem("jwt");
//   window.location.href = "/index.html";
// }
