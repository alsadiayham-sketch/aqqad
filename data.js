var STORE_KEY_PREFIX = 'aqqad_';
var CART_STORAGE_KEY = STORE_KEY_PREFIX + 'cart';
var REGION_STORAGE_KEY = STORE_KEY_PREFIX + 'region';
var LAST_ORDER_STORAGE_KEY = STORE_KEY_PREFIX + 'last_order';
var CHECKOUT_DRAFT_STORAGE_KEY = STORE_KEY_PREFIX + 'checkout_draft';
var ADMIN_SESSION_KEY = 'aqqad_admin';
var FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 640%22%3E%3Crect fill=%22%23f8efe3%22 width=%22640%22 height=%22640%22 rx=%2248%22/%3E%3Ccircle fill=%22%23f4d9cd%22 cx=%22192%22 cy=%22184%22 r=%2296%22/%3E%3Ccircle fill=%22%23d8f1e6%22 cx=%22488%22 cy=%22156%22 r=%2274%22/%3E%3Ccircle fill=%22%23e3dcff%22 cx=%22488%22 cy=%22472%22 r=%2292%22/%3E%3Cpath fill=%22%23d4ad69%22 d=%22M127 410c39-88 116-132 225-132 95 0 160 35 194 104 26 53 34 126 22 194H88c-13-60 2-117 39-166Z%22/%3E%3Ctext x=%2250%25%22 y=%2254%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Cairo, Arial%22 font-size=%2280%22 fill=%22%23684b24%22%3E%D8%B9%D9%82%D8%A7%D8%AF%3C/text%3E%3C/svg%3E';
var DEFAULT_WHATSAPP_NUMBER = '972569236758';

var REGION_OPTIONS = {
    palestine: { key: 'palestine', name: 'فلسطين', currency: '₪', currencyLabel: 'شيكل', locale: 'ar-PS' },
    jordan: { key: 'jordan', name: 'الأردن', currency: 'JOD', currencyLabel: 'دينار', locale: 'ar-JO' }
};

var PRODUCT_TYPE_OPTIONS = {
    clothes: { key: 'clothes', label: 'ملابس' },
    shoes: { key: 'shoes', label: 'أحذية' },
    accessories: { key: 'accessories', label: 'إكسسوارات' },
    creams: { key: 'creams', label: 'عناية وعطور' }
};

var ACCESSORY_SUBCATEGORY_OPTIONS = {
    accessories: 'إكسسوارات',
    creams: 'كريمات',
    perfumes: 'عطور'
};

var AGE_GROUP_OPTIONS = {
    baby: { key: 'baby', label: 'حديثي الولادة (0-12 شهر)', sizes: ['0-3 شهور', '3-6 شهور', '6-9 شهور', '9-12 شهور'] },
    toddler: { key: 'toddler', label: 'طفل صغير (1-4 سنة)', sizes: ['1-2', '2-3', '3-4'] },
    kids: { key: 'kids', label: 'أطفال (5-10 سنة)', sizes: ['S', 'M', 'L', 'XL'] },
    teens: { key: 'teens', label: 'مراهقين (11-15 سنة)', sizes: ['S', 'M', 'L', 'XL', 'XXL'] }
};

var SHOE_SIZES = ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'];
var DEFAULT_PRODUCTS = [];
var DEFAULT_DISCOUNTS = [];
var DEFAULT_SITE_SETTINGS = {
    storeNameAr: 'عقاد كيدز',
    storeHeadline: 'ألوان طفولية بلمسة فاخرة',
    heroSubtitle: 'تشكيلات ناعمة، خطوات مريحة، وتفاصيل تجعل كل إطلالة قصة صغيرة جميلة.',
    aboutText: 'عقاد كيدز مساحة طفولية دافئة تجمع بين الأناقة والراحة. نختار القطع بعناية لتناسب حركة الأطفال اليومية، مناسباتهم اللطيفة، وذكريات العائلة التي نحب أن تبقى مشرقة.',
    instagramLink: 'https://www.instagram.com/aqqadkids/',
    whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
    conversionRate: 12,
    paymentMethods: ['cod', 'visa'],
    deliveryRegions: {
        palestine: [
            { id: 'westbank', name: 'الضفة الغربية', price: 20 },
            { id: 'jerusalem', name: 'القدس', price: 30 },
            { id: 'inside', name: 'الداخل', price: 50 }
        ],
        jordan: [
            { id: 'amman', name: 'عمّان والمحافظات', price: 20 }
        ]
    }
};

function cloneObject(value) {
    return JSON.parse(JSON.stringify(value == null ? {} : value));
}

function safeArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]' ? value : [];
}

function slugify(value) {
    var output = String(value == null ? '' : value)
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return output || 'item-' + String(new Date().getTime());
}

function normalizeSearchText(value) {
    return String(value == null ? '' : value)
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '')
        .trim();
}

function extractWhatsappNumber(value) {
    var raw = String(value || '').trim();
    if (!raw) return DEFAULT_WHATSAPP_NUMBER;
    if (raw.indexOf('wa.me/') >= 0) raw = raw.split('wa.me/')[1];
    return raw.replace(/[^0-9]/g, '') || DEFAULT_WHATSAPP_NUMBER;
}

function buildWhatsAppUrl(number, message) {
    var safeNumber = extractWhatsappNumber(number);
    return 'https://wa.me/' + safeNumber + (message ? '?text=' + encodeURIComponent(message) : '');
}

function getDefaultHeroSlidesDoc() {
    return {
        slides: [
            { id: 'hero-default-1', type: 'image', url: 'hero-bg.png', text: 'تشكيلة الموسم لأجمل يومياتهم', order: 0 },
            { id: 'hero-default-2', type: 'image', url: 'hero-bg.png', text: 'أقمشة ناعمة تلائم حركتهم الحرة', order: 1 }
        ]
    };
}

function normalizeHeroSlide(slide, index) {
    var source = slide || {};
    var type = String(source.type || 'image').toLowerCase();
    if (['image', 'gif', 'video'].indexOf(type) < 0) type = 'image';
    return {
        id: String(source.id || 'slide-' + index + '-' + new Date().getTime()),
        type: type,
        url: String(source.url || 'hero-bg.png'),
        text: String(source.text || '').trim(),
        order: Number(source.order != null ? source.order : index) || 0
    };
}

function normalizeHeroSlidesDoc(doc) {
    var source = doc && doc.slides ? doc : getDefaultHeroSlidesDoc();
    var slides = safeArray(source.slides).map(function (slide, index) {
        return normalizeHeroSlide(slide, index);
    }).sort(function (a, b) {
        return a.order - b.order;
    });
    if (!slides.length) return getDefaultHeroSlidesDoc();
    return { slides: slides };
}

function normalizeProductType(value) {
    var type = String(value || '').toLowerCase();
    if (PRODUCT_TYPE_OPTIONS[type]) return type;
    if (value === 'ملابس') return 'clothes';
    if (value === 'أحذية') return 'shoes';
    if (value === 'إكسسوارات') return 'accessories';
    if (value === 'كريمات وعطور' || value === 'عناية وعطور') return 'creams';
    return 'clothes';
}

function normalizeAgeGroup(value) {
    var key = String(value || '').toLowerCase();
    return AGE_GROUP_OPTIONS[key] ? key : '';
}

function getTypeLabel(type) {
    return PRODUCT_TYPE_OPTIONS[normalizeProductType(type)].label;
}

function getAgeGroupLabel(ageGroup) {
    var key = normalizeAgeGroup(ageGroup);
    return key ? AGE_GROUP_OPTIONS[key].label : 'بدون';
}

function getAccessorySubcategoryLabel(key) {
    var safeKey = String(key || 'accessories').toLowerCase();
    return ACCESSORY_SUBCATEGORY_OPTIONS[safeKey] || ACCESSORY_SUBCATEGORY_OPTIONS.accessories;
}

function getProductStatusLabel(status) {
    var map = {
        normal: 'متوفر',
        bestseller: 'الأكثر طلباً',
        special: 'قطعة مميّزة',
        soldout: 'نفدت الكمية'
    };
    return map[String(status || 'normal').toLowerCase()] || map.normal;
}

function normalizeProductStatus(value) {
    var status = String(value || 'normal').toLowerCase();
    if (status === 'active') status = 'normal';
    return ['normal', 'bestseller', 'special', 'soldout'].indexOf(status) >= 0 ? status : 'normal';
}

function normalizeSizeEntry(entry, defaultLabel) {
    if (typeof entry === 'string') {
        return { size: entry, label: entry, price: 0 };
    }
    var source = entry || {};
    var label = String(source.label || source.size || defaultLabel || 'واحد').trim() || 'واحد';
    return {
        size: label,
        label: label,
        price: Math.max(0, Number(source.price != null ? source.price : source.basePrice) || 0)
    };
}

function getDefaultSizesForProduct(type, ageGroup) {
    var safeType = normalizeProductType(type);
    if (safeType === 'shoes') {
        return SHOE_SIZES.slice(0, 5).map(function (size) { return { size: size, label: size, price: 0 }; });
    }
    if (safeType === 'clothes' && AGE_GROUP_OPTIONS[ageGroup]) {
        return AGE_GROUP_OPTIONS[ageGroup].sizes.map(function (size) { return { size: size, label: size, price: 0 }; });
    }
    return [{ size: 'واحد', label: 'واحد', price: 0 }];
}

function normalizeSizes(source, type, ageGroup) {
    var list = safeArray(source).map(function (entry) { return normalizeSizeEntry(entry); }).filter(function (entry) {
        return entry.label;
    });
    if (!list.length) list = getDefaultSizesForProduct(type, ageGroup);
    return list;
}

function normalizeProduct(product) {
    var source = product || {};
    var type = normalizeProductType(source.type || source.category);
    var ageGroup = type === 'clothes' ? normalizeAgeGroup(source.ageGroup) : '';
    var subCategory = type === 'creams' ? String(source.subCategory || source.subcategory || 'creams').toLowerCase() : 'accessories';
    if (type === 'accessories') subCategory = 'accessories';
    if (type === 'creams' && ['creams', 'perfumes'].indexOf(subCategory) < 0) subCategory = 'creams';
    var sizes = normalizeSizes(source.sizes, type, ageGroup);
    return {
        id: String(source.id || slugify((source.name || 'product') + '-' + (source.brand || 'brand'))),
        name: String(source.name || '').trim(),
        type: type,
        brand: String(source.brand || 'Aqqad Kids').trim(),
        sizes: sizes,
        ageGroup: ageGroup,
        discount: Math.max(0, Number(source.discount) || 0),
        image: String(source.image || source.imageUrl || FALLBACK_IMAGE).trim() || FALLBACK_IMAGE,
        status: normalizeProductStatus(source.status),
        description: String(source.description || '').trim(),
        subCategory: subCategory,
        categoryLabel: getTypeLabel(type),
        ageGroupLabel: getAgeGroupLabel(ageGroup),
        createdAtIso: String(source.createdAtIso || '')
    };
}

function normalizeProducts(list) {
    return safeArray(list).map(function (item) {
        return normalizeProduct(item);
    }).filter(function (item) {
        return item.name;
    }).sort(function (a, b) {
        return String(a.name).localeCompare(String(b.name), 'ar');
    });
}

function normalizeDiscount(discount) {
    var source = discount || {};
    var values = safeArray(source.values);
    if (!values.length && source.value) {
        values = String(source.value).split(/[;,]/).map(function (value) { return String(value).trim(); }).filter(Boolean);
    }
    var type = String(source.type || 'all').toLowerCase();
    if (['all', 'brand', 'type', 'manual'].indexOf(type) < 0) type = 'all';
    return {
        id: String(source.id || slugify(source.title || source.description || 'discount')),
        title: String(source.title || source.description || 'خصم خاص').trim(),
        type: type,
        values: values,
        percentage: Math.max(0, Number(source.percentage) || 0),
        description: String(source.description || '').trim(),
        expiresAt: String(source.expiresAt || '').trim()
    };
}

function normalizeDiscounts(list) {
    return safeArray(list).map(function (item) { return normalizeDiscount(item); });
}

function normalizeDeliveryRegions(deliveryRegions) {
    var source = deliveryRegions || DEFAULT_SITE_SETTINGS.deliveryRegions;
    var result = {};
    var keys = Object.keys(REGION_OPTIONS);
    for (var i = 0; i < keys.length; i += 1) {
        var region = keys[i];
        var list = safeArray(source[region]);
        if (!list.length) list = DEFAULT_SITE_SETTINGS.deliveryRegions[region];
        result[region] = list.map(function (item, index) {
            return {
                id: String(item.id || slugify(region + '-' + index + '-' + (item.name || 'region'))),
                name: String(item.name || REGION_OPTIONS[region].name),
                price: Math.max(0, Number(item.price) || 0)
            };
        });
    }
    return result;
}

function normalizeSettings(settings) {
    var source = settings || {};
    var paymentMethods = safeArray(source.paymentMethods).filter(Boolean);
    if (!paymentMethods.length) paymentMethods = DEFAULT_SITE_SETTINGS.paymentMethods.slice();
    return {
        storeNameAr: String(source.storeNameAr || DEFAULT_SITE_SETTINGS.storeNameAr),
        storeHeadline: String(source.storeHeadline || DEFAULT_SITE_SETTINGS.storeHeadline),
        heroSubtitle: String(source.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle),
        aboutText: String(source.aboutText || DEFAULT_SITE_SETTINGS.aboutText),
        instagramLink: String(source.instagramLink || DEFAULT_SITE_SETTINGS.instagramLink),
        whatsappNumber: extractWhatsappNumber(source.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber),
        conversionRate: Math.max(0.01, Number(source.conversionRate) || DEFAULT_SITE_SETTINGS.conversionRate),
        paymentMethods: paymentMethods,
        deliveryRegions: normalizeDeliveryRegions(source.deliveryRegions)
    };
}

function normalizeUsersDoc(doc) {
    var source = cloneObject(doc || {});
    if (!source.aqqad) {
        source.aqqad = { password: '5555', role: 'admin', name: 'المدير الرئيسي' };
    }
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; i += 1) {
        var key = keys[i];
        source[key] = {
            password: String(source[key].password || ''),
            role: source[key].role === 'worker' ? 'worker' : 'admin',
            name: String(source[key].name || key)
        };
    }
    return source;
}

function getCurrentRegion() {
    var value = localStorage.getItem(REGION_STORAGE_KEY) || 'palestine';
    return REGION_OPTIONS[value] ? value : 'palestine';
}

function setCurrentRegion(regionKey) {
    var next = REGION_OPTIONS[regionKey] ? regionKey : 'palestine';
    localStorage.setItem(REGION_STORAGE_KEY, next);
    return next;
}

function getRegionConfig(regionKey) {
    return REGION_OPTIONS[REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion()];
}

function getRegionLabel(regionKey) {
    return getRegionConfig(regionKey).name;
}

function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function convertBasePriceToRegion(basePrice, regionKey, settings) {
    var siteSettings = normalizeSettings(settings || DEFAULT_SITE_SETTINGS);
    var amount = Math.max(0, Number(basePrice) || 0);
    return regionKey === 'jordan' ? amount / siteSettings.conversionRate : amount;
}

function formatCurrency(basePrice, regionKey, settings) {
    var safeRegion = REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion();
    var converted = convertBasePriceToRegion(basePrice, safeRegion, settings);
    var decimals = safeRegion === 'jordan' ? 2 : 0;
    return (safeRegion === 'jordan' ? 'JOD ' : '₪ ') + roundMoney(converted).toFixed(decimals);
}

function getPriceForSize(product, sizeIndex) {
    var sizes = safeArray(product && product.sizes);
    if (!sizes.length) return { label: 'واحد', size: 'واحد', price: 0 };
    var index = Math.max(0, Math.min(parseInt(sizeIndex, 10) || 0, sizes.length - 1));
    return normalizeSizeEntry(sizes[index], 'واحد');
}

function getProductDiscountPercent(product, discounts) {
    var applied = Math.max(0, Number(product && product.discount) || 0);
    var list = normalizeDiscounts(discounts || []);
    var today = new Date().toISOString().slice(0, 10);
    for (var i = 0; i < list.length; i += 1) {
        var discount = list[i];
        if (!discount.percentage) continue;
        if (discount.expiresAt && discount.expiresAt < today) continue;
        if (discount.type === 'all') applied = Math.max(applied, discount.percentage);
        if (discount.type === 'brand' && discount.values.indexOf(product.brand) >= 0) applied = Math.max(applied, discount.percentage);
        if (discount.type === 'type' && discount.values.indexOf(product.type) >= 0) applied = Math.max(applied, discount.percentage);
        if (discount.type === 'manual' && discount.values.indexOf(product.id) >= 0) applied = Math.max(applied, discount.percentage);
    }
    return applied;
}

function getFinalPrice(product, sizeIndex, discounts, regionKey, settings) {
    var sizeData = getPriceForSize(product, sizeIndex);
    var originalBase = Math.max(0, Number(sizeData.price) || 0);
    var discountPercent = getProductDiscountPercent(product, discounts);
    var finalBase = discountPercent ? roundMoney(originalBase * (1 - discountPercent / 100)) : originalBase;
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
    var list = safeArray(items).map(function (item) {
        return {
            id: String(item.id || ''),
            sizeIdx: Math.max(0, parseInt(item.sizeIdx, 10) || 0),
            qty: Math.max(1, parseInt(item.qty, 10) || 1)
        };
    }).filter(function (item) {
        if (!item.id) return false;
        if (!products || !products.length) return true;
        return !!getProductById(products, item.id);
    });
    return list;
}

function getProductById(list, id) {
    var products = safeArray(list);
    for (var i = 0; i < products.length; i += 1) {
        if (String(products[i].id) === String(id)) return products[i];
    }
    return null;
}

function getRegionDeliveryList(settings, regionKey) {
    var siteSettings = normalizeSettings(settings || DEFAULT_SITE_SETTINGS);
    var safeRegion = REGION_OPTIONS[regionKey] ? regionKey : getCurrentRegion();
    return safeArray(siteSettings.deliveryRegions[safeRegion]);
}

function getPaymentMethodLabel(method) {
    var map = { cod: 'الدفع عند الاستلام', visa: 'بطاقة فيزا' };
    return map[String(method || 'cod').toLowerCase()] || map.cod;
}

function getOrderStatusLabel(status) {
    var map = {
        new: 'جديد',
        preparing: 'قيد التحضير',
        prepared: 'جاهز للتجهيز',
        in_delivery: 'في الطريق',
        completed: 'مكتمل',
        declined: 'مرفوض',
        returned: 'مرتجع'
    };
    return map[String(status || 'new').toLowerCase()] || map.new;
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
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var output = 'AQ-';
    for (var i = 0; i < 6; i += 1) {
        output += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return output;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
