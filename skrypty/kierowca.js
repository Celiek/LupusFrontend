let workStartTime = null;
let breakStartTime = null;
let workTimerInterval = null;
let totalBreakTimeMs = 0;
let isBreak = false;
let alertElement = null;

function saveStateToLocalStorage() {
  localStorage.setItem("workStartTime", workStartTime?.toISOString() || "");
  localStorage.setItem("breakStartTime", breakStartTime?.toISOString() || "");
  localStorage.setItem("totalBreakTimeMs", totalBreakTimeMs.toString());
  localStorage.setItem("isBreak", isBreak.toString());
}

function clearWorkState() {
  localStorage.removeItem("workStartTime");
  localStorage.removeItem("breakStartTime");
  localStorage.removeItem("totalBreakTimeMs");
  localStorage.removeItem("isBreak");
}

function loadStateFromLocalStorage() {
  const savedWorkStart = localStorage.getItem("workStartTime");
  const savedBreakStart = localStorage.getItem("breakStartTime");
  const savedBreakTime = localStorage.getItem("totalBreakTimeMs");
  const savedisBreak = localStorage.getItem("isBreak");

  if (savedWorkStart) workStartTime = new Date(savedWorkStart);
  if (savedBreakStart) breakStartTime = new Date(savedBreakStart);
  if (savedBreakTime) totalBreakTimeMs = parseInt(savedBreakTime);
  if (savedisBreak === "true") isBreak = true;
}

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

