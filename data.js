var STORE_KEY_PREFIX = 'aqqad_';
var CART_STORAGE_KEY = STORE_KEY_PREFIX + 'cart';
var REGION_STORAGE_KEY = STORE_KEY_PREFIX + 'region';
var LAST_ORDER_STORAGE_KEY = STORE_KEY_PREFIX + 'last_order';
var ADMIN_SESSION_KEY = STORE_KEY_PREFIX + 'admin';
var FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 400%27%3E%3Crect fill=%27%23faf6f0%27 width=%27400%27 height=%27400%27/%3E%3Ctext x=%27200%27 y=%27200%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27 font-size=%2780%27 fill=%27%23c9a96e%27%3E👶%3C/text%3E%3C/svg%3E';

var REGION_OPTIONS = {
    palestine: {
        key: 'palestine',
        name: 'فلسطين',
        currency: '₪',
        currencyLabel: 'شيكل',
        locale: 'ar-PS'
    },
    jordan: {
        key: 'jordan',
        name: 'الأردن',
        currency: 'JOD',
        currencyLabel: 'دينار',
        locale: 'ar-JO'
    }
};

var DEFAULT_PRODUCTS = [];
var DEFAULT_DISCOUNTS = [];
var DEFAULT_SITE_SETTINGS = {
    storeNameAr: 'عقاد كيدز',
    storeNameEn: 'Aqqad Kids',
    whatsappNumber: '972569236758',
    heroSubtitle: 'خلّي الأطفال يكونوا أطفال',
    heroTaglines: ['خلّي الأطفال يكونوا أطفال', 'نفتخر بأطفالك', 'Let Kids Be Kids'],
    aboutText: 'عقاد كيدز متجر أطفال بلمسة دافئة وفاخرة، يقدّم ملابس وأحذية وإكسسوارات وكريمات وعطور مختارة بعناية لترافق طفلك في كل يوم جميل. نهتم بالراحة والجودة والتفاصيل الصغيرة التي تصنع فرقاً كبيراً.',
    instagramLink: 'https://www.instagram.com/aqqadkids/',
    deliveryRegions: {
        palestine: [
            { id: 'westbank', name: 'الضفة', price: 20 },
            { id: 'jerusalem', name: 'القدس', price: 30 },
            { id: 'inside', name: 'الداخل', price: 50 }
        ],
        jordan: [
            { id: 'jordan', name: 'الأردن', price: 20 }
        ]
    },
    conversionRate: 12,
    paymentMethods: ['cod', 'visa']
};

