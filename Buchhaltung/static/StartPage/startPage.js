const url= "http://localhost:8080/"
let studentdata; 
let currentClass;

// Schülerauswahl wird beim Ausklappen neu geladen
const d = document.getElementById("student-selection");
d.addEventListener("toggle", (e) =>{
    displayStudentSelector();
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * erstellt eine Klassenauswahl, um die Klasse eines neuen Schülers auszuwählen
 * erzeugt eine Liste und füllt sie mit den Klassennamen und dazugehörenden Checkboxen
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
 * erstellt die Klassenauswahl für einen Sammeleintrag
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
 * erstellt die Schülerauswahl für einen Sammeleintrag
 * erstellt eine Liste und füllt sie mit den Schülern der ausgewählten Klassen sowie dazugehörenden Checkboxen
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
 * sendet den Sammeleintrag an den Server
 * erstellt ein JSON mit allen benötigten Daten und macht damit eine Server-Anfrage
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
 * sendet die Daten eines neu erstellten Schülers an den Server
 * erstellt ein JSON mit allen benötigten Daten und macht damit eine Server-Anfrage
 */
async function sendNewStudent(){
    //get params
    const ElementName = document.getElementById("newStudentName");
    const details = document.getElementById("newStudent-selection");
    const container = document.getElementById("newStudent");
    container.style.display="none";
    //const ElementCheckbox = document.getElementById("deleteStudent");
    const listInput = details.querySelectorAll("input:checked");
    const name = ElementName.value; 
    const classes = Array.from(listInput, el=> el.value);
    //send params
    const response = await fetch(url + "newStudent/" + name + "/" + classes[0]);
    console.log(response);
}
async function init() {
    const responseSaldo = await fetch(url+"students/Saldo");
    const data = await responseSaldo.json();
    studentdata= data;
    displayClassSelector();
    displayNewStudentSelector();
    displayStudents(data);
    refresh();
}
function displayStudents(a){
    a.forEach(classes=>{
        const list = document.querySelector("div.class-sidebar ul");
        //button
        const button= document.createElement("button");
        button.className="class-sidebar-button"
        button.innerText=classes.name;
        //listenpunkt
        const li = document.createElement("li");
        //anhängen
        li.appendChild(button);
        list.appendChild(li);
    });
}
async function calculateCurrency(){
    const container = document.getElementById("currencyCalculater");
    container.style.display="none";
    const ElementBetrag = document.querySelector("#currencyCalculater input");
    const ElementAnswer = document.getElementById("EuroSwiss");
    const Betrag = ElementBetrag.value;
    fetch('https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ScSlyGqkvHnE42AkxW2pSQ968he4dMmsEHqQwd2T&currencies=EUR&base_currency=CHF')
    .then(response => response.json())
    .then(data => {
        const calculations = data.data.EUR * Betrag;
        const round = calculations.toFixed(2);
        ElementAnswer.textContent = round+ " EURO";
    })
    .catch(error => console.error("Error fetching data:", error));
}
function displayClass(){
    //get current class
    const className = currentClass;
    const index = studentdata.findIndex(index => index.name == className);
    //display students
    const Klassensalden = document.querySelector("#containerStudents div.Klassensalden");
    Klassensalden.innerHTML = "<h3 class = 'titel'>Schüler</h3><table><thead><tr><th>Name</th><th>Betrag</th></tr></thead><tbody></tbody></table>";
    const tbody = Klassensalden.querySelector("tbody");
    studentdata[index].data.forEach(student=>{
        const row = document.createElement("tr"); //erstellt Reihe
        //Name hinzufügen
        const pointName = document.createElement("td");
        const link = document.createElement("a");
        link.href = url + "studentAccount/" + student.id;
        const textName = document.createTextNode(student.name);
        link.appendChild(textName);
        pointName.appendChild(link);
        //Preis Hinzufügen
        const pointPreis = document.createElement("td");
        const textPreis = document.createTextNode(student.saldo +"Fr");
        pointPreis.className = "number";
        pointPreis.appendChild(textPreis);

        //button
        const pointButton = document.createElement("td");
        const button = document.createElement("button");
        button.className = "buttonDeleteStudent";
        button.value= student.id;
        pointButton.appendChild(button);
        //Neue Reihe füllen

        row.appendChild(pointName);
        row.appendChild(pointPreis);
        row.appendChild(pointButton);
        tbody.appendChild(row);
    })
    //display invoices
    const invoices = document.querySelector("#containerStudents div.everyInvoice");
    invoices.innerHTML = "<h3 class = 'titel'>Rechnungen</h3><table><thead><tr><th>Name</th><th>Betrag</th><th>Datum</th></tr></thead><tbody></tbody></table>";
    const tbodyInvoice = invoices.querySelector("tbody");
    studentdata[index].invoices.forEach(item=>{
        const row = document.createElement("tr"); //erstellt Reihe
        //Name hinzufügen
        const pointName = document.createElement("td");
        const textName = document.createTextNode(item.name);
        pointName.appendChild(textName);
        //Preis Hinzufügen
        const pointPreis = document.createElement("td");
        const textPreis = document.createTextNode(item.price +"Fr");
        pointPreis.className = "number";
        pointPreis.appendChild(textPreis);
        //Datum Hinzufügen
        const pointDatum = document.createElement("td");
        const textDatum = document.createTextNode(item.date);
        pointDatum.appendChild(textDatum);
        //button
        const pointButton = document.createElement("td");
        const button = document.createElement("button");
        button.className = "buttonDeleteInvoice";
        button.value=item.id;
        pointButton.appendChild(button)
        //Neue Reihe füllen
        row.appendChild(pointName);
        row.appendChild(pointPreis);
        row.appendChild(pointDatum);
        row.appendChild(pointButton);
        tbodyInvoice.appendChild(row);
    })
}
async function refresh() {
    try {
        const responseSaldo = await fetch(url + "students/Saldo");

        if (!responseSaldo.ok) {
            throw new Error(`${responseSaldo.status}`);
        }

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

    await sleep(500);  // Ensure sleep is properly implemented
    refresh();  // Recursively call itself
}
document.addEventListener("click", async(e) => {
    //document.querySelectorAll(".class-sidebar-button").forEach(item =>{item.style.color = "black"; item.parentElement.style.listStyle="none"});
    if (e.target.matches(".class-sidebar-button")) {
        document.querySelectorAll(".class-sidebar-button").forEach(item =>{item.style.color = "black"});
        e.target.style.color = "blue";
        currentClass = e.target.innerText;
        displayClass(currentClass);
    }
    if(e.target.matches(".buttonDeleteStudent")){
        console.log("hallo");
        const response = await fetch(url + "deleteStudent/" + e.target.value);
        console.log(response.text);
    }
    if (e.target.matches(".buttonDeleteInvoice")){
        console.log(e.target.value+currentClass);
        const response = await fetch(url+ "deleteClassInvoice/" + e.target.value +"/" + currentClass);
        console.log(response.text());
        displayClass(currentClass);
    }
});
