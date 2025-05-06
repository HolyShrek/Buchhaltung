const url= "http://localhost:8080/" // statischer Teil der Server-URL
let studentdata; // zum Speichern aller Klassen, Schüler und Rechnungen, auf die der Nutzer Zugriff hat
let currentClass; // ausgewählte Klasse für die Schülerauflistung

// Schülerauswahl wird beim Ausklappen neu geladen
const d = document.getElementById("student-selection");
d.addEventListener("toggle", (e) =>{
    displayStudentSelector();
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Erstellt eine Klassenauswahl, um die Klasse eines neuen Schülers auszuwählen.
 * Erzeugt eine Liste und füllt sie mit den Klassennamen und dazugehörenden Checkboxen.
 */
function displayNewStudentSelector(){
    const details = document.getElementById("newStudent-selection"); 
    const ul = details.querySelector("ul"); // Listenelement, in das die Listenpunkte eingefügt werden
    ul.innerHTML ="";
    studentdata.forEach(item =>{ // iteriert durch alle Objekte von studentdata
        // erzeugt einen Listenpunkt, ein Label und einen Input
        const li = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input")
        // hängt dem Listenpunkt das Label mit Klassennamen und den Input als Checkbox an
        label.innerText = item.name;
        input.value = item.name;
        input.type = "checkbox";
        label.prepend(input);
        li.appendChild(label);
        ul.appendChild(li); // fügt den Listenpunkt der Liste hinzu
    });
}

/**
 * Erstellt die Klassenauswahl für einen Sammeleintrag
 * Funktionsweise: siehe displayNewStudentSelector()
 */
function displayClassSelector(){
    const details = document.getElementById("class-selection");
    const ul = details.querySelector("ul"); 
    ul.innerHTML ="";
    studentdata.forEach(item =>{
        const li = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input")
        label.innerText = item.name;
        input.value = item.name;
        input.type = "checkbox";
        label.prepend(input);
        li.appendChild(label);
        ul.appendChild(li);
    });
}

/**
 * Erstellt die Schülerauswahl für einen Sammeleintrag.
 * Erstellt eine Liste und füllt sie mit den Schülern der ausgewählten Klassen sowie dazugehörenden Checkboxen.
 */
function displayStudentSelector() {
    const selectedClass = document.getElementById("class-selection"); // die Klassenauswahl für den Sammeleintrag
    const selectedOptions = selectedClass.querySelectorAll("input:checked"); // alle ausgewählten Klassen
    const count =Array.from(selectedOptions, el => el.value); // erstellt ein Array mit den ausgewälten Klassennamen
    // überprüft, ob mindestens eine Klasse ausgewält wurde
    if(count.length == 0){
        console.log("Keine Klasse ausgewählt");
        return;
    }
    const details = document.getElementById("student-selection");
    const ul = details.querySelector("ul"); // Listenelement, in das die Listenpunkte eingefügt werden
    ul.innerHTML ="";
    
    // iteriert durch alle Objekte von studentdata und erstellt eine Auswahlliste aus allen Schülern, die sich in den ausgewälten Klassen befinden 
    studentdata.forEach(item => {
        if (count.includes(item.name)) {
            item.data.forEach(student =>{
                const li = document.createElement("li");
                const label = document.createElement("label");
                const input = document.createElement("input")
                label.innerText = student.name;
                input.value = student.id;
                input.type = "checkbox";
                label.prepend(input);
                li.appendChild(label);
                ul.appendChild(li);
            });
        }
    });
}

/**
 * Sendet den Sammeleintrag an den Server
 * Erstellt ein JSON mit allen benötigten Daten und macht damit eine Serveranfrage
 */
async function sendSammeleintrag() {
    const postJson ={};
    const ElementName = document.getElementById("name"); // Rechnungsname-Eingabefeld
    const ElementPrice = document.getElementById("price"); // Preis-Eingabefeld
    let price = ElementPrice.value; // eingegebener Preis
    const container = document.getElementById("Sammeleintrag");
    container.style.display= "none";


    const details = document.getElementById("student-selection");
    const listInputs = details.querySelectorAll("input:checked"); // alle ausgewälten Schüler
    const students = Array.from(listInputs, el=> el.value); // erstellt ein Array mit den ausgewälten Schülernamen
    
    const currency = container.querySelector("select").value; // die ausgewälte Währung
    try {
        // fetched den Wechselkurs zwischen Franken und der ausgewälten Währung von einer Web-API
        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ScSlyGqkvHnE42AkxW2pSQ968he4dMmsEHqQwd2T&currencies=CHF&base_currency=${currency}`);
        const data = await response.json();

        // berechnet den Preis in Franken
        let calculations = data.data.CHF * price;
        price = calculations.toFixed(2); // speichert Preis mit zwei Nachkommastellen als String

        // füllt das zu sendende JSON 
        let postJson = {
            name: ElementName.value,
            price: price,
            student: students
        };

        console.log(postJson);

        // sendet das JSON mit der POST-Methode an den Server
        const postResponse = await fetch(url + "Sammeleintrag", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(postJson)
        });

        // Server-Antwort
        const verdict = await postResponse.text();
        console.log(verdict);

    } catch (error) {
        console.error("Error fetching or posting data:", error);
    }
}

/**
 * Sendet die Daten eines neu erstellten Schülers an den Server.
 * Erstellt ein JSON mit allen benötigten Daten und macht damit eine Serveranfrage.
 */
async function sendNewStudent(){
    //get params
    const ElementName = document.getElementById("newStudentName"); // Schülername-Eingabe
    const details = document.getElementById("newStudent-selection"); // Klassenauswahl für neuen Schüler
    const container = document.getElementById("newStudent");
    container.style.display="none";
    
    const listInput = details.querySelectorAll("input:checked"); // ausgewälte Klassen
    const name = ElementName.value; // Schülername
    const classes = Array.from(listInput, el=> el.value); // Array aus ausgewälten Klassennamen
    
    // sendet Schülername und Klasse an Server
    const response = await fetch(url + "newStudent/" + name + "/" + classes[0]);
    console.log(response);
}

/**
 * Initialisiert alle Klassenauswahlen
 * Erhält studentdata durch eine Serveranfrage
 */
async function init() {
    const responseSaldo = await fetch(url+"students/Saldo"); // Serveranfrage
    const data = await responseSaldo.json();
    studentdata= data; // speichert die erhaltenen Schüler- und Klassennamen in globaler Variable
    displayClassSelector(); // initialisiert Klassenauswahl für Sammeleintrag
    displayNewStudentSelector(); // initialisert Klassenauswahl für neuen Schüler
    displayStudents(data); // initialisiert Klassenauswahl für Schülerdarstellung
    refresh(); // erneuert studentdata regelmässig
}

/**
 * Erstellt Klassenauswahl für die Schülerdarstellung
 * Erzeugt eine Liste aus Knöpfen mit Klassennamen
 * @param {object} a - Objekt, dass Klassen enthält
 */
function displayStudents(a){
    a.forEach(classes=>{ // iteriert durch alle Klassen
        const list = document.querySelector("div.class-sidebar ul"); // zu füllende Liste
        // erzeugt Knopf mit Klassennamen
        const button= document.createElement("button");
        button.className="class-sidebar-button"
        button.innerText=classes.name;
        // erzeugt Listenpunkt
        const li = document.createElement("li");
        // hängt Listenpunkt an Liste an
        li.appendChild(button);
        list.appendChild(li);
    });
}

/**
 * Währungsrechner, rechnet Franken in Euro um
 * 
 */
async function calculateCurrency(){
    const container = document.getElementById("currencyCalculater");
    container.style.display="none";
    const ElementBetrag = document.querySelector("#currencyCalculater input"); // Betrag-Eingabe
    const ElementAnswer = document.getElementById("EuroSwiss"); // Ausgabe-Element
    const Betrag = ElementBetrag.value; 
    // fetched Wechselkurse mit Franken von Web-API
    fetch('https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ScSlyGqkvHnE42AkxW2pSQ968he4dMmsEHqQwd2T&currencies=EUR&base_currency=CHF')
    .then(response => response.json())
    .then(data => {
        const calculations = data.data.EUR * Betrag; // berechnet Betrag in Euro
        const round = calculations.toFixed(2); // Resultat als String mit zwei Nachkommastellen
        ElementAnswer.textContent = round+ " EURO"; // gibt Resultat aus
    })
    .catch(error => console.error("Error fetching data:", error));
}

/**
 * Listet die Schüler einer Klasse mit ihrem jeweiligen Saldo auf sowie alle Rechnungen der Klasse.
 * 
 */
function displayClass(){
    const className = currentClass; // ausgewählte Klasse
    const index = studentdata.findIndex(index => index.name == className); // Index der ausgewälten Klass in studentdata
    // listet Schüler auf
    const Klassensalden = document.querySelector("#containerStudents div.Klassensalden");
    Klassensalden.innerHTML = "<h3 class = 'titel'>Schüler</h3><table><thead><tr><th>Name</th><th>Betrag</th></tr></thead><tbody></tbody></table>"; // Überschrift für Schülerauflistung
    const tbody = Klassensalden.querySelector("tbody");
    studentdata[index].data.forEach(student=>{ // iteriert durch alle Schüler der ausgewälten Klasse
        const row = document.createElement("tr"); //erstellt eine Reihe
        // fügt Schülername und Link mit Schüler-Id hinzu
        const pointName = document.createElement("td");
        const link = document.createElement("a");
        link.href = url + "studentAccount/" + student.id;
        const textName = document.createTextNode(student.name);
        link.appendChild(textName);
        pointName.appendChild(link);
        // fügt Schülersaldo hinzu
        const pointPreis = document.createElement("td");
        const textPreis = document.createTextNode(student.saldo +"Fr");
        pointPreis.className = "number";
        pointPreis.appendChild(textPreis);

        // fügt Knopf zur Entfernung des Schülers hinzu
        const pointButton = document.createElement("td");
        const button = document.createElement("button");
        button.className = "buttonDeleteStudent";
        button.value= student.id;
        pointButton.appendChild(button);
        
        // füllt Reihe mit Schülername, Saldo und Knopf
        row.appendChild(pointName);
        row.appendChild(pointPreis);
        row.appendChild(pointButton);
        tbody.appendChild(row);
    })
    // listet Rechnungen auf
    const invoices = document.querySelector("#containerStudents div.everyInvoice");
    invoices.innerHTML = "<h3 class = 'titel'>Rechnungen</h3><table><thead><tr><th>Name</th><th>Betrag</th><th>Datum</th></tr></thead><tbody></tbody></table>"; // Überschrift für Rechnungsauflistung
    const tbodyInvoice = invoices.querySelector("tbody");
    studentdata[index].invoices.forEach(item=>{ // iteriert duch alle Rechnungen der ausgewälten Klasse
        const row = document.createElement("tr"); //erstellt Reihe
        // fügt Rechnungsname hinzu
        const pointName = document.createElement("td");
        const textName = document.createTextNode(item.name);
        pointName.appendChild(textName);
        // fügt Rechnungsbetrag hinzu
        const pointPreis = document.createElement("td");
        const textPreis = document.createTextNode(item.price +"Fr");
        pointPreis.className = "number";
        pointPreis.appendChild(textPreis);
        // fügt Rechnungsdatum hinzu
        const pointDatum = document.createElement("td");
        const textDatum = document.createTextNode(item.date);
        pointDatum.appendChild(textDatum);
        // fügt Knopf zur Entfernung der Rechnung hinzu
        const pointButton = document.createElement("td");
        const button = document.createElement("button");
        button.className = "buttonDeleteInvoice";
        button.value=item.id;
        pointButton.appendChild(button)
        // füllt Reihe mit Name, Betrag, Datum und Knopf
        row.appendChild(pointName);
        row.appendChild(pointPreis);
        row.appendChild(pointDatum);
        row.appendChild(pointButton);
        tbodyInvoice.appendChild(row);
    })
}

/**
 * Erneuert immer wieder die Werte von studentdata, da sich diese durch Hinzufügen/Entfernen von Schülern/Rechnungen ändern können
 * 
 */
async function refresh() {
    try {
        const responseSaldo = await fetch(url + "students/Saldo"); // Serveranfrage

        // Serverantwort überprüfen
        if (!responseSaldo.ok) {
            throw new Error(`${responseSaldo.status}`);
        }

        // studentdata erneuern
        const data = await responseSaldo.json();
        studentdata = data;

        if (data) {
            displayClass(data);
        } else {
            console.warn("No valid data received.");
        }

    } catch (error) {
        //console.error("Error fetching student data:", error);
    }
    // Funktion ruft sich in regelmässigen Intervallen selbst auf, um studentdata zu erneuern
    await sleep(500);
    refresh();
}

// fügt an alle Elemente in startPage.html einen click-Event-Handler an
document.addEventListener("click", async(e) => {
    // handelt es sich beim Element um einen "Klassen-Knopf" für die Schülerauflistung, so wird dieser Knopf blau und die Knöpfe der anderen Klassen schwarz gefärbt
    if (e.target.matches(".class-sidebar-button")) {
        document.querySelectorAll(".class-sidebar-button").forEach(item =>{item.style.color = "black"});
        e.target.style.color = "blue";
        currentClass = e.target.innerText;
        displayClass(currentClass);
    }
    // bei einem Knopf aus der Schülerauflistung wird der entsprechende Schüler mittels Serveranfrage gelöscht
    if(e.target.matches(".buttonDeleteStudent")){
        console.log("hallo");
        const response = await fetch(url + "deleteStudent/" + e.target.value); // Serveranfrage
        console.log(response.text);
    }
    //bei einem Knopf aus der Rechnungsauflistung wird die entsprechende Rechnung mittels Serveranfrage gelöscht
    if (e.target.matches(".buttonDeleteInvoice")){
        console.log(e.target.value+currentClass);
        const response = await fetch(url+ "deleteClassInvoice/" + e.target.value +"/" + currentClass); // Serveranfrage
        console.log(response.text());
        displayClass(currentClass);
    }
});
