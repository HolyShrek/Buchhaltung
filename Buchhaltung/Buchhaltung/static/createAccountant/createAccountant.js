const url= "http://localhost:8080/"
let studentdata;

async function digestMessage(message) {//hasch für Passwort
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
    return hashHex;
  }

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
    const wrapper = document.querySelector(".wrapper");
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
    if(ElementPassword.value != wrapper.querySelector("input[placeholder='PasswortBestätigen']").value){
        Success.textContent="Falsches Passwort";
        return;
    }
    postJson.password = await digestMessage(ElementPassword.value);

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
        wrapper.querySelector("input[placeholder='PasswortBestätigen']").value= "";
        NewAccount.textContent = "Neuer Account erstellen";
        Success.textContent = "Accountant erfolgreich erstellt.";

    }
}