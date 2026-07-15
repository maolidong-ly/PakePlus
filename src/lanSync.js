// 局域网同步客户端：连接指定主机，按账号权限查看/编辑
const LAN_CFG_KEY = 'schedule_lan_cfg';
const LAN_TOKEN_KEY = 'schedule_lan_token';
const LAN_SESSION_KEY = 'schedule_lan_session';
const LAN_UPDATED_KEY = 'schedule_lan_updated_at';
const LAN_DEFAULT_PORT = 17890;

const ROLE_LABELS = {
    admin: '管理员（可编辑+管用户）',
    editor: '编辑（可编辑课表）',
    viewer: '只读（仅查看）'
};

let lanPollTimer = null;
let lanPushTimer = null;
let lanPushing = false;

function getLanConfig(){
    try{
        return JSON.parse(localStorage.getItem(LAN_CFG_KEY) || 'null') || { enabled: false, host: '', port: LAN_DEFAULT_PORT };
    }catch(e){
        return { enabled: false, host: '', port: LAN_DEFAULT_PORT };
    }
}

function saveLanConfig(cfg){
    localStorage.setItem(LAN_CFG_KEY, JSON.stringify(cfg));
}

function isLanMode(){
    const cfg = getLanConfig();
    return !!(cfg.enabled && cfg.host && localStorage.getItem(LAN_TOKEN_KEY));
}

