var products = normalizeProducts(DEFAULT_PRODUCTS);
var discounts = normalizeDiscounts(DEFAULT_DISCOUNTS);
var siteSettings = normalizeSettings(DEFAULT_SITE_SETTINGS);
var currentRegion = getCurrentRegion();
var currentFilter = 'all';
var searchTerm = '';
var cart = normalizeCartItems(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]'), products);
var currentProductId = '';
var currentSizeIdx = 0;
var currentQty = 1;
var readyState = { products: false, discounts: false, settings: false };

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function setStoreMessage(message) {
    var node = document.getElementById('storeNotice');
    if (!node) return;
    if (!message) {
        node.classList.add('hidden');
        node.textContent = '';
        return;
    }
    node.textContent = message;
    node.classList.remove('hidden');
}

function markReady(key) {
    readyState[key] = true;
    if (readyState.products && readyState.discounts && readyState.settings) {
        renderAll();
    }
}

function initializeStore() {
    bindStaticEvents();
    renderBrands();
    renderFilters();
    updateRegionUI();
    renderCart();
    if (!window.db) {
        setStoreMessage('تعذر الاتصال بفايربيس حالياً، سيتم عرض البيانات المحلية فقط.');
        renderAll();
        return;
    }
    db.collection('products').onSnapshot(function (snapshot) {
        products = snapshot.docs.map(function (docSnap) {
            var data = docSnap.data();
            data.id = docSnap.id;
            return normalizeProduct(data);
        });
        cart = normalizeCartItems(cart, products);
        saveCart();
        markReady('products');
    }, function () {
        markReady('products');
        setStoreMessage('تعذر تحميل المنتجات حالياً.');
    });
    db.collection('discounts').onSnapshot(function (snapshot) {
        discounts = snapshot.docs.map(function (docSnap) {
            var data = docSnap.data();
            data.id = docSnap.id;
            return normalizeDiscount(data);
        });
        markReady('discounts');
    }, function () {
        markReady('discounts');
    });
    db.collection('settings').doc('config').onSnapshot(function (docSnap) {
        siteSettings = normalizeSettings(docSnap.exists ? docSnap.data() : DEFAULT_SITE_SETTINGS);
        markReady('settings');
    }, function () {
        markReady('settings');
    });
}

document.addEventListener('DOMContentLoaded', initializeStore);

function bindStaticEvents() {
    var mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            document.getElementById('mobileMenu').classList.toggle('open');
            document.body.classList.toggle('menu-open');
        });
    }
    document.getElementById('openCartBtn').addEventListener('click', openCart);
    document.getElementById('closeCartBtn').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    document.getElementById('productModalBackdrop').addEventListener('click', closeProductModal);
    document.getElementById('productModalClose').addEventListener('click', closeProductModal);
    document.getElementById('searchInput').addEventListener('input', function (event) {
        searchTerm = String(event.target.value || '').trim().toLowerCase();
        renderProducts();
    });
    document.getElementById('regionSelector').addEventListener('change', function (event) {
        currentRegion = setCurrentRegion(event.target.value);
        updateRegionUI();
        renderProducts();
        renderCart();
        renderDelivery();
    });
    document.getElementById('trackOrderBtn').addEventListener('click', trackOrder);
}

function renderAll() {
    applySettings();
    updateRegionUI();
    renderProducts();
    renderDelivery();
    renderCart();
}

function applySettings() {
    var subtitle = document.getElementById('heroSubtitle');
    var about = document.getElementById('aboutText');
    var whatsapp = document.getElementById('whatsappLink');
    var instagram = document.getElementById('instagramLink');
    var heroInstagram = document.getElementById('heroInstagramLink');
    var taglines = document.getElementById('heroTaglines');
    if (subtitle) subtitle.textContent = siteSettings.heroSubtitle;
    if (about) about.textContent = siteSettings.aboutText;
    if (whatsapp) {
        whatsapp.href = buildWhatsAppUrl(siteSettings.whatsappNumber);
        whatsapp.textContent = siteSettings.whatsappNumber;
    }
    if (instagram) instagram.href = siteSettings.instagramLink;
    if (heroInstagram) heroInstagram.href = siteSettings.instagramLink;
    if (taglines) {
        taglines.innerHTML = safeArray(siteSettings.heroTaglines).map(function (item) {
            return '<span>' + escapeHtml(item) + '</span>';
        }).join('');
    }
}

