// Importieren notwendiger Module
import express from 'express';               // Express: Webserver-Framework
import mariadb from 'mariadb';               // MariaDB: MySQL-kompatibler Datenbank-Client
import puppeteer from 'puppeteer';           // Puppeteer: für automatisiertes Browsen (z. B. PDFs generieren)
import { fileURLToPath } from 'url';         // Für Pfadverarbeitung
import { dirname } from 'path';              // Zum Ermitteln des aktuellen Verzeichnisses
import cookieParser from 'cookie-parser';    // Middleware zum Verarbeiten von Cookies
import { access } from 'fs';                 // Zum Prüfen von Datei-Zugriffsrechten

// __filename und __dirname erzeugen (da diese in ES-Modulen nicht nativ verfügbar sind)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express-App initialisieren
const app = express();
const port = 8080; // Port, auf dem der Server läuft

// Verbindungspool zur MariaDB-Datenbank aufbauen
const pool = mariadb.createPool({
  host: "127.0.0.1",       // Hostname des Datenbankservers
  port: 3306,              // Standardport für MySQL/MariaDB
  user: "root",            // Benutzername
  password: "85hsevbe-B",  // Passwort
  database: "mydb",        // Name der Datenbank
  supportBigNumbers: true  // Unterstützt große Zahlen
});

// Liste der aktuell angemeldeten Benutzer (Sessions)
let userlist = [];

// Middleware einbinden
app.use(express.static('static'));       // Statische Dateien aus dem Ordner „static“ bereitstellen
app.use(cookieParser());                 // Cookies analysieren
app.use(express.json());                 // JSON-Daten im Body von Requests einlesen

// Starte die Überwachung von aktiven Benutzern
checkHeartbeat();

/**
 * Wartet eine bestimmte Zeitspanne asynchron (Pausenfunktion).
 * @param {number} ms - Dauer in Millisekunden, wie lange gewartet werden soll.
 * @returns {Promise<void>} Ein Promise, das sich nach der angegebenen Zeit auflöst.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Ermittelt die Benutzer-ID anhand eines Cookies.
 * @param {string} cookie - Die Benutzer-ID aus dem Cookie.
 * @returns {string} Die zugehörige accountantId oder "unknownUser", wenn nicht gefunden.
 */
function getUserByCookie(cookie){
    const user = userlist.find(item => item.id == cookie); // shaut ob cookie in der Session Liste gefunden werden kann
    if (user) {
        return user.accountantId;
    }
    return "unknownUser";
}
/**
 * Prüft, ob ein Benutzer Zugriff auf einen bestimmten Schüler hat.
 * @param {number|string} id - Die ID des Schülers.
 * @param {string} userName - Die ID des Benutzers (Accountant).
 * @returns {Promise<boolean>} True, wenn der Benutzer Zugriff auf den Schüler hat.
 */
async function testStudent(id, userName){
    try{
        const classes = await pool.query("select class_name as class from accountant_has_class where accountant_idAccountant = ?", userName); //Liste von allen Klassen auf die der Accountant Zugriff hat
        for(const item of classes){//looped über jede Klasse und schaut ob der Schüler dort drin ist
            const students = await pool.query("select idStudent from student where class_name = ?", item.class);
            const inList = students.find(item => item.idStudent  == id);
            if(inList){
                return true;
            }
        }
        return false;//wenn er in keiner Klasse ist
    }catch{
        return false //falls irgendwas schief geht zur sicherheit immer ZUgriff verwehren
    }
}
/**
 * Prüft, ob ein Benutzer Zugriff auf eine bestimmte Klasse hat.
 * @param {string} name - Name der Klasse.
 * @param {string} userName - Die ID des Benutzers (Accountant).
 * @returns {Promise<boolean>} True, wenn der Benutzer Zugriff auf die Klasse hat.
 */
