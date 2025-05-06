/**
 * Lädt die Sidebar dynamisch von einer HTML-Datei in den DOM
 * @returns {Promise<void>} Lädt den HTML-Inhalt und setzt ihn in das Element mit der ID "sidebarContainer"
 */
async function loadSidebar(){
    const res = await fetch("/sidebar/sidebar.html"); // HTML-Datei abrufen
    const html = await res.text(); // Inhalt als Text lesen
    document.getElementById("sidebarContainer").innerHTML = html; // In DOM einsetzen
}

loadSidebar(); // Funktion direkt beim Laden der Seite aufrufen
