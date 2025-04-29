//lädt Bibliotheken und Datenbank
import express from 'express';
import mariadb from 'mariadb';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 8080;
const pool = mariadb.createPool({
  host: "127.0.0.1", 
  port: 3306,
  user: "root", 
  password: "85hsevbe-B",
  database: "mydb",
  supportBigNumbers: true
});
let userlist = [];




app.use(express.static('static')); //benutz den static ordner
app.use(cookieParser()); //cookies
app.use(express.json());
checkHeartbeat();
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/*
* @param {number} n
* @return {object} userid
* @error {sring} unknownUser
*
* kriegt cookie und schaut ob er schon existiert wird unkownUser returend
*
*/
function getUserByCookie(cookie){
    const user = userlist.find(item => item.id == cookie);
    if (user) {
        return user.accountantId;
    }
    return "unknownUser";
}
/*
* @param {string} id
* @param {string} UserName$
* @return {bool}
*
*checkt ob der user Access auf den Student hat
*
*/
async function testStudent(id, userName){
    try{
        const classes = await pool.query("select class_name as class from accountant_has_class where accountant_idAccountant = ?", userName);
        for(const item of classes){
            const students = await pool.query("select idStudent from student where class_name = ?", item.class);
            const inList = students.find(item => item.idStudent  == id);
            if(inList){
                return true;
            }
        }
        return false;
    }catch{
        return false
    }
}
/*
* @param {string} name
* @param {string} UserName
* @return {bool}
*
*checkt ob der user Access auf die Klasse hat
*
*/
async function testClass(name, userName){
    try{
        const classes = await pool.query("select class_name as class from accountant_has_class where accountant_idAccountant = ?", userName);
        console.log(classes);
        const inList = classes.find(item => item.class == name)
        if(inList){
            return true;
        }
        return false;
    }catch{
        return false
    }
}

async function getStudentId(studentName) { // holt die Id von Schüler anhand von namen
    //TO-DO Protokoll wenn es zwei mögliche Schüler gibt
    const id = await pool.query("SELECT IdStudent FROM student WHERE name = ?", studentName);
    if(id.length ==0){
        return(-1);
    }
    return(id[0].IdStudent)
}
function getUserId(req, res) {
    let userid = req.cookies.userid
 
    if (userid == undefined) {
        userid = crypto.randomUUID()
        res.cookie('userid', userid)
    }
    return userid
}

