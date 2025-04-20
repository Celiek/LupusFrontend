//nazw kierowcy w nagłówku i przekierowanie jeśli nie jesteś kierowcą
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Nie jesteś zalogowany!");
    window.location.href = "/login.html";
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Dekodowanie części payload
    const username = payload.sub;
    const roles = payload.roles;

    console.log("Zalogowany użytkownik:", username);
    console.log("Role:", roles);

    // Wyświetl imię kierowcy w navbarze
    const imie = username.split(".")[0] || username;
    const kierowcaSpan = document.querySelector(".navbar .nav-link strong");
    if (kierowcaSpan) {
      kierowcaSpan.textContent = imie.charAt(0).toUpperCase() + imie.slice(1);
    }
  } catch (err) {
    console.error("Błąd przy dekodowaniu tokena:", err);
    alert("Nieprawidłowy token logowania.");
    window.location.href = "/login.html";
  }
});

let workStartTime = null;
let breakStartTime = null;
let workTimerInterval = null;

const workTimeDisplay = document.getElementById("workTime");
const breakAlert = document.getElementById("breakAlert");

function updateWorkTime() {
  if (!workStartTime) return;
  const now = new Date();
  const diff = new Date(now - workStartTime);
  const hours = String(diff.getUTCHours()).padStart(2, "0");
  const minutes = String(diff.getUTCMinutes()).padStart(2, "0");
  workTimeDisplay.textContent = `Czas pracy: ${hours}:${minutes}`;
}

document.getElementById("startWork").addEventListener("click", () => {
  workStartTime = new Date();
  breakStartTime = null;
  breakAlert.style.display = "none";
  if (workTimerInterval) clearInterval(workTimerInterval);
  workTimerInterval = setInterval(updateWorkTime, 1000);
});

document.getElementById("startBreak").addEventListener("click", () => {
  breakStartTime = new Date();
  setTimeout(() => {
    const now = new Date();
    const diffMin = (now - breakStartTime) / 60000;
    if (diffMin > 15) {
      breakAlert.style.display = "block";
    }
  }, 16 * 60 * 1000); // 16 minut
});

document.getElementById("stopWork").addEventListener("click", () => {
  clearInterval(workTimerInterval);
  workTimeDisplay.textContent = "Czas pracy: 00:00";
  workStartTime = null;
  breakStartTime = null;
  breakAlert.style.display = "none";
});

// Dummy data - powinno być z backendu
const pracownicy = ["Adam", "Ewa", "Kuba", "Marek"];
document.getElementById("workerCount").textContent = pracownicy.length;
const ul = document.getElementById("workersUl");
pracownicy.forEach((name) => {
  const li = document.createElement("li");
  li.className = "list-group-item";
  li.textContent = name;
  ul.appendChild(li);
});

// Backend status checker
async function checkBackendStatus() {
  const statusIcon = document.getElementById("status-icon");
  const statusText = document.getElementById("status-text");

  try {
    const response = await fetch("http://localhost:8080/api/ping");

    if (response.ok) {
      statusIcon.classList.add("connected");
      statusIcon.classList.remove("disconnected");
      statusText.textContent = "Połączono z serwerem";
    } else {
      throw new Error("Serwer nie odpowiada");
    }
  } catch (err) {
    statusIcon.classList.add("disconnected");
    statusIcon.classList.remove("connected");
    statusText.textContent = "Brak połączenia z serwerem";
  }
}
//lista pracowników
async function fetchAndDisplayUsers() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      "http://localhost:8080/api/pracownik/listall",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Błąd: ${response.status}`);
    }

    const users = await response.json();
    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = ""; // Wyczyść istniejącą zawartość

    users.forEach((user) => {
      const row = document.createElement("tr");

      // Obsługa zdjęcia
      const imgSrc = user.zdjecieBase64
        ? `data:image/jpeg;base64,${user.zdjecieBase64}`
        : "https://via.placeholder.com/80x80?text=Brak";

      row.innerHTML = `
        <td>${user.imie || "-"}</td>
        <td>${user.drugieImie || "-"}</td>
        <td>${user.nazwisko || "-"}</td>
        <td>${user.typPracownika || "-"}</td>
        <td>${user.dataDolaczenia || "-"}</td>
        <td>
          <img src="${imgSrc}" alt="Zdjęcie pracownika" style="width: 80px; height: auto; border-radius: 8px;">
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Nie udało się pobrać pracowników:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const collapse = document.getElementById("userTableCollapse");

  collapse.addEventListener("show.bs.collapse", () => {
    fetchAndDisplayUsers();
  });
});


// Automatyczne ładowanie danych przy rozwinięciu listy
document.addEventListener("DOMContentLoaded", () => {
  const collapse = document.getElementById("userTableCollapse");

  collapse.addEventListener("show.bs.collapse", () => {
    fetchAndDisplayUsers();
  });
});


checkBackendStatus();
