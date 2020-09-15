const fetch = require("node-fetch");
const redis = require("redis");
require("./mainServer");
let port = 7000;

var testUserName = "testUser";
var testPsw = "testPsw";
var testPrice = "$30.97";
var testItemsList = "Carpets, Curtains, Towels,";
var testItemsPurchased =
  '{"price":"$30.97","itemsPurchased":"Carpets, Curtains, Towels,"}';
var testCookie;

const rclient = redis.createClient({ host: "127.0.0.1", port: "6379" });
rclient.on("connect", () => initiateTestData());
runTests();

async function initiateTestData() {
  rclient.hset("usersDB", testUserName, testPsw);
  rclient.hset("purchases", testUserName, testItemsPurchased);
}

async function runTests() {
  try {
    await login();
    await getPurchsesLog();
    await getUserPurchsesLog();
    await getUserName();
    await recordPurchase();
    await getAdmin();
  } catch (err) {
    console.log(err);
  }
}

//login the user to the system
async function login() {
  let response = await fetch(
    `http://localhost:${port}/login/${testUserName}/${testPsw}`,
    { method: "POST" }
  );
  let data = await response.json();
  if (response.ok) {
    testCookie = await response.headers.raw()["set-cookie"];
  }
  testPass("login", "http://localhost:7000/store.html" == data.link);
}

//add retriving purchases users
async function getPurchsesLog() {
  let response = await fetch(`http://localhost:${port}/getPurchsesLog`, {
    headers: { Cookie: testCookie },
  });
  let data = await response.json();
  let users = data.log;
  var passed = true;
  await rclient.HKEYS("purchases", async (err, value) => {
    for (var i = 0; i < users.length; i++) {
      if (value[i] != users[i]) {
        passed = false;
      }
    }
  });
  testPass("purchasesLog", passed);
}

//test retriving user's purchases
async function getUserPurchsesLog() {
  let response = await fetch(
    `http://localhost:${port}/getPurchsesLog/${testUserName}`,
    { headers: { Cookie: testCookie } }
  );
  let data = await response.json();
  let purchases = data.log;
  testPass("userPurchaseLog", purchases == testItemsPurchased);
}

//test get active user by its cookie
async function getUserName() {
  let response = await fetch(`http://localhost:${port}/getUserName/`, {
    headers: { Cookie: testCookie },
  });
  let data = await response.json();
  let user = data.userName;
  testPass("getUserName", user == testUserName);
}

// test purchase record on DB
async function recordPurchase() {
  let response = await fetch(
    `http://localhost:${port}/purchased/${testUserName}/${testPrice}/${testItemsList}`,
    { headers: { Cookie: testCookie }, method: "POST" }
  );
  let data = await response.json();
  await rclient.HGET("purchases", testUserName, (err, value) => {
    testPass("recordPurchase", JSON.stringify(data) == value);
  });
}

//test get admin name
async function getAdmin() {
  let response = await fetch(`http://localhost:${port}/getAdminName`, {
    headers: { Cookie: testCookie },
  });
  let data = await response.json();
  let sysAdmin = data.name;
  testPass("getAdmin", sysAdmin == "admin");
}

//message that return if test was passed
function testPass(testName, test) {
  if (test) {
    console.log(testName + " OK");
  } else {
    console.log(testName + " FAILURE");
  }
}
