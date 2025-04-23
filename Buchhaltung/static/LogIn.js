
const url= "http://localhost:8080/";
const saltRounds = 10;


async function digestMessage(message) {//hasch für Passwort
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

digestMessage(text).then((digestHex) => console.log(digestHex));

async function LogInHandler(){
    let answer = document.getElementById("answer");

    let ElementInpunt = document.querySelector(".logIn input[type ='text']");
    let ElementPassword = document.querySelector(".logIn input[type ='password']");

    let AccountantName = ElementInpunt.value;
    try{
        let AccountantPassword = await digestMessage(ElementPassword.value);
        let fetchPromise = fetch(url+"logIn/"+ AccountantName +"/"+ AccountantPassword);
        let response = await fetchPromise;
        let data = await response.text();
        console.log(`Message erhalten: ${data}`);
        if(response.ok){
            if(data == "Login Erfolgreich"){
                window.location.href= "startPage.html";
            }else{
                answer.textContent = data;
            }

        }
    }catch(error){
        console.log("error no message received");
    }
}
