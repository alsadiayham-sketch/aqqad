var SEED_PRODUCTS = [
    { id: 'aqqad-baby-romper-cream', name: 'رومبر بيبي كريم', brand: 'Carter\'s', category: 'ملابس', description: 'رومبر ناعم لحديثي الولادة بخامة قطنية مريحة.', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop', discount: 10, status: 'bestseller', sizes: [{ label: '0-3 شهور', price: 45 }, { label: '3-6 شهور', price: 45 }] },
    { id: 'aqqad-baby-set-gold', name: 'طقم بيبي ذهبي ناعم', brand: 'H&M Kids', category: 'ملابس', description: 'طقم قطعتين مريح للبيت والخروج.', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: '3-6 شهور', price: 62 }, { label: '6-9 شهور', price: 62 }] },
    { id: 'aqqad-dress-beige-bow', name: 'فستان بيج بفيونكة', brand: 'Zara Kids', category: 'ملابس', description: 'فستان مناسبات هادئ بلمسة فاخرة للبنات.', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop', discount: 15, status: 'special', sizes: [{ label: '1-2 سنة', price: 95 }, { label: '2-3 سنة', price: 95 }, { label: '3-4 سنة', price: 102 }] },
    { id: 'aqqad-boy-set-sand', name: 'طقم أولادي رملي', brand: 'LC Waikiki Kids', category: 'ملابس', description: 'طقم يومي للأولاد بقماش مريح وألوان هادئة.', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: '4-5 سنة', price: 88 }, { label: '5-6 سنة', price: 88 }] },
    { id: 'aqqad-girl-jacket-soft', name: 'جاكيت بناتي سوفت', brand: 'Mango Kids', category: 'ملابس', description: 'جاكيت خفيف للمشاوير الصباحية والأمسيات.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', discount: 5, status: 'bestseller', sizes: [{ label: '6-7 سنة', price: 110 }, { label: '7-8 سنة', price: 110 }] },
    { id: 'aqqad-boys-shirt-linen', name: 'قميص أولادي لينن', brand: 'Mayoral', category: 'ملابس', description: 'قميص أنيق للمناسبات العائلية.', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: '8-9 سنة', price: 85 }, { label: '9-10 سنة', price: 85 }] },
    { id: 'aqqad-girl-cardigan-vanilla', name: 'كارديغان فانيلا', brand: 'Zara Kids', category: 'ملابس', description: 'كارديغان دافئ وخفيف فوق الفساتين والتيشيرتات.', image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: '10-11 سنة', price: 92 }, { label: '11-12 سنة', price: 92 }] },
    { id: 'aqqad-teen-hoodie-oat', name: 'هودي شوفان للمراهقين', brand: 'H&M Kids', category: 'ملابس', description: 'هودي عملي ومريح للأعمار الكبيرة.', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop', discount: 12, status: 'special', sizes: [{ label: '12-13 سنة', price: 120 }, { label: '13-14 سنة', price: 120 }, { label: '14-15 سنة', price: 126 }] },
    { id: 'aqqad-shoes-first-steps', name: 'حذاء أول خطوة', brand: 'Chicco', category: 'أحذية', description: 'حذاء ناعم للخطوات الأولى مع نعل مرن.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', discount: 0, status: 'bestseller', sizes: [{ label: '16', price: 70 }, { label: '17', price: 70 }, { label: '18', price: 72 }] },
    { id: 'aqqad-shoes-girl-gold', name: 'حذاء بناتي ذهبي', brand: 'Zara Kids', category: 'أحذية', description: 'حذاء بناتي أنيق للمناسبات.', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop', discount: 8, status: 'special', sizes: [{ label: '24', price: 95 }, { label: '25', price: 95 }, { label: '26', price: 98 }] },
    { id: 'aqqad-sneaker-cloud', name: 'سنيكر كلاود', brand: 'H&M Kids', category: 'أحذية', description: 'سنيكر يومي خفيف للأولاد والبنات.', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: '27', price: 105 }, { label: '28', price: 105 }, { label: '29', price: 110 }, { label: '30', price: 110 }] },
    { id: 'aqqad-sandal-summer', name: 'صندل صيفي ناعم', brand: 'LC Waikiki Kids', category: 'أحذية', description: 'صندل صيفي مريح بألوان هادئة.', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: '20', price: 78 }, { label: '21', price: 78 }, { label: '22', price: 80 }, { label: '23', price: 80 }] },
    { id: 'aqqad-hairband-pearl', name: 'طوق شعر لؤلؤ', brand: 'Aqqad Kids', category: 'إكسسوارات', description: 'طوق شعر بناتي أنيق بلمسة لؤلؤية.', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&h=400&fit=crop', discount: 0, status: 'bestseller', sizes: [{ label: 'قياس موحد', price: 24 }] },
    { id: 'aqqad-backpack-mini', name: 'حقيبة ظهر ميني', brand: 'Mango Kids', category: 'إكسسوارات', description: 'حقيبة صغيرة للطلعات والمدرسة الخفيفة.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: 'قياس موحد', price: 68 }] },
    { id: 'aqqad-socks-pack-luxe', name: 'طقم جوارب فاخر', brand: 'Carter\'s', category: 'إكسسوارات', description: 'ثلاثة أزواج جوارب ناعمة ومريحة.', image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: 'قياس موحد', price: 18 }] },
    { id: 'aqqad-cap-beige-star', name: 'كاب بيج نجمة', brand: 'Mayoral', category: 'إكسسوارات', description: 'كاب صيفي يحمي من الشمس بستايل لطيف.', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=400&fit=crop', discount: 5, status: 'special', sizes: [{ label: 'قياس موحد', price: 30 }] },
    { id: 'aqqad-baby-cream-soft', name: 'كريم أطفال سوفت', brand: 'Johnson\'s Baby', category: 'كريمات وعطور', description: 'كريم مرطب لطيف للاستخدام اليومي.', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: 'قياس موحد', price: 29 }] },
    { id: 'aqqad-baby-powder', name: 'بودرة أطفال كلاسيك', brand: 'Johnson\'s Baby', category: 'كريمات وعطور', description: 'بودرة برائحة ناعمة ومحببة.', image: 'https://images.unsplash.com/photo-1556228579-0d85b1a4d571?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: 'قياس موحد', price: 22 }] },
    { id: 'aqqad-kids-perfume-cloud', name: 'عطر أطفال كلاود', brand: 'Aqqad Kids', category: 'كريمات وعطور', description: 'رائحة خفيفة منعشة مناسبة للأطفال.', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop', discount: 0, status: 'bestseller', sizes: [{ label: 'قياس موحد', price: 38 }] },
    { id: 'aqqad-sun-lotion-kids', name: 'لوشن حماية أطفال', brand: 'Chicco', category: 'كريمات وعطور', description: 'لوشن لطيف للحماية والعناية اليومية.', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', discount: 10, status: 'special', sizes: [{ label: 'قياس موحد', price: 42 }] },
    { id: 'aqqad-baby-blanket-gold', name: 'بطانية بيبي ذهبية', brand: 'Aqqad Kids', category: 'إكسسوارات', description: 'بطانية ناعمة جداً للمواليد.', image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: 'قياس موحد', price: 58 }] },
    { id: 'aqqad-baby-bib-set', name: 'طقم مريلات أطفال', brand: 'Carter\'s', category: 'إكسسوارات', description: 'مريلات قطنية يومية سهلة الغسيل.', image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop', discount: 0, status: 'active', sizes: [{ label: 'قياس موحد', price: 20 }] }
];

var SEED_DISCOUNTS = [
    { id: 'kids-shoes-discount', title: 'خصم الأحذية', type: 'category', values: ['أحذية'], percentage: 10, description: 'خصم 10% على قسم الأحذية', expiresAt: '' },
    { id: 'zara-kids-discount', title: 'عرض Zara Kids', type: 'brand', values: ['Zara Kids'], percentage: 12, description: 'خصم على منتجات Zara Kids المختارة', expiresAt: '' }
];

function getSeedUsers() {
    return normalizeUsersDoc({
        aqqad: { password: '5555', role: 'admin', name: 'Admin' }
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
    if (!window.db) return Promise.reject(new Error('db is not available'));
    return db.collection('products').limit(1).get().then(function (snapshot) {
        if (!force && !snapshot.empty) return false;
        var run = Promise.resolve();
        if (force) {
            run = clearCollection('products').then(function () { return clearCollection('discounts'); });
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
            return batch.commit();
        }).then(function () { return true; });
    });
}