async function testClass(name, userName){
    try{
        const classes = await pool.query("select class_name as class from accountant_has_class where accountant_idAccountant = ?", userName); // checkt ob es eine Verbindung zwischen Accountant und Klasse gibt
        const inList = classes.find(item => item.class == name); // ist gesuchte Klasse in der KLasse
        if(inList){
            return true;
        }
        return false;
    }catch{
        return false; //Falls etwas schief geht dann immer nein sagen
    }
}
/**
 * Holt die ID eines Schülers anhand des Namens.
 * @param {string} studentName - Der Name des Schülers.
 * @returns {Promise<number>} Die ID des Schülers oder -1, wenn nicht gefunden.
 */
async function getStudentId(studentName) {
    const id = await pool.query("SELECT IdStudent FROM student WHERE name = ?", studentName);
    if(id.length ==0){ //schaut das es auch wirklich eine Id gibt
        return(-1);
    }
    return(id[0].IdStudent);
}
/**
 * Ermittelt oder erzeugt eine eindeutige Benutzer-ID aus Cookies.
 * @param {object} req - Das Request-Objekt von Express.
 * @param {object} res - Das Response-Objekt von Express.
 * @returns {string} Die Benutzer-ID (UUID).
 */
function getUserId(req, res) {
    let userid = req.cookies.userid
    
    if (userid == undefined) { //wenn der User noch nicht registriert ist bekommt er einen sicheren Cookie
        userid = crypto.randomUUID();
        res.cookie('userid', userid);
    }
    return userid
}
/**
 * Holt Namen und aktuellen Saldo (Summe aller Rechnungen) der übergebenen Schüler.
 * @param {Array<{idStudent: number}>} students - Liste von Schülerobjekten mit ID.
 * @returns {Promise<Array<{name: string, id: number, saldo: number}>>} Liste von Objekten mit Namen, ID und Saldo.
 */
async function getStudentNamesSaldo(students) {
    try{
        let NameSaldo = []; // Array, welcher Alle Werte speichert
        for(const item of students){
            const nameArray = await pool.query("select name from student where idStudent = ?", item.idStudent); //schüler der Klasse
            //Saldo --> summe aller Rechnungen jeden Schülers
            const SaldoArray = await pool.query("select sum(price) as saldo from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", item.idStudent);
            //Neuen Schüler zur Liste hinzufügen
            NameSaldo.push(
            {
                name: nameArray[0]?.name,
                id: item.idStudent,
                saldo: SaldoArray[0]?.saldo
            });
        }
        return(NameSaldo);
    } catch(err){
        throw err;
    }
}
/**
 * Holt alle eindeutigen Rechnungen für eine Liste von Schülern.
 * @param {Array<{idStudent: number}>} students - Liste von Schülerobjekten mit ID.
 * @returns {Promise<Array<{name: string, price: number, date: string, id: number}>>} Liste aller eindeutigen Rechnungen.
 */
async function getEveryInvoice(students) {
    let returnArray = [];
    try{
        for(const item of students){ // geht über jeden Schüler
            //holt sich alle Rechnungen eines Schülers
            const invoices = await pool.query("select name, price, date_format(date, '%d-%m-%Y') as date, idInvoice from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", item.idStudent);
            invoices.forEach(item => { //geht über jede Rechnung einmal durch
                const index = returnArray.findIndex(index => index.id == item.idInvoice); //schaut ob es die Rechnung schon gibt in der Liste
                if(index == -1){ //wenn der index == -1 ist dann gibt es diese REchnung noch nicht in der Liste
                    returnArray.push({ //Objekt wird an returnArray angehangen
                        name:item.name,
                        price:item.price,
                        date:item.date,
                        id: item.idInvoice
                    })
                }
            });
        }
        return returnArray;
    } catch (err){//Error Handling
        throw err;
    }
}
/**
 * Überwacht kontinuierlich aktive Benutzer und entfernt inaktive nach 10 Sekunden.
 * Diese Funktion ruft sich selbst rekursiv alle 1000 ms auf.
 */
