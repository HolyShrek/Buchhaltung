function ToggleInput(pressedId){
    const selectedInput  = document.getElementById(pressedId);
    if(selectedInput.style.display == "block"){
        document.querySelectorAll(".input").forEach(item => {item.style.display = "none"});
        return;
    }
    document.querySelectorAll(".input").forEach(item => {item.style.display = "none"});
    selectedInput.style.display = "block";
}