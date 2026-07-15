// 用户登录与管理（本地 + 局域网权限）
const AUTH_USERS_KEY = 'schedule_auth_users';
const AUTH_SESSION_KEY = 'schedule_auth_session';

function normalizeUserRole(role){
    if(typeof normalizeRole === 'function') return normalizeRole(role);
    if(role === 'admin' || role === 'editor' || role === 'viewer') return role;
    return 'admin';
}

function getAuthUsers(){
    try{
        const list = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]');
        if(!Array.isArray(list)) return [];
        return list.map(function(u){
            return {
                username: u.username,
                password: u.password,
                role: normalizeUserRole(u.role)
            };
        });
    }catch(e){
        return [];
    }
}

function saveAuthUsers(users){
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function findAuthUser(username){
    const name = (username || '').trim();
    if(!name) return null;
    return getAuthUsers().find(function(u){ return u.username === name; }) || null;
}

function getCurrentUser(){
    if(typeof isLanMode === 'function' && isLanMode() && typeof getEffectiveUser === 'function'){
        return getEffectiveUser();
    }
    try{
        const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
        if(!session || !session.username) return null;
        return findAuthUser(session.username);
    }catch(e){
        return null;
    }
}

function setAuthSession(username){
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
        username: username,
        loginAt: Date.now()
    }));
}

function clearAuthSession(){
    localStorage.removeItem(AUTH_SESSION_KEY);
}

function updateAuthHeader(){
    const user = getCurrentUser();
    const label = document.getElementById('currentUserLabel');
    if(label){
        if(user){
            const roleTag = user.role === 'viewer' ? '只读' : (user.role === 'editor' ? '编辑' : '管理');
            label.textContent = user.username + '（' + roleTag + '）';
            label.style.display = 'inline-flex';
        }else{
            label.textContent = '';
            label.style.display = 'none';
        }
    }
    if(typeof applyLanUiPermissions === 'function') applyLanUiPermissions();
}

function showLoginMask(mode){
    const mask = document.getElementById('loginMask');
    const title = document.getElementById('loginTitle');
    const hint = document.getElementById('loginHint');
    const setupExtra = document.getElementById('loginSetupExtra');
    const btn = document.getElementById('loginSubmitBtn');
    if(!mask) return;
    mask.style.display = 'flex';
    const isSetup = mode === 'setup';
    if(title) title.textContent = isSetup ? '创建管理员账号' : '用户登录';
    if(hint){
        hint.textContent = isSetup
            ? '首次使用，请创建管理员账号。随后可在「用户管理」添加编辑/只读账号；局域网也使用这些权限。'
            : '请输入用户名和密码。局域网模式下请先在「局域网」连接主机后登录。';
    }
    if(setupExtra) setupExtra.style.display = isSetup ? 'block' : 'none';
    if(btn) btn.textContent = isSetup ? '创建并登录' : '登录';
    mask.dataset.mode = isSetup ? 'setup' : 'login';
}

function hideLoginMask(){
    const mask = document.getElementById('loginMask');
    if(mask) mask.style.display = 'none';
}

function submitLoginForm(){
    const mode = document.getElementById('loginMask')?.dataset.mode || 'login';
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const confirmInput = document.getElementById('loginPasswordConfirm');
    const username = (usernameInput?.value || '').trim();
    const password = passwordInput?.value || '';

    if(!username) return alert('请输入用户名');
    if(!password) return alert('请输入密码');

    // 已启用局域网连接时：走主机登录
    if(typeof isLanMode === 'function' && getLanConfig().enabled && getLanConfig().host){
        if(mode === 'setup'){
            return alert('局域网模式下请在主机初始化账号，或先断开局域网');
        }
        connectLanHost(getLanConfig().host, getLanConfig().port, username, password)
            .then(function(){
                hideLoginMask();
                updateAuthHeader();
                if(passwordInput) passwordInput.value = '';
            })
            .catch(function(err){
                alert('局域网登录失败：' + (err.message || err));
            });
        return;
    }

    if(mode === 'setup'){
        const confirm = confirmInput?.value || '';
        if(password !== confirm) return alert('两次输入的密码不一致');
        if(findAuthUser(username)) return alert('该用户名已存在');
        const users = getAuthUsers();
        users.push({ username: username, password: password, role: 'admin' });
        saveAuthUsers(users);
        setAuthSession(username);
        hideLoginMask();
        updateAuthHeader();
        if(usernameInput) usernameInput.value = '';
        if(passwordInput) passwordInput.value = '';
        if(confirmInput) confirmInput.value = '';
        return;
    }

    const user = findAuthUser(username);
    if(!user || user.password !== password){
        return alert('用户名或密码错误');
    }
    setAuthSession(username);
    hideLoginMask();
    updateAuthHeader();
    if(passwordInput) passwordInput.value = '';
}