function getLanBaseUrl(){
    const cfg = getLanConfig();
    const host = (cfg.host || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const port = Number(cfg.port) || LAN_DEFAULT_PORT;
    if(!host) return '';
    if(host.includes(':') && !host.startsWith('[')){
        // already host:port
        return 'http://' + host;
    }
    return 'http://' + host + ':' + port;
}

function getLanToken(){
    return localStorage.getItem(LAN_TOKEN_KEY) || '';
}

function getLanSessionUser(){
    try{
        return JSON.parse(localStorage.getItem(LAN_SESSION_KEY) || 'null');
    }catch(e){
        return null;
    }
}

function setLanSession(token, user){
    localStorage.setItem(LAN_TOKEN_KEY, token || '');
    localStorage.setItem(LAN_SESSION_KEY, JSON.stringify(user || null));
}

function clearLanSession(){
    localStorage.removeItem(LAN_TOKEN_KEY);
    localStorage.removeItem(LAN_SESSION_KEY);
}

function getLanUpdatedAt(){
    return parseInt(localStorage.getItem(LAN_UPDATED_KEY) || '0', 10) || 0;
}

function setLanUpdatedAt(ts){
    localStorage.setItem(LAN_UPDATED_KEY, String(ts || 0));
}

function normalizeRole(role){
    if(role === 'admin' || role === 'editor' || role === 'viewer') return role;
    return 'admin'; // 旧本地账号默认管理员
}

function getEffectiveUser(){
    if(isLanMode()){
        const u = getLanSessionUser();
        if(u && u.username){
            return { username: u.username, role: normalizeRole(u.role), password: '', lan: true };
        }
        return null;
    }
    const local = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if(!local) return null;
    return {
        username: local.username,
        role: normalizeRole(local.role),
        password: local.password,
        lan: false
    };
}

function canEditData(){
    const u = getEffectiveUser();
    if(!u) return false;
    return u.role === 'admin' || u.role === 'editor';
}

function canManageUsers(){
    const u = getEffectiveUser();
    return !!(u && u.role === 'admin');
}

async function lanFetch(path, options){
    options = options || {};
    const base = getLanBaseUrl();
    if(!base) throw new Error('未配置主机地址');
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = getLanToken();
    if(token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(base + path, Object.assign({}, options, { headers: headers }));
    let data = {};
    try{ data = await res.json(); }catch(e){}
    if(!res.ok){
        const err = new Error(data.error || ('请求失败 ' + res.status));
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

function collectLocalBundle(){
    const keys = ['multiTableData', 'classList', 'teacherList', 'roomList', 'courseList', 'timeTemplateList'];
    const bundle = {};
    keys.forEach(function(k){
        const val = (typeof appGetItem === 'function') ? appGetItem(k) : localStorage.getItem(k);
        if(val != null) bundle[k] = val;
    });
    return bundle;
}

function applyRemoteBundle(bundle){
    if(!bundle || typeof bundle !== 'object') return;
    Object.keys(bundle).forEach(function(k){
        if(typeof appSetItem === 'function') appSetItem(k, bundle[k]);
        else localStorage.setItem(k, bundle[k]);
    });
    if(typeof flushAppDataNow === 'function'){
        flushAppDataNow().catch(function(){});
    }
}

function reloadUiFromStorage(){
    try{
        if(typeof initLocalStorage === 'function') initLocalStorage();
        if(typeof syncClassesAndTables === 'function') syncClassesAndTables();
        if(typeof timeTemplateList !== 'undefined'){
            timeTemplateList = JSON.parse((typeof appGetItem === 'function' ? appGetItem('timeTemplateList') : localStorage.getItem('timeTemplateList')) || '[]');
        }
        if(typeof renderTimeTemplateSelect === 'function') renderTimeTemplateSelect();
        if(typeof renderTableTags === 'function') renderTableTags();
        if(typeof renderClass === 'function') renderClass();
        if(typeof renderTeacher === 'function') renderTeacher();
        if(typeof renderRoom === 'function') renderRoom();
        if(typeof renderCourse === 'function') renderCourse();
        if(typeof renderCourseSelects === 'function') renderCourseSelects();
        if(typeof renderTime === 'function') renderTime();
        if(typeof renderSchedule === 'function') renderSchedule();
        if(typeof checkAllConflict === 'function') checkAllConflict();
        if(typeof renderStorageStatus === 'function') renderStorageStatus();
        applyLanUiPermissions();
    }catch(e){
        console.warn('reloadUiFromStorage failed', e);
    }
}

async function lanProbe(host, port){
    const h = (host || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const p = Number(port) || LAN_DEFAULT_PORT;
    const base = h.includes(':') ? ('http://' + h) : ('http://' + h + ':' + p);
    const res = await fetch(base + '/api/health', { method: 'GET' });
    const data = await res.json();
    if(!data.ok) throw new Error('主机无响应');
    return data;
}

async function connectLanHost(host, port, username, password){
    const cfg = { enabled: true, host: (host || '').trim(), port: Number(port) || LAN_DEFAULT_PORT };
    saveLanConfig(cfg);
    const login = await lanFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: username, password: password })
    });
    setLanSession(login.token, login.user);
    await pullLanBundle(true);
    startLanPolling();
    updateLanStatusUi();
    applyLanUiPermissions();
    if(typeof updateAuthHeader === 'function') updateAuthHeader();
    return login;
}

async function bootstrapLanHost(host, port){
    const cfg = { enabled: true, host: (host || '127.0.0.1').trim(), port: Number(port) || LAN_DEFAULT_PORT };
    saveLanConfig(cfg);
    const localUsers = (typeof getAuthUsers === 'function' ? getAuthUsers() : []).map(function(u){
        return {
            username: u.username,
            password: u.password,
            role: normalizeRole(u.role)
        };
    });
    if(!localUsers.length){
        throw new Error('请先在本机创建至少一个登录账号，再初始化主机');
    }
    if(!localUsers.some(function(u){ return u.role === 'admin'; })){
        localUsers[0].role = 'admin';
    }
    const data = await lanFetch('/api/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
            users: localUsers,
            bundle: collectLocalBundle()
        })
    });
    setLanSession(data.token, data.user);
    setLanUpdatedAt(Date.now());
    startLanPolling();
    updateLanStatusUi();
    applyLanUiPermissions();
    if(typeof updateAuthHeader === 'function') updateAuthHeader();
    return data;
}

async function pullLanBundle(forceReload){
    const data = await lanFetch('/api/bundle');
    const remoteTs = data.updatedAt || 0;
    const localTs = getLanUpdatedAt();
    if(forceReload || remoteTs > localTs){
        applyRemoteBundle(data.bundle || {});
        setLanUpdatedAt(remoteTs);
        if(forceReload || document.visibilityState === 'visible'){
            reloadUiFromStorage();
        }
    }
    return data;
}

