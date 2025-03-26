const url= "http://localhost:8080/";

async function LogInHandler(){
    let answer = document.getElementById("answer");

    let ElementInpunt = document.querySelector(".logIn input[type ='text']");
    let ElementPassword = document.querySelector(".logIn input[type ='password']");

    let AccountantName = ElementInpunt.value;
    let AccountantPassword = ElementPassword.value;
    try{
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