function onLoginInputKeydown(e){
    if(e.key === 'Enter') submitLoginForm();
}

async function logoutUser(){
    if(!(await showAppConfirm('确定退出当前登录？'))) return;
    if(typeof isLanMode === 'function' && isLanMode()){
        clearLanSession();
        stopLanPolling();
        updateLanStatusUi();
    }
    clearAuthSession();
    updateAuthHeader();
    const hasLocal = getAuthUsers().length > 0;
    const lanCfg = typeof getLanConfig === 'function' ? getLanConfig() : null;
    if(lanCfg && lanCfg.enabled && lanCfg.host){
        showLoginMask('login');
    }else{
        showLoginMask(hasLocal ? 'login' : 'setup');
    }
}

function openUserManageModal(){
    if(!getCurrentUser()){
        return alert('请先登录');
    }
    renderUserManageList();
    const roleSelect = document.getElementById('newAuthRole');
    if(roleSelect){
        roleSelect.disabled = !(typeof canManageUsers === 'function' ? canManageUsers() : true);
    }
    const modal = document.getElementById('userManageModal');
    if(modal) modal.style.display = 'flex';
}

function closeUserManageModal(){
    const modal = document.getElementById('userManageModal');
    if(modal) modal.style.display = 'none';
}

function roleLabel(role){
    if(typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[role]) return ROLE_LABELS[role];
    if(role === 'editor') return '编辑';
    if(role === 'viewer') return '只读';
    return '管理员';
}

function renderUserManageList(){
    const listEl = document.getElementById('userManageList');
    const current = getCurrentUser();
    if(!listEl) return;

    // 局域网模式：从主机拉用户列表（仅管理员）
    if(typeof isLanMode === 'function' && isLanMode()){
        if(!(typeof canManageUsers === 'function' && canManageUsers())){
            listEl.innerHTML = '<p class="user-manage-empty">当前账号无权管理用户（需要管理员）</p>';
            return;
        }
        listEl.innerHTML = '<p class="user-manage-empty">加载中…</p>';
        lanFetch('/api/users').then(function(data){
            const users = data.users || [];
            listEl.innerHTML = users.map(function(u){
                const isSelf = current && current.username === u.username;
                const roleSel = `<select onchange="changeLanUserRole(${JSON.stringify(u.username)}, this.value)">
                    <option value="admin" ${u.role==='admin'?'selected':''}>管理员</option>
                    <option value="editor" ${u.role==='editor'?'selected':''}>编辑</option>
                    <option value="viewer" ${u.role==='viewer'?'selected':''}>只读</option>
                </select>`;
                const delBtn = isSelf
                    ? '<span class="user-manage-self">当前账号</span>'
                    : `<button type="button" class="sab-btn user-manage-del" onclick="deleteAuthUser(${JSON.stringify(u.username)})">删除</button>`;
                return `<div class="user-manage-row">
                    <span class="user-manage-name">${escapeHtmlText(u.username)}</span>
                    ${roleSel}
                    ${delBtn}
                </div>`;
            }).join('') || '<p class="user-manage-empty">暂无用户</p>';
        }).catch(function(err){
            listEl.innerHTML = '<p class="user-manage-empty">加载失败：' + escapeHtmlText(err.message || err) + '</p>';
        });
        return;
    }

    const users = getAuthUsers();
    if(!users.length){
        listEl.innerHTML = '<p class="user-manage-empty">暂无用户</p>';
        return;
    }
    const canManage = typeof canManageUsers === 'function' ? canManageUsers() : true;
    listEl.innerHTML = users.map(function(u){
        const isSelf = current && current.username === u.username;
        const roleSel = canManage
            ? `<select onchange="changeLocalUserRole(${JSON.stringify(u.username)}, this.value)">
                <option value="admin" ${u.role==='admin'?'selected':''}>管理员</option>
                <option value="editor" ${u.role==='editor'?'selected':''}>编辑</option>
                <option value="viewer" ${u.role==='viewer'?'selected':''}>只读</option>
            </select>`
            : `<span class="user-manage-self">${escapeHtmlText(roleLabel(u.role))}</span>`;
        const delBtn = isSelf
            ? '<span class="user-manage-self">当前账号</span>'
            : (canManage
                ? `<button type="button" class="sab-btn user-manage-del" onclick="deleteAuthUser(${JSON.stringify(u.username)})">删除</button>`
                : '');
        return `<div class="user-manage-row">
            <span class="user-manage-name">${escapeHtmlText(u.username)}</span>
            ${roleSel}
            ${delBtn}
        </div>`;
    }).join('');
}

