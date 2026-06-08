function seedImage(photoId, sig) {
    return 'https://images.unsplash.com/' + photoId + '?w=400&h=400&fit=crop' + (sig ? '&sig=' + sig : '');
}

var SEED_PRODUCTS = [
    {
        id: '1001',
        name: 'رومبر قطني ناعم',
        type: 'clothes',
        brand: 'عقاد كيدز',
        ageGroup: 'baby',
        description: 'رومبر يومي بخامة قطنية مرنة ولمسات مريحة لحديثي الولادة.',
        discount: 10,
        colors: [
            { name: 'أزرق سماوي', hex: '#87CEEB', images: [seedImage('photo-1519345182560-3f2917c472ef', 1), seedImage('photo-1519345182560-3f2917c472ef', 2)] },
            { name: 'وردي', hex: '#FFB6C1', images: [seedImage('photo-1503919545889-aef636e10ad4', 3), seedImage('photo-1503919545889-aef636e10ad4', 4)] }
        ],
        variants: [
            { size: '0-3 شهور', color: 'أزرق سماوي', stock: 25, price: 89 },
            { size: '3-6 شهور', color: 'أزرق سماوي', stock: 18, price: 89 },
            { size: '6-9 شهور', color: 'أزرق سماوي', stock: 8, price: 92 },
            { size: '9-12 شهور', color: 'أزرق سماوي', stock: 4, price: 95 },
            { size: '0-3 شهور', color: 'وردي', stock: 0, price: 89 },
            { size: '3-6 شهور', color: 'وردي', stock: 10, price: 93 },
            { size: '6-9 شهور', color: 'وردي', stock: 5, price: 93 },
            { size: '9-12 شهور', color: 'وردي', stock: 0, price: 95 }
        ]
    },
    {
        id: '1002',
        name: 'طقم نجوم الصباح',
        type: 'clothes',
        brand: 'عقاد كيدز',
        ageGroup: 'baby',
        description: 'طقم قطعتين بخياطة لطيفة يناسب المشاوير الأولى والصور اليومية.',
        discount: 0,
        colors: [
            { name: 'أبيض حليبي', hex: '#F8F4E8', images: [seedImage('photo-1516257984-b1b4d707412e', 5)] },
            { name: 'نعناعي', hex: '#B7E4C7', images: [seedImage('photo-1516257984-b1b4d707412e', 6)] },
            { name: 'بيج رملي', hex: '#D8C3A5', images: [seedImage('photo-1516257984-b1b4d707412e', 7)] }
        ],
        variants: [
            { size: '0-3 شهور', color: 'أبيض حليبي', stock: 30, price: 96 },
            { size: '3-6 شهور', color: 'أبيض حليبي', stock: 20, price: 96 },
            { size: '6-9 شهور', color: 'أبيض حليبي', stock: 12, price: 99 },
            { size: '9-12 شهور', color: 'أبيض حليبي', stock: 0, price: 102 },
            { size: '0-3 شهور', color: 'نعناعي', stock: 14, price: 98 },
            { size: '3-6 شهور', color: 'نعناعي', stock: 6, price: 98 },
            { size: '6-9 شهور', color: 'نعناعي', stock: 3, price: 101 },
            { size: '9-12 شهور', color: 'نعناعي', stock: 0, price: 104 },
            { size: '0-3 شهور', color: 'بيج رملي', stock: 0, price: 96 },
            { size: '3-6 شهور', color: 'بيج رملي', stock: 0, price: 96 },
            { size: '6-9 شهور', color: 'بيج رملي', stock: 0, price: 99 },
            { size: '9-12 شهور', color: 'بيج رملي', stock: 0, price: 102 }
        ]
    },
    {
        id: '1003',
        name: 'فستان زهور الحديقة',
        type: 'clothes',
        brand: 'عقاد كيدز',
        ageGroup: 'toddler',
        description: 'فستان خفيف بطبقات لطيفة للزيارات والحفلات الصغيرة.',
        discount: 12,
        colors: [
            { name: 'وردي بودري', hex: '#EFB7C8', images: [seedImage('photo-1515886657613-9f3515b0c78f', 8), seedImage('photo-1515886657613-9f3515b0c78f', 9)] },
            { name: 'أبيض عاجي', hex: '#FFF8ED', images: [seedImage('photo-1515886657613-9f3515b0c78f', 10)] }
        ],
        variants: [
            { size: '1-2', color: 'وردي بودري', stock: 9, price: 125 },
            { size: '2-3', color: 'وردي بودري', stock: 7, price: 125 },
            { size: '3-4', color: 'وردي بودري', stock: 3, price: 130 },
            { size: '1-2', color: 'أبيض عاجي', stock: 0, price: 122 },
            { size: '2-3', color: 'أبيض عاجي', stock: 4, price: 122 },
            { size: '3-4', color: 'أبيض عاجي', stock: 2, price: 128 }
        ]
    },
    {
        id: '1004',
        name: 'تيشيرت حركة مرنة',
        type: 'clothes',
        brand: 'عقاد كيدز',
        ageGroup: 'kids',
        description: 'تيشيرت يومي بقماش ناعم مناسب للعب والمدرسة والمشاوير السريعة.',
        discount: 5,
        colors: [
            { name: 'أخضر مريمي', hex: '#A9C5A0', images: [seedImage('photo-1521572163474-6864f9cf17ab', 11)] },
            { name: 'كحلي', hex: '#23395B', images: [seedImage('photo-1521572163474-6864f9cf17ab', 12)] },
            { name: 'أصفر هادئ', hex: '#F1D97A', images: [seedImage('photo-1521572163474-6864f9cf17ab', 13)] }
        ],
        variants: [
            { size: '4-5', color: 'أخضر مريمي', stock: 26, price: 72 },
            { size: '5-6', color: 'أخضر مريمي', stock: 20, price: 72 },
            { size: '6-7', color: 'أخضر مريمي', stock: 18, price: 75 },
            { size: '7-8', color: 'أخضر مريمي', stock: 12, price: 75 },
            { size: '8-9', color: 'أخضر مريمي', stock: 6, price: 78 },
            { size: '9-10', color: 'أخضر مريمي', stock: 0, price: 78 },
            { size: '4-5', color: 'كحلي', stock: 14, price: 72 },
            { size: '5-6', color: 'كحلي', stock: 11, price: 72 },
            { size: '6-7', color: 'كحلي', stock: 5, price: 76 },
            { size: '7-8', color: 'كحلي', stock: 3, price: 76 },
            { size: '8-9', color: 'كحلي', stock: 2, price: 80 },
            { size: '9-10', color: 'كحلي', stock: 0, price: 80 },
            { size: '4-5', color: 'أصفر هادئ', stock: 0, price: 74 },
            { size: '5-6', color: 'أصفر هادئ', stock: 0, price: 74 },
            { size: '6-7', color: 'أصفر هادئ', stock: 0, price: 77 },
            { size: '7-8', color: 'أصفر هادئ', stock: 0, price: 77 },
            { size: '8-9', color: 'أصفر هادئ', stock: 0, price: 81 },
            { size: '9-10', color: 'أصفر هادئ', stock: 0, price: 81 }
        ]
    },
    {
        id: '1005',
        name: 'هودي المدينة الهادئ',
        type: 'clothes',
        brand: 'عقاد كيدز',
        ageGroup: 'teens',
        description: 'هودي واسع بستايل عصري ولمسة دافئة تناسب الطقس المعتدل.',
        discount: 15,
        colors: [
            { name: 'رمادي دخاني', hex: '#8E8E93', images: [seedImage('photo-1541099649105-f69ad21f3246', 14), seedImage('photo-1541099649105-f69ad21f3246', 15)] },
            { name: 'موف داكن', hex: '#8A6FA8', images: [seedImage('photo-1541099649105-f69ad21f3246', 16)] }
        ],
        variants: [
            { size: 'S', color: 'رمادي دخاني', stock: 16, price: 145 },
            { size: 'M', color: 'رمادي دخاني', stock: 14, price: 145 },
            { size: 'L', color: 'رمادي دخاني', stock: 10, price: 149 },
            { size: 'XL', color: 'رمادي دخاني', stock: 7, price: 152 },
            { size: 'XXL', color: 'رمادي دخاني', stock: 3, price: 156 },
            { size: 'S', color: 'موف داكن', stock: 0, price: 147 },
            { size: 'M', color: 'موف داكن', stock: 4, price: 147 },
            { size: 'L', color: 'موف داكن', stock: 5, price: 151 },
            { size: 'XL', color: 'موف داكن', stock: 2, price: 154 },
            { size: 'XXL', color: 'موف داكن', stock: 0, price: 158 }
        ]
    },
    {
        id: '1006',
        name: 'بنطال جوجر اللعب',
        type: 'clothes',
        brand: 'عقاد كيدز',
        ageGroup: 'kids',
        description: 'بنطال مرن بخصر مريح يناسب الحركة اليومية الطويلة.',
        discount: 0,
        colors: [
            { name: 'بيج قمحي', hex: '#C9B79C', images: [seedImage('photo-1483985988355-763728e1935b', 17)] },
            { name: 'أسود', hex: '#222222', images: [seedImage('photo-1483985988355-763728e1935b', 18)] }
        ],
        variants: [
            { size: '4-5', color: 'بيج قمحي', stock: 22, price: 84 },
            { size: '5-6', color: 'بيج قمحي', stock: 17, price: 84 },
            { size: '6-7', color: 'بيج قمحي', stock: 10, price: 87 },
            { size: '7-8', color: 'بيج قمحي', stock: 6, price: 87 },
            { size: '8-9', color: 'بيج قمحي', stock: 4, price: 90 },
            { size: '9-10', color: 'بيج قمحي', stock: 3, price: 90 },
            { size: '4-5', color: 'أسود', stock: 12, price: 86 },
            { size: '5-6', color: 'أسود', stock: 10, price: 86 },
            { size: '6-7', color: 'أسود', stock: 8, price: 89 },
            { size: '7-8', color: 'أسود', stock: 0, price: 89 },
            { size: '8-9', color: 'أسود', stock: 0, price: 92 },
            { size: '9-10', color: 'أسود', stock: 0, price: 92 }
        ]
    },
    {
        id: '1007',
        name: 'سنيكر أول خطوات',
        type: 'shoes',
        brand: 'عقاد كيدز',
        description: 'حذاء خفيف بقاعدة مرنة يدعم الخطوات الأولى بلطف وثبات.',
        discount: 8,
        colors: [
            { name: 'أبيض عاجي', hex: '#F7F3EA', images: [seedImage('photo-1542291026-7eec264c27ff', 19)] },
            { name: 'وردي فاتح', hex: '#F7C8D7', images: [seedImage('photo-1542291026-7eec264c27ff', 20)] }
        ],
        variants: [
            { size: '20', color: 'أبيض عاجي', stock: 20, price: 118 },
            { size: '21', color: 'أبيض عاجي', stock: 18, price: 118 },
            { size: '22', color: 'أبيض عاجي', stock: 9, price: 122 },
            { size: '23', color: 'أبيض عاجي', stock: 5, price: 122 },
            { size: '24', color: 'أبيض عاجي', stock: 0, price: 126 },
            { size: '20', color: 'وردي فاتح', stock: 0, price: 118 },
            { size: '21', color: 'وردي فاتح', stock: 6, price: 118 },
            { size: '22', color: 'وردي فاتح', stock: 4, price: 122 },
            { size: '23', color: 'وردي فاتح', stock: 2, price: 122 },
            { size: '24', color: 'وردي فاتح', stock: 0, price: 126 }
        ]
    },
    {
        id: '1008',
        name: 'صندل صيفي مرح',
        type: 'shoes',
        brand: 'عقاد كيدز',
        description: 'صندل مفتوح بخفة عالية وتثبيت مريح للمشاوير الصيفية.',
        discount: 0,
        colors: [
            { name: 'كراميل', hex: '#C68642', images: [seedImage('photo-1525966222134-fcfa99b8ae77', 21)] },
            { name: 'نعناعي', hex: '#9ADBC2', images: [seedImage('photo-1525966222134-fcfa99b8ae77', 22)] }
        ],
        variants: [
            { size: '24', color: 'كراميل', stock: 24, price: 109 },
            { size: '25', color: 'كراميل', stock: 21, price: 109 },
            { size: '26', color: 'كراميل', stock: 14, price: 114 },
            { size: '27', color: 'كراميل', stock: 10, price: 114 },
            { size: '28', color: 'كراميل', stock: 6, price: 118 },
            { size: '24', color: 'نعناعي', stock: 8, price: 109 },
            { size: '25', color: 'نعناعي', stock: 5, price: 109 },
            { size: '26', color: 'نعناعي', stock: 3, price: 114 },
            { size: '27', color: 'نعناعي', stock: 0, price: 114 },
            { size: '28', color: 'نعناعي', stock: 0, price: 118 }
        ]
    },
    {
        id: '1009',
        name: 'حذاء مدرسة كلاسيكي',
        type: 'shoes',
        brand: 'عقاد كيدز',
        description: 'حذاء يومي ثابت للمدرسة مع بطانة داخلية مريحة.',
        discount: 6,
        colors: [
            { name: 'أسود', hex: '#202020', images: [seedImage('photo-1515347619252-60a4bf4fff4f', 23)] },
            { name: 'بني', hex: '#7A5230', images: [seedImage('photo-1515347619252-60a4bf4fff4f', 24)] }
        ],
        variants: [
            { size: '29', color: 'أسود', stock: 30, price: 139 },
            { size: '30', color: 'أسود', stock: 28, price: 139 },
            { size: '31', color: 'أسود', stock: 22, price: 144 },
            { size: '32', color: 'أسود', stock: 16, price: 144 },
            { size: '33', color: 'أسود', stock: 9, price: 149 },
            { size: '34', color: 'أسود', stock: 6, price: 149 },
            { size: '35', color: 'أسود', stock: 4, price: 154 },
            { size: '29', color: 'بني', stock: 0, price: 141 },
            { size: '30', color: 'بني', stock: 0, price: 141 },
            { size: '31', color: 'بني', stock: 7, price: 146 },
            { size: '32', color: 'بني', stock: 5, price: 146 },
            { size: '33', color: 'بني', stock: 3, price: 151 },
            { size: '34', color: 'بني', stock: 2, price: 151 },
            { size: '35', color: 'بني', stock: 0, price: 156 }
        ]
    },
    {
        id: '1010',
        name: 'بوت مطري صغير',
        type: 'shoes',
        brand: 'عقاد كيدز',
        description: 'بوت مقاوم للرذاذ بتصميم مرح للأيام الباردة والممطرة.',
        discount: 0,
        colors: [
            { name: 'أصفر مطري', hex: '#F7D347', images: [seedImage('photo-1543163521-1bf539c55dd2', 25)] },
            { name: 'أزرق داكن', hex: '#2A4B7C', images: [seedImage('photo-1543163521-1bf539c55dd2', 26)] }
        ],
        variants: [
            { size: '26', color: 'أصفر مطري', stock: 12, price: 132 },
            { size: '27', color: 'أصفر مطري', stock: 9, price: 132 },
            { size: '28', color: 'أصفر مطري', stock: 7, price: 136 },
            { size: '29', color: 'أصفر مطري', stock: 5, price: 136 },
            { size: '30', color: 'أصفر مطري', stock: 3, price: 139 },
            { size: '26', color: 'أزرق داكن', stock: 0, price: 132 },
            { size: '27', color: 'أزرق داكن', stock: 4, price: 132 },
            { size: '28', color: 'أزرق داكن', stock: 2, price: 136 },
            { size: '29', color: 'أزرق داكن', stock: 0, price: 136 },
            { size: '30', color: 'أزرق داكن', stock: 0, price: 139 }
        ]
    },
    {
        id: '1011',
        name: 'حقيبة ظهر ميني',
        type: 'accessories',
        subCategory: 'accessories',
        brand: 'عقاد كيدز',
        description: 'حقيبة صغيرة لطيفة للرحلات الخفيفة والمدرسة والنادي.',
        discount: 0,
        colors: [
            { name: 'وردي باستيل', hex: '#F3C5D6', images: [seedImage('photo-1512436991641-6745cdb1723f', 27)] },
            { name: 'بيج', hex: '#D8C7A7', images: [seedImage('photo-1512436991641-6745cdb1723f', 28)] },
            { name: 'نعناعي', hex: '#A9D6C1', images: [seedImage('photo-1512436991641-6745cdb1723f', 29)] }
        ],
        variants: [
            { size: 'واحد', color: 'وردي باستيل', stock: 14, price: 95 },
            { size: 'واحد', color: 'بيج', stock: 6, price: 95 },
            { size: 'واحد', color: 'نعناعي', stock: 0, price: 95 }
        ]
    },
    {
        id: '1012',
        name: 'قبعة شمس ناعمة',
        type: 'accessories',
        subCategory: 'accessories',
        brand: 'عقاد كيدز',
        description: 'قبعة قطنية بستايل مرح تحمي من الشمس وتكمل الإطلالة.',
        discount: 5,
        colors: [
            { name: 'سكري', hex: '#F6E7C1', images: [seedImage('photo-1521369909029-2afed882baee', 30)] },
            { name: 'وردي', hex: '#F2B9C6', images: [seedImage('photo-1521369909029-2afed882baee', 31)] }
        ],
        variants: [
            { size: 'واحد', color: 'سكري', stock: 18, price: 39 },
            { size: 'واحد', color: 'وردي', stock: 3, price: 39 }
        ]
    },
    {
        id: '1013',
        name: 'طقم ربطات شعر',
        type: 'accessories',
        subCategory: 'accessories',
        brand: 'عقاد كيدز',
        description: 'مجموعة رباطات شعر ناعمة بألوان محببة للاستخدام اليومي.',
        discount: 0,
        colors: [
            { name: 'متعدد الألوان', hex: '#CFA6F7', images: [seedImage('photo-1630019852942-f89202989a59', 32)] },
            { name: 'خوخي', hex: '#F6B38C', images: [seedImage('photo-1630019852942-f89202989a59', 33)] }
        ],
        variants: [
            { size: 'واحد', color: 'متعدد الألوان', stock: 32, price: 28 },
            { size: 'واحد', color: 'خوخي', stock: 5, price: 28 }
        ]
    },
    {
        id: '1014',
        name: 'كريم ترطيب يومي',
        type: 'creams',
        subCategory: 'creams',
        brand: 'عقاد كيدز',
        description: 'كريم لطيف للبشرة الحساسة بملمس خفيف مناسب للاستخدام اليومي.',
        discount: 0,
        colors: [
            { name: 'الافتراضي', hex: '#F4D7DA', images: [seedImage('photo-1556228578-8c89e6adf883', 34)] }
        ],
        variants: [
            { size: '100 مل', color: 'الافتراضي', stock: 40, price: 36 }
        ]
    },
    {
        id: '1015',
        name: 'عطر قطن خفيف',
        type: 'creams',
        subCategory: 'perfumes',
        brand: 'عقاد كيدز',
        description: 'عطر أطفال خفيف برائحة نظيفة ولمسة قطنية مريحة.',
        discount: 10,
        colors: [
            { name: 'الافتراضي', hex: '#E6E0F8', images: [seedImage('photo-1541643600914-78b084683601', 35)] }
        ],
        variants: [
            { size: '50 مل', color: 'الافتراضي', stock: 12, price: 52 }
        ]
    },
    {
        id: '1016',
        name: 'لوشن استحمام الأطفال',
        type: 'creams',
        subCategory: 'creams',
        brand: 'عقاد كيدز',
        description: 'لوشن استحمام برائحة ناعمة يساعد على ترطيب البشرة بعد الاستحمام.',
        discount: 0,
        colors: [
            { name: 'الافتراضي', hex: '#DDECF4', images: [seedImage('photo-1620916566398-39f1143ab7be', 36)] }
        ],
        variants: [
            { size: '200 مل', color: 'الافتراضي', stock: 0, price: 44 }
        ]
    }
];

var SEED_DISCOUNTS = [
    { id: 'summer-shoes', title: 'عرض الأحذية المختارة', type: 'type', values: ['shoes'], percentage: 8, description: 'خصم موسمي على بعض الأحذية.', expiresAt: '' },
    { id: 'aqqad-brand', title: 'مفاجأة عقاد كيدز', type: 'brand', values: ['عقاد كيدز'], percentage: 5, description: 'خصم إضافي على تشكيلة عقاد كيدز.', expiresAt: '' }
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