async function startPraca(id) {
  const token = localStorage.getItem("token");
  const teraz = new Date();
  const data = teraz.toISOString().slice(0, 10);
  const czas = teraz.toTimeString().slice(0, 5);

  workStartTime = new Date();
  saveStateToLocalStorage();

  if (!id || isNaN(id)) {
    alert("Nieprawidłowy identyfikator pracownika");
    return;
  }
  

  try {
    const url = `https://lupus24.byst.re/api/czasPracy/startPraca?id=${id}&data=${data}&czas=${czas}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
    const result = await response.text();
    alert(`✅ ${result}`);
  } catch (err) {
    console.error("Błąd:", err);
    alert("❌ Nie udało się rozpocząć pracy.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  loadStateFromLocalStorage();
  const workTimeDisplay = document.getElementById("workTime");
  const breakAlert = document.getElementById("breakAlert");
  const alertElement = document.getElementById("startAlert");
  updateTimeDisplay();

  if (!workStartTime) {
    workTimeDisplay.textContent = "Czas pracy: 00:00";
    breakAlert.style.display = "none";
    clearWorkState();
  }

  checkBackendStatus();
  setInterval(updateTimeDisplay, 60000);
  clearInterval(workTimerInterval);
  workTimeDisplay.textContent = "Czas pracy: 00:00";
  workStartTime = null;
  breakStartTime = null;
  totalBreakTimeMs = 0;
  isBreak = false;
  breakAlert.style.display = "none";
  clearWorkState();
  showBootstrapAlert("🛑 Czas pracy został zakończony.", "danger");
  const collapse = document.getElementById("userTableCollapse");
  if (collapse) {
    collapse.addEventListener("show.bs.collapse", () => {
      fetchAndDisplayUsers();
    });
  }

});

//powiększa zdjęcie po kliknięciu 
function handleImageClick(event) {
  const imageSrc = event.target.src;
  const modalImage = document.getElementById("modalImage");
  modalImage.src = imageSrc;

  // Pokazuje modal
  const imageModal = new bootstrap.Modal(document.getElementById("imageModal"));
  imageModal.show();
}

// Funkcja do zmiany statusu pracy w navbarze
function updateWorkStatus(isWorkStarted) {
  const statusIcon = document.getElementById('work-status-icon');
  const statusText = document.getElementById('work-status-text');

  if (isWorkStarted) {
      // Zmieniamy ikonę na zieloną i tekst
      statusIcon.classList.add('connected');
      statusIcon.classList.remove('disconnected');
      statusText.textContent = 'Praca rozpoczęta';
  } else {
      // Zmieniamy ikonę na czerwoną i tekst
      statusIcon.classList.add('disconnected');
      statusIcon.classList.remove('connected');
      statusText.textContent = 'Czas pracy: 00:00';
  }
}

// Funkcja start pracy
async function startPraca(id) {
  const token = localStorage.getItem("token");
  const teraz = new Date();
  const data = teraz.toISOString().slice(0, 10);
  const czas = teraz.toTimeString().slice(0, 5);

  workStartTime = new Date();
  saveStateToLocalStorage();

  if (!id || isNaN(id)) {
      alert("Nieprawidłowy identyfikator pracownika");
      return;
  }

  try {
      const url = `https://lupus24.byst.re/api/czasPracy/startPraca?id=${id}&data=${data}&czas=${czas}`;
      const response = await fetch(url, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${token}`,
          },
      });

      if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
      const result = await response.text();
      alert(`✅ ${result}`);

      // Zmiana statusu pracy na rozpoczętą
      updateWorkStatus(true); // Ustawiamy status pracy na rozpoczęty
  } catch (err) {
      console.error("Błąd:", err);
      alert("❌ Nie udało się rozpocząć pracy.");
  }
}

// Event listener dla przycisku "Start pracy"
document.getElementById("startWork").addEventListener("click", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
      alert("Brak tokena – użytkownik nie jest zalogowany.");
      return;
  }

  try {
      const response = await fetch(
          "https://lupus24.byst.re/api/czasPracy/startPracy",
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

      // Pokazuje alert, że praca została rozpoczęta
      const alertElement = document.getElementById("startAlert");
      alertElement.classList.add("show");
      alertElement.style.display = "block";
      setTimeout(() => {
          alertElement.classList.remove("show");
          alertElement.style.display = "none";
      }, 5000);

      // Zmiana statusu w navbarze
      updateWorkStatus(true); // Ustawiamy status pracy na rozpoczęty
  } catch (err) {
      console.error("Błąd podczas rozpoczynania pracy:", err);
      alert("❌ Nie udało się rozpocząć pracy.");
  }
});


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
      "https://lupus24.byst.re/api/czasPracy/startPracy",
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

document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.clear();
});

document.getElementById("startBreak").addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  const data = new Date().toISOString().slice(0, 10); // dzisiejsza data

  if (!isOnBreak) {
    // Rozpoczęcie przerwy
    breakStartTime = new Date();
    isOnBreak = true;
    saveStateToLocalStorage();
    document.getElementById("startBreak").textContent = "Koniec przerwy";
    showBootstrapAlert("🔁 Przerwa została rozpoczęta.", "warning");
  } else {
    // Zakończenie przerwy
    const breakEnd = new Date();
    const breakDurationMs = breakEnd - breakStartTime;

    if (
      !isNaN(breakDurationMs) &&
      breakDurationMs > 0 &&
      breakDurationMs <= 4 * 60 * 60 * 1000
    ) {
      totalBreakTimeMs += breakDurationMs;

      // Przekonwertuj ms → HH:mm:ss (wymagany przez backend)
      const totalSeconds = Math.floor(breakDurationMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
        2,
        "0"
      );
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      const breakDurationFormatted = `${hours}:${minutes}:${seconds}`;

      // Wyślij do backendu
      try {
        const response = await fetch(
          `https://lupus24.byst.re/api/czasPracy/przerwa?przerwa=${encodeURIComponent(
            breakDurationFormatted
          )}&data=${data}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const msg = await response.text();
          throw new Error(`Błąd HTTP ${response.status} – ${msg}`);
        }

        const result = await response.text();
        console.log("✅ Przerwa wysłana:", result);
      } catch (err) {
        console.error("Błąd podczas wysyłania przerwy:", err);
        alert("❌ Nie udało się zapisać przerwy na serwerze.");
      }
    } else {
      console.warn("Nieprawidłowy czas przerwy:", breakDurationMs);
    }

    isOnBreak = false;
    breakStartTime = null;
    saveStateToLocalStorage();
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
  document.getElementById("workTime").textContent = "Czas pracy: 00:00";
  document.getElementById("breakAlert").style.display = "none";
  workStartTime = null;
  breakStartTime = null;
  totalBreakTimeMs = 0;
  isBreak = false;
  clearWorkState();
  showBootstrapAlert("🛑 Czas pracy został zakończony.", "danger");
});

function updateTimeDisplay() {
  const workTimeDisplay = document.getElementById("workTime");
  const workDuration = localStorage.getItem("workDuration");

  if (workDuration) {
    const formattedTime = formatTime(parseInt(workDuration)); // Konwersja czasu w ms do formatu hh:mm
    workTimeDisplay.textContent = `Czas pracy: ${formattedTime}`;
  } else {
    workTimeDisplay.textContent = "Czas pracy: 00:00";
  }
}

