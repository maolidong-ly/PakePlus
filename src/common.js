// ========== 全局常量 默认初始化数据 ==========
const DEFAULT_TIME = [
    {name:"第1节 08:20-10:20",isSplit:false},
    {name:"第2节 10:30-12:30",isSplit:false},
    {name:"午饭",isSplit:true},
    {name:"第3节 13:20-15:20",isSplit:false},
    {name:"第4节 15:30-17:30",isSplit:false},
    {name:"晚饭",isSplit:true},
    {name:"第5节 18:00-20:00",isSplit:false},
    {name:"第6节 20:00-22:00",isSplit:false}
];
const DEFAULT_GROUP = ["文科1班","理科1班","一对一学员组1","一对一学员组2","小班课1组"];
const DEFAULT_TEACHERS = ["语文老师","数学老师","英语老师","历史老师","化学老师","专职辅导A","专职辅导B","王帅","刘汉宇"];
const DEFAULT_ROOMS = ["普通教室1","普通教室2","一对一隔间1","一对一隔间2","小班教室","实验室"];
const DEFAULT_COURSES = [
    {name:"语文",teacher:"语文老师",room:"普通教室1",cls:"文科1班"},
    {name:"数学",teacher:"数学老师",room:"普通教室1",cls:"理科1班"},
    {name:"英语",teacher:"英语老师",room:"普通教室1",cls:"文科1班"},
    {name:"历史",teacher:"历史老师",room:"普通教室2",cls:"文科1班"},
    {name:"化学",teacher:"化学老师",room:"实验室",cls:"理科1班"},
    {name:"一对一数学",teacher:"专职辅导A",room:"一对一隔间1",cls:"一对一学员组1"},
    {name:"小班提升",teacher:"专职辅导B",room:"小班教室",cls:"小班课1组"},
    {name:"数学",teacher:"王帅",room:"普通教室1",cls:"文科1班"},
    {name:"物理",teacher:"刘汉宇",room:"普通教室2",cls:"理科1班"}
];

const weekCount = 7;

const DEFAULT_APP_NAME = '西典学校排课系统';
const DEFAULT_APP_SUBTITLE = '智能课表管理 · 多维度排课';
const APP_NAME_KEY = 'schedule_app_name';
const APP_SUBTITLE_KEY = 'schedule_app_subtitle';

function getAppName(){
    const name = (localStorage.getItem(APP_NAME_KEY) || '').trim();
    return name || DEFAULT_APP_NAME;
}

function getAppSubtitle(){
    const sub = (localStorage.getItem(APP_SUBTITLE_KEY) || '').trim();
    return sub || DEFAULT_APP_SUBTITLE;
}