async function checkHeartbeat(){
    const now = Date.now();//bekommt jetztige Zeit
    for(let i = 0; i<userlist.length; i++){//geht durch jeden Nutzer einmal durch
        if(now-userlist[i].time >= 10000){ //wenn die Zeit als sich der Nutzer zu letzt angemeldet hat und die jetztige Zeit zu stark von einander abweichen wird der Nutzer abgemeldet
            console.log("userDisconected" + userlist[i].accountantId);//Client kann mehrere Heardbeats verpassen
            userlist.splice(i, 1);//User wird aus aktiven Usern gestrichen
        }
    }
    console.log(userlist.length);//jetztige Anzahl an Nutzern
    await sleep(1000);//in einer Sekunde nochmals checken
    checkHeartbeat(); //checken
}
/**
 * Meldet einen Benutzer an, indem er zur userlist hinzugefügt wird.
 * @route GET /logIn/:accountantId
 * @param {string} req.params.accountantId - Die ID des Buchhalters (Accountant), der sich anmelden möchte.
 * @returns {200} Bestätigung, dass der Benutzer eingeloggt ist.
 */
app.get('/logIn/:AccountantName/:AccountantPassword',async (req, res) => {
    try {
        let Name = req.params.AccountantName; //Parameter erhalten
        let Password= req.params.AccountantPassword;
        const jsonArray = await pool.query("select Password, idAccountant from accountant where name = ? ", [Name])// checkt ob name und Passwort übereinstimmen
        const rightPassword = jsonArray[0].Password;
        if(rightPassword == Password){//vergleich der beiden Passwörter
            if(userlist.some(item => item.name === Name) == false){//checkt ob User nicht schon angemeldet ist
                let userid = getUserId(req, res); //Usererhält cookie
                userlist.push({"accountantId": jsonArray[0].idAccountant, "id": userid, "time": Date.now()}); //User wird zu Liste der jetztigen Nutzern hinzugefügt mit der zeit an der er sich anmeldete
            }
            return res.send("Login Erfolgreich");
        }else{
            return res.send("LogIn erfolgslos");
        }
    } catch (err) { //Error handling
        return res.send("LogIn erfolgslos");
        throw err;
    }
});
/*
* Gibt für jeden Schüler zurück wie viel Geld dieser auf dem Konto hat
*
* @returns {json} Array mit länge Anzahl Klassen auf die er zugriff hat. in Klasse steckt Name der Klasse, das Saldo jeden Schülers und alle Invoices der Klasse
*
*/
app.get('/students/Saldo', async (req, res)=>{
    let userid = req.cookies.userid //Hol cookie
    const userName = getUserByCookie(userid);//hol AccountantId
    let returnJson = [];//Rückgabe
    try{
        const classes = await pool.query("select class_name as class from accountant_has_class where accountant_idAccountant = ?", userName);//holt alle Klassen
        for(const item of classes){//geht durch jede Klassse
            const students = await pool.query("select idStudent from student where class_name = ?", item.class);//holt alle Schüler aus der Klasse
            const NameSaldo =  await getStudentNamesSaldo(students); //Holt für jeden Schüler sein Saldo
            const everyInvoice = await getEveryInvoice(students); //holt eine Liste aller Rechnung des Schülers
            returnJson.push({//Rückgabe
                name: item.class, 
                data: NameSaldo,
                invoices: everyInvoice
            })
        }
        return res.json(returnJson);

    }catch(err){//Fehler weitergabe
        throw err;
    }
});
/**
* Gib für einen Schüler alle seine Rechnungen zurück
* @param {number} id Schülerid
* @returns {json} Alle Rechnungen die mit dem Schüler in Verbindung stehen
*
**/
app.get('/studentAccount/invoices/:id',  async(req, res)=>{
    try {
        let userid = req.cookies.userid //holt cookie
        const userName = getUserByCookie(userid); //holt AccountantId
        const id = req.params.id; //SchülerId
        const acsess = await testStudent(id, userName); //tested ob der Accountant zugriff auf den Schüler hat.
        if(!acsess){
            res.status(403);//Zugriff verweigert
            return;
        }
        //Sql
        let response = {};//json für Antwort
        const invoice = await pool.query("select name, price, date_format(date, '%d-%m-%Y') as date, idInvoice as id from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", id); //Liste aller Rechnung eines Schülers
        const saldo = await pool.query("select sum(price) as s from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", id);//Die Summe der Rechnungen eines Schülers
        const n = await pool.query("select name from student where idStudent = ?", [id]); //holt den Namen des Schülers
        response.invoice = invoice; //füllt das Rückgabe Json
        response.saldo= saldo[0].s;
        response.name = n[0].name;
        res.json(response);//Rückgabe
    } catch (error) {//Fehler weiterleiten
        console.error(error);
        res.status(500).send("Server error");
    }
});
/**
* redirectet den Accountant auf die Seite eines einzelnen Students
* gibt vielleicht noch bessere Wege aber so funktioniert es
*
*
*/
app.get('/studentAccount/:student',  async(req, res)=>{
    res.sendFile(__dirname + '/static/studentPage/studentPage.html');// gibt vielleicht noch besseren weg schickt ein File ohne Daten an Client
    //res.redirect("/studentPage.html").send(studentId);
});
/**
* löscht eine Bestimmte Rechnung eines Schülers
* @params {string} name --> name der Rechnung
* @params {number} studentId --> Die id des Schülers
*/
app.get('/deleteStudentInvoice/:name/:studentId', async(req, res)=>{
    //set parameter
    const id = req.params.name;
    const studentId = req.params.studentId;
    //security
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    const acsess = await testStudent(studentId, userName);
    if(!acsess){
        res.status(403);
        return;
    }
    //delete
    const deleteConection = await pool.query("delete from student_has_invoice where invoice_idInvoice = ? and student_idStudent=?", [id, studentId]);// checkt ob auch connection zwischen Schüler und Rechnung besteht
    //check if Invoice is still in use
    console.log(deleteConection);
    if(deleteConection.affectedRows == 0){
        res.send("Diese Rechnung gibt es nicht");
        return;
    }else{
        const check = await pool.query("select * from student_has_invoice where invoice_idInvoice = ?", id); // checkt ob die Rechnung noch wo anders gebraucht wird
        let deleteInvoice= [];
        if(check.length == 0){
            deleteInvoice = await pool.query("delete from invoice where idInvoice = ?", id); // löscht Rechnung, wenn sie unnötig ist
        }
        res.send("Löschung erfolgreich");
    }
});
/**
* löscht eine Rechnung bei allen Schülern in einer Klasse
* @param {number} id - RechnungsId für jede Id speziel 
* @param {string} className
* @returns {string} -all good
*/

