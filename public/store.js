var sessionCookie;
var userName;
var itemsPurchased = "";
var price;

if(document.readyState == 'loading'){
    document.addEventListener('DOMContentLoaded', ready);
}
else{
    ready();
}

async function ready(){
    try {
        await getUserName();
    }
    catch (err){
        console.log(err);
    }
    if((userName == null)||(userName == undefined)){
        alert("You have to login in order to buy!")
        location.replace("./login.html");
    }
    else{
        addNameToScreen();
        var removeCartItemButtons = document.getElementsByClassName('btn-danger');
        console.log(removeCartItemButtons);
        for(var i = 0; i < removeCartItemButtons.length; i++){
            var button = removeCartItemButtons[i];
            button.addEventListener('click', removeCartItem);
        }
    
        var quantityInputs = document.getElementsByClassName('cart-quantity-input');
        for(var i = 0; i < quantityInputs.length; i++){
            var input = quantityInputs[i];
            input.addEventListener('change', quantityChanged);
        }
    
        var addToCartButtons = document.getElementsByClassName('shop-item-button');
        for(var i = 0; i < addToCartButtons.length; i++){
            var button = addToCartButtons[i];
            button.addEventListener('click', addToCartClicked);
        }
        
        document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked);
    }
}

async function getUserName(){
    let response = await fetch(`http://localhost:7000/getUserName/`);
    let data = await response.json();
    userName = data.userName;
}

async function purchaseClicked(){
    alert('thank you for your purchase');
    var cartItems = document.getElementsByClassName('cart-items')[0];
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title');
    
    for(var i = 0; i < cartItemNames.length; i++){
        itemsPurchased += cartItemNames[i].innerText + ", ";
    }
    var cartitems = document.getElementsByClassName('cart-items')[0];
    while(cartitems.hasChildNodes()){
        cartitems.removeChild(cartitems.firstChild);
    }
    price = document.getElementsByClassName('cart-total-price')[0].innerText;
    console.log(price);
    console.log(itemsPurchased);
    try {
        await sendToServer();
    }
    catch (err){
        console.log(err);
    }
    updateCartTotal();
}

async function sendToServer(){
    let response = await fetch(`http://localhost:7000/purchased/${userName}/${price}/${itemsPurchased}`,{ method: 'POST'})
    let data = await response.json();
    itemsPurchased = "";
    price = "";
}

function removeCartItem(event){
    var buttonClicked = event.target;
    buttonClicked.parentElement.parentElement.remove();
    updateCartTotal();
}

function quantityChanged(event){
    var input = event.target;
    if(isNaN(input.value) || input.value <= 0){
        input.value = 1;
    }
    updateCartTotal();
}

function addToCartClicked(event){
    var button = event.target;
    var shopItem = button.parentElement.parentElement;
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText;
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText;
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src;
    console.log(title, price, imageSrc);
    addItemToCart(title, price, imageSrc);
    updateCartTotal();
}

function addNameToScreen(){
        var cartRow = document.createElement('div');
        cartRow.classList.add('section-header');
        var titleToAdd = 'Welcome ' + userName + '!';
        var cartItems = document.getElementsByClassName('main-header')[0];
        cartRow.innerHTML = titleToAdd;
        cartItems.append(cartRow);
}

function addItemToCart(title, price, imageSrc){
    var cartRow = document.createElement('div');
    cartRow.classList.add('cart-row');
    var cartItems = document.getElementsByClassName('cart-items')[0];
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title');
    for(var i = 0; i < cartItemNames.length; i++){
        if(cartItemNames[i].innerText == title){
            alert('This item is already in your cart');
            return;
        }
    }
    var cartRowContents = `
    <div class="cart-item cart-column">
                        <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
                        <span class="cart-item-title">${title}</span>
                    </div>
                    <span class="cart-price cart-column">${price}</span>
                    <div class="cart-quantity cart-column">
                        <input class="cart-quantity-input" type="number" value="1">
                        <button class="btn btn-danger" type="button">REMOVE</button>
                    </div>`
    cartRow.innerHTML = cartRowContents;                
    cartItems.append(cartRow);
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem);
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged);
}

function updateCartTotal(){
    var cartItemContainer = document.getElementsByClassName('cart-items')[0];
    var cartRows = cartItemContainer.getElementsByClassName('cart-row');
    var total = 0;
    for(var i = 0; i < cartRows.length; i++){
        var cartRow = cartRows[i];
        var priceElement = cartRow.getElementsByClassName('cart-price')[0];
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0];
        var price = parseFloat(priceElement.innerText.replace('$', ''));
        var quantity = quantityElement.value;
        total += (price * quantity);
    }
    total = Math.round(total * 100) / 100;
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total;
}

async function checkIfAdmin(){
    let response = await fetch(`http://localhost:7000/getAdminName`);
    let data = await response.json();
    if(userName != data.name){
        alert('you are not the admin!');
    }
    else{
        location.replace("./index.html"); 
    }
}