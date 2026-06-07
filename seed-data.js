var SEED_PRODUCTS = [
    { id: 'aq-baby-cloud-romper', name: 'رومبر غيمة ناعمة', type: 'clothes', brand: 'Carter\'s', ageGroup: 'baby', discount: 10, image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'رومبر قطني بخياطة لطيفة وسهلة اللبس لأيام البيبي الأولى.', sizes: [{ size: '0-3 شهور', price: 42 }, { size: '3-6 شهور', price: 42 }, { size: '6-9 شهور', price: 46 }] },
    { id: 'aq-baby-sun-set', name: 'طقم شمس البيبي', type: 'clothes', brand: 'Zara Kids', ageGroup: 'baby', discount: 0, image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'طقم قطعتين بملمس حنون وألوان صباحية هادئة.', sizes: [{ size: '3-6 شهور', price: 58 }, { size: '6-9 شهور', price: 58 }, { size: '9-12 شهور', price: 62 }] },
    { id: 'aq-toddler-blossom-dress', name: 'فستان زهر الربيع', type: 'clothes', brand: 'Mayoral', ageGroup: 'toddler', discount: 12, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'فستان طبقات خفيف بحضور مبهج للحفلات العائلية.', sizes: [{ size: '1-2', price: 82 }, { size: '2-3', price: 82 }, { size: '3-4', price: 88 }] },
    { id: 'aq-toddler-sand-set', name: 'طقم رمل اللعب', type: 'clothes', brand: 'LC Waikiki Kids', ageGroup: 'toddler', discount: 5, image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'طقم يومي مرن للحركة واللعب مع قماش سهل الغسل.', sizes: [{ size: '1-2', price: 64 }, { size: '2-3', price: 64 }, { size: '3-4', price: 68 }] },
    { id: 'aq-kids-lavender-jacket', name: 'جاكيت لافندر مرح', type: 'clothes', brand: 'Mango Kids', ageGroup: 'kids', discount: 8, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'جاكيت خفيف يمنح الإطلالة دفئاً أنيقاً في الصباح والمساء.', sizes: [{ size: 'S', price: 115 }, { size: 'M', price: 118 }, { size: 'L', price: 122 }, { size: 'XL', price: 128 }] },
    { id: 'aq-kids-linen-shirt', name: 'قميص لينن للأبطال', type: 'clothes', brand: 'H&M Kids', ageGroup: 'kids', discount: 0, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'قميص عملي للمشاوير والمناسبات بخامة مريحة على البشرة.', sizes: [{ size: 'S', price: 79 }, { size: 'M', price: 79 }, { size: 'L', price: 84 }, { size: 'XL', price: 84 }] },
    { id: 'aq-kids-ribbon-set', name: 'طقم فيونكة سكري', type: 'clothes', brand: 'Zara Kids', ageGroup: 'kids', discount: 6, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'إطلالة متناسقة للبنات مع تفاصيل ناعمة ولمعة راقية.', sizes: [{ size: 'S', price: 102 }, { size: 'M', price: 105 }, { size: 'L', price: 109 }, { size: 'XL', price: 112 }] },
    { id: 'aq-teens-oat-hoodie', name: 'هودي شوفان مريح', type: 'clothes', brand: 'Mango Kids', ageGroup: 'teens', discount: 14, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'هودي واسع بستايل عصري للأعمار الكبيرة ولمسات يومية مرنة.', sizes: [{ size: 'S', price: 128 }, { size: 'M', price: 132 }, { size: 'L', price: 136 }, { size: 'XL', price: 139 }, { size: 'XXL', price: 144 }] },
    { id: 'aq-teens-soft-skirt', name: 'تنورة موف ناعمة', type: 'clothes', brand: 'Zara Kids', ageGroup: 'teens', discount: 9, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'تنورة بطبقات خفيفة تعطي الحركة شكلاً لعبياً أنيقاً.', sizes: [{ size: 'S', price: 96 }, { size: 'M', price: 98 }, { size: 'L', price: 102 }, { size: 'XL', price: 106 }, { size: 'XXL', price: 110 }] },
    { id: 'aq-first-step-shoes', name: 'حذاء أول خطوة', type: 'shoes', brand: 'Chicco', discount: 0, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'حذاء بقاعدة مرنة يدعم الخطوات الأولى بلطف وثبات.', sizes: [{ size: '16', price: 68 }, { size: '17', price: 68 }, { size: '18', price: 72 }, { size: '19', price: 72 }] },
    { id: 'aq-gold-party-shoes', name: 'حذاء الحفلة الذهبي', type: 'shoes', brand: 'Zara Kids', discount: 10, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'حذاء لامع للمناسبات الصغيرة بتفاصيل مريحة للارتداء الطويل.', sizes: [{ size: '24', price: 92 }, { size: '25', price: 95 }, { size: '26', price: 98 }, { size: '27', price: 100 }] },
    { id: 'aq-cloud-sneaker', name: 'سنيكر كلاود', type: 'shoes', brand: 'Nike Kids', discount: 0, image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'حذاء يومي خفيف بمساحة تنفس ومرونة للحركة السريعة.', sizes: [{ size: '28', price: 110 }, { size: '29', price: 110 }, { size: '30', price: 114 }, { size: '31', price: 118 }, { size: '32', price: 122 }] },
    { id: 'aq-play-sandal', name: 'صندل اللعب الصيفي', type: 'shoes', brand: 'LC Waikiki Kids', discount: 7, image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'صندل عملي للمشاوير والنشاطات مع تثبيت مريح للقدم.', sizes: [{ size: '20', price: 76 }, { size: '21', price: 76 }, { size: '22', price: 79 }, { size: '23', price: 79 }, { size: '24', price: 82 }] },
    { id: 'aq-school-sneaker', name: 'سنيكر المدرسة الهادئ', type: 'shoes', brand: 'Adidas Kids', discount: 5, image: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'تصميم يومي خفيف يناسب المدرسة والرحلات وأيام اللعب الطويلة.', sizes: [{ size: '33', price: 128 }, { size: '34', price: 131 }, { size: '35', price: 135 }, { size: '36', price: 139 }, { size: '37', price: 142 }, { size: '38', price: 145 }] },
    { id: 'aq-pearl-headband', name: 'طوق لؤلؤ صغير', type: 'accessories', subCategory: 'accessories', brand: 'Aqqad Kids', discount: 0, image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'طوق شعر يضيف لمعة ناعمة على الإطلالات اليومية والمناسبات.', sizes: [{ size: 'واحد', price: 24 }] },
    { id: 'aq-mini-backpack', name: 'حقيبة ظهر ميني', type: 'accessories', subCategory: 'accessories', brand: 'Mango Kids', discount: 0, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'حقيبة صغيرة لطيفة للرحلات الخفيفة والطلعات السريعة.', sizes: [{ size: 'واحد', price: 72 }] },
    { id: 'aq-star-cap', name: 'قبعة نجمة ناعمة', type: 'accessories', subCategory: 'accessories', brand: 'Mayoral', discount: 5, image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'قبعة قطنية للحماية من الشمس بستايل طفولي مرح.', sizes: [{ size: 'واحد', price: 32 }] },
    { id: 'aq-blanket-caramel', name: 'بطانية كراميل هادئة', type: 'accessories', subCategory: 'accessories', brand: 'Aqqad Kids', discount: 0, image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'بطانية مواليد ناعمة جداً لتغمر الطفل بالدفء طوال اليوم.', sizes: [{ size: 'واحد', price: 61 }] },
    { id: 'aq-soft-cream', name: 'كريم نعومة يومية', type: 'creams', subCategory: 'creams', brand: 'Johnson\'s Baby', discount: 0, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'كريم لطيف للترطيب اليومي بتركيبة مخصصة للبشرة الحساسة.', sizes: [{ size: 'واحد', price: 31 }] },
    { id: 'aq-baby-lotion', name: 'لوشن عناية دافئ', type: 'creams', subCategory: 'creams', brand: 'Chicco', discount: 10, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'لوشن عناية بملمس خفيف ورائحة هادئة تلائم الاستخدام اليومي.', sizes: [{ size: 'واحد', price: 43 }] },
    { id: 'aq-cloud-perfume', name: 'عطر كلاود للأطفال', type: 'creams', subCategory: 'perfumes', brand: 'Aqqad Kids', discount: 0, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80', status: 'bestseller', description: 'عطر خفيف بروح نظيفة ومنعشة يمنح الملابس لمسة طفولية لطيفة.', sizes: [{ size: 'واحد', price: 39 }] },
    { id: 'aq-powder-blush', name: 'بودرة بلَش ناعمة', type: 'creams', subCategory: 'creams', brand: 'Johnson\'s Baby', discount: 0, image: 'https://images.unsplash.com/photo-1556228579-0d85b1a4d571?auto=format&fit=crop&w=900&q=80', status: 'normal', description: 'بودرة أطفال كلاسيكية بملمس حريري ورائحة محببة.', sizes: [{ size: 'واحد', price: 26 }] },
    { id: 'aq-soft-mist', name: 'بخاخ رائحة القطن', type: 'creams', subCategory: 'perfumes', brand: 'Aqqad Kids', discount: 8, image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80', status: 'special', description: 'بخاخ ملابس خفيف يمنح القطع رائحة دافئة تشبه الحضن.', sizes: [{ size: 'واحد', price: 35 }] }
];

var SEED_DISCOUNTS = [
    { id: 'aq-summer-shoes', title: 'عرض الأحذية الصيفية', type: 'type', values: ['shoes'], percentage: 8, description: 'خصم موسمي على مجموعة الأحذية المختارة', expiresAt: '' },
    { id: 'aq-zara-stars', title: 'مفاجأة Zara Kids', type: 'brand', values: ['Zara Kids'], percentage: 12, description: 'خصم لطيف على قطع Zara Kids المفضلة', expiresAt: '' }
];

function getSeedUsers() {
    return normalizeUsersDoc({
        aqqad: { password: '5555', role: 'admin', name: 'المدير الرئيسي' },
        orders: { password: '2222', role: 'worker', name: 'موظف الطلبات' }
    });
}

function clearCollection(collectionName) {
    return db.collection(collectionName).get().then(function (snapshot) {
        if (snapshot.empty) return null;
        var batch = db.batch();
        snapshot.docs.forEach(function (docSnap) {
            batch.delete(db.collection(collectionName).doc(docSnap.id));
        });
        return batch.commit();
    });
}

function seedFirestoreData(force) {
    if (!window.db) return Promise.reject(new Error('db غير متاح'));
    return db.collection('products').limit(1).get().then(function (snapshot) {
        if (!force && !snapshot.empty) return false;
        var run = Promise.resolve();
        if (force) {
            run = clearCollection('products').then(function () {
                return clearCollection('discounts');
            });
        }
        return run.then(function () {
            var batch = db.batch();
            normalizeProducts(SEED_PRODUCTS).forEach(function (product) {
                batch.set(db.collection('products').doc(product.id), product);
            });
            normalizeDiscounts(SEED_DISCOUNTS).forEach(function (discount) {
                batch.set(db.collection('discounts').doc(discount.id), discount);
            });
            batch.set(db.collection('settings').doc('config'), normalizeSettings(DEFAULT_SITE_SETTINGS), { merge: true });
            batch.set(db.collection('settings').doc('users'), getSeedUsers(), { merge: true });
            batch.set(db.collection('settings').doc('heroSlides'), normalizeHeroSlidesDoc(getDefaultHeroSlidesDoc()), { merge: true });
            return batch.commit();
        }).then(function () {
            return true;
        });
    });
}

