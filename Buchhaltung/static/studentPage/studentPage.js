const url = "http://localhost:8080/";

/**
 * @returns {string} Die Benutzer-ID aus der aktuellen URL
 */
function getUserId(){
    const url= decodeURI(window.location.href); // Dekodiert die aktuelle URL
    const splitUrl = url.split("/"); // Teilt URL in Teile
    return(splitUrl[4]); // Gibt das Element an Index 4 zurück (Benutzer-ID)
}

/**
 * @param {number} ms - Zeit in Millisekunden zum "Schlafen"
 * @returns {Promise<void>} Ein Promise, das nach der angegebenen Zeit aufgelöst wird
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)); // Verzögert asynchron um ms Millisekunden
}

/**
 * @returns {Promise<void>} Führt Polling aus: ruft Rechnungen im Sekundentakt ab
 */
async function poll1(){
    const id = getUserId(); // Benutzer-ID holen
    getInvoices(id); // Rechnungen abrufen
    await sleep(1000); // 1 Sekunde warten
    poll1(); // Rekursiver Aufruf
}

/**
 * @param {string} id - Die ID des Benutzers
 * @returns {Promise<void>} Holt Rechnungen vom Server und zeigt sie an
 */
async function getInvoices(id){
    const response = await fetch(url + "studentAccount/invoices/" + id); // Serveranfrage
    const invoice = await response.json(); // Antwort in JSON umwandeln
    displayInvoice(invoice); // Anzeigen
}

/**
 * @param {{ invoice: Array, saldo: number, name: string }} data - Datenobjekt mit Rechnungen und Gesamtbetrag
 * @returns {void}
 */
function displayInvoice(data){
    const tableBody = document.querySelector("#tableStudent tBody"); // Tabellenkörper selektieren
    tableBody.innerHTML = ""; // Vorherige Inhalte entfernen

    data.invoice.forEach(item => {
        const row = document.createElement("tr"); // Neue Tabellenzeile erstellen

        const pointName = document.createElement("td"); // Name-Zelle
        const textName = document.createTextNode(item.name);
        pointName.appendChild(textName);

        const pointPreis = document.createElement("td"); // Preis-Zelle
        const textPreis = document.createTextNode(item.price + "Fr.");
        pointPreis.className = "number";
        pointPreis.appendChild(textPreis);

        const pointDatum = document.createElement("td"); // Datum-Zelle
        const textDatum = document.createTextNode(item.date);
        pointDatum.appendChild(textDatum);

        const pointButton = document.createElement("td"); // Button-Zelle
        const button = document.createElement("button");
        button.className = "buttonDeleteInvoice";
        button.value = item.id;
        pointButton.appendChild(button);

        row.appendChild(pointName);
        row.appendChild(pointPreis);
        row.appendChild(pointDatum);
        row.appendChild(pointButton);
        tableBody.appendChild(row); // Zeile in Tabelle einfügen
    });

    const saldo = document.getElementById("saldo"); // Saldo-Element
    saldo.textContent = "Total:" + data.saldo + "Fr."; // Gesamtbetrag anzeigen

    const name = document.querySelector(".titel"); // Titel-Element
    name.textContent = data.name; // Name anzeigen
}

/**
 * @returns {Promise<void>} Erfasst neue Rechnung, konvertiert Währung und sendet an Server
 */
async function newInvoice(){
    const container = document.getElementById("newInvoice");
    const ElementName = document.getElementById("newInvoiceName");
    const ElementPrice = document.getElementById("newInvoicePrice");

    let price = ElementPrice.value;
    const currency = container.querySelector("select").value;

    try {
        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ScSlyGqkvHnE42AkxW2pSQ968he4dMmsEHqQwd2T&currencies=CHF&base_currency=${currency}`);
        const data = await response.json(); // Wechselkurs holen

        let calculations = data.data.CHF * price; // Umrechnen in CHF
        price = calculations.toFixed(2); // Runden

        let postJson = {
            name: ElementName.value,
            price: price,
            studentId: getUserId()
        };

        console.log(postJson);

        const postResponse = await fetch(url + "newStudentInvoice", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(postJson)
        });

        const verdict = await postResponse.text(); // Antwort prüfen
        console.log(verdict);

    } catch (error) {
        console.error("Error fetching or posting data:", error); // Fehlerbehandlung
    } 

    container.style.display = "none"; // Formular ausblenden
}

/**
 * @returns {Promise<void>} Löscht eine Rechnung anhand ihres Namens und zeigt Serverantwort kurz an
 */
async function deleteInvoice(){
    console.log("x");
    const ElementName = document.getElementById("deleteInvoiceName");
    const ElementResponse = document.getElementById("responseDeleteInvoice");
    const name = ElementName.value;

    if(name == ""){
        return; // Wenn leer, abbrechen
    }

    const studentId = getUserId();
    const response = await fetch(url + "deleteStudentInvoice/" + name + "/" + studentId);
    const verdict = await response.text();

    console.log(verdict);
    ElementResponse.textContent = verdict; // Antwort anzeigen
    await sleep(500); // Kurze Anzeige
    ElementResponse.textContent = ""; // Zurücksetzen
}

/**
 * @returns {Promise<void>} Lädt PDF-Datei der Rechnungen für den aktuellen Benutzer herunter
 */
async function download(){
    try{
        const loader = document.querySelector(".loader");
        loader.style.display = "block"; // Ladeanimation anzeigen
        const id = getUserId();
        console.log("process ongoing");

        const res = await fetch(url + "export/" + id);
        if(!res.ok) throw new Error("Error on PDF handling");

        const blob = await res.blob(); // PDF als Blob holen
        const UrlPDF = URL.createObjectURL(blob);

        const a = document.createElement('a'); // Download-Link
        a.href = UrlPDF;
        a.download = "student-" + id + ".pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();

        console.log("process finished succesfully");
        loader.style.display = "none";
    } catch {
        console.error("Error");
    }
}

/**
 * Klick-Event Listener für dynamisch erzeugte Delete-Buttons
 * @param {MouseEvent} e - Klick-Event
 */
document.addEventListener("click", async(e) => {
    if (e.target.matches(".buttonDeleteInvoice")){
        console.log(e.target.value);
        const response = await fetch(url + "deleteStudentInvoice/" + e.target.value + "/" + getUserId());
        console.log(response.text());
    }
});
