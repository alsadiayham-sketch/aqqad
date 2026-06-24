// aqqad data layer — talks to the secure Cloudflare D1 backend at /api/*.
// Exposes a `db` object whose surface matches the subset of the Firestore API
// the app used (collections, docs, where/orderBy/limit, onSnapshot, batch), so
// shared.js / admin.js keep working without the Firebase SDK.
//
// Reads of public data are open; writes and sensitive reads carry a Bearer
// session token. Passwords NEVER reach the client — admin login is verified
// server-side (/api/login) and cashier login server-side (/api/pos-login).
(function (global) {
    var API = '/api';
    var PROJECT_ID = 'aqqad';
    var TOKEN_KEY = 'aqqad_token';
    var USER_KEY = 'aqqad_user';

    // Firestore collection name -> API resource + JSON response key
    var RESOURCE = {
        products: { ep: 'products', key: 'products', pub: true },
        discounts: { ep: 'discounts', key: 'discounts', pub: true },
        orders: { ep: 'orders', key: 'orders', pub: false },
        pos_logs: { ep: 'pos', key: 'logs', pub: false },
        pos_damage: { ep: 'pos-damage', key: 'items', pub: false }
    };

    function getToken() { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
    function setToken(t) { try { sessionStorage.setItem(TOKEN_KEY, t); } catch (e) {} }
    function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); } catch (e) {} }

    function apiFetch(path, opts) {
        opts = opts || {};
        var headers = { 'Content-Type': 'application/json' };
        var t = getToken();
        if (t) headers['Authorization'] = 'Bearer ' + t;
        var init = { method: opts.method || 'GET', headers: headers };
        if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
        return fetch(API + path, init).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) {
                    var err = new Error((data && data.error) || ('HTTP ' + res.status));
                    err.status = res.status;
                    throw err;
                }
                return data;
            });
        });
    }

    function firstArray(obj) {
        if (!obj) return [];
        for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && Array.isArray(obj[k])) return obj[k]; }
        return [];
    }

    function makeDocSnap(item) {
        var id = item && item.id;
        return {
            id: id,
            exists: !!item,
            data: function () { var c = {}; for (var k in item) c[k] = item[k]; return c; }
        };
    }

    function makeSnapshot(arr) {
        var docs = arr.map(makeDocSnap);
        return {
            empty: arr.length === 0,
            size: arr.length,
            docs: docs,
            forEach: function (cb) { docs.forEach(cb); }
        };
    }

    function applyWhere(arr, wheres) {
        if (!wheres || !wheres.length) return arr;
        return arr.filter(function (it) {
            for (var i = 0; i < wheres.length; i++) {
                var w = wheres[i];
                var v = it[w.field];
                if (w.op === '==') { if (String(v) !== String(w.value)) return false; }
                else if (w.op === '!=') { if (String(v) === String(w.value)) return false; }
                else if (w.op === '>') { if (!(v > w.value)) return false; }
                else if (w.op === '>=') { if (!(v >= w.value)) return false; }
                else if (w.op === '<') { if (!(v < w.value)) return false; }
                else if (w.op === '<=') { if (!(v <= w.value)) return false; }
            }
            return true;
        });
    }

    function sortAndLimit(arr, order, dir, limit) {
        if (order) {
            arr = arr.slice().sort(function (a, b) {
                var av = a[order], bv = b[order];
                if (av == null && bv == null) return 0;
                if (av == null) return 1;
                if (bv == null) return -1;
                if (av < bv) return dir === 'desc' ? 1 : -1;
                if (av > bv) return dir === 'desc' ? -1 : 1;
                return 0;
            });
        }
        if (limit && limit > 0) arr = arr.slice(0, limit);
        return arr;
    }

    function randId() { return 'd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }

    // ---- settings (named docs: config, heroSlides) ----
    function settingsGet(key) {
        return apiFetch('/settings?key=' + encodeURIComponent(key)).then(function (d) {
            var s = (d && d.settings) || {};
            var has = s && Object.keys(s).length > 0;
            return {
                id: key,
                exists: has,
                data: function () { var c = {}; for (var k in s) c[k] = s[k]; return c; }
            };
        });
    }
    function settingsSet(key, data) {
        return apiFetch('/settings?key=' + encodeURIComponent(key), { method: 'POST', body: data });
    }

    // ---- DocRef ----
    function DocRef(name, id) { this.name = name; this.id = id; }

    DocRef.prototype.get = function () {
        if (this.name === 'settings') return settingsGet(this.id);
        var id = this.id;
        if (this.name === 'orders') {
            return apiFetch('/orders?id=' + encodeURIComponent(id)).then(function (d) {
                return makeDocSnap(d && d.order ? d.order : null);
            }).catch(function () { return makeDocSnap(null); });
        }
        var res = RESOURCE[this.name];
        return apiFetch('/' + res.ep).then(function (d) {
            var arr = firstArray(d);
            var found = null;
            for (var i = 0; i < arr.length; i++) { if (String(arr[i].id) === String(id)) { found = arr[i]; break; } }
            return makeDocSnap(found);
        });
    };

    DocRef.prototype.set = function (data, opts) {
        if (this.name === 'settings') return settingsSet(this.id, data);
        var res = RESOURCE[this.name];
        var body = {}; for (var k in data) body[k] = data[k];
        body.id = this.id;
        return apiFetch('/' + res.ep, { method: 'POST', body: body });
    };

    DocRef.prototype.update = function (data) {
        var self = this;
        if (this.name === 'orders') {
            var patch = {}; for (var k in data) patch[k] = data[k];
            return apiFetch('/orders?id=' + encodeURIComponent(this.id), { method: 'PATCH', body: patch });
        }
        if (this.name === 'settings') {
            return settingsGet(this.id).then(function (snap) {
                var cur = snap.data();
                for (var k in data) cur[k] = data[k];
                return settingsSet(self.id, cur);
            });
        }
        return self.get().then(function (snap) {
            var cur = snap.exists ? snap.data() : {};
            for (var k in data) cur[k] = data[k];
            return self.set(cur);
        });
    };

    DocRef.prototype.delete = function () {
        var res = RESOURCE[this.name];
        return apiFetch('/' + res.ep + '?id=' + encodeURIComponent(this.id), { method: 'DELETE' });
    };

    DocRef.prototype.onSnapshot = function (onNext, onError) {
        var self = this;
        var stopped = false;
        var INTERVAL = 8000;
        function poll() {
            if (stopped) return;
            self.get().then(function (snap) {
                if (!stopped && typeof onNext === 'function') onNext(snap);
            }).catch(function (err) {
                if (!stopped && typeof onError === 'function') onError(err);
            });
        }
        poll();
        var timer = setInterval(poll, INTERVAL);
        return function () { stopped = true; clearInterval(timer); };
    };

    // ---- Collection / Query ----
    function Collection(name, opts) {
        opts = opts || {};
        this.name = name;
        this._order = opts.order || null;
        this._dir = opts.dir || 'asc';
        this._limit = opts.limit || 0;
        this._wheres = opts.wheres || [];
    }
    Collection.prototype._clone = function (patch) {
        var o = { order: this._order, dir: this._dir, limit: this._limit, wheres: this._wheres.slice() };
        for (var k in patch) o[k] = patch[k];
        return new Collection(this.name, o);
    };
    Collection.prototype.where = function (field, op, value) {
        var w = this._wheres.slice(); w.push({ field: field, op: op, value: value });
        return this._clone({ wheres: w });
    };
    Collection.prototype.orderBy = function (field, dir) { return this._clone({ order: field, dir: dir || 'asc' }); };
    Collection.prototype.limit = function (n) { return this._clone({ limit: n }); };
    Collection.prototype.doc = function (id) { return new DocRef(this.name, id || randId()); };

    Collection.prototype.add = function (data) {
        var res = RESOURCE[this.name];
        return apiFetch('/' + res.ep, { method: 'POST', body: data }).then(function (d) {
            return { id: d && d.id };
        });
    };

    Collection.prototype.get = function () {
        var self = this;
        var res = RESOURCE[this.name];
        // Public order tracking by orderNumber -> dedicated public endpoint.
        if (this.name === 'orders') {
            var onWhere = null;
            for (var i = 0; i < this._wheres.length; i++) { if (this._wheres[i].field === 'orderNumber' && this._wheres[i].op === '==') onWhere = this._wheres[i]; }
            if (onWhere) {
                return apiFetch('/orders?orderNumber=' + encodeURIComponent(onWhere.value)).then(function (d) {
                    return makeSnapshot(d && d.order ? [d.order] : []);
                }).catch(function () { return makeSnapshot([]); });
            }
        }
        var path = '/' + res.ep;
        if (this.name === 'pos_logs' || this.name === 'pos_damage') {
            if (this._limit) path += '?limit=' + this._limit;
        }
        return apiFetch(path).then(function (d) {
            var arr = applyWhere(firstArray(d), self._wheres);
            arr = sortAndLimit(arr, self._order, self._dir, self._limit);
            return makeSnapshot(arr);
        });
    };

    Collection.prototype.onSnapshot = function (onNext, onError) {
        var self = this;
        var stopped = false;
        var INTERVAL = 8000;
        function poll() {
            if (stopped) return;
            self.get().then(function (snap) {
                if (!stopped && typeof onNext === 'function') onNext(snap);
            }).catch(function (err) {
                if (!stopped && typeof onError === 'function') onError(err);
            });
        }
        poll();
        var timer = setInterval(poll, INTERVAL);
        return function () { stopped = true; clearInterval(timer); };
    };

    // settings is accessed as db.collection('settings').doc('config'|'heroSlides')
    function SettingsCollection() {}
    SettingsCollection.prototype.doc = function (id) { return new DocRef('settings', id || 'config'); };

    var db = {
        collection: function (name) {
            if (name === 'settings') return new SettingsCollection();
            return new Collection(name);
        },
        batch: function () {
            var ops = [];
            return {
                set: function (ref, data, opts) { ops.push({ t: 'set', ref: ref, data: data, opts: opts }); },
                update: function (ref, data) { ops.push({ t: 'update', ref: ref, data: data }); },
                delete: function (ref) { ops.push({ t: 'delete', ref: ref }); },
                commit: function () {
                    return ops.reduce(function (p, op) {
                        return p.then(function () {
                            if (op.t === 'set') return op.ref.set(op.data, op.opts);
                            if (op.t === 'update') return op.ref.update(op.data);
                            if (op.t === 'delete') return op.ref.delete();
                        });
                    }, Promise.resolve());
                }
            };
        }
    };

    // ---- auth API used by admin.js ----
    var storeAuth = {
        login: function (username, password) {
            return apiFetch('/login', { method: 'POST', body: { username: username, password: password } })
                .then(function (d) {
                    setToken(d.token);
                    try { sessionStorage.setItem(USER_KEY, JSON.stringify(d.user)); } catch (e) {}
                    return d.user;
                });
        },
        session: function () {
            if (!getToken()) return Promise.resolve(null);
            return apiFetch('/session').then(function (d) { return d.user; }).catch(function () { clearToken(); return null; });
        },
        getUser: function () { try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; } },
        getToken: getToken,
        logout: function () { clearToken(); },
        killAll: function () { return apiFetch('/logout-all', { method: 'POST' }); },
        // admin user management
        listUsers: function () { return apiFetch('/users').then(function (d) { return d.users || []; }); },
        saveUser: function (u) { return apiFetch('/users', { method: 'POST', body: u }); },
        deleteUser: function (username) { return apiFetch('/users?username=' + encodeURIComponent(username), { method: 'DELETE' }); },
        // cashier (POS) user management
        listPosUsers: function () { return apiFetch('/pos-users').then(function (d) { return d.users || []; }); },
        savePosUser: function (u) { return apiFetch('/pos-users', { method: 'POST', body: u }); },
        deletePosUser: function (username) { return apiFetch('/pos-users?username=' + encodeURIComponent(username), { method: 'DELETE' }); },
        apiFetch: apiFetch
    };

    global.db = db;
    global.storeAuth = storeAuth;
    global.PROJECT_ID = PROJECT_ID;
})(window);
