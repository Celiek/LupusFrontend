document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();  // Zatrzymuje domyślne wysyłanie formularza

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ login: username, haslo: password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        // Przekierowanie na odpowiednią stronę w zależności od roli
        if (data.role === "ADMIN") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "dashboard.html";
        }
    } else {
        document.getElementById("error-message").classList.remove("hidden");
    }
});
