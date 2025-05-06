const url= "http://localhost:8080/"
let studentdata;

/**
 * erstellt einen SHA-256 Hash eines übergebenen Textes (z.B. Passwort).
 * @param {string} message - der zu hashende Text.
 * @returns {string} hashHex - der Hash als Hex-String.
 */
async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // kodiert den String als UTF-8 Byte-Array
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // erstellt SHA-256 Hash
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // wandelt Hash in ein Array von Bytes um
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0")) // wandelt jedes Byte in einen Hex-Wert um
      .join(""); // verbindet alle Hex-Werte zu einem String
  return hashHex; // gibt den finalen Hex-Hash zurück
}

/**
 * speichert die Schüler und Klassen in studentdata und ruft displayClassSelector() auf
 * ruft die Saldo-Funktion auf, die alle Schüler und Klassen zurückgibt, wofür der Benutzer die Berechtigung hat
 */
async function poll() {
    heartbeat();
    const responseSaldo = await fetch(url+"students/Saldo"); // Server-Anfrage
    const data = await responseSaldo.json(); // speichert erhaltene Schüler und Klassen
    studentdata= data;
    console.log(data);
    displayClassSelector("class-selection1");
    displayClassSelector("class-selection2"); // ruft displayClassSelector() auf, um die Klassenauswahl anzuzeigen
}

/**
 * erstellt die Klassenauswahl
 * erzeugt eine Liste und füllt sie mit den Klassen aus
 * @param {string} id - id der Klassenauswahl
 */
function displayClassSelector(id){
    const details = document.getElementById(id); // Element für die Klassenauswahl
    const ul = details.querySelector("ul"); // Listen-Element
    ul.innerHTML ="";
    studentdata.forEach(item =>{ // iteriert durch alle Klassen
        //erzeugt einen Listenpunkt, ein Label und ein Inputelement
        const li = document.createElement("li");
        const label = document.createElement("label");
        const input = document.createElement("input");
        // hängt dem Listenpunkt das Label mit Klassennamen und den Input als Checkbox an
        label.innerText = item.name;
        input.value = item.name;
        input.type = "checkbox";
        label.prepend(input);
        li.appendChild(label);
        ul.appendChild(li); // fügt dem Listenelement den Listenpunkt zu
    });
}

/**
 * erstellt einen neuen Accountant-Account
 * ruft die newAccountant-Funktion auf, die die Daten in die Datenbank einfügt
 */
async function createAccount(){
    const wrapper = document.querySelector(".wrapper");
    const ElementName = document.getElementById("accountantName");
    const ElementPassword = document.getElementById("accountantPassword");
    const Success = document.getElementById("response");
    const NewAccount = document.getElementById("create");
    const ElementSelectionClass = document.getElementById("class-selection");
    
    const selected = ElementSelectionClass.querySelectorAll("input:checked"); // wählt alle Inputs aus der Klassenauswahl aus, die angekreuzt wurden
    const classes = Array.from(selected, el => el.value); // speichert die Namen der angekreuzten Klassen in einem Array
    console.log(classes);
    let postJson = {};
    postJson.class = classes;
    postJson.name = ElementName.value;
    
    if(ElementPassword.value != wrapper.querySelector("input[placeholder='Passwort bestätigen']").value){
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
async function newPassword(){
    const ElementPassword = document.getElementById("newPassword");
    const ElementSucess = document.getElementById("response2");
 
    const password = await digestMessage(ElementPassword.value);
    console.log(password);
    const data = {value: password};
    const response = await fetch(url + "changePassword",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(data)
    });
    const verdict = await response.text();
    ElementPassword.value = "";
    ElementSucess.textContent = verdict;
}
async function createClass(){
    const ElementName = document.getElementById("className");
    const ElementSucess = document.getElementById("response3");
    const name = ElementName.value;
    const response = await fetch(url + "newClass/" + name);
    const verdict = await response.text();
    ElementName.value = "";
    ElementSucess.textContent = verdict;
}
 
async function grantAccess(){
    const ElementName = document.getElementById("accountantName2");
    const ElementSucess = document.getElementById("response4");
    const ElementSelectionClass = document.getElementById("class-selection2");
 
    const selected = ElementSelectionClass.querySelectorAll("input:checked");
    const classes = Array.from(selected, el => el.value);
    const name = ElementName.value;
    const data = {};
    data.class = classes;
    data.name = name;
 
    const response = await fetch(url + "grantAccess",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(data)
    });
    const verdict = await response.text();
    ElementName.value = "";
    ElementSucess.textContent = verdict;
}