function updateRegionUI() {
    var regionSelector = document.getElementById('regionSelector');
    var regionLabel = getRegionLabel(currentRegion) + ' • ' + getCurrencySymbol(currentRegion);
    if (regionSelector) regionSelector.value = currentRegion;
    var heroBadge = document.getElementById('heroRegionBadge');
    if (heroBadge) heroBadge.textContent = regionLabel;
    var footerText = document.getElementById('footerRegionText');
    if (footerText) footerText.textContent = regionLabel;
    var summary = document.getElementById('deliveryRegionSummary');
    if (summary) summary.textContent = 'الأسعار المعروضة حالياً لـ ' + getRegionLabel(currentRegion) + '.';
}

function renderBrands() {
    var grid = document.getElementById('brandsGrid');
    if (!grid) return;
    grid.innerHTML = BRANDS_DATA.map(function (brand) {
        return '<div class="brand-card"><img src="' + brand.logo + '" alt="' + escapeHtml(brand.name) + '"><strong>' + escapeHtml(brand.name) + '</strong></div>';
    }).join('');
}

function renderFilters() {
    var container = document.getElementById('categoryFilters');
    if (!container) return;
    var categories = ['all', 'ملابس', 'أحذية', 'إكسسوارات', 'كريمات وعطور'];
    container.innerHTML = categories.map(function (category) {
        var label = category === 'all' ? 'الكل' : category;
        return '<button class="filter-btn ' + (currentFilter === category ? 'active' : '') + '" data-category="' + category + '">' + label + '</button>';
    }).join('');
    var buttons = container.querySelectorAll('.filter-btn');
    for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].addEventListener('click', function (event) {
            currentFilter = event.currentTarget.getAttribute('data-category');
            renderFilters();
            renderProducts();
        });
    }
}

function filterProducts() {
    return products.filter(function (product) {
        var matchesCategory = currentFilter === 'all' || product.category === currentFilter;
        var haystack = [product.name, product.brand, product.category, product.description].join(' ').toLowerCase();
        var matchesSearch = !searchTerm || haystack.indexOf(searchTerm) >= 0;
        return matchesCategory && matchesSearch;
    });
}

function getProductCardHtml(product) {
    var pricing = getFinalPrice(product, 0, discounts, currentRegion, siteSettings);
    var firstSize = getPriceForSize(product, 0);
    return '<article class="product-card">'
        + '<img src="' + escapeHtml(product.image || FALLBACK_IMAGE) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=FALLBACK_IMAGE">'
        + '<div class="product-tags">'
        + '<span class="tag status">' + getProductStatusLabel(product.status) + '</span>'
        + (pricing.hasDiscount ? '<span class="tag discount">-' + pricing.discountPercent + '%</span>' : '')
        + '</div>'
        + '<h3>' + escapeHtml(product.name) + '</h3>'
        + '<div class="product-meta">' + escapeHtml(product.brand) + ' • ' + escapeHtml(product.category) + '</div>'
        + '<div class="price-block">' + (pricing.hasDiscount ? '<span class="price-old">' + pricing.originalFormatted + '</span>' : '') + '<span>' + pricing.finalFormatted + '</span></div>'
        + '<div><span class="size-chip">أول قياس: ' + escapeHtml(firstSize.label) + '</span></div>'
        + '<div class="product-actions">'
        + '<button class="btn btn-secondary" onclick="openProductModal(\'' + product.id + '\')">التفاصيل</button>'
        + '<button class="btn btn-primary" onclick="quickAddToCart(\'' + product.id + '\')" ' + (product.status === 'soldout' ? 'disabled' : '') + '>' + (product.status === 'soldout' ? 'نفد' : 'أضف للسلة') + '</button>'
        + '</div></article>';
}

function renderProducts() {
    var grid = document.getElementById('productsGrid');
    var empty = document.getElementById('emptyProductsState');
    if (!grid) return;
    var filtered = filterProducts();
    grid.innerHTML = filtered.map(getProductCardHtml).join('');
    if (!filtered.length) empty.classList.remove('hidden');
    else empty.classList.add('hidden');
}

