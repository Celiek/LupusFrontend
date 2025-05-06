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
    <img src="${
      user.zdjecie
        ? `data:image/jpeg;base64,${user.zdjecie}`
        : "https://via.placeholder.com/100"
    }" alt="Zdjęcie" class="img-thumbnail" width="100">
  </td>
  <td>
    <input type="checkbox" class="form-check-input obecny-checkbox" data-id="${
      user.idPracownika
    }">
  </td>
  <td>
    <button class="btn btn-danger btn-sm" onclick="stopPraca(${
      user.idPracownika
    })">Stop pracy</button>
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

function formatTime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function updateTimeDisplay() {
  const start = localStorage.getItem("startPracy");
  if (start) {
    const diff = Date.now() - new Date(start).getTime();
    document.getElementById("workTime").textContent = `Czas pracy: ${formatTime(
      diff
    )}`;
  }
}

document.getElementById("startWork").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:8080/api/czasPracy/startPracy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Błąd rozpoczęcia pracy!");

    const now = new Date();
    localStorage.setItem("startPracy", now.toISOString());
    updateTimeDisplay();
  } catch (err) {
    console.error(err);
  }
});

setInterval(updateTimeDisplay, 60000); // aktualizacja co minutę
updateTimeDisplay(); // startowa aktualizacja przy ładowaniu

document.getElementById("startWork").addEventListener("click", async () => {
  const checkboxes = document.querySelectorAll(".obecny-checkbox:checked");
  const ids = Array.from(checkboxes).map((cb) => cb.dataset.id);

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "http://localhost:8080/api/czasPracy/startPracy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ids), // Zakładamy, że backend potrafi odebrać listę ID
      }
    );

    if (!response.ok) throw new Error("Błąd rozpoczęcia pracy!");

    const now = new Date();
    localStorage.setItem("startPracy", now.toISOString());
    updateTimeDisplay();
  } catch (err) {
    console.error(err);
  }
});

async function stopPraca(idPracownika) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(
      `http://localhost:8080/api/czasPracy/stopPracy?id=${idPracownika}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Błąd zatrzymania pracy: ${response.status}`);
    }

    alert(`Zatrzymano pracę pracownika ID: ${idPracownika}`);
  } catch (error) {
    console.error("Błąd:", error);
    alert("Nie udało się zatrzymać pracy.");
  }
}


// przerwa i jej obsługa : 
let isOnBreak = false;
let totalBreakTimeMs = 0;
let breakStart = null;

function formatTime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

document.getElementById("startBreak").addEventListener("click", () => {
  if (!isOnBreak) {
    breakStart = new Date();
    isOnBreak = true;
    document.getElementById("startBreak").textContent = "Koniec przerwy";
  } else {
    const breakEnd = new Date();
    const breakDuration = breakEnd - breakStart;
    totalBreakTimeMs += breakDuration;
    isOnBreak = false;
    breakStart = null;
    document.getElementById("startBreak").textContent = "Początek przerwy";

    const alertDiv = document.getElementById("breakAlert");
    alertDiv.classList.remove("alert-danger");
    alertDiv.classList.add("alert-info");
    alertDiv.textContent = `Łączny czas przerw: ${formatTime(
      totalBreakTimeMs
    )}`;
    alertDiv.style.display = "block";
  }
});
