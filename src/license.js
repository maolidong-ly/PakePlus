// 一机一码授权（需 PakePlus 打包并注入 Rust 命令 get_machine_id / verify_license）
const LICENSE_STORAGE_KEY = 'schedule_license_key';
const LICENSE_MACHINE_KEY = 'schedule_license_machine';
const LICENSE_TRIAL_START_KEY = 'schedule_trial_start';
const TRIAL_DAYS = 100;
const MS_PER_DAY = 86400000;

function normalizeLicenseCode(code){
    return (code || '').trim().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
}

function formatLicenseDisplay(code){
    const raw = normalizeLicenseCode(code);
    if(raw.length !== 16) return (code || '').trim().toUpperCase();
    return raw.match(/.{1,4}/g).join('-');
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
    const id = await tauriInvoke('get_machine_id');
    return typeof id === 'string' && id.trim() ? id.trim().toUpperCase() : null;
}

async function verifyLicenseRemote(machineId, licenseKey){
    const result = await tauriInvoke('verify_license', {
        machineId: machineId,
        licenseKey: licenseKey
    });
    return result === true;
}

function getTrialRecord(){
    try{
        return JSON.parse(localStorage.getItem(LICENSE_TRIAL_START_KEY) || 'null');
    }catch(e){
        return null;
    }
}

function getTrialStartTime(machineId){
    const record = getTrialRecord();
    if(record && record.machineId === machineId && record.startedAt){
        return record.startedAt;
    }
    return null;
}

function startTrial(machineId){
    localStorage.setItem(LICENSE_TRIAL_START_KEY, JSON.stringify({
        machineId: machineId,
        startedAt: Date.now()
    }));
}

function getTrialDaysLeft(machineId){
    const startedAt = getTrialStartTime(machineId);
    if(!startedAt) return TRIAL_DAYS;
    const elapsedDays = Math.floor((Date.now() - startedAt) / MS_PER_DAY);
    return TRIAL_DAYS - elapsedDays;
}

function clearTrialRecord(){
    localStorage.removeItem(LICENSE_TRIAL_START_KEY);
}

function updateLicenseStatusBadge(status, daysLeft){
    const badge = document.getElementById('licenseTrialBadge');
    if(!badge) return;
    if(status === 'activated'){
        badge.style.display = 'none';
        badge.textContent = '';
        return;
    }
    if(status === 'trial' && daysLeft > 0){
        badge.style.display = 'inline-flex';
        badge.textContent = daysLeft + ' 天试用';
        badge.title = '试用期剩余 ' + daysLeft + ' 天，到期后需输入激活码。点击可打开激活窗口';
        badge.onclick = openLicenseModalForActivate;
        return;
    }
    badge.style.display = 'none';
    badge.textContent = '';
}

function showLicenseModal(mode){
    const mask = document.getElementById('licenseMask');
    const hint = document.getElementById('licenseHint');
    const inputWrap = document.getElementById('licenseInputWrap');
    const machineWrap = document.getElementById('licenseMachineWrap');
    if(!mask) return;
    mask.style.display = 'flex';
    if(machineWrap) machineWrap.style.display = mode === 'desktop-required' ? 'none' : '';
    if(inputWrap) inputWrap.style.display = mode === 'desktop-required' ? 'none' : '';
    if(hint){
        if(mode === 'desktop-required'){
            hint.textContent = '当前为浏览器预览模式，授权与试用期仅在 PakePlus 打包后的桌面版中生效。';
        }else if(mode === 'trial-expired'){
            hint.textContent = '100 天试用期已结束，请输入激活码继续使用。请将机器码发给管理员获取激活码。';
        }else{
            hint.textContent = '请将下方机器码发给管理员，获取激活码后输入。每台电脑仅可使用一个激活码。';
        }
    }
}

function hideLicenseModal(){
    const mask = document.getElementById('licenseMask');
    if(mask) mask.style.display = 'none';
}

async function openLicenseModalForActivate(){
    const machineId = await fetchMachineId();
    const machineEl = document.getElementById('licenseMachineId');
    if(!machineId){
        if(machineEl) machineEl.textContent = '—';
        showLicenseModal('desktop-required');
        return;
    }
    if(machineEl) machineEl.textContent = machineId;
    const daysLeft = getTrialDaysLeft(machineId);
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
        alert('无法读取机器码，请确认使用的是 PakePlus 打包后的桌面版，且已注入 Rust 授权命令。');
        return;
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
    localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
    localStorage.setItem(LICENSE_MACHINE_KEY, machineId);
    clearTrialRecord();
    hideLicenseModal();
    updateLicenseStatusBadge('activated');
    alert('激活成功，本机已永久授权。');
}

async function initLicenseCheck(){
    const machineEl = document.getElementById('licenseMachineId');
    const machineId = await fetchMachineId();

    if(!machineId){
        if(machineEl) machineEl.textContent = '—';
        showLicenseModal('desktop-required');
        return false;
    }

    if(machineEl) machineEl.textContent = machineId;

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

    let daysLeft = getTrialDaysLeft(machineId);
    if(!getTrialStartTime(machineId)){
        startTrial(machineId);
        daysLeft = TRIAL_DAYS;
    }

    if(daysLeft > 0){
        hideLicenseModal();
        updateLicenseStatusBadge('trial', daysLeft);
        return true;
    }

    showLicenseModal('trial-expired');
    updateLicenseStatusBadge('hidden');
    return false;
}
