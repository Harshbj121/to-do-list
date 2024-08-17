require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const jwt = require("jsonwebtoken");
const protected = require('./Middleware/protected');
const JWT_SECRET = process.env.JWT_SECRET

app.use(cors());
app.use(express.json())

// // to establish connection between nodejs and mysql db name todo
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'todo'
})

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const checkUser = 'SELECT * FROM user WHERE email = ?';
        const result = await new Promise((resolve, reject) => {
            db.query(checkUser, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        })
        if (result.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        const userData = [
            username,
            email,
            password
        ]

        const addData = 'INSERT INTO user (`username`,`email`,`password`) VALUES (?)';
        await new Promise((resolve, reject) => {
            db.query(addData, [userData], (err, result) => {
                if (err) return reject(err);
                resolve(result)
            })
        })
        return res.status(201).json({ message: 'User registered successfully' })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const data = 'SELECT * FROM user WHERE `email` = ? ';
        db.query(data, [email], async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database query error' });
            }
            if (result.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user = result[0]
            const a= (password === user.password);
            if (!a) {
                return res.status(401).json({ message: 'Wrong password' });
            }
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            return res.status(200).json({
                message: ' Login Success',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token: token
            })
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" })
    }
})

app.get('/test', (req, res) => {
    res.send('Hello ')
})

// get request to send data to user
app.get('/tasks/:userid',protected, async (req, res) => {
    const userId = req.params.userid
    db.query("SELECT * FROM task WHERE userId = ?", [userId], function (err, result) {
        if (err) {
            throw err;
        }
        return res.status(200).json({task:result});
    })
})

// post request to get task data from user 
app.post('/tasks/:userid',protected, async (req, res) => {
    const userId = req.params.userid
    // getting data from req.body
    const { task } = req.body;
    // query to add data to mysql database table
    db.query("INSERT INTO task (userId ,task) VALUES (?,?)", [userId, task], (err, result) => {
        if (err) throw err;
        return res.status(201).send('Task added.');
    })
})

// delete request to delete particular data from task list
app.delete('/tasks/:id',protected, async (req, res) => {
    const taskId = req.params.id;
    // query to delete the data selected by user
    db.query("DELETE FROM task WHERE id = ?", [taskId], function (err, result) {
        if (err) {
            throw err;
        }
        return res.send('Task deleted.');
    })
})

app.put('/tasks/:id',protected, async (req, res) => {
    const taskId = req.params.id;
    const { task } = req.body;
    // query to delete the data selected by user
    db.query("Update task SET task = ? WHERE id = ?", [task, taskId], function (err, result) {
        if (err) {
            throw err;
        }
        res.send('Task Updated');
    })
})

// // running app on port 5000 
app.listen(5000, () => {
    console.log('server started');
})