function renderDelivery() {
    var grid = document.getElementById('deliveryGrid');
    if (!grid) return;
    var deliveryRegions = getRegionDeliveryList(siteSettings, currentRegion);
    grid.innerHTML = deliveryRegions.map(function (item) {
        var priceBase = currentRegion === 'jordan' ? item.price * siteSettings.conversionRate : item.price;
        return '<div class="delivery-card"><strong>' + escapeHtml(item.name) + '</strong><span>' + formatCurrency(priceBase, currentRegion, siteSettings) + '</span></div>';
    }).join('');
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.classList.add('cart-open');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.classList.remove('cart-open');
}

function quickAddToCart(productId) {
    var product = getProductById(products, productId);
    if (!product || product.status === 'soldout') return;
    addToCart(product.id, 0, 1);
}

function addToCart(productId, sizeIdx, qty) {
    var itemFound = null;
    for (var i = 0; i < cart.length; i += 1) {
        if (String(cart[i].id) === String(productId) && Number(cart[i].sizeIdx) === Number(sizeIdx)) {
            itemFound = cart[i];
            break;
        }
    }
    if (itemFound) itemFound.qty += Math.max(1, parseInt(qty, 10) || 1);
    else cart.push({ id: String(productId), sizeIdx: Number(sizeIdx) || 0, qty: Math.max(1, parseInt(qty, 10) || 1) });
    cart = normalizeCartItems(cart, products);
    saveCart();
    renderCart();
    openCart();
}

function changeCartQty(productId, sizeIdx, delta) {
    for (var i = 0; i < cart.length; i += 1) {
        if (String(cart[i].id) === String(productId) && Number(cart[i].sizeIdx) === Number(sizeIdx)) {
            cart[i].qty += delta;
            if (cart[i].qty <= 0) cart.splice(i, 1);
            break;
        }
    }
    saveCart();
    renderCart();
}

function removeCartItem(productId, sizeIdx) {
    cart = cart.filter(function (item) {
        return !(String(item.id) === String(productId) && Number(item.sizeIdx) === Number(sizeIdx));
    });
    saveCart();
    renderCart();
}

function renderCart() {
    var countNode = document.getElementById('cartCount');
    var itemsNode = document.getElementById('cartItems');
    var totalNode = document.getElementById('cartTotal');
    var emptyNode = document.getElementById('emptyCart');
    var itemCount = 0;
    var totalBase = 0;
    var html = [];
    cart.forEach(function (item) {
        var product = getProductById(products, item.id);
        if (!product) return;
        var sizeData = getPriceForSize(product, item.sizeIdx);
        var linePricing = getFinalPrice(product, item.sizeIdx, discounts, 'palestine', siteSettings);
        var lineTotalBase = linePricing.finalBase * item.qty;
        itemCount += item.qty;
        totalBase += lineTotalBase;
        html.push('<div class="cart-item">'
            + '<img src="' + escapeHtml(product.image || FALLBACK_IMAGE) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=FALLBACK_IMAGE">'
            + '<div><h4>' + escapeHtml(product.name) + '</h4><small>' + escapeHtml(sizeData.label) + '</small><div class="qty-controls"><button onclick="changeCartQty(\'' + product.id + '\',' + item.sizeIdx + ',-1)">-</button><span>' + item.qty + '</span><button onclick="changeCartQty(\'' + product.id + '\',' + item.sizeIdx + ',1)">+</button><button onclick="removeCartItem(\'' + product.id + '\',' + item.sizeIdx + ')">✕</button></div></div>'
            + '<div class="cart-item-price">' + formatCurrency(lineTotalBase, currentRegion, siteSettings) + '</div>'
            + '</div>');
    });
    itemsNode.innerHTML = html.join('');
    totalNode.textContent = formatCurrency(totalBase, currentRegion, siteSettings);
    countNode.textContent = itemCount;
    if (!html.length) emptyNode.classList.remove('hidden');
    else emptyNode.classList.add('hidden');
}

