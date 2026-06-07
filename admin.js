var adminState = {
    currentUser: null,
    currentRole: '',
    products: [],
    discounts: [],
    orders: [],
    settings: normalizeSettings(DEFAULT_SITE_SETTINGS),
    users: normalizeUsersDoc({}),
    charts: {}
};
var adminReady = { products: false, discounts: false, orders: false, settings: false, users: false };
var productModalEl = null;

document.addEventListener('DOMContentLoaded', function () {
    bindAdminEvents();
    restoreSession();
});

function bindAdminEvents() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', logoutAdmin);
    document.getElementById('refreshBtn').addEventListener('click', initializeAdmin);
    document.getElementById('seedDataBtn').addEventListener('click', function () {
        if (!window.db) return;
        setAdminStatus('جاري زرع البيانات...', '');
        seedFirestoreData(true).then(function () {
            setAdminStatus('تم زرع البيانات بنجاح.', 'success');
        }).catch(function () {
            setAdminStatus('تعذر زرع البيانات.', 'error');
        });
    });
    document.getElementById('newProductBtn').addEventListener('click', function () { openProductModal(); });
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    document.getElementById('discountForm').addEventListener('submit', saveDiscount);
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('userForm').addEventListener('submit', saveUser);
    document.getElementById('exportProductsBtn').addEventListener('click', exportProductsCsv);
    document.getElementById('importProductsBtn').addEventListener('click', importProductsFile);
    document.getElementById('exportOrdersBtn').addEventListener('click', exportOrders);
    document.getElementById('orderSearchInput').addEventListener('input', renderOrdersTable);
    document.getElementById('orderStatusFilter').addEventListener('change', renderOrdersTable);
    document.getElementById('orderRegionFilter').addEventListener('change', renderOrdersTable);
    document.getElementById('orderDateFrom').addEventListener('change', renderOrdersTable);
    document.getElementById('orderDateTo').addEventListener('change', renderOrdersTable);
    productModalEl = document.getElementById('productModal');
    document.body.addEventListener('click', function (event) {
        var closeTarget = event.target.getAttribute('data-close-modal');
        if (closeTarget) closeModal(closeTarget);
    });
    var tabs = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabs.length; i += 1) {
        tabs[i].addEventListener('click', function (event) {
            switchTab(event.currentTarget.getAttribute('data-tab'));
        });
    }
}

function setAdminStatus(message, type) {
    var node = document.getElementById('adminStatus');
    if (!node) return;
    if (!message) {
        node.className = 'admin-status hidden';
        node.textContent = '';
        return;
    }
    node.className = 'admin-status';
    node.style.color = type === 'error' ? '#991b1b' : '';
    node.textContent = message;
}

function saveSession(user) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
}

function restoreSession() {
    var payload = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!payload) return;
    try {
        var user = JSON.parse(payload);
        if (user && user.username) {
            adminState.currentUser = user;
            adminState.currentRole = user.role;
            showAdminApp();
            initializeAdmin();
        }
    } catch (error) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
}

function handleLogin(event) {
    event.preventDefault();
    var username = String(document.getElementById('adminUsername').value || '').trim();
    var password = String(document.getElementById('adminPassword').value || '').trim();
    if (!username || !password) {
        document.getElementById('loginError').textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور.';
        return;
    }
    if (!window.db) {
        document.getElementById('loginError').textContent = 'فايربيس غير متاح حالياً.';
        return;
    }
    db.collection('settings').doc('users').get().then(function (docSnap) {
        var users = normalizeUsersDoc(docSnap.exists ? docSnap.data() : {});
        var record = users[username];
        if (!record || record.password !== password) {
            document.getElementById('loginError').textContent = 'بيانات الدخول غير صحيحة.';
            return;
        }
        adminState.currentUser = { username: username, role: record.role, name: record.name || username };
        adminState.currentRole = record.role;
        saveSession(adminState.currentUser);
        showAdminApp();
        initializeAdmin();
    }).catch(function () {
        document.getElementById('loginError').textContent = 'تعذر التحقق من المستخدمين.';
    });
}

function showAdminApp() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('currentUserLabel').textContent = (adminState.currentUser ? adminState.currentUser.name : '') + ' - ' + (adminState.currentRole === 'worker' ? 'موظف' : 'مدير');
    applyRolePermissions();
}