function queueLanPush(){
    if(!isLanMode() || !canEditData()) return;
    if(lanPushTimer) clearTimeout(lanPushTimer);
    lanPushTimer = setTimeout(function(){
        lanPushTimer = null;
        pushLanBundle().catch(function(err){
            console.warn('局域网同步失败:', err);
        });
    }, 500);
}

async function pushLanBundle(force){
    if(!isLanMode() || !canEditData() || lanPushing) return false;
    lanPushing = true;
    try{
        const data = await lanFetch('/api/bundle', {
            method: 'PUT',
            body: JSON.stringify({
                bundle: collectLocalBundle(),
                updatedAt: getLanUpdatedAt(),
                force: !!force
            })
        });
        setLanUpdatedAt(data.updatedAt || Date.now());
        updateLanStatusUi();
        return true;
    }catch(err){
        if(err.status === 409){
            await pullLanBundle(true);
            if(typeof showAppAlert === 'function'){
                await showAppAlert('主机数据已更新，已为你刷新；请再确认后重新保存。');
            }else{
                alert('主机数据已更新，已为你刷新；请再确认后重新保存。');
            }
            return false;
        }
        throw err;
    }finally{
        lanPushing = false;
    }
}

function startLanPolling(){
    stopLanPolling();
    if(!isLanMode()) return;
    lanPollTimer = setInterval(function(){
        if(!isLanMode()) return;
        pullLanBundle(false).catch(function(){});
    }, 4000);
}

function stopLanPolling(){
    if(lanPollTimer){
        clearInterval(lanPollTimer);
        lanPollTimer = null;
    }
}

function disconnectLan(){
    stopLanPolling();
    const cfg = getLanConfig();
    cfg.enabled = false;
    saveLanConfig(cfg);
    clearLanSession();
    updateLanStatusUi();
    applyLanUiPermissions();
    if(typeof updateAuthHeader === 'function') updateAuthHeader();
}

function applyLanUiPermissions(){
    const editable = canEditData();
    const badge = document.getElementById('lanRoleBadge');
    const u = getEffectiveUser();
    if(badge){
        if(isLanMode() && u){
            badge.style.display = 'inline-flex';
            badge.textContent = (editable ? '可编辑' : '只读') + ' · ' + (ROLE_LABELS[u.role] || u.role);
        }else{
            badge.style.display = 'none';
        }
    }
    document.body.classList.toggle('lan-readonly', isLanMode() && !editable);

    // 只读时禁用常见写操作按钮（保留导出/查看）
    const disableSelectors = [
        '#tab-time .btn-blue', '#tab-time .btn-green', '#tab-time .btn-orange', '#tab-time .btn-red',
        '#tab-class .btn-blue', '#tab-class .btn-orange', '#tab-class .btn-red',
        '#tab-teacher .btn-blue', '#tab-teacher .btn-orange',
        '#tab-room .btn-blue', '#tab-room .btn-orange',
        '#tab-course .btn-blue', '#tab-course .btn-orange',
        '.table-manager .btn-red'
    ];
    disableSelectors.forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(btn){
            if(!isLanMode()){
                btn.disabled = false;
                return;
            }
            // 查看模版允许
            const text = (btn.textContent || '').trim();
            if(text.indexOf('查看') !== -1 || text.indexOf('导出') !== -1){
                btn.disabled = false;
                return;
            }
            btn.disabled = !editable;
        });
    });
}

