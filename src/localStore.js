// 大容量本地存储（摆脱 browser localStorage ~5MB 限制）
// 优先级：打包版应用数据目录文件 → IndexedDB → localStorage
// 业务大表（课表等）以内存缓存为主写入文件/IDB；localStorage 仅作小数据兼容镜像
const APP_DATA_FILE = 'schedule_app_data.json';
/** 与 index.html 同目录，PakePlus 打包进安装包；仅首次无本地数据时导入（不含账号） */
const BUNDLED_APP_DATA_FILE = 'bundled_app_data.json';
const APP_DATA_WRITE_PROBE = 'schedule_app_data.write_probe';
const APP_DATA_IDB_NAME = 'ScheduleAppDB';
const APP_DATA_IDB_VERSION = 1;
const APP_DATA_IDB_STORE = 'main';
const APP_DATA_IDB_KEY = 'bundle';

const APP_BULK_STORAGE_KEYS = [
    'multiTableData',
    'classList',
    'teacherList',
    'roomList',
    'courseList',
    'timeTemplateList',
    'timeTemplateHiddenNames',
    'classTemplatePrefs',
    /* 打包版（PakePlus/Tauri）localStorage 易丢失，与课表一并落 IDB/文件 */
    'schedule_auth_users',
    'schedule_auth_session',
    'schedule_license_key',
    'schedule_license_machine',
    'schedule_trial_start'
];

let appStorageBackend = 'localStorage'; // 'file' | 'indexeddb' | 'localStorage'
let appDataCache = {};
let appDataReady = false;
let appDataFlushTimer = null;
let appDataFlushPromise = null;

function getAppStorageBackend(){
    return appStorageBackend;
}

function getAppStorageBackendLabel(){
    if(typeof t === 'function'){
        if(appStorageBackend === 'file') return t('storage.backendFile');
        if(appStorageBackend === 'indexeddb') return t('storage.backendIdb');
        return t('storage.backendLs');
    }
    if(appStorageBackend === 'file') return '本地文件（无 5MB 限制）';
    if(appStorageBackend === 'indexeddb') return 'IndexedDB（大容量）';
    return 'localStorage（约 5MB 上限）';
}

function isBulkStorageKey(key){
    return APP_BULK_STORAGE_KEYS.indexOf(key) !== -1;
}

function isLargeCapacityBackend(){
    return appStorageBackend === 'file' || appStorageBackend === 'indexeddb';
}

async function getAppDataFilePath(){
    if(typeof getAppLocalDataDir !== 'function') return null;
    const dir = await getAppLocalDataDir();
    if(!dir) return null;
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir + sep + APP_DATA_FILE;
}

async function readTextFromAppPath(path){
    const tauri = window.__TAURI__;
    if(!path) return null;
    try{
        if(tauri?.fs?.readTextFile) return await tauri.fs.readTextFile(path);
        if(typeof tauriInvoke === 'function') return await tauriInvoke('plugin:fs|read_text_file', { path: path });
    }catch(e){}
    return null;
}

async function writeTextToAppPath(path, text){
    const tauri = window.__TAURI__;
    if(!path) return false;
    try{
        if(tauri?.fs?.writeTextFile){
            await tauri.fs.writeTextFile(path, text);
            return true;
        }
        if(typeof tauriInvoke === 'function'){
            await tauriInvoke('plugin:fs|write_text_file', { path: path, contents: text });
            return true;
        }
    }catch(e){
        console.warn('writeTextToAppPath failed:', e);
    }
    return false;
}

function buildAppDataBundleFromLocalStorage(){
    const bundle = {};
    APP_BULK_STORAGE_KEYS.forEach(function(key){
        const val = localStorage.getItem(key);
        if(val != null) bundle[key] = val;
    });
    return bundle;
}

function normalizeAppDataBundle(raw){
    if(!raw || typeof raw !== 'object') return null;
    const bundle = {};
    let hasAny = false;
    APP_BULK_STORAGE_KEYS.forEach(function(key){
        if(raw[key] != null){
            bundle[key] = typeof raw[key] === 'string' ? raw[key] : JSON.stringify(raw[key]);
            hasAny = true;
        }
    });
    return hasAny ? bundle : null;
}

