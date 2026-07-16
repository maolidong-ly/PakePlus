// 一机一码授权（PakePlus 桌面版自动生效；Rust 命令可选，未注入时使用 JS 方案）
const LICENSE_STORAGE_KEY = 'schedule_license_key';
const LICENSE_MACHINE_KEY = 'schedule_license_machine';
const LICENSE_TRIAL_START_KEY = 'schedule_trial_start';
const LICENSE_TRIAL_PREFIX = 'schedule_trial_v2_';
const TRIAL_DAYS = 100;
const MS_PER_DAY = 86400000;
// 与 tools/generate_license.py 中 LICENSE_SECRET 保持一致
const LICENSE_SECRET = 'XidianSchedule-L1-x8k2m9p4q7w3n6r';

function normalizeLicenseCode(code){
    return (code || '').trim().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
}

function formatLicenseDisplay(code){
    const raw = normalizeLicenseCode(code);
    if(raw.length !== 16) return (code || '').trim().toUpperCase();
    return raw.match(/.{1,4}/g).join('-');
}

function formatHexCode(hex){
    const h = hex.slice(0, 16).toUpperCase();
    return h.match(/.{1,4}/g).join('-');
}

function isPackagedDesktop(){
    if(typeof window.__TAURI__ !== 'undefined') return true;
    const ua = navigator.userAgent || '';
    if(/\bTauri/i.test(ua)) return true;
    const host = location.hostname || '';
    if(host === 'tauri.localhost' || host === 'asset.localhost') return true;
    if(location.protocol === 'tauri:') return true;
    return false;
}

function buildStableDeviceRaw(){
    const ua = navigator.userAgent || '';
    const osTag = /Windows/i.test(ua) ? 'WIN' : /Mac/i.test(ua) ? 'MAC' : 'OTHER';
    return [
        osTag,
        navigator.platform || '',
        screen.width + 'x' + screen.height + 'x' + (screen.pixelDepth || screen.colorDepth || 0),
        String(navigator.hardwareConcurrency || 0),
        (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
        navigator.language || ''
    ].join('|');
}

async function sha256Hex(text){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function(b){
        return b.toString(16).padStart(2, '0');
    }).join('').toUpperCase();
}

async function hmacSha256Hex(key, message){
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
        'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
    return Array.from(new Uint8Array(sig)).map(function(b){
        return b.toString(16).padStart(2, '0');
    }).join('').toUpperCase();
}

async function getStableDeviceKey(){
    return normalizeLicenseCode(await sha256Hex(buildStableDeviceRaw()));
}

async function getJsMachineId(){
    return formatHexCode(await sha256Hex(buildStableDeviceRaw()));
}

async function computeLicenseLocal(machineId){
    const mid = normalizeLicenseCode(machineId);
    const hex = await hmacSha256Hex(LICENSE_SECRET, mid);
    return formatHexCode(hex);
}

async function tauriInvoke(cmd, args){
    const tauri = window.__TAURI__;
    if(!tauri?.core?.invoke) return undefined;
    try{
        return await tauri.core.invoke(cmd, args || {});
    }catch(err){
        console.warn('Tauri invoke failed:', cmd, err);
        return undefined;
    }
}

async function fetchMachineId(){
    const rustId = await tauriInvoke('get_machine_id');
    if(typeof rustId === 'string' && rustId.trim()){
        return rustId.trim().toUpperCase();
    }
    if(isPackagedDesktop()){
        return await getJsMachineId();
    }
    if(location.protocol === 'file:' || location.protocol === 'http:' || location.protocol === 'https:'){
        return await getJsMachineId();
    }
    return null;
}

async function verifyLicenseRemote(machineId, licenseKey){
    const rust = await tauriInvoke('verify_license', {
        machineId: machineId,
        licenseKey: licenseKey
    });
    if(rust === true || rust === false) return rust;
    const expected = await computeLicenseLocal(machineId);
    return normalizeLicenseCode(licenseKey) === normalizeLicenseCode(expected);
}

async function getAppLocalDataDir(){
    const tauri = window.__TAURI__;
    if(!tauri) return null;
    try{
        if(tauri.path?.appLocalDataDir) return await tauri.path.appLocalDataDir();
        if(tauri.path?.appDataDir) return await tauri.path.appDataDir();
    }catch(e){}
    const cmds = ['plugin:path|app_local_data_dir', 'plugin:path|app_data_dir'];
    for(let i = 0; i < cmds.length; i++){
        const dir = await tauriInvoke(cmds[i]);
        if(typeof dir === 'string' && dir.trim()) return dir.trim();
    }
    return null;
}

