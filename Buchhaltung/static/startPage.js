const url= "http://localhost:8080/"
let studentdata;

function toggleList(id){
    const dropdown = document.getElementById(id);
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
        if(id == "dropdown-class"){
            displayClassSelector();
        }if(id == "dropdown-student"){
            displayStudentSelector();
        }else if(id == "dropdown-newStudent"){
            displayNewStudentSelector();
        }
    } else {
        dropdown.style.display = "none";
    }
}
function displayNewStudentSelector(){
    const dropdown = document.getElementById("newStudent-selection");
    dropdown.innerHTML="";
    studentdata.forEach(item =>{
        const point =  document.createElement("option");
        const text = document.createTextNode(item.name);
        point.appendChild(text);
        point.value= item.name;
        dropdown.appendChild(point);
    })
}
function displayClassSelector(){
    const dropdown = document.getElementById("class-selection");
    dropdown.innerHTML="";
    studentdata.forEach(item =>{
        const point =  document.createElement("option");
        const text = document.createTextNode(item.name);
        point.appendChild(text);
        point.value= item.name;
        dropdown.appendChild(point);
    })
}
function displayStudentSelector() {
    const selectedClass = document.getElementById("class-selection");
    const dropdown = document.getElementById("student-selection")
    const selectedOptions = Array.from(selectedClass.selectedOptions).map(option => option.value); // chatgpt
    dropdown.innerHTML="";
    if(selectedOptions.length == 0){
        console.log("Keine KLasse ausgewählt");
        return;
    }
    studentdata.forEach(item => {
        if (selectedOptions[0].includes(item.name)) {
            item.data.forEach(student => {
                const point = document.createElement("option");
                const text = document.createTextNode(student.name);
                point.appendChild(text);
                dropdown.appendChild(point);

            });
        }
    });
}
async function sendSammeleintrag() {
    const postJson ={};
    const ElementName = document.getElementById("name");
    const ElementPrice = document.getElementById("price");
    const ElementSelectionClass = document.getElementById("class-selection");
    const ElementSelectionStudent = document.getElementById("student-selection");

    const classes = Array.from(ElementSelectionClass.selectedOptions).map(option => option.value);
    const students = Array.from(ElementSelectionStudent.selectedOptions).map(option => option.value);
    
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
    const ElementSelectionClass = document.getElementById("newStudent-selection");
    const ElementCheckbox = document.getElementById("deleteStudent");
    const name = ElementName.value; 
    const classes = Array.from(ElementSelectionClass.selectedOptions).map(option => option.value);
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
    displayStudents(data);
}
function displayStudents(a){
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
    

}
async function LogOut() {
    const response = await fetch(url+"LogOut");
    const verdict = response.text();
    console.log(verdict);
}