app.get('/deleteClassInvoice/:id/:className', async(req,res) =>{
    const id = req.params.id;//holt sich id(der Rechnung) und Klassennamen
    const className = req.params.className;
    const students = await pool.query("select idStudent from student where class_name = ?", className);//holt sich alle Schüler aus der Klasse
    for(const student of students){ //geht durch jeden Schüler durch und löscht die Rechnung, wenn sie exisitiert
        await pool.query("delete from student_has_invoice where invoice_idInvoice = ? and student_idStudent=?", [id, student.idStudent]); //nur die Verbindung wird gelöscht
    }
    const connections = await pool.query("select * from student_has_invoice where invoice_idInvoice = ?", id); //schaut ob die Rechnung noch wo anders gebraucht wird und wenn nicht, dann löscht er sie komplett
    if(connections.length == 0){
        await pool.query("delete from invoice where idInvoice = ?", id);
    }
    res.send("all good");
});
/**
 * Meldet den Benutzer ab, indem er aus der userlist entfernt wird.
 * @route GET /logOut
 * @returns {200} Bestätigung, dass der Benutzer ausgeloggt wurde.
 */
app.get('/LogOut', async(req, res)=>{
    let response ={}; //Rückgabe
    try{
        const cookie = req.cookies.userid; //cookie verlangen
        const index = userlist.findIndex(item => item.id == cookie); // holt sich den Index des Jetztigen Nutzers
        if (index !== -1) {  //wenn es denn Nutzer gibt
            userlist.splice(index, 1); //löscht den Nutzer aus dem Array
        }else{
            throw new accessError("no User found");
        }
        response.logOut = true; //Rückgabe
        res.json(response);
    }catch({name : message}){
        console.log(message);
        response.logOut = false; //nichts machen, wenn es einen Fehler gibt
        res.json(response);
    }
});
/**
 * Neuen Schüler hinzufügen
 * @param {string} name -Name des neuen Schülers immer nach Format max.mustermann
 * @param {string} class -Name der Klasse
 * @returns {status} 
 * 
 */
