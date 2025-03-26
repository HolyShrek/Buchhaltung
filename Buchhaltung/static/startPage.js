const url= "http://localhost:8080/"
let studentdata;


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
    const ElementSelectionClass = document.getElementById("class-selection");

    const details = document.querySelector("details");
    const listInputs = details.querySelectorAll("input:checked");

    const classes = Array.from(ElementSelectionClass.selectedOptions).map(option => option.value);
    const students = Array.from(listInputs, el=> el.value);
    
    postJson.name = ElementName.value;
    postJson.price = ElementPrice.value;
    postJson.class = classes[0];
    postJson.student = students;
    console.log(postJson);
    //send to server
    const response = await fetch(url + "Sammeleintrag",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(postJson)
    });
    const verdict = await response.text();//evaluate Server Response
    console.log(verdict);
}
async function sendNewStudent(){
    //get params
    const ElementName = document.getElementById("newStudentName");
    const details = document.getElementById("newStudent-selection");
    const ElementCheckbox = document.getElementById("deleteStudent");
    const listInput = details.querySelectorAll("input:checked");
    const name = ElementName.value; 
    const classes = Array.from(listInput, el=> el.value);
    //send params
    if(ElementCheckbox.checked){
        const response = await fetch(url + "deleteStudent/" + name);
        console.log(response);
    }else{
        const response = await fetch(url + "newStudent/" + name + "/" + classes[0]);
        console.log(response);
    }
}
async function poll() {
    //const responseStudent = await fetch(url + "students");
    const responseSaldo = await fetch(url+"students/Saldo");
    const data = await responseSaldo.json();
    studentdata= data;
    console.log(data);
    displayClassSelector();
    displayStudentSelector();
    displayNewStudentSelector();
    displayStudents(data);
}
function displayStudents(a){
    /*old Display
    a.forEach(i =>{//Erstellen von Neuem Container
        let KlassenSaldo = 0;
        const container = document.createElement("div");
        container.id  ="container"+i.name;
        container.className = "Klassensalden";
        container.innerHTML="<h3 class = 'titel'></h3><table><thead><tr><th>Name</th><th>Betrag</th></tr></thead><tbody></tbody></table>";
        //Titel
        const titel = container.querySelector("h3");
        titel.textContent=i.name;
        //Anhängen von Containter an grossen Container
        const containerStudents = document.getElementById("containerStudents");
        containerStudents.appendChild(container);
        const tableBody= container.querySelector("tBody");
        tableBody.innerHTML="";
        i.data.forEach(item =>{
            KlassenSaldo+=item.saldo;
            const row = document.createElement("tr"); //erstellt Reihe
            //Name hinzufügen
            const pointName = document.createElement("td");
            const link = document.createElement("a");
            link.href = url + "studentAccount/" + item.id;
            const textName = document.createTextNode(item.name);
            link.appendChild(textName);
            pointName.appendChild(link);
            //Preis Hinzufügen
            const pointPreis = document.createElement("td");
            const textPreis = document.createTextNode(item.saldo +"Fr");
            pointPreis.className = "number";
            pointPreis.appendChild(textPreis);
            //Neue Reihe füllen

            row.appendChild(pointName);
            row.appendChild(pointPreis);
            tableBody.appendChild(row);
        })
        const pointKlassenSaldo =  document.createElement("p");
        const testSaldo = document.createTextNode("Klassensaldo: " +KlassenSaldo +"Fr.");
        pointKlassenSaldo.appendChild(testSaldo);
        container.appendChild(pointKlassenSaldo);
    })
    */
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
document.addEventListener("click", (e) => {
    if (e.target.matches(".class-sidebar-button")) {
        //get current class
        const className = e.target.innerText;
        const index = studentdata.findIndex(index => index.name == className);
        console.log(studentdata);
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
            //Neue Reihe füllen

            row.appendChild(pointName);
            row.appendChild(pointPreis);
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
            const textDatum = document.createTextNode(item.date +"Fr");
            pointDatum.appendChild(textDatum);
            //Neue Reihe füllen
            row.appendChild(pointName);
            row.appendChild(pointPreis);
            row.appendChild(pointDatum);
            tbodyInvoice.appendChild(row);
        })

    }
});