let workStartTime = null;
let breakStartTime = null;
let workTimerInterval = null;

function showBootstrapAlert(message, type = "info") {
  const container = document.getElementById("statusAlertContainer");
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Zamknij"></button>
    </div>
  `;
  container.appendChild(wrapper);

  setTimeout(() => {
    const alertInstance = bootstrap.Alert.getOrCreateInstance(
      wrapper.querySelector(".alert")
    );
    alertInstance.close();
  }, 5000);
}


document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Nie jesteś zalogowany!");
    window.location.href = "/login.html";
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const username = payload.sub;
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

  const workTimeDisplay = document.getElementById("workTime");
  const breakAlert = document.getElementById("breakAlert");
  const alertElement = document.getElementById("startAlert");

  function updateWorkTime() {
    if (!workStartTime) return;
    const now = new Date();
    const diff = new Date(now - workStartTime);
    const hours = String(diff.getUTCHours()).padStart(2, "0");
    const minutes = String(diff.getUTCMinutes()).padStart(2, "0");
    workTimeDisplay.textContent = `Czas pracy: ${hours}:${minutes}`;
  }

  document.getElementById("startWork").addEventListener("click", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Brak tokena – użytkownik nie jest zalogowany.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/czasPracy/startPracy",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Błąd: ${response.status} – ${text}`);
      }

      const result = await response.text();
      console.log("✅", result);

      localStorage.setItem("startPracy", new Date().toISOString());

      if (alertElement) {
        alertElement.classList.add("show");
        alertElement.style.display = "block";
        setTimeout(() => {
          alertElement.classList.remove("show");
          alertElement.style.display = "none";
        }, 5000);
      }
    } catch (err) {
      console.error("Błąd podczas rozpoczynania pracy:", err);
      alert("❌ Nie udało się rozpocząć pracy.");
    }
  });

  document.getElementById("startBreak").addEventListener("click", () => {
    if (!isOnBreak) {
      breakStartTime = new Date();
      isOnBreak = true;
      document.getElementById("startBreak").textContent = "Koniec przerwy";
      showBootstrapAlert("🔁 Przerwa została rozpoczęta.", "warning");
    } else {
      const breakEnd = new Date();
      const breakDuration = breakEnd - breakStartTime;
      totalBreakTimeMs += breakDuration;
      isOnBreak = false;
      breakStartTime = null;
      document.getElementById("startBreak").textContent = "Początek przerwy";

      const alertDiv = document.getElementById("breakAlert");
      alertDiv.classList.remove("alert-danger");
      alertDiv.classList.add("alert-info");
      alertDiv.textContent = `Łączny czas przerw: ${formatTime(
        totalBreakTimeMs
      )}`;
      alertDiv.style.display = "block";

      showBootstrapAlert("✅ Przerwa zakończona.", "success");
    }
  });

  document.getElementById("stopWork").addEventListener("click", () => {
    clearInterval(workTimerInterval);
    workTimeDisplay.textContent = "Czas pracy: 00:00";
    workStartTime = null;
    breakStartTime = null;
    breakAlert.style.display = "none";
    localStorage.removeItem("startPracy");
    showBootstrapAlert("🛑 Czas pracy został zakończony.", "danger");
  });


  function updateTimeDisplay() {
    const start = localStorage.getItem("startPracy");
    if (start) {
      const diff = Date.now() - new Date(start).getTime();
      document.getElementById(
        "workTime"
      ).textContent = `Czas pracy: ${formatTime(diff)}`;
    }
  }

  setInterval(updateTimeDisplay, 60000);
  updateTimeDisplay();

  const collapse = document.getElementById("userTableCollapse");
  if (collapse) {
    collapse.addEventListener("show.bs.collapse", () => {
      fetchAndDisplayUsers();
    });
  }

  checkBackendStatus();
});

function formatTime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

    if (!response.ok) throw new Error(`Błąd: ${response.status}`);

    const users = await response.json();
    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = "";

    users.forEach((user) => {
      const row = document.createElement("tr");

      const imgSrc = user.zdjecieBase64
        ? `data:image/jpeg;base64,${user.zdjecieBase64}`
        : "https://via.placeholder.com/80x80?text=Brak";

      row.innerHTML = `
        <td>${user.imie || "-"}</td>
        <td>${user.drugieImie || "-"}</td>
        <td>${user.nazwisko || "-"}</td>
        <td>${user.typPracownika || "-"}</td>
        <td>${user.dataDolaczenia || "-"}</td>
        <td><img src="${imgSrc}" alt="Zdjęcie" class="img-thumbnail" width="100"></td>
        <td><input type="checkbox" class="form-check-input obecny-checkbox" data-id="${
          user.idPracownika
        }"></td>
        <td><button class="btn btn-danger btn-sm" onclick="stopPraca(${
          user.idPracownika
        })">Stop pracy</button></td>
      `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Nie udało się pobrać pracowników:", error);
  }
}
async function stopPracaDlaWielu() {
  const token = localStorage.getItem("token");

  const checkboxes = document.querySelectorAll(".obecny-checkbox:checked");
  const ids = Array.from(checkboxes).map((cb) => parseInt(cb.dataset.id));

  if (ids.length === 0) {
    alert("Zaznacz przynajmniej jednego pracownika.");
    return;
  }

  const potwierdzenie = confirm(
    `Czy na pewno chcesz zakończyć pracę dla ${ids.length} pracownika(ów)?`
  );
  if (!potwierdzenie) return;

  try {
    const response = await fetch(
      "http://localhost:8080/api/czasPracy/stopPracaWielu",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ids),
      }
    );

    if (!response.ok) {
      throw new Error(`Błąd HTTP: ${response.status}`);
    }

    alert("✅ Zakończono pracę dla zaznaczonych pracowników.");

    // 🔧 Zatrzymanie licznika po stronie klienta
    clearInterval(workTimerInterval);
    const workTimeDisplay = document.getElementById("workTime");
    if (workTimeDisplay) workTimeDisplay.textContent = "Czas pracy: 00:00";
    localStorage.removeItem("startPracy");
  } catch (err) {
    console.error("Błąd:", err);
    alert("❌ Nie udało się zakończyć pracy dla wielu pracowników.");
  }
}
