/**
* Diese Funktion wird immer dann aufgerufen, wenn ein Inputfeld geöffnet wird
* @params {id} -Id, des Elements welches geöffnet werden soll
* 
*/
function ToggleInput(pressedId){
    const selectedInput  = document.getElementById(pressedId); //hol das zu öffnende Element
    if(selectedInput.style.display == "block"){ //wenn Das Element breits geöffnet ist
        document.querySelectorAll(".input").forEach(item => {item.style.display = "none"}); // schliesse alle Input Felder
        return;
    }
    document.querySelectorAll(".input").forEach(item => {item.style.display = "none"}); //scliesse alle Input Felder
    selectedInput.style.display = "block"; //öffne das eine Input Feld
}