app.get('/newStudent/:name/:class', async (req, res) =>{
    //Daten einlese
    const name = req.params.name;
    const classes = req.params.class;
    //security
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    const acsess = await testClass(classes, userName); //teste Zugriff auf Klasse
    console.log(acsess);
    if(!acsess){
        res.status(403);//Access denied
        return;
    }
    const InsertStudent = await pool.query("insert into student (name,class_name) values (?, ?)", [name, classes]);// neuen Schüler in Datenbank hinzufügen
});
/**
 * Löschen von einem Schüler
 * @param {number} id - StudentId 
 * @returns {string} -all good
 */
app.get('/deleteStudent/:id', async (req, res) =>{
    const studentId = req.params.id; //Parameter anfordern
    //security
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    const acsess = await testStudent(studentId, userName); //teste Zugriff auf Schüler
    if(!acsess){
        return res.status(403).send("Unauthorized: No or wrong user ID"); //Fehlercode beim unerlaubtem versuch Daten zu bearbeiten
    }
    //sql
    const Invoices = await pool.query("select invoice_idInvoice as id from student_has_invoice where student_idStudent = ?", studentId); //wähle alle Invoices des Schülers aus
    const deleteConection = await pool.query("delete from student_has_invoice where student_idStudent = ?", studentId);//lösche alle Verbindungen zwischen Schüler und Rechnung
    for(const invoice of Invoices){//gehe durch jede Rechnung durch, die der Schüler hatte und schaue ob es sie noch braucht
        const hasConnection = await pool.query("select * from student_has_invoice where invoice_idInvoice = ?", invoice.id);//Hole alle Verbindungen der Rechnugn
        if(hasConnection.length == 0){//schaue ob es eine Verbindung noch gibt
            const deleteInvoice = await pool.query("delete from invoice where idInvoice =?", invoice.id);//Wenn es keine Verbindung gibt dann lösche die Rechnung
        }
    }
    const deleteStudent = await pool.query("delete from student where idStudent =?",  studentId);//lösche den Schüler
    res.send("all good");//rückgabe
});
/**
 * Exportiert die Daten von einem Schüler
 * @param {number} id -StudentId
 * @returns {pdf} -PDF Dokument mit den Daten des Schüler
 */
