
const url= "http://localhost:8080/";

/**
 * Diese Funktion erstellt einen SHA-256 Hash eines übergebenen Textes (z.B. Passwort).
 * @param {string} message - Der zu hashende Text.
 * @returns {string} Der Hash als Hex-String.
 */
async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message); // Kodiert den String als UTF-8 Byte-Array
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // Erstellt SHA-256 Hash
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Wandelt Hash in ein Array von Bytes um
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0")) // Wandelt jedes Byte in einen Hex-Wert um
    .join(""); // Verbindet alle Hex-Werte zu einem String
  return hashHex; // Gibt den finalen Hex-Hash zurück
}

digestMessage(text).then((digestHex) => console.log(digestHex));

/**
 * Diese Funktion wird aufgerufen, wenn sich ein Nutzer einloggen möchte.
 * Sie liest die Eingaben, hasht das Passwort, und sendet die Login-Daten an den Server.
 */
async function LogInHandler(){
    let answer = document.getElementById("answer"); // Element zur Anzeige von Rückmeldungen
    
    let ElementInpunt = document.querySelector(".logIn input[type ='text']"); // Element für Benutzername-Eingabe
    let ElementPassword = document.querySelector(".logIn input[type ='password']"); // Element für Passwort-Eingabe

    let AccountantName = ElementInpunt.value; // Eingegebener Benutzername
    try{
        let AccountantPassword = await digestMessage(ElementPassword.value); // Hasht das eingegebene Passwort
        let fetchPromise = fetch(url+"logIn/"+ AccountantName +"/"+ AccountantPassword); // Ruft die logIn-Funktion auf dem Server auf
        let response = await fetchPromise;
        let data = await response.text(); // Antwort der logIn-Funktion
        console.log(`Message erhalten: ${data}`);
        if(response.ok){
            if(data == "Login Erfolgreich"){
                window.location.href= "StartPage/startPage.html"; // Wenn die Antwort der logIn-Funktion positiv ist, wird die Startseite geladen
            }else{
                answer.textContent = data; // Ansonsten wird die Antwort der Funktion mit dem answer-Element ausgegeben
            }

        }
    }catch(error){
        console.log("error no message received");
    }
}
