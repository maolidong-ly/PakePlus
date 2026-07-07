// 用户登录与管理（本地存储，防君子不防小人）
const AUTH_USERS_KEY = 'schedule_auth_users';
const AUTH_SESSION_KEY = 'schedule_auth_session';

function getAuthUsers(){
    try{
        const list = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]');
        return Array.isArray(list) ? list : [];
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
        label.textContent = user ? user.username : '';
        label.style.display = user ? 'inline-flex' : 'none';
    }
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
            ? '首次使用，请创建第一个登录账号（可随后在「用户管理」中添加更多用户）。'
            : '请输入用户名和密码登录系统。';
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

    if(mode === 'setup'){
        const confirm = confirmInput?.value || '';
        if(password !== confirm) return alert('两次输入的密码不一致');
        if(findAuthUser(username)) return alert('该用户名已存在');
        const users = getAuthUsers();
        users.push({ username: username, password: password });
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

function logoutUser(){
    if(!confirm('确定退出当前登录？')) return;
    clearAuthSession();
    updateAuthHeader();
    showLoginMask(getAuthUsers().length ? 'login' : 'setup');
}

function openUserManageModal(){
    if(!getCurrentUser()){
        return alert('请先登录');
    }
    renderUserManageList();
    const modal = document.getElementById('userManageModal');
    if(modal) modal.style.display = 'flex';
}

function closeUserManageModal(){
    const modal = document.getElementById('userManageModal');
    if(modal) modal.style.display = 'none';
}

function renderUserManageList(){
    const listEl = document.getElementById('userManageList');
    const current = getCurrentUser();
    if(!listEl) return;
    const users = getAuthUsers();
    if(!users.length){
        listEl.innerHTML = '<p class="user-manage-empty">暂无用户</p>';
        return;
    }
    listEl.innerHTML = users.map(function(u){
        const isSelf = current && current.username === u.username;
        const delBtn = isSelf
            ? '<span class="user-manage-self">当前账号</span>'
            : `<button type="button" class="sab-btn user-manage-del" onclick="deleteAuthUser(${JSON.stringify(u.username)})">删除</button>`;
        return `<div class="user-manage-row">
            <span class="user-manage-name">${escapeHtmlText(u.username)}</span>
            ${delBtn}
        </div>`;
    }).join('');
}

function escapeHtmlText(str){
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function addAuthUserFromForm(){
    const nameInput = document.getElementById('newAuthUsername');
    const pwdInput = document.getElementById('newAuthPassword');
    const username = (nameInput?.value || '').trim();
    const password = pwdInput?.value || '';
    if(!username) return alert('请输入用户名');
    if(!password) return alert('请输入密码');
    if(findAuthUser(username)) return alert('该用户名已存在');
    const users = getAuthUsers();
    users.push({ username: username, password: password });
    saveAuthUsers(users);
    if(nameInput) nameInput.value = '';
    if(pwdInput) pwdInput.value = '';
    renderUserManageList();
    alert('用户「' + username + '」已添加');
}

function deleteAuthUser(username){
    const name = (username || '').trim();
    if(!name) return;
    const users = getAuthUsers();
    if(users.length <= 1){
        return alert('至少保留一个用户，无法删除');
    }
    const current = getCurrentUser();
    if(current && current.username === name){
        return alert('不能删除当前登录的账号，请先换其他账号登录');
    }
    if(!confirm('确定删除用户「' + name + '」？')) return;
    saveAuthUsers(users.filter(function(u){ return u.username !== name; }));
    renderUserManageList();
}

function changeOwnPassword(){
    const current = getCurrentUser();
    if(!current) return alert('请先登录');
    const oldPwd = document.getElementById('changeOldPassword')?.value || '';
    const newPwd = document.getElementById('changeNewPassword')?.value || '';
    const confirmPwd = document.getElementById('changeNewPasswordConfirm')?.value || '';
    if(!oldPwd || !newPwd) return alert('请填写完整');
    if(current.password !== oldPwd) return alert('原密码错误');
    if(newPwd !== confirmPwd) return alert('两次新密码不一致');
    const users = getAuthUsers().map(function(u){
        if(u.username === current.username){
            return { username: u.username, password: newPwd };
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