function sanitizeAppFileName(name){
    const safe = (name || DEFAULT_APP_NAME).replace(/[\\/:*?"<>|]/g, '_').trim();
    return safe.slice(0, 36) || '排课系统';
}

function applyAppBranding(){
    const name = getAppName();
    const subtitle = getAppSubtitle();
    document.title = name;
    const nameEl = document.getElementById('appNameDisplay');
    const subEl = document.getElementById('appSubtitleDisplay');
    if(nameEl) nameEl.textContent = name;
    if(subEl) subEl.textContent = subtitle;
}

function restoreAppBrandingFromBackup(backupData){
    if(!backupData) return;
    if(typeof backupData.appName === 'string'){
        const name = backupData.appName.trim();
        if(name) localStorage.setItem(APP_NAME_KEY, name);
    }
    if(typeof backupData.appSubtitle === 'string'){
        const sub = backupData.appSubtitle.trim();
        localStorage.setItem(APP_SUBTITLE_KEY, sub || DEFAULT_APP_SUBTITLE);
    }
    applyAppBranding();
}

function openBrandEdit(e){
    if(e) e.stopPropagation();
    const display = document.getElementById('brandDisplay');
    const edit = document.getElementById('brandEdit');
    if(!display || !edit) return;
    display.style.display = 'none';
    edit.style.display = 'flex';
    const nameInput = document.getElementById('appNameInput');
    const subInput = document.getElementById('appSubtitleInput');
    if(nameInput) nameInput.value = getAppName();
    if(subInput) subInput.value = getAppSubtitle();
    nameInput?.focus();
    nameInput?.select();
}

function cancelBrandEdit(){
    const display = document.getElementById('brandDisplay');
    const edit = document.getElementById('brandEdit');
    if(display) display.style.display = '';
    if(edit) edit.style.display = 'none';
}

function saveAppBranding(){
    const nameInput = document.getElementById('appNameInput');
    const subInput = document.getElementById('appSubtitleInput');
    const name = (nameInput?.value || '').trim();
    const subtitle = (subInput?.value || '').trim();
    if(!name) return alert('程序名称不能为空');
    localStorage.setItem(APP_NAME_KEY, name);
    localStorage.setItem(APP_SUBTITLE_KEY, subtitle || DEFAULT_APP_SUBTITLE);
    applyAppBranding();
    cancelBrandEdit();
}

function onBrandInputKeydown(e){
    if(e.key === 'Enter') saveAppBranding();
    if(e.key === 'Escape') cancelBrandEdit();
}

// 全局变量挂载window（仅保留手动排课必需全局变量，移除自动排课模式变量）
window.currentView = "classView";
window.activeCell = null;
window.tableList = [];
window.currentTableId = "";
window.timeTemplateList = [];
window.historyStack = [];
window.historyIndex = -1;
// 全局冲突缓存
window.globalConflictList = [];

// 本地存储初始化
function initLocalStorage(){
    // 全局基础数据不再包含公共课时
    if(!localStorage.classList) localStorage.classList = JSON.stringify(DEFAULT_GROUP);
    if(!localStorage.teacherList) localStorage.teacherList = JSON.stringify(DEFAULT_TEACHERS);
    if(!localStorage.roomList) localStorage.roomList = JSON.stringify(DEFAULT_ROOMS);
    if(!localStorage.courseList) localStorage.courseList = JSON.stringify(DEFAULT_COURSES);
    if(!localStorage.multiTableData) localStorage.multiTableData = JSON.stringify([]);
    
    tableList = JSON.parse(localStorage.multiTableData);
    // 兼容旧版：给没有独立课时的旧课表，绑定默认课时
    tableList = tableList.map(table=>{
        return {
            id:table.id,
            name:table.name,
            bindClass:table.bindClass || "",
            data:table.data || {},
            // 旧课表兼容：没有独立课时则赋值默认课时
            timeList: table.timeList ? table.timeList : JSON.parse(JSON.stringify(DEFAULT_TIME)),
            autoScheduleConfig: table.autoScheduleConfig || { constraints: [], settings: { onlyEmpty: true, checkGlobal: true, spreadWeek: true } }
        }
    });
    
    if(tableList.length > 0){
        currentTableId = tableList[0].id;
    }
    timeTemplateList = JSON.parse(localStorage.getItem('timeTemplateList') || '[]');
    saveSnapshot();
    touchStorageRefresh();
    refreshStorageQuotaEstimate();
}

function saveTimeTemplateListStorage(){
    localStorage.setItem('timeTemplateList', JSON.stringify(timeTemplateList));
    touchStorageRefresh();
}

function saveTableList(){
    try{
        localStorage.multiTableData = JSON.stringify(tableList);
        if(typeof renderStorageStatus === 'function') renderStorageStatus();
    }catch(err){
        notifyStorageQuotaExceeded(err);
        throw err;
    }
}
const STORAGE_DEFAULT_QUOTA = 5 * 1024 * 1024;
const STORAGE_EMPTY_TABLE_EST = 1800;
/** 按常见排课密度估算（约 6KB/张），避免空课表把“还可增”算得过大 */
const STORAGE_TYPICAL_TABLE_BYTES = 6000;
const STORAGE_WARN_PERCENT = 70;
const STORAGE_DANGER_PERCENT = 85;
const BACKUP_REMIND_DAYS = 7;

function getLocalStorageByteSize(){
    let total = 0;
    for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        const val = localStorage.getItem(key) || '';
        total += (key.length + val.length) * 2;
    }
    return total;
}

function getMultiTableByteSize(){
    const str = localStorage.getItem('multiTableData') || '[]';
    return str.length * 2;
}

function formatStorageSize(bytes){
    if(bytes < 1024) return `${bytes} B`;
    if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRemainingTableCount(count){
    if(count <= 0) return '0';
    if(count >= 9999) return '9999+';
    if(count >= 1000) return `${Math.floor(count / 100) * 100}+`;
    return String(count);
}

function getStorageLevel(usedPercent){
    if(usedPercent >= STORAGE_DANGER_PERCENT) return 'danger';
    if(usedPercent >= STORAGE_WARN_PERCENT) return 'warn';
    return 'ok';
}

function getDaysSinceBackup(){
    const raw = localStorage.getItem('lastBackupTime');
    if(!raw) return null;
    const t = Date.parse(raw);
    if(Number.isNaN(t)) return null;
    return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

function computeStorageStats(){
    const usedBytes = getLocalStorageByteSize();
    const quotaBytes = STORAGE_DEFAULT_QUOTA;
    const tablesBytes = getMultiTableByteSize();
    const tableCount = Array.isArray(tableList) ? tableList.length : 0;
    const avgTableBytes = tableCount > 0
        ? Math.max(Math.ceil(tablesBytes / tableCount), 800)
        : STORAGE_EMPTY_TABLE_EST;
    const remainingBytes = Math.max(0, quotaBytes - usedBytes);
    const estimatedRemainingTables = Math.floor(remainingBytes / avgTableBytes);
    const typicalRemainingTables = Math.floor(remainingBytes / STORAGE_TYPICAL_TABLE_BYTES);
    const usedPercent = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;
    return {
        usedBytes,
        quotaBytes,
        tablesBytes,
        tableCount,
        avgTableBytes,
        estimatedRemainingTables,
        typicalRemainingTables,
        remainingBytes,
        usedPercent
    };
}

function getStorageSpaceHint(stats){
    if(stats.usedPercent >= STORAGE_DANGER_PERCENT){
        return {
            text: `空间紧张，约还可增 ${formatRemainingTableCount(stats.typicalRemainingTables)} 张`,
            level: 'danger'
        };
    }
    if(stats.usedPercent >= STORAGE_WARN_PERCENT){
        return {
            text: `空间偏紧，约还可增 ${formatRemainingTableCount(stats.typicalRemainingTables)} 张`,
            level: 'warn'
        };
    }
    if(stats.usedPercent >= 50){
        return { text: '空间适中', level: 'ok' };
    }
    return { text: '空间充足', level: 'ok' };
}

async function refreshStorageQuotaEstimate(){
    renderStorageStatus();
}

function renderStorageStatus(){
    const bar = document.getElementById('storageStatusBar');
    const fill = document.getElementById('storageStatusFill');
    const text = document.getElementById('storageStatusText');
    if(!bar || !fill || !text) return;

    const stats = computeStorageStats();
    const level = getStorageLevel(stats.usedPercent);
    const spaceHint = getStorageSpaceHint(stats);

    fill.style.width = `${Math.max(stats.usedPercent, 2)}%`;
    fill.className = 'tm-storage-fill' + (level === 'ok' ? '' : ` ${level}`);
    text.className = 'tm-storage-text' + (level === 'ok' ? '' : ` ${level}`);

    let msg = `本地存储 ${formatStorageSize(stats.usedBytes)} / ${formatStorageSize(stats.quotaBytes)}（${stats.usedPercent.toFixed(0)}%）`;
    msg += ` · 课表 ${stats.tableCount} 张 · ${spaceHint.text}`;

    const daysSinceBackup = getDaysSinceBackup();
    if(daysSinceBackup === null){
        if(stats.tableCount > 0) msg += ' · 建议导出备份';
    }else if(daysSinceBackup >= BACKUP_REMIND_DAYS){
        msg += ` · 已 ${daysSinceBackup} 天未备份`;
    }

    if(level === 'danger'){
        msg += ' · 请尽快导出备份';
    }else if(level === 'warn'){
        msg += ' · 建议备份';
    }

    text.textContent = msg;
    bar.title = [
        '浏览器 localStorage 上限约 5 MB（与硬盘大小无关）',
        `课表数据 ${formatStorageSize(stats.tablesBytes)}，共 ${stats.tableCount} 张`,
        `按常见排满估算约还可增 ${stats.typicalRemainingTables} 张`,
        stats.estimatedRemainingTables > stats.typicalRemainingTables
            ? `当前课表较空，按现大小理论值 ${stats.estimatedRemainingTables} 张（仅供参考，通常偏大）`
            : ''
    ].filter(Boolean).join('\n');
}

function notifyStorageQuotaExceeded(err){
    console.error('localStorage 写入失败：', err);
    alert('❌ 本地存储空间不足，无法保存。请先导出全部备份，并删除不需要的课表或基础数据后重试。');
    renderStorageStatus();
}

function touchStorageRefresh(){
    if(typeof renderStorageStatus === 'function') renderStorageStatus();
}

function openStorageBackupHint(){
    const stats = computeStorageStats();
    const needBackup = stats.usedPercent >= STORAGE_WARN_PERCENT
        || getDaysSinceBackup() === null
        || (getDaysSinceBackup() !== null && getDaysSinceBackup() >= BACKUP_REMIND_DAYS);
    if(needBackup && typeof switchTabByName === 'function'){
        switchTabByName('schedule');
        setTimeout(function(){
            const panel = document.getElementById('scheduleBackupPanel');
            if(panel) panel.open = true;
            panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }
}

// 历史撤销保存快照
function saveSnapshot() {
    if(!currentTableId) return;
    const table = getCurrentTableInfo();
    const data = JSON.parse(JSON.stringify({
        data: table.data,
        timeList: table.timeList
    }));
    historyStack.splice(historyIndex + 1);
    historyStack.push(data);
    historyIndex = historyStack.length - 1;
    if(historyStack.length > 30) historyStack.shift();
}

function undoStep() {
    if(!currentTableId) return alert("暂无选中课表，请先新建或选择课表");
    if (historyIndex <= 0) return alert("已经是最早一步，无法撤销");
    historyIndex--;
    const data = historyStack[historyIndex];
    const tableItem = tableList.find(t=>t.id === currentTableId);
    if(tableItem) {
        tableItem.data = data.data;
        tableItem.timeList = data.timeList;
    }
    saveTableList();
    renderTime();
    renderSchedule();
    checkAllConflict();
}

function redoStep() {
    if(!currentTableId) return alert("暂无选中课表，请先新建或选择课表");
    if (historyIndex >= historyStack.length - 1) return alert("已经是最新一步，无法重做");
    historyIndex++;
    const data = historyStack[historyIndex];
    const tableItem = tableList.find(t=>t.id === currentTableId);
    if(tableItem) {
        tableItem.data = data.data;
        tableItem.timeList = data.timeList;
    }
    saveTableList();
    renderTime();
    renderSchedule();
    checkAllConflict();
}

// 课表数据读取
function getCurrentTableInfo(){
    const table = tableList.find(t => t.id === currentTableId);
    return table ? {
        id:table.id,
        name:table.name,
        bindClass:table.bindClass || "",
        data:table.data || {},
        timeList: table.timeList
    } : null;
}

function getCurrentTableData(){
    if(!currentTableId) return {};
    const item = tableList.find(t=>t.id === currentTableId);
    return item ? (item.data || {}) : {};
}

// 获取【当前选中课表】的独立课时
function getTimeData(){
    const table = getCurrentTableInfo();
    if(!table) return JSON.parse(JSON.stringify(DEFAULT_TIME));
    return table.timeList;
}

// 保存课时到【当前课表】，不再全局覆盖
function saveTimeData(arr){
    const table = getCurrentTableInfo();
    if(!table) return;
    table.timeList = arr;
    saveTableList();
}

function saveCurrentTableData(data){
    if(!currentTableId) return;
    const item = tableList.find(t=>t.id === currentTableId);
    if(item) item.data = data;
    saveTableList();
}

// 基础数据读写（全局公共基础数据）
function getClassData(){return JSON.parse(localStorage.classList);}
function saveClassData(arr){localStorage.classList = JSON.stringify(arr); touchStorageRefresh();}

function getTeacherData(){return JSON.parse(localStorage.teacherList);}
function saveTeacherData(arr){localStorage.teacherList = JSON.stringify(arr); touchStorageRefresh();}

function getRoomData(){return JSON.parse(localStorage.roomList);}
function saveRoomData(arr){localStorage.roomList = JSON.stringify(arr); touchStorageRefresh();}

function getCourseData(){return JSON.parse(localStorage.courseList);}
function saveCourseData(arr){localStorage.courseList = JSON.stringify(arr); touchStorageRefresh();}

// 课程信息解析 四维度匹配：课程|教师|教室|班级
function getCourseInfo(valKey){
    if(!valKey) return null;
    const[name,tch,room,cls]=valKey.split("|");
    return getCourseData().find(x=>
        x.name === name &&
        x.teacher === tch &&
        x.room === room &&
        x.cls === cls
    );
}

// ========== 文件导出（支持自选保存位置，兼容浏览器与 PakePlus/Tauri） ==========
function isDesktopApp(){
    return typeof window.__TAURI__ !== 'undefined';
}

function isWindowsDesktop(){
    return isDesktopApp() && /Windows/i.test(navigator.userAgent || '');
}

function delay(ms){
    return new Promise(function(resolve){ setTimeout(resolve, ms); });
}

function buildSaveFilters(extensions){
    if(!extensions || !extensions.length) return undefined;
    const extList = extensions.map(e => String(e).replace(/^\./, ''));
    return [{ name: '文件', extensions: extList }];
}

function parseTauriSavePath(result){
    if(result == null) return null;
    if(typeof result === 'string') return result.trim() || null;
    if(Array.isArray(result) && result.length) return parseTauriSavePath(result[0]);
    if(typeof result === 'object'){
        if(typeof result.path === 'string') return result.path.trim() || null;
        if(typeof result.filePath === 'string') return result.filePath.trim() || null;
    }
    return null;
}

function sanitizeDefaultFilename(name){
    return String(name || 'export').replace(/[\\/:*?"<>|]/g, '_').replace(/[\s.]+$/, '');
}

function normalizeSavePath(filePath){
    if(!filePath || typeof filePath !== 'string') return filePath;
    let p = filePath.trim();
    if(isWindowsDesktop()){
        p = p.replace(/\//g, '\\');
        const sepIdx = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'));
        const dir = sepIdx >= 0 ? p.slice(0, sepIdx + 1) : '';
        let name = sepIdx >= 0 ? p.slice(sepIdx + 1) : p;
        name = name.replace(/[\s.]+$/, '').replace(/[<>:"|?*]/g, '_');
        p = dir + name;
    }
    return p;
}

async function tauriPickSavePath(defaultFilename, extensions){
    const tauri = window.__TAURI__;
    if(!tauri) return undefined;
    const safeName = sanitizeDefaultFilename(defaultFilename);
    const opts = {
        defaultPath: safeName,
        filters: buildSaveFilters(extensions)
    };
    try{
        let result;
        if(tauri.dialog?.save) result = await tauri.dialog.save(opts);
        else if(tauri.core?.invoke){
            try{
                result = await tauri.core.invoke('plugin:dialog|save', { options: opts });
            }catch(e1){
                result = await tauri.core.invoke('dialog_save', opts);
            }
        }
        const path = parseTauriSavePath(result);
        if(!path) return path === null ? null : undefined;
        return ensureFileExtension(normalizeSavePath(path), extensions);
    }catch(err){
        console.warn('Tauri save dialog failed:', err);
    }
    return undefined;
}

async function tauriWriteContent(path, text){
    const normalizedPath = normalizeSavePath(path);
    if(!normalizedPath) return false;
    const tauri = window.__TAURI__;
    const bytes = new TextEncoder().encode(text);
    try{
        if(tauri.fs?.writeTextFile){
            await tauri.fs.writeTextFile(normalizedPath, text);
            return true;
        }
        if(tauri.fs?.writeFile){
            await tauri.fs.writeFile(normalizedPath, bytes);
            return true;
        }
        if(tauri.core?.invoke){
            await tauri.core.invoke('plugin:fs|write_text_file', {
                path: normalizedPath,
                contents: text
            });
            return true;
        }
    }catch(err){
        console.warn('Tauri write file failed:', err);
    }
    return false;
}

async function browserPickSaveBlob(blob, defaultFilename, extensions){
    if(typeof window.showSaveFilePicker !== 'function') return undefined;
    const ext = (extensions && extensions[0] || defaultFilename.split('.').pop() || 'bin').replace(/^\./, '');
    const mimeMap = { json: 'application/json', xls: 'application/vnd.ms-excel', html: 'text/html' };
    const mime = mimeMap[ext] || blob.type || 'application/octet-stream';
    try{
        const handle = await window.showSaveFilePicker({
            suggestedName: sanitizeDefaultFilename(defaultFilename),
            types: [{ description: ext.toUpperCase() + ' 文件', accept: { [mime]: ['.' + ext], 'application/octet-stream': ['.' + ext] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
    }catch(err){
        if(err && err.name === 'AbortError') return false;
        console.warn('showSaveFilePicker failed:', err);
        return undefined;
    }
}

function browserDownloadFallback(blob, defaultFilename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = sanitizeDefaultFilename(defaultFilename);
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 200);
}

function extractBasename(filePath){
    if(!filePath) return '';
    return filePath.split(/[/\\]/).pop() || '';
}

function ensureFileExtension(filePath, extensions){
    const ext = (extensions && extensions[0] || '').replace(/^\./, '').toLowerCase();
    if(!ext || !filePath) return filePath;
    const lastSep = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
    const dir = lastSep >= 0 ? filePath.slice(0, lastSep + 1) : '';
    let name = lastSep >= 0 ? filePath.slice(lastSep + 1) : filePath;
    const dot = name.lastIndexOf('.');
    if(dot > 0) name = name.slice(0, dot);
    name = name.replace(/[\s.]+$/, '').replace(/[<>:"|?*]/g, '_');
    if(!name) name = 'export';
    return dir + name + '.' + ext;
}

function buildWindowsPathCandidates(path, extensions){
    const list = [
        path,
        normalizeSavePath(path),
        ensureFileExtension(path, extensions),
        ensureFileExtension(normalizeSavePath(path), extensions),
        path.replace(/\//g, '\\')
    ];
    const seen = new Set();
    return list.filter(function(p){
        if(!p || seen.has(p)) return false;
        seen.add(p);
        return true;
    });
}

async function tryWindowsTauriWrite(path, text, extensions){
    const tauri = window.__TAURI__;
    if(!tauri?.core?.invoke) return false;
    const candidates = buildWindowsPathCandidates(path, extensions);
    for(let i = 0; i < candidates.length; i++){
        const p = candidates[i];
        const payloads = [
            { path: p, contents: text },
            { path: p, contents: text, options: { create: true } },
            { filePath: p, contents: text }
        ];
        for(let j = 0; j < payloads.length; j++){
            try{
                await tauri.core.invoke('plugin:fs|write_text_file', payloads[j]);
                return true;
            }catch(e1){
                try{
                    const bytes = Array.from(new TextEncoder().encode(text));
                    await tauri.core.invoke('plugin:fs|write_file', { path: p, contents: bytes });
                    return true;
                }catch(e2){}
            }
        }
    }
    return false;
}

async function saveFileWindowsDesktop(text, safeFilename, blob, extensions){
    // 方案 A：系统文件选择器 + JS 直接写入（改名也稳定，不走 Rust fs）
    if(typeof window.showSaveFilePicker === 'function'){
        const fsaResult = await browserPickSaveBlob(blob, safeFilename, extensions);
        if(fsaResult === true) return true;
        if(fsaResult === false) return false;
    }

    // 方案 B：Tauri 保存对话框 + 多种安全写入尝试
    const path = await tauriPickSavePath(safeFilename, extensions);
    if(path === null) return false;
    if(!path) return null;

    await delay(350);
    const ok = await tryWindowsTauriWrite(path, text, extensions);
    if(ok) return true;

    // 方案 C：写入失败时，用用户选择的文件名保存到默认下载目录（保证能导出）
    const chosenName = sanitizeDefaultFilename(extractBasename(path) || safeFilename);
    browserDownloadFallback(blob, ensureFileExtension(chosenName, extensions).split(/[/\\]/).pop());
    alert('无法保存到所选文件夹，文件已导出到默认下载目录：\n' + chosenName);
    return true;
}

/**
 * 保存文件并让用户选择保存位置
 * @returns {Promise<boolean|null>} true=成功, false=用户取消, null=失败
 */
async function saveFileWithPicker(content, defaultFilename, options){
    options = options || {};
    const extensions = options.extensions || [defaultFilename.split('.').pop()].filter(Boolean);
    const mimeType = options.mimeType || 'application/octet-stream';
    const safeFilename = sanitizeDefaultFilename(defaultFilename);
    let text = content instanceof Blob ? await content.text() : String(content);
    if(options.utf8Bom && text.charCodeAt(0) !== 0xFEFF){
        text = '\uFEFF' + text;
    }
    const blob = new Blob([text], { type: mimeType });

    if(isWindowsDesktop()){
        return await saveFileWindowsDesktop(text, safeFilename, blob, extensions);
    }

    if(isDesktopApp()){
        const path = await tauriPickSavePath(safeFilename, extensions);
        if(path === null) return false;
        if(path){
            const ok = await tauriWriteContent(path, text);
            if(ok) return true;
            alert('保存失败，请检查应用是否有写入文件的权限');
            return null;
        }
    }

    const fsaResult = await browserPickSaveBlob(blob, safeFilename, extensions);
    if(fsaResult === true) return true;
    if(fsaResult === false) return false;

    if(isDesktopApp()){
        alert('无法打开保存对话框，请更新 PakePlus 后重新打包，或开启 Debug 模式查看控制台报错');
        return null;
    }
    if(typeof window.showSaveFilePicker !== 'function'){
        alert('当前浏览器不支持选择保存位置，文件将保存到默认下载文件夹');
    }
    browserDownloadFallback(blob, safeFilename);
    return true;
}

// ========== 课时模版管理（全局保存，新建课表时可选用） ==========
function saveTimeAsTemplate(){
    if(!currentTableId) return alert("请先选中一张课表");
    const timeList = JSON.parse(JSON.stringify(getTimeData()));
    if(!timeList.length) return alert("当前课表没有课时，无法保存模版");

    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom ? selectDom.value : '';
    if(idx !== '' && timeTemplateList[idx]){
        const name = timeTemplateList[idx].name;
        if(confirm('是否更新模版「' + name + '」？\n点「取消」可另存为新模版。')){
            timeTemplateList[idx].timeList = timeList;
            saveTimeTemplateListStorage();
            renderTimeTemplateSelect();
            if(selectDom) selectDom.value = String(idx);
            return alert('✅ 课时模版「' + name + '」已更新');
        }
    }

    const templateName = prompt('请输入课时模版名称');
    if(!templateName || templateName.trim() === '') return;
    const trimmed = templateName.trim();
    if(timeTemplateList.some(function(t){ return t.name === trimmed; })){
        return alert('该模版名称已存在，请换一个名称，或先在下拉菜单选中该模版后点保存进行更新');
    }
    timeTemplateList.push({ name: trimmed, timeList: timeList });
    saveTimeTemplateListStorage();
    renderTimeTemplateSelect();
    if(selectDom){
        const newIdx = timeTemplateList.findIndex(function(t){ return t.name === trimmed; });
        if(newIdx >= 0) selectDom.value = String(newIdx);
    }
    alert('✅ 课时模版保存成功，新建课表或加载模版时可直接选用');
}
function applyTimeTemplate(){
    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom.value;
    if(idx === '') return alert('请先在下拉列表选择一个已保存的模版');
    if(!currentTableId) return alert("请先选中一张课表");
    if(!confirm('确定用选中模版覆盖当前课表的课时设置吗？')) return;
    saveTimeData(JSON.parse(JSON.stringify(timeTemplateList[idx].timeList)));
    renderTime();
    renderSchedule();
    checkAllConflict();
    saveSnapshot();
    alert('✅ 模版加载完成，当前课表课时已更新');
}
function renameTimeTemplate(){
    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom.value;
    if(idx === '') return alert('请先选择要重命名的模版');
    const newName = prompt('请输入模版新名称', timeTemplateList[idx].name);
    if(newName && newName.trim() !== ''){
        timeTemplateList[idx].name = newName.trim();
        saveTimeTemplateListStorage();
        renderTimeTemplateSelect();
    }
}
function delTimeTemplate(){
    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom.value;
    if(idx === '') return alert('请先选择要删除的模版');
    if(!confirm('确定永久删除该课时模版吗？')) return;
    timeTemplateList.splice(idx, 1);
    saveTimeTemplateListStorage();
    renderTimeTemplateSelect();
}
function getNewTableTimeList(){
    const selectDom = document.getElementById('newTableTimeTemplate');
    const val = selectDom ? selectDom.value : 'default';
    if(val === 'default' || val === ''){
        return JSON.parse(JSON.stringify(DEFAULT_TIME));
    }
    const template = timeTemplateList[val];
    return template ? JSON.parse(JSON.stringify(template.timeList)) : JSON.parse(JSON.stringify(DEFAULT_TIME));
}

// 班级模块备份
async function exportClassBackup(){
    const data = localStorage.classList;
    const saved = await saveFileWithPicker(data, `班级学员组备份_${new Date().getTime()}.json`, {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert("✅ 班级数据导出完成");
}
function importClassBackup(){
    const file = document.getElementById("classBackupFile").files[0];
    if(!file) return alert("请选择备份文件");
    const reader = new FileReader();
    reader.onload = e=>{
        try{
            JSON.parse(e.target.result);
            localStorage.classList = e.target.result;
            renderClass();
            renderCourseSelects();
            renderNewTableClassSelect();
            alert("✅ 班级数据导入成功");
        }catch(err){
            alert("❌ 文件格式错误");
        }
    };
    reader.readAsText(file);
}

// 教师模块备份
async function exportTeacherBackup(){
    const data = localStorage.teacherList;
    const saved = await saveFileWithPicker(data, `教师数据备份_${new Date().getTime()}.json`, {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert("✅ 教师数据导出完成");
}
function importTeacherBackup(){
    const file = document.getElementById("teacherBackupFile").files[0];
    if(!file) return alert("请选择备份文件");
    const reader = new FileReader();
    reader.onload = e=>{
        try{
            JSON.parse(e.target.result);
            localStorage.teacherList = e.target.result;
            renderTeacher();
            renderCourseSelects();
            alert("✅ 教师数据导入成功");
        }catch(err){
            alert("❌ 文件格式错误");
        }
    };
    reader.readAsText(file);
}

// 教室模块备份
async function exportRoomBackup(){
    const data = localStorage.roomList;
    const saved = await saveFileWithPicker(data, `教室场地备份_${new Date().getTime()}.json`, {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert("✅ 教室数据导出完成");
}
function importRoomBackup(){
    const file = document.getElementById("roomBackupFile").files[0];
    if(!file) return alert("请选择备份文件");
    const reader = new FileReader();
    reader.onload = e=>{
        try{
            JSON.parse(e.target.result);
            localStorage.roomList = e.target.result;
            renderRoom();
            renderCourseSelects();
            alert("✅ 教室数据导入成功");
        }catch(err){
            alert("❌ 文件格式错误");
        }
    };
    reader.readAsText(file);
}

// 课程模块备份
async function exportCourseBackup(){
    const data = localStorage.courseList;
    const saved = await saveFileWithPicker(data, `课程数据备份_${new Date().getTime()}.json`, {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert("✅ 课程数据导出完成");
}
function importCourseBackup(){
    const file = document.getElementById("courseBackupFile").files[0];
    if(!file) return alert("请选择备份文件");
    const reader = new FileReader();
    reader.onload = e=>{
        try{
            JSON.parse(e.target.result);
            localStorage.courseList = e.target.result;
            renderCourse();
            renderCourseSelects();
            alert("✅ 课程数据导入成功");
        }catch(err){
            alert("❌ 文件格式错误");
        }
    };
    reader.readAsText(file);
}

// ===================== 工具函数 =====================
function timeToMin(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function isTimeOverlap(s1, e1, s2, e2) {
    const start1 = timeToMin(s1);
    const end1 = timeToMin(e1);
    const start2 = timeToMin(s2);
    const end2 = timeToMin(e2);
    return start1 < end2 && start2 < end1;
}

/**
 * 全局冲突检测【兼容旧4段格式 + 新6段带时间格式】
 * 旧数据：从当前课表课时解析时间
 * 新数据：读取自带时间，支持跨不同结构课表冲突
 */
function checkAllConflict() {
    const teacherTimeMap = {};
    const roomTimeMap = {};
    window.globalConflictList = [];
    const conflictCellSet = new Set();

    tableList.forEach(tableItem => {
        const bindClassName = tableItem.bindClass;
        const timeArr = tableItem.timeList;
        const tableData = tableItem.data;

        Object.keys(tableData).forEach(cellKey => {
            const [rowIdx, weekIdx] = cellKey.split('-').map(Number);
            const cellSaveStr = tableData[cellKey];
            if (!cellSaveStr) return;

            let courseKey, startTime, endTime;
            const saveParts = cellSaveStr.split('|');

            // 兼容旧格式：4段 课程|教师|教室|班级
            if (saveParts.length === 4) {
                courseKey = cellSaveStr;
                // 从当前课表课时解析时间
                const timeMatch = timeArr[rowIdx]?.name.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                if (!timeMatch) return;
                startTime = timeMatch[1];
                endTime = timeMatch[2];
            } 
            // 新格式：6段 课程|教师|教室|班级|开始|结束
            else if (saveParts.length >= 6) {
                courseKey = saveParts.slice(0,4).join('|');
                startTime = saveParts[4];
                endTime = saveParts[5];
                if (!startTime || !endTime) return;
            } else {
                return;
            }

            const courseInfo = getCourseInfo(courseKey);
            if (!courseInfo) return;

            const weekName = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][weekIdx];
            const teacherName = courseInfo.teacher;
            const roomName = courseInfo.room;
            const courseShowText = `${courseInfo.name}（${teacherName}，${roomName}）`;

            if (!teacherTimeMap[weekName]) teacherTimeMap[weekName] = [];
            if (!roomTimeMap[weekName]) roomTimeMap[weekName] = [];

            let hasConflict = false;
            let conflictDetails = [];

            // 教师冲突检测
            teacherTimeMap[weekName].forEach(item => {
                if (item.teacher === teacherName && isTimeOverlap(startTime, endTime, item.start, item.end)) {
                    hasConflict = true;
                    conflictDetails.push({
                        type: '教师时间冲突',
                        week: weekName,
                        targetName: teacherName,
                        nowClass: bindClassName,
                        nowCourse: courseShowText,
                        existClass: item.className,
                        existCourse: item.courseText,
                        time: `${startTime}~${endTime}`,
                        cellKey: `${tableItem.id}|${cellKey}`
                    });
                }
            });

            // 教室冲突检测
            roomTimeMap[weekName].forEach(item => {
                if (item.room === roomName && isTimeOverlap(startTime, endTime, item.start, item.end)) {
                    hasConflict = true;
                    conflictDetails.push({
                        type: '教室场地冲突',
                        week: weekName,
                        targetName: roomName,
                        nowClass: bindClassName,
                        nowCourse: courseShowText,
                        existClass: item.className,
                        existCourse: item.courseText,
                        time: `${startTime}~${endTime}`,
                        cellKey: `${tableItem.id}|${cellKey}`
                    });
                }
            });

            if (hasConflict) {
                conflictDetails.forEach(item => window.globalConflictList.push(item));
                conflictCellSet.add(`${tableItem.id}|${cellKey}`);
            }

            teacherTimeMap[weekName].push({
                teacher: teacherName,
                className: bindClassName,
                courseText: courseShowText,
                start: startTime,
                end: endTime
            });
            roomTimeMap[weekName].push({
                room: roomName,
                className: bindClassName,
                courseText: courseShowText,
                start: startTime,
                end: endTime
            });
        });
    });

    // 刷新当前课表渲染标红
    renderSchedule();

    // 统计当前课表冲突 + 全局冲突
    const currentTableId = window.currentTableId;
    const currentConflictList = window.globalConflictList.filter(item => item.cellKey.startsWith(`${currentTableId}|`));
    const totalGlobal = window.globalConflictList.length;
    const currentCount = currentConflictList.length;

    const conflictTipDom = document.getElementById('conflictTip');
    if (totalGlobal === 0) {
        conflictTipDom.style.color = '#28a745';
        conflictTipDom.innerText = '✅ 全局检测完成：所有教师、教室时段无冲突';
    } else {
        conflictTipDom.style.color = '#dc3545';
        conflictTipDom.innerText = `❌ 全局共${totalGlobal}处冲突，当前课表检测到${currentCount}处冲突，冲突单元格已标红，可点击【查看冲突详情】按钮查看`;
    }
}

// 查看冲突详情函数
function showConflictDetail() {
    if (!window.globalConflictList || window.globalConflictList.length === 0) {
        alert("暂无排课冲突，请先执行全局冲突检测");
        return;
    }
    let msg = `=====全局排课冲突详情（共${window.globalConflictList.length}处）=====\n`;
    window.globalConflictList.forEach((item, idx) => {
        msg += `【${idx+1}】${item.type}\n星期：${item.week}  时段：${item.time}\n冲突资源：${item.targetName}\n待排【${item.nowClass}】：${item.nowCourse}\n已占用【${item.existClass}】：${item.existCourse}\n\n`;
    });
    alert(msg);
}

// ========== 关闭页面前：导出课表与备份提醒 ==========
const CLOSE_BACKUP_REMINDER_MSG =
    '关闭前请先导出课表并完成全部数据备份。数据仅保存在浏览器本地，清除缓存或更换设备可能导致丢失。';

function markBackupExported(){
    sessionStorage.setItem('scheduleBackupExported', '1');
    localStorage.setItem('lastBackupTime', new Date().toISOString());
    touchStorageRefresh();
}

function shouldRemindBackupOnClose(){
    if(sessionStorage.getItem('scheduleBackupExported') === '1') return false;
    try{
        const tables = JSON.parse(localStorage.getItem('multiTableData') || '[]');
        if(Array.isArray(tables) && tables.length > 0) return true;
    }catch(e){}
    const keys = ['classList', 'teacherList', 'roomList', 'courseList', 'timeTemplateList'];
    return keys.some(k => {
        try{
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            return Array.isArray(arr) && arr.length > 0;
        }catch(e){
            return false;
        }
    });
}

let skipCloseReminderOnce = false;
window.userConfirmedExit = false;

function switchTabByName(tabName){
    document.querySelectorAll('.tab-top button').forEach(btn=>{
        const onclick = btn.getAttribute('onclick') || '';
        if(onclick.includes(`switchTab('${tabName}'`)){
            switchTab(tabName, btn);
        }
    });
}

function openExitConfirm(){
    const modal = document.getElementById('exitModal');
    if(modal) modal.style.display = 'flex';
}

function closeExitConfirm(){
    const modal = document.getElementById('exitModal');
    if(modal) modal.style.display = 'none';
}

function exitGoToBackup(){
    closeExitConfirm();
    switchTabByName('schedule');
    setTimeout(function(){
        const panel = document.getElementById('scheduleBackupPanel');
        if(panel) panel.open = true;
        panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
}

function confirmAppExit(){
    closeExitConfirm();
    window.userConfirmedExit = true;
    window.close();
    setTimeout(function(){
        alert('如页面未自动关闭，请手动关闭浏览器标签页或窗口。');
    }, 300);
}

function initCloseBackupReminder(){
    document.addEventListener('keydown', function(e){
        const key = (e.key || '').toLowerCase();
        if(key === 'f5' || ((e.ctrlKey || e.metaKey) && key === 'r')){
            skipCloseReminderOnce = true;
        }
    });

    window.addEventListener('beforeunload', function(e){
        if(window.userConfirmedExit){
            return;
        }
        if(skipCloseReminderOnce){
            skipCloseReminderOnce = false;
            return;
        }
        if(!shouldRemindBackupOnClose()) return;
        e.preventDefault();
        e.returnValue = CLOSE_BACKUP_REMINDER_MSG;
        return CLOSE_BACKUP_REMINDER_MSG;
    });
}

initCloseBackupReminder();