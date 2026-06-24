var EDGE_CACHE_URL = 'https://aqqad-api.alsadiayham.workers.dev';
var CACHE_KEY_PRODUCTS = 'aqqad_cache_products';
var CACHE_KEY_SETTINGS = 'aqqad_cache_settings';
var CACHE_KEY_DISCOUNTS = 'aqqad_cache_discounts';
var CACHE_KEY_HERO = 'aqqad_cache_hero';
var CORE_CACHE_TTL = 30 * 60 * 1000;

(function (global) {
    var state = {
        options: {},
        products: normalizeProducts(DEFAULT_PRODUCTS),
        discounts: normalizeDiscounts(DEFAULT_DISCOUNTS),
        settings: normalizeSettings(DEFAULT_SITE_SETTINGS),
        heroSlides: normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()).slides,
        region: getCurrentRegion(),
        cart: normalizeCartItems(readCartStorage(), normalizeProducts(DEFAULT_PRODUCTS)),
        modalProductId: '',
        modalColor: '',
        modalSize: '',
        modalQty: 1,
        modalImageIndex: 0,
        ready: { products: false, discounts: false, settings: false, heroSlides: false },
        listeners: [],
        subscriptionsStarted: false,
        swipeStartX: 0,
        productSource: 'default'
    };
    var toastTimer = null;

    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var args = arguments;
            var ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
        };
    }

    function readCartStorage() {
        try {
            return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        } catch (error) {
            return [];
        }
    }

    function saveCartStorage() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    }

    function readCoreCache(key) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return null;
            var payload = JSON.parse(raw);
            var timestamp = Number(payload && payload.timestamp);
            if (!timestamp || new Date().getTime() - timestamp > CORE_CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return payload.data;
        } catch (error) {
            return null;
        }
    }

    function writeCoreCache(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify({
                timestamp: new Date().getTime(),
                data: cloneObject(value)
            }));
        } catch (error) {
        }
    }

    function applyCoreCache() {
        var cachedProducts = readCoreCache(CACHE_KEY_PRODUCTS);
        if (cachedProducts) {
            state.products = normalizeProducts(cachedProducts);
            state.productSource = 'cache';
            state.cart = normalizeCartItems(state.cart, state.products);
            saveCartStorage();
            setReady('products');
        }
        var cachedDiscounts = readCoreCache(CACHE_KEY_DISCOUNTS);
        if (cachedDiscounts) {
            state.discounts = normalizeDiscounts(cachedDiscounts);
            setReady('discounts');
        }
        var cachedSettings = readCoreCache(CACHE_KEY_SETTINGS);
        if (cachedSettings) {
            state.settings = normalizeSettings(cachedSettings);
            setReady('settings');
        }
        var cachedHeroSlides = readCoreCache(CACHE_KEY_HERO);
        if (cachedHeroSlides) {
            state.heroSlides = normalizeHeroSlidesDoc({ slides: cachedHeroSlides }).slides;
            setReady('heroSlides');
        }
    }

    function markAllReadyFallback() {
        if (!state.ready.products) state.ready.products = true;
        if (!state.ready.discounts) state.ready.discounts = true;
        if (!state.ready.settings) state.ready.settings = true;
        if (!state.ready.heroSlides) state.ready.heroSlides = true;
        renderShared();
        fireReady();
    }

    function fetchFromEdgeCache(path, onSuccess, onError) {
        var baseUrl = String(EDGE_CACHE_URL || '').replace(/\/+$/, '');
        if (!baseUrl) {
            if (onError) onError('disabled');
            return;
        }
        var request = new XMLHttpRequest();
        request.open('GET', baseUrl + path, true);
        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;
            if (request.status >= 200 && request.status < 300) {
                try {
                    if (onSuccess) onSuccess(JSON.parse(request.responseText || 'null'));
                } catch (error) {
                    if (onError) onError(error);
                }
                return;
            }
            if (onError) onError(request.status);
        };
        request.onerror = function () {
            if (onError) onError('network');
        };
        request.send(null);
    }

    function syncCart() {
        state.cart = normalizeCartItems(state.cart, state.products);
        saveCartStorage();
        renderCart();
        fireReady();
    }

    function setReady(key) {
        state.ready[key] = true;
        renderShared();
        fireReady();
    }

    function isReady() {
        return state.ready.products && state.ready.discounts && state.ready.settings && state.ready.heroSlides;
    }

    function onReady(callback) {
        if (typeof callback !== 'function') return;
        state.listeners.push(callback);
        if (isReady()) callback(state);
    }

    function fireReady() {
        if (!isReady()) return;
        for (var i = 0; i < state.listeners.length; i += 1) {
            state.listeners[i](state);
        }
    }

    function init(options) {
        state.options = options || {};
        state.region = getCurrentRegion();
        state.cart = normalizeCartItems(readCartStorage(), state.products);
        saveCartStorage();
        renderChrome();
        bindChrome();
        startAnimations();
        subscribeCore();
        renderShared();
    }

    function subscribeCore() {
        if (state.subscriptionsStarted) return;
        state.subscriptionsStarted = true;
        applyCoreCache();
        fetchFromEdgeCache('/api/products', function (payload) {
            if (state.productSource === 'snapshot') return;
            state.products = normalizeProducts(payload);
            state.productSource = 'edge';
            state.cart = normalizeCartItems(state.cart, state.products);
            saveCartStorage();
            writeCoreCache(CACHE_KEY_PRODUCTS, state.products);
            setReady('products');
        }, function () {
        });
        if (!global.db) {
            markAllReadyFallback();
            return;
        }
        db.collection('products').onSnapshot(function (snapshot) {
            state.products = snapshot.docs.map(function (docSnap) {
                var data = docSnap.data();
                data.id = docSnap.id;
                return normalizeProduct(data);
            });
            state.productSource = 'snapshot';
            state.cart = normalizeCartItems(state.cart, state.products);
            saveCartStorage();
            writeCoreCache(CACHE_KEY_PRODUCTS, state.products);
            setReady('products');
        }, function () {
            setReady('products');
        });
        db.collection('discounts').onSnapshot(function (snapshot) {
            state.discounts = snapshot.docs.map(function (docSnap) {
                var data = docSnap.data();
                data.id = docSnap.id;
                return normalizeDiscount(data);
            });
            writeCoreCache(CACHE_KEY_DISCOUNTS, state.discounts);
            setReady('discounts');
        }, function () {
            setReady('discounts');
        });
        db.collection('settings').doc('config').onSnapshot(function (docSnap) {
            state.settings = normalizeSettings(docSnap.exists ? docSnap.data() : DEFAULT_SITE_SETTINGS);
            writeCoreCache(CACHE_KEY_SETTINGS, state.settings);
            setReady('settings');
        }, function () {
            setReady('settings');
        });
        db.collection('settings').doc('heroSlides').onSnapshot(function (docSnap) {
            state.heroSlides = normalizeHeroSlidesDoc(docSnap.exists ? docSnap.data() : getDefaultHeroSlidesDoc()).slides;
            writeCoreCache(CACHE_KEY_HERO, state.heroSlides);
            setReady('heroSlides');
        }, function () {
            state.heroSlides = normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()).slides;
            setReady('heroSlides');
        });
    }

    function renderChrome() {
        var navMount = document.getElementById('navbarMount');
        if (navMount) {
            navMount.innerHTML = '<header class="site-header"><div class="container"><div class="nav-shell"><a class="brand-block" href="index.html"><span class="brand-badge"><img src="logo.png" alt="عقاد كيدز"></span><span class="brand-copy"><strong>عقاد كيدز</strong><span>' + escapeHtml(state.options.navSubtitle || 'تفاصيل صغيرة تسعدهم') + '</span></span></a><nav class="nav-links desktop-only"><a class="nav-link ' + activeClass('home') + '" href="index.html">الرئيسية</a><a class="nav-link ' + activeClass('clothes') + '" href="clothes.html">الملابس</a><a class="nav-link ' + activeClass('shoes') + '" href="shoes.html">الأحذية</a><a class="nav-link ' + activeClass('accessories') + '" href="accessories.html">الإكسسوارات والعناية</a><a class="nav-link" href="index.html#tracking">تتبّع الطلب</a></nav><div class="nav-actions"><label class="region-switcher"><span>المنطقة</span><select id="regionSelector"><option value="palestine">فلسطين ₪</option><option value="jordan">الأردن JOD</option></select></label><a class="icon-pill" href="admin.html" title="تسجيل الدخول">👤</a><button class="icon-pill" id="cartToggleBtn" type="button" title="السلة">🛒<span class="cart-badge-count" id="cartBadgeCount">0</span></button><button class="icon-pill mobile-toggle" id="mobileMenuBtn" type="button">☰</button></div></div><div class="mobile-menu" id="mobileMenu"><a class="nav-link" href="index.html">الرئيسية</a><a class="nav-link" href="clothes.html">الملابس</a><a class="nav-link" href="shoes.html">الأحذية</a><a class="nav-link" href="accessories.html">الإكسسوارات والعناية</a><a class="nav-link" href="index.html#tracking">تتبّع الطلب</a><a class="nav-link" href="checkout.html">إتمام الطلب</a><a class="nav-link" href="admin.html">تسجيل الدخول</a></div></div></header>';
        }
        if (!document.getElementById('sharedCartOverlay')) {
            var chrome = document.createElement('div');
            chrome.innerHTML = '<div class="cart-overlay" id="sharedCartOverlay"></div><aside class="cart-sidebar" id="sharedCartSidebar"><div class="cart-header"><strong>سلة الأحلام الصغيرة</strong><button class="icon-pill" id="cartCloseBtn" type="button">✕</button></div><div class="cart-items" id="sharedCartItems"></div><div class="cart-footer"><div class="cart-total-line"><span>المجموع</span><strong id="sharedCartTotal">₪ 0</strong></div><div class="action-row" style="margin-top:14px"><a class="btn btn-primary" href="checkout.html" style="flex:1">إتمام الطلب</a><button class="btn btn-secondary" id="clearCartBtn" type="button">تفريغ السلة</button></div></div></aside><div class="modal-shell" id="productModalShell"><div class="modal-overlay" id="productModalOverlay"></div><div class="modal-dialog"><div class="modal-close-row"><strong>تفاصيل القطعة</strong><button class="icon-pill" id="productModalCloseBtn" type="button">✕</button></div><div id="productModalContent"></div></div></div><div class="toast" id="sharedToast"></div>';
            document.body.appendChild(chrome);
        }
        var footerMount = document.getElementById('footerMount');
        if (footerMount) {
            footerMount.innerHTML = '<footer class="site-footer"><div class="container"><div class="footer-card glass-card"><div><div class="pill-label"><span class="dot"></span>عقاد كيدز</div><h3 style="margin:12px 0 8px">طفولة مرتبة بحب وأناقة</h3><p style="margin:0;color:var(--muted)">تسوّقي القطع المفضلة، أرسلي الطلب، واتركي لنا مهمة تجهيز التفاصيل بلطف وسرعة.</p></div><div class="footer-links"><a href="index.html">الرئيسية</a><a href="clothes.html">الملابس</a><a href="shoes.html">الأحذية</a><a href="accessories.html">العناية والإكسسوارات</a><a href="admin.html">الإدارة</a></div></div></div></footer>';
        }
    }

    function activeClass(key) {
        return state.options.activePage === key ? 'active' : '';
    }

    function findNodeWithAttribute(node, attribute) {
        while (node && node !== document.body) {
            if (node.getAttribute && node.getAttribute(attribute) != null) return node;
            node = node.parentNode;
        }
        return null;
    }

    function bindChrome() {
        if (document.body.getAttribute('data-shared-bound') === '1') return;
        document.body.setAttribute('data-shared-bound', '1');
        document.body.addEventListener('click', function (event) {
            var target = event.target;
            if (target.id === 'cartToggleBtn') openCart();
            if (target.id === 'cartCloseBtn' || target.id === 'sharedCartOverlay') closeCart();
            if (target.id === 'clearCartBtn') clearCart();
            if (target.id === 'productModalOverlay' || target.id === 'productModalCloseBtn') closeProductModal();
            if (target.id === 'mobileMenuBtn') toggleMobileMenu();
            if (target.id === 'trackNavBtn') {
                if (location.pathname.toLowerCase().indexOf('index.html') >= 0 || /\/$/.test(location.pathname)) {
                    location.hash = 'tracking';
                    return;
                }
                location.href = 'index.html#tracking';
            }
            var quickButton = findNodeWithAttribute(target, 'data-quick-add');
            if (quickButton) {
                addToCart(quickButton.getAttribute('data-quick-add'), quickButton.getAttribute('data-quick-size'), quickButton.getAttribute('data-quick-color'), 1);
                return;
            }
            var openButton = findNodeWithAttribute(target, 'data-open-product');
            if (openButton) {
                openProductModal(openButton.getAttribute('data-open-product'));
                return;
            }
            var cardEl = target.closest ? target.closest('.product-card') : null;
            if (cardEl && !target.closest('.product-actions')) {
                var cardBtn = cardEl.querySelector('[data-open-product]');
                if (cardBtn) { openProductModal(cardBtn.getAttribute('data-open-product')); return; }
            }
            var removeButton = findNodeWithAttribute(target, 'data-remove-cart');
            if (removeButton) {
                removeCartLine(removeButton.getAttribute('data-remove-cart'), removeButton.getAttribute('data-size'), removeButton.getAttribute('data-color'));
                return;
            }
            var updateButton = findNodeWithAttribute(target, 'data-update-cart');
            if (updateButton) {
                updateCartQty(updateButton.getAttribute('data-update-cart'), updateButton.getAttribute('data-size'), updateButton.getAttribute('data-color'), Number(updateButton.getAttribute('data-delta')) || 0);
                return;
            }
            var colorButton = findNodeWithAttribute(target, 'data-select-color');
            if (colorButton) {
                selectModalColor(colorButton.getAttribute('data-select-color'));
                return;
            }
            var sizeButton = findNodeWithAttribute(target, 'data-select-size');
            if (sizeButton && !/disabled/.test(sizeButton.className)) {
                selectModalSize(sizeButton.getAttribute('data-select-size'));
                return;
            }
            var thumbButton = findNodeWithAttribute(target, 'data-gallery-index');
            if (thumbButton) {
                changeModalImage(Number(thumbButton.getAttribute('data-gallery-index')) || 0);
                return;
            }
            if (target.getAttribute('data-modal-qty') === 'plus') updateModalQty(1);
            if (target.getAttribute('data-modal-qty') === 'minus') updateModalQty(-1);
            if (target.getAttribute('data-modal-add') === '1') addCurrentModalProduct();
        });
        document.body.addEventListener('change', function (event) {
            var target = event.target;
            if (target.id === 'regionSelector') changeRegion(target.value);
        });
    }

    function toggleMobileMenu() {
        var menu = document.getElementById('mobileMenu');
        if (!menu) return;
        menu.classList.toggle('open');
        document.body.classList.toggle('menu-open', menu.classList.contains('open'));
    }

    function renderShared() {
        var selector = document.getElementById('regionSelector');
        if (selector) selector.value = state.region;
        renderCart();
    }

    function changeRegion(regionKey) {
        state.region = setCurrentRegion(regionKey);
        renderShared();
        fireReady();
    }

    function openCart() {
        document.getElementById('sharedCartSidebar').classList.add('active');
        document.getElementById('sharedCartOverlay').classList.add('active');
        document.body.classList.add('cart-open');
    }

    function closeCart() {
        document.getElementById('sharedCartSidebar').classList.remove('active');
        document.getElementById('sharedCartOverlay').classList.remove('active');
        document.body.classList.remove('cart-open');
    }

    function buildCartRow(product, item) {
        var variant = getVariant(product, item.size, item.color);
        if (!variant) {
            return {
                product: product,
                item: item,
                variant: null,
                pricing: getFinalPrice(product, getDefaultVariant(product), state.discounts, state.region, state.settings),
                totalBase: 0,
                availableQty: 0,
                isAvailable: false,
                lineImage: getProductImageForColor(product, item.color)
            };
        }
        var pricing = getFinalPrice(product, variant, state.discounts, state.region, state.settings);
        return {
            product: product,
            item: item,
            variant: variant,
            pricing: pricing,
            totalBase: pricing.finalBase * item.qty,
            availableQty: variant.stock,
            isAvailable: variant.stock >= item.qty && variant.stock > 0,
            lineImage: getProductImageForColor(product, variant.color)
        };
    }

    function getCartDetailed() {
        var rows = [];
        for (var i = 0; i < state.cart.length; i += 1) {
            var item = state.cart[i];
            var product = getProductById(state.products, item.id);
            if (!product) continue;
            rows.push(buildCartRow(product, item));
        }
        return rows;
    }

    function getCartTotals() {
        var rows = getCartDetailed();
        var totalBase = 0;
        var count = 0;
        for (var i = 0; i < rows.length; i += 1) {
            if (!rows[i].variant || rows[i].availableQty <= 0) continue;
            totalBase += rows[i].pricing.finalBase * Math.min(rows[i].item.qty, rows[i].availableQty);
            count += rows[i].item.qty;
        }
        return { totalBase: totalBase, count: count };
    }

    function renderCart() {
        var badge = document.getElementById('cartBadgeCount');
        var itemsNode = document.getElementById('sharedCartItems');
        var totalNode = document.getElementById('sharedCartTotal');
        if (!itemsNode) return;
        var rows = getCartDetailed();
        var totals = getCartTotals();
        itemsNode.innerHTML = rows.length ? rows.map(function (row) {
            var warning = '';
            var plusDisabled = '';
            if (!row.variant || row.availableQty <= 0) {
                warning = '<div class="stock-indicator stock-low">هذا اللون أو المقاس لم يعد متوفراً.</div>';
                plusDisabled = 'disabled';
            } else if (row.item.qty >= row.availableQty) {
                warning = '<div class="stock-indicator stock-low">الحد الأقصى المتاح حالياً: ' + row.availableQty + ' قطعة</div>';
                plusDisabled = 'disabled';
            }
            return '<div class="cart-item' + (!row.isAvailable ? ' cart-item-invalid' : '') + '"><img src="' + escapeHtml(row.lineImage) + '" alt="' + escapeHtml(row.product.name) + '"><div><strong>' + escapeHtml(row.product.name) + '</strong><div style="color:var(--muted);font-size:0.9rem">' + escapeHtml(row.item.size) + ' • ' + escapeHtml(row.item.color) + ' • ' + escapeHtml(row.product.brand) + '</div>' + warning + '<div class="qty-pills"><button data-update-cart="' + escapeHtml(row.product.id) + '" data-size="' + escapeHtml(row.item.size) + '" data-color="' + escapeHtml(row.item.color) + '" data-delta="-1" type="button">-</button><span>' + row.item.qty + '</span><button ' + plusDisabled + ' data-update-cart="' + escapeHtml(row.product.id) + '" data-size="' + escapeHtml(row.item.size) + '" data-color="' + escapeHtml(row.item.color) + '" data-delta="1" type="button">+</button><button data-remove-cart="' + escapeHtml(row.product.id) + '" data-size="' + escapeHtml(row.item.size) + '" data-color="' + escapeHtml(row.item.color) + '" type="button">✕</button></div></div><strong>' + formatCurrency(row.totalBase, state.region, state.settings) + '</strong></div>';
        }).join('') : '<div class="cart-empty">السلة فارغة حالياً. أضيفي بعض القطع الجميلة وعودي إلينا.</div>';
        if (badge) badge.textContent = totals.count;
        if (totalNode) totalNode.textContent = formatCurrency(totals.totalBase, state.region, state.settings);
    }

    function resolveCartVariant(product, sizeOrVariant, colorName) {
        var color = colorName ? String(colorName) : '';
        var size = sizeOrVariant;
        var variant = null;
        if (size && typeof size === 'object' && size.size && size.color) variant = getVariant(product, size.size, size.color);
        else if (size || color) variant = getPriceForSize(product, size, color);
        else variant = getDefaultVariant(product);
        return variant;
    }

    function addToCart(productId, sizeOrVariant, colorName, qty) {
        var product = getProductById(state.products, productId);
        if (!product || product.status === 'hidden' || product.status === 'soldout') {
            showToast('هذه القطعة غير متاحة الآن.');
            return;
        }
        var amount = qty;
        var color = colorName;
        if (typeof colorName === 'number' && qty == null) {
            amount = colorName;
            color = '';
        }
        var variant = resolveCartVariant(product, sizeOrVariant, color);
        var desiredQty = Math.max(1, parseInt(amount, 10) || 1);
        if (!variant || variant.stock <= 0) {
            showToast('عذراً، هذه القطعة نفدت من المخزن');
            return;
        }
        var matched = null;
        for (var i = 0; i < state.cart.length; i += 1) {
            if (String(state.cart[i].id) === String(productId) && String(state.cart[i].size) === String(variant.size) && String(state.cart[i].color) === String(variant.color)) {
                matched = state.cart[i];
                break;
            }
        }
        var nextQty = desiredQty + (matched ? matched.qty : 0);
        if (nextQty > variant.stock) {
            showToast('الكمية المطلوبة أكبر من المخزون المتاح.');
            return;
        }
        if (matched) matched.qty = nextQty;
        else state.cart.push({ id: String(productId), color: String(variant.color), size: String(variant.size), qty: desiredQty });
        syncCart();
        showToast('أضفنا القطعة إلى السلة.');
    }

    function updateCartQty(productId, size, color, delta) {
        var product = getProductById(state.products, productId);
        for (var i = 0; i < state.cart.length; i += 1) {
            if (String(state.cart[i].id) === String(productId) && String(state.cart[i].size) === String(size) && String(state.cart[i].color) === String(color)) {
                var variant = product ? getVariant(product, size, color) : null;
                if (delta > 0 && (!variant || variant.stock <= state.cart[i].qty)) {
                    showToast(!variant || variant.stock <= 0 ? 'عذراً، هذه القطعة نفدت من المخزن' : 'الكمية المطلوبة أكبر من المخزون المتاح.');
                    return;
                }
                state.cart[i].qty += delta;
                if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
                break;
            }
        }
        syncCart();
    }

    function removeCartLine(productId, size, color) {
        state.cart = state.cart.filter(function (item) {
            return !(String(item.id) === String(productId) && String(item.size) === String(size) && String(item.color) === String(color));
        });
        syncCart();
    }

    function clearCart() {
        state.cart = [];
        syncCart();
        closeCart();
    }

    function getInitialModalSelection(product) {
        var variant = getDefaultVariant(product);
        if (!variant) return { color: product.colors[0] ? product.colors[0].name : '', size: getProductSizeLabels(product)[0] || '' };
        return { color: variant.color, size: variant.size };
    }

    function openProductModal(productId) {
        var product = getProductById(state.products, productId);
        if (!product) return;
        state.modalProductId = productId;
        var selection = getInitialModalSelection(product);
        state.modalColor = selection.color;
        state.modalSize = selection.size;
        state.modalQty = 1;
        state.modalImageIndex = 0;
        renderProductModal();
        document.getElementById('productModalShell').classList.add('active');
        document.body.classList.add('modal-open');
    }

    function closeProductModal() {
        document.getElementById('productModalShell').classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    function selectModalColor(colorName) {
        var product = getProductById(state.products, state.modalProductId);
        if (!product) return;
        state.modalColor = String(colorName || '');
        var availableSizes = getAvailableSizes(product, state.modalColor);
        var sizeLabels = getProductSizeLabels(product);
        if (availableSizes.indexOf(state.modalSize) < 0) {
            state.modalSize = availableSizes[0] || sizeLabels[0] || '';
        }
        state.modalQty = 1;
        state.modalImageIndex = 0;
        renderProductModal();
    }

    function selectModalSize(size) {
        state.modalSize = String(size || '');
        state.modalQty = 1;
        renderProductModal();
    }

    function changeModalImage(index) {
        state.modalImageIndex = Math.max(0, parseInt(index, 10) || 0);
        renderProductModal();
    }

    function updateModalQty(delta) {
        var product = getProductById(state.products, state.modalProductId);
        var variant = product ? getVariant(product, state.modalSize, state.modalColor) : null;
        var maxQty = variant && variant.stock > 0 ? variant.stock : 1;
        state.modalQty = Math.max(1, state.modalQty + delta);
        if (variant && variant.stock > 0) state.modalQty = Math.min(state.modalQty, maxQty);
        renderProductModal();
    }

    function addCurrentModalProduct() {
        var product = getProductById(state.products, state.modalProductId);
        var variant = product ? getVariant(product, state.modalSize, state.modalColor) : null;
        addToCart(state.modalProductId, state.modalSize, state.modalColor, state.modalQty);
        if (variant && variant.stock > 0) closeProductModal();
    }

    function renderProductModal() {
        var product = getProductById(state.products, state.modalProductId);
        var node = document.getElementById('productModalContent');
        if (!product || !node) return;
        var color = state.modalColor || (product.colors[0] ? product.colors[0].name : '');
        var selectedColor = getColorByName(product, color) || product.colors[0] || { name: '', images: [product.image], hex: '#d9d9d9' };
        var images = safeArray(selectedColor.images);
        if (!images.length) images = [product.image || FALLBACK_IMAGE];
        if (state.modalImageIndex >= images.length) state.modalImageIndex = 0;
        var sizeLabels = getProductSizeLabels(product);
        var selectedVariant = getVariant(product, state.modalSize, color);
        if (!selectedVariant && sizeLabels.length) selectedVariant = getVariant(product, sizeLabels[0], color) || getDefaultVariant(product, color);
        if (selectedVariant) {
            state.modalColor = selectedVariant.color;
            state.modalSize = selectedVariant.size;
            color = selectedVariant.color;
            selectedColor = getColorByName(product, color) || selectedColor;
            images = safeArray(selectedColor.images);
            if (!images.length) images = [product.image || FALLBACK_IMAGE];
        }
        if (state.modalImageIndex >= images.length) state.modalImageIndex = 0;
        var pricing = getFinalPrice(product, selectedVariant || getDefaultVariant(product), state.discounts, state.region, state.settings);
        var swatchesHtml = product.colors.map(function (item) {
            var classes = 'color-swatch' + (String(item.name) === String(color) ? ' active' : '') + (isColorAvailable(product, item.name) ? '' : ' unavailable');
            return '<button class="' + classes + '" type="button" title="' + escapeHtml(item.name) + '" style="background:' + escapeHtml(item.hex) + '" data-select-color="' + escapeHtml(item.name) + '"><span class="sr-only">' + escapeHtml(item.name) + '</span></button>';
        }).join('');
        var sizesHtml = sizeLabels.map(function (size) {
            var variant = getVariant(product, size, color);
            var disabled = !variant || variant.stock <= 0;
            var classes = 'size-btn' + (String(size) === String(state.modalSize) ? ' active' : '') + (disabled ? ' disabled' : '');
            return '<button class="' + classes + '" type="button" ' + (disabled ? 'disabled' : '') + ' data-select-size="' + escapeHtml(size) + '">' + escapeHtml(size) + '</button>';
        }).join('');
        var thumbsHtml = images.map(function (image, index) {
            return '<button class="gallery-thumb' + (index === state.modalImageIndex ? ' active' : '') + '" type="button" data-gallery-index="' + index + '"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.name) + '"></button>';
        }).join('');
        var stockCount = selectedVariant ? selectedVariant.stock : 0;
        var stockClass = stockCount > 0 && stockCount < 10 ? 'stock-indicator stock-low' : 'stock-indicator';
        var stockText = stockCount > 0 ? 'متوفر: ' + stockCount + ' قطعة' : 'نفدت الكمية';
        node.innerHTML = '<div class="pdp-grid"><div><div class="pdp-media"><img src="' + escapeHtml(images[state.modalImageIndex] || product.image) + '" alt="' + escapeHtml(product.name) + '"></div><div class="gallery-row">' + thumbsHtml + '</div></div><div class="pdp-panel"><div class="pill-label"><span class="dot"></span>' + escapeHtml(getTypeLabel(product.type)) + '</div><h2>' + escapeHtml(product.name) + '</h2><div style="color:var(--muted);margin-bottom:8px">' + escapeHtml(product.brand) + (product.ageGroup ? ' • ' + escapeHtml(getAgeGroupLabel(product.ageGroup)) : '') + '</div><div class="price-row"><div><div class="price-now">' + pricing.finalFormatted + '</div>' + (pricing.hasDiscount ? '<div class="price-old">' + pricing.originalFormatted + '</div>' : '') + '</div><span class="badge badge-' + escapeHtml(product.status) + '">' + escapeHtml(getProductStatusLabel(product.status)) + '</span></div><p>' + escapeHtml(product.description || 'قطعة ناعمة ومريحة ومبهجة للحركة اليومية.') + '</p><div class="stack"><div><strong>اختاري اللون</strong><div class="color-swatches">' + swatchesHtml + '</div><div class="selected-color-label">' + escapeHtml(color) + '</div></div><div><strong>اختاري المقاس</strong><div class="size-btns">' + sizesHtml + '</div></div><div class="' + stockClass + '">' + stockText + '</div></div><div class="action-row" style="margin-top:18px"><div class="qty-box"><button data-modal-qty="plus" type="button">+</button><strong>' + state.modalQty + '</strong><button data-modal-qty="minus" type="button">-</button></div><button class="btn btn-primary" data-modal-add="1" type="button" ' + (!selectedVariant || stockCount <= 0 ? 'disabled' : '') + '>' + (!selectedVariant || stockCount <= 0 ? 'نفدت الكمية' : 'أضف للسلة') + '</button></div></div></div>';
    }

    function renderProductCard(product) {
        var defaultVariant = getDefaultVariant(product) || getPriceForSize(product, 0);
        var pricing = getFinalPrice(product, defaultVariant, state.discounts, state.region, state.settings);
        var swatches = product.colors.map(function (color) {
            return '<span class="color-swatch' + (isColorAvailable(product, color.name) ? '' : ' unavailable') + '" title="' + escapeHtml(color.name) + '" style="background:' + escapeHtml(color.hex) + '"></span>';
        }).join('');
        var totalStock = getTotalStock(product);
        var soldout = product.status === 'soldout';
        return '<article class="product-card visible' + (soldout ? ' soldout-card' : '') + '"><div class="product-thumb">' + (soldout ? '<div class="soldout-overlay">نفدت الكمية</div>' : '') + '<div class="product-statuses"><span class="badge badge-' + escapeHtml(product.status) + '">' + escapeHtml(getProductStatusLabel(product.status)) + '</span>' + (pricing.hasDiscount ? '<span class="badge badge-special">خصم ' + pricing.discountPercent + '%</span>' : '') + '</div><img loading="lazy" src="' + escapeHtml(getProductImageForColor(product, defaultVariant ? defaultVariant.color : '')) + '" alt="' + escapeHtml(product.name) + '"></div><div class="product-brand">' + escapeHtml(product.brand) + '</div><h3>' + escapeHtml(product.name) + '</h3><p class="product-description">' + escapeHtml(product.description || '') + '</p><div class="product-meta-row"><div class="color-swatches">' + swatches + '</div>' + (product.ageGroup ? '<span class="size-pill">' + escapeHtml(getAgeGroupLabel(product.ageGroup)) + '</span>' : '') + '</div><div class="stock-indicator' + (totalStock > 0 && totalStock < 10 ? ' stock-low' : '') + '">' + (soldout ? 'غير متوفر حالياً' : 'إجمالي المخزون: ' + totalStock + ' قطعة') + '</div><div class="price-row"><div><div class="price-now">' + pricing.finalFormatted + '</div>' + (pricing.hasDiscount ? '<div class="price-old">' + pricing.originalFormatted + '</div>' : '') + '</div></div><div class="product-actions"><button class="btn btn-secondary" type="button" data-open-product="' + escapeHtml(product.id) + '">التفاصيل</button>' + (soldout ? '' : '<button class="btn btn-primary" type="button" data-quick-add="' + escapeHtml(product.id) + '" data-quick-size="' + escapeHtml(defaultVariant ? defaultVariant.size : '') + '" data-quick-color="' + escapeHtml(defaultVariant ? defaultVariant.color : '') + '">أضف للسلة</button>') + '</div></article>';
    }

    function filterProducts(list, predicate) {
        var result = [];
        for (var i = 0; i < list.length; i += 1) {
            if (predicate(list[i])) result.push(list[i]);
        }
        return result;
    }

    function getProductsByType(type) {
        var key = String(type || '').toLowerCase();
        return filterProducts(state.products, function (product) {
            if (product.status === 'hidden') return false;
            if (key === 'accessories-page') return product.type === 'accessories' || product.type === 'creams';
            return product.type === key;
        }).sort(function (a, b) {
            if (a.status !== b.status) {
                if (a.status === 'soldout') return 1;
                if (b.status === 'soldout') return -1;
            }
            return a.name.localeCompare(b.name, 'ar');
        });
    }

    function showToast(message) {
        var toast = document.getElementById('sharedToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 2800);
    }

    var animationObserver = null;

    function startAnimations() {
        if ('IntersectionObserver' in global) {
            animationObserver = new IntersectionObserver(function (entries) {
                for (var i = 0; i < entries.length; i += 1) {
                    if (entries[i].isIntersecting) entries[i].target.classList.add('visible');
                }
            }, { threshold: 0.08 });
            var animated = document.querySelectorAll('[data-animate]:not(.visible)');
            for (var i = 0; i < animated.length; i += 1) animationObserver.observe(animated[i]);
        } else {
            var fallback = document.querySelectorAll('[data-animate]');
            for (var j = 0; j < fallback.length; j += 1) fallback[j].classList.add('visible');
        }
        global.addEventListener('scroll', handleParallax);
        handleParallax();
    }

    function observeNewElements() {
        if (animationObserver) {
            var nodes = document.querySelectorAll('[data-animate]:not(.visible)');
            for (var i = 0; i < nodes.length; i += 1) animationObserver.observe(nodes[i]);
        } else {
            var fallback = document.querySelectorAll('[data-animate]:not(.visible)');
            for (var j = 0; j < fallback.length; j += 1) fallback[j].classList.add('visible');
        }
    }

    function handleParallax() {
        var nodes = document.querySelectorAll('[data-parallax]');
        var top = global.pageYOffset || document.documentElement.scrollTop || 0;
        for (var i = 0; i < nodes.length; i += 1) {
            var speed = Number(nodes[i].getAttribute('data-parallax')) || 0.12;
            nodes[i].style.transform = 'translateY(' + Math.round(top * speed) + 'px)';
        }
    }

    function trackOrder(orderNumber, onSuccess, onError) {
        var cleaned = String(orderNumber || '').trim();
        if (!cleaned) {
            if (onError) onError('يرجى إدخال رقم الطلب.');
            return;
        }
        if (!global.db) {
            if (onError) onError('تعذر الاتصال بقاعدة البيانات الآن.');
            return;
        }
        db.collection('orders').where('orderNumber', '==', cleaned).limit(1).get().then(function (snapshot) {
            if (snapshot.empty) {
                if (onError) onError('لم نعثر على هذا الرقم.');
                return;
            }
            var order = snapshot.docs[0].data();
            order._docId = snapshot.docs[0].id;
            if (onSuccess) onSuccess(order);
        }).catch(function () {
            if (onError) onError('تعذر تحميل حالة الطلب الآن.');
        });
    }

    function saveLastOrder(payload) {
        localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(payload || {}));
    }

    function getLastOrder() {
        try {
            return JSON.parse(localStorage.getItem(LAST_ORDER_STORAGE_KEY) || '{}');
        } catch (error) {
            return {};
        }
    }

    function createOrder(orderPayload, onSuccess, onError) {
        var payload = cloneObject(orderPayload || {});
        if (!global.db) {
            if (onSuccess) onSuccess({ offline: true });
            return;
        }
        payload.source = 'web';
        payload.createdAt = Date.now();
        payload.createdAtIso = new Date().toISOString();
        payload.updatedAt = Date.now();

        // Save the order via the public /api/orders endpoint. Stock for each
        // variant is deducted server-side (atomically) from the order items, so
        // anonymous shoppers never need write access to the products table.
        db.collection('orders').add(payload).then(function (ref) {
            if (onSuccess) onSuccess({ id: ref.id });
        }).catch(function () {
            if (onError) onError('تعذر حفظ الطلب الآن.');
        });
    }

    function buildOrderWhatsappMessage(order) {
        var lines = [
            'طلب جديد من عقاد كيدز',
            'رقم الطلب: ' + order.orderNumber,
            'الاسم: ' + order.customerName,
            'الهاتف: ' + order.phone,
            'المنطقة: ' + order.regionLabel,
            'العنوان: ' + order.address,
            'طريقة الدفع: ' + order.paymentLabel,
            ''
        ];
        var items = safeArray(order.items);
        for (var i = 0; i < items.length; i += 1) {
            lines.push('- ' + items[i].name + ' | اللون ' + (items[i].color || '-') + ' | المقاس ' + (items[i].size || '-') + ' | الكمية ' + items[i].qty);
        }
        lines.push('');
        lines.push('الإجمالي: ' + order.totalFormatted);
        if (order.notes) lines.push('ملاحظات: ' + order.notes);
        return lines.join('\n');
    }

    global.debounce = debounce;

    global.AqqadStore = {
        init: init,
        onReady: onReady,
        state: state,
        renderProductCard: renderProductCard,
        addToCart: addToCart,
        getProductsByType: getProductsByType,
        filterProducts: filterProducts,
        openProductModal: openProductModal,
        closeProductModal: closeProductModal,
        trackOrder: trackOrder,
        createOrder: createOrder,
        buildOrderWhatsappMessage: buildOrderWhatsappMessage,
        saveLastOrder: saveLastOrder,
        getLastOrder: getLastOrder,
        changeRegion: changeRegion,
        clearCart: clearCart,
        closeCart: closeCart,
        openCart: openCart,
        renderShared: renderShared,
        debounce: debounce,
        fetchFromEdgeCache: fetchFromEdgeCache,
        getCartDetailed: getCartDetailed,
        getCartTotals: getCartTotals,
        removeCartLine: removeCartLine,
        showToast: showToast,
        observeNewElements: observeNewElements
    };
})(window);