async function getTrialFilePath(deviceKey){
    const dir = await getAppLocalDataDir();
    if(!dir) return null;
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir + sep + 'trial_' + deviceKey.slice(0, 16) + '.json';
}

async function readTrialFromFile(deviceKey){
    const path = await getTrialFilePath(deviceKey);
    if(!path) return null;
    try{
        const tauri = window.__TAURI__;
        let text;
        if(tauri?.fs?.readTextFile) text = await tauri.fs.readTextFile(path);
        else text = await tauriInvoke('plugin:fs|read_text_file', { path: path });
        if(typeof text !== 'string') return null;
        const data = JSON.parse(text);
        const startedAt = parseInt(data?.startedAt, 10);
        return isNaN(startedAt) ? null : startedAt;
    }catch(e){
        return null;
    }
}

async function writeTrialToFile(deviceKey, startedAt){
    const path = await getTrialFilePath(deviceKey);
    if(!path) return false;
    const content = JSON.stringify({ deviceKey: deviceKey, startedAt: startedAt, version: 2 });
    try{
        const tauri = window.__TAURI__;
        if(tauri?.fs?.writeTextFile) await tauri.fs.writeTextFile(path, content);
        else await tauriInvoke('plugin:fs|write_text_file', { path: path, contents: content });
        return true;
    }catch(e){
        return false;
    }
}

async function loadTrialStartTime(deviceKey){
    let startedAt = await readTrialFromFile(deviceKey);
    if(startedAt) return startedAt;

    const lsVal = localStorage.getItem(LICENSE_TRIAL_PREFIX + deviceKey);
    if(lsVal){
        const n = parseInt(lsVal, 10);
        if(!isNaN(n)) return n;
    }

    try{
        const legacy = JSON.parse(localStorage.getItem(LICENSE_TRIAL_START_KEY) || 'null');
        if(legacy && legacy.startedAt){
            return parseInt(legacy.startedAt, 10) || null;
        }
    }catch(e){}

    return null;
}

async function saveTrialStartTime(deviceKey, startedAt){
    localStorage.setItem(LICENSE_TRIAL_PREFIX + deviceKey, String(startedAt));
    localStorage.setItem(LICENSE_TRIAL_START_KEY, JSON.stringify({ deviceKey: deviceKey, startedAt: startedAt }));
    await writeTrialToFile(deviceKey, startedAt);
}

async function ensureTrialStarted(deviceKey){
    let startedAt = await loadTrialStartTime(deviceKey);
    if(!startedAt){
        startedAt = Date.now();
    }
    await saveTrialStartTime(deviceKey, startedAt);
    return startedAt;
}

function getTrialDaysLeftFromStart(startedAt){
    if(!startedAt) return TRIAL_DAYS;
    const elapsedDays = Math.floor((Date.now() - startedAt) / MS_PER_DAY);
    return TRIAL_DAYS - elapsedDays;
}

async function clearTrialRecord(deviceKey){
    localStorage.removeItem(LICENSE_TRIAL_START_KEY);
    if(deviceKey) localStorage.removeItem(LICENSE_TRIAL_PREFIX + deviceKey);
}

function updateLicenseStatusBadge(status, daysLeft){
    const badge = document.getElementById('licenseTrialBadge');
    if(!badge) return;
    badge.dataset.licenseStatus = status || '';
    if(typeof daysLeft === 'number') badge.dataset.daysLeft = String(daysLeft);
    if(status === 'activated' || status === 'hidden' || !status){
        badge.style.display = 'none';
        badge.textContent = '';
        badge.removeAttribute('title');
        badge.onclick = null;
        return;
    }
    if(status === 'trial' && daysLeft > 0){
        badge.style.display = 'inline-flex';
        badge.textContent = (typeof t==='function'?t('msg.trialDays',{n:daysLeft}):(daysLeft + ' 天试用'));
        badge.title = (typeof t==='function'?t('msg.trialLeft',{n:daysLeft}):('试用期剩余 ' + daysLeft + ' 天，到期后需输入激活码。点击可提前激活'));
        badge.onclick = openLicenseModalForActivate;
        return;
    }
    badge.style.display = 'none';
    badge.textContent = '';
    badge.onclick = null;
}

/** 语言切换后按当前缓存状态重刷试用角标文案 */
function refreshLicenseStatusBadge(){
    const badge = document.getElementById('licenseTrialBadge');
    if(!badge) return;
    const status = badge.dataset.licenseStatus || '';
    const daysLeft = parseInt(badge.dataset.daysLeft || '0', 10);
    if(status === 'trial' && daysLeft > 0){
        updateLicenseStatusBadge('trial', daysLeft);
    }else if(status === 'activated'){
        updateLicenseStatusBadge('activated');
    }else if(status){
        updateLicenseStatusBadge(status, daysLeft);
    }
}

