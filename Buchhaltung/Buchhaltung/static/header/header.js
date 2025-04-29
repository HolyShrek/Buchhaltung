await darkMode(false);
async function loadHeader(){
    const res = await fetch("/header/header.html");
    const html = await res.text();
    document.getElementById("headerContainer").innerHTML = html;
}
loadHeader();
async function darkMode(change){
    const res = await fetch(url + "design/-1");
    const json = await res.json();
    let Dark = json.design;
    console.log(Dark);
    if(change){
        console.log((Dark +1) % 2);
        Dark = (Dark +1) % 2;
        const toggleRes = await fetch(url + "design/" + Dark);
    }
    console.log(Dark);
    if (Dark == 0) {
        document.documentElement.style.setProperty('--background', 'rgb(0, 0, 0)');
        document.documentElement.style.setProperty('--text', 'rgb(255, 255, 255)');
        document.documentElement.style.setProperty('--lightGray', 'rgb(54, 55, 82)'); // Overrides the first background setting
        document.getElementById("darkModeToggle").innerText = "LightMode";
        document.querySelectorAll('.sidebar > a > img').forEach(item => {
            item.style.filter = "invert(0)";
        });
    } else {
        document.documentElement.style.setProperty('--background', 'rgb(255, 255, 255)');
        document.documentElement.style.setProperty('--text', 'rgb(0, 0, 0)');
        document.documentElement.style.setProperty('--lightGray', 'rgb(209, 209, 209)'); // Overrides the first background setting
        document.getElementById("darkModeToggle").innerText = "DarkMode";
        document.querySelectorAll('.sidebar > a > img').forEach(item => {
            item.style.filter = "invert(1)";
        });
    }
}