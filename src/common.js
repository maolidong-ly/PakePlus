
function closeHeaderMoreMenu() {
    document.querySelectorAll('.header-more-menu[open]').forEach(function(el) {
        el.open = false;
    });
}
function initHeaderMoreMenuDismiss() {
    if (window.__headerMoreDismissBound) return;
    window.__headerMoreDismissBound = true;
    document.addEventListener('pointerdown', function(e) {
        document.querySelectorAll('.header-more-menu[open]').forEach(function(menu) {
            if (!menu.contains(e.target)) {
                menu.open = false;
            }
        });
    }, true);
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        closeHeaderMoreMenu();
    });
}

function updateXiaoduolaMusicButton(isPlaying) {
    const btn = document.getElementById('xiaoduolaMusicBtn');
    if (!btn) return;
    if (isPlaying) {
        btn.textContent = typeof t === 'function' ? t('header.stopMusic') : '停止播放';
        btn.title = typeof t === 'function' ? t('header.stopMusicTitle') : '停止播放音乐';
    } else {
        btn.textContent = typeof t === 'function' ? t('header.playStart') : '播放音乐';
        btn.title = typeof t === 'function' ? t('header.playStartTitle') : '播放音乐';
    }
}

function initXiaoduolaMusicButton() {
    const el = document.getElementById('xiaoduolaAudio');
    if (!el || el.__musicBtnBound) return;
    el.__musicBtnBound = true;
    el.addEventListener('ended', function() {
        updateXiaoduolaMusicButton(false);
    });
    el.addEventListener('pause', function() {
        if (el.currentTime === 0 || el.ended) updateXiaoduolaMusicButton(false);
    });
}

function toggleXiaoduolaMusic() {
    const el = document.getElementById('xiaoduolaAudio');
    if (!el) return;
    const playing = !el.paused && !el.ended;
    if (playing) {
        el.pause();
        el.currentTime = 0;
        updateXiaoduolaMusicButton(false);
        return;
    }
    el.volume = 0.85;
    el.currentTime = 0;
    el.play().then(function() {
        updateXiaoduolaMusicButton(true);
    }).catch(function() {});
}

function stopXiaoduolaMusic() {
    const el = document.getElementById('xiaoduolaAudio');
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    updateXiaoduolaMusicButton(false);
}

function refreshXiaoduolaMusicButtonLabel() {
    const el = document.getElementById('xiaoduolaAudio');
    const playing = !!(el && !el.paused && !el.ended);
    updateXiaoduolaMusicButton(playing);
}

function playXiaoduolaAudio() {
    toggleXiaoduolaMusic();
}

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
// 内置课时模版（直接写进 JS，打包后不依赖额外 json 文件也能加载）
const DEFAULT_TIME_TEMPLATES = [
    {
        name: '6节课模版（上午、下午、晚上各2节，每节2小时）',
        timeList: [
            {name:"第1节 08:20-10:20",isSplit:false},
            {name:"第2节 10:30-12:30",isSplit:false},
            {name:"第3节 13:20-15:20",isSplit:false},
            {name:"第4节 15:30-17:30",isSplit:false},
            {name:"第5节 18:00-20:00",isSplit:false},
            {name:"第6节 20:00-22:00",isSplit:false}
        ]
    },
    {
        name: '一天6节课（半小时起始）',
        timeList: [
            {name:"早自习7:40-8:15",isSplit:false},
            {name:"第1节 08:20-09:10",isSplit:false},
            {name:"第2节 09:20-10:10",isSplit:false},
            {name:"第3节 10:20-11:10",isSplit:false},
            {name:"第4节 11:20-12:10",isSplit:false},
            {name:"午休",isSplit:true},
            {name:"第5节 14:30-15:20",isSplit:false},
            {name:"第6节 15:30-16:20",isSplit:false},
            {name:"第7节 16:30-17:20",isSplit:false},
            {name:"晚饭",isSplit:true},
            {name:"第8节 18:30-19:20",isSplit:false},
            {name:"晚自习（上）19:30-20:40",isSplit:false}
        ]
    }
];
const DEFAULT_GROUP = ["文科1班","理科1班","一对一学员组1","一对一学员组2","小班课1组"];

/** 规范化时钟时间为 HH:mm（支持 7:40 → 07:40） */
function normalizeClockTime(token){
    if(token == null) return '';
    const m = String(token).trim().match(/^(\d{1,2}):(\d{2})$/);
    if(!m) return '';
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if(isNaN(h) || isNaN(min) || h > 23 || min > 59) return '';
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}

/**
 * 从课时名称中解析起止时间（兼容不同模版写法）
 * 例：第1节 08:20-09:10 / 早自习7:40-8:15 / 晚自习（上）19:30～20:40
 */
function parsePeriodTimeRange(name){
    if(name == null || name === '') return null;
    const m = String(name).match(/(\d{1,2}:\d{2})\s*[-–—~～]\s*(\d{1,2}:\d{2})/);
    if(!m) return null;
    const start = normalizeClockTime(m[1]);
    const end = normalizeClockTime(m[2]);
    if(!start || !end) return null;
    return { start: start, end: end };
}

/** 读取单元格内课程的真实起止时间（6 段自定义或 4 段 + 行模板） */
function parseCellAssignmentTimes(cellSaveStr, timeArr, rowIdx){
    if(!cellSaveStr) return null;
    const parts = String(cellSaveStr).split('|');
    if(parts.length >= 6){
        const start = parts[4];
        const end = parts[5];
        if(start && end) return { start: start, end: end };
    }
    if(parts.length === 4){
        const rowRange = parsePeriodTimeRange(timeArr?.[rowIdx]?.name);
        if(rowRange) return { start: rowRange.start, end: rowRange.end };
    }
    return null;
}
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

/** 删除课时行后，排课格子行号下移，避免错位或底部出现“幽灵行” */
function reindexScheduleAfterTimeRowRemoved(schedule, removedIdx){
    if(!schedule || typeof schedule !== 'object') return {};
    const next = {};
    Object.keys(schedule).forEach(function(key){
        const parts = String(key).split('-');
        if(parts.length !== 2) return;
        const r = parseInt(parts[0], 10);
        const w = parseInt(parts[1], 10);
        if(isNaN(r) || isNaN(w)) return;
        if(r === removedIdx) return;
        const nr = r > removedIdx ? r - 1 : r;
        next[nr + '-' + w] = schedule[key];
    });
    return next;
}

/** 去掉超出当前课时行数或非法坐标的排课数据（切换课表/改模版后残留） */
function pruneScheduleDataForTimeList(schedule, timeList){
    const maxRow = Array.isArray(timeList) ? timeList.length : 0;
    const next = {};
    let removed = 0;
    if(!schedule || typeof schedule !== 'object') return { schedule: {}, removed: 0 };
    Object.keys(schedule).forEach(function(key){
        const parts = String(key).split('-');
        if(parts.length !== 2){ removed++; return; }
        const r = parseInt(parts[0], 10);
        const w = parseInt(parts[1], 10);
        if(isNaN(r) || isNaN(w) || r < 0 || w < 0 || w >= weekCount || r >= maxRow){
            removed++;
            return;
        }
        next[key] = schedule[key];
    });
    return { schedule: next, removed: removed };
}

function sanitizeCurrentTableScheduleData(){
    if(!currentTableId) return 0;
    const item = tableList.find(function(t){ return t.id === currentTableId; });
    if(!item) return 0;
    const timeList = item.timeList || [];
    const result = pruneScheduleDataForTimeList(item.data, timeList);
    if(result.removed > 0){
        item.data = result.schedule;
        saveTableList();
    }
    return result.removed;
}

const DEFAULT_APP_NAME = '西典学校排课系统';
const DEFAULT_APP_SUBTITLE = '智能课表管理 · 多维度排课';
const APP_NAME_KEY = 'schedule_app_name';
const APP_SUBTITLE_KEY = 'schedule_app_subtitle';

function getAppName(){
    const name = (localStorage.getItem(APP_NAME_KEY) || '').trim();
    if(name) return name;
    return (typeof t === 'function') ? t('app.title') : DEFAULT_APP_NAME;
}

function getAppSubtitle(){
    const raw = localStorage.getItem(APP_SUBTITLE_KEY);
    if(raw === null){
        return (typeof t === 'function') ? t('app.subtitle') : DEFAULT_APP_SUBTITLE;
    }
    const sub = (raw || '').trim();
    // 常见中文标语：切英文时自动翻译显示
    if(typeof t === 'function' && typeof getAppLang === 'function' && getAppLang() === 'en'){
        if(!sub || sub === DEFAULT_APP_SUBTITLE || sub === '智能课表管理 · 多维度排课') return t('app.subtitle');
        if(sub === '点击可修改名称标语' || sub === '点击修改程序名称') return t('app.editBrandHint');
    }
    return sub;
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
    if(!name) return alert(typeof t==='function'?t('msg.brandEmpty'):'程序名称不能为空');
    localStorage.setItem(APP_NAME_KEY, name);
    localStorage.setItem(APP_SUBTITLE_KEY, subtitle || DEFAULT_APP_SUBTITLE);
    applyAppBranding();
    cancelBrandEdit();
}

function onBrandInputKeydown(e){
    if(e.key === 'Enter') saveAppBranding();
    if(e.key === 'Escape') cancelBrandEdit();
}

// ========== 软件内置弹窗（避免打包版原生 confirm/alert 卡死无响应） ==========
let appDialogResolver = null;
let appDialogMode = 'alert';