function updateLanStatusUi(){
    const el = document.getElementById('lanStatusText');
    const cfg = getLanConfig();
    if(!el) return;
    if(cfg.enabled && getLanToken()){
        el.textContent = '已连接主机 ' + getLanBaseUrl().replace(/^http:\/\//, '') + ' · 最近同步 ' + new Date(getLanUpdatedAt() || Date.now()).toLocaleTimeString();
    }else if(cfg.enabled){
        el.textContent = '已填写主机，但尚未登录局域网账号';
    }else{
        el.textContent = '未连接（本机独立使用）';
    }
}

function openLanModal(){
    const cfg = getLanConfig();
    const hostInput = document.getElementById('lanHostInput');
    const portInput = document.getElementById('lanPortInput');
    if(hostInput) hostInput.value = cfg.host || '';
    if(portInput) portInput.value = cfg.port || LAN_DEFAULT_PORT;
    updateLanStatusUi();
    const modal = document.getElementById('lanModal');
    if(modal) modal.style.display = 'flex';
}

function closeLanModal(){
    const modal = document.getElementById('lanModal');
    if(modal) modal.style.display = 'none';
}

async function onLanProbeClick(){
    const host = document.getElementById('lanHostInput')?.value || '';
    const port = document.getElementById('lanPortInput')?.value || LAN_DEFAULT_PORT;
    try{
        const data = await lanProbe(host, port);
        const ips = (data.ips || []).join(', ');
        await showAppAlert('主机在线。\n可连接地址：' + (ips || host) + '\n当前用户数：' + (data.userCount || 0));
    }catch(e){
        await showAppAlert('无法连接主机：' + (e.message || e) + '\n请确认已在主机电脑运行「启动主机」脚本，且防火墙放行端口 ' + port);
    }
}

async function onLanBootstrapClick(){
    const host = document.getElementById('lanHostInput')?.value || '127.0.0.1';
    const port = document.getElementById('lanPortInput')?.value || LAN_DEFAULT_PORT;
    try{
        await lanProbe(host, port);
        const data = await bootstrapLanHost(host, port);
        await showAppAlert('主机初始化成功。\n其他电脑请连接：' + ((data.ips || [])[0] || host) + ':' + port + '\n然后用有权限的账号登录即可编辑。');
        closeLanModal();
        if(typeof hideLoginMask === 'function') hideLoginMask();
    }catch(e){
        await showAppAlert('初始化失败：' + (e.message || e));
    }
}

async function onLanConnectClick(){
    const host = document.getElementById('lanHostInput')?.value || '';
    const port = document.getElementById('lanPortInput')?.value || LAN_DEFAULT_PORT;
    const username = document.getElementById('lanLoginUser')?.value || '';
    const password = document.getElementById('lanLoginPass')?.value || '';
    if(!host) return showAppAlert('请填写主机 IP');
    if(!username || !password) return showAppAlert('请填写局域网登录用户名和密码');
    try{
        await lanProbe(host, port);
        await connectLanHost(host, port, username, password);
        await showAppAlert('已连接局域网主机。权限跟随账号：有编辑权限即可在本机完整操作。');
        closeLanModal();
        if(typeof hideLoginMask === 'function') hideLoginMask();
        if(typeof updateAuthHeader === 'function') updateAuthHeader();
    }catch(e){
        await showAppAlert('连接失败：' + (e.message || e));
    }
}

async function onLanDisconnectClick(){
    if(!(await showAppConfirm('确定断开局域网主机？将回到本机本地数据。'))) return;
    disconnectLan();
    await showAppAlert('已断开局域网连接');
    closeLanModal();
}

function initLanSync(){
    updateLanStatusUi();
    if(isLanMode()){
        startLanPolling();
        pullLanBundle(true).catch(function(){});
    }
    applyLanUiPermissions();
}

// 包装保存：大容量写入后同步到主机
(function hookLanPushOnSave(){
    const _appSetItem = window.appSetItem;
    if(typeof _appSetItem !== 'function') return;
    // appSetItem 可能稍后才挂上；在 init 后再挂钩
})();

function hookLanDataWrites(){
    if(window.__lanWriteHooked) return;
    window.__lanWriteHooked = true;
    const orig = window.appSetItem;
    if(typeof orig !== 'function') return;
    window.appSetItem = function(key, value){
        const ret = orig(key, value);
        if(typeof isBulkStorageKey === 'function' && isBulkStorageKey(key)){
            queueLanPush();
        }
        return ret;
    };
}