function bundleFromFullBackupShape(raw){
    if(!raw || typeof raw !== 'object') return null;
    const bundle = {};
    if(Array.isArray(raw.multiTableData) || raw.tableList){
        bundle.multiTableData = JSON.stringify(raw.multiTableData || raw.tableList || []);
    }
    ['classList', 'teacherList', 'roomList', 'courseList', 'timeTemplateList', 'timeTemplateHiddenNames', 'classTemplatePrefs'].forEach(function(key){
        if(raw[key] != null){
            bundle[key] = typeof raw[key] === 'string' ? raw[key] : JSON.stringify(raw[key]);
        }
    });
    return normalizeAppDataBundle(Object.assign({}, raw, bundle));
}

function hasMeaningfulAppDataBundle(bundle){
    if(!bundle || typeof bundle !== 'object') return false;
    try{
        const tables = JSON.parse(bundle.multiTableData || '[]');
        if(Array.isArray(tables) && tables.length > 0) return true;
    }catch(e){}
    const keys = Object.keys(bundle);
    return keys.some(function(k){
        const v = bundle[k];
        return typeof v === 'string' && v.length > 2 && v !== '[]' && v !== '{}';
    });
}

async function readBundledAppDataSeed(){
    try{
        const res = await fetch(BUNDLED_APP_DATA_FILE, { cache: 'no-store' });
        if(!res.ok) return null;
        const raw = JSON.parse(await res.text());
        if(!raw || raw.packSeed !== true) return null;
        let bundle = normalizeAppDataBundle(raw);
        if(!bundle && (raw.backupType === 'fullBackup' || Array.isArray(raw.multiTableData))){
            bundle = bundleFromFullBackupShape(raw);
        }
        if(!bundle || !hasMeaningfulAppDataBundle(bundle)) return null;
        const defaultCurrentTableId = String(raw.defaultCurrentTableId || raw.currentTableId || '').trim();
        return { bundle: bundle, defaultCurrentTableId: defaultCurrentTableId };
    }catch(e){
        return null;
    }
}

async function applyBundledAppDataSeedIfNeeded(existingBundle){
    if(hasMeaningfulAppDataBundle(existingBundle)) return null;
    const seed = await readBundledAppDataSeed();
    if(!seed) return null;
    if(typeof window !== 'undefined' && seed.defaultCurrentTableId){
        window.__seedDefaultCurrentTableId = seed.defaultCurrentTableId;
    }
    return seed.bundle;
}

function tryMirrorBundleToLocalStorage(bundle){
    if(!bundle) return;
    APP_BULK_STORAGE_KEYS.forEach(function(key){
        if(bundle[key] == null) return;
        try{
            localStorage.setItem(key, bundle[key]);
        }catch(e){
            // 超过 5MB 时忽略镜像，业务仍走文件/IDB
        }
    });
}

async function readAppDataFileBundle(){
    const path = await getAppDataFilePath();
    if(!path) return null;
    const text = await readTextFromAppPath(path);
    if(!text) return null;
    try{
        return normalizeAppDataBundle(JSON.parse(text));
    }catch(e){
        return null;
    }
}

async function writeAppDataFileBundle(bundle){
    const path = await getAppDataFilePath();
    if(!path) return false;
    return writeTextToAppPath(path, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        ...bundle
    }, null, 2));
}

/** 打包版若拿不到可写应用目录，不要误选 file 后端（否则 IDB 永不启用、重启丢数据） */
async function probeAppDataFileWritable(){
    const path = await getAppDataFilePath();
    if(!path) return false;
    const sep = path.includes('\\') ? '\\' : '/';
    const dir = path.slice(0, path.lastIndexOf(sep));
    const probePath = dir + sep + APP_DATA_WRITE_PROBE;
    const token = 'ok-' + Date.now();
    const ok = await writeTextToAppPath(probePath, token);
    if(!ok) return false;
    const back = await readTextFromAppPath(probePath);
    return typeof back === 'string' && back.trim() === token;
}