function showLicenseModal(mode){
    const mask = document.getElementById('licenseMask');
    const hint = document.getElementById('licenseHint');
    const inputWrap = document.getElementById('licenseInputWrap');
    const machineWrap = document.getElementById('licenseMachineWrap');
    if(!mask) return;
    mask.style.display = 'flex';
    if(machineWrap) machineWrap.style.display = '';
    if(inputWrap) inputWrap.style.display = '';
    if(hint){
        if(mode === 'trial-expired'){
            hint.textContent = (typeof t==='function'?t('msg.trialExpired'):'100 天试用期已结束，请输入激活码继续使用。请将机器码发给管理员获取激活码。');
        }else{
            hint.textContent = (typeof t==='function'?t('msg.trialFirst'):'首次使用自动享有 100 天试用。如需永久授权，请将机器码发给管理员获取激活码。');
        }
    }
}

function hideLicenseModal(){
    const mask = document.getElementById('licenseMask');
    if(mask) mask.style.display = 'none';
}

async function openLicenseModalForActivate(){
    const machineEl = document.getElementById('licenseMachineId');
    const machineId = await fetchMachineId();
    if(!machineId){
        if(machineEl) machineEl.textContent = '读取失败';
        return alert('无法生成本机机器码，请重新打开软件后再试。');
    }
    if(machineEl) machineEl.textContent = machineId;
    const deviceKey = await getStableDeviceKey();
    const startedAt = await loadTrialStartTime(deviceKey);
    const daysLeft = getTrialDaysLeftFromStart(startedAt);
    showLicenseModal(daysLeft <= 0 ? 'trial-expired' : 'activate');
}

function copyMachineId(){
    const el = document.getElementById('licenseMachineId');
    if(!el || !el.textContent || el.textContent === '读取中…') return;
    const text = el.textContent.trim();
    if(navigator.clipboard?.writeText){
        navigator.clipboard.writeText(text).then(function(){
            alert('机器码已复制到剪贴板');
        }).catch(function(){
            prompt('请手动复制机器码：', text);
        });
    }else{
        prompt('请手动复制机器码：', text);
    }
}

async function submitLicenseActivation(){
    const machineId = await fetchMachineId();
    if(!machineId){
        return alert('无法读取机器码，请重新打开软件后再试。');
    }
    const input = document.getElementById('licenseKeyInput');
    const licenseKey = formatLicenseDisplay(input?.value || '');
    if(!licenseKey){
        return alert('请输入激活码');
    }
    const ok = await verifyLicenseRemote(machineId, licenseKey);
    if(!ok){
        return alert('激活码无效，请核对后重试，或联系管理员重新发码。');
    }
    const deviceKey = await getStableDeviceKey();
    localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
    localStorage.setItem(LICENSE_MACHINE_KEY, machineId);
    await clearTrialRecord(deviceKey);
    hideLicenseModal();
    updateLicenseStatusBadge('activated');
    alert('激活成功，本机已永久授权。');
}

async function initLicenseCheck(){
    const machineEl = document.getElementById('licenseMachineId');
    const machineId = await fetchMachineId();

    if(!machineId){
        if(machineEl) machineEl.textContent = '读取失败';
        alert('授权模块初始化失败，请重新打开软件。');
        return false;
    }

    if(machineEl) machineEl.textContent = machineId;

    const deviceKey = await getStableDeviceKey();
    const savedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
    const savedMachine = localStorage.getItem(LICENSE_MACHINE_KEY);

    if(savedKey && savedMachine === machineId){
        const ok = await verifyLicenseRemote(machineId, savedKey);
        if(ok){
            hideLicenseModal();
            updateLicenseStatusBadge('activated');
            return true;
        }
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        localStorage.removeItem(LICENSE_MACHINE_KEY);
    }else if(savedMachine && savedMachine !== machineId){
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        localStorage.removeItem(LICENSE_MACHINE_KEY);
    }

    const startedAt = await ensureTrialStarted(deviceKey);
    const daysLeft = getTrialDaysLeftFromStart(startedAt);

    if(daysLeft > 0){
        hideLicenseModal();
        updateLicenseStatusBadge('trial', daysLeft);
        return true;
    }

    showLicenseModal('trial-expired');
    updateLicenseStatusBadge('hidden');
    return false;
}
