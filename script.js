var homeState = {
    currentSlide: 0,
    slideTimer: null,
    touchStartX: 0
};

document.addEventListener('DOMContentLoaded', function () {
    AqqadStore.init({ activePage: 'home', navSubtitle: 'أزياء طفولية مبهجة' });
    AqqadStore.onReady(function () {
        renderHomeHero();
        renderFeaturedBlocks();
        renderAboutContent();
        bindHomeEvents();
    });
});

function bindHomeEvents() {
    var form = document.getElementById('trackingForm');
    if (form && !form.getAttribute('data-bound')) {
        form.setAttribute('data-bound', '1');
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var input = document.getElementById('trackingInput');
            var result = document.getElementById('trackingResult');
            result.innerHTML = 'جاري البحث عن طلبك...';
            result.classList.remove('hidden');
            AqqadStore.trackOrder(input.value, function (order) {
                var statusSteps = ['new', 'preparing', 'prepared', 'in_delivery', 'completed'];
                var statusLabels = ['قيد الانتظار', 'جاري التحضير', 'جاهز للشحن', 'في الطريق', 'تم التوصيل'];
                var currentIdx = statusSteps.indexOf(order.status || 'new');
                if (currentIdx < 0) currentIdx = 0;
                var stepsHtml = statusSteps.map(function (step, idx) {
                    var cls = idx <= currentIdx ? 'step-active' : '';
                    return '<div class="track-step ' + cls + '"><div class="step-dot">' + (idx <= currentIdx ? '✓' : (idx + 1)) + '</div><span>' + statusLabels[idx] + '</span></div>';
                }).join('');
                var itemsHtml = '';
                if (order.items && order.items.length) {
                    itemsHtml = '<div class="track-items">';
                    for (var i = 0; i < order.items.length; i++) {
                        var item = order.items[i];
                        var priceDisplay = item.unitPriceBase ? formatCurrency(item.unitPriceBase, order.region || 'palestine', AqqadStore.state.settings) : '';
                        itemsHtml += '<div class="track-item"><img src="' + escapeHtml(item.image || '') + '" onerror="this.style.display=\'none\'"><div><strong>' + escapeHtml(item.name || '') + '</strong><div style="color:var(--muted);font-size:0.82rem">' + escapeHtml(item.size || '') + (item.color ? ' • ' + escapeHtml(item.color) : '') + ' × ' + item.qty + (priceDisplay ? ' • ' + priceDisplay : '') + '</div></div></div>';
                    }
                    itemsHtml += '</div>';
                }
                var spinClass = (order.status === 'new' || order.status === 'preparing') ? ' spinning' : '';
                result.innerHTML = ''
                    + '<div class="track-header"><span class="track-icon' + spinClass + '">⏳</span><strong>رقم الطلب: ' + escapeHtml(order.orderNumber || '') + '</strong></div>'
                    + '<div class="track-steps">' + stepsHtml + '</div>'
                    + '<div class="track-info"><div><span>طريقة الدفع</span><strong>' + escapeHtml(order.paymentLabel || getPaymentMethodLabel(order.paymentMethod || 'cod')) + '</strong></div><div><span>المنطقة</span><strong>' + escapeHtml(order.regionLabel || getRegionLabel(order.region || 'palestine')) + '</strong></div><div><span>الإجمالي</span><strong>' + escapeHtml(order.totalFormatted || formatCurrency(order.totalBase || 0, order.region || 'palestine', AqqadStore.state.settings)) + '</strong></div></div>'
                    + itemsHtml;
            }, function (message) {
                result.innerHTML = '<strong>' + escapeHtml(message) + '</strong><div>إذا احتجتِ مساعدة أسرع راسلينا عبر الواتساب.</div>';
            });
        });
    }
    var shell = document.getElementById('heroShell');
    if (shell && !shell.getAttribute('data-swipe-bound')) {
        shell.setAttribute('data-swipe-bound', '1');
        shell.addEventListener('touchstart', function (event) {
            if (!event.touches || !event.touches[0]) return;
            homeState.touchStartX = event.touches[0].clientX;
        });
        shell.addEventListener('touchend', function (event) {
            if (!event.changedTouches || !event.changedTouches[0]) return;
            var diff = event.changedTouches[0].clientX - homeState.touchStartX;
            if (Math.abs(diff) < 40) return;
            if (diff > 0) goToSlide(homeState.currentSlide - 1);
            else goToSlide(homeState.currentSlide + 1);
        });
    }
}