function logoutAdmin() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.reload();
}

function applyRolePermissions() {
    var isWorker = adminState.currentRole === 'worker';
    var hiddenTabs = ['dashboard', 'products', 'discounts', 'settings', 'users'];
    var buttons = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < buttons.length; i += 1) {
        var tab = buttons[i].getAttribute('data-tab');
        buttons[i].style.display = isWorker && hiddenTabs.indexOf(tab) >= 0 ? 'none' : '';
    }
    document.getElementById('seedDataBtn').style.display = isWorker ? 'none' : '';
    if (isWorker) switchTab('orders');
}

function switchTab(tab) {
    var buttons = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');
    for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].classList.toggle('active', buttons[i].getAttribute('data-tab') === tab);
    }
    for (var j = 0; j < panels.length; j += 1) {
        panels[j].classList.toggle('active', panels[j].id === 'tab-' + tab);
    }
    document.getElementById('tabTitle').textContent = tab === 'dashboard' ? 'لوحة المؤشرات' : tab === 'products' ? 'إدارة المنتجات' : tab === 'orders' ? 'إدارة الطلبات' : tab === 'discounts' ? 'الخصومات' : tab === 'settings' ? 'الإعدادات' : 'المستخدمون';
}

function initializeAdmin() {
    if (!window.db) {
        setAdminStatus('فايربيس غير متاح.', 'error');
        return;
    }
    setAdminStatus('جاري تحميل البيانات...', '');
    ensureDefaults().then(subscribeData).catch(function () {
        setAdminStatus('تعذر تهيئة المشروع.', 'error');
    });
}

function ensureDefaults() {
    return db.collection('settings').doc('users').get().then(function (usersDoc) {
        if (!usersDoc.exists) return db.collection('settings').doc('users').set(getSeedUsers());
        return null;
    }).then(function () {
        return db.collection('settings').doc('config').get();
    }).then(function (configDoc) {
        if (!configDoc.exists) return db.collection('settings').doc('config').set(normalizeSettings(DEFAULT_SITE_SETTINGS));
        return null;
    }).then(function () {
        return db.collection('products').limit(1).get();
    }).then(function (snapshot) {
        if (snapshot.empty) return seedFirestoreData(false);
        return false;
    });
}

function subscribeData() {
    db.collection('products').onSnapshot(function (snapshot) {
        adminState.products = snapshot.docs.map(function (docSnap) { var data = docSnap.data(); data.id = docSnap.id; return normalizeProduct(data); });
        adminReady.products = true;
        renderProductsTable();
        renderDashboard();
        setAdminStatus('', '');
    });
    db.collection('discounts').onSnapshot(function (snapshot) {
        adminState.discounts = snapshot.docs.map(function (docSnap) { var data = docSnap.data(); data.id = docSnap.id; return normalizeDiscount(data); });
        adminReady.discounts = true;
        renderDiscountsTable();
    });
    db.collection('orders').onSnapshot(function (snapshot) {
        adminState.orders = snapshot.docs.map(function (docSnap) { var data = docSnap.data(); data._docId = docSnap.id; return data; });
        adminReady.orders = true;
        renderOrdersTable();
        renderDashboard();
    });
    db.collection('settings').doc('config').onSnapshot(function (docSnap) {
        adminState.settings = normalizeSettings(docSnap.exists ? docSnap.data() : DEFAULT_SITE_SETTINGS);
        adminReady.settings = true;
        renderSettingsForm();
    });
    db.collection('settings').doc('users').onSnapshot(function (docSnap) {
        adminState.users = normalizeUsersDoc(docSnap.exists ? docSnap.data() : {});
        adminReady.users = true;
        renderUsersTable();
        renderDashboard();
    });
}

function renderDashboard() {
    document.getElementById('statProducts').textContent = adminState.products.length;
    document.getElementById('statOrders').textContent = adminState.orders.length;
    document.getElementById('statUsers').textContent = Object.keys(adminState.users).length;
    var revenue = 0;
    adminState.orders.forEach(function (order) { revenue += Number(order.totalBase) || 0; });
    document.getElementById('statRevenue').textContent = formatCurrency(revenue, 'palestine', adminState.settings);
    renderChart('ordersStatusChart', 'bar', collectOrderStatusData());
    renderChart('ordersRegionChart', 'doughnut', collectRegionData());
    renderChart('brandsChart', 'bar', collectBrandData());
}