function openAppDataIDB(){
    return new Promise(function(resolve, reject){
        if(typeof indexedDB === 'undefined'){
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const req = indexedDB.open(APP_DATA_IDB_NAME, APP_DATA_IDB_VERSION);
        req.onupgradeneeded = function(){
            const db = req.result;
            if(!db.objectStoreNames.contains(APP_DATA_IDB_STORE)){
                db.createObjectStore(APP_DATA_IDB_STORE);
            }
        };
        req.onsuccess = function(){ resolve(req.result); };
        req.onerror = function(){ reject(req.error || new Error('IndexedDB open failed')); };
    });
}

async function readAppDataIDBBundle(){
    try{
        const db = await openAppDataIDB();
        return await new Promise(function(resolve, reject){
            const tx = db.transaction(APP_DATA_IDB_STORE, 'readonly');
            const store = tx.objectStore(APP_DATA_IDB_STORE);
            const req = store.get(APP_DATA_IDB_KEY);
            req.onsuccess = function(){
                db.close();
                resolve(normalizeAppDataBundle(req.result));
            };
            req.onerror = function(){
                db.close();
                reject(req.error);
            };
        });
    }catch(e){
        return null;
    }
}

async function writeAppDataIDBBundle(bundle){
    const db = await openAppDataIDB();
    return new Promise(function(resolve, reject){
        const tx = db.transaction(APP_DATA_IDB_STORE, 'readwrite');
        const store = tx.objectStore(APP_DATA_IDB_STORE);
        const req = store.put(bundle, APP_DATA_IDB_KEY);
        req.onsuccess = function(){
            db.close();
            resolve(true);
        };
        req.onerror = function(){
            db.close();
            reject(req.error);
        };
    });
}

async function flushAppDataToBackend(){
    if(!isLargeCapacityBackend()) return true;
    const bundle = Object.assign({}, appDataCache);
    try{
        if(appStorageBackend === 'file'){
            return await writeAppDataFileBundle(bundle);
        }
        if(appStorageBackend === 'indexeddb'){
            await writeAppDataIDBBundle(bundle);
            return true;
        }
    }catch(e){
        console.error('flushAppDataToBackend failed:', e);
        return false;
    }
    return true;
}

function queueAppDataFlush(){
    if(!isLargeCapacityBackend()) return;
    if(appDataFlushTimer) clearTimeout(appDataFlushTimer);
    appDataFlushTimer = setTimeout(function(){
        appDataFlushTimer = null;
        appDataFlushPromise = flushAppDataToBackend();
    }, 120);
}

async function flushAppDataNow(){
    if(appDataFlushTimer){
        clearTimeout(appDataFlushTimer);
        appDataFlushTimer = null;
    }
    if(appDataFlushPromise){
        try{ await appDataFlushPromise; }catch(e){}
    }
    return flushAppDataToBackend();
}

/** 关键写盘：排课/课表等变更后尽快落盘，降低异常退出丢数据风险 */
function queueAppDataFlushUrgent(){
    if(!isLargeCapacityBackend()) return;
    if(appDataFlushTimer) clearTimeout(appDataFlushTimer);
    appDataFlushTimer = setTimeout(function(){
        appDataFlushTimer = null;
        appDataFlushPromise = flushAppDataToBackend();
    }, 30);
}

/** 读业务大数据：优先内存缓存 */
function appGetItem(key){
    if(isBulkStorageKey(key) && appDataReady && isLargeCapacityBackend()){
        if(Object.prototype.hasOwnProperty.call(appDataCache, key)){
            return appDataCache[key];
        }
    }
    return localStorage.getItem(key);
}

/** 写业务大数据：大容量后端写缓存+落盘；localStorage 仅尝试镜像 */
function appSetItem(key, value){
    const str = value == null ? '' : String(value);
    if(isBulkStorageKey(key) && isLargeCapacityBackend()){
        appDataCache[key] = str;
        // 课表主数据优先更快落盘
        if(key === 'multiTableData') queueAppDataFlushUrgent();
        else queueAppDataFlush();
        try{ localStorage.setItem(key, str); }catch(e){ /* 超过 5MB 忽略 */ }
        return true;
    }
    localStorage.setItem(key, str);
    return true;
}

function appRemoveItem(key){
    if(isBulkStorageKey(key) && isLargeCapacityBackend()){
        delete appDataCache[key];
        queueAppDataFlush();
    }
    try{ localStorage.removeItem(key); }catch(e){}
}

async function initAppDataStorage(){
    appStorageBackend = 'localStorage';
    appDataCache = {};
    appDataReady = false;

    let lsBundle = buildAppDataBundleFromLocalStorage();
    const hasLocalData = hasMeaningfulAppDataBundle(lsBundle);

    // 1) 打包版：应用数据目录
    try{
        const fileBundle = await readAppDataFileBundle();
        if(fileBundle){
            appDataCache = Object.assign({}, fileBundle);
            appStorageBackend = 'file';
            tryMirrorBundleToLocalStorage(fileBundle);
            appDataReady = true;
            return appStorageBackend;
        }
        const seedBundle = await applyBundledAppDataSeedIfNeeded(lsBundle);
        if(seedBundle){
            lsBundle = Object.assign({}, seedBundle);
            tryMirrorBundleToLocalStorage(seedBundle);
        }
        if(typeof getAppLocalDataDir === 'function'){
            const dir = await getAppLocalDataDir();
            if(dir && await probeAppDataFileWritable()){
                appDataCache = Object.assign({}, lsBundle);
                appStorageBackend = 'file';
                await writeAppDataFileBundle(appDataCache);
                appDataReady = true;
                return appStorageBackend;
            }
        }
    }catch(e){
        console.warn('file storage init failed:', e);
    }

    // 2) IndexedDB
    if(typeof indexedDB !== 'undefined'){
        try{
            const idbBundle = await readAppDataIDBBundle();
            if(idbBundle){
                appDataCache = Object.assign({}, idbBundle);
                appStorageBackend = 'indexeddb';
                tryMirrorBundleToLocalStorage(idbBundle);
                appDataReady = true;
                return appStorageBackend;
            }
            if(!hasMeaningfulAppDataBundle(lsBundle)){
                const seedBundle = await applyBundledAppDataSeedIfNeeded(lsBundle);
                if(seedBundle){
                    lsBundle = Object.assign({}, seedBundle);
                    tryMirrorBundleToLocalStorage(seedBundle);
                }
            }
            appDataCache = Object.assign({}, lsBundle);
            appStorageBackend = 'indexeddb';
            if(hasMeaningfulAppDataBundle(lsBundle)) await writeAppDataIDBBundle(lsBundle);
            appDataReady = true;
            return appStorageBackend;
        }catch(e){
            console.warn('IndexedDB init failed, fallback to localStorage:', e);
        }
    }

    if(!hasMeaningfulAppDataBundle(lsBundle)){
        const seedBundle = await applyBundledAppDataSeedIfNeeded(lsBundle);
        if(seedBundle){
            lsBundle = Object.assign({}, seedBundle);
            tryMirrorBundleToLocalStorage(seedBundle);
            appDataCache = Object.assign({}, lsBundle);
        }
    }

    appStorageBackend = 'localStorage';
    if(!Object.keys(appDataCache).length) appDataCache = {};
    appDataReady = true;
    return appStorageBackend;
}

function getBulkDataByteSize(){
    let total = 0;
    APP_BULK_STORAGE_KEYS.forEach(function(key){
        const val = appGetItem(key) || '';
        total += (key.length + val.length) * 2;
    });
    return total;
}

function getAppDataQuotaBytes(){
    if(appStorageBackend === 'file') return 2 * 1024 * 1024 * 1024; // 展示用：约 2GB 硬盘级空间
    if(appStorageBackend === 'indexeddb') return 500 * 1024 * 1024;
    return 5 * 1024 * 1024;
}

async function clearAppDataStorage(){
    APP_BULK_STORAGE_KEYS.forEach(function(key){
        try{ localStorage.removeItem(key); }catch(e){}
    });
    appDataCache = {};
    if(appStorageBackend === 'file'){
        const path = await getAppDataFilePath();
        if(path){
            try{
                const empty = JSON.stringify({ version: 1, savedAt: new Date().toISOString() });
                await writeTextToAppPath(path, empty);
            }catch(e){}
        }
    }
    if(appStorageBackend === 'indexeddb'){
        try{
            await writeAppDataIDBBundle({});
        }catch(e){}
    }
}

// 关闭页面前 / 切入后台时把缓存刷盘，避免打包版异常退出丢课表
if(typeof window !== 'undefined'){
    function flushAppDataBestEffort(){
        if(!isLargeCapacityBackend()) return;
        if(appDataFlushTimer){
            clearTimeout(appDataFlushTimer);
            appDataFlushTimer = null;
        }
        flushAppDataToBackend();
    }
    window.addEventListener('beforeunload', flushAppDataBestEffort);
    window.addEventListener('pagehide', flushAppDataBestEffort);
    document.addEventListener('visibilitychange', function(){
        if(document.visibilityState === 'hidden') flushAppDataBestEffort();
    });
    // 挂到 window，供退出按钮 await
    window.flushAppDataNow = flushAppDataNow;
    window.appGetItem = appGetItem;
    window.appSetItem = appSetItem;
    window.appRemoveItem = appRemoveItem;
    window.initAppDataStorage = initAppDataStorage;
    window.clearAppDataStorage = clearAppDataStorage;
    window.getAppStorageBackend = getAppStorageBackend;
    window.getAppStorageBackendLabel = getAppStorageBackendLabel;
    window.isBulkStorageKey = isBulkStorageKey;
    window.isLargeCapacityBackend = isLargeCapacityBackend;
    window.getBulkDataByteSize = getBulkDataByteSize;
    window.getAppDataQuotaBytes = getAppDataQuotaBytes;
    window.APP_BULK_STORAGE_KEYS = APP_BULK_STORAGE_KEYS;
    window.readTextFromAppPath = readTextFromAppPath;
    window.writeTextToAppPath = writeTextToAppPath;
}

const AUTH_PERSIST_FILE = 'schedule_auth_store.json';

async function getAuthPersistFilePath(){
    if(typeof getAppLocalDataDir !== 'function') return null;
    const dir = await getAppLocalDataDir();
    if(!dir) return null;
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir + sep + AUTH_PERSIST_FILE;
}

async function readAuthPersistFile(){
    const path = await getAuthPersistFilePath();
    if(!path) return null;
    const text = await readTextFromAppPath(path);
    if(!text) return null;
    try{
        const data = JSON.parse(text);
        if(!data || typeof data !== 'object') return null;
        return data;
    }catch(e){
        return null;
    }
}

async function writeAuthPersistFile(usersJson, sessionJson){
    const path = await getAuthPersistFilePath();
    if(!path) return false;
    const payload = JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        schedule_auth_users: usersJson != null ? String(usersJson) : '',
        schedule_auth_session: sessionJson != null ? String(sessionJson) : ''
    }, null, 2);
    return writeTextToAppPath(path, payload);
}