function openProductModal(productId) {
    var product = getProductById(products, productId);
    if (!product) return;
    currentProductId = productId;
    currentSizeIdx = 0;
    currentQty = 1;
    renderProductModal();
    document.getElementById('productModal').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.body.classList.remove('modal-open');
}

function renderProductModal() {
    var body = document.getElementById('productModalBody');
    var product = getProductById(products, currentProductId);
    if (!body || !product) return;
    var pricing = getFinalPrice(product, currentSizeIdx, discounts, currentRegion, siteSettings);
    var sizeOptions = product.sizes.map(function (size, index) {
        return '<option value="' + index + '" ' + (index === currentSizeIdx ? 'selected' : '') + '>' + escapeHtml(size.label) + '</option>';
    }).join('');
    body.innerHTML = '<div class="pdp-grid">'
        + '<div><img src="' + escapeHtml(product.image || FALLBACK_IMAGE) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=FALLBACK_IMAGE"></div>'
        + '<div class="pdp-panel"><h2>' + escapeHtml(product.name) + '</h2><div class="product-meta">' + escapeHtml(product.brand) + ' • ' + escapeHtml(product.category) + '</div><div class="price-block">' + (pricing.hasDiscount ? '<span class="price-old">' + pricing.originalFormatted + '</span>' : '') + '<span>' + pricing.finalFormatted + '</span></div><p>' + escapeHtml(product.description || 'تفاصيل ناعمة ومريحة تناسب الأطفال.') + '</p><label>المقاس</label><select id="pdpSizeSelect">' + sizeOptions + '</select><div class="actions-row"><div class="qty-box"><button id="pdpMinusBtn">-</button><span id="pdpQtyText">' + currentQty + '</span><button id="pdpPlusBtn">+</button></div><button class="btn btn-primary" id="pdpAddBtn" ' + (product.status === 'soldout' ? 'disabled' : '') + '>' + (product.status === 'soldout' ? 'نفد حالياً' : 'أضف للسلة') + '</button></div></div>'
        + '</div>';
    document.getElementById('pdpSizeSelect').addEventListener('change', function (event) {
        currentSizeIdx = parseInt(event.target.value, 10) || 0;
        renderProductModal();
    });
    document.getElementById('pdpMinusBtn').addEventListener('click', function () {
        currentQty = Math.max(1, currentQty - 1);
        renderProductModal();
    });
    document.getElementById('pdpPlusBtn').addEventListener('click', function () {
        currentQty += 1;
        renderProductModal();
    });
    document.getElementById('pdpAddBtn').addEventListener('click', function () {
        addToCart(product.id, currentSizeIdx, currentQty);
        closeProductModal();
    });
}

function trackOrder() {
    var input = document.getElementById('trackingInput');
    var result = document.getElementById('trackingResult');
    var orderNumber = String(input.value || '').trim();
    if (!orderNumber || !result) return;
    if (!window.db) {
        result.classList.remove('hidden');
        result.innerHTML = '<strong>تعذر التتبع الآن.</strong><div>حاولي مرة أخرى لاحقاً أو تواصلي معنا عبر الواتساب.</div>';
        return;
    }
    result.classList.remove('hidden');
    result.innerHTML = 'جاري البحث عن الطلب...';
    db.collection('orders').where('orderNumber', '==', orderNumber).limit(1).get().then(function (snapshot) {
        if (snapshot.empty) {
            result.innerHTML = '<strong>لم يتم العثور على الطلب.</strong><div>تأكدي من رقم الطلب أو تواصلي معنا.</div>';
            return;
        }
        var order = snapshot.docs[0].data();
        result.innerHTML = '<strong>رقم الطلب: ' + escapeHtml(order.orderNumber || orderNumber) + '</strong>'
            + '<div>الحالة الحالية: ' + getOrderStatusLabel(order.status) + '</div>'
            + '<div>المنطقة: ' + escapeHtml(order.regionLabel || getRegionLabel(order.region || 'palestine')) + '</div>'
            + '<div>آخر تحديث: ' + escapeHtml(formatDateTime(order.updatedAt || order.createdAt || order.createdAtIso)) + '</div>';
    }).catch(function () {
        result.innerHTML = '<strong>تعذر تحميل حالة الطلب حالياً.</strong>';
    });
}