function renderHomeHero() {
    var slides = AqqadStore.state.heroSlides;
    if (!slides.length) slides = normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()).slides;
    var slidesNode = document.getElementById('heroSlides');
    var dotsNode = document.getElementById('heroDots');
    var overlayText = document.getElementById('heroOverlayText');
    var lead = document.getElementById('heroLead');
    slidesNode.innerHTML = slides.map(function (slide, index) {
        var media = slide.type === 'video'
            ? '<video src="' + escapeHtml(slide.url) + '" autoplay muted loop playsinline></video>'
            : '<img src="' + escapeHtml(slide.url) + '" alt="' + escapeHtml(slide.text || 'عقاد كيدز') + '">';
        return '<div class="hero-slide ' + (index === homeState.currentSlide ? 'active' : '') + '">' + media + '<div class="hero-overlay"></div></div>';
    }).join('');
    dotsNode.innerHTML = slides.map(function (slide, index) {
        return '<button class="hero-dot ' + (index === homeState.currentSlide ? 'active' : '') + '" type="button" onclick="goToSlide(' + index + ')"></button>';
    }).join('');
    overlayText.textContent = slides[homeState.currentSlide].text || AqqadStore.state.settings.storeHeadline;
    lead.textContent = AqqadStore.state.settings.heroSubtitle;
    renderHeroHighlights();
    restartHeroTimer();
}

function renderHeroHighlights() {
    var stats = document.getElementById('heroStats');
    stats.innerHTML = ''
        + '<div class="hero-stat"><strong>' + AqqadStore.state.products.length + '+</strong><span>قطعة متنوعة بملمس طفولي أنيق</span></div>'
        + '<div class="hero-stat"><strong>' + (AqqadStore.state.heroSlides.length || 1) + '</strong><span>مشاهد موسمية قابلة للتحديث من الإدارة</span></div>'
        + '<div class="hero-stat"><strong>' + getRegionLabel(AqqadStore.state.region) + '</strong><span>عرض الأسعار مباشرة حسب منطقتك</span></div>'
        + '<div class="hero-stat"><strong>واتساب</strong><span>طلباتك تصلك بخطوات واضحة وسريعة</span></div>';
    document.getElementById('heroStoreHeadline').textContent = AqqadStore.state.settings.storeHeadline;
    document.getElementById('heroQuickLink').href = buildWhatsAppUrl(AqqadStore.state.settings.whatsappNumber, 'مرحباً، أرغب بمعرفة المزيد عن أحدث تشكيلات عقاد كيدز.');
    document.getElementById('instagramHintLink').href = AqqadStore.state.settings.instagramLink;
}

function goToSlide(index) {
    var slides = AqqadStore.state.heroSlides;
    if (!slides.length) return;
    homeState.currentSlide = index;
    if (homeState.currentSlide < 0) homeState.currentSlide = slides.length - 1;
    if (homeState.currentSlide >= slides.length) homeState.currentSlide = 0;
    renderHomeHero();
}

function restartHeroTimer() {
    clearInterval(homeState.slideTimer);
    homeState.slideTimer = setInterval(function () {
        goToSlide(homeState.currentSlide + 1);
    }, 5000);
}

function renderFeaturedBlocks() {
    renderFeatureSection('featuredClothes', 'clothes', 4);
    renderFeatureSection('featuredShoes', 'shoes', 4);
    renderFeatureSection('featuredAccessories', 'accessories-page', 4);
}

function renderFeatureSection(nodeId, type, limit) {
    var node = document.getElementById(nodeId);
    if (!node) return;
    var products = AqqadStore.getProductsByType(type).slice(0, limit);
    node.innerHTML = products.map(function (product) {
        return AqqadStore.renderProductCard(product);
    }).join('');
    AqqadStore.observeNewElements();
}

function renderAboutContent() {
    var about = document.getElementById('aboutText');
    var contact = document.getElementById('whatsappInfoLink');
    if (about) about.textContent = AqqadStore.state.settings.aboutText;
    if (contact) contact.href = buildWhatsAppUrl(AqqadStore.state.settings.whatsappNumber, 'مرحباً، أريد الاستفسار عن التشكيلات المتوفرة لديكم.');
}
