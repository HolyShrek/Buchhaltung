const url= "http://localhost:8080/"
let studentdata;
let currentClass;


const d = document.getElementById("student-selection");
d.addEventListener("toggle", (e) =>{
    displayStudentSelector();
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function displayNewStudentSelector(){
    const details = document.getElementById("newStudent-selection");
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
function displayStudentSelector() {
    const selectedClass = document.getElementById("class-selection");
    const selectedOptions = selectedClass.querySelectorAll("input:checked");
    const count =Array.from(selectedOptions, el => el.value);
    if(count.length == 0){
        console.log("Keine KLasse ausgewählt");
        return;
    }
    const details = document.getElementById("student-selection");
    const ul = details.querySelector("ul");
    ul.innerHTML ="";
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
async function sendSammeleintrag() {
    const postJson ={};
    const ElementName = document.getElementById("name");
    const ElementPrice = document.getElementById("price");
    let price = ElementPrice.value;
    const container = document.getElementById("Sammeleintrag");
    container.style.display= "none";


    const details = document.getElementById("student-selection");
    const listInputs = details.querySelectorAll("input:checked");
    const students = Array.from(listInputs, el=> el.value);
    
    const currency = container.querySelector("select").value;
    try {
        // Fetch currency exchange rate
        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ScSlyGqkvHnE42AkxW2pSQ968he4dMmsEHqQwd2T&currencies=CHF&base_currency=${currency}`);
        const data = await response.json();

        // Calculate price
        let calculations = data.data.CHF * price;
        price = calculations.toFixed(2);

        // Prepare JSON payload
        let postJson = {
            name: ElementName.value,
            price: price,
            student: students
        };

        console.log(postJson);

        // Send data to server
        const postResponse = await fetch(url + "Sammeleintrag", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(postJson)
        });

        // Evaluate server response
        const verdict = await postResponse.text();
        console.log(verdict);

    } catch (error) {
        console.error("Error fetching or posting data:", error);
    }
}
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
async function LogOut() {
    const response = await fetch(url+"LogOut");
    const verdict = response.text();
    console.log(verdict);
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