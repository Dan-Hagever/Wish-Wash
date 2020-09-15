async function sendLogin() {
  const user = document.getElementById("uname").value;
  const pass = document.getElementById("pwd").value;
  let response = await fetch(`http://localhost:7000/login/${user}/${pass}`, {
    method: "POST",
  });
  let data = await response.json();
  if (data.good) {
    location.replace(data.link);
  } else {
    var errMess = "Wrong User Name or PASSWORD";
    document.getElementById("uname").value = "";
    document.getElementById("pwd").value = "";
    document.getElementById("uname").placeholder = errMess;
    document.getElementById("pwd").placeholder = errMess;
  }
}