const AUTH_IDB_SIDEcar_KEY = 'auth_sidecar';

async function readAuthPersistIDB(){
    if(typeof indexedDB === 'undefined') return null;
    try{
        const db = await openAppDataIDB();
        return await new Promise(function(resolve){
            const tx = db.transaction(APP_DATA_IDB_STORE, 'readonly');
            const req = tx.objectStore(APP_DATA_IDB_STORE).get(AUTH_IDB_SIDEcar_KEY);
            req.onsuccess = function(){
                db.close();
                resolve(req.result || null);
            };
            req.onerror = function(){
                db.close();
                resolve(null);
            };
        });
    }catch(e){
        return null;
    }
}

async function writeAuthPersistIDB(usersJson, sessionJson){
    if(typeof indexedDB === 'undefined') return false;
    try{
        const db = await openAppDataIDB();
        return await new Promise(function(resolve){
            const tx = db.transaction(APP_DATA_IDB_STORE, 'readwrite');
            tx.objectStore(APP_DATA_IDB_STORE).put({
                schedule_auth_users: usersJson != null ? String(usersJson) : '',
                schedule_auth_session: sessionJson != null ? String(sessionJson) : '',
                savedAt: new Date().toISOString()
            }, AUTH_IDB_SIDEcar_KEY);
            tx.oncomplete = function(){ db.close(); resolve(true); };
            tx.onerror = function(){ db.close(); resolve(false); };
        });
    }catch(e){
        return false;
    }
}