function formatTime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

async function checkBackendStatus() {
  const statusIcon = document.getElementById("status-icon");
  const statusText = document.getElementById("status-text");

  try {
    const response = await fetch("https://lupus24.byst.re/api/ping");
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
      "https://lupus24.byst.re/api/pracownik/listall",
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

    users.forEach((p) => {
      const tr = document.createElement("tr");

      const imgSrc = p.zdjecie
        ? `data:image/jpeg;base64,${p.zdjecie}`
        : "https://via.placeholder.com/100";

      tr.innerHTML = `
          <td>${p.imie} ${p.nazwisko}</td>
          <td>${p.drugieImie || ""}</td>
          <td>${p.dataDolaczenia || "-"}</td>
          <td>
              <img src="${imgSrc}" alt="Zdjęcie" width="100" class="img-thumbnail" onclick="handleImageClick(event)">
          </td>
          <td>
              <input type="checkbox" class="form-check-input obecny-checkbox" data-id="${
                p.idPracownika
              }">
          </td>
          <td>
              <button class="btn btn-sm btn-outline-danger" onclick="stopPraca(${
                p.idPracownika
              })">Zatrzymaj</button>
          </td>
          <td>
              <button class="btn btn-sm btn-outline-success start-individual" data-id="${
                p.idPracownika
              }">Start</button>
          </td>
      `;

      tbody.appendChild(tr);
    });

    // Po załadowaniu tabeli, przypnij eventy do przycisków start
    document.querySelectorAll(".start-individual").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await startPraca(parseInt(id));
      });
    });
  } catch (error) {
    console.error("Nie udało się pobrać pracowników:", error);
  }
}
// zatrzymuej naliczanie czasu pracy dla pracownika
async function stopPraca(id) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `https://lupus24.byst.re/api/czasPracy/stopPracy?id=${id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);

    const result = await response.text();
    alert(`🛑 Zatrzymano pracę pracownika ID ${id}.\n${result}`);

    // Zapisanie czasu pracy do localStorage
    const endTime = new Date();
    const workDuration = endTime - new Date(localStorage.getItem("startPracy")); // Różnica czasu
    localStorage.setItem("workEndTime", endTime.toISOString());
    localStorage.setItem("workDuration", workDuration); // Przechowujemy czas pracy w ms

    // Wyświetlenie powiadomienia o całkowitym czasie pracy
    showWorkTimeNotification(workDuration); // Funkcja pokazująca powiadomienie
  } catch (err) {
    console.error("Błąd zatrzymania pracy:", err);
    alert("❌ Nie udało się zatrzymać pracy.");
  }
}

//wyswietla powaiadominie stop czasu pracy
function showWorkTimeNotification(workDuration) {
  const workTimeAlert = document.createElement("div");
  workTimeAlert.classList.add(
    "alert",
    "alert-info",
    "alert-dismissible",
    "fade",
    "show"
  );
  workTimeAlert.setAttribute("role", "alert");
  workTimeAlert.innerHTML = `
      <strong>Czas pracy dzisiaj:</strong> ${formatTime(workDuration)} 
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.body.appendChild(workTimeAlert); // Można wybrać miejsce na stronie

  // Automatyczne zamknięcie powiadomienia po 5 sekundach
  setTimeout(() => {
    const alertInstance = new bootstrap.Alert(workTimeAlert);
    alertInstance.close();
  }, 5000);
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
      "https://lupus24.byst.re/api/czasPracy/stopPracaWielu",
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

async function isOnBreak(id) {
  //const token = localStorage.getItem("token");

  const przerwa = "Początek"; // lub "Koniec" — w zależności od sytuacji
  const data = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const response = await fetch(
      `https://lupus24.byst.re/api/czasPracy/przerwa?przerwa=${przerwa}&data=${data}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`Błąd HTTP ${response.status} – ${msg}`);
    }

    const result = await response.text();
    alert(`✅ Zgłoszono przerwę dla ID ${id}: ${result}`);
  } catch (err) {
    console.error("Błąd podczas rejestrowania przerwy:", err);
    alert("❌ Nie udało się zarejestrować przerwy.");
  }
}
