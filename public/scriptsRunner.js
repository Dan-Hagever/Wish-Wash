let logIsPresented = false;

async function presentLog() {
  if (await userIsAdmin()) {
    if (!logIsPresented) {
      let response = await fetch(`http://localhost:7000/getPurchsesLog`);
      let data = await response.json();
      var users = data.log;
      getLog(users);
    }
  } else {
    alert("you are not the admin!!! how did you get in here hacker?!");
    location.replace("./login.html");
  }
}

async function getLog(users) {
  addLogToScreen("User", "Purchases", "cart-header");
  for (var i = 0; i < users.length; i++) {
    let response = await fetch(
      `http://localhost:7000/getPurchsesLog/${users[i]}`
    );
    let data = await response.json();
    addLogToScreen(users[i], data.log, "");
  }
  logIsPresented = true;
}

function addLogToScreen(user, purchases, style) {
  var title = document.createElement("div");
  title.setAttribute("class", "cart-row");
  var title1 = document.createElement("span");
  title1.setAttribute("class", "cart-item " + style + " cart-column");
  var title2 = document.createElement("span");
  title2.setAttribute("class", "cart-item " + style + " cart-column");
  title.appendChild(title1);
  title.appendChild(title2);
  title1.innerHTML = user;
  title2.innerHTML = purchases;
  document.getElementById("table").appendChild(title);
}

async function userIsAdmin() {
  let response1 = await fetch(`http://localhost:7000/getAdminName`);
  let data1 = await response1.json();
  let response2 = await fetch(`http://localhost:7000/getUserName`);
  let data2 = await response2.json();
  return data2.userName == data1.name;
}
