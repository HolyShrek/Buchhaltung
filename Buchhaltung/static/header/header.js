/**
 * Lädt den Header dynamisch von einer HTML-Datei in den DOM
 * @returns {Promise<void>} Fügt den HTML-Inhalt in das Element mit der ID "headerContainer" ein
 */
async function loadHeader(){
    const res = await fetch("/header/header.html"); // HTML-Datei vom Server laden
    const html = await res.text(); // Inhalt in Text umwandeln
    document.getElementById("headerContainer").innerHTML = html; // HTML in DOM einfügen
}
loadHeader(); // Funktion direkt beim Laden der Seite ausführen

/**
 * Aktiviert oder deaktiviert den Dark Mode basierend auf dem aktuellen Zustand im Backend
 * @param {boolean} change - Wenn true, wird der Dark Mode Status gewechselt; sonst nur Zustand laden
 * @returns {Promise<void>}
 */
async function darkMode(change){
    const res = await fetch(url + "design/-1"); // Aktuellen Design-Status vom Server holen
    const json = await res.json();
    let Dark = json.design; // Aktueller Zustand: 0 = DarkMode, 1 = LightMode
    console.log(Dark);

    if(change){
        console.log((Dark +1) % 2); // Umschalten: 0 -> 1 oder 1 -> 0
        Dark = (Dark +1) % 2;
        const toggleRes = await fetch(url + "design/" + Dark); // neuen Zustand an Server senden
    }

    console.log(Dark);
    if (Dark == 0) {
        // Dark Mode aktivieren
        document.documentElement.style.setProperty('--background', 'rgb(0, 0, 0)');
        document.documentElement.style.setProperty('--text', 'rgb(255, 255, 255)');
        document.documentElement.style.setProperty('--lightGray', 'rgb(54, 55, 82)');
        document.getElementById("darkModeToggle").innerText = "LightMode";
        document.querySelectorAll('.sidebar > a > img').forEach(item => {
            item.style.filter = "invert(0)"; // Icons auf hell umstellen
        });
    } else {
        // Light Mode aktivieren
        document.documentElement.style.setProperty('--background', 'rgb(255, 255, 255)');
        document.documentElement.style.setProperty('--text', 'rgb(0, 0, 0)');
        document.documentElement.style.setProperty('--lightGray', 'rgb(209, 209, 209)');
        document.getElementById("darkModeToggle").innerText = "DarkMode";
        document.querySelectorAll('.sidebar > a > img').forEach(item => {
            item.style.filter = "invert(1)"; // Icons auf dunkel umstellen
        });
    }
}
darkMode(false); // Dark Mode initial laden, aber nicht verändern

/**
 * Führt den Logout-Prozess durch, indem ein Logout-Request an den Server geschickt wird
 * @returns {Promise<void>}
 */
async function LogOut() {
    const response = await fetch(url+"LogOut"); // Logout-Request an Server senden
    const verdict = await response.json(); // Antwort als JSON lesen
    console.log(verdict.logOut);
    if(verdict.logOut == true){
        console.log("all good"); // Logout erfolgreich
    }else{
        console.log("not all good"); // Logout fehlgeschlagen
    }
    // console.log(verdict); // ggf. weitere Ausgaben
}
