
async function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function heartbeat(){
    const res = await fetch(url + "heartbeat");
    const verdict = await res.text();
    await sleep(1000);
    heartbeat();
}
heartbeat();
console.log("test");
