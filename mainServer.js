const redis = require("redis");
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const connectRedis = require('connect-redis')
const app = express();
const redisStore = connectRedis(session);
const cookieParser = require('cookie-parser');
const e = require("express");
const sysAdmin = "admin";
var cookie = 0;

var urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(cookieParser());


const rclient = redis.createClient({host:"127.0.0.1", port:"6379"});
rclient.on('connect', () => initateSystem());

function initateSystem(){
    rclient.hset('usersDB', sysAdmin, sysAdmin);
    console.log('redis is ready');
}

app.use(express.static(path.join(__dirname, 'public')));

//configure session middleware
app.use(session({
    store: new redisStore({ host: 'localhost', port: 6379, client: rclient}),
    secret: 'mySecret',
    saveUninitialized: false,
    resave: false, 
    cookie: {
        secure: false, // if true: only transmit cookie over https
        httpOnly: true, 
        maxAge: 1000 * 60 * 30, // session max age in milliseconds
    }
}));

// 1. create login endpoint
app.post('/login/:user/:psw', (req, res) => {
    var usName = req.params.user;
    var passw = req.params.psw;
    console.log("recieved login credentials")
    // check if the credentials are correct
    checkCredentials(usName, passw, res);
    
});

//check if user's inserted credentials are correct
async function checkCredentials(usName, passw, res){
    var errorMessage = "user credentials are wrong";
    var rs;
    var userExists;
    await rclient.HGET('usersDB', usName, (err, value) => {
        rs = value;
        userExists = (rs != null);
        if((!userExists)||(passw != value)){
            res.json({
                good: false,
                link: errorMessage
            });
        }
        else{
            cookie++; //could be any other generator
            res.cookie('sid', cookie);
            rclient.hset('activeUsers',cookie, usName);
            res.json({
                good: true,
                link: "http://localhost:7000/store.html"
            });
        }
    })
}

// 2. signs up a user to the DB
app.post('/signup',urlencodedParser, (req, res) => {
    var usName = req.body.email;
    var passw = req.body.psw;
    var passwRepeat = req.body.pswrepeat;
    tryToSignUser(usName, res, passw, passwRepeat);
});

//check if the system can sign up a user according to the inserted credentials
async function tryToSignUser(usName, res, passw, passwRepeat){
    var errorMessage = "user cannot be registered";
    var rs;
    var userExists;
    await rclient.HGET('usersDB', usName, (err, value) => {
        rs = value;
        userExists = (rs != null);
        if((userExists)||(passw != passwRepeat)){
            res.json(errorMessage);
        }
        else{
            rclient.hset('usersDB', usName, passw)
            res.json("user " + usName + " registered successfully!");
        }
    })
}

// 3. make sure the user hold a cookie middleware
app.use((req, res, next) => {
    var Url = req.originalUrl;
    // pass the cookie test if client is loging in to login.html
    if((Url == '/Images/Header%20Background.jpg') || (Url == '/Fonts/Booter%20-%20Zero%20Zero.woff2'|| '/Fonts/Booter%20-%20Zero%20Zero.woff')){
        next();
    }
    else{
        cookieExists(req, res, next);
    }
})

async function cookieExists(req, res, next){
    var found = false;
    await rclient.HKEYS('activeUsers', (err, value) => {
        for(var i = 0; i < value.length; i++){
            if(value[i] == req.cookies.sid){
                found = true;
            }
        }
        if(!found){
            const err = new Error('You can not pass');
            err.statusCode = 401;
            next(err);
        }
        else{
            next();
        }
    })
}

// 4. returns the purchase log of a user
app.get('/getPurchsesLog/:username', (req, res) => {
    var user = req.params.username;
    getPurchsesLog(user, res);
});

async function getPurchsesLog(user, res){
    var rs;
    await rclient.HGET('purchases', user, (err, value) => {
        rs = value;
        res.json({
            "log": rs
        })
    })
}

// 5. returns all the users that bought something
app.get('/getPurchsesLog', (req, res) => {
    bringPurchsesUsers(res);
});

async function bringPurchsesUsers(res){
    var rs;
    await rclient.HKEYS('purchases', (err, value) => {
        rs = value;
        res.json({
            "log": rs
        }) 
    })
}

// 6. returs the user name attached to the cookie in DB
app.get('/getUserName/', (req, res) => {
    bringDataToActiveUser(req.cookies.sid, res)
});

async function bringDataToActiveUser(cooki, res){
    var rs;
    await rclient.HGET('activeUsers', cooki, (err, value) => {
        rs = value;
        res.json({
            "userName": rs
        })
    })
}

// 7. record a purchase in the DB
app.post('/purchased/:userName/:price/:itemsPurchased', (req, res) => {
    var userName = req.params.userName;
    var price = req.params.price;
    var itemsPurchased = req.params.itemsPurchased;
    let purchaseToSave = {
        "Price": price,
        "ItemsPurchased": itemsPurchased
    }
    rclient.HSET('purchases', userName, JSON.stringify(purchaseToSave));
    res.json(purchaseToSave);
});

// 8. gets the admin name
app.get('/getAdminName', (req, res) => {
    res.json({
        name: sysAdmin
    })
});

let Port = 7000;
app.listen(Port, () => console.log(`listening at port ` + Port))

