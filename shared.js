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
        modalSizeIdx: 0,
        modalQty: 1,
        ready: { products: false, discounts: false, settings: false, heroSlides: false },
        listeners: [],
        subscriptionsStarted: false,
        swipeStartX: 0
    };
    var toastTimer = null;

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
        renderChrome();
        bindChrome();
        startAnimations();
        subscribeCore();
        renderShared();
    }

    function subscribeCore() {
        if (state.subscriptionsStarted) return;
        state.subscriptionsStarted = true;
        if (!global.db) {
            state.ready.products = true;
            state.ready.discounts = true;
            state.ready.settings = true;
            state.ready.heroSlides = true;
            renderShared();
            fireReady();
            return;
        }
        db.collection('products').onSnapshot(function (snapshot) {
            state.products = snapshot.docs.map(function (docSnap) {
                var data = docSnap.data();
                data.id = docSnap.id;
                return normalizeProduct(data);
            });
            state.cart = normalizeCartItems(state.cart, state.products);
            saveCartStorage();
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
            setReady('discounts');
        }, function () {
            setReady('discounts');
        });
        db.collection('settings').doc('config').onSnapshot(function (docSnap) {
            state.settings = normalizeSettings(docSnap.exists ? docSnap.data() : DEFAULT_SITE_SETTINGS);
            setReady('settings');
        }, function () {
            setReady('settings');
        });
        db.collection('settings').doc('heroSlides').onSnapshot(function (docSnap) {
            state.heroSlides = normalizeHeroSlidesDoc(docSnap.exists ? docSnap.data() : getDefaultHeroSlidesDoc()).slides;
            setReady('heroSlides');
        }, function () {
            state.heroSlides = normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()).slides;
            setReady('heroSlides');
        });
    }

    function renderChrome() {
        var navMount = document.getElementById('navbarMount');
        if (navMount) {
            navMount.innerHTML = '<header class="site-header"><div class="container"><div class="nav-shell"><a class="brand-block" href="index.html"><span class="brand-badge"><img src="logo.png" alt="عقاد كيدز"></span><span class="brand-copy"><strong>عقاد كيدز</strong><span>' + escapeHtml(state.options.navSubtitle || 'تفاصيل صغيرة تسعدهم') + '</span></span></a><nav class="nav-links desktop-only"><a class="nav-link ' + activeClass('home') + '" href="index.html">الرئيسية</a><a class="nav-link ' + activeClass('clothes') + '" href="clothes.html">الملابس</a><a class="nav-link ' + activeClass('shoes') + '" href="shoes.html">الأحذية</a><a class="nav-link ' + activeClass('accessories') + '" href="accessories.html">الإكسسوارات والعناية</a><a class="nav-link" href="index.html#tracking">تتبّع الطلب</a></nav><div class="nav-actions"><label class="region-switcher"><span>المنطقة</span><select id="regionSelector"><option value="palestine">فلسطين ₪</option><option value="jordan">الأردن JOD</option></select></label><button class="icon-pill" id="trackNavBtn" type="button" title="التتبّع">⌁</button><button class="icon-pill" id="cartToggleBtn" type="button" title="السلة">🛒<span class="cart-badge-count" id="cartBadgeCount">0</span></button><button class="icon-pill mobile-toggle" id="mobileMenuBtn" type="button">☰</button></div></div><div class="mobile-menu" id="mobileMenu"><a class="nav-link" href="index.html">الرئيسية</a><a class="nav-link" href="clothes.html">الملابس</a><a class="nav-link" href="shoes.html">الأحذية</a><a class="nav-link" href="accessories.html">الإكسسوارات والعناية</a><a class="nav-link" href="index.html#tracking">تتبّع الطلب</a><a class="nav-link" href="checkout.html">إتمام الطلب</a></div></div></header>';
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
            var quickId = target.getAttribute('data-quick-add');
            if (quickId) addToCart(quickId, 0, 1);
            var openId = target.getAttribute('data-open-product');
            if (openId) openProductModal(openId);
            var removeId = target.getAttribute('data-remove-cart');
            if (removeId) removeCartLine(removeId, target.getAttribute('data-size-idx'));
            var updateId = target.getAttribute('data-update-cart');
            if (updateId) updateCartQty(updateId, target.getAttribute('data-size-idx'), Number(target.getAttribute('data-delta')) || 0);
            if (target.getAttribute('data-modal-qty') === 'plus') updateModalQty(1);
            if (target.getAttribute('data-modal-qty') === 'minus') updateModalQty(-1);
            if (target.getAttribute('data-modal-add') === '1') addCurrentModalProduct();
        });
        document.body.addEventListener('change', function (event) {
            var target = event.target;
            if (target.id === 'regionSelector') changeRegion(target.value);
            if (target.id === 'pdpSizeSelect') {
                state.modalSizeIdx = parseInt(target.value, 10) || 0;
                renderProductModal();
            }
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

    function getCartDetailed() {
        var rows = [];
        for (var i = 0; i < state.cart.length; i += 1) {
            var item = state.cart[i];
            var product = getProductById(state.products, item.id);
            if (!product) continue;
            var sizeData = getPriceForSize(product, item.sizeIdx);
            var pricing = getFinalPrice(product, item.sizeIdx, state.discounts, state.region, state.settings);
            rows.push({
                product: product,
                item: item,
                size: sizeData,
                pricing: pricing,
                totalBase: pricing.finalBase * item.qty
            });
        }
        return rows;
    }

    function getCartTotals() {
        var rows = getCartDetailed();
        var totalBase = 0;
        var count = 0;
        for (var i = 0; i < rows.length; i += 1) {
            totalBase += rows[i].totalBase;
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
            return '<div class="cart-item"><img src="' + escapeHtml(row.product.image) + '" alt="' + escapeHtml(row.product.name) + '"><div><strong>' + escapeHtml(row.product.name) + '</strong><div style="color:var(--muted);font-size:0.9rem">' + escapeHtml(row.size.label) + ' • ' + escapeHtml(row.product.brand) + '</div><div class="qty-pills"><button data-update-cart="' + escapeHtml(row.product.id) + '" data-size-idx="' + row.item.sizeIdx + '" data-delta="-1" type="button">-</button><span>' + row.item.qty + '</span><button data-update-cart="' + escapeHtml(row.product.id) + '" data-size-idx="' + row.item.sizeIdx + '" data-delta="1" type="button">+</button><button data-remove-cart="' + escapeHtml(row.product.id) + '" data-size-idx="' + row.item.sizeIdx + '" type="button">✕</button></div></div><strong>' + formatCurrency(row.totalBase, state.region, state.settings) + '</strong></div>';
        }).join('') : '<div class="cart-empty">السلة فارغة حالياً. أضيفي بعض القطع الجميلة وعودي إلينا.</div>';
        if (badge) badge.textContent = totals.count;
        if (totalNode) totalNode.textContent = formatCurrency(totals.totalBase, state.region, state.settings);
    }

    function addToCart(productId, sizeIdx, qty) {
        var product = getProductById(state.products, productId);
        if (!product || product.status === 'soldout') {
            showToast('هذه القطعة غير متاحة الآن.');
            return;
        }
        var amount = Math.max(1, parseInt(qty, 10) || 1);
        var matched = null;
        for (var i = 0; i < state.cart.length; i += 1) {
            if (String(state.cart[i].id) === String(productId) && Number(state.cart[i].sizeIdx) === Number(sizeIdx)) {
                matched = state.cart[i];
                break;
            }
        }
        if (matched) matched.qty += amount;
        else state.cart.push({ id: String(productId), sizeIdx: Math.max(0, parseInt(sizeIdx, 10) || 0), qty: amount });
        state.cart = normalizeCartItems(state.cart, state.products);
        saveCartStorage();
        renderCart();
        showToast('أضفنا القطعة إلى السلة.');
    }

    function updateCartQty(productId, sizeIdx, delta) {
        for (var i = 0; i < state.cart.length; i += 1) {
            if (String(state.cart[i].id) === String(productId) && Number(state.cart[i].sizeIdx) === Number(sizeIdx)) {
                state.cart[i].qty += delta;
                if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
                break;
            }
        }
        state.cart = normalizeCartItems(state.cart, state.products);
        saveCartStorage();
        renderCart();
        fireReady();
    }

    function removeCartLine(productId, sizeIdx) {
        state.cart = state.cart.filter(function (item) {
            return !(String(item.id) === String(productId) && Number(item.sizeIdx) === Number(sizeIdx));
        });
        saveCartStorage();
        renderCart();
        fireReady();
    }

    function clearCart() {
        state.cart = [];
        saveCartStorage();
        renderCart();
        closeCart();
        fireReady();
    }

    function openProductModal(productId) {
        var product = getProductById(state.products, productId);
        if (!product) return;
        state.modalProductId = productId;
        state.modalSizeIdx = 0;
        state.modalQty = 1;
        renderProductModal();
        document.getElementById('productModalShell').classList.add('active');
        document.body.classList.add('modal-open');
    }

    function closeProductModal() {
        document.getElementById('productModalShell').classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    function updateModalQty(delta) {
        state.modalQty = Math.max(1, state.modalQty + delta);
        renderProductModal();
    }

    function addCurrentModalProduct() {
        addToCart(state.modalProductId, state.modalSizeIdx, state.modalQty);
        closeProductModal();
    }

    function renderProductModal() {
        var product = getProductById(state.products, state.modalProductId);
        var node = document.getElementById('productModalContent');
        if (!product || !node) return;
        var pricing = getFinalPrice(product, state.modalSizeIdx, state.discounts, state.region, state.settings);
        var options = product.sizes.map(function (size, index) {
            return '<option value="' + index + '" ' + (index === state.modalSizeIdx ? 'selected' : '') + '>' + escapeHtml(size.label) + '</option>';
        }).join('');
        node.innerHTML = '<div class="pdp-grid"><div class="pdp-media"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '"></div><div class="pdp-panel"><div class="pill-label"><span class="dot"></span>' + escapeHtml(getTypeLabel(product.type)) + '</div><h2>' + escapeHtml(product.name) + '</h2><div style="color:var(--muted);margin-bottom:8px">' + escapeHtml(product.brand) + (product.ageGroup ? ' • ' + escapeHtml(getAgeGroupLabel(product.ageGroup)) : '') + '</div><div class="price-row"><div><div class="price-now">' + pricing.finalFormatted + '</div>' + (pricing.hasDiscount ? '<div class="price-old">' + pricing.originalFormatted + '</div>' : '') + '</div><span class="badge badge-' + escapeHtml(product.status) + '">' + escapeHtml(getProductStatusLabel(product.status)) + '</span></div><p>' + escapeHtml(product.description || 'قطعة ناعمة ومريحة ومبهجة للحركة اليومية.') + '</p><div class="pdp-size-select"><label>اختاري المقاس</label><select id="pdpSizeSelect">' + options + '</select></div><div class="action-row"><div class="qty-box"><button data-modal-qty="plus" type="button">+</button><strong>' + state.modalQty + '</strong><button data-modal-qty="minus" type="button">-</button></div><button class="btn btn-primary" data-modal-add="1" type="button" ' + (product.status === 'soldout' ? 'disabled' : '') + '>' + (product.status === 'soldout' ? 'نفدت الكمية' : 'أضيفي إلى السلة') + '</button></div></div></div>';
    }

    function renderProductCard(product) {
        var pricing = getFinalPrice(product, 0, state.discounts, state.region, state.settings);
        var firstSize = getPriceForSize(product, 0);
        return '<article class="product-card visible"><div class="product-thumb"><div class="product-statuses"><span class="badge badge-' + escapeHtml(product.status) + '">' + escapeHtml(getProductStatusLabel(product.status)) + '</span>' + (pricing.hasDiscount ? '<span class="badge badge-special">خصم ' + pricing.discountPercent + '%</span>' : '') + '</div><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '"></div><div class="product-brand">' + escapeHtml(product.brand) + '</div><h3>' + escapeHtml(product.name) + '</h3><p class="product-description">' + escapeHtml(product.description || '') + '</p><div class="product-meta-row"><span class="size-pill">أول مقاس: ' + escapeHtml(firstSize.label) + '</span>' + (product.ageGroup ? '<span class="size-pill">' + escapeHtml(getAgeGroupLabel(product.ageGroup)) + '</span>' : '') + '</div><div class="price-row"><div><div class="price-now">' + pricing.finalFormatted + '</div>' + (pricing.hasDiscount ? '<div class="price-old">' + pricing.originalFormatted + '</div>' : '') + '</div></div><div class="product-actions"><button class="btn btn-secondary" type="button" data-open-product="' + escapeHtml(product.id) + '">التفاصيل</button><button class="btn btn-primary" type="button" data-quick-add="' + escapeHtml(product.id) + '" ' + (product.status === 'soldout' ? 'disabled' : '') + '>' + (product.status === 'soldout' ? 'نفدت' : 'أضف للسلة') + '</button></div></article>';
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
            if (key === 'accessories-page') return product.type === 'accessories' || product.type === 'creams';
            return product.type === key;
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
        }, 2400);
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
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('orders').add(payload).then(function (docRef) {
            if (onSuccess) onSuccess({ id: docRef.id });
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
            lines.push('- ' + items[i].name + ' | ' + items[i].size + ' | الكمية ' + items[i].qty);
        }
        lines.push('');
        lines.push('الإجمالي: ' + order.totalFormatted);
        if (order.notes) lines.push('ملاحظات: ' + order.notes);
        return lines.join('\n');
    }

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
        getCartDetailed: getCartDetailed,
        getCartTotals: getCartTotals,
        showToast: showToast,
        observeNewElements: observeNewElements
    };
})(window);