function collectOrderStatusData() {
    var labels = ['new', 'preparing', 'prepared', 'in_delivery', 'completed', 'declined', 'returned'];
    var counts = [];
    for (var i = 0; i < labels.length; i += 1) {
        var count = 0;
        for (var j = 0; j < adminState.orders.length; j += 1) {
            if ((adminState.orders[j].status || 'new') === labels[i]) count += 1;
        }
        counts.push(count);
    }
    return {
        labels: labels.map(getOrderStatusLabel),
        datasets: [{ label: 'الطلبات', data: counts, backgroundColor: '#c9a96e' }]
    };
}

function collectRegionData() {
    var labels = ['palestine', 'jordan'];
    var counts = [];
    for (var i = 0; i < labels.length; i += 1) {
        var count = 0;
        for (var j = 0; j < adminState.orders.length; j += 1) {
            if ((adminState.orders[j].region || 'palestine') === labels[i]) count += 1;
        }
        counts.push(count);
    }
    return {
        labels: labels.map(getRegionLabel),
        datasets: [{ data: counts, backgroundColor: ['#c9a96e', '#8b6914'] }]
    };
}

function collectBrandData() {
    var brandMap = {};
    adminState.products.forEach(function (product) {
        brandMap[product.brand] = (brandMap[product.brand] || 0) + 1;
    });
    var labels = Object.keys(brandMap).slice(0, 8);
    var values = labels.map(function (key) { return brandMap[key]; });
    return {
        labels: labels,
        datasets: [{ label: 'عدد المنتجات', data: values, backgroundColor: '#a07d3f' }]
    };
}

function renderChart(id, type, data) {
    if (typeof Chart === 'undefined') return;
    if (adminState.charts[id]) adminState.charts[id].destroy();
    var ctx = document.getElementById(id);
    if (!ctx) return;
    adminState.charts[id] = new Chart(ctx, {
        type: type,
        data: data,
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } }
    });
}

function renderProductsTable() {
    var tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = adminState.products.map(function (product) {
        var firstPrice = product.sizes.length ? product.sizes[0].price : 0;
        return '<tr><td>' + escapeHtml(product.name) + '</td><td>' + escapeHtml(product.brand) + '</td><td>' + escapeHtml(product.category) + '</td><td>' + escapeHtml(product.sizes.map(function (size) { return size.label; }).join('، ')) + '</td><td>' + formatCurrency(firstPrice, 'palestine', adminState.settings) + '</td><td>' + (product.discount || 0) + '%</td><td>' + getProductStatusLabel(product.status) + '</td><td><button class="action-link" onclick="editProduct(\'' + product.id + '\')">تعديل</button><button class="action-link" onclick="deleteProduct(\'' + product.id + '\')">حذف</button></td></tr>';
    }).join('') || '<tr><td colspan="8">لا توجد منتجات.</td></tr>';
}