function escAppDialogText(str){
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

function resolveAppDialog(ok){
    const mask = document.getElementById('appDialogMask');
    const input = document.getElementById('appDialogInput');
    const resolver = appDialogResolver;
    appDialogResolver = null;
    if(mask) mask.style.display = 'none';
    if(!resolver) return;
    if(appDialogMode === 'prompt'){
        resolver(ok ? (input?.value ?? null) : null);
    }else if(appDialogMode === 'confirm'){
        resolver(!!ok);
    }else{
        resolver(true);
    }
}

function openAppDialog(options){
    options = options || {};
    const mode = options.mode || 'alert';
    const title = options.title || (typeof t==='function' ? (mode === 'confirm' ? t('dialog.confirmTitle') : mode === 'prompt' ? t('dialog.promptTitle') : t('dialog.alertTitle')) : (mode === 'confirm' ? '请确认' : mode === 'prompt' ? '请输入' : '提示'));
    const message = options.message || '';
    const defaultValue = options.defaultValue == null ? '' : String(options.defaultValue);

    return new Promise(function(resolve){
        if(appDialogResolver){
            resolveAppDialog(false);
        }
        appDialogMode = mode;
        appDialogResolver = resolve;

        const mask = document.getElementById('appDialogMask');
        const titleEl = document.getElementById('appDialogTitle');
        const msgEl = document.getElementById('appDialogMessage');
        const promptWrap = document.getElementById('appDialogPromptWrap');
        const input = document.getElementById('appDialogInput');
        const cancelBtn = document.getElementById('appDialogCancelBtn');
        const okBtn = document.getElementById('appDialogOkBtn');

        if(!mask || !msgEl){
            // 弹窗 DOM 缺失时降级，但打包版可能仍会卡住
            if(mode === 'confirm') resolve(window.confirm(message.replace(/<br>/g, '\n')));
            else if(mode === 'prompt') resolve(window.prompt(message.replace(/<br>/g, '\n'), defaultValue));
            else{ window.alert(message.replace(/<br>/g, '\n')); resolve(true); }
            return;
        }

        if(titleEl) titleEl.textContent = title;
        msgEl.innerHTML = escAppDialogText(message);
        msgEl.scrollTop = 0;
        if(promptWrap) promptWrap.style.display = mode === 'prompt' ? 'block' : 'none';
        if(cancelBtn) cancelBtn.style.display = mode === 'alert' ? 'none' : '';
        if(okBtn) okBtn.textContent = (typeof t==='function'?t('common.confirm'):'确定');
        if(input){
            input.value = defaultValue;
            input.onkeydown = function(e){
                if(e.key === 'Enter') resolveAppDialog(true);
                if(e.key === 'Escape') resolveAppDialog(false);
            };
        }
        mask.onclick = function(e){
            if(e.target === mask && mode === 'alert') resolveAppDialog(true);
        };
        mask.onkeydown = function(e){
            if(e.key === 'Escape'){
                resolveAppDialog(mode === 'alert' ? true : false);
            }
        };
        mask.tabIndex = -1;
        mask.style.display = 'flex';
        if(mode === 'prompt') setTimeout(function(){ input?.focus(); input?.select(); }, 30);
        else setTimeout(function(){ okBtn?.focus(); mask.focus(); }, 30);
    });
}

function showAppAlert(message, title){
    return openAppDialog({
        mode: 'alert',
        title: title || (typeof t==='function'?t('common.tip'):'提示'),
        message: message
    });
}

function showAppConfirm(message, title){
    return openAppDialog({ mode: 'confirm', title: title || '请确认', message: message });
}

function showAppPrompt(message, defaultValue, title){
    return openAppDialog({
        mode: 'prompt',
        title: title || '请输入',
        message: message,
        defaultValue: defaultValue || ''
    });
}

// 全局变量挂载window（仅保留手动排课必需全局变量，移除自动排课模式变量）
window.currentView = "classView";
window.activeCell = null;
window.tableList = [];
window.currentTableId = "";
window.timeTemplateList = [];
window.historyStack = [];
window.historyIndex = -1;
window.tableHistoryMap = window.tableHistoryMap || {};
// 全局冲突缓存
window.globalConflictList = [];

// 本地存储初始化
function initLocalStorage(){
    // 全局基础数据不再包含公共课时
    if(!appGetItem('classList')) appSetItem('classList', JSON.stringify(DEFAULT_GROUP));
    if(!appGetItem('teacherList')) appSetItem('teacherList', JSON.stringify(DEFAULT_TEACHERS));
    if(!appGetItem('roomList')) appSetItem('roomList', JSON.stringify(DEFAULT_ROOMS));
    if(!appGetItem('courseList')) appSetItem('courseList', JSON.stringify(DEFAULT_COURSES));
    if(!appGetItem('multiTableData')) appSetItem('multiTableData', JSON.stringify([]));
    
    tableList = JSON.parse(appGetItem('multiTableData') || '[]');
    // 兼容旧版：给没有独立课时的旧课表，绑定默认课时
    let prunedAny = false;
    tableList = tableList.map(table=>{
        const timeList = table.timeList ? table.timeList : JSON.parse(JSON.stringify(DEFAULT_TIME));
        const pr = pruneScheduleDataForTimeList(table.data || {}, timeList);
        if(pr.removed > 0) prunedAny = true;
        return {
            id:table.id,
            name:table.name,
            bindClass:table.bindClass || "",
            data: pr.removed > 0 ? pr.schedule : (table.data || {}),
            timeList: timeList,
            periodTemplateRef: table.periodTemplateRef || 'default',
            autoScheduleConfig: table.autoScheduleConfig || { constraints: [], settings: { onlyEmpty: true, checkGlobal: true, spreadWeek: true } }
        }
    });
    if(prunedAny) saveTableList();
    
    // 保留当前选中的课表（局域网轮询会反复 init，不能每次都跳回第一张）
    if(tableList.length > 0){
        const seedId = (typeof window !== 'undefined' && window.__seedDefaultCurrentTableId)
            ? String(window.__seedDefaultCurrentTableId).trim()
            : '';
        if(seedId && tableList.some(function(t){ return t.id === seedId; })){
            currentTableId = seedId;
            if(typeof window !== 'undefined') delete window.__seedDefaultCurrentTableId;
        }
        const stillExists = currentTableId && tableList.some(function(t){ return t.id === currentTableId; });
        if(!stillExists){
            currentTableId = tableList[0].id;
        }
    }else{
        currentTableId = '';
    }
    saveSnapshot();
    touchStorageRefresh();
    refreshStorageQuotaEstimate();
}

const TIME_TEMPLATE_HIDDEN_KEY = 'timeTemplateHiddenNames';

/** 「模板/模版」视为同一名称，避免删了用户侧「模板」又被内置「模版」补回 */
function normalizeTimeTemplateNameKey(name){
    return String(name || '').trim().replace(/模板/g, '模版');
}

function getHiddenTimeTemplateNames(){
    try{
        const raw = JSON.parse(appGetItem(TIME_TEMPLATE_HIDDEN_KEY) || '[]');
        return Array.isArray(raw) ? raw.map(function(n){ return String(n || '').trim(); }).filter(Boolean) : [];
    }catch(e){
        return [];
    }
}

function isTimeTemplateHidden(name){
    const key = normalizeTimeTemplateNameKey(name);
    if(!key) return false;
    return getHiddenTimeTemplateNames().some(function(n){
        return normalizeTimeTemplateNameKey(n) === key;
    });
}

function addHiddenTimeTemplateName(name){
    const trimmed = String(name || '').trim();
    if(!trimmed) return;
    if(isTimeTemplateHidden(trimmed)) return;
    const hidden = getHiddenTimeTemplateNames();
    hidden.push(trimmed);
    appSetItem(TIME_TEMPLATE_HIDDEN_KEY, JSON.stringify(hidden));
    touchStorageRefresh();
}

function filterHiddenTimeTemplates(list){
    return (list || []).filter(function(item){
        return item && !isTimeTemplateHidden(item.name);
    });
}

function saveTimeTemplateListStorage(){
    appSetItem('timeTemplateList', JSON.stringify(timeTemplateList));
    touchStorageRefresh();
    persistTimeTemplatesToAppFile();
}

function normalizeTimeTemplateList(raw){
    if(!Array.isArray(raw)) return [];
    return raw.map(function(item){
        if(!item || typeof item !== 'object') return null;
        const name = String(item.name || '').trim();
        const timeList = Array.isArray(item.timeList) ? item.timeList.map(function(t){
            if(typeof t === 'string') return { name: t, isSplit: false };
            return {
                name: String(t?.name || '').trim(),
                isSplit: !!t?.isSplit
            };
        }).filter(function(t){ return t.name; }) : [];
        if(!name || !timeList.length) return null;
        return { name: name, timeList: timeList };
    }).filter(Boolean);
}

function mergeTimeTemplateLists(savedList, builtinList){
    const merged = JSON.parse(JSON.stringify(savedList || []));
    (builtinList || []).forEach(function(builtin){
        if(!merged.some(function(item){ return item.name === builtin.name; })){
            merged.push(JSON.parse(JSON.stringify(builtin)));
        }
    });
    return merged;
}

async function fetchBuiltinTimeTemplates(){
    // 1) 优先用写进代码里的内置模版（打包后最可靠，不依赖外置 json）
    const embedded = normalizeTimeTemplateList(DEFAULT_TIME_TEMPLATES);
    // 2) 若旁边有 timeTemplates.json（开发/手动放入安装目录），合并进去
    try{
        const res = await fetch('timeTemplates.json', { cache: 'no-cache' });
        if(res.ok){
            const data = normalizeTimeTemplateList(await res.json());
            if(data.length) return mergeTimeTemplateLists(embedded, data);
        }
    }catch(e){}
    return embedded.length ? embedded : JSON.parse(JSON.stringify(DEFAULT_TIME_TEMPLATES));
}

async function getTimeTemplateAppFilePath(){
    if(typeof getAppLocalDataDir !== 'function') return null;
    const dir = await getAppLocalDataDir();
    if(!dir) return null;
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir + sep + 'time_templates.json';
}

async function readTimeTemplatesFromAppFile(){
    const path = await getTimeTemplateAppFilePath();
    if(!path) return null;
    try{
        const tauri = window.__TAURI__;
        let text;
        if(tauri?.fs?.readTextFile) text = await tauri.fs.readTextFile(path);
        else if(typeof tauriInvoke === 'function') text = await tauriInvoke('plugin:fs|read_text_file', { path: path });
        if(typeof text !== 'string') return null;
        const data = normalizeTimeTemplateList(JSON.parse(text));
        return data.length ? data : null;
    }catch(e){
        return null;
    }
}

async function persistTimeTemplatesToAppFile(){
    const path = await getTimeTemplateAppFilePath();
    if(!path) return false;
    const content = JSON.stringify(timeTemplateList, null, 2);
    try{
        const tauri = window.__TAURI__;
        if(tauri?.fs?.writeTextFile) await tauri.fs.writeTextFile(path, content);
        else if(typeof tauriInvoke === 'function') await tauriInvoke('plugin:fs|write_text_file', { path: path, contents: content });
        else return false;
        return true;
    }catch(e){
        return false;
    }
}

async function initTimeTemplates(){
    const builtinList = filterHiddenTimeTemplates(await fetchBuiltinTimeTemplates());
    let savedList = filterHiddenTimeTemplates(normalizeTimeTemplateList(
        JSON.parse(appGetItem('timeTemplateList') || '[]')
    ));

    // 打包版应用数据目录中的模版（用户安装后保存的）优先并入
    const fileList = filterHiddenTimeTemplates(await readTimeTemplatesFromAppFile());
    // 已有本地模版时以 app 存储为准；勿用旧的 time_templates.json 把已删模版「复活」
    if(fileList && fileList.length && !savedList.length){
        savedList = fileList;
    }

    if(!savedList.length){
        timeTemplateList = filterHiddenTimeTemplates(JSON.parse(JSON.stringify(builtinList)));
    }else{
        // 仅补充尚未存在的内置模版（用户已删除的内置模版不再恢复）
        timeTemplateList = filterHiddenTimeTemplates(mergeTimeTemplateLists(savedList, builtinList));
    }

    appSetItem('timeTemplateList', JSON.stringify(timeTemplateList));
    touchStorageRefresh();
    await persistTimeTemplatesToAppFile();
    if(typeof renderTimeTemplateSelect === 'function') renderTimeTemplateSelect();
}

/** 导出当前全部课时模版为 JSON（打包前请导出并替换项目里的 timeTemplates.json） */
async function exportTimeTemplatesForPack(){
    if(!Array.isArray(timeTemplateList) || !timeTemplateList.length){
        return showAppAlert(typeof t==='function'?t('msg.noTemplatesExport'):'暂无课时模版可导出');
    }
    const payload = JSON.stringify(timeTemplateList, null, 2);
    const saved = await saveFileWithPicker(payload, 'timeTemplates.json', {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved){
        await showAppAlert(typeof t==='function'?t('msg.templatesExportOk'):'已导出 timeTemplates.json。打包前请用此文件替换项目目录中的同名文件，自定义模版才会打进安装包。');
    }
}

function saveTableList(){
    try{
        appSetItem('multiTableData', JSON.stringify(tableList));
        if(typeof renderStorageStatus === 'function') renderStorageStatus();
    }catch(err){
        notifyStorageQuotaExceeded(err);
        throw err;
    }
}

/** 排课连续点击时合并写盘，避免每次 stringify 全部课表 */
let _tableListSaveTimer = null;
function scheduleSaveTableList(delayMs){
    if(_tableListSaveTimer) clearTimeout(_tableListSaveTimer);
    _tableListSaveTimer = setTimeout(function(){
        _tableListSaveTimer = null;
        try{ saveTableList(); }catch(e){}
    }, delayMs == null ? 220 : delayMs);
}
function flushSaveTableList(){
    if(_tableListSaveTimer){
        clearTimeout(_tableListSaveTimer);
        _tableListSaveTimer = null;
    }
    try{ saveTableList(); }catch(e){}
}

/** 冲突检测防抖：连点排课时不阻塞界面 */
let _conflictCheckTimer = null;
function scheduleConflictCheckSoon(delayMs){
    if(_conflictCheckTimer) clearTimeout(_conflictCheckTimer);
    _conflictCheckTimer = setTimeout(function(){
        _conflictCheckTimer = null;
        if(typeof flushSaveTableList === 'function') flushSaveTableList();
        checkAllConflict();
    }, delayMs == null ? 450 : delayMs);
}
const STORAGE_DEFAULT_QUOTA = 5 * 1024 * 1024;
const STORAGE_EMPTY_TABLE_EST = 1800;
/** 按常见排课密度估算（约 6KB/张），避免空课表把“还可增”算得过大 */
const STORAGE_TYPICAL_TABLE_BYTES = 6000;
const STORAGE_WARN_PERCENT = 70;
const STORAGE_DANGER_PERCENT = 85;
const BACKUP_REMIND_DAYS = 7;

function getLocalStorageByteSize(){
    if(typeof getBulkDataByteSize === 'function' && typeof isLargeCapacityBackend === 'function' && isLargeCapacityBackend()){
        let total = getBulkDataByteSize();
        // 加上非大数据键（授权、登录、主题等）
        for(let i = 0; i < localStorage.length; i++){
            const key = localStorage.key(i);
            if(typeof isBulkStorageKey === 'function' && isBulkStorageKey(key)) continue;
            const val = localStorage.getItem(key) || '';
            total += (key.length + val.length) * 2;
        }
        return total;
    }
    let total = 0;
    for(let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        const val = localStorage.getItem(key) || '';
        total += (key.length + val.length) * 2;
    }
    return total;
}

function getMultiTableByteSize(){
    const str = appGetItem('multiTableData') || '[]';
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
    const quotaBytes = (typeof getAppDataQuotaBytes === 'function') ? getAppDataQuotaBytes() : STORAGE_DEFAULT_QUOTA;
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
    const large = typeof isLargeCapacityBackend === 'function' && isLargeCapacityBackend();
    const tt = (typeof t==='function') ? t : null;
    if(large){
        if(stats.usedBytes < 10 * 1024 * 1024) return { text: tt?tt('storage.spaceOk'):'空间充足', level: 'ok' };
        if(stats.usedBytes < 100 * 1024 * 1024) return { text: tt?tt('storage.spaceNormal'):'用量正常', level: 'ok' };
        return { text: tt?tt('storage.spaceLarge'):'数据量较大，建议定期导出备份', level: 'warn' };
    }
    if(stats.usedPercent >= STORAGE_DANGER_PERCENT){
        return {
            text: tt?tt('storage.spaceTight',{n:formatRemainingTableCount(stats.typicalRemainingTables)}):(`空间紧张，约还可增 ${formatRemainingTableCount(stats.typicalRemainingTables)} 张`),
            level: 'danger'
        };
    }
    if(stats.usedPercent >= STORAGE_WARN_PERCENT){
        return {
            text: tt?tt('storage.spaceWarn',{n:formatRemainingTableCount(stats.typicalRemainingTables)}):(`空间偏紧，约还可增 ${formatRemainingTableCount(stats.typicalRemainingTables)} 张`),
            level: 'warn'
        };
    }
    if(stats.usedPercent >= 50){
        return { text: tt?tt('storage.spaceMid'):'空间适中', level: 'ok' };
    }
    return { text: tt?tt('storage.spaceOk'):'空间充足', level: 'ok' };
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
    text.className = 'ui-hint-tooltip tm-storage-tooltip' + (level === 'ok' ? '' : ` ${level}`);
    bar.className = 'tm-storage-trigger' + (level === 'ok' ? '' : ` storage-level-${level}`);

    let msg = (typeof t==='function'?t('storage.local'):'本地存储') + ` ${formatStorageSize(stats.usedBytes)} / ${formatStorageSize(stats.quotaBytes)}（${stats.usedPercent.toFixed(0)}%）`;
    if(typeof getAppStorageBackendLabel === 'function'){
        msg += ` · ${getAppStorageBackendLabel()}`;
    }
    msg += ` · ` + (typeof t==='function'?t('storage.tables',{n:stats.tableCount}):(`课表 ${stats.tableCount} 张`)) + ` · ${spaceHint.text}`;

    const daysSinceBackup = getDaysSinceBackup();
    if(daysSinceBackup === null){
        if(stats.tableCount > 0) msg += ' · ' + (typeof t==='function'?t('storage.suggestBackup'):'建议导出备份');
    }else if(daysSinceBackup >= BACKUP_REMIND_DAYS){
        msg += ' · ' + (typeof t==='function'?t('storage.daysNoBackup',{n:daysSinceBackup}):(`已 ${daysSinceBackup} 天未备份`));
    }

    if(level === 'danger'){
        msg += ' · ' + (typeof t==='function'?t('storage.backupSoon'):'请尽快导出备份');
    }else if(level === 'warn'){
        msg += ' · ' + (typeof t==='function'?t('storage.suggestBackupShort'):'建议备份');
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
    console.error('本地存储写入失败：', err);
    const backendHint = (typeof getAppStorageBackendLabel === 'function') ? getAppStorageBackendLabel() : 'localStorage';
    alert('❌ 数据保存失败（当前方案：' + backendHint + '）。请先导出全部备份，并删除不需要的课表或基础数据后重试。');
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

// 历史撤销：每张课表独立快照栈（非文件备份，配合 ↩ / ↪ 使用）
function getTableHistory(tableId) {
    if (!tableId) return { stack: [], index: -1 };
    if (!tableHistoryMap[tableId]) {
        tableHistoryMap[tableId] = { stack: [], index: -1 };
    }
    return tableHistoryMap[tableId];
}

function syncActiveHistoryPointers() {
    const hist = getTableHistory(currentTableId);
    historyStack = hist.stack;
    historyIndex = hist.index;
}

function saveSnapshot(options) {
    const opts = options || {};
    const silent = opts.silent !== false;
    const force = opts.force === true;
    if (!currentTableId) {
        if (!silent) alert(typeof t === "function" ? t("msg.noTable") : "暂无选中课表，请先新建或选择课表");
        return false;
    }
    const table = getCurrentTableInfo();
    if (!table) return false;
    const hist = getTableHistory(currentTableId);
    const data = JSON.parse(JSON.stringify({
        data: table.data,
        timeList: table.timeList
    }));
    const currentTop = hist.index >= 0 ? hist.stack[hist.index] : null;
    if (!force && currentTop && JSON.stringify(currentTop) === JSON.stringify(data)) {
        syncActiveHistoryPointers();
        if (!silent) {
            alert("✅ 当前课表状态已在快照中。\n编辑后可点工具栏「↩」撤销；若要备份到文件请用下方「导出全部备份」。");
        }
        return true;
    }
    hist.stack.splice(hist.index + 1);
    hist.stack.push(data);
    hist.index = hist.stack.length - 1;
    while (hist.stack.length > 30) {
        hist.stack.shift();
        hist.index = Math.max(0, hist.index - 1);
    }
    syncActiveHistoryPointers();
    if (!silent) {
        alert(`✅ 已保存编辑快照（第 ${hist.index + 1} 步 / 共 ${hist.stack.length} 步）\n请用工具栏「↩」撤销到本快照之前的状态。`);
    }
    return true;
}

function saveSnapshotManual() {
    saveSnapshot({ silent: false, force: false });
}

function ensureTableHistoryBaseline() {
    if (!currentTableId) return;
    const hist = getTableHistory(currentTableId);
    if (hist.stack.length === 0) {
        saveSnapshot({ silent: true, force: true });
    } else {
        syncActiveHistoryPointers();
    }
}

function undoStep() {
    if (!currentTableId) return alert(typeof t === "function" ? t("msg.noTable") : "暂无选中课表，请先新建或选择课表");
    syncActiveHistoryPointers();
    const hist = getTableHistory(currentTableId);
    if (hist.index <= 0) return alert(typeof t === "function" ? t("msg.undoEnd") : "已经是最早一步，无法撤销");
    hist.index--;
    const data = hist.stack[hist.index];
    const tableItem = tableList.find(t => t.id === currentTableId);
    if (tableItem) {
        tableItem.data = data.data;
        tableItem.timeList = data.timeList;
    }
    syncActiveHistoryPointers();
    saveTableList();
    renderTime();
    renderSchedule();
    checkAllConflict();
}

function redoStep() {
    if (!currentTableId) return alert(typeof t === "function" ? t("msg.noTable") : "暂无选中课表，请先新建或选择课表");
    syncActiveHistoryPointers();
    const hist = getTableHistory(currentTableId);
    if (hist.index >= hist.stack.length - 1) {
        return alert(typeof t === "function" ? t("msg.redoEnd") : "已经是最新一步，无法重做");
    }
    hist.index++;
    const data = hist.stack[hist.index];
    const tableItem = tableList.find(t => t.id === currentTableId);
    if (tableItem) {
        tableItem.data = data.data;
        tableItem.timeList = data.timeList;
    }
    syncActiveHistoryPointers();
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
    const pr = pruneScheduleDataForTimeList(table.data, arr);
    if(pr.removed > 0) table.data = pr.schedule;
    saveTableList();
}

function saveCurrentTableData(data){
    if(!currentTableId) return;
    const item = tableList.find(t=>t.id === currentTableId);
    if(item) item.data = data;
    if(typeof scheduleSaveTableList === 'function') scheduleSaveTableList();
    else saveTableList();
}

// 基础数据读写（全局公共基础数据）
// 课程信息解析 四维度匹配：课程|教师|教室|班级（带缓存，避免每次 find 都解析整表）
let _courseInfoMap = null;
let _courseInfoMapSrc = null;

function invalidateCourseInfoCache(){
    _courseInfoMap = null;
    _courseInfoMapSrc = null;
}

function getCourseInfoMap(){
    const raw = appGetItem('courseList') || '[]';
    if(_courseInfoMap && _courseInfoMapSrc === raw) return _courseInfoMap;
    const map = new Map();
    try{
        const list = JSON.parse(raw);
        if(Array.isArray(list)){
            list.forEach(function(c){
                if(!c) return;
                map.set(String(c.name)+'|'+String(c.teacher)+'|'+String(c.room)+'|'+String(c.cls), c);
            });
        }
    }catch(e){}
    _courseInfoMap = map;
    _courseInfoMapSrc = raw;
    return map;
}

function getCourseInfo(valKey){
    if(!valKey) return null;
    const parts = String(valKey).split('|');
    const key = parts.length >= 4 ? parts.slice(0, 4).join('|') : String(valKey);
    return getCourseInfoMap().get(key) || null;
}

var CLASS_GRADE_OPTIONS = [
    '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
    '初一', '初二', '初三',
    '高一', '高二', '高三'
];

function normalizeClassEntry(item){
    if(item && typeof item === 'object'){
        return {
            name: String(item.name != null ? item.name : '').trim(),
            grade: String(item.grade != null ? item.grade : '').trim()
        };
    }
    return { name: String(item || '').trim(), grade: '' };
}

function getClassData(){
    var raw = JSON.parse(appGetItem('classList') || '[]');
    if(!Array.isArray(raw)) return [];
    return raw.map(normalizeClassEntry).filter(function(c){ return c.name; });
}

function getClassNames(){
    return getClassData().map(function(c){ return c.name; });
}

function getClassGradeByName(className){
    var key = String(className || '').trim();
    if(!key) return '';
    var list = getClassData();
    for(var i = 0; i < list.length; i++){
        if(list[i].name === key) return list[i].grade || '';
    }
    return '';
}

function saveClassData(arr){
    var list = (arr || []).map(normalizeClassEntry).filter(function(c){ return c.name; });
    appSetItem('classList', JSON.stringify(list));
    touchStorageRefresh();
}

function getTeacherData(){return JSON.parse(appGetItem('teacherList') || '[]');}
function saveTeacherData(arr){appSetItem('teacherList', JSON.stringify(arr)); touchStorageRefresh();}

function getRoomData(){return JSON.parse(appGetItem('roomList') || '[]');}
function saveRoomData(arr){appSetItem('roomList', JSON.stringify(arr)); touchStorageRefresh();}

function getCourseData(){return JSON.parse(appGetItem('courseList') || '[]');}
function saveCourseData(arr){
    appSetItem('courseList', JSON.stringify(arr));
    invalidateCourseInfoCache();
    touchStorageRefresh();
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
    const label = (typeof t === 'function') ? t('export.fileFilter') : '文件';
    return [{ name: label, extensions: extList }];
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
    const mimeMap = { json: 'application/json', xls: 'application/vnd.ms-excel', html: 'text/html', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
    const mime = mimeMap[ext] || blob.type || 'application/octet-stream';
    try{
        const handle = await window.showSaveFilePicker({
            suggestedName: sanitizeDefaultFilename(defaultFilename),
            types: [{
                description: (typeof t === 'function')
                    ? t('export.fileTypeDesc', { ext: ext.toUpperCase() })
                    : (ext.toUpperCase() + ' 文件'),
                accept: { [mime]: ['.' + ext], 'application/octet-stream': ['.' + ext] }
            }]
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
    alert(typeof t==='function'?t('export.saveFallbackDownload',{name:chosenName}):('无法保存到所选文件夹，文件已导出到默认下载目录：\n' + chosenName));
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
            alert(typeof t==='function'?t('export.savePermissionFail'):'保存失败，请检查应用是否有写入文件的权限');
            return null;
        }
    }

    const fsaResult = await browserPickSaveBlob(blob, safeFilename, extensions);
    if(fsaResult === true) return true;
    if(fsaResult === false) return false;

    if(isDesktopApp()){
        alert(typeof t==='function'?t('export.saveDialogFail'):'无法打开保存对话框，请更新 PakePlus 后重新打包，或开启 Debug 模式查看控制台报错');
        return null;
    }
    if(typeof window.showSaveFilePicker !== 'function'){
        alert(typeof t==='function'?t('export.browserNoPicker'):'当前浏览器不支持选择保存位置，文件将保存到默认下载文件夹');
    }
    browserDownloadFallback(blob, safeFilename);
    return true;
}

async function tauriWriteBlob(path, blob){
    const normalizedPath = normalizeSavePath(path);
    if(!normalizedPath || !blob) return false;
    const tauri = window.__TAURI__;
    const buffer = await blob.arrayBuffer();
    const u8 = new Uint8Array(buffer);
    try{
        // 必须写二进制 Uint8Array；普通数组在部分 Tauri 上会被写成 "137,80,78,71,..." 文本
        if(tauri?.fs?.writeFile){
            await tauri.fs.writeFile(normalizedPath, u8);
            return true;
        }
    }catch(err){
        console.warn('Tauri write blob failed:', err);
    }
    return false;
}

/** 保存二进制文件（如 PNG）——优先 Blob 直写/下载，避免坏文件 */
async function saveBlobWithPicker(blob, defaultFilename, extensions){
    extensions = extensions || [defaultFilename.split('.').pop()].filter(Boolean);
    const safeFilename = sanitizeDefaultFilename(defaultFilename);

    // 1) 系统文件选择器（二进制正确）
    if(typeof window.showSaveFilePicker === 'function'){
        const fsaResult = await browserPickSaveBlob(blob, safeFilename, extensions);
        if(fsaResult === true) return true;
        if(fsaResult === false) return false;
    }

    // 2) 打包版：尝试 Uint8Array 写入；失败则下载到默认目录（保证能打开）
    if(isDesktopApp()){
        const path = await tauriPickSavePath(safeFilename, extensions);
        if(path === null) return false;
        if(path){
            const ok = await tauriWriteBlob(path, blob);
            if(ok) return true;
            const chosenName = sanitizeDefaultFilename(extractBasename(path) || safeFilename);
            browserDownloadFallback(blob, ensureFileExtension(chosenName, extensions).split(/[/\\]/).pop());
            alert(typeof t==='function'?t('export.imageFallbackDownload',{name:chosenName}):('图片已保存到下载文件夹（所选位置写入失败）：\n' + chosenName));
            return true;
        }
    }

    // 3) 浏览器下载
    browserDownloadFallback(blob, safeFilename);
    return true;
}

function prepareExportFrameForFullCapture(doc){
    doc.documentElement.style.overflow = 'visible';
    doc.documentElement.style.height = 'auto';
    doc.body.style.overflow = 'visible';
    doc.body.style.height = 'auto';
    doc.body.style.margin = '0';
    doc.body.style.padding = '0 0 24px 0';
    const extra = doc.createElement('style');
    extra.textContent = [
        'html,body{overflow:visible!important;height:auto!important;}',
        'table{height:auto!important;border-collapse:collapse!important;}',
        'tr:last-child td{border-bottom:1px solid #000!important;}',
        'td.time-col{white-space:normal!important;word-break:break-word!important;line-height:1.25!important;}'
    ].join('');
    doc.head.appendChild(extra);
}

function measureExportCaptureSize(doc, target){
    const rect = target.getBoundingClientRect();
    let contentBottom = rect.bottom;
    const rows = target.querySelectorAll('tr');
    rows.forEach(function(row){
        const rr = row.getBoundingClientRect();
        if(rr.bottom > contentBottom) contentBottom = rr.bottom;
    });
    const contentTop = rect.top;
    const measuredH = Math.ceil(contentBottom - contentTop + 20);
    const w = Math.ceil(Math.max(target.scrollWidth, target.offsetWidth, rect.width, 830));
    const h = Math.ceil(Math.max(
        target.scrollHeight,
        target.offsetHeight,
        rect.height,
        measuredH,
        200
    ));
    return { w: w, h: h };
}

/** 将 HTML 表格渲染为 PNG 图片并导出 */
async function exportHtmlDocumentAsPng(htmlDoc, defaultFilename){
    if(typeof html2canvas === 'undefined'){
        return alert(typeof t==='function'?t('export.html2canvasMissing'):'图片导出模块未加载，请确认安装包内 vendor 文件夹完整后重试');
    }
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:900px;height:600px;border:none;opacity:0;pointer-events:none;overflow:visible;';
    document.body.appendChild(frame);

    try{
        const doc = frame.contentDocument || frame.contentWindow.document;
        doc.open();
        doc.write(htmlDoc);
        doc.close();
        prepareExportFrameForFullCapture(doc);
        await new Promise(function(resolve){ setTimeout(resolve, 280); });
        const tableEl = doc.body.querySelector('table');
        let target = tableEl || doc.body;
        if(tableEl && tableEl.parentNode){
            const wrap = doc.createElement('div');
            wrap.setAttribute('data-export-wrap', '1');
            wrap.style.cssText = 'display:inline-block;background:#fff;padding:0 0 36px 0;vertical-align:top;';
            tableEl.parentNode.insertBefore(wrap, tableEl);
            wrap.appendChild(tableEl);
            target = wrap;
        }
        const measureEl = tableEl || target;
        let size = measureExportCaptureSize(doc, measureEl);
        if(tableEl) size.h += 36;
        const padX = 40;
        const padY = 56;
        frame.style.width = (size.w + padX) + 'px';
        frame.style.height = (size.h + padY) + 'px';
        await new Promise(function(resolve){
            requestAnimationFrame(function(){
                setTimeout(resolve, 200);
            });
        });
        size = measureExportCaptureSize(doc, measureEl);
        if(tableEl) size.h += 36;
        const winW = size.w + padX;
        const winH = size.h + padY;
        let scale = 2;
        const maxCanvasEdge = 16384;
        while(size.h * scale > maxCanvasEdge || size.w * scale > maxCanvasEdge){
            scale = scale / 2;
            if(scale < 0.5) break;
        }
        const canvas = await html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: scale,
            useCORS: true,
            logging: false,
            windowWidth: winW,
            windowHeight: winH,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0
        });
        const blob = await new Promise(function(resolve){
            canvas.toBlob(resolve, 'image/png', 0.95);
        });
        if(!blob) return alert(typeof t==='function'?t('export.imageGenFail'):'图片生成失败，请重试');
        const saved = await saveBlobWithPicker(blob, defaultFilename, ['png']);
        if(saved && typeof markBackupExported === 'function') markBackupExported();
        return saved;
    }catch(err){
        console.error('exportHtmlDocumentAsPng failed:', err);
        const errMsg = err.message || (typeof t==='function'?t('export.unknownError'):'未知错误');
        alert(typeof t==='function'?t('export.imageExportFail',{msg:errMsg}):('图片导出失败：' + errMsg));
        return false;
    }finally{
        document.body.removeChild(frame);
    }
}

// ========== 课时模版管理（全局保存，新建课表时可选用） ==========
function getSelectedTimeTemplateIndex(){
    const selectDom = document.getElementById('timeTemplateSelect');
    if(!selectDom || selectDom.value === '') return null;
    const idx = Number(selectDom.value);
    if(!Number.isFinite(idx) || !timeTemplateList[idx]) return null;
    return idx;
}

function updateTimeTemplateModeHint(previewTemplate){
    const el = document.getElementById('timeTemplateModeHint');
    if(!el) return;
    if(previewTemplate){
        const idx = getSelectedTimeTemplateIndex();
        const name = idx != null && timeTemplateList[idx] ? timeTemplateList[idx].name : '';
        el.style.display = 'block';
        el.textContent = typeof t==='function'
            ? t('time.previewHint', { name: name })
            : ('正在预览模版「' + name + '」；修改下方课时仅更新该模版。点「应用到课表」才会写入上方选中的课表。');
    }else{
        el.style.display = 'block';
        el.textContent = typeof t==='function'
            ? t('time.tableHint')
            : '当前显示并编辑的是上方选中课表的课时；选择模版下拉可预览其它模版。';
    }
}

async function saveTimeAsTemplate(){
    const tplIdx = getSelectedTimeTemplateIndex();
    const timeList = tplIdx != null
        ? JSON.parse(JSON.stringify(timeTemplateList[tplIdx].timeList || []))
        : (currentTableId ? JSON.parse(JSON.stringify(getTimeData())) : []);
    if(!currentTableId && tplIdx == null) return showAppAlert("请先选中一张课表，或在下拉中选中要保存的模版");
    if(!timeList.length) return showAppAlert("当前课表没有课时，无法保存模版");

    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom ? selectDom.value : '';
    if(idx !== '' && timeTemplateList[idx]){
        const name = timeTemplateList[idx].name;
        const update = await showAppConfirm('是否更新模版「' + name + '」？\n点「取消」可另存为新模版。');
        if(update){
            timeTemplateList[idx].timeList = timeList;
            saveTimeTemplateListStorage();
            renderTimeTemplateSelect();
            if(selectDom) selectDom.value = String(idx);
            return showAppAlert('课时模版「' + name + '」已更新');
        }
    }

    const templateName = await showAppPrompt('请输入课时模版名称', '');
    if(!templateName || templateName.trim() === '') return;
    const trimmed = templateName.trim();
    if(timeTemplateList.some(function(t){ return t.name === trimmed; })){
        return showAppAlert('该模版名称已存在，请换一个名称，或先在下拉菜单选中该模版后点保存进行更新');
    }
    timeTemplateList.push({ name: trimmed, timeList: timeList });
    saveTimeTemplateListStorage();
    renderTimeTemplateSelect();
    if(selectDom){
        const newIdx = timeTemplateList.findIndex(function(t){ return t.name === trimmed; });
        if(newIdx >= 0) selectDom.value = String(newIdx);
    }
    await showAppAlert('课时模版保存成功，已写入软件本地，下次打开仍可使用');
}
function previewTimeTemplate(){
    onTimeTemplateSelectChange();
}
/** @param {boolean} [silent] 下拉切换时静默应用，不弹确认框 */
async function applyTimeTemplate(silent){
    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom ? selectDom.value : '';
    if(idx === '') return false;
    if(!timeTemplateList[idx]){
        await showAppAlert(typeof t==='function'?t('msg.templateNotFound'):'未找到该模版');
        return false;
    }
    if(typeof canEditData === 'function' && !canEditData()){
        // 只读仍允许预览模版内容
        if(typeof paintTimeList === 'function'){
            paintTimeList(JSON.parse(JSON.stringify(timeTemplateList[idx].timeList || [])));
        }
        if(!silent){
            await showAppAlert(typeof t==='function'?t('msg.readonlyNoEdit'):'当前账号为只读，无法修改课时。');
        }
        return false;
    }
    if(!currentTableId){
        if(typeof paintTimeList === 'function'){
            paintTimeList(JSON.parse(JSON.stringify(timeTemplateList[idx].timeList || [])));
        }
        if(!silent){
            await showAppAlert(typeof t==='function'?t('msg.selectTableFirst'):'请先选中一张课表');
        }
        return false;
    }
    if(!silent){
        const ok = await showAppConfirm(typeof t==='function'?t('msg.confirmApplyTemplate'):'确定用选中模版覆盖当前课表的课时设置吗？');
        if(!ok) return false;
    }
    const list = JSON.parse(JSON.stringify(timeTemplateList[idx].timeList || []));
    saveTimeData(list);
    if(typeof paintTimeList === 'function') paintTimeList(list);
    else renderTime();
    renderSchedule();
    checkAllConflict();
    saveSnapshot();
    if(typeof updateTimeTemplateModeHint === 'function') updateTimeTemplateModeHint(true);
    if(!silent){
        await showAppAlert(typeof t==='function'?t('msg.templateLoaded'):'模版加载完成，当前课表课时已更新');
    }
    return true;
}
function onTimeTemplateSelectChange(){
    const selectDom = document.getElementById('timeTemplateSelect');
    if(!selectDom) return;
    const idx = selectDom.value;
    if(idx === ''){
        if(typeof renderTime === 'function') renderTime();
        return;
    }
    const tpl = timeTemplateList[idx] || timeTemplateList[Number(idx)];
    if(!tpl){
        if(typeof showAppAlert === 'function'){
            showAppAlert(typeof t==='function'?t('msg.templateNotFound'):'未找到该模版');
        }
        return;
    }
    if(!currentTableId){
        if(typeof paintTimeList === 'function'){
            paintTimeList(JSON.parse(JSON.stringify(tpl.timeList || [])));
        }
        updateTimeTemplateModeHint(true);
        return;
    }
    if(typeof paintTimeList === 'function'){
        paintTimeList(JSON.parse(JSON.stringify(tpl.timeList || [])));
    }
    updateTimeTemplateModeHint(true);
}
async function renameTimeTemplate(){
    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom.value;
    if(idx === '') return showAppAlert('请先选择要重命名的模版');
    const newName = await showAppPrompt('请输入模版新名称', timeTemplateList[idx].name);
    if(newName && newName.trim() !== ''){
        timeTemplateList[idx].name = newName.trim();
        saveTimeTemplateListStorage();
        renderTimeTemplateSelect();
    }
}
async function delTimeTemplate(){
    const selectDom = document.getElementById('timeTemplateSelect');
    const idx = selectDom.value;
    if(idx === '') return showAppAlert(typeof t==='function'?t('msg.selectTemplate'):'请先在下拉列表选择一个已保存的模版');
    const tpl = timeTemplateList[idx];
    if(!tpl) return showAppAlert(typeof t==='function'?t('msg.templateNotFound'):'未找到该模版');
    const ok = await showAppConfirm(typeof t==='function'?t('msg.confirmDeleteTemplate',{name:tpl.name}):('确定删除模版「' + tpl.name + '」？删除后下次打开不会自动恢复。'));
    if(!ok) return;
    addHiddenTimeTemplateName(tpl.name);
    timeTemplateList.splice(idx, 1);
    saveTimeTemplateListStorage();
    if(typeof flushAppDataNow === 'function'){
        try{ await flushAppDataNow(); }catch(e){}
    }
    renderTimeTemplateSelect();
    if(selectDom) selectDom.value = '';
    if(typeof renderTime === 'function') renderTime();
    await showAppAlert(typeof t==='function'?t('msg.templateDeleted'):'模版已删除');
}

/** 新建空白/默认结构的课时模版（不依赖当前课表） */
async function createNewTimeTemplate(){
    const templateName = await showAppPrompt(typeof t==='function'?t('msg.enterTemplateName'):'请输入课时模版名称', '');
    if(!templateName || !templateName.trim()) return;
    const trimmed = templateName.trim();
    if(timeTemplateList.some(function(tpl){ return tpl.name === trimmed; })){
        return showAppAlert(typeof t==='function'?t('msg.templateExists'):'该模版名称已存在，请换一个名称，或先在下拉菜单选中该模版后点保存进行更新');
    }
    let timeList;
    if(currentTableId && getTimeData().length){
        const useCurrent = await showAppConfirm(typeof t==='function'?t('msg.newTplFromCurrent'):'是否用当前选中课表的课时作为新模版内容？\n点「取消」则使用系统默认 8 节结构。');
        timeList = useCurrent
            ? JSON.parse(JSON.stringify(getTimeData()))
            : JSON.parse(JSON.stringify(DEFAULT_TIME));
    }else{
        timeList = JSON.parse(JSON.stringify(DEFAULT_TIME));
    }
    timeTemplateList.push({ name: trimmed, timeList: timeList });
    saveTimeTemplateListStorage();
    renderTimeTemplateSelect();
    const selectDom = document.getElementById('timeTemplateSelect');
    const newIdx = timeTemplateList.findIndex(function(tpl){ return tpl.name === trimmed; });
    if(selectDom && newIdx >= 0) selectDom.value = String(newIdx);
    if(typeof onTimeTemplateSelectChange === 'function') onTimeTemplateSelectChange();
    await showAppAlert(typeof t==='function'?t('msg.newTplCreated',{name:trimmed}):('已新建模版「' + trimmed + '」。可在下方编辑后点「保存」；需要用到排课表时点「应用到课表」。'));
}
const CLASS_TEMPLATE_PREF_KEY = 'classTemplatePrefs';

function getClassTemplatePrefs(){
    try{
        const raw = JSON.parse(appGetItem(CLASS_TEMPLATE_PREF_KEY) || '{}');
        return raw && typeof raw === 'object' ? raw : {};
    }catch(e){
        return {};
    }
}

function saveClassTemplatePref(className, selectVal){
    const name = String(className || '').trim();
    if(!name) return;
    const prefs = getClassTemplatePrefs();
    prefs[name] = normalizeClassTemplatePrefValue(selectVal);
    appSetItem(CLASS_TEMPLATE_PREF_KEY, JSON.stringify(prefs));
}

function removeClassTemplatePref(className){
    const name = String(className || '').trim();
    if(!name) return;
    const prefs = getClassTemplatePrefs();
    if(Object.prototype.hasOwnProperty.call(prefs, name)){
        delete prefs[name];
        appSetItem(CLASS_TEMPLATE_PREF_KEY, JSON.stringify(prefs));
    }
}

function renameClassTemplatePref(oldName, newName){
    const oldKey = String(oldName || '').trim();
    const newKey = String(newName || '').trim();
    if(!oldKey || !newKey || oldKey === newKey) return;
    const prefs = getClassTemplatePrefs();
    if(Object.prototype.hasOwnProperty.call(prefs, oldKey)){
        prefs[newKey] = prefs[oldKey];
        delete prefs[oldKey];
        appSetItem(CLASS_TEMPLATE_PREF_KEY, JSON.stringify(prefs));
    }
}

/** 下拉 value（default / 索引）→ 持久化用模版名或 default */
function normalizeClassTemplatePrefValue(selectVal){
    const val = selectVal == null ? 'default' : String(selectVal);
    if(val === 'default' || val === '') return 'default';
    const tpl = timeTemplateList[val];
    return tpl && tpl.name ? tpl.name : val;
}

function resolveTemplatePrefToTimeList(prefVal){
    const val = prefVal == null ? 'default' : String(prefVal);
    if(val === 'default' || val === ''){
        return JSON.parse(JSON.stringify(DEFAULT_TIME));
    }
    let template = timeTemplateList[val];
    if(!template){
        template = (timeTemplateList || []).find(function(t){ return t && t.name === val; });
    }
    return template && template.timeList
        ? JSON.parse(JSON.stringify(template.timeList))
        : JSON.parse(JSON.stringify(DEFAULT_TIME));
}

function getTimeListForClassName(className){
    const prefs = getClassTemplatePrefs();
    const key = String(className || '').trim();
    if(key && prefs[key] != null){
        return resolveTemplatePrefToTimeList(prefs[key]);
    }
    const table = typeof findTableByClassName === 'function' ? findTableByClassName(key) : null;
    if(table && table.periodTemplateRef){
        return resolveTemplatePrefToTimeList(table.periodTemplateRef);
    }
    return JSON.parse(JSON.stringify(DEFAULT_TIME));
}

function getNewTableTimeList(selectId){
    const selectDom = document.getElementById(selectId || 'newClassTimeTemplate');
    const val = selectDom ? selectDom.value : 'default';
    return resolveTemplatePrefToTimeList(normalizeClassTemplatePrefValue(val));
}

// ===================== 基础数据：Excel / JSON 导入导出 =====================
function escapeExcelCellText(val){
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

var SIMPLE_LIST_EXCEL_STYLE = [
    '<style type="text/css">',
    'table.simple-export{border-collapse:collapse;table-layout:fixed;mso-table-lspace:0;mso-table-rspace:0;}',
    'table.simple-export th,table.simple-export td{',
    'border:1px solid #000;padding:6px 10px;font-size:11pt;font-family:微软雅黑,宋体,Arial,sans-serif;',
    'vertical-align:middle;text-align:center;white-space:nowrap;mso-number-format:"\\@";mso-wrap-style:none;',
    '}',
    'table.simple-export th{font-weight:bold;background:#f3f4f6;}',
    'table.simple-export td.simple-export-title-cell{font-size:14pt;font-weight:bold;text-align:center;background:#fff;border:1px solid #000;}',
    '</style>'
].join('');

function defaultSimpleExportColWidths(colCount){
    if(colCount === 6) return [44, 88, 96, 72, 120, 72];
    if(colCount === 5) return [44, 96, 96, 72, 128];
    if(colCount === 3) return [44, 200, 88];
    if(colCount === 2) return [44, 220];
    var w = 110;
    var out = [];
    for(var i = 0; i < colCount; i++) out.push(i === 0 ? 44 : w);
    return out;
}

function simpleExportCellTag(tag, text, widthPx){
    var w = widthPx ? ('width:' + widthPx + 'px;min-width:' + widthPx + 'px;') : '';
    return '<' + tag + ' style="' + w + 'white-space:nowrap;mso-number-format:\\@;mso-wrap-style:none;">'
        + escapeExcelCellText(text) + '</' + tag + '>';
}

function buildSimpleExcelHtml(title, headers, bodyRows, colWidths){
    headers = headers || [];
    bodyRows = bodyRows || [];
    var colCount = Math.max(headers.length, bodyRows[0] ? bodyRows[0].length : 0, 1);
    var widths = colWidths || defaultSimpleExportColWidths(colCount);
    while(widths.length < colCount) widths.push(110);
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
        + '<head><meta charset="utf-8">' + SIMPLE_LIST_EXCEL_STYLE + '</head>'
        + '<body style="font-family:微软雅黑,宋体,Arial,sans-serif;margin:8px;">';
    html += '<table class="simple-export" border="1" cellspacing="0" cellpadding="0">';
    html += '<colgroup>' + widths.map(function(w){ return '<col style="width:' + w + 'px" width="' + w + '">'; }).join('') + '</colgroup>';
    if(title){
        html += '<tr><td class="simple-export-title-cell" colspan="' + colCount + '" align="center" style="font-size:14pt;font-weight:bold;text-align:center;padding:10px 8px;white-space:nowrap;">'
            + escapeExcelCellText(title) + '</td></tr>';
    }
    if(headers.length){
        html += '<tr>' + headers.map(function(h, i){ return simpleExportCellTag('th', h, widths[i]); }).join('') + '</tr>';
    }
    bodyRows.forEach(function(row){
        html += '<tr>' + row.map(function(c, i){ return simpleExportCellTag('td', c, widths[i]); }).join('') + '</tr>';
    });
    html += '</table></body></html>';
    return html;
}

async function saveModuleExcelHtml(filename, html){
    return saveFileWithPicker(html, filename, {
        extensions: ['xls'],
        mimeType: 'application/vnd.ms-excel',
        utf8Bom: true
    });
}

function readImportFileText(file, done){
    const reader = new FileReader();
    reader.onload = function(e){ done(null, e.target.result); };
    reader.onerror = function(){ done(new Error('read')); };
    reader.readAsText(file, 'UTF-8');
}

function parseHtmlTableRows(text){
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const table = doc.querySelector('table');
    if(!table) return null;
    const rows = [];
    table.querySelectorAll('tr').forEach(function(tr){
        const cells = Array.from(tr.querySelectorAll('th,td')).map(function(td){
            return (td.textContent || '').trim();
        });
        if(cells.some(function(c){ return c; })) rows.push(cells);
    });
    return rows.length ? rows : null;
}

function isJsonArrayText(text){
    const s = String(text || '').trim();
    return s.startsWith('[');
}

function headerRowLooksLikeLabels(cells, keywords){
    if(!cells || !cells.length) return false;
    const joined = cells.join(' ').toLowerCase();
    return keywords.some(function(k){ return joined.indexOf(String(k).toLowerCase()) !== -1; });
}

function parseStringListImport(text, fileName, labelKeywords){
    if(isJsonArrayText(text)){
        const arr = JSON.parse(text);
        if(!Array.isArray(arr)) throw new Error('json');
        return arr.map(function(x){
            if(typeof x === 'string') return x.trim();
            if(x && typeof x.name === 'string') return x.name.trim();
            return '';
        }).filter(Boolean);
    }
    const rows = parseHtmlTableRows(text);
    if(!rows) throw new Error('table');
    let start = 0;
    if(headerRowLooksLikeLabels(rows[0], labelKeywords.concat(['序号', 'index', '#']))) start = 1;
    const out = [];
    for(let i = start; i < rows.length; i++){
        const r = rows[i];
        if(!r || !r.length) continue;
        let val = '';
        if(r.length >= 2 && /^\d+$/.test(String(r[0]).trim())) val = r[1];
        else val = r[r.length - 1] || r[0];
        val = String(val || '').trim();
        if(val) out.push(val);
    }
    return out;
}

function parseCourseListImport(text){
    if(isJsonArrayText(text)){
        const arr = JSON.parse(text);
        if(!Array.isArray(arr)) throw new Error('json');
        return arr.map(function(c){
            return {
                name: String(c.name || '').trim(),
                teacher: String(c.teacher || '').trim(),
                room: String(c.room || '').trim(),
                cls: String(c.cls || c.class || '').trim()
            };
        }).filter(function(c){ return c.name && c.teacher && c.room && c.cls; });
    }
    const rows = parseHtmlTableRows(text);
    if(!rows) throw new Error('table');
    let start = 0;
    if(headerRowLooksLikeLabels(rows[0], ['课程', 'course', '教师', 'teacher', '教室', 'room', '班级', 'class', '年级', 'grade'])) start = 1;
    const out = [];
    for(let i = start; i < rows.length; i++){
        const r = rows[i];
        if(!r || r.length < 4) continue;
        let name, teacher, room, cls;
        if(r.length >= 5 && /^\d+$/.test(String(r[0]).trim())){
            name = r[1]; teacher = r[2]; room = r[3]; cls = r[4];
            /* 第 6 列「年级」由班级档案决定，导入时忽略 */
        }else{
            name = r[0]; teacher = r[1]; room = r[2]; cls = r[3];
        }
        name = String(name || '').trim();
        teacher = String(teacher || '').trim();
        room = String(room || '').trim();
        cls = String(cls || '').trim();
        if(name && teacher && room && cls) out.push({ name: name, teacher: teacher, room: room, cls: cls });
    }
    return out;
}

function importFailMsg(){
    return (typeof t === 'function' ? t('common.importFail') : '❌ 无法识别文件格式，请使用 JSON 或本系统导出的 Excel');
}

// 班级模块备份
async function exportClassBackupJson(){
    const data = appGetItem('classList') || '[]';
    const saved = await saveFileWithPicker(data, '班级学员组备份_' + Date.now() + '.json', {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert('✅ 班级 JSON 导出完成');
}
async function exportClassBackupExcel(){
    const arr = getClassData();
    const col = (typeof t === 'function' ? t('class.colName') : '班级名称');
    const gradeCol = (typeof t === 'function' ? t('class.colGrade') : '年级');
    const html = buildSimpleExcelHtml('班级列表', ['序号', col, gradeCol], arr.map(function(c, i){
        return [String(i + 1), c.name, c.grade || ''];
    }), [44, 200, 88]);
    const saved = await saveModuleExcelHtml('班级学员组_' + Date.now() + '.xls', html);
    if(saved) alert('✅ 班级 Excel 导出完成');
}
async function exportClassBackup(){ return exportClassBackupExcel(); }

function importClassBackup(){
    const file = document.getElementById('classBackupFile').files[0];
    if(!file) return alert('请选择备份文件');
    readImportFileText(file, function(err, text){
        if(err) return alert('❌ 读取文件失败');
        try{
            const arr = parseStringListImport(text, file.name, ['班级', 'class', '学员']);
            if(!arr.length) return alert('❌ 未解析到有效班级名称');
            saveClassData(arr);
            renderClass();
            renderCourseSelects();
            if(typeof syncClassesAndTables === 'function') syncClassesAndTables();
            renderTableTags();
            renderTime();
            renderSchedule();
            alert('✅ 班级数据导入成功，已同步生成对应课表');
        }catch(e){
            alert(importFailMsg());
        }
    });
}

// 教师模块备份
async function exportTeacherBackupJson(){
    const data = appGetItem('teacherList') || '[]';
    const saved = await saveFileWithPicker(data, '教师数据备份_' + Date.now() + '.json', {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert('✅ 教师 JSON 导出完成');
}
async function exportTeacherBackupExcel(){
    const arr = getTeacherData();
    const col = (typeof t === 'function' ? t('teacher.colName') : '教师姓名');
    const html = buildSimpleExcelHtml('教师列表', ['序号', col], arr.map(function(name, i){ return [String(i + 1), name]; }));
    const saved = await saveModuleExcelHtml('教师数据_' + Date.now() + '.xls', html);
    if(saved) alert('✅ 教师 Excel 导出完成');
}
async function exportTeacherBackup(){ return exportTeacherBackupExcel(); }

function importTeacherBackup(){
    const file = document.getElementById('teacherBackupFile').files[0];
    if(!file) return alert('请选择备份文件');
    readImportFileText(file, function(err, text){
        if(err) return alert('❌ 读取文件失败');
        try{
            const arr = parseStringListImport(text, file.name, ['教师', 'teacher']);
            if(!arr.length) return alert('❌ 未解析到有效教师姓名');
            saveTeacherData(arr);
            renderTeacher();
            renderCourseSelects();
            alert('✅ 教师数据导入成功');
        }catch(e){
            alert(importFailMsg());
        }
    });
}

// 教室模块备份
async function exportRoomBackupJson(){
    const data = appGetItem('roomList') || '[]';
    const saved = await saveFileWithPicker(data, '教室场地备份_' + Date.now() + '.json', {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert('✅ 教室 JSON 导出完成');
}
async function exportRoomBackupExcel(){
    const arr = getRoomData();
    const col = (typeof t === 'function' ? t('room.colName') : '教室名称');
    const html = buildSimpleExcelHtml('教室列表', ['序号', col], arr.map(function(name, i){ return [String(i + 1), name]; }));
    const saved = await saveModuleExcelHtml('教室场地_' + Date.now() + '.xls', html);
    if(saved) alert('✅ 教室 Excel 导出完成');
}
async function exportRoomBackup(){ return exportRoomBackupExcel(); }

function importRoomBackup(){
    const file = document.getElementById('roomBackupFile').files[0];
    if(!file) return alert('请选择备份文件');
    readImportFileText(file, function(err, text){
        if(err) return alert('❌ 读取文件失败');
        try{
            const arr = parseStringListImport(text, file.name, ['教室', 'room', '场地']);
            if(!arr.length) return alert('❌ 未解析到有效教室名称');
            saveRoomData(arr);
            renderRoom();
            renderCourseSelects();
            alert('✅ 教室数据导入成功');
        }catch(e){
            alert(importFailMsg());
        }
    });
}

// 课程模块备份
async function exportCourseBackupJson(){
    const data = appGetItem('courseList') || '[]';
    const saved = await saveFileWithPicker(data, '课程数据备份_' + Date.now() + '.json', {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved) alert('✅ 课程 JSON 导出完成');
}
async function exportCourseBackupExcel(){
    const arr = getCourseData();
    const h1 = (typeof t === 'function' ? t('course.name') : '课程名称').replace(/：$/, '');
    const h2 = (typeof t === 'function' ? t('nav.teacher') : '教师');
    const h3 = (typeof t === 'function' ? t('nav.room') : '教室');
    const h4 = (typeof t === 'function' ? t('nav.class') : '班级');
    const hGrade = (typeof t === 'function' ? t('class.colGrade') : '年级');
    const bodyRows = arr.map(function(c, i){
        return [String(i + 1), c.name, c.teacher, c.room, c.cls, getClassGradeByName(c.cls)];
    });
    const html = buildSimpleExcelHtml('课程列表', ['序号', h1, h2, h3, h4, hGrade], bodyRows, [44, 88, 96, 72, 120, 72]);
    const saved = await saveModuleExcelHtml('课程数据_' + Date.now() + '.xls', html);
    if(saved) alert('✅ 课程 Excel 导出完成');
}
async function exportCourseBackup(){ return exportCourseBackupExcel(); }

function importCourseBackup(){
    const file = document.getElementById('courseBackupFile').files[0];
    if(!file) return alert('请选择备份文件');
    readImportFileText(file, function(err, text){
        if(err) return alert('❌ 读取文件失败');
        try{
            const arr = parseCourseListImport(text);
            if(!arr.length) return alert('❌ 未解析到有效课程行（需含课程、教师、教室、班级）');
            saveCourseData(arr);
            if(typeof invalidateCourseInfoCache === 'function') invalidateCourseInfoCache();
            renderCourse();
            renderCourseSelects();
            alert('✅ 课程数据导入成功');
        }catch(e){
            alert(importFailMsg());
        }
    });
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
 * 跨相邻两行、同一节课各存一份（起止时间覆盖两行模板时段）→ 不算教师/教室冲突
 */
function isSameMultiRowLessonDuplicate(existing, tableId, timeArr, courseKey, className, startTime, endTime, cellKey){
    if(!existing || existing.tableId !== tableId) return false;
    if(existing.courseKey !== courseKey) return false;
    if((existing.className || '') !== (className || '')) return false;
    if(existing.start !== startTime || existing.end !== endTime) return false;
    if(!existing.cellKey || existing.cellKey === cellKey) return false;

    const existParts = String(existing.cellKey).split('-').map(Number);
    const curParts = String(cellKey).split('-').map(Number);
    if(existParts.length < 2 || curParts.length < 2) return false;
    if(existParts[1] !== curParts[1]) return false;
    if(Math.abs(existParts[0] - curParts[0]) !== 1) return false;

    const lo = Math.min(existParts[0], curParts[0]);
    const hi = Math.max(existParts[0], curParts[0]);
    const ta = parsePeriodTimeRange(timeArr[lo]?.name);
    const tb = parsePeriodTimeRange(timeArr[hi]?.name);
    if(!ta || !tb) return false;
    const rs = timeToMin(ta.start);
    const re = timeToMin(tb.end);
    const s = timeToMin(startTime);
    const e = timeToMin(endTime);
    return s <= rs && e >= re;
}

/**
 * 教室冲突：同课表、不同行、不同课程且模板行不重叠时，用各行模板时段比较
 * （避免格内残留 17:00-19:00 与下一节按行排的课误报；教师冲突仍按格内真实时间）
 */
function roomScheduleTimesOverlap(timeArr, sameTable, rowA, startA, endA, courseA, rowB, startB, endB, courseB){
    if(!sameTable) return isTimeOverlap(startA, endA, startB, endB);
    const tA = parsePeriodTimeRange(timeArr[rowA]?.name);
    const tB = parsePeriodTimeRange(timeArr[rowB]?.name);
    let aStart = startA, aEnd = endA, bStart = startB, bEnd = endB;
    if(courseA !== courseB && rowA !== rowB && tA && tB
        && !isTimeOverlap(tA.start, tA.end, tB.start, tB.end)){
        aStart = tA.start;
        aEnd = tA.end;
        bStart = tB.start;
        bEnd = tB.end;
    }
    return isTimeOverlap(aStart, aEnd, bStart, bEnd);
}

/**
 * 全局冲突检测【兼容旧4段格式 + 新6段带时间格式】
 * 旧数据：从当前课表课时解析时间
 * 新数据：读取自带时间，支持跨不同结构课表冲突
 */
function resolveStudentConflictKey(bindClassName, courseInfo){
    const fromTable = (bindClassName || '').trim();
    if(fromTable) return fromTable;
    return (courseInfo?.cls || '').trim();
}

function checkAllConflict() {
    const teacherTimeMap = {};
    const roomTimeMap = {};
    const studentTimeMap = {};
    window.globalConflictList = [];
    const conflictCellSet = new Set();
    const courseMap = typeof getCourseInfoMap === 'function' ? getCourseInfoMap() : null;
    const weekLabels = (typeof i18nWeekLabels === 'function') ? i18nWeekLabels() : ['周一','周二','周三','周四','周五','周六','周日'];
    const conflictTypeTeacher = (typeof t==='function'?t('conflict.typeTeacher'):'教师时间冲突');
    const conflictTypeRoom = (typeof t==='function'?t('conflict.typeRoom'):'教室场地冲突');
    const conflictTypeStudent = (typeof t==='function'?t('conflict.typeStudent'):'学员/班级时间冲突');

    tableList.forEach(tableItem => {
        const bindClassName = tableItem.bindClass;
        const timeArr = tableItem.timeList;
        const tableData = tableItem.data || {};

        Object.keys(tableData).forEach(cellKey => {
            const [rowIdx, weekIdx] = cellKey.split('-').map(Number);
            const cellSaveStr = tableData[cellKey];
            if (!cellSaveStr) return;

            let courseKey, startTime, endTime;
            const saveParts = cellSaveStr.split('|');

            if (saveParts.length === 4) {
                courseKey = cellSaveStr;
                const times = typeof parsePeriodTimeRange === 'function'
                    ? parsePeriodTimeRange(timeArr[rowIdx]?.name)
                    : null;
                if (!times) return;
                startTime = times.start;
                endTime = times.end;
            } else if (saveParts.length >= 6) {
                courseKey = saveParts.slice(0,4).join('|');
                startTime = saveParts[4];
                endTime = saveParts[5];
                if (!startTime || !endTime) return;
            } else {
                return;
            }

            const courseInfo = courseMap
                ? (courseMap.get(courseKey) || null)
                : getCourseInfo(courseKey);
            if (!courseInfo) return;

            const weekName = weekLabels[weekIdx];
            const teacherName = courseInfo.teacher;
            const roomName = courseInfo.room;
            const courseShowText = `${courseInfo.name}（${teacherName}，${roomName}）`;

            if (!teacherTimeMap[weekName]) teacherTimeMap[weekName] = [];
            if (!roomTimeMap[weekName]) roomTimeMap[weekName] = [];
            if (!studentTimeMap[weekName]) studentTimeMap[weekName] = [];

            const studentKey = resolveStudentConflictKey(bindClassName, courseInfo);

            let hasConflict = false;
            let conflictDetails = [];

            const tList = teacherTimeMap[weekName];
            for (let i = 0; i < tList.length; i++) {
                const item = tList[i];
                if (item.teacher === teacherName && isTimeOverlap(startTime, endTime, item.start, item.end)) {
                    if(isSameMultiRowLessonDuplicate(item, tableItem.id, timeArr, courseKey, bindClassName, startTime, endTime, cellKey)){
                        continue;
                    }
                    hasConflict = true;
                    conflictDetails.push({
                        type: conflictTypeTeacher,
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
            }

            const rList = roomTimeMap[weekName];
            for (let i = 0; i < rList.length; i++) {
                const item = rList[i];
                const existRow = parseInt(String(item.cellKey).split('-')[0], 10);
                const roomOverlap = roomScheduleTimesOverlap(
                    timeArr,
                    item.tableId === tableItem.id,
                    rowIdx, startTime, endTime, courseKey,
                    existRow, item.start, item.end, item.courseKey
                );
                if (item.room === roomName && roomOverlap) {
                    if(isSameMultiRowLessonDuplicate(item, tableItem.id, timeArr, courseKey, bindClassName, startTime, endTime, cellKey)){
                        continue;
                    }
                    hasConflict = true;
                    conflictDetails.push({
                        type: conflictTypeRoom,
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
            }

            if(studentKey){
                const stList = studentTimeMap[weekName];
                for(let i = 0; i < stList.length; i++){
                    const item = stList[i];
                    if(item.studentKey !== studentKey) continue;
                    if(!isTimeOverlap(startTime, endTime, item.start, item.end)) continue;
                    if(isSameMultiRowLessonDuplicate(item, tableItem.id, timeArr, courseKey, bindClassName, startTime, endTime, cellKey)){
                        continue;
                    }
                    hasConflict = true;
                    conflictDetails.push({
                        type: conflictTypeStudent,
                        week: weekName,
                        targetName: studentKey,
                        nowClass: bindClassName,
                        nowCourse: courseShowText,
                        existClass: item.className,
                        existCourse: item.courseText,
                        time: `${startTime}~${endTime}`,
                        cellKey: `${tableItem.id}|${cellKey}`
                    });
                }
            }

            if (hasConflict) {
                for (let i = 0; i < conflictDetails.length; i++) {
                    window.globalConflictList.push(conflictDetails[i]);
                }
                conflictCellSet.add(`${tableItem.id}|${cellKey}`);
            }

            tList.push({
                teacher: teacherName,
                className: bindClassName,
                courseText: courseShowText,
                courseKey: courseKey,
                tableId: tableItem.id,
                cellKey: cellKey,
                start: startTime,
                end: endTime
            });
            rList.push({
                room: roomName,
                className: bindClassName,
                courseText: courseShowText,
                courseKey: courseKey,
                tableId: tableItem.id,
                cellKey: cellKey,
                start: startTime,
                end: endTime
            });
            if(studentKey){
                studentTimeMap[weekName].push({
                    studentKey: studentKey,
                    className: bindClassName,
                    courseText: courseShowText,
                    courseKey: courseKey,
                    tableId: tableItem.id,
                    cellKey: cellKey,
                    start: startTime,
                    end: endTime
                });
            }
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
        conflictTipDom.className = 'conflict-tip conflict-tip-ok';
        conflictTipDom.innerText = (typeof t==='function'?t('conflict.none'):'✅ 全局检测完成：教师、教室、学员时段无冲突');
    } else {
        conflictTipDom.className = 'conflict-tip conflict-tip-bad';
        conflictTipDom.innerText = (typeof t==='function'
            ? t('conflict.found',{total:totalGlobal,current:currentCount})
            : `❌ 全局共${totalGlobal}处冲突，当前课表 ${currentCount} 处，冲突格已标红`);
    }
}

// 查看冲突详情函数
async function showConflictDetail() {
    if (!window.globalConflictList || window.globalConflictList.length === 0) {
        if(typeof showAppAlert === 'function'){
            await showAppAlert(typeof t==='function'?t('conflict.noConflict'):'暂无排课冲突');
        }else{
            alert(typeof t==='function'?t('conflict.noConflict'):'暂无排课冲突');
        }
        return;
    }
    let msg = (typeof t==='function'
        ? t('conflict.detailHeader',{n:window.globalConflictList.length})
        : `=====全局排课冲突详情（共${window.globalConflictList.length}处）=====\n`);
    window.globalConflictList.forEach((item, idx) => {
        const nowClass = (typeof displayLocaleText==='function'?displayLocaleText(item.nowClass):item.nowClass);
        const existClass = (typeof displayLocaleText==='function'?displayLocaleText(item.existClass):item.existClass);
        const nowCourse = (typeof displayConflictCourseText==='function'?displayConflictCourseText(item.nowCourse):item.nowCourse);
        const existCourse = (typeof displayConflictCourseText==='function'?displayConflictCourseText(item.existCourse):item.existCourse);
        if(typeof t==='function'){
            msg += t('conflict.detailLine',{
                idx: idx + 1,
                type: item.type,
                week: item.week,
                time: item.time,
                target: item.targetName,
                nowClass: nowClass,
                nowCourse: nowCourse,
                existClass: existClass,
                existCourse: existCourse
            }) + '\n';
        }else{
            msg += `【${idx+1}】${item.type}\n星期：${item.week}  时段：${item.time}\n冲突资源：${item.targetName}\n待排【${nowClass}】：${nowCourse}\n已占用【${existClass}】：${existCourse}\n\n`;
        }
    });
    if(typeof showAppAlert === 'function'){
        await showAppAlert(msg, typeof t==='function'?t('schedule.conflictDetail'):'查看冲突详情');
    }else{
        alert(msg);
    }
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
        const tables = JSON.parse(appGetItem('multiTableData') || '[]');
        if(Array.isArray(tables) && tables.length > 0) return true;
    }catch(e){}
    const keys = ['classList', 'teacherList', 'roomList', 'courseList', 'timeTemplateList'];
    return keys.some(k => {
        try{
            const arr = JSON.parse(appGetItem(k) || '[]');
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

async function confirmAppExit(){
    closeExitConfirm();
    if(typeof flushSaveTableList === 'function'){
        try{ flushSaveTableList(); }catch(e){}
    }
    if(typeof flushAppDataNow === 'function'){
        try{ await flushAppDataNow(); }catch(e){}
    }
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