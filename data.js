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
    kids: { key: 'kids', label: 'أطفال (5-10 سنة)', sizes: ['4-5', '5-6', '6-7', '7-8', '8-9', '9-10'] },
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
        active: 'متوفر',
        soldout: 'نفدت الكمية',
        hidden: 'مخفي'
    };
    return map[String(status || 'active').toLowerCase()] || map.active;
}

function normalizeProductStatus(value) {
    var status = String(value || 'active').toLowerCase();
    return ['active', 'soldout', 'hidden'].indexOf(status) >= 0 ? status : 'active';
}

function normalizeColorName(value, fallback) {
    var name = String(value || fallback || 'الافتراضي').trim();
    return name || 'الافتراضي';
}

function normalizeColorEntry(entry, index, fallbackImage) {
    var source = entry || {};
    var images = safeArray(source.images || source.imageUrls).map(function (image) {
        return String(image || '').trim();
    }).filter(Boolean);
    if (!images.length && source.image) images = [String(source.image).trim()];
    if (!images.length && fallbackImage) images = [fallbackImage];
    return {
        name: normalizeColorName(source.name, 'لون ' + (index + 1)),
        hex: String(source.hex || '#d9d9d9').trim() || '#d9d9d9',
        images: images.length ? images : [FALLBACK_IMAGE]
    };
}

function getDefaultSizesForProduct(type, ageGroup) {
    var safeType = normalizeProductType(type);
    if (safeType === 'shoes') {
        return SHOE_SIZES.slice(4, 9).map(function (size) { return { size: size, label: size, price: 0 }; });
    }
    if (safeType === 'clothes' && AGE_GROUP_OPTIONS[ageGroup]) {
        return AGE_GROUP_OPTIONS[ageGroup].sizes.map(function (size) { return { size: size, label: size, price: 0 }; });
    }
    return [{ size: 'واحد', label: 'واحد', price: 0 }];
}

function getDefaultSizeLabels(type, ageGroup) {
    return getDefaultSizesForProduct(type, ageGroup).map(function (entry) { return entry.label; });
}

function normalizeLegacySizeEntry(entry, defaultLabel) {
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

function normalizeColors(source, type, fallbackImage) {
    var colors = safeArray(source).map(function (entry, index) {
        return normalizeColorEntry(entry, index, fallbackImage);
    }).filter(function (entry) {
        return entry.name;
    });
    if (!colors.length) {
        colors = [normalizeColorEntry({ name: 'الافتراضي', hex: type === 'creams' ? '#f3d6d8' : '#d9d9d9', images: fallbackImage ? [fallbackImage] : [FALLBACK_IMAGE] }, 0, fallbackImage)];
    }
    return colors;
}

function buildVariantsFromLegacySizes(legacySizes, colors) {
    var sizeEntries = safeArray(legacySizes).map(function (entry) {
        return normalizeLegacySizeEntry(entry);
    }).filter(function (entry) {
        return entry.label;
    });
    if (!sizeEntries.length) return [];
    var defaultColor = colors[0] || { name: 'الافتراضي' };
    return sizeEntries.map(function (entry) {
        return {
            size: entry.label,
            color: defaultColor.name,
            stock: 10,
            price: Math.max(0, Number(entry.price) || 0)
        };
    });
}

function normalizeVariantEntry(entry, colors) {
    var source = entry || {};
    var defaultColor = colors[0] ? colors[0].name : 'الافتراضي';
    return {
        size: String(source.size || source.label || 'واحد').trim() || 'واحد',
        color: normalizeColorName(source.color, defaultColor),
        stock: Math.max(0, parseInt(source.stock, 10) || 0),
        price: Math.max(0, Number(source.price != null ? source.price : source.basePrice) || 0)
    };
}

function ensureVariantMatrix(variants, colors, sizeLabels) {
    var colorNames = colors.map(function (color) { return color.name; });
    var output = [];
    var seen = {};
    var i;
    for (i = 0; i < variants.length; i += 1) {
        var variant = variants[i];
        if (!variant.size) continue;
        if (colorNames.indexOf(variant.color) < 0) variant.color = colorNames[0] || 'الافتراضي';
        var key = variant.size + '||' + variant.color;
        if (seen[key]) continue;
        seen[key] = true;
        output.push(variant);
    }
    for (i = 0; i < sizeLabels.length; i += 1) {
        for (var j = 0; j < colorNames.length; j += 1) {
            var comboKey = sizeLabels[i] + '||' + colorNames[j];
            if (!seen[comboKey]) {
                output.push({ size: sizeLabels[i], color: colorNames[j], stock: 0, price: 0 });
                seen[comboKey] = true;
            }
        }
    }
    return output;
}

function normalizeVariants(source, colors, type, ageGroup, legacySizes) {
    var variants = safeArray(source).map(function (entry) {
        return normalizeVariantEntry(entry, colors);
    }).filter(function (entry) {
        return entry.size;
    });
    if (!variants.length) variants = buildVariantsFromLegacySizes(legacySizes, colors);
    var sizeLabels = [];
    for (var i = 0; i < variants.length; i += 1) {
        if (sizeLabels.indexOf(variants[i].size) < 0) sizeLabels.push(variants[i].size);
    }
    if (!sizeLabels.length) sizeLabels = getDefaultSizeLabels(type, ageGroup);
    return ensureVariantMatrix(variants, colors, sizeLabels);
}

function getVariant(product, size, colorName) {
    var variants = safeArray(product && product.variants);
    var targetSize = String(size == null ? '' : size).trim();
    var targetColor = normalizeColorName(colorName, '');
    for (var i = 0; i < variants.length; i += 1) {
        var variant = variants[i];
        if (targetSize && String(variant.size) !== targetSize) continue;
        if (targetColor && String(variant.color) !== targetColor) continue;
        return {
            size: String(variant.size),
            label: String(variant.size),
            color: String(variant.color),
            stock: Math.max(0, parseInt(variant.stock, 10) || 0),
            price: Math.max(0, Number(variant.price) || 0)
        };
    }
    return null;
}

function getProductSizeLabels(product) {
    var variants = safeArray(product && product.variants);
    var labels = [];
    for (var i = 0; i < variants.length; i += 1) {
        if (labels.indexOf(variants[i].size) < 0) labels.push(String(variants[i].size));
    }
    if (!labels.length) labels = getDefaultSizeLabels(product && product.type, product && product.ageGroup);
    return labels;
}

function getColorByName(product, colorName) {
    var colors = safeArray(product && product.colors);
    var target = normalizeColorName(colorName, '');
    for (var i = 0; i < colors.length; i += 1) {
        if (String(colors[i].name) === target) return colors[i];
    }
    return colors[0] || null;
}

function getProductImageForColor(product, colorName) {
    var color = getColorByName(product, colorName);
    if (color && safeArray(color.images).length) return color.images[0];
    return String(product && product.image || FALLBACK_IMAGE);
}

function getAvailableColors(product) {
    var colors = safeArray(product && product.colors);
    var output = [];
    for (var i = 0; i < colors.length; i += 1) {
        if (isColorAvailable(product, colors[i].name)) output.push(colors[i]);
    }
    return output;
}

function getAvailableSizes(product, colorName) {
    var variants = safeArray(product && product.variants);
    var sizes = [];
    for (var i = 0; i < variants.length; i += 1) {
        var variant = variants[i];
        if (String(variant.color) !== String(colorName)) continue;
        if ((parseInt(variant.stock, 10) || 0) <= 0) continue;
        if (sizes.indexOf(variant.size) < 0) sizes.push(String(variant.size));
    }
    return sizes;
}

function isColorAvailable(product, colorName) {
    var variants = safeArray(product && product.variants);
    for (var i = 0; i < variants.length; i += 1) {
        if (String(variants[i].color) === String(colorName) && (parseInt(variants[i].stock, 10) || 0) > 0) return true;
    }
    return false;
}

function isProductSoldOut(product) {
    var variants = safeArray(product && product.variants);
    if (!variants.length) return true;
    for (var i = 0; i < variants.length; i += 1) {
        if ((parseInt(variants[i].stock, 10) || 0) > 0) return false;
    }
    return true;
}

function getTotalStock(product) {
    var variants = safeArray(product && product.variants);
    var total = 0;
    for (var i = 0; i < variants.length; i += 1) total += Math.max(0, parseInt(variants[i].stock, 10) || 0);
    return total;
}

function getDefaultVariant(product, preferredColor) {
    var availableColors = getAvailableColors(product);
    var targetColor = preferredColor || (availableColors[0] && availableColors[0].name) || (product && product.colors && product.colors[0] ? product.colors[0].name : '');
    var sizes = getAvailableSizes(product, targetColor);
    if (sizes.length) return getVariant(product, sizes[0], targetColor);
    var variants = safeArray(product && product.variants);
    return variants.length ? getVariant(product, variants[0].size, variants[0].color) : null;
}

function normalizeProduct(product) {
    var source = product || {};
    var type = normalizeProductType(source.type || source.category);
    var ageGroup = type === 'clothes' ? normalizeAgeGroup(source.ageGroup) : '';
    var subCategory = type === 'creams' ? String(source.subCategory || source.subcategory || 'creams').toLowerCase() : 'accessories';
    if (type === 'accessories') subCategory = 'accessories';
    if (type === 'creams' && ['creams', 'perfumes'].indexOf(subCategory) < 0) subCategory = 'creams';
    var sourceImage = String(source.image || source.imageUrl || FALLBACK_IMAGE).trim() || FALLBACK_IMAGE;
    var colors = normalizeColors(source.colors, type, sourceImage);
    var variants = normalizeVariants(source.variants, colors, type, ageGroup, source.sizes);
    var displayImage = sourceImage;
    if (!displayImage || displayImage === FALLBACK_IMAGE) displayImage = getProductImageForColor({ colors: colors, image: sourceImage }, colors[0] ? colors[0].name : '');
    var status = normalizeProductStatus(source.status);
    if (status !== 'hidden') status = isProductSoldOut({ variants: variants }) ? 'soldout' : 'active';
    return {
        id: String(source.id || String(new Date().getTime())).trim(),
        name: String(source.name || '').trim(),
        type: type,
        brand: String(source.brand || 'Aqqad Kids').trim(),
        ageGroup: ageGroup,
        description: String(source.description || '').trim(),
        status: status,
        discount: Math.max(0, Number(source.discount) || 0),
        image: displayImage || FALLBACK_IMAGE,
        colors: colors,
        variants: variants,
        subCategory: subCategory,
        categoryLabel: getTypeLabel(type),
        ageGroupLabel: getAgeGroupLabel(ageGroup),
        createdAtIso: String(source.createdAtIso || ''),
        totalStock: getTotalStock({ variants: variants })
    };
}

function normalizeProducts(list) {
    return safeArray(list).map(function (item) {
        return normalizeProduct(item);
    }).filter(function (item) {
        return item.name;
    }).sort(function (a, b) {
        if (a.status !== b.status) {
            if (a.status === 'hidden') return 1;
            if (b.status === 'hidden') return -1;
            if (a.status === 'soldout') return 1;
            if (b.status === 'soldout') return -1;
        }
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

function getPriceForSize(product, sizeOrVariant, colorName) {
    if (sizeOrVariant && typeof sizeOrVariant === 'object' && sizeOrVariant.size && sizeOrVariant.color) {
        return getVariant(product, sizeOrVariant.size, sizeOrVariant.color) || getDefaultVariant(product, colorName) || { label: 'واحد', size: 'واحد', color: '', stock: 0, price: 0 };
    }
    var sizeLabels = getProductSizeLabels(product);
    var selectedSize = '';
    if (typeof sizeOrVariant === 'number') {
        var index = Math.max(0, Math.min(parseInt(sizeOrVariant, 10) || 0, sizeLabels.length - 1));
        selectedSize = sizeLabels[index] || '';
    } else {
        selectedSize = String(sizeOrVariant == null ? '' : sizeOrVariant).trim();
    }
    var variant = null;
    if (selectedSize) variant = getVariant(product, selectedSize, colorName);
    if (!variant && selectedSize) {
        var variants = safeArray(product && product.variants);
        for (var i = 0; i < variants.length; i += 1) {
            if (String(variants[i].size) === selectedSize) {
                variant = getVariant(product, selectedSize, variants[i].color);
                break;
            }
        }
    }
    if (!variant) variant = getDefaultVariant(product, colorName);
    return variant || { label: selectedSize || 'واحد', size: selectedSize || 'واحد', color: colorName || '', stock: 0, price: 0 };
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

function getFinalPrice(product, sizeOrVariant, discounts, regionKey, settings, colorName) {
    var variant = getPriceForSize(product, sizeOrVariant, colorName);
    var originalBase = Math.max(0, Number(variant.price) || 0);
    var discountPercent = getProductDiscountPercent(product, discounts);
    var finalBase = discountPercent ? roundMoney(originalBase * (1 - discountPercent / 100)) : originalBase;
    return {
        variant: variant,
        originalBase: originalBase,
        finalBase: finalBase,
        originalFormatted: formatCurrency(originalBase, regionKey, settings),
        finalFormatted: formatCurrency(finalBase, regionKey, settings),
        hasDiscount: discountPercent > 0,
        discountPercent: discountPercent
    };
}

function normalizeCartItems(items, products) {
    var rawItems = safeArray(items);
    for (var i = 0; i < rawItems.length; i += 1) {
        if (rawItems[i] && rawItems[i].sizeIdx != null) return [];
    }
    var list = rawItems.map(function (item) {
        return {
            id: String(item && item.id || ''),
            color: String(item && (item.color || item.colorName) || '').trim(),
            size: String(item && item.size || '').trim(),
            qty: Math.max(1, parseInt(item && item.qty, 10) || 1)
        };
    }).filter(function (item) {
        if (!item.id || !item.color || !item.size) return false;
        if (!products || !products.length) return true;
        var product = getProductById(products, item.id);
        if (!product) return false;
        return !!getVariant(product, item.size, item.color);
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
