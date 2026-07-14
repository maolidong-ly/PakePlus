// 大容量本地存储（摆脱 browser localStorage ~5MB 限制）
// 优先级：打包版应用数据目录文件 → IndexedDB → localStorage
// 业务大表（课表等）以内存缓存为主写入文件/IDB；localStorage 仅作小数据兼容镜像
const APP_DATA_FILE = 'schedule_app_data.json';
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
    'timeTemplateList'
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
    }, 280);
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
        queueAppDataFlush();
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

    const lsBundle = buildAppDataBundleFromLocalStorage();
    const hasLocalData = Object.keys(lsBundle).length > 0;

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
        if(typeof getAppLocalDataDir === 'function'){
            const dir = await getAppLocalDataDir();
            if(dir){
                appDataCache = Object.assign({}, lsBundle);
                appStorageBackend = 'file';
                if(hasLocalData) await writeAppDataFileBundle(lsBundle);
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
            appDataCache = Object.assign({}, lsBundle);
            appStorageBackend = 'indexeddb';
            if(hasLocalData) await writeAppDataIDBBundle(lsBundle);
            appDataReady = true;
            return appStorageBackend;
        }catch(e){
            console.warn('IndexedDB init failed, fallback to localStorage:', e);
        }
    }

    appStorageBackend = 'localStorage';
    appDataCache = {};
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

// 关闭页面前把缓存刷盘
if(typeof window !== 'undefined'){
    window.addEventListener('beforeunload', function(){
        if(isLargeCapacityBackend()){
            // 同步尽最大努力：无法 await，依赖已定时的 debounce；打包版关掉前再触发一次
            if(appDataFlushTimer){
                clearTimeout(appDataFlushTimer);
                appDataFlushTimer = null;
            }
            flushAppDataToBackend();
        }
    });
}
