const url= "http://localhost:8080/" // asis-URL für die Serveranfragen
let studentdata; // speichert die Schüler- und Klassendaten aus einer Serveranfrage

/**
 * erstellt einen SHA-256 Hash eines übergebenen Textes (z.B. Passwort).
 * @param {string} message - der zu hashende Text.
 * @returns {string} der Hash als Hex-String.
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
    const responseSaldo = await fetch(url+"students/Saldo"); // Server-Anfrage
    const data = await responseSaldo.json(); // speichert erhaltene Schüler und Klassen
    studentdata= data;
    console.log(data);
    displayClassSelector(); // ruft displayClassSelector() auf, um die Klassenauswahl anzuzeigen
}

/**
 * erstellt die Klassenauswahl
 * erzeugt eine Liste und füllt sie mit den Klassen aus
 */
function displayClassSelector(){
    const details = document.getElementById("class-selection"); // Element für die Klassenauswahl
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
 * liest ausgewählte Klassen, Accountant-Name und Passwort ein und erstellt damit einen neuen Accountant-Account
 * 
 */
async function createAccount(){ 
    //Hole alle nötigen Element für Funktion
    const wrapper = document.querySelector(".wrapper"); // grosses Element, welches alles umfasst
    const ElementName = document.getElementById("accountantName");
    const ElementPassword = document.getElementById("accountantPassword");
    const Success = document.getElementById("response");
    const NewAccount = document.getElementById("create");
    const ElementSelectionClass = document.getElementById("class-selection");

    const selected = ElementSelectionClass.querySelectorAll("input:checked"); // hol alle Klassen auf welche der neue Accountant Zugriff hat
    const classes = Array.from(selected, el => el.value); // schreibe Alle Werte in ein Array
    console.log(classes);
    let postJson = {}; //Rückgabe
    postJson.class = classes;
    postJson.name = ElementName.value;
    if(ElementPassword.value != wrapper.querySelector("input[placeholder='PasswortBestätigen']").value){//schaue ob die beiden neuen Passwörter gleich sind
        Success.textContent="Falsches Passwort";
        return;
    }
    postJson.password = await digestMessage(ElementPassword.value); //sha251 Passwort wird gehashed

    const response = await fetch(url + "newAccountant",{ //sendet daten an Server
        method: "POST",
            headers:{
                 "Content-Type": "application/json"
            },
        body: JSON.stringify(postJson)
    });
    const verdict = await response.text();//evaluate Server Response
    console.log(verdict);
    if(verdict == "update Successfull"){ //wenn das Urteil positiv ist, setze alle Werte zurück auf leer
        ElementName.value = "";
        ElementPassword.value = "";
        wrapper.querySelector("input[placeholder='PasswortBestätigen']").value= "";
        NewAccount.textContent = "Neuer Account erstellen";
        Success.textContent = "Accountant erfolgreich erstellt.";

    }
}
