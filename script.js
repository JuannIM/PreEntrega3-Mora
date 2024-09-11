// ARRAYS TO STORE PRODUCTS AND PURCHASE HISTORY, LOADED FROM LOCALSTORAGE IF AVAILABLE
let products = JSON.parse(localStorage.getItem('products')) || [];
let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
let cart = []; // CART TO HOLD SELECTED PRODUCTS FOR CHECKOUT
let currentEditIndex = null;

// FUNCTION TO ADD A PRODUCT TO THE ARRAY AND UPDATE THE LIST ON THE PAGE
function addProduct(event) {
    event.preventDefault();
    const productName = document.getElementById('productName').value.trim();
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productStock = parseInt(document.getElementById('productStock').value, 10);

    if (productName && !isNaN(productPrice) && productPrice > 0 && !isNaN(productStock) && productStock >= 0) {
        const product = { name: productName, price: productPrice, stock: productStock };
        products.push(product);
        updateProductList();
        saveProducts();
        document.getElementById('productForm').reset();
    } else {
        updateNotification('Please enter valid product details.', 'error');
    }
}

// FUNCTION TO UPDATE THE PRODUCT LIST IN THE UI
function updateProductList(filteredProducts = products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    filteredProducts.forEach((product, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${product.name} - $${product.price.toFixed(2)} (Stock: ${product.stock})
            <input type="number" placeholder="Quantity" id="qty-${index}" min="1" max="${product.stock}">
            <button onclick="addToCart(${index})">Add to Cart</button>
            <button onclick="editProduct(${index})">Edit</button>
            <button onclick="deleteProduct(${index})">Delete</button>
        `;
        productList.appendChild(li);
    });
}

// FUNCTION TO ADD A PRODUCT TO THE CART
function addToCart(index) {
    const quantity = parseInt(document.getElementById(`qty-${index}`).value, 10);

    if (isNaN(quantity) || quantity < 1 || quantity > products[index].stock) {
        updateNotification('Invalid quantity selected.', 'error');
        return;
    }

    const cartItem = { ...products[index], quantity: quantity };
    cart.push(cartItem);
    updateCartList();
}

// FUNCTION TO UPDATE THE CART LIST IN THE UI
function updateCartList() {
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = '';
    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`;
        cartList.appendChild(li);
    });
}

// FUNCTION TO CALCULATE THE TOTAL PRICE OF THE PRODUCTS IN THE CART
function calculateTotal() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('totalPrice').textContent = `Total: $${total.toFixed(2)}`;
}

// FUNCTION TO APPLY A 10% DISCOUNT TO THE TOTAL PRICE
function applyDiscount() {
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    total *= 0.9; // APPLY A 10% DISCOUNT
    document.getElementById('totalPrice').textContent = `Total with Discount: $${total.toFixed(2)}`;
}

// FUNCTION TO SIMULATE CHECKOUT AND UPDATE STOCK
function checkout() {
    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = total * 0.08; // Example tax of 8%
    const finalTotal = total + tax;

    // CHECK IF STOCK IS AVAILABLE FOR EACH ITEM
    for (const item of cart) {
        const product = products.find(p => p.name === item.name);
        if (product.stock < item.quantity) {
            updateNotification(`Insufficient stock for ${item.name}.`, 'error');
            return;
        }
    }

    // UPDATE THE STOCK OF EACH PRODUCT
    for (const item of cart) {
        const product = products.find(p => p.name === item.name);
        product.stock -= item.quantity;
    }

    // RECORD THE PURCHASE IN HISTORY
    const purchase = {
        date: new Date().toLocaleString(),
        items: [...cart],
        subtotal: total,
        tax: tax,
        total: finalTotal
    };
    purchaseHistory.push(purchase);
    savePurchaseHistory();

    updateNotification(`Checkout successful! Subtotal: $${total.toFixed(2)}, Tax: $${tax.toFixed(2)}, Total: $${finalTotal.toFixed(2)}`, 'success');

    // CLEAR CART AFTER CHECKOUT
    cart = [];
    updateCartList();
    updateProductList();
    saveProducts();
    document.getElementById('totalPrice').textContent = 'Total: $0.00';
    loadPurchaseHistory(); // UPDATE PURCHASE HISTORY DISPLAY
}