var BRANDS_DATA = [
    { name: 'Zara Kids', logo: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=120&h=120&fit=crop' },
    { name: 'H&M Kids', logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&h=120&fit=crop' },
    { name: 'LC Waikiki Kids', logo: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120&h=120&fit=crop' },
    { name: 'Mango Kids', logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=120&h=120&fit=crop' },
    { name: 'Carter\'s', logo: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=120&h=120&fit=crop' },
    { name: 'Mayoral', logo: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=120&h=120&fit=crop' },
    { name: 'Chicco', logo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=120&h=120&fit=crop' },
    { name: 'Johnson\'s Baby', logo: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=120&h=120&fit=crop' }
];

var SIZE_PRESETS = {
    'ملابس': ['0-3 شهور', '3-6 شهور', '6-9 شهور', '9-12 شهور', '1-2 سنة', '2-3 سنة', '3-4 سنة', '4-5 سنة', '5-6 سنة', '6-7 سنة', '7-8 سنة', '8-9 سنة', '9-10 سنة', '10-11 سنة', '11-12 سنة', '12-13 سنة', '13-14 سنة', '14-15 سنة'],
    'أحذية': ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    'إكسسوارات': ['قياس موحد'],
    'كريمات وعطور': ['قياس موحد']
};

function cloneObject(value) {
    return JSON.parse(JSON.stringify(value || {}));
}

function slugify(value) {
    return String(value == null ? '' : value)
        .toLowerCase()
        .replace(/[^a-z0-9؀-ۿ]+/g, '-')
        .replace(/^-+|-+$/g, '') || String(Date.now());
}

function safeArray(list) {
    return Array.isArray(list) ? list : [];
}

function normalizeSizeEntry(entry) {
    if (typeof entry === 'string') {
        return { label: entry, size: entry, price: 0 };
    }
    var source = entry || {};
    var label = String(source.label || source.size || source.name || 'قياس موحد').trim() || 'قياس موحد';
    return {
        label: label,
        size: label,
        price: Math.max(0, Number(source.price != null ? source.price : source.priceBase != null ? source.priceBase : source.basePrice) || 0)
    };
}

function normalizeSizeEntries(product) {
    var sizes = safeArray(product && product.sizes).map(normalizeSizeEntry).filter(function (entry) {
        return entry.label;
    });
    if (!sizes.length) {
        if (product && (product.size || product.label)) {
            sizes = [normalizeSizeEntry({ label: product.size || product.label, price: product.price || product.basePrice || 0 })];
        } else {
            var preset = SIZE_PRESETS[(product && product.category) || 'إكسسوارات'] || ['قياس موحد'];
            sizes = [normalizeSizeEntry({ label: preset[0], price: product && (product.price || product.basePrice || 0) })];
        }
    }
    return sizes;
}

function normalizeProductStatus(status) {
    var allowed = ['active', 'bestseller', 'special', 'soldout'];
    var value = String(status || 'active').toLowerCase();
    return allowed.indexOf(value) >= 0 ? value : 'active';
}

function normalizeProduct(product) {
    var source = product || {};
    return {
        id: String(source.id || source._id || slugify((source.name || 'product') + '-' + (source.brand || 'brand'))),
        name: String(source.name || '').trim(),
        brand: String(source.brand || '').trim(),
        category: String(source.category || 'ملابس').trim(),
        description: String(source.description || '').trim(),
        image: String(source.image || source.imageUrl || FALLBACK_IMAGE).trim() || FALLBACK_IMAGE,
        discount: Math.max(0, Number(source.discount) || 0),
        status: normalizeProductStatus(source.status),
        sizes: normalizeSizeEntries(source)
    };
}

function normalizeProducts(list) {
    return safeArray(list).map(normalizeProduct).sort(function (a, b) {
        return String(a.name).localeCompare(String(b.name), 'ar');
    });
}

function normalizeDiscount(discount) {
    var source = discount || {};
    var values = [];
    if (Array.isArray(source.values)) {
        values = source.values;
    } else if (source.value) {
        values = String(source.value).split(/[;,]/).map(function (item) { return String(item).trim(); }).filter(Boolean);
    }
    return {
        id: String(source.id || slugify(source.description || source.title || 'discount-' + Date.now())),
        title: String(source.title || source.description || 'خصم'),
        type: ['all', 'brand', 'category', 'manual'].indexOf(source.type) >= 0 ? source.type : 'all',
        value: values.join(', '),
        values: values,
        percentage: Math.max(0, Number(source.percentage) || 0),
        description: String(source.description || source.title || '').trim(),
        expiresAt: source.expiresAt ? String(source.expiresAt) : ''
    };
}

function normalizeDiscounts(list) {
    return safeArray(list).map(normalizeDiscount);
}

function normalizeDeliveryRegions(deliveryRegions) {
    var source = deliveryRegions || DEFAULT_SITE_SETTINGS.deliveryRegions;
    var result = {};
    Object.keys(REGION_OPTIONS).forEach(function (regionKey) {
        var list = safeArray(source[regionKey]);
        if (!list.length) list = DEFAULT_SITE_SETTINGS.deliveryRegions[regionKey];
        result[regionKey] = list.map(function (item, index) {
            return {
                id: String(item.id || slugify(regionKey + '-' + (item.name || ('region-' + index)))),
                name: String(item.name || REGION_OPTIONS[regionKey].name),
                price: Math.max(0, Number(item.price) || 0)
            };
        });
    });
    return result;
}

function normalizeUsersDoc(usersDoc) {
    var users = cloneObject(usersDoc || {});
    if (!users.aqqad) {
        users.aqqad = { password: '5555', role: 'admin', name: 'Admin' };
    }
    Object.keys(users).forEach(function (username) {
        users[username] = {
            password: String(users[username].password || ''),
            role: users[username].role === 'worker' ? 'worker' : 'admin',
            name: String(users[username].name || username)
        };
    });
    return users;
}

function normalizeSettings(settings) {
    var source = settings || {};
    var heroTaglines = safeArray(source.heroTaglines).filter(Boolean);
    if (!heroTaglines.length) heroTaglines = DEFAULT_SITE_SETTINGS.heroTaglines.slice();
    var paymentMethods = safeArray(source.paymentMethods).filter(Boolean);
    if (!paymentMethods.length) paymentMethods = DEFAULT_SITE_SETTINGS.paymentMethods.slice();
    return {
        storeNameAr: String(source.storeNameAr || DEFAULT_SITE_SETTINGS.storeNameAr),
        storeNameEn: String(source.storeNameEn || DEFAULT_SITE_SETTINGS.storeNameEn),
        whatsappNumber: extractWhatsappNumber(source.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber),
        heroSubtitle: String(source.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle),
        heroTaglines: heroTaglines,
        aboutText: String(source.aboutText || DEFAULT_SITE_SETTINGS.aboutText),
        instagramLink: String(source.instagramLink || DEFAULT_SITE_SETTINGS.instagramLink),
        deliveryRegions: normalizeDeliveryRegions(source.deliveryRegions),
        conversionRate: Math.max(0.01, Number(source.conversionRate) || DEFAULT_SITE_SETTINGS.conversionRate),
        paymentMethods: paymentMethods
    };
}

function extractWhatsappNumber(input) {
    var raw = String(input || '').trim();
    if (!raw) return DEFAULT_SITE_SETTINGS.whatsappNumber;
    if (raw.indexOf('wa.me/') >= 0) raw = raw.split('wa.me/')[1];
    return raw.replace(/[^0-9]/g, '');
}

function buildWhatsAppUrl(number, message) {
    var safeNumber = extractWhatsappNumber(number);
    return 'https://wa.me/' + safeNumber + (message ? '?text=' + encodeURIComponent(message) : '');
}

function getCurrentRegion() {
    var value = localStorage.getItem(REGION_STORAGE_KEY) || 'palestine';
    return REGION_OPTIONS[value] ? value : 'palestine';
}

function setCurrentRegion(regionKey) {
    var safeRegion = REGION_OPTIONS[regionKey] ? regionKey : 'palestine';
    localStorage.setItem(REGION_STORAGE_KEY, safeRegion);
    return safeRegion;
}

function getRegionConfig(regionKey) {
    return REGION_OPTIONS[REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion()];
}

function getRegionLabel(regionKey) {
    return getRegionConfig(regionKey).name;
}

function getCurrencySymbol(regionKey) {
    return getRegionConfig(regionKey).currency;
}

function convertBasePriceToRegion(basePrice, regionKey, settings) {
    var amount = Math.max(0, Number(basePrice) || 0);
    var safeRegion = REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion();
    var siteSettings = normalizeSettings(settings || DEFAULT_SITE_SETTINGS);
    if (safeRegion === 'jordan') {
        return amount / siteSettings.conversionRate;
    }
    return amount;
}

function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function formatCurrency(basePrice, regionKey, settings) {
    var safeRegion = REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion();
    var converted = convertBasePriceToRegion(basePrice, safeRegion, settings);
    var decimals = safeRegion === 'jordan' ? 2 : 0;
    return (safeRegion === 'jordan' ? 'JOD ' : '₪') + roundMoney(converted).toFixed(decimals);
}

function getRegionDeliveryList(settings, regionKey) {
    var siteSettings = normalizeSettings(settings || DEFAULT_SITE_SETTINGS);
    var safeRegion = REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion();
    return safeArray(siteSettings.deliveryRegions[safeRegion]);
}

function getPaymentMethodLabel(method) {
    var labels = {
        cod: 'الدفع عند الاستلام',
        visa: 'بطاقة ائتمان'
    };
    return labels[method] || method;
}

function getProductStatusLabel(status) {
    var labels = {
        active: 'متوفر',
        bestseller: 'الأكثر طلباً',
        special: 'مميز',
        soldout: 'نفد'
    };
    return labels[status] || 'متوفر';
}

function getOrderStatusLabel(status) {
    var labels = {
        new: 'جديد',
        preparing: 'قيد التحضير',
        prepared: 'جاهز',
        in_delivery: 'في التوصيل',
        completed: 'مكتمل',
        declined: 'مرفوض',
        returned: 'مرتجع'
    };
    return labels[status] || 'جديد';
}

function getPriceForSize(product, sizeIdx) {
    var sizes = safeArray(product && product.sizes);
    if (!sizes.length) return normalizeSizeEntry({ label: 'قياس موحد', price: product && product.price ? product.price : 0 });
    var safeIndex = Math.max(0, Math.min(parseInt(sizeIdx, 10) || 0, sizes.length - 1));
    return normalizeSizeEntry(sizes[safeIndex]);
}

function getProductDiscountPercent(product, discounts) {
    var now = new Date().toISOString().slice(0, 10);
    var applied = Math.max(0, Number(product && product.discount) || 0);
    normalizeDiscounts(discounts).forEach(function (discount) {
        if (!discount.percentage) return;
        if (discount.expiresAt && discount.expiresAt < now) return;
        if (discount.type === 'all') applied = Math.max(applied, discount.percentage);
        if (discount.type === 'brand' && discount.values.indexOf(product.brand) >= 0) applied = Math.max(applied, discount.percentage);
        if (discount.type === 'category' && discount.values.indexOf(product.category) >= 0) applied = Math.max(applied, discount.percentage);
        if (discount.type === 'manual' && discount.values.indexOf(product.id) >= 0) applied = Math.max(applied, discount.percentage);
    });
    return applied;
}

function getFinalPrice(product, sizeIdx, discounts, regionKey, settings) {
    var sizeData = getPriceForSize(product, sizeIdx);
    var originalBase = Math.max(0, Number(sizeData.price) || 0);
    var discountPercent = getProductDiscountPercent(product, discounts || []);
    var finalBase = originalBase;
    if (discountPercent > 0) {
        finalBase = roundMoney(originalBase * (1 - discountPercent / 100));
    }
    return {
        originalBase: originalBase,
        finalBase: finalBase,
        originalFormatted: formatCurrency(originalBase, regionKey, settings),
        finalFormatted: formatCurrency(finalBase, regionKey, settings),
        hasDiscount: discountPercent > 0,
        discountPercent: discountPercent
    };
}

function normalizeCartItems(items, products) {
    return safeArray(items).map(function (item) {
        return {
            id: String(item.id || ''),
            sizeIdx: Math.max(0, parseInt(item.sizeIdx, 10) || 0),
            qty: Math.max(1, parseInt(item.qty, 10) || 1)
        };
    }).filter(function (item) {
        if (!item.id) return false;
        if (!products || !products.length) return true;
        var product = getProductById(products, item.id);
        return !!product;
    });
}

function getProductById(list, id) {
    var safeList = safeArray(list);
    for (var i = 0; i < safeList.length; i += 1) {
        if (String(safeList[i].id) === String(id)) return safeList[i];
    }
    return null;
}

function cartLineTotalBase(product, sizeIdx, qty, discounts) {
    var pricing = getFinalPrice(product, sizeIdx, discounts || [], 'palestine', DEFAULT_SITE_SETTINGS);
    return roundMoney(pricing.finalBase * (Math.max(1, parseInt(qty, 10) || 1)));
}

function formatDateTime(value) {
    var date = value && value.toDate ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function makeOrderId() {
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var result = 'AQ-';
    for (var i = 0; i < 6; i += 1) {
        result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
