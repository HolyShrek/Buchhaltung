const url= "http://localhost:8080/"
let studentdata;

async function poll() {
    const responseSaldo = await fetch(url+"students/Saldo");
    const data = await responseSaldo.json();
    studentdata= data;
    console.log(data);
    displayClassSelector();
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



async function createAccount(){
    const ElementName = document.getElementById("accountantName");
    const ElementPassword = document.getElementById("accountantPassword");
    const Success = document.getElementById("response");
    const NewAccount = document.getElementById("create");
    const ElementSelectionClass = document.getElementById("class-selection");

    //let classes = Array.from(ElementSelectionClass.selectedOptions).map(option => option.value);
    const selected = ElementSelectionClass.querySelectorAll("input:checked");
    const classes = Array.from(selected, el => el.value);
    console.log(classes);
    let postJson = {};
    postJson.class = classes;
    postJson.name = ElementName.value;
    postJson.password = ElementPassword.value;

    const response = await fetch(url + "newAccountant",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(postJson)
    });
    const verdict = await response.text();//evaluate Server Response
    console.log(verdict);
    if(verdict == "update Successfull"){
        ElementName.value = "";
        ElementPassword.value = "";
        NewAccount.textContent = "Neuer Account erstellen";
        Success.textContent = "Accountant erfolgreich erstellt.";

    }

}

function back(){
    window.location.href= "startPage.html";
}
