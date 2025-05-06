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
    displayClassSelector("class-selection1"); // ruft displayClassSelector() auf, um die Klassenauswahl anzuzeigen
    displayClassSelector("class-selection2");
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
    const ElementName = document.getElementById("accountantName"); // Namenseingabe-Element
    const ElementPassword = document.getElementById("accountantPassword"); // Passworteingabe-Element
    const ElementSuccess = document.getElementById("response"); // Element zur Ausgabe der Serverantwort
    const NewAccount = document.getElementById("create"); // Button zur Erstellung
    const ElementSelectionClass = document.getElementById("class-selection1"); // Klassenauswahl-Element
    
    const selected = ElementSelectionClass.querySelectorAll("input:checked"); // wählt alle Inputs aus der Klassenauswahl aus, die angekreuzt wurden
    const classes = Array.from(selected, el => el.value); // speichert die Namen der angekreuzten Klassen in einem Array
    console.log(classes);
    let postJson = {}; //Json, in dem die ausgewählten Klassen, der Accountant-Name und das Accountant-Passwort gespeichert werden
    postJson.class = classes;
    postJson.name = ElementName.value;
    // vergleicht das eingegebene Passwort mit dem "Password bestätigen"-Passwort
    if(ElementPassword.value != wrapper.querySelector("input[placeholder='Passwort bestätigen']").value){
        Success.textContent="Falsches Passwort";
        return;
    }
    postJson.password = await digestMessage(ElementPassword.value); // hasht das Passwort

    // Server-Anfrage, übergibt den Json mit der POST-Methode
    const response = await fetch(url + "newAccountant",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(postJson)
    });
    const verdict = await response.text(); // Server-Antwort
    // bei positiver Server-Antwort werden die Eingabefelder zurückgesetzt 
    if(verdict == "update Successfull"){
        ElementName.value = "";
        ElementPassword.value = "";
        wrapper.querySelector("input[placeholder='PasswortBestätigen']").value= "";
        NewAccount.textContent = "Neuer Account erstellen";
    }
    ElementSuccess.textContent = verdict; // gibt die Server-Antwort aus
}

/**
 * ändert das Passwort des Nutzers
 * ruft die changePassword-Funktion auf, um das Passwort in der Datenbank zu ändern
 */
async function newPassword(){
    const ElementPassword = document.getElementById("newPassword"); // Passworteingabe-Element
    const ElementSucess = document.getElementById("response2"); // Element zur Ausgabe der Serverantwort
 
    const password = await digestMessage(ElementPassword.value); // hasht das eingegebene Passwort
    const data = {value: password};
    // Server-Anfrage, übergibt Passwort mit der POST-methode
    const response = await fetch(url + "changePassword",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(data)
    });
    const verdict = await response.text(); //Server-Antwort
    ElementPassword.value = "";
    ElementSucess.textContent = verdict; // gibt Server-Antwort aus
}

/**
 * erstellt eine neue Klasse
 * liest Klassennamen ein und ruft die newClass-Funktion auf, um die Klasse in die Datenbank einzufügen
 */
async function createClass(){
    const ElementName = document.getElementById("className"); // Element zur Klassennamen-Eingabe
    const ElementSucess = document.getElementById("response3"); // Element zur Ausgabe der Serverantwort
    const name = ElementName.value;
    const response = await fetch(url + "newClass/" + name); // Server-Anfrage mit dem Klassennamen
    const verdict = await response.text(); // Server-Antwort
    ElementName.value = "";
    ElementSucess.textContent = verdict; // gibt Server-Antwort aus
}

/**
 * erteilt einem Accountant Berechtigungen auf ausgewählte Klassen
 * liest die ausgewählten Klassen und den zu berechtigenden Accountant ein
 */
async function grantAccess(){
    const ElementName = document.getElementById("accountantName2"); // Nameneingabe-Element
    const ElementSucess = document.getElementById("response4"); // Element zur Ausgabe der Serverantwort
    const ElementSelectionClass = document.getElementById("class-selection2"); // Klassenauswahl-Element
 
    const selected = ElementSelectionClass.querySelectorAll("input:checked"); // wählt alle Inputs aus der Klassenauswahl aus, die angekreuzt wurden
    const classes = Array.from(selected, el => el.value); // speichert die Namen der angekreuzten Klassen in einem Array
    const name = ElementName.value;
    const data = {}; // Json, in dem die ausgewälten Klassen und der Accountant-Name gespeichert wird
    data.class = classes;
    data.name = name;
    // Server-Anfrage, übergibt Klassennamen und Accountantname
    const response = await fetch(url + "grantAccess",{
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(data)
    });
    const verdict = await response.text(); // Server-Antwort
    ElementName.value = "";
    ElementSucess.textContent = verdict; // gibt Server-Antwort aus
}