function applyAuthStringsToStorage(usersJson, sessionJson){
    if(usersJson){
        let parsed = [];
        try{ parsed = JSON.parse(usersJson); }catch(e){ parsed = []; }
        if(Array.isArray(parsed) && parsed.length > 0){
            if(typeof appSetItem === 'function') appSetItem('schedule_auth_users', usersJson);
            else localStorage.setItem('schedule_auth_users', usersJson);
        }
    }
    const sessionStr = sessionJson != null ? String(sessionJson).trim() : '';
    if(sessionStr && sessionStr !== 'null'){
        if(typeof appSetItem === 'function') appSetItem('schedule_auth_session', sessionStr);
        else localStorage.setItem('schedule_auth_session', sessionStr);
    }else if(typeof appRemoveItem === 'function'){
        appRemoveItem('schedule_auth_session');
    }else{
        try{ localStorage.removeItem('schedule_auth_session'); }catch(e){}
    }
}

/** 启动时：优先从独立账号文件恢复（PakePlus 下比 IDB/localStorage 更稳） */
async function hydrateAuthFromPersistFile(){
    const fileData = await readAuthPersistFile();
    const idbData = await readAuthPersistIDB();
    const fileUsers = fileData && fileData.schedule_auth_users;
    const fileSession = fileData && fileData.schedule_auth_session;
    const idbUsers = idbData && idbData.schedule_auth_users;
    const idbSession = idbData && idbData.schedule_auth_session;
    const cacheUsers = typeof appGetItem === 'function' ? appGetItem('schedule_auth_users') : null;

    const pickUsers = fileUsers || idbUsers || cacheUsers;
    const pickSession = fileSession || idbSession || (typeof appGetItem === 'function' ? appGetItem('schedule_auth_session') : null);

    if(pickUsers) applyAuthStringsToStorage(pickUsers, pickSession);

    const usersAfter = typeof appGetItem === 'function' ? appGetItem('schedule_auth_users') : localStorage.getItem('schedule_auth_users');
    const sessionAfter = typeof appGetItem === 'function' ? appGetItem('schedule_auth_session') : localStorage.getItem('schedule_auth_session');
    if(usersAfter){
        await writeAuthPersistFile(usersAfter, sessionAfter || '');
        await writeAuthPersistIDB(usersAfter, sessionAfter || '');
    }
    return !!pickUsers;
}

async function persistAuthNow(){
    const usersJson = typeof appGetItem === 'function' ? appGetItem('schedule_auth_users') : localStorage.getItem('schedule_auth_users');
    const sessionJson = typeof appGetItem === 'function' ? appGetItem('schedule_auth_session') : localStorage.getItem('schedule_auth_session');
    if(!usersJson) return false;
    const fileOk = await writeAuthPersistFile(usersJson, sessionJson || '');
    const idbOk = await writeAuthPersistIDB(usersJson, sessionJson || '');
    if(typeof flushAppDataNow === 'function'){
        try{ await flushAppDataNow(); }catch(e){}
    }
    return fileOk || idbOk;
}

if(typeof window !== 'undefined'){
    window.hydrateAuthFromPersistFile = hydrateAuthFromPersistFile;
    window.persistAuthNow = persistAuthNow;
}