async function getStudentNamesSaldo(students) {
    try{
    let NameSaldo = []; // Array, welcher Alle Werte speichert
    for(const item of students){
        const nameArray = await pool.query("select name from student where idStudent = ?", item.idStudent); //schüler der Klasse
        //Saldo --> summe aller Rechnungen jeden Schülers
        const SaldoArray = await pool.query("select sum(price) as saldo from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", item.idStudent);
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
async function getEveryInvoice(students) {
    let returnArray = [];
    try{
        for(const item of students){
            const invoices = await pool.query("select name, price, date_format(date, '%d-%m-%Y') as date, idInvoice from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", item.idStudent);
            invoices.forEach(item => {
                const index = returnArray.findIndex(index => index.id == item.idInvoice);
                if(index == -1){
                    returnArray.push({
                        name:item.name,
                        price:item.price,
                        date:item.date,
                        id: item.idInvoice
                    })
                }
            });
        }
        return returnArray;

    } catch (err){
        throw err;
    }
}
async function checkHeartbeat(){
    const now = Date.now();
    userlist.forEach(item =>{
        console.log(item.time);
        if(now-item.time >= 200){
            console.log("userDisconected" + accountantId);
        }
    })
    await sleep(100);
    checkHeartbeat();
}

app.get('/logIn/:AccountantName/:AccountantPassword',async (req, res) => {
    //const userId = getUserId(req, res);
    //console.log(userId);
    // TODO: security
    try {
        let Name = req.params.AccountantName;
        let Password= req.params.AccountantPassword;
        const jsonArray = await pool.query("select Password, idAccountant from accountant where name = ? ", [Name])// checkt ob name und Passwort übereinstimmen
        const rightPassword = jsonArray[0].Password;
        if(rightPassword == Password){
            if(userlist.some(item => item.name === Name) == false){
            let userid = getUserId(req, res);
            userlist.push({"accountantId": jsonArray[0].idAccountant, "id": userid});
 
            }
            console.log(userlist);
            return res.send("Login Erfolgreich");
        }else{
            return res.send("LogIn erfolgslos")
        }
    } catch (err) {
        throw err;
    }
});

app.get('/students/Saldo', async (req, res)=>{
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    let returnJson = [];
    try{
        const classes = await pool.query("select class_name as class from accountant_has_class where accountant_idAccountant = ?", userName);
        for(const item of classes){
            const students = await pool.query("select idStudent from student where class_name = ?", item.class);
            const NameSaldo =  await getStudentNamesSaldo(students);
            const everyInvoice = await getEveryInvoice(students);
            returnJson.push({
                name: item.class, 
                data: NameSaldo,
                invoices: everyInvoice
            })
        }
        return res.json(returnJson);

    }catch(err){
        throw err;
    }
});

app.get('/studentAccount/invoices/:id',  async(req, res)=>{
    try {
        //security accsess
        let userid = req.cookies.userid
        const userName = getUserByCookie(userid);
        const id = req.params.id;
        const acsess = await testStudent(id, userName);
        if(!acsess){
            res.status(403);
            return;
        }
        //Sql
        let response = {};//json für Antwort
        const invoice = await pool.query("select name, price, date_format(date, '%d-%m-%Y') as date, idInvoice as id from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", id);
        const saldo = await pool.query("select sum(price) as s from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", id);
        const n = await pool.query("select name from student where idStudent = ?", [id]);
        response.invoice = invoice;
        response.saldo= saldo[0].s;
        response.name = n[0].name;
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

app.get('/studentAccount/:student',  async(req, res)=>{
    const studentId = req.params.student;
    res.sendFile(__dirname + '/static/studentPage/studentPage.html');// gibt vielleicht noch besseren weg
    //res.redirect("/studentPage.html").send(studentId);
});
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
    //sql
    /*
    const idInvoiceArray = await pool.query("select idInvoice from invoice where name = ?", name);//alle Rechnungen mit diesem Name
    console.log(idInvoiceArray.length);
    if(idInvoiceArray.length == 0){
        res.send("Diese Rechnung gibt es nicht");
        return;
    }
    const idInvoice =idInvoiceArray[0].idInvoice;
    */
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

app.get('/deleteClassInvoice/:id/:className', async(req,res) =>{
    const id = req.params.id;
    const className = req.params.className;
    const students = await pool.query("select idStudent from student where class_name = ?", className);
    for(const student of students){
        await pool.query("delete from student_has_invoice where invoice_idInvoice = ? and student_idStudent=?", [id, student.idStudent]);
    }
    const connections = await pool.query("select * from student_has_invoice where invoice_idInvoice = ?", id);
    if(connections.length == 0){
        await pool.query("delete from invoice where idInvoice = ?", id);
    }
    res.send("all good");
});
app.get('/LogOut', async(req, res)=>{
    const cookie = req.cookies.userid;
    const index = userlist.findIndex(item => item.id == cookie); // Use findIndex()
    if (index !== -1) { 
        userlist.splice(index, 1); 
    }
    res.send("test");
});

app.get('/newStudent/:name/:class', async (req, res) =>{
    //Daten einlesen
    const name = req.params.name;
    const classes = req.params.class;
    //security
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    const acsess = await testClass(classes, userName);
    console.log(acsess);
    if(!acsess){
        res.status(403);
        return;
    }
    console.log(name+ classes);
    const InsertStudent = await pool.query("insert into student (name,class_name) values (?, ?)", [name, classes]);
    console.log(InsertStudent.insertId);
});
app.get('/deleteStudent/:id', async (req, res) =>{
    console.log("test");
    const studentId = req.params.id;
    //security
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    const acsess = await testStudent(studentId, userName);
    if(!acsess){
        return res.status(401).send("Unauthorized: No user ID");
    }
    //sql
    const Invoices = await pool.query("select invoice_idInvoice as id from student_has_invoice where student_idStudent = ?", studentId);
    const deleteConection = await pool.query("delete from student_has_invoice where student_idStudent = ?", studentId);
    for(const invoice of Invoices){
        console.log(invoice);
        const hasConnection = await pool.query("select * from student_has_invoice where invoice_idInvoice = ?", invoice.id);
        if(hasConnection.length == 0){
            const deleteInvoice = await pool.query("delete from invoice where idInvoice =?", invoice.id)
            console.log(deleteInvoice);
        }
    }
    const deleteStudent = await pool.query("delete from student where idStudent =?",  studentId);
    console.log(deleteStudent);
    res.send("all good");
});
/*
* export
*
*
*
*/
app.get('/export/:id', async(req, res) =>{
    const id =req.params.id;
    let userId = req.cookies.userid;
    //https://pptr.dev/
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setCookie({
        name: 'userid',
        value: userId,
        domain: 'localhost', // Ensure it matches the domain you're using
        path: '/',
      });
    await page.goto('http://localhost:8080/studentAccount/'+id, {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('#containerStudent');
    //vielleicht extra Selector in html page hinzufügen wenn Daten geladen sind wär schneller und sicherer
    await sleep(1000);
    //stackOverflow
    const pdfBuffer = await page.pdf({
        path: 'clean-table.pdf',
        format: 'A4',
        printBackground: true
      });    
    await browser.close();
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="student-${id}.pdf"`,
        'Content-Length': pdfBuffer.length
      });
      res.end(pdfBuffer);
});
app.get('/design/:themeId', async(req,res)=>{
    const themeId = req.params.themeId;
    const cookie = req.cookies.userid;
    const id = getUserByCookie(cookie);
    if(themeId !=-1){
        console.log(themeId);
        const veridct = await pool.query("update accountant set design = ? where idAccountant = ?", [themeId, id]);
        console.log(veridct);
    }
    const response = await pool.query("select design from accountant where idAccountant = ? ", id);
    const dark = {design : response[0].design};
    res.json(dark);
});
app.get('/heartbeat', async(req,res) =>{
    userlist.time = Date.now()
    res.send("all good");
});

app.post('/newStudentInvoice',  async(req, res)=>{
   //Security
   let userid = req.cookies.userid
   const userName = getUserByCookie(userid);
   if(userName == "unknwonUser"){
       res.status(403).send("acsess denied");
       return;
   }
   //sql
   let receivedData = req.body;
   receivedData.date = new Date();
   console.log(receivedData);
   const InsertInvoice = await pool.query("insert into invoice (name, price, date) values (?,?,?)", [receivedData.name, receivedData.price, receivedData.date]);
   console.log(InsertInvoice.insertId);
   const insertConnection = await pool.query("insert into student_has_invoice (student_idStudent, invoice_idInvoice) values (?,?)", [receivedData.studentId, InsertInvoice.insertId]);
   console.log(insertConnection);
   res.send("Hallo");
});
app.post('/Sammeleintrag', async(req, res)=>{
    let userid = req.cookies.userid
    const userName = getUserByCookie(userid);
    if(userName == "unknwonUser"){
        res.status(403);
        return;
    }
    //sql
    const receivedData = req.body;
    if(receivedData.name == "" || receivedData.price == "" || receivedData.student == ""){
        res.send("Fehler ungenügende Daten");
        return;
    }
    receivedData.date = new Date();   
    console.log(receivedData);
    const InsertInvoice = await pool.query("insert into invoice (name, price, date) values (?,?,?)", [receivedData.name, receivedData.price, receivedData.date]);
    for(const student of receivedData.student){
        const insertConnection = await pool.query("insert into student_has_invoice (student_idStudent, invoice_idInvoice) values (?,?)", [student, InsertInvoice.insertId]) 
    }
    res.send("update Successfull");
});

app.post('/newAccountant', async(req, res)=>{
    const receivedData = req.body;
    const InsertAccountant = await pool.query("insert into accountant (name, password) values (?, ?)", [receivedData.name, receivedData.password]);
    for(const classElement of receivedData.class){
        const InsertConnection = await pool.query("insert into  accountant_has_class (accountant_idAccountant, class_name) values (?, ?)", [InsertAccountant.insertId, classElement])
    }
   res.send("update Successfull");

})




app.get('/', (req, res) => {
    res.redirect("/LogIn.html");
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

//TODO

// Kurs Wechsel
