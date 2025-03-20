document.addEventListener('DOMContentLoaded', function() {
    let calendarEl = document.getElementById('calendar');
    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: []
    });
    calendar.render();

    // Chargement du fichier Excel
    fetch('./Planning_BDS.xlsx') // Assurez-vous que le chemin est correct
        .then(response => {
            if (!response.ok) {
                throw new Error(`Impossible de charger le fichier : ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(data => {
            let workbook = XLSX.read(data, { type: "array", cellText: false, cellDates: true });
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let json = XLSX.utils.sheet_to_json(sheet, { raw: false });

            // Vérifiez les données extraites
            console.log("Données Excel :", json);

            // Transformation en événements pour le calendrier
            let events = json.map(row => ({
                title: row["Titre"] || "Événement",
                start: row["Date Début"] || null,
                end: row["Date Fin"] || null,
                description: row["Description"] || ""
            }));

            console.log("Événements ajoutés :", events);

            calendar.addEventSource(events);
        })
        .catch(error => console.error("Erreur lors du chargement du fichier Excel :", error));
});