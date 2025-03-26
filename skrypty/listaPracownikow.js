const apiUrl = "localhost:8080/api/pracownik/listall";

fetch(apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error("Błąd w pobieraniu danych z API");
        }
        return response.json(); // Konwertuje odpowiedź na JSON
    })
    .then(data => {
        const tableBody = document.querySelector("#data-table tbody");

        // Iteruj przez dane i twórz wiersze w tabeli
        data.forEach(user => {
            const row = document.createElement("tr");

            // Dodaj kolumny (komórki) do wiersza
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
            `;

            // Dodaj wiersz do tabeli
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error("Wystąpił błąd:", error);
    });