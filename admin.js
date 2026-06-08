var adminState = {
    currentUser: null,
    currentRole: '',
    products: [],
    discounts: [],
    orders: [],
    settings: normalizeSettings(DEFAULT_SITE_SETTINGS),
    users: normalizeUsersDoc({}),
    heroSlides: normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()).slides,
    productDraft: null,
    charts: {},
    subscriptionsStarted: false
};
var productModalEl = null;
var draggedHeroId = '';

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
        seedFirestoreData(true).then(function () { setAdminStatus('تم زرع البيانات بنجاح.', 'success'); }).catch(function () { setAdminStatus('تعذر زرع البيانات.', 'error'); });
    });
    document.getElementById('newProductBtn').addEventListener('click', function () { openProductModal(); });
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    document.getElementById('addSizeBtn').addEventListener('click', addDraftSizeFromInput);
    document.getElementById('addColorBtn').addEventListener('click', function () { addDraftColor(); });
    document.getElementById('applyPresetSizesBtn').addEventListener('click', applyPresetSizesToDraft);
    document.getElementById('productType').addEventListener('change', handleProductTypeChange);
    document.getElementById('productAgeGroup').addEventListener('change', handleProductTypeChange);
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
    document.getElementById('heroSlidesUploader').addEventListener('change', uploadHeroFiles);
    document.getElementById('saveHeroSlidesBtn').addEventListener('click', persistHeroSlides);
    productModalEl = document.getElementById('productModal');
    document.body.addEventListener('click', function (event) {
        var closeTarget = event.target.getAttribute('data-close-modal');
        if (closeTarget) closeModal(closeTarget);
        var removeSize = event.target.getAttribute('data-remove-size');
        if (removeSize) removeDraftSize(removeSize);
        var removeColor = event.target.getAttribute('data-remove-color');
        if (removeColor != null) removeDraftColor(parseInt(removeColor, 10) || 0);
    });
    document.body.addEventListener('input', function (event) {
        handleProductDraftInput(event);
    });
    document.body.addEventListener('change', function (event) {
        handleProductDraftChange(event);
    });
    var tabs = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabs.length; i += 1) {
        tabs[i].addEventListener('click', function (event) { switchTab(event.currentTarget.getAttribute('data-tab')); });
    }
}

function setAdminStatus(message, type) {
    var node = document.getElementById('adminStatus');
    if (!message) {
        node.className = 'admin-status hidden';
        node.textContent = '';
        node.style.color = '';
        return;
    }
    node.className = 'admin-status';
    node.textContent = message;
    node.style.color = type === 'error' ? '#9f1d35' : '#8f6128';
}

function saveSession(user) { sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user)); }

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
    var errorNode = document.getElementById('loginError');
    if (!username || !password) { errorNode.textContent = 'أدخلي اسم المستخدم وكلمة المرور.'; return; }
    if (!window.db) { errorNode.textContent = 'فايربيس غير متاح حالياً.'; return; }
    db.collection('settings').doc('users').get().then(function (docSnap) {
        var users = normalizeUsersDoc(docSnap.exists ? docSnap.data() : {});
        var record = users[username];
        if (!record || record.password !== password) { errorNode.textContent = 'بيانات الدخول غير صحيحة.'; return; }
        adminState.currentUser = { username: username, role: record.role, name: record.name || username };
        adminState.currentRole = record.role;
        saveSession(adminState.currentUser);
        showAdminApp();
        initializeAdmin();
    }).catch(function () { errorNode.textContent = 'تعذر التحقق من المستخدم.'; });
}

function showAdminApp() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('currentUserLabel').textContent = (adminState.currentUser ? adminState.currentUser.name : '') + ' - ' + (adminState.currentRole === 'worker' ? 'موظف الطلبات' : 'مدير');
    applyRolePermissions();
}

function logoutAdmin() { sessionStorage.removeItem(ADMIN_SESSION_KEY); window.location.reload(); }

function applyRolePermissions() {
    var isWorker = adminState.currentRole === 'worker';
    var hiddenTabs = ['dashboard', 'products', 'discounts', 'settings', 'hero', 'users'];
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
    for (var i = 0; i < buttons.length; i += 1) buttons[i].classList.toggle('active', buttons[i].getAttribute('data-tab') === tab);
    for (var j = 0; j < panels.length; j += 1) panels[j].classList.toggle('active', panels[j].id === 'tab-' + tab);
    var titles = { dashboard: 'لوحة المؤشرات', products: 'إدارة المنتجات', orders: 'إدارة الطلبات', discounts: 'إدارة الخصومات', settings: 'إعدادات المتجر', hero: 'شرائح الواجهة الرئيسية', users: 'إدارة الموظفين' };
    document.getElementById('tabTitle').textContent = titles[tab] || 'لوحة الإدارة';
}

function initializeAdmin() {
    if (!window.db) { setAdminStatus('فايربيس غير متاح.', 'error'); return; }
    setAdminStatus('جاري تحميل البيانات...', '');
    ensureDefaults().then(function () { if (!adminState.subscriptionsStarted) subscribeData(); }).catch(function () { setAdminStatus('تعذر تهيئة المشروع.', 'error'); });
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
        return db.collection('settings').doc('heroSlides').get();
    }).then(function (heroDoc) {
        if (!heroDoc.exists) return db.collection('settings').doc('heroSlides').set(normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()));
        return null;
    }).then(function () {
        return db.collection('products').limit(1).get();
    }).then(function (snapshot) {
        if (snapshot.empty) return seedFirestoreData(false);
        return false;
    });
}

function subscribeData() {
    adminState.subscriptionsStarted = true;
    db.collection('products').onSnapshot(function (snapshot) {
        adminState.products = snapshot.docs.map(function (docSnap) { var data = docSnap.data(); data.id = docSnap.id; return normalizeProduct(data); });
        renderProductsTable();
        renderDashboard();
        setAdminStatus('', '');
    });
    db.collection('discounts').onSnapshot(function (snapshot) {
        adminState.discounts = snapshot.docs.map(function (docSnap) { var data = docSnap.data(); data.id = docSnap.id; return normalizeDiscount(data); });
        renderDiscountsTable();
    });
    db.collection('orders').onSnapshot(function (snapshot) {
        adminState.orders = snapshot.docs.map(function (docSnap) { var data = docSnap.data(); data._docId = docSnap.id; return data; });
        renderOrdersTable();
        renderDashboard();
    });
    db.collection('settings').doc('config').onSnapshot(function (docSnap) {
        adminState.settings = normalizeSettings(docSnap.exists ? docSnap.data() : DEFAULT_SITE_SETTINGS);
        renderSettingsForm();
        renderDashboard();
    });
    db.collection('settings').doc('users').onSnapshot(function (docSnap) {
        adminState.users = normalizeUsersDoc(docSnap.exists ? docSnap.data() : {});
        renderUsersTable();
        renderDashboard();
    });
    db.collection('settings').doc('heroSlides').onSnapshot(function (docSnap) {
        adminState.heroSlides = normalizeHeroSlidesDoc(docSnap.exists ? docSnap.data() : getDefaultHeroSlidesDoc()).slides;
        renderHeroSlides();
    });
}

function renderDashboard() {
    document.getElementById('statProducts').textContent = adminState.products.length;
    document.getElementById('statOrders').textContent = adminState.orders.length;
    document.getElementById('statUsers').textContent = Object.keys(adminState.users).length;
    var revenue = 0;
    for (var i = 0; i < adminState.orders.length; i += 1) revenue += Number(adminState.orders[i].totalBase) || 0;
    document.getElementById('statRevenue').textContent = formatCurrency(revenue, 'palestine', adminState.settings);
    renderChart('ordersStatusChart', 'bar', collectOrderStatusData());
    renderChart('ordersRegionChart', 'doughnut', collectRegionData());
    renderChart('brandsChart', 'bar', collectBrandData());
}

function collectOrderStatusData() {
    var labels = ['new', 'preparing', 'prepared', 'in_delivery', 'completed', 'declined', 'returned'];
    var counts = labels.map(function (status) {
        var count = 0;
        for (var i = 0; i < adminState.orders.length; i += 1) if ((adminState.orders[i].status || 'new') === status) count += 1;
        return count;
    });
    return { labels: labels.map(getOrderStatusLabel), datasets: [{ label: 'الطلبات', data: counts, backgroundColor: ['#c89f5b', '#f2b87c', '#d7f4e7', '#e2dbff', '#8f6128', '#e48ba2', '#b8a4e6'] }] };
}

function collectRegionData() {
    var labels = ['palestine', 'jordan'];
    var counts = labels.map(function (region) {
        var count = 0;
        for (var i = 0; i < adminState.orders.length; i += 1) if ((adminState.orders[i].region || 'palestine') === region) count += 1;
        return count;
    });
    return { labels: labels.map(getRegionLabel), datasets: [{ data: counts, backgroundColor: ['#c89f5b', '#b59bf0'] }] };
}

function collectBrandData() {
    var map = {};
    for (var i = 0; i < adminState.products.length; i += 1) map[adminState.products[i].brand] = (map[adminState.products[i].brand] || 0) + 1;
    var labels = Object.keys(map);
    return { labels: labels, datasets: [{ label: 'عدد المنتجات', data: labels.map(function (key) { return map[key]; }), backgroundColor: '#8f6128' }] };
}

function renderChart(id, type, data) {
    if (typeof Chart === 'undefined') return;
    if (adminState.charts[id]) adminState.charts[id].destroy();
    var ctx = document.getElementById(id);
    if (!ctx) return;
    adminState.charts[id] = new Chart(ctx, { type: type, data: data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } } });
}

function renderProductsTable() {
    var tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = adminState.products.map(function (product) {
        var firstVariant = getDefaultVariant(product) || (product.variants[0] || { price: 0 });
        return '<tr><td>' + escapeHtml(product.name) + '</td><td>' + escapeHtml(getTypeLabel(product.type)) + '</td><td>' + escapeHtml(getAgeGroupLabel(product.ageGroup)) + '</td><td>' + escapeHtml(product.brand) + '</td><td>' + formatCurrency(firstVariant.price || 0, 'palestine', adminState.settings) + '</td><td>' + getTotalStock(product) + '</td><td>' + escapeHtml(getProductStatusLabel(product.status)) + '</td><td><button class="action-link" onclick="editProduct(\'' + product.id + '\')">تعديل</button><button class="action-link" onclick="deleteProduct(\'' + product.id + '\')">حذف</button></td></tr>';
    }).join('') || '<tr><td colspan="8">لا توجد منتجات حالياً.</td></tr>';
}

function createDraftVariantMatrix(sizeLabels, colors, existingVariants) {
    var draft = [];
    for (var i = 0; i < sizeLabels.length; i += 1) {
        for (var j = 0; j < colors.length; j += 1) {
            var found = null;
            for (var k = 0; k < existingVariants.length; k += 1) {
                if (existingVariants[k].size === sizeLabels[i] && existingVariants[k].color === colors[j].name) {
                    found = existingVariants[k];
                    break;
                }
            }
            draft.push(found || { size: sizeLabels[i], color: colors[j].name, stock: 0, price: 0 });
        }
    }
    return draft;
}

function makeDefaultDraft(type, ageGroup) {
    var safeType = type || 'clothes';
    var safeAgeGroup = ageGroup || (safeType === 'clothes' ? 'baby' : '');
    var sizes = getDefaultSizeLabels(safeType, safeAgeGroup);
    var colors = [{ name: 'الافتراضي', hex: '#d9d9d9', images: [] }];
    var variants = createDraftVariantMatrix(sizes, colors, []);
    return { sizes: sizes, colors: colors, variants: variants };
}

function cloneProductToDraft(product) {
    var sizes = getProductSizeLabels(product);
    var colors = cloneObject(product.colors || []);
    var variants = cloneObject(product.variants || []);
    return { sizes: sizes, colors: colors, variants: variants };
}

function syncProductDraft() {
    if (!adminState.productDraft) adminState.productDraft = makeDefaultDraft('clothes', 'baby');
    if (!adminState.productDraft.colors.length) adminState.productDraft.colors = [{ name: 'الافتراضي', hex: '#d9d9d9', images: [] }];
    if (!adminState.productDraft.sizes.length) adminState.productDraft.sizes = ['واحد'];
    adminState.productDraft.variants = createDraftVariantMatrix(adminState.productDraft.sizes, adminState.productDraft.colors, adminState.productDraft.variants || []);
}

function renderDraftSizes() {
    var node = document.getElementById('productSizesList');
    if (!node || !adminState.productDraft) return;
    node.innerHTML = adminState.productDraft.sizes.map(function (size) {
        return '<span class="token-chip">' + escapeHtml(size) + '<button type="button" data-remove-size="' + escapeHtml(size) + '">×</button></span>';
    }).join('');
}

function renderDraftColors() {
    var node = document.getElementById('productColorsList');
    if (!node || !adminState.productDraft) return;
    node.innerHTML = adminState.productDraft.colors.map(function (color, index) {
        return '<div class="color-editor-row"><div class="stack"><input type="text" data-color-name="' + index + '" value="' + escapeHtml(color.name) + '" placeholder="اسم اللون"><div class="mini-help">أضيفي روابط الصور مفصولة بسطر جديد أو فاصلة.</div><textarea rows="3" data-color-images="' + index + '" placeholder="رابط صورة لكل لون">' + escapeHtml((color.images || []).join('\n')) + '</textarea><input type="file" data-color-files="' + index + '" accept="image/*" multiple></div><input type="color" data-color-hex="' + index + '" value="' + escapeHtml(color.hex || '#d9d9d9') + '"><div class="stack"><div class="color-preview" style="background:' + escapeHtml(color.hex || '#d9d9d9') + '"></div><div class="mini-help">' + ((color.images || []).length ? 'عدد الصور: ' + color.images.length : 'لا توجد صور بعد') + '</div></div><div class="color-row-tools"><button class="ghost-btn" type="button" data-remove-color="' + index + '">حذف اللون</button></div></div>';
    }).join('');
}

function renderDraftVariantsGrid() {
    var node = document.getElementById('productVariantsGrid');
    if (!node || !adminState.productDraft) return;
    var colors = adminState.productDraft.colors;
    var sizes = adminState.productDraft.sizes;
    var head = colors.map(function (color) { return '<th>' + escapeHtml(color.name) + '</th>'; }).join('');
    var body = sizes.map(function (size) {
        var cells = colors.map(function (color) {
            var variant = getDraftVariant(size, color.name);
            return '<td><div class="variant-cell"><label>المخزون<input type="number" min="0" data-variant-stock="' + escapeHtml(size + '||' + color.name) + '" value="' + (variant ? variant.stock : 0) + '"></label><label>السعر<input type="number" min="0" step="0.01" data-variant-price="' + escapeHtml(size + '||' + color.name) + '" value="' + (variant ? variant.price : 0) + '"></label></div></td>';
        }).join('');
        return '<tr><th>' + escapeHtml(size) + '</th>' + cells + '</tr>';
    }).join('');
    node.innerHTML = '<table class="variant-grid-table"><thead><tr><th>المقاس \\ اللون</th>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
}

function renderProductDraftSections() {
    syncProductDraft();
    renderDraftSizes();
    renderDraftColors();
    renderDraftVariantsGrid();
}

function getDraftVariant(size, colorName) {
    if (!adminState.productDraft) return null;
    for (var i = 0; i < adminState.productDraft.variants.length; i += 1) {
        if (adminState.productDraft.variants[i].size === size && adminState.productDraft.variants[i].color === colorName) return adminState.productDraft.variants[i];
    }
    return null;
}

function updateDraftVariantField(key, field, value) {
    var parts = String(key || '').split('||');
    var variant = getDraftVariant(parts[0], parts[1]);
    if (!variant) return;
    if (field === 'stock') variant.stock = Math.max(0, parseInt(value, 10) || 0);
    if (field === 'price') variant.price = Math.max(0, Number(value) || 0);
}

function handleProductTypeChange() {
    var type = document.getElementById('productType').value;
    var ageGroup = document.getElementById('productAgeGroup').value;
    if (!adminState.productDraft) adminState.productDraft = makeDefaultDraft(type, ageGroup);
    if (type !== 'clothes') document.getElementById('productAgeGroup').value = '';
    applyPresetSizesToDraft();
}

function applyPresetSizesToDraft() {
    var type = document.getElementById('productType').value;
    var ageGroup = document.getElementById('productAgeGroup').value;
    adminState.productDraft.sizes = getDefaultSizeLabels(type, ageGroup);
    renderProductDraftSections();
}

function addDraftSizeFromInput() {
    var input = document.getElementById('newSizeInput');
    addDraftSize(input.value);
    input.value = '';
}

function addDraftSize(value) {
    if (!adminState.productDraft) adminState.productDraft = makeDefaultDraft(document.getElementById('productType').value, document.getElementById('productAgeGroup').value);
    var size = String(value || '').trim();
    if (!size || adminState.productDraft.sizes.indexOf(size) >= 0) return;
    adminState.productDraft.sizes.push(size);
    renderProductDraftSections();
}

function removeDraftSize(size) {
    if (!adminState.productDraft || adminState.productDraft.sizes.length <= 1) return;
    adminState.productDraft.sizes = adminState.productDraft.sizes.filter(function (item) { return item !== size; });
    renderProductDraftSections();
}

function addDraftColor() {
    if (!adminState.productDraft) adminState.productDraft = makeDefaultDraft(document.getElementById('productType').value, document.getElementById('productAgeGroup').value);
    adminState.productDraft.colors.push({ name: 'لون ' + (adminState.productDraft.colors.length + 1), hex: '#d9d9d9', images: [] });
    renderProductDraftSections();
}

function removeDraftColor(index) {
    if (!adminState.productDraft || adminState.productDraft.colors.length <= 1) return;
    adminState.productDraft.colors.splice(index, 1);
    renderProductDraftSections();
}

function handleProductDraftInput(event) {
    var target = event.target;
    if (!adminState.productDraft) return;
    if (target.getAttribute('data-color-name') != null) {
        var colorIndex = parseInt(target.getAttribute('data-color-name'), 10) || 0;
        var oldName = adminState.productDraft.colors[colorIndex].name;
        var newName = String(target.value || '').trim() || 'لون';
        adminState.productDraft.colors[colorIndex].name = newName;
        for (var i = 0; i < adminState.productDraft.variants.length; i += 1) {
            if (adminState.productDraft.variants[i].color === oldName) adminState.productDraft.variants[i].color = newName;
        }
        renderProductDraftSections();
    }
    if (target.getAttribute('data-color-hex') != null) {
        adminState.productDraft.colors[parseInt(target.getAttribute('data-color-hex'), 10) || 0].hex = String(target.value || '#d9d9d9');
        renderProductDraftSections();
    }
    if (target.getAttribute('data-color-images') != null) {
        adminState.productDraft.colors[parseInt(target.getAttribute('data-color-images'), 10) || 0].images = String(target.value || '').split(/[\n,]/).map(function (item) { return String(item || '').trim(); }).filter(Boolean);
    }
    if (target.getAttribute('data-variant-stock') != null) updateDraftVariantField(target.getAttribute('data-variant-stock'), 'stock', target.value);
    if (target.getAttribute('data-variant-price') != null) updateDraftVariantField(target.getAttribute('data-variant-price'), 'price', target.value);
}

function handleProductDraftChange(event) {
    var target = event.target;
    if (target.getAttribute('data-color-files') != null && target.files && target.files.length) {
        var index = parseInt(target.getAttribute('data-color-files'), 10) || 0;
        var tasks = [];
        for (var i = 0; i < target.files.length; i += 1) tasks.push(readFileAsDataUrl(target.files[i]));
        Promise.all(tasks).then(function (results) {
            var images = adminState.productDraft.colors[index].images || [];
            for (var j = 0; j < results.length; j += 1) images.push(results[j].data);
            adminState.productDraft.colors[index].images = images;
            renderDraftColors();
        });
    }
}

function openProductModal(productId) {
    document.getElementById('productForm').reset();
    document.getElementById('newSizeInput').value = '';
    document.getElementById('productOriginalId').value = '';
    document.getElementById('productModalTitle').textContent = productId ? 'تعديل منتج' : 'إضافة منتج';
    if (productId) {
        var product = getProductById(adminState.products, productId);
        if (!product) return;
        adminState.productDraft = cloneProductToDraft(product);
        document.getElementById('productOriginalId').value = product.id;
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productType').value = product.type;
        document.getElementById('productAgeGroup').value = product.ageGroup || '';
        document.getElementById('productSubCategory').value = product.subCategory || 'accessories';
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('productStatus').value = product.status === 'hidden' ? 'hidden' : 'active';
        document.getElementById('productDiscount').value = product.discount || 0;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productDescription').value = product.description;
    } else {
        document.getElementById('productType').value = 'clothes';
        document.getElementById('productAgeGroup').value = 'baby';
        document.getElementById('productSubCategory').value = 'accessories';
        document.getElementById('productStatus').value = 'active';
        adminState.productDraft = makeDefaultDraft('clothes', 'baby');
    }
    renderProductDraftSections();
    productModalEl.classList.remove('hidden');
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function editProduct(productId) { openProductModal(productId); }

function saveProduct(event) {
    event.preventDefault();
    if (adminState.currentRole !== 'admin') return;
    syncProductDraft();
    var rawId = String(document.getElementById('productId').value || '').trim();
    var originalId = String(document.getElementById('productOriginalId').value || '').trim();
    if (!/^[0-9]+$/.test(rawId)) {
        setAdminStatus('يجب أن يكون معرّف المنتج رقمياً فقط.', 'error');
        return;
    }
    var payload = normalizeProduct({
        id: rawId,
        name: document.getElementById('productName').value,
        type: document.getElementById('productType').value,
        ageGroup: document.getElementById('productAgeGroup').value,
        subCategory: document.getElementById('productSubCategory').value,
        brand: document.getElementById('productBrand').value,
        status: document.getElementById('productStatus').value,
        discount: document.getElementById('productDiscount').value,
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value,
        colors: adminState.productDraft.colors,
        variants: adminState.productDraft.variants
    });
    db.collection('products').doc(payload.id).set(payload).then(function () {
        if (originalId && originalId !== payload.id) return db.collection('products').doc(originalId).delete();
        return null;
    }).then(function () {
        closeModal('productModal');
        setAdminStatus('تم حفظ المنتج.', 'success');
    }).catch(function () { setAdminStatus('تعذر حفظ المنتج.', 'error'); });
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
    if (adminState.currentRole !== 'admin') return;
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
    var discount = adminState.discounts.filter(function (item) { return item.id === id; })[0];
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
    document.getElementById('settingsStoreName').value = adminState.settings.storeNameAr;
    document.getElementById('settingsHeadline').value = adminState.settings.storeHeadline;
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
        return '<div class="delivery-row"><input data-region="' + region + '" data-field="name" data-index="' + index + '" value="' + escapeHtml(item.name) + '"><input data-region="' + region + '" data-field="price" data-index="' + index + '" type="number" value="' + item.price + '"><button class="ghost-btn" type="button" onclick="removeDeliveryRow(\'' + region + '\',' + index + ')">×</button></div>';
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
    if (adminState.currentRole !== 'admin') return;
    var settings = normalizeSettings({
        storeNameAr: document.getElementById('settingsStoreName').value,
        storeHeadline: document.getElementById('settingsHeadline').value,
        whatsappNumber: document.getElementById('settingsWhatsapp').value,
        instagramLink: document.getElementById('settingsInstagram').value,
        heroSubtitle: document.getElementById('settingsHeroSubtitle').value,
        aboutText: document.getElementById('settingsAbout').value,
        conversionRate: document.getElementById('settingsConversionRate').value,
        paymentMethods: [document.getElementById('paymentCod').checked ? 'cod' : '', document.getElementById('paymentVisa').checked ? 'visa' : ''],
        deliveryRegions: { palestine: collectDeliveryRows('palestine'), jordan: collectDeliveryRows('jordan') }
    });
    db.collection('settings').doc('config').set(settings).then(function () {
        setAdminStatus('تم حفظ الإعدادات.', 'success');
    }).catch(function () { setAdminStatus('تعذر حفظ الإعدادات.', 'error'); });
}

function renderHeroSlides() {
    var container = document.getElementById('heroSlidesList');
    container.innerHTML = adminState.heroSlides.map(function (slide, index) {
        var preview = slide.type === 'video' ? '<video src="' + escapeHtml(slide.url) + '" muted loop></video>' : '<img src="' + escapeHtml(slide.url) + '" alt="' + escapeHtml(slide.text || 'شريحة') + '">';
        return '<div class="hero-slide-item" draggable="true" data-hero-id="' + escapeHtml(slide.id) + '"><div class="hero-slide-preview">' + preview + '</div><div class="stack"><strong>الشريحة #' + (index + 1) + '</strong><input type="text" value="' + escapeHtml(slide.text) + '" oninput="updateHeroText(\'' + slide.id + '\', this.value)"><div class="muted">النوع: ' + escapeHtml(slide.type) + '</div></div><div class="hero-slide-tools"><button class="ghost-btn" type="button" onclick="deleteHeroSlide(\'' + slide.id + '\')">حذف</button><span class="pill">اسحبي للترتيب</span></div></div>';
    }).join('') || '<div class="muted">لا توجد شرائح حتى الآن.</div>';
    bindHeroDragDrop();
}

function bindHeroDragDrop() {
    var items = document.querySelectorAll('.hero-slide-item');
    for (var i = 0; i < items.length; i += 1) {
        items[i].addEventListener('dragstart', function (event) {
            draggedHeroId = event.currentTarget.getAttribute('data-hero-id');
            event.currentTarget.classList.add('dragging');
        });
        items[i].addEventListener('dragend', function (event) { event.currentTarget.classList.remove('dragging'); });
        items[i].addEventListener('dragover', function (event) { event.preventDefault(); });
        items[i].addEventListener('drop', function (event) {
            event.preventDefault();
            reorderHeroSlides(draggedHeroId, event.currentTarget.getAttribute('data-hero-id'));
        });
    }
}

function reorderHeroSlides(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    var slides = adminState.heroSlides.slice();
    var sourceIndex = -1;
    var targetIndex = -1;
    for (var i = 0; i < slides.length; i += 1) {
        if (slides[i].id === sourceId) sourceIndex = i;
        if (slides[i].id === targetId) targetIndex = i;
    }
    if (sourceIndex < 0 || targetIndex < 0) return;
    var moved = slides.splice(sourceIndex, 1)[0];
    slides.splice(targetIndex, 0, moved);
    adminState.heroSlides = slides.map(function (slide, index) { slide.order = index; return slide; });
    renderHeroSlides();
}

function updateHeroText(id, value) {
    for (var i = 0; i < adminState.heroSlides.length; i += 1) {
        if (adminState.heroSlides[i].id === id) adminState.heroSlides[i].text = String(value || '');
    }
}

function deleteHeroSlide(id) {
    if (adminState.currentRole !== 'admin') return;
    adminState.heroSlides = adminState.heroSlides.filter(function (slide) { return slide.id !== id; });
    if (!adminState.heroSlides.length) adminState.heroSlides = normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()).slides;
    renderHeroSlides();
}

function uploadHeroFiles(event) {
    if (adminState.currentRole !== 'admin') return;
    var files = event.target.files;
    if (!files || !files.length) return;
    var tasks = [];
    for (var i = 0; i < files.length; i += 1) tasks.push(readFileAsDataUrl(files[i]));
    Promise.all(tasks).then(function (items) {
        for (var j = 0; j < items.length; j += 1) {
            adminState.heroSlides.push({ id: 'slide-' + Date.now() + '-' + j, type: items[j].type, url: items[j].data, text: '', order: adminState.heroSlides.length + j });
        }
        renderHeroSlides();
        document.getElementById('heroSlidesUploader').value = '';
        setAdminStatus('تمت إضافة الشرائح محلياً. اضغطي حفظ الشرائح الحالية لتثبيت التغييرات.', 'success');
    });
}

function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (event) { resolve({ data: event.target.result, type: file.type.indexOf('video') === 0 ? 'video' : (file.type.indexOf('gif') >= 0 ? 'gif' : 'image') }); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function persistHeroSlides() {
    if (adminState.currentRole !== 'admin') return;
    db.collection('settings').doc('heroSlides').set(normalizeHeroSlidesDoc({ slides: adminState.heroSlides })).then(function () {
        setAdminStatus('تم حفظ الشرائح.', 'success');
    }).catch(function () { setAdminStatus('تعذر حفظ الشرائح.', 'error'); });
}

function renderUsersTable() {
    var tbody = document.getElementById('usersTableBody');
    var rows = [];
    Object.keys(adminState.users).forEach(function (username) {
        var user = adminState.users[username];
        rows.push('<tr><td>' + escapeHtml(username) + '</td><td>' + escapeHtml(user.name) + '</td><td>' + (user.role === 'worker' ? 'موظف' : 'مدير') + '</td><td><button class="action-link" onclick="editUser(\'' + username + '\')">تعديل</button><button class="action-link" onclick="resetUserPassword(\'' + username + '\')">إعادة تعيين</button><button class="action-link" onclick="removeUser(\'' + username + '\')">حذف</button></td></tr>');
    });
    tbody.innerHTML = rows.join('') || '<tr><td colspan="4">لا يوجد مستخدمون.</td></tr>';
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
        setAdminStatus('تم حفظ الموظف.', 'success');
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
    if (!confirm('حذف الموظف؟')) return;
    delete adminState.users[username];
    db.collection('settings').doc('users').set(adminState.users);
}

function resetUserPassword(username) {
    if (adminState.currentRole !== 'admin') return;
    var password = prompt('كلمة المرور الجديدة للمستخدم ' + username, '5555');
    if (password == null) return;
    adminState.users[username].password = String(password || '5555');
    db.collection('settings').doc('users').set(adminState.users).then(function () { setAdminStatus('تم تحديث كلمة المرور.', 'success'); });
}

function getFilteredOrders() {
    var term = normalizeSearchText(document.getElementById('orderSearchInput').value || '');
    var status = document.getElementById('orderStatusFilter').value;
    var region = document.getElementById('orderRegionFilter').value;
    var from = document.getElementById('orderDateFrom').value;
    var to = document.getElementById('orderDateTo').value;
    return adminState.orders.filter(function (order) {
        var haystack = normalizeSearchText([order.orderNumber, order.customerName].join(' '));
        var created = String(order.createdAtIso || '');
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
        var itemsText = safeArray(order.items).map(function (item) { return item.name + ' ' + (item.color || '-') + ' ' + (item.size || '-') + ' × ' + item.qty; }).join('، ');
        var select = '<select onchange="updateOrderStatus(\'' + order._docId + '\', this.value)">' + ['new', 'preparing', 'prepared', 'in_delivery', 'completed', 'declined', 'returned'].map(function (status) { return '<option value="' + status + '" ' + ((order.status || 'new') === status ? 'selected' : '') + '>' + getOrderStatusLabel(status) + '</option>'; }).join('') + '</select>';
        return '<tr><td>' + escapeHtml(order.orderNumber || '') + '</td><td>' + escapeHtml(formatDateTime(order.createdAt || order.createdAtIso)) + '</td><td>' + escapeHtml(order.customerName || '') + '</td><td>' + escapeHtml(order.phone || '') + '</td><td>' + escapeHtml(order.regionLabel || getRegionLabel(order.region || 'palestine')) + '</td><td>' + formatCurrency(order.totalBase || 0, order.region || 'palestine', adminState.settings) + '</td><td>' + escapeHtml(order.paymentLabel || getPaymentMethodLabel(order.paymentMethod || 'cod')) + '</td><td>' + select + '</td><td>' + escapeHtml(itemsText) + '</td></tr>';
    }).join('') || '<tr><td colspan="9">لا توجد طلبات مطابقة.</td></tr>';
}

function updateOrderStatus(docId, status) {
    db.collection('orders').doc(docId).update({ status: status, statusLabel: getOrderStatusLabel(status), updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAtIso: new Date().toISOString() });
}

function exportProductsCsv() {
    var rows = [];
    adminState.products.forEach(function (product) {
        product.variants.forEach(function (variant) {
            var color = getColorByName(product, variant.color) || { hex: '', images: [] };
            rows.push({
                id: product.id,
                name: product.name,
                type: product.type,
                ageGroup: product.ageGroup,
                subCategory: product.subCategory,
                brand: product.brand,
                discount: product.discount,
                status: product.status,
                image: product.image,
                description: product.description,
                color: variant.color,
                colorHex: color.hex || '',
                colorImages: (color.images || []).join('|'),
                size: variant.size,
                stock: variant.stock,
                price: variant.price
            });
        });
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
            items: safeArray(order.items).map(function (item) { return item.name + ' ' + (item.color || '-') + ' ' + (item.size || '-') + ' x' + item.qty; }).join('; '),
            total: order.totalFormatted || formatCurrency(order.totalBase || 0, order.region || 'palestine', adminState.settings),
            deliveryName: order.deliveryName,
            region: order.regionLabel,
            status: getOrderStatusLabel(order.status || 'new'),
            payment: order.paymentLabel
        };
    });
    if (document.getElementById('ordersExportFormat').value === 'xlsx' && typeof XLSX !== 'undefined') {
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
    var bom = '\uFEFF';
    var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
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
        lines.push(keys.map(function (key) { return '"' + String(row[key] == null ? '' : row[key]).replace(/"/g, '""') + '"'; }).join(','));
    });
    return lines.join('\n');
}

function importProductsFile() {
    if (adminState.currentRole !== 'admin') return;
    var input = document.getElementById('importProductsFile');
    if (!input.files || !input.files[0]) {
        setAdminStatus('اختاري ملفاً أولاً.', 'error');
        return;
    }
    parseFileRows(input.files[0], function (rows) {
        var list = convertRowsToProducts(rows);
        if (!list.length) {
            setAdminStatus('لم يتم العثور على منتجات صالحة.', 'error');
            return;
        }
        importProducts(list, document.getElementById('importMode').value);
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
    var grouped = {};
    rows.forEach(function (row) {
        var data = {};
        Object.keys(row).forEach(function (key) { data[key.toLowerCase()] = row[key]; });
        var id = String(data.id || '').trim();
        if (!id) return;
        if (!grouped[id]) {
            grouped[id] = {
                id: id,
                name: data.name || data['اسم المنتج'],
                type: data.type || data['النوع'] || data.category || data['الفئة'],
                ageGroup: data.agegroup || data['الفئة العمرية'],
                subCategory: data.subcategory || data['الفئة الفرعية'],
                brand: data.brand || data['البراند'],
                discount: data.discount,
                status: data.status,
                image: data.image,
                description: data.description || data['الوصف'],
                colors: [],
                variants: []
            };
        }
        var product = grouped[id];
        if (data.sizes || data.prices || data['المقاسات']) {
            var legacySizes = String(data.sizes || data['المقاسات'] || '').split(/[;,]/).map(function (item) { return String(item || '').trim(); }).filter(Boolean);
            var legacyPrices = String(data.prices || data['الأسعار'] || '').split(/[;,]/).map(function (item) { return Number(item) || 0; });
            if (!product.colors.length) product.colors.push({ name: 'الافتراضي', hex: '#d9d9d9', images: product.image ? [product.image] : [] });
            legacySizes.forEach(function (size, index) {
                product.variants.push({ size: size, color: 'الافتراضي', stock: Math.max(0, parseInt(data.stock, 10) || 10), price: legacyPrices[index] != null ? legacyPrices[index] : (legacyPrices[0] || 0) });
            });
            return;
        }
        var colorName = String(data.color || data.variant_color || 'الافتراضي').trim() || 'الافتراضي';
        var colorExists = product.colors.some(function (color) { return color.name === colorName; });
        if (!colorExists) {
            product.colors.push({
                name: colorName,
                hex: String(data.colorhex || data.color_hex || '#d9d9d9').trim() || '#d9d9d9',
                images: String(data.colorimages || data.color_images || '').split(/[|\n,]/).map(function (item) { return String(item || '').trim(); }).filter(Boolean)
            });
        }
        product.variants.push({
            size: String(data.size || data.variant_size || 'واحد').trim() || 'واحد',
            color: colorName,
            stock: Math.max(0, parseInt(data.stock, 10) || 0),
            price: Math.max(0, Number(data.price) || 0)
        });
    });
    return Object.keys(grouped).map(function (id) {
        return normalizeProduct(grouped[id]);
    }).filter(function (product) { return product.name; });
}

function importProducts(list, mode) {
    var run = Promise.resolve();
    if (mode === 'replace') run = clearCollection('products');
    run.then(function () {
        var batch = db.batch();
        list.forEach(function (product) { batch.set(db.collection('products').doc(product.id), product); });
        return batch.commit();
    }).then(function () {
        setAdminStatus('تم استيراد المنتجات.', 'success');
        document.getElementById('importProductsFile').value = '';
    }).catch(function () { setAdminStatus('تعذر استيراد المنتجات.', 'error'); });
}