function openProductModal(productId) {
    document.getElementById('productForm').reset();
    document.getElementById('productOriginalId').value = '';
    document.getElementById('productModalTitle').textContent = productId ? 'تعديل منتج' : 'إضافة منتج';
    if (productId) {
        var product = getProductById(adminState.products, productId);
        if (!product) return;
        document.getElementById('productOriginalId').value = product.id;
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStatus').value = product.status;
        document.getElementById('productDiscount').value = product.discount || 0;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productSizes').value = product.sizes.map(function (size) { return size.label; }).join(',');
        document.getElementById('productPrices').value = product.sizes.map(function (size) { return size.price; }).join(',');
    }
    productModalEl.classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function editProduct(productId) {
    openProductModal(productId);
}

function parseSizesAndPrices(sizesText, pricesText) {
    var sizes = String(sizesText || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean);
    var prices = String(pricesText || '').split(',').map(function (item) { return Number(item) || 0; });
    if (!sizes.length) sizes = ['قياس موحد'];
    return sizes.map(function (label, index) {
        return { label: label, price: prices[index] != null ? prices[index] : (prices[0] || 0) };
    });
}

function saveProduct(event) {
    event.preventDefault();
    var payload = normalizeProduct({
        id: document.getElementById('productId').value,
        name: document.getElementById('productName').value,
        brand: document.getElementById('productBrand').value,
        category: document.getElementById('productCategory').value,
        status: document.getElementById('productStatus').value,
        discount: document.getElementById('productDiscount').value,
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value,
        sizes: parseSizesAndPrices(document.getElementById('productSizes').value, document.getElementById('productPrices').value)
    });
    db.collection('products').doc(payload.id).set(payload).then(function () {
        closeModal('productModal');
        setAdminStatus('تم حفظ المنتج.', 'success');
    }).catch(function () {
        setAdminStatus('تعذر حفظ المنتج.', 'error');
    });
}

function deleteProduct(productId) {
    if (adminState.currentRole !== 'admin') return;
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    db.collection('products').doc(productId).delete();
}

function renderDiscountsTable() {
    var tbody = document.getElementById('discountsTableBody');
    tbody.innerHTML = adminState.discounts.map(function (discount) {
        return '<tr><td>' + escapeHtml(discount.title) + '</td><td>' + escapeHtml(discount.type) + '</td><td>' + discount.percentage + '%</td><td>' + escapeHtml(discount.expiresAt || '-') + '</td><td><button class="action-link" onclick="editDiscount(\'' + discount.id + '\')">تعديل</button><button class="action-link" onclick="deleteDiscount(\'' + discount.id + '\')">حذف</button></td></tr>';
    }).join('') || '<tr><td colspan="5">لا توجد خصومات.</td></tr>';
}

function saveDiscount(event) {
    event.preventDefault();
    var payload = normalizeDiscount({
        id: document.getElementById('discountId').value || slugify(document.getElementById('discountTitle').value || 'discount'),
        title: document.getElementById('discountTitle').value,
        type: document.getElementById('discountType').value,
        value: document.getElementById('discountValues').value,
        percentage: document.getElementById('discountPercentage').value,
        description: document.getElementById('discountDescription').value,
        expiresAt: document.getElementById('discountExpiry').value
    });
    db.collection('discounts').doc(payload.id).set(payload).then(function () {
        document.getElementById('discountForm').reset();
        setAdminStatus('تم حفظ الخصم.', 'success');
    });
}

function editDiscount(id) {
    var discount = null;
    for (var i = 0; i < adminState.discounts.length; i += 1) {
        if (adminState.discounts[i].id === id) discount = adminState.discounts[i];
    }
    if (!discount) return;
    document.getElementById('discountId').value = discount.id;
    document.getElementById('discountTitle').value = discount.title;
    document.getElementById('discountType').value = discount.type;
    document.getElementById('discountValues').value = discount.values.join(', ');
    document.getElementById('discountPercentage').value = discount.percentage;
    document.getElementById('discountExpiry').value = discount.expiresAt;
    document.getElementById('discountDescription').value = discount.description;
}

function deleteDiscount(id) {
    if (adminState.currentRole !== 'admin') return;
    if (!confirm('حذف الخصم؟')) return;
    db.collection('discounts').doc(id).delete();
}

function renderSettingsForm() {
    document.getElementById('settingsWhatsapp').value = adminState.settings.whatsappNumber;
    document.getElementById('settingsInstagram').value = adminState.settings.instagramLink;
    document.getElementById('settingsHeroSubtitle').value = adminState.settings.heroSubtitle;
    document.getElementById('settingsConversionRate').value = adminState.settings.conversionRate;
    document.getElementById('settingsAbout').value = adminState.settings.aboutText;
    document.getElementById('paymentCod').checked = adminState.settings.paymentMethods.indexOf('cod') >= 0;
    document.getElementById('paymentVisa').checked = adminState.settings.paymentMethods.indexOf('visa') >= 0;
    renderDeliveryRows('palestine', adminState.settings.deliveryRegions.palestine);
    renderDeliveryRows('jordan', adminState.settings.deliveryRegions.jordan);
}

function renderDeliveryRows(region, list) {
    var container = document.getElementById(region === 'palestine' ? 'deliveryRegionsPalestine' : 'deliveryRegionsJordan');
    container.innerHTML = safeArray(list).map(function (item, index) {
        return '<div class="delivery-row"><input data-region="' + region + '" data-field="name" data-index="' + index + '" value="' + escapeHtml(item.name) + '"><input data-region="' + region + '" data-field="price" data-index="' + index + '" type="number" value="' + item.price + '"><button type="button" class="ghost-btn" onclick="removeDeliveryRow(\'' + region + '\',' + index + ')">×</button></div>';
    }).join('');
}

function addDeliveryRow(region) {
    adminState.settings.deliveryRegions[region].push({ id: slugify(region + '-' + Date.now()), name: region === 'palestine' ? 'منطقة جديدة' : 'الأردن', price: 0 });
    renderSettingsForm();
}

function removeDeliveryRow(region, index) {
    adminState.settings.deliveryRegions[region].splice(index, 1);
    renderSettingsForm();
}

function collectDeliveryRows(region) {
    var container = document.getElementById(region === 'palestine' ? 'deliveryRegionsPalestine' : 'deliveryRegionsJordan');
    var rows = container.querySelectorAll('.delivery-row');
    var results = [];
    for (var i = 0; i < rows.length; i += 1) {
        var inputs = rows[i].querySelectorAll('input');
        results.push({ id: slugify(region + '-' + i + '-' + inputs[0].value), name: inputs[0].value, price: Number(inputs[1].value) || 0 });
    }
    return results;
}

function saveSettings(event) {
    event.preventDefault();
    var settings = normalizeSettings({
        whatsappNumber: document.getElementById('settingsWhatsapp').value,
        instagramLink: document.getElementById('settingsInstagram').value,
        heroSubtitle: document.getElementById('settingsHeroSubtitle').value,
        aboutText: document.getElementById('settingsAbout').value,
        conversionRate: document.getElementById('settingsConversionRate').value,
        paymentMethods: [document.getElementById('paymentCod').checked ? 'cod' : '', document.getElementById('paymentVisa').checked ? 'visa' : ''],
        deliveryRegions: {
            palestine: collectDeliveryRows('palestine'),
            jordan: collectDeliveryRows('jordan')
        }
    });
    db.collection('settings').doc('config').set(settings).then(function () {
        setAdminStatus('تم حفظ الإعدادات.', 'success');
    }).catch(function () {
        setAdminStatus('تعذر حفظ الإعدادات.', 'error');
    });
}

function renderUsersTable() {
    var tbody = document.getElementById('usersTableBody');
    var rows = [];
    Object.keys(adminState.users).forEach(function (username) {
        var user = adminState.users[username];
        rows.push('<tr><td>' + escapeHtml(username) + '</td><td>' + escapeHtml(user.name) + '</td><td>' + (user.role === 'worker' ? 'موظف' : 'مدير') + '</td><td><button class="action-link" onclick="editUser(\'' + username + '\')">تعديل</button><button class="action-link" onclick="resetUserPassword(\'' + username + '\')">إعادة تعيين</button><button class="action-link" onclick="removeUser(\'' + username + '\')">حذف</button></td></tr>');
    });
    tbody.innerHTML = rows.join('');
}

function saveUser(event) {
    event.preventDefault();
    if (adminState.currentRole !== 'admin') return;
    var username = String(document.getElementById('userUsername').value || '').trim();
    if (!username) return;
    adminState.users[username] = {
        name: document.getElementById('userName').value || username,
        password: document.getElementById('userPassword').value || '5555',
        role: document.getElementById('userRole').value === 'worker' ? 'worker' : 'admin'
    };
    db.collection('settings').doc('users').set(adminState.users).then(function () {
        document.getElementById('userForm').reset();
        setAdminStatus('تم حفظ المستخدم.', 'success');
    });
}

function editUser(username) {
    var user = adminState.users[username];
    if (!user) return;
    document.getElementById('userUsername').value = username;
    document.getElementById('userName').value = user.name;
    document.getElementById('userPassword').value = user.password;
    document.getElementById('userRole').value = user.role;
}

function removeUser(username) {
    if (adminState.currentRole !== 'admin' || username === 'aqqad') return;
    if (!confirm('حذف المستخدم؟')) return;
    delete adminState.users[username];
    db.collection('settings').doc('users').set(adminState.users);
}

function resetUserPassword(username) {
    if (adminState.currentRole !== 'admin') return;
    var newPassword = prompt('أدخل كلمة المرور الجديدة للمستخدم ' + username, '5555');
    if (newPassword == null) return;
    adminState.users[username].password = String(newPassword || '5555');
    db.collection('settings').doc('users').set(adminState.users).then(function () {
        setAdminStatus('تم تحديث كلمة المرور.', 'success');
    });
}

function getFilteredOrders() {
    var term = String(document.getElementById('orderSearchInput').value || '').trim().toLowerCase();
    var status = document.getElementById('orderStatusFilter').value;
    var region = document.getElementById('orderRegionFilter').value;
    var from = document.getElementById('orderDateFrom').value;
    var to = document.getElementById('orderDateTo').value;
    return adminState.orders.filter(function (order) {
        var created = order.createdAtIso || '';
        var haystack = [order.orderNumber, order.customerName].join(' ').toLowerCase();
        if (term && haystack.indexOf(term) < 0) return false;
        if (status && (order.status || 'new') !== status) return false;
        if (region && (order.region || 'palestine') !== region) return false;
        if (from && created.slice(0, 10) < from) return false;
        if (to && created.slice(0, 10) > to) return false;
        return true;
    });
}

function renderOrdersTable() {
    var tbody = document.getElementById('ordersTableBody');
    var orders = getFilteredOrders();
    tbody.innerHTML = orders.map(function (order) {
        var itemsText = safeArray(order.items).map(function (item) { return item.name + ' x' + item.qty; }).join('، ');
        var statusSelect = '<select class="status-select" onchange="updateOrderStatus(\'' + order._docId + '\', this.value)">'
            + ['new', 'preparing', 'prepared', 'in_delivery', 'completed', 'declined', 'returned'].map(function (status) {
                return '<option value="' + status + '" ' + ((order.status || 'new') === status ? 'selected' : '') + '>' + getOrderStatusLabel(status) + '</option>';
            }).join('') + '</select>';
        return '<tr><td>' + escapeHtml(order.orderNumber || '') + '</td><td>' + escapeHtml(formatDateTime(order.createdAt || order.createdAtIso)) + '</td><td>' + escapeHtml(order.customerName || '') + '</td><td>' + escapeHtml(order.phone || '') + '</td><td>' + escapeHtml(order.regionLabel || getRegionLabel(order.region || 'palestine')) + '</td><td>' + formatCurrency(order.totalBase || 0, order.region || 'palestine', adminState.settings) + '</td><td>' + escapeHtml(order.paymentLabel || getPaymentMethodLabel(order.paymentMethod || 'cod')) + '</td><td>' + statusSelect + '</td><td>' + escapeHtml(itemsText) + '</td></tr>';
    }).join('') || '<tr><td colspan="9">لا توجد طلبات مطابقة.</td></tr>';
}

function updateOrderStatus(docId, status) {
    db.collection('orders').doc(docId).update({ status: status, statusLabel: getOrderStatusLabel(status), updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAtIso: new Date().toISOString() });
}

function exportProductsCsv() {
    var rows = adminState.products.map(function (product) {
        return {
            name: product.name,
            brand: product.brand,
            category: product.category,
            sizes: product.sizes.map(function (size) { return size.label; }).join('; '),
            prices: product.sizes.map(function (size) { return size.price; }).join('; '),
            discount: product.discount,
            status: product.status,
            image: product.image,
            description: product.description
        };
    });
    downloadCsv('aqqad-products.csv', rows);
}

function exportOrders() {
    var rows = getFilteredOrders().map(function (order) {
        return {
            orderId: order.orderNumber,
            date: order.createdAtIso,
            customerName: order.customerName,
            phone: order.phone,
            items: safeArray(order.items).map(function (item) { return item.name + ' x' + item.qty; }).join('; '),
            total: order.totalFormatted || formatCurrency(order.totalBase || 0, order.region || 'palestine', adminState.settings),
            deliveryMethod: order.deliveryName,
            region: order.regionLabel,
            status: getOrderStatusLabel(order.status || 'new'),
            paymentMethod: order.paymentLabel
        };
    });
    var format = document.getElementById('ordersExportFormat').value;
    if (format === 'xlsx' && typeof XLSX !== 'undefined') {
        var sheet = XLSX.utils.json_to_sheet(rows);
        var workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, 'Orders');
        XLSX.writeFile(workbook, 'aqqad-orders.xlsx');
        return;
    }
    downloadCsv('aqqad-orders.csv', rows);
}

