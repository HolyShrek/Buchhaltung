async function loadSidebar(){
    const res = await fetch("/sidebar/sidebar.html");
    const html = await res.text();
    document.getElementById("sidebarContainer").innerHTML = html;
}
loadSidebar();