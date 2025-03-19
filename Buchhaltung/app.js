//lädt Bibliotheken und Datenbank
import express from 'express';
import mariadb from 'mariadb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 8080;
let User= "henrik.baumgartner";
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
app.use(cookieParser());
app.use(express.json());
function getUserByCookie(cookie){
    const user = userlist.find(item => item.id == cookie);
    if (user) {
        console.log(user.accountantId);
        return user.accountantId;
    }
    return "unknownUser";
}
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
            User=Name; //veraltet
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
            returnJson.push({
                name: item.class, 
                data: NameSaldo,
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
        const invoice = await pool.query("select name, price, date_format(date, '%d-%m-%Y') as date from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", id);
        const saldo = await pool.query("select sum(price) as s from student_has_invoice right join invoice on student_has_invoice.invoice_idInvoice = invoice.idInvoice where student_idStudent= ? ", id);
        response.invoice = invoice;
        response.saldo= saldo[0].s;
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

app.get('/studentAccount/:student',  async(req, res)=>{
    res.sendFile(__dirname + '/static/studentPage.html');// gibt vielleicht noch besseren weg
});
app.get('/deleteStudentInvoice/:name/:studentId', async(req, res)=>{
    //set parameter
    const name = req.params.name;
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
    const idInvoiceArray = await pool.query("select idInvoice from invoice where name = ?", name);//alle Rechnungen mit diesem Name
    console.log(idInvoiceArray.length);
    if(idInvoiceArray.length == 0){
        res.send("Diese Rechnung gibt es nicht");
        return;
    }
    const idInvoice =idInvoiceArray[0].idInvoice;
    //delete
    const deleteConection = await pool.query("delete from student_has_invoice where invoice_idInvoice = ? and student_idStudent=?", [idInvoice, studentId]);// checkt ob auch connection zwischen Schüler und Rechnung besteht
    //check if Invoice is still in use
    console.log(deleteConection);
    if(deleteConection.affectedRows == 0){
        res.send("Diese Rechnung gibt es nicht");
        return;
    }else{
        const check = await pool.query("select * from student_has_invoice where invoice_idInvoice = ?", idInvoice); // checkt ob die Rechnung noch wo anders gebraucht wird
        let deleteInvoice= [];
        if(check.length == 0){
            deleteInvoice = await pool.query("delete from invoice where idInvoice = ?", idInvoice); // löscht Rechnung, wenn sie unnötig ist
        }
        res.send("Löschung erfolgreich");
    }
});
app.get('/LogOut', async(req, res)=>{
    /*
    const cookie = req.cookies.userid;
    const index = userlist.indexOf(item => item.id == cookie);
    delete userlist[index];
    */
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
app.get('/deleteStudent/:name', async (req, res) =>{
    const name = req.params.name;
    const studentId = await getStudentId(name);
    console.log(studentId);

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

app.post('/newStudentInvoice',  async(req, res)=>{
   //TODO: Security
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
    const receivedData = req.body;
    receivedData.date = new Date();   
    const InsertInvoice = await pool.query("insert into invoice (name, price, date) values (?,?,?)", [receivedData.name, receivedData.price, receivedData.date]);
    for(const student of receivedData.student){
        const id = await getStudentId(student);
        const insertConnection = await pool.query("insert into student_has_invoice (student_idStudent, invoice_idInvoice) values (?,?)", [id, InsertInvoice.insertId]) 
    }
    res.send("update Successfull");
});



app.get('/', (req, res) => {
    res.redirect("LogIn.html");
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

//TODO

//LogOut
//SignUp
// Kurs Wechsel