function downloadCsv(fileName, rows) {
    var csv = typeof Papa !== 'undefined' ? Papa.unparse(rows) : fallbackUnparse(rows);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
}

function fallbackUnparse(rows) {
    if (!rows.length) return '';
    var keys = Object.keys(rows[0]);
    var lines = [keys.join(',')];
    rows.forEach(function (row) {
        lines.push(keys.map(function (key) { return '\"' + String(row[key] == null ? '' : row[key]).replace(/\"/g, '\"\"') + '\"'; }).join(','));
    });
    return lines.join('\n');
}

function importProductsFile() {
    if (adminState.currentRole !== 'admin') return;
    var input = document.getElementById('importProductsFile');
    var mode = document.getElementById('importMode').value;
    if (!input.files || !input.files[0]) {
        setAdminStatus('اختاري ملفاً أولاً.', 'error');
        return;
    }
    parseFileRows(input.files[0], function (rows) {
        var list = convertRowsToProducts(rows);
        if (!list.length) {
            setAdminStatus('لم يتم العثور على منتجات صالحة في الملف.', 'error');
            return;
        }
        importProducts(list, mode);
    });
}

function parseFileRows(file, callback) {
    var name = String(file.name || '').toLowerCase();
    if ((name.indexOf('.xlsx') >= 0 || name.indexOf('.xls') >= 0) && typeof XLSX !== 'undefined') {
        var reader = new FileReader();
        reader.onload = function (event) {
            var workbook = XLSX.read(event.target.result, { type: 'array' });
            var sheetName = workbook.SheetNames[0];
            callback(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }));
        };
        reader.readAsArrayBuffer(file);
        return;
    }
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: function (result) { callback(result.data || []); } });
}

