let Dark = false;

async function loadHeader(){
    const res = await fetch("/header/header.html");
    const html = await res.text();
    document.getElementById("headerContainer").innerHTML = html;
}
loadHeader();
function darkMode(){
    console.log(Dark);
    Dark = !Dark;
    if (Dark) {
        document.documentElement.style.setProperty('--background', 'rgb(0, 0, 0)');
        document.documentElement.style.setProperty('--text', 'rgb(255, 255, 255)');
        document.documentElement.style.setProperty('--lightGray', 'rgb(54, 55, 82)'); // Overrides the first background setting
        document.getElementById("darkModeToggle").innerText = "LightMode";
    } else {
        document.documentElement.style.setProperty('--background', 'rgb(255, 255, 255)');
        document.documentElement.style.setProperty('--text', 'rgb(0, 0, 0)');
        document.documentElement.style.setProperty('--lightGray', 'rgb(209, 209, 209)'); // Overrides the first background setting
        document.getElementById("darkModeToggle").innerText = "DarkMode";
    }
}