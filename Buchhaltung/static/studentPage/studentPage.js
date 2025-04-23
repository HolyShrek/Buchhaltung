const url = "http://localhost:8080/";
function getUserId(){
    const url= decodeURI(window.location.href);
    const splitUrl = url.split("/");
    return(splitUrl[4]);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function poll1(){
    const id =getUserId();
    getInvoices(id);
    await sleep(1000);
    poll1();
}
async function getInvoices(id){
    const response= await fetch(url + "studentAccount/invoices/"+id);
    const invoice = await response.json();
    displayInvoice(invoice);
}
function displayInvoice(data){
    const tableBody= document.querySelector("#tableStudent tBody");
    tableBody.innerHTML="";
    data.invoice.forEach(item =>{
        const row = document.createElement("tr"); //erstellt Reihe
        //Name hinzufügen
        const pointName = document.createElement("td");
        const textName = document.createTextNode(item.name);
        pointName.appendChild(textName);
        //Preis Hinzufügen
        const pointPreis = document.createElement("td");
        const textPreis = document.createTextNode(item.price + "Fr.");
        pointPreis.className = "number";
        pointPreis.appendChild(textPreis);
        //Datum hinzufügen
        const pointDatum = document.createElement("td");
        const textDatum = document.createTextNode(item.date);
        pointDatum.appendChild(textDatum);
        //button
        const pointButton = document.createElement("td");
        const button = document.createElement("button");
        button.className = "buttonDeleteInvoice";
        button.value=item.id;
        pointButton.appendChild(button)
        //Neue Reihe füllen
        row.appendChild(pointName);
        row.appendChild(pointPreis);
        row.appendChild(pointDatum);
        row.appendChild(pointButton);
        tableBody.appendChild(row);
    })
    const saldo = document.getElementById("saldo");
    saldo.textContent="Total:" + data.saldo +"Fr.";

}
async function newInvoice(){
    const container = document.getElementById("newInvoice");
    const ElementName = document.getElementById("newInvoiceName");
    const ElementPrice = document.getElementById("newInvoicePrice");

    let price = ElementPrice.value;
    const currency = container.querySelector("select").value;
    try {
        // Fetch currency exchange rate
        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_ScSlyGqkvHnE42AkxW2pSQ968he4dMmsEHqQwd2T&currencies=CHF&base_currency=${currency}`);
        const data = await response.json();

        // Calculate price
        let calculations = data.data.CHF * price;
        price = calculations.toFixed(2);

        // Prepare JSON payload
        let postJson = {
            name: ElementName.value,
            price: price,
            studentId: getUserId()
        };

        console.log(postJson);

        // Send data to server
        const postResponse = await fetch(url + "newStudentInvoice", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(postJson)
        });

        // Evaluate server response
        const verdict = await postResponse.text();
        console.log(verdict);

    } catch (error) {
        console.error("Error fetching or posting data:", error);
    } 
    container.style.display = "none";
}
async function deleteInvoice(){
    console.log("x");
    const ElementName = document.getElementById("deleteInvoiceName");
    const ElementResponse = document.getElementById("responseDeleteInvoice");
    const name = ElementName.value;
    if(name ==""){
        return;
    }
    const studentId = getUserId();
    const response = await fetch(url + "deleteStudentInvoice/" +name +"/" + studentId);
    const verdict = await response.text();
    console.log(verdict);
    ElementResponse.textContent = verdict;
    await sleep(500);
    ElementResponse.textContent = "";
}
async function download(){
    
}
document.addEventListener("click", async(e) => {
    if (e.target.matches(".buttonDeleteInvoice")){
        console.log(e.target.value);
        const response = await fetch(url+ "deleteStudentInvoice/" + e.target.value +"/" + getUserId());
        console.log(response.text());
    }
});