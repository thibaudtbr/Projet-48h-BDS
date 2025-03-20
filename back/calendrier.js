document.addEventListener("DOMContentLoaded", function () {
    // Sélectionne la div où mettre le calendrier
    var calendarEl = document.getElementById("calendar");
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "timeGridWeek",
        locale: "fr",
        slotMinTime: "08:00:00",
        slotMaxTime: "22:00:00",
        events: []
    });

    calendar.render();

    // Gestion du fichier Excel
    document.getElementById("uploadExcel").addEventListener("change", function (event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: "array" });

                // Lire la première feuille du fichier Excel
                var sheet = workbook.Sheets[workbook.SheetNames[0]];
                var json = XLSX.utils.sheet_to_json(sheet);

                // Transformation des données en événements pour le calendrier
                var events = json.map(row => {
                    return {
                        title: row["Titre"] || "Événement",
                        start: convertExcelDate(row["Date Début"]),
                        end: convertExcelDate(row["Date Fin"]),
                        description: row["Description"] || ""
                    };
                });

                // Ajout des événements au calendrier
                calendar.addEventSource(events);
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // Fonction pour convertir une date Excel en format lisible
    function convertExcelDate(serial) {
        if (!serial) return null;
        var utc_days = Math.floor(serial - 25569);
        var utc_value = utc_days * 86400;
        var date_info = new Date(utc_value * 1000);
        return date_info.toISOString();
    }
});