function convertRowsToProducts(rows) {
    var map = {};
    rows.forEach(function (row) {
        var keys = {};
        Object.keys(row).forEach(function (key) { keys[key.toLowerCase()] = row[key]; });
        var name = keys.name || keys['اسم المنتج'] || keys.product || '';
        if (!name) return;
        var brand = keys.brand || keys['البراند'] || '';
        var category = keys.category || keys['الفئة'] || 'ملابس';
        var id = keys.id || slugify(name + '-' + brand + '-' + category);
        if (!map[id]) {
            map[id] = { id: id, name: name, brand: brand, category: category, image: keys.image || keys['image url'] || '', discount: Number(keys.discount || 0) || 0, status: keys.status || 'active', description: keys.description || '', sizes: [] };
        }
        var sizeField = keys.size || keys.sizes || keys['المقاس'] || keys['المقاسات'] || 'قياس موحد';
        var priceField = keys.price || keys.prices || keys['السعر'] || '0';
        var sizes = String(sizeField).split(';');
        var prices = String(priceField).split(';');
        for (var i = 0; i < sizes.length; i += 1) {
            var label = String(sizes[i] || '').trim();
            if (!label) continue;
            map[id].sizes.push({ label: label, price: Number(prices[i] != null ? prices[i] : prices[0]) || 0 });
        }
    });
    return Object.keys(map).map(function (key) { return normalizeProduct(map[key]); });
}

function importProducts(list, mode) {
    var run = Promise.resolve();
    if (mode === 'replace') run = clearCollection('products');
    run.then(function () {
        var batch = db.batch();
        list.forEach(function (product) { batch.set(db.collection('products').doc(product.id), product); });
        return batch.commit();
    }).then(function () {
        setAdminStatus('تم استيراد المنتجات بنجاح.', 'success');
        document.getElementById('importProductsFile').value = '';
    }).catch(function () {
        setAdminStatus('تعذر استيراد المنتجات.', 'error');
    });
}