// FUNCTION TO FILTER PRODUCTS BASED ON THE SEARCH INPUT
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm));
    updateProductList(filteredProducts);
}

// FUNCTION TO LOAD AND DISPLAY PURCHASE HISTORY
function loadPurchaseHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    purchaseHistory.forEach(purchase => {
        const li = document.createElement('li');
        const items = purchase.items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', ');
        li.textContent = `${purchase.date}: ${items} - Total: $${purchase.total.toFixed(2)}`;
        historyList.appendChild(li);
    });
}

// FUNCTION TO SAVE PRODUCTS TO LOCALSTORAGE
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// FUNCTION TO SAVE PURCHASE HISTORY TO LOCALSTORAGE
function savePurchaseHistory() {
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
}

// FUNCTION TO DISPLAY NOTIFICATIONS TO THE USER
function updateNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// FUNCTION TO EXPORT PRODUCTS AS JSON
function exportProductsJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "products.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// FUNCTION TO EXPORT PRODUCTS AS CSV
function exportProductsCsv() {
    const csvContent = "data:text/csv;charset=utf-8," +
        products.map(product => `${product.name},${product.price},${product.stock}`).join("\n");
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", encodeURI(csvContent));
    downloadAnchorNode.setAttribute("download", "products.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// FUNCTION TO EXPORT PURCHASE HISTORY AS JSON
function exportHistoryJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(purchaseHistory));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "purchase_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// FUNCTION TO EXPORT PURCHASE HISTORY AS CSV
function exportHistoryCsv() {
    const csvContent = "data:text/csv;charset=utf-8," +
        purchaseHistory.map(purchase => {
            const items = purchase.items.map(item => `${item.name} ($${item.price}, Qty: ${item.quantity})`).join("; ");
            return `${purchase.date},${items},${purchase.subtotal},${purchase.tax},${purchase.total}`;
        }).join("\n");
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", encodeURI(csvContent));
    downloadAnchorNode.setAttribute("download", "purchase_history.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// FUNCTION TO DELETE A PRODUCT FROM THE LIST
function deleteProduct(index) {
    products.splice(index, 1);
    updateProductList();
    saveProducts();
    updateNotification('Product deleted successfully.', 'success');
}

// FUNCTION TO EDIT A PRODUCT
function editProduct(index) {
    currentEditIndex = index;
    const product = products[index];
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;
    openModal();
}

// FUNCTION TO SAVE CHANGES TO THE PRODUCT
function saveChanges(event) {
    event.preventDefault();
    const productName = document.getElementById('editProductName').value.trim();
    const productPrice = parseFloat(document.getElementById('editProductPrice').value);
    const productStock = parseInt(document.getElementById('editProductStock').value, 10);

    if (productName && !isNaN(productPrice) && productPrice > 0 && !isNaN(productStock) && productStock >= 0) {
        products[currentEditIndex] = { name: productName, price: productPrice, stock: productStock };
        updateProductList();
        saveProducts();
        closeModal();
        updateNotification('Product updated successfully.', 'success');
    } else {
        updateNotification('Please enter valid product details.', 'error');
    }
}

// FUNCTION TO OPEN THE EDIT MODAL
function openModal() {
    document.getElementById('editModal').style.display = 'block';
}

// FUNCTION TO CLOSE THE EDIT MODAL
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// EVENT LISTENERS FOR BUTTONS AND FORM SUBMISSION
document.getElementById('productForm').addEventListener('submit', addProduct);
document.getElementById('calculateTotal').addEventListener('click', calculateTotal);
document.getElementById('applyDiscount').addEventListener('click', applyDiscount);
document.getElementById('checkout').addEventListener('click', checkout);
document.getElementById('searchInput').addEventListener('input', filterProducts);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('editForm').addEventListener('submit', saveChanges);
document.getElementById('exportJson').addEventListener('click', exportProductsJson);
document.getElementById('exportCsv').addEventListener('click', exportProductsCsv);
document.getElementById('exportHistoryJson').addEventListener('click', exportHistoryJson);
document.getElementById('exportHistoryCsv').addEventListener('click', exportHistoryCsv);

// LOAD PRODUCTS AND HISTORY FROM LOCALSTORAGE ON PAGE LOAD
updateProductList();
loadPurchaseHistory();