app.get('/export/:id', async(req, res) =>{
    const id =req.params.id;
    let userId = req.cookies.userid;
    //https://pptr.dev/
    const browser = await puppeteer.launch(); //starte den Browser
    const page = await browser.newPage();//öffne eine neue Seite
    await page.setCookie({ //gib dieser Seite den gleichen Cookie, welchen der User auch hat. Somit hat er auch die gleichen Berechtigung wie er
        name: 'userid',
        value: userId,
        domain: 'localhost', //muss noch verändert werden, falls man die Seiten public hosten möchte
        path: '/',
      });
    await page.goto('http://localhost:8080/studentAccount/'+id, {waitUntil: 'domcontentloaded'});//öffne die Seite Domain muss evt. noch angepasst werden
    await page.waitForSelector('#containerStudent'); //warte bis der Container mit den Daten geladen hat
    //vielleicht extra Selector in html page hinzufügen wenn Daten geladen sind wär schneller und sicherer
    await sleep(1000);//warte für eine sekunde zur Sicherheit, damit alles geladen hat
    //stackOverflow
    const pdfBuffer = await page.pdf({//exportier ein PDF in diesem Format
        path: 'clean-table.pdf',
        format: 'A4',
        printBackground: true
      });    
    await browser.close();//schliesse den Browser
    res.writeHead(200, {//Rückgabe
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="student-${id}.pdf"`,
        'Content-Length': pdfBuffer.length
      });
      res.end(pdfBuffer);
});

app.get('/design/:themeId', async(req,res)=>{
    const themeId = req.params.themeId;//falls das theme geändert werden will
    const cookie = req.cookies.userid;
    const id = getUserByCookie(cookie);
    if(id  !== undefined){
        if(themeId !=-1){//wenn theme geändert werden soll, dann ist tehemeId != -1
            const veridct = await pool.query("update accountant set design = ? where idAccountant = ?", [themeId, id]); // speicher das neue Theme
        }
        const response = await pool.query("select design from accountant where idAccountant = ? ", id);//hol das neue Design
        if(response.length >0){//Sicherheit, falls die Rückgabe zuvor undefined ist
            const dark = {design : response[0].design};
            res.json(dark);
        }else{
            const dark = {design : 0};
            res.json(dark);
        }
    }
});
/**
 * Aktualisiert den letzten Aktivitätszeitpunkt eines Benutzers (Heartbeat).
 * @route GET /heartbeat
 * @returns {string} -all good Bestätigung, dass der Heartbeat empfangen wurde.
 */
app.get('/heartbeat', async(req,res) =>{
    const cookie = req.cookies.userid;
    const user = userlist.find(item => item.id == cookie);//hol das Objekt mit dieser Id
    if (user) {//wenn es diesen User gibt
        user.time = Date.now();//setzt eine neue letzte heartbeat time für den User
    }
    res.send("all good");//bestätigung
});
/**
 * Fügt eine neue Klasse hinzu
 * @param {string} name -Name für die neue Klasse muss einzigartig sein
 * @returns {string} - verdict
 */
app.get('/newClass/:name', async(req, res)=>{
    const name = req.params.name; //Hol dir die Parameter
    const cookie = req.cookies.userid;
    const userId = getUserByCookie(cookie);
    const check = await pool.query("select * from class where name = ?", [name]); //schau ob es diesen Klassennamen schon gibt 
    if(check.length == 0){
        const InsertClass = await pool.query("insert into class (name) values (?)", [name]);//füge neue Klasse hinzu
        const InsertConnection = await pool.query("insert into accountant_has_class (accountant_idAccountant, class_name) values (?, ?)", [userId, name]) //füge eine Verbindung zwischen Accountant und Klasse ein
        if(InsertClass && InsertConnection){//wenn Klasse erstellen funktioniert hat
            res.send("update Successfull")
        }
        else{//wenn Klasse erstellen nicht funktioniert hat
            res.send("update Failed")
        }
    }
    else{//wenn Klasse bereits existiert
        res.send("error: class already exists")
    }
})
/**
 * Eine Rechnung für nur einen Schüler
 * @param {json} -enthält name der Rechnung, Preis der Rechnung, Id des Schülers
 * @returns {string} -verdict
 */
app.post('/newStudentInvoice',  async(req, res)=>{
   //Security
   let userid = req.cookies.userid
   const userName = getUserByCookie(userid);
   if(userName == "unknownUser"){ // falls es den User nicht gibt sende eine Fehlermeldung
       res.status(403).send("acsess denied");
       return;
   }
   //sql
   let receivedData = req.body;
   if(receivedData.name == "" || receivedData.price == "" || receivedData.student == ""){ // schau ob es ausreichend Daten gibt und keine Spalte leer bleibt
        res.send("Fehler ungenügende Daten");
        return;
    }
   receivedData.date = new Date();//sag wann die Invoice ein gefügt wurde
   const InsertInvoice = await pool.query("insert into invoice (name, price, date) values (?,?,?)", [receivedData.name, receivedData.price, receivedData.date]); //Füge Rechnung in Tabelle ein
   const insertConnection = await pool.query("insert into student_has_invoice (student_idStudent, invoice_idInvoice) values (?,?)", [receivedData.studentId, InsertInvoice.insertId]); // Füge Verbindung zwischen Schüler und Rechnung ein
   res.send("all good");//Rückgabe
});
/**
 * Sammeleintrag also eine gleiche Rechnung für mehrere Schüler
 * @param {json} -Enthät Name und Preis der Rechnung, sowie ein Array mit Schüler Ids 
 * @returns {string} -verdict
 */
app.post('/Sammeleintrag', async(req, res)=>{
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    if(userName == "unknwonUser"){// falls es den User nicht gibt sende eine Fehlermeldung
        res.status(403);
        return;
    }
    //sql
    const receivedData = req.body;
    if(receivedData.name == "" || receivedData.price == "" || receivedData.student == ""){ // schau ob es ausreichend Daten gibt und keine Spalte leer bleibt
        res.send("Fehler ungenügende Daten");
        return;
    }
    receivedData.date = new Date();  //sag wann die Rechung erstellt wurde
    const InsertInvoice = await pool.query("insert into invoice (name, price, date) values (?,?,?)", [receivedData.name, receivedData.price, receivedData.date]); //Füge Rechnung in Tabelle ein
    for(const student of receivedData.student){//geh durch alle an dieser Rechnung beteiligten Schüler durch und füge jeweils eine Verbindung ein
        const insertConnection = await pool.query("insert into student_has_invoice (student_idStudent, invoice_idInvoice) values (?,?)", [student, InsertInvoice.insertId]);//Füge Verbindung ein 
    }
    res.send("update Successfull");
});
/**
 * Erstellt einen neuen Accountant, welchem später noch Klassen und Funktionen zu geteilt werden können
 * @param {json} -Enthält Name und Passwort(bereit gehashed) vom neuem Accountant
 * @returns {string} -verdict
 */
app.post('/newAccountant', async(req, res)=>{
    const receivedData = req.body;
    const InsertAccountant = await pool.query("insert into accountant (name, password) values (?, ?)", [receivedData.name, receivedData.password]);//Füge neuen Accountant ein
 
    for(const classElement of receivedData.class){//gib dem Accountant Zugriff auf Klassen
        const InsertConnection = await pool.query("insert into  accountant_has_class (accountant_idAccountant, class_name) values (?, ?)", [InsertAccountant.insertId, classElement]);
    }
    if(InsertAccountant){ //checkt ob Input erfolgreich
        res.send("update Successfull")
    }
    else{
        res.send("update Failed")
    }
 
});
 /**
  * Ändert das Passwort des jetztigen benutzers
  * @param {json} -neues Password (gehashed)
  * @returns {veridct}
  */
app.post('/changePassword', async(req, res)=>{
    const receivedData = req.body;//hol die Parameter
    const cookie = req.cookies.userid;
    const userId = getUserByCookie(cookie);
    const ReplacePassword = await pool.query("update accountant set password = ? where idAccountant = ?", [receivedData.value, userId]); //setzte neues Passwort
    if(ReplacePassword){//check ob verändert erfolgreich war
        res.send("update Successfull")
    }
    else{
        res.send("update Failed")
    }
})
/**
 * einem anderen Nutzer wird zugriff auf eine Klasse gegeben
 * @param {json} -Enthält name des anderen Accountant und eine Liste von Klassen auf die er Zugriff hat.
 * @returns {string} -verdict
 */
app.post('/grantAccess', async(req, res)=>{
    const receivedData = req.body;
    const AccountantId = await pool.query("select idAccountant from accountant where name = ?", [receivedData.name])//Finde die Id anhand des Namens, welcher gegebene wurde
    if(!AccountantId){//check ob Accountant existiert
        res.send("Accountant existiert nicht")
    }
    const accessibleClasses = await pool.query("select class_name from accountant_has_class where accountant_idAccountant = ?", [AccountantId[0].idAccountant]);//schau auf welche Klassen der Accountant bereits Zugriff hat
 
    let contained = false;
    for(const classElement of receivedData.class){//geh durch jede Klasse durch auf welche er Zugriff bekommen soll
        for(const element of accessibleClasses){//vergleiche sie mit den Klassen auf die er bereits Zugriff hat
            if(classElement == element.class_name){
                contained = true;
            }
        }
        if(!contained){//wenn er noch keinen Zugriff auf diese Klasse hat, dann füge Zugriff hinzu
            const InsertConnection = await pool.query("insert into accountant_has_class (accountant_idAccountant, class_name) values (?, ?)", [AccountantId[0].idAccountant, classElement])
        }
        contained = false;
    }
 
 
    res.send("update Successfull");
 
});
/**
 * redirect zu der Anmeldeseite
 */
app.get('/', (req, res) => {
    res.redirect("/LogIn.html");
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});