function escapeHtmlText(str){
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function changeLocalUserRole(username, role){
    if(typeof canManageUsers === 'function' && !canManageUsers()) return alert('需要管理员权限');
    const users = getAuthUsers();
    const target = users.find(function(u){ return u.username === username; });
    if(!target) return;
    role = normalizeUserRole(role);
    if(target.role === 'admin' && role !== 'admin'){
        const adminCount = users.filter(function(u){ return u.role === 'admin'; }).length;
        if(adminCount <= 1) return alert('至少保留一名管理员');
    }
    const current = getCurrentUser();
    if(current && current.username === username && role !== 'admin'){
        return alert('不能取消自己的管理员权限');
    }
    target.role = role;
    saveAuthUsers(users);
    renderUserManageList();
    updateAuthHeader();
}

async function changeLanUserRole(username, role){
    try{
        await lanFetch('/api/users/role', {
            method: 'PUT',
            body: JSON.stringify({ username: username, role: role })
        });
        renderUserManageList();
    }catch(e){
        alert(e.message || e);
        renderUserManageList();
    }
}

async function addAuthUserFromForm(){
    const nameInput = document.getElementById('newAuthUsername');
    const pwdInput = document.getElementById('newAuthPassword');
    const roleInput = document.getElementById('newAuthRole');
    const username = (nameInput?.value || '').trim();
    const password = pwdInput?.value || '';
    const role = normalizeUserRole(roleInput?.value || 'viewer');
    if(!username) return alert('请输入用户名');
    if(!password) return alert('请输入密码');
    if(typeof canManageUsers === 'function' && !canManageUsers()){
        return alert('需要管理员权限才能添加用户');
    }

    if(typeof isLanMode === 'function' && isLanMode()){
        try{
            await lanFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({ username: username, password: password, role: role })
            });
            if(nameInput) nameInput.value = '';
            if(pwdInput) pwdInput.value = '';
            renderUserManageList();
            alert('用户「' + username + '」已添加到主机');
        }catch(e){
            alert(e.message || e);
        }
        return;
    }

    if(findAuthUser(username)) return alert('该用户名已存在');
    const users = getAuthUsers();
    users.push({ username: username, password: password, role: role });
    saveAuthUsers(users);
    if(nameInput) nameInput.value = '';
    if(pwdInput) pwdInput.value = '';
    renderUserManageList();
    alert('用户「' + username + '」已添加（' + roleLabel(role) + '）');
}

async function deleteAuthUser(username){
    const name = (username || '').trim();
    if(!name) return;
    if(typeof canManageUsers === 'function' && !canManageUsers()){
        return alert('需要管理员权限');
    }
    const current = getCurrentUser();
    if(current && current.username === name){
        return alert('不能删除当前登录的账号，请先换其他账号登录');
    }
    if(!(await showAppConfirm('确定删除用户「' + name + '」？'))) return;

    if(typeof isLanMode === 'function' && isLanMode()){
        try{
            await lanFetch('/api/users?username=' + encodeURIComponent(name), { method: 'DELETE' });
            renderUserManageList();
        }catch(e){
            alert(e.message || e);
        }
        return;
    }

    const users = getAuthUsers();
    if(users.length <= 1){
        return alert('至少保留一个用户，无法删除');
    }
    saveAuthUsers(users.filter(function(u){ return u.username !== name; }));
    renderUserManageList();
}

function changeOwnPassword(){
    const current = getCurrentUser();
    if(!current) return alert('请先登录');
    if(typeof isLanMode === 'function' && isLanMode()){
        return alert('局域网模式下修改密码请在主机用户数据中维护（后续可加改密接口）');
    }
    const oldPwd = document.getElementById('changeOldPassword')?.value || '';
    const newPwd = document.getElementById('changeNewPassword')?.value || '';
    const confirmPwd = document.getElementById('changeNewPasswordConfirm')?.value || '';
    if(!oldPwd || !newPwd) return alert('请填写完整');
    if(current.password !== oldPwd) return alert('原密码错误');
    if(newPwd !== confirmPwd) return alert('两次新密码不一致');
    const users = getAuthUsers().map(function(u){
        if(u.username === current.username){
            return { username: u.username, password: newPwd, role: u.role };
        }
        return u;
    });
    saveAuthUsers(users);
    document.getElementById('changeOldPassword').value = '';
    document.getElementById('changeNewPassword').value = '';
    document.getElementById('changeNewPasswordConfirm').value = '';
    alert('密码已修改');
}

function initAuthCheck(){
    if(typeof isLanMode === 'function' && isLanMode() && getEffectiveUser()){
        hideLoginMask();
        updateAuthHeader();
        return true;
    }
    const users = getAuthUsers();
    const current = getCurrentUser();
    if(current){
        hideLoginMask();
        updateAuthHeader();
        return true;
    }
    showLoginMask(users.length ? 'login' : 'setup');
    updateAuthHeader();
    return false;
}
