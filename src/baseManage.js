// ===================== 【新增开始：时间工具函数】 =====================
/**
 * 生成 06:00 ~ 23:30 间隔5分钟的时间选项数组（覆盖早自习等常用模版）
 */
function generateTimeOptions() {
    const timeList = [];
    let hour = 6;
    let minute = 0;
    while (!(hour === 23 && minute > 30)) {
        const h = String(hour).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        timeList.push(`${h}:${m}`);
        minute += 5;
        if (minute >= 60) {
            minute = 0;
            hour++;
        }
    }
    return timeList;
}
const TIME_OPTIONS = generateTimeOptions();

/** 手动改过起止时间后优先生效；清空两者后恢复「按课时自动识别」 */
let scheduleTimeManualOverride = false;

function onScheduleTimeSelectChange(){
    const startSel = document.getElementById('startTimeSelect');
    const endSel = document.getElementById('endTimeSelect');
    const s = startSel ? startSel.value : '';
    const e = endSel ? endSel.value : '';
    scheduleTimeManualOverride = !!(s || e);
    if(!s && !e) scheduleTimeManualOverride = false;
}

function ensureTimeSelectOption(selectEl, time){
    if(!selectEl || !time) return;
    const exists = Array.from(selectEl.options).some(function(o){ return o.value === time; });
    if(exists) return;
    const opt = document.createElement('option');
    opt.value = time;
    opt.textContent = time;
    let inserted = false;
    for(let i = 1; i < selectEl.options.length; i++){
        if(selectEl.options[i].value > time){
            selectEl.insertBefore(opt, selectEl.options[i]);
            inserted = true;
            break;
        }
    }
    if(!inserted) selectEl.appendChild(opt);
}

function applyPeriodTimeToSelects(periodName, force){
    const startSel = document.getElementById('startTimeSelect');
    const endSel = document.getElementById('endTimeSelect');
    if(!startSel || !endSel) return null;
    const parsed = typeof parsePeriodTimeRange === 'function' ? parsePeriodTimeRange(periodName) : null;
    if(!parsed) return null;
    if(!force && scheduleTimeManualOverride && startSel.value && endSel.value){
        return { start: startSel.value, end: endSel.value, fromPeriod: false };
    }
    ensureTimeSelectOption(startSel, parsed.start);
    ensureTimeSelectOption(endSel, parsed.end);
    startSel.value = parsed.start;
    endSel.value = parsed.end;
    return { start: parsed.start, end: parsed.end, fromPeriod: true };
}

/**
 * 初始化页面开始、结束时间下拉框
 */
function initTimeSelect() {
    const startSel = document.getElementById('startTimeSelect');
    const endSel = document.getElementById('endTimeSelect');
    if (!startSel || !endSel) return;
    const prevStart = startSel.value;
    const prevEnd = endSel.value;

    startSel.innerHTML = '<option value="">'+(typeof t==='function'?t('schedule.selectStart'):'请选择开始时间')+'</option>';
    endSel.innerHTML = '<option value="">'+(typeof t==='function'?t('schedule.selectEnd'):'请选择结束时间')+'</option>';

    TIME_OPTIONS.forEach(time => {
        startSel.innerHTML += `<option value="${time}">${time}</option>`;
        endSel.innerHTML += `<option value="${time}">${time}</option>`;
    });
    if(prevStart){
        ensureTimeSelectOption(startSel, prevStart);
        startSel.value = prevStart;
    }
    if(prevEnd){
        ensureTimeSelectOption(endSel, prevEnd);
        endSel.value = prevEnd;
    }
}

/**
 * 校验起止时间合法性
 * @param {string} start 开始时间 HH:mm
 * @param {string} end 结束时间 HH:mm
 * @returns {boolean}
 */
function validTimeRange(start, end) {
    if (!start || !end) {
        alert(typeof t==='function'?t('msg.needStartEnd'):'请选择开始时间和结束时间');
        return false;
    }
    const toMin = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };
    const sMin = toMin(start);
    const eMin = toMin(end);
    if (eMin <= sMin) {
        alert(typeof t==='function'?t('msg.endAfterStart'):'结束时间必须晚于开始时间');
        return false;
    }
    return true;
}
// ===================== 【新增结束：时间工具函数】 =====================

// 固定预置课程，顺序永久锁定不变
const FIX_COURSE_NAMES = [
    "语文",
    "数学",
    "英语",
    "日语",
    "物理",
    "化学",
    "生物",
    "政治",
    "历史",
    "地理",
    "职业综合"
];

// 记录上次选中的课程，实现连续排课不用重复选
let lastSelectCourseValue = "";
function saveLastSelectCourse(val) {
    lastSelectCourseValue = val;
}

// ========== 列表检索工具 ==========
function matchSearch(text, keyword){
    if(!keyword) return true;
    return String(text ?? '').toLowerCase().includes(keyword.toLowerCase());
}
function getListSearchKeyword(inputId){
    const el = document.getElementById(inputId);
    return el ? el.value.trim() : '';
}
function updateListSearchHint(hintId, visible, total, keyword){
    const hint = document.getElementById(hintId);
    if(!hint) return;
    if(!keyword){
        hint.textContent = total > 0
            ? (typeof t==='function'?t('msg.countTotal',{n:total}):`共 ${total} 条`)
            : '';
    }else{
        hint.textContent = visible > 0
            ? (typeof t==='function'?t('msg.countFound',{n:visible,m:total}):`找到 ${visible} / ${total} 条`)
            : (typeof t==='function'?t('msg.noMatch'):'无匹配结果');
    }
}
function courseItemMatchesSearch(item, keyword){
    return matchSearch(item.name, keyword)
        || matchSearch(item.teacher, keyword)
        || matchSearch(item.room, keyword)
        || matchSearch(item.cls, keyword);
}

// ========== 课时管理（仅操作当前选中课表的独立课时） ==========
function addTime(){
    let val = document.getElementById("timeName").value.trim();
    const isSplit = document.getElementById("isSplitRow").value === "1";
    if(!val) return alert("请填写课时名称");
    if(!currentTableId) return alert("请先选中一张课表，课时属于单张课表，不再全局共用");
    let arr = getTimeData();
    arr.push({name:val,isSplit:isSplit});
    saveTimeData(arr);
    document.getElementById("timeName").value = "";
    document.getElementById("isSplitRow").value = "0";
    renderTime();renderSchedule();checkAllConflict();
}
function delTime(idx){
    if(!currentTableId) return alert("请先选中一张课表");
    let arr=getTimeData();arr.splice(idx,1);saveTimeData(arr);renderTime();renderSchedule();checkAllConflict();
}
function editTime(idx,oldVal,oldIsSplit,td){
    if(!currentTableId) return alert("请先选中一张课表");
    let input=document.createElement("input");input.value=oldVal;input.style.width="100%";
    td.innerHTML="";td.appendChild(input);input.focus();
    function saveEdit(){
        let nv=input.value.trim()||oldVal;
        let arr=getTimeData();
        arr[idx].name = nv;
        saveTimeData(arr);
        td.innerText=nv;renderSchedule();checkAllConflict();
    }
    input.onblur=saveEdit;
    input.onkeydown=e=>{if(e.key==="Enter")saveEdit();};
}
function renderTime(){
    if(!currentTableId){
        document.getElementById("timeList").innerHTML = `<tr><td colspan="3" style="color:red;text-align:center;">请先选中一张课表，才能查看/编辑本班级专属课时</td></tr>`;
        return;
    }
    paintTimeList(getTimeData());
}

/** 将任意课时数组渲染到下方列表（模版切换时直接用） */
function paintTimeList(arr){
    const tbody = document.getElementById("timeList");
    if(!tbody) return;
    arr = Array.isArray(arr) ? arr : [];
    if(!arr.length){
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:14px;">${typeof t==='function'?t('msg.noPeriodsInTemplate'):'该模版暂无课时'}</td></tr>`;
        return;
    }
    let html = "";
    arr.forEach((item,idx)=>{
        const name = item.name || '';
        const nameDisplay = (typeof displayPeriodLabel==='function'?displayPeriodLabel(name):name);
        const splitTag = item.isSplit
            ? '<span style="color:#2563eb;margin-left:8px;">'+(typeof t==='function'?t('msg.splitRow'):'【分割行】')+'</span>'
            : '';
        const safeName = String(name).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        html+=`<tr>
            <td>${idx+1}</td>
            <td ondblclick="editTime(${idx},'${safeName}',${!!item.isSplit},this)">${nameDisplay}${splitTag}</td>
            <td>
                <button class="edit" onclick="editTime(${idx},'${safeName}',${!!item.isSplit},this.parentElement.previousElementSibling)">${typeof t==='function'?t('common.edit'):'修改'}</button>
                <button class="del" onclick="delTime(${idx})">${typeof t==='function'?t('common.delete'):'删除'}</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ========== 班级管理（班级名称 = 课表名称，新增班级自动创建课表） ==========
function findTableByClassName(className){
    const name = (className || '').trim();
    if(!name) return null;
    return tableList.find(function(t){
        return t.bindClass === name || t.name === name;
    }) || null;
}

function createTableForClass(className, timeList){
    const name = (className || '').trim();
    return {
        id: 'table_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: name,
        bindClass: name,
        data: {},
        timeList: timeList || JSON.parse(JSON.stringify(DEFAULT_TIME)),
        autoScheduleConfig: { constraints: [], settings: { onlyEmpty: true, checkGlobal: true, spreadWeek: true } }
    };
}

/** 删除指定班级下的全部课程（班级不存在时课程同步清理） */
function removeCoursesForClass(className){
    const name = (className || '').trim();
    if(!name) return 0;
    const courses = getCourseData();
    const next = courses.filter(function(c){ return (c.cls || '').trim() !== name; });
    const removed = courses.length - next.length;
    if(removed > 0) saveCourseData(next);
    return removed;
}

/** 清理班级列表中已不存在的课程 */
function pruneOrphanCourses(){
    const classSet = {};
    getClassData().forEach(function(cls){
        const name = (cls || '').trim();
        if(name) classSet[name] = true;
    });
    const courses = getCourseData();
    const next = courses.filter(function(c){
        const cls = (c.cls || '').trim();
        return !cls || classSet[cls];
    });
    const removed = courses.length - next.length;
    if(removed > 0) saveCourseData(next);
    return removed;
}

function syncClassesAndTables(){
    const classList = getClassData();
    let changed = false;

    tableList.forEach(function(table){
        const key = (table.bindClass || table.name || '').trim();
        if(!key) return;
        if(table.bindClass !== key || table.name !== key){
            table.bindClass = key;
            table.name = key;
            changed = true;
        }
    });

    classList.forEach(function(cls){
        const name = (cls || '').trim();
        if(!name) return;
        const table = findTableByClassName(name);
        if(!table){
            tableList.push(createTableForClass(name));
            changed = true;
        }else if(table.name !== name || table.bindClass !== name){
            table.name = name;
            table.bindClass = name;
            changed = true;
        }
    });

    if(changed) saveTableList();
    pruneOrphanCourses();
    if(tableList.length && !currentTableId){
        currentTableId = tableList[0].id;
    }else if(currentTableId && !tableList.find(function(t){ return t.id === currentTableId; })){
        currentTableId = tableList[0]?.id || '';
    }
}

function addClass(){
    const name = document.getElementById("className").value.trim();
    if(!name) return alert("请填写班级名称");
    const arr = getClassData();
    if(arr.includes(name)) return alert("该班级名称已存在");

    arr.push(name);
    saveClassData(arr);

    const timeList = getNewTableTimeList('newClassTimeTemplate');
    const existTable = findTableByClassName(name);
    if(existTable){
        existTable.name = name;
        existTable.bindClass = name;
        currentTableId = existTable.id;
    }else{
        const newTable = createTableForClass(name, timeList);
        tableList.push(newTable);
        currentTableId = newTable.id;
    }

    saveTableList();
    saveSnapshot();
    document.getElementById("className").value = "";
    renderClass();
    renderTableTags();
    renderTime();
    renderSchedule();
    renderCourseSelects();
    checkAllConflict();
    alert('✅ 班级「' + name + '」已创建，同名课表已自动生成');
}

async function delClass(idx){
    const arr = getClassData();
    const className = arr[idx];
    if(tableList.length <= 1 && findTableByClassName(className)){
        return alert("至少保留一个班级/课表");
    }
    if(!(await showAppConfirm('确定删除班级「' + className + '」？对应课表、排课数据及该班课程将一并删除。'))) return;

    arr.splice(idx, 1);
    saveClassData(arr);
    removeCoursesForClass(className);

    const table = findTableByClassName(className);
    if(table){
        const tIdx = tableList.findIndex(function(t){ return t.id === table.id; });
        if(tIdx !== -1){
            tableList.splice(tIdx, 1);
            if(currentTableId === table.id){
                currentTableId = tableList[0]?.id || '';
            }
            saveTableList();
            saveSnapshot();
            renderTableTags();
            renderTime();
            renderSchedule();
            checkAllConflict();
        }
    }

    renderClass();
    renderCourse();
    renderCourseNameSelect();
    renderCourseSelects();
}
function editClass(idx){
    const arr = getClassData();
    const oldName = arr[idx];
    document.getElementById("modalTitle").innerText = "修改班级名称";
    document.getElementById("modalBody").innerHTML = `
        <div style="margin:10px 0;">
            <label>原名称：</label><span>${oldName}</span>
        </div>
        <div style="margin:10px 0;">
            <label>新名称：</label>
            <input type="text" id="editClassName" value="${oldName}" style="width:260px;padding:6px;">
        </div>
    `;
    document.getElementById("modalFooter").innerHTML = `
        <button onclick="closeAutoModal()">取消</button>
        <button class="edit" onclick="saveEditClassName(${idx})">${typeof t==='function'?t('common.save'):'确认修改'}</button>
    `;
    document.getElementById("autoModal").style.display = "block";
}
function saveEditClassName(idx){
    const newName = document.getElementById("editClassName").value.trim();
    if(!newName){
        alert("名称不能为空");
        return;
    }
    const arr = getClassData();
    const oldName = arr[idx];
    if(arr.includes(newName) && newName !== oldName){
        return alert("该班级名称已存在");
    }

    arr[idx] = newName;
    saveClassData(arr);

    const table = findTableByClassName(oldName);
    if(table){
        table.name = newName;
        table.bindClass = newName;
        saveTableList();
        renderTableTags();
    }

    const courses = getCourseData();
    let courseChanged = false;
    courses.forEach(function(c){
        if(c.cls === oldName){
            c.cls = newName;
            courseChanged = true;
        }
    });
    if(courseChanged) saveCourseData(courses);

    renderClass();
    renderCourseSelects();
    renderCourse();
    closeAutoModal();
}
function renderClass(){
    const keyword = getListSearchKeyword('classSearchInput');
    let arr = getClassData();
    let html = "";
    let visibleCount = 0;
    arr.forEach((item, idx)=>{
        if(!matchSearch(item, keyword)) return;
        visibleCount++;
        html += `<tr><td>${visibleCount}</td><td>${escCourseHtml(item)}</td><td>
            <button class="edit" onclick="editClass(${idx})">${typeof t==='function'?t('common.edit'):'修改'}</button>
            <button class="del" onclick="delClass(${idx})">${typeof t==='function'?t('common.delete'):'删除'}</button>
        </td></tr>`;
    });
    if(!html){
        html = `<tr class="search-empty"><td colspan="3">${keyword ? '无匹配的班级' : '暂无班级数据'}</td></tr>`;
    }
    document.getElementById("classList").innerHTML = html;
    updateListSearchHint('classSearchHint', visibleCount, arr.length, keyword);
}

// ========== 教师管理【已修复：tbody ID改为teacherTableBody，解决全局变量冲突】 ==========
function addTeacher(){
    let name=document.getElementById("teacherName").value.trim();if(!name)return alert("请填写姓名");
    let arr=getTeacherData();arr.push(name);saveTeacherData(arr);
    document.getElementById("teacherName").value="";renderTeacher();renderCourseSelects();
}
function delTeacher(idx){let arr=getTeacherData();arr.splice(idx,1);saveTeacherData(arr);renderTeacher();renderCourseSelects();}
function editTeacher(idx){
    const arr = getTeacherData();
    const oldName = arr[idx];
    document.getElementById("modalTitle").innerText = "修改教师姓名";
    document.getElementById("modalBody").innerHTML = `
        <div style="margin:10px 0;">
            <label>原姓名：</label><span>${oldName}</span>
        </div>
        <div style="margin:10px 0;">
            <label>新姓名：</label>
            <input type="text" id="editTeacherName" value="${oldName}" style="width:260px;padding:6px;">
        </div>
    `;
    document.getElementById("modalFooter").innerHTML = `
        <button onclick="closeAutoModal()">取消</button>
        <button class="edit" onclick="saveEditTeacherName(${idx})">${typeof t==='function'?t('common.save'):'确认修改'}</button>
    `;
    document.getElementById("autoModal").style.display = "block";
}
function saveEditTeacherName(idx){
    const newName = document.getElementById("editTeacherName").value.trim();
    if(!newName){
        alert("姓名不能为空");
        return;
    }
    const arr = getTeacherData();
    arr[idx] = newName;
    saveTeacherData(arr);
    renderTeacher();
    renderCourseSelects();
    closeAutoModal();
}
function renderTeacher(){
    const keyword = getListSearchKeyword('teacherSearchInput');
    let arr = getTeacherData();
    let html = "";
    let visibleCount = 0;
    arr.forEach((item, idx)=>{
        if(!matchSearch(item, keyword)) return;
        visibleCount++;
        html += `<tr><td>${visibleCount}</td><td>${escCourseHtml(item)}</td><td>
            <button class="edit" onclick="editTeacher(${idx})">${typeof t==='function'?t('common.edit'):'修改'}</button>
            <button class="del" onclick="delTeacher(${idx})">${typeof t==='function'?t('common.delete'):'删除'}</button>
        </td></tr>`;
    });
    if(!html){
        html = `<tr class="search-empty"><td colspan="3">${keyword ? '无匹配的教师' : '暂无教师数据'}</td></tr>`;
    }
    document.getElementById("teacherTableBody").innerHTML = html;
    updateListSearchHint('teacherSearchHint', visibleCount, arr.length, keyword);
}

// ========== 教室管理【已修复：tbody ID改为roomTableBody，解决全局变量冲突】 ==========
function addRoom(){
    let name=document.getElementById("roomName").value.trim();if(!name)return alert("请填写场地名称");
    let arr=getRoomData();arr.push(name);saveRoomData(arr);
    document.getElementById("roomName").value="";renderRoom();renderCourseSelects();
}
function delRoom(idx){let arr=getRoomData();arr.splice(idx,1);saveRoomData(arr);renderRoom();renderCourseSelects();}
function editRoom(idx){
    const arr = getRoomData();
    const oldName = arr[idx];
    document.getElementById("modalTitle").innerText = "修改场地名称";
    document.getElementById("modalBody").innerHTML = `
        <div style="margin:10px 0;">
            <label>原名称：</label><span>${oldName}</span>
        </div>
        <div style="margin:10px 0;">
            <label>新名称：</label>
            <input type="text" id="editRoomName" value="${oldName}" style="width:260px;padding:6px;">
        </div>
    `;
    document.getElementById("modalFooter").innerHTML = `
        <button onclick="closeAutoModal()">取消</button>
        <button class="edit" onclick="saveEditRoomName(${idx})">${typeof t==='function'?t('common.save'):'确认修改'}</button>
    `;
    document.getElementById("autoModal").style.display = "block";
}
function saveEditRoomName(idx){
    const newName = document.getElementById("editRoomName").value.trim();
    if(!newName){
        alert("名称不能为空");
        return;
    }
    const arr = getRoomData();
    arr[idx] = newName;
    saveRoomData(arr);
    renderRoom();
    renderCourseSelects();
    closeAutoModal();
}
function renderRoom(){
    let arr=getRoomData();let html="";
    arr.forEach((item,idx)=>{
        html+=`<tr><td>${idx+1}</td><td>${item}</td><td>
            <button class="edit" onclick="editRoom(${idx})">${typeof t==='function'?t('common.edit'):'修改'}</button>
            <button class="del" onclick="delRoom(${idx})">${typeof t==='function'?t('common.delete'):'删除'}</button>
        </td></tr>`;
    });
    // 修复点：原来 document.getElementById('roomList') → 改为 roomTableBody
    document.getElementById("roomTableBody").innerHTML=html;
}

// ========== 课程管理【固定11门课程顺序永久不变，表格下拉只能选择】 ==========
function addCourse(){
    let name=document.getElementById("courseNameSelect").value;
    let t=document.getElementById("courseTeacher").value;
    let r=document.getElementById("courseRoom").value;
    let c=document.getElementById("courseClass").value;
    if(!name) return alert("请从下拉列表选择课程名称");
    if(!t||!r||!c)return alert("请完善全部选项");
    let arr=getCourseData();arr.push({name,teacher:t,room:r,cls:c});saveCourseData(arr);
    renderCourse();
    renderCourseSelects();
    renderCourseNameSelect();
}

function updateCourseField(idx, field, value){
    const arr = getCourseData();
    arr[idx][field] = value;
    saveCourseData(arr);
    renderCourse();
    renderCourseSelects();
    renderCourseNameSelect();
}

function delCourse(idx){let arr=getCourseData();arr.splice(idx,1);saveCourseData(arr);renderCourse();renderCourseSelects();renderCourseNameSelect();}

function getAllCourseNameArr(){
    const arr = getCourseData();
    const customNameSet = new Set();
    arr.forEach(item=>{
        if(!FIX_COURSE_NAMES.includes(item.name)){
            customNameSet.add(item.name);
        }
    });
    return [...FIX_COURSE_NAMES, ...Array.from(customNameSet).sort()];
}

function renderCourseNameSelect(){
    const allNameArr = getAllCourseNameArr();
    const placeholder = (typeof t==='function'?t('course.selectName'):'请选择课程名称');
    let optHtml = `<option value="">${placeholder}</option>`;
    allNameArr.forEach(name=>{
        const label = (typeof displayCourseName==='function'?displayCourseName(name):name);
        optHtml += `<option value="${escCourseHtml(name)}">${escCourseHtml(label)}</option>`;
    });
    const el = document.getElementById("courseNameSelect");
    if(el) el.innerHTML = optHtml;
}

function escCourseHtml(str){
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function groupCoursesByDimension(arr, dimension){
    const fieldMap = { cls:'cls', teacher:'teacher', room:'room' };
    const field = fieldMap[dimension] || 'cls';
    const groups = new Map();
    arr.forEach((item, idx)=>{
        const key = (item[field] || '').trim() || '未分类';
        if(!groups.has(key)) groups.set(key, []);
        groups.get(key).push(idx);
    });
    return Array.from(groups.entries()).sort((a, b)=>a[0].localeCompare(b[0], 'zh-CN'));
}

function buildCourseRowHtml(idx, item, allNameArr, teacherList, roomList, classList){
    let nameSelect = `<select onchange="updateCourseField(${idx},'name',this.value)" style="width:120px;padding:4px;">`;
    allNameArr.forEach(name=>{
        const selected = name === item.name ? "selected" : "";
        const label = (typeof displayCourseName==='function'?displayCourseName(name):name);
        nameSelect += `<option value="${escCourseHtml(name)}" ${selected}>${escCourseHtml(label)}</option>`;
    });
    nameSelect += `</select>`;

    let tOpt = teacherList.map(t=>`<option value="${escCourseHtml(t)}" ${t===item.teacher?'selected':''}>${escCourseHtml(t)}</option>`).join('');
    let tSelect = `<select onchange="updateCourseField(${idx},'teacher',this.value)" style="width:120px;padding:4px;">${tOpt}</select>`;
    let rOpt = roomList.map(r=>`<option value="${escCourseHtml(r)}" ${r===item.room?'selected':''}>${escCourseHtml(r)}</option>`).join('');
    let rSelect = `<select onchange="updateCourseField(${idx},'room',this.value)" style="width:120px;padding:4px;">${rOpt}</select>`;
    let cOpt = classList.map(c=>`<option value="${escCourseHtml(c)}" ${c===item.cls?'selected':''}>${escCourseHtml(c)}</option>`).join('');
    let cSelect = `<select onchange="updateCourseField(${idx},'cls',this.value)" style="width:140px;padding:4px;">${cOpt}</select>`;

    return `<tr>
        <td>${idx + 1}</td>
        <td>${nameSelect}</td>
        <td>${tSelect}</td>
        <td>${rSelect}</td>
        <td>${cSelect}</td>
        <td><button class="del" onclick="delCourse(${idx})">${typeof t==='function'?t('common.delete'):'删除'}</button></td>
    </tr>`;
}

function buildCourseGroupTableHtml(indices){
    const arr = getCourseData();
    const allNameArr = getAllCourseNameArr();
    const teacherList = getTeacherData();
    const roomList = getRoomData();
    const classList = getClassData();
    let rows = indices.map(idx=>buildCourseRowHtml(idx, arr[idx], allNameArr, teacherList, roomList, classList)).join('');
    return `<table>
        <thead>
        <tr>
            <th>序号</th>
            <th>课程名称</th>
            <th>教师</th>
            <th>教室</th>
            <th>班级</th>
            <th>操作</th>
        </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}

function loadCourseGroupBody(detailsEl){
    const body = detailsEl.querySelector('.course-group-body');
    if(!body || body.dataset.loaded === 'true') return;
    const indices = JSON.parse(detailsEl.dataset.indices || '[]');
    body.innerHTML = buildCourseGroupTableHtml(indices);
    body.dataset.loaded = 'true';
}

function onCourseGroupByChange(){
    renderCourse();
}

function expandAllCourseGroups(){
    document.querySelectorAll('#courseGroupContainer .course-group-item').forEach(details=>{
        details.open = true;
        loadCourseGroupBody(details);
    });
}

function collapseAllCourseGroups(){
    document.querySelectorAll('#courseGroupContainer .course-group-item').forEach(details=>{
        details.open = false;
    });
}

function renderCourse(){
    const container = document.getElementById('courseGroupContainer');
    if(!container) return;

    const arr = getCourseData();
    const keyword = getListSearchKeyword('courseSearchInput');
    const groupBySelect = document.getElementById('courseGroupBy');
    const dimension = groupBySelect ? groupBySelect.value : 'cls';
    const dimensionLabel = {
        cls: (typeof t==='function'?t('nav.class'):'班级'),
        teacher: (typeof t==='function'?t('nav.teacher'):'教师'),
        room: (typeof t==='function'?t('nav.room'):'教室')
    }[dimension] || (typeof t==='function'?t('nav.class'):'班级');

    const openKeys = new Set();
    if(!keyword){
        container.querySelectorAll('.course-group-item[open]').forEach(d=>{
            openKeys.add(d.dataset.groupKey);
        });
    }

    let groups = groupCoursesByDimension(arr, dimension);
    if(keyword){
        groups = groups.filter(([groupKey, indices])=>{
            if(matchSearch(groupKey, keyword)) return true;
            return indices.some(idx => courseItemMatchesSearch(arr[idx], keyword));
        });
    }

    if(groups.length === 0){
        container.innerHTML = `<div class="course-empty-hint">${keyword ? '无匹配的课程分组' : '暂无课程，请在上方添加'}</div>`;
    }else{
        let html = '';
        groups.forEach(([groupKey, indices])=>{
            const safeKey = escCourseHtml(groupKey);
            const isOpen = keyword ? true : openKeys.has(groupKey);
            html += `<details class="course-group-item" data-group-key="${safeKey}" data-indices='${JSON.stringify(indices)}'${isOpen ? ' open' : ''}>
                <summary>
                    <span class="course-group-name">${safeKey}</span>
                    <span class="course-group-count">${indices.length} 条课程</span>
                </summary>
                <div class="course-group-body" data-loaded="false"></div>
            </details>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.course-group-item').forEach(details=>{
            details.addEventListener('toggle', function(){
                if(this.open) loadCourseGroupBody(this);
            });
            if(details.open) loadCourseGroupBody(details);
        });
    }

    const hint = document.getElementById('courseTotalHint');
    if(hint){
        if(keyword){
            const matchedCount = groups.reduce((sum, [, indices]) => sum + indices.length, 0);
            hint.textContent = (typeof t==='function'
                ? t('msg.courseGroupFound',{n:matchedCount,g:groups.length,dim:dimensionLabel})
                : `找到 ${matchedCount} 条课程，${groups.length} 个${dimensionLabel}分组`);
        }else if(groups.length > 0){
            hint.textContent = (typeof t==='function'
                ? t('msg.courseGroupHint',{n:arr.length,g:groups.length,dim:dimensionLabel})
                : `共 ${arr.length} 条课程，${groups.length} 个${dimensionLabel}分组`);
        }else{
            hint.textContent = '';
        }
    }
}

// ========== 下拉选项渲染【已修改：课程只展示当前课表绑定班级】 ==========
function renderCourseSelects(){
    let tData=getTeacherData();let rData=getRoomData();let clsData=getClassData();let cData=getCourseData();
    let s1='<option value="">'+(typeof t==='function'?t('course.selectTeacher'):'选择教师')+'</option>';tData.forEach(x=>s1+=`<option value="${x}">${x}</option>`);document.getElementById("courseTeacher").innerHTML=s1;
    let s2='<option value="">'+(typeof t==='function'?t('course.selectRoom'):'选择场地')+'</option>';rData.forEach(x=>s2+=`<option value="${x}">${x}</option>`);document.getElementById("courseRoom").innerHTML=s2;
    let s3='<option value="">'+(typeof t==='function'?t('course.selectClass'):'选择学员组')+'</option>';clsData.forEach(x=>s3+=`<option value="${x}">${x}</option>`);document.getElementById("courseClass").innerHTML=s3;

    // 按当前课表绑定班级过滤课程
    const currentTable = getCurrentTableInfo();
    const bindClass = currentTable?.bindClass?.trim() || "";
    let filterCourseList = [];
    if(bindClass){
        filterCourseList = cData.filter(item => item.cls.trim() === bindClass);
    }

    let s4='<option value="">'+(typeof t==='function'?t('course.selectName'):'请选择课程')+'</option>';
    if(filterCourseList.length === 0){
        s4 = '<option value="" disabled>'+(typeof t==='function'?t('msg.noCourseForClass'):'当前班级暂无可用课程，请前往课程管理添加')+'</option>';
    }else{
        filterCourseList.forEach(x=>{
            const valKey = `${x.name}|${x.teacher}|${x.room}|${x.cls}`;
            const nameLabel = (typeof displayCourseName==='function'?displayCourseName(x.name):x.name);
            const showTxt = (typeof t==='function')
                ? t('course.optionLine',{name:nameLabel,teacher:x.teacher,room:x.room,cls:x.cls})
                : `${x.name} | 教师：${x.teacher} | 教室：${x.room} | 班级：${x.cls}`;
            const selected = valKey === lastSelectCourseValue ? "selected" : "";
            s4+=`<option value="${valKey}" ${selected}>${showTxt}</option>`;
        });
    }
    document.getElementById("courseSelect").innerHTML=s4;
}

// ========== 课时模版下拉渲染 ==========
function renderTimeTemplateSelect(){
    const timeSelect = document.getElementById('timeTemplateSelect');
    if(timeSelect){
        const prev = timeSelect.value;
        timeSelect.innerHTML = '<option value="">'+(typeof t==='function'?t('time.templateSelect'):'选择已保存模版')+'</option>';
        timeTemplateList.forEach((item, index)=>{
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.name;
            timeSelect.appendChild(option);
        });
        if(prev !== '' && timeTemplateList[prev]) timeSelect.value = prev;
    }
    const newClassSelect = document.getElementById('newClassTimeTemplate');
    if(newClassSelect){
        const prevClass = newClassSelect.value;
        newClassSelect.innerHTML = '<option value="default">'+(typeof t==='function'?t('class.defaultTime'):'默认课时')+'</option>';
        timeTemplateList.forEach((item, index)=>{
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.name;
            newClassSelect.appendChild(option);
        });
        if(prevClass && (prevClass === 'default' || timeTemplateList[prevClass])) newClassSelect.value = prevClass;
    }
}

// ========== 课表标签渲染 ==========
function renderTableTags(){
    let select = document.getElementById("tableSelect");
    let currentNameDom = document.getElementById("currentTableName");
    if(!select) return;
    const keyword = getListSearchKeyword('tableSelectSearch');
    let html = "";
    let visibleCount = 0;
    const unnamed = (typeof t==='function'?t('msg.unnamedTable'):'未命名课表');
    const noneLabel = (typeof t==='function'?t('msg.noTimetable'):'暂无课表');
    const noMatchLabel = (typeof t==='function'?t('msg.noMatchTable'):'无匹配课表');

    if(tableList.length === 0){
        select.innerHTML = '<option value="">'+noneLabel+'</option>';
        if(currentNameDom) currentNameDom.innerText = noneLabel;
        updateListSearchHint('tableSelectSearchHint', 0, 0, keyword);
        return;
    }

    tableList.forEach(item=>{
        const rawLabel = item.name || item.bindClass || unnamed;
        const label = (typeof displayLocaleText==='function'?displayLocaleText(rawLabel):rawLabel);
        const isCurrent = item.id === currentTableId;
        const matches = matchSearch(rawLabel, keyword) || matchSearch(label, keyword);
        if(keyword && !matches && !isCurrent) return;
        visibleCount++;
        let selected = isCurrent ? "selected" : "";
        html += `<option value="${item.id}" ${selected}>${label}</option>`;
    });

    if(!html){
        html = '<option value="">'+noMatchLabel+'</option>';
    }
    select.innerHTML = html;

    const currTable = tableList.find(item=>item.id === currentTableId);
    if(currTable && currentNameDom){
        const raw = currTable.name || currTable.bindClass || unnamed;
        currentNameDom.innerText = (typeof displayLocaleText==='function'?displayLocaleText(raw):raw);
    }
    updateListSearchHint('tableSelectSearchHint', visibleCount, tableList.length, keyword);
}

function switchTable(tid){
    currentTableId = tid;
    renderTableTags();
    renderTime();
    renderSchedule();
    checkAllConflict();
    saveSnapshot();
    renderCourseSelects();
    lastSelectCourseValue = "";
    // 切换课表保留起止时间选择，便于跨课表用同一套手动时间排课
    // 切换课表强制刷新导出下拉
    renderExportTeacherSelect();
    renderExportRoomSelect();
    if(typeof renderAutoSchedulePanel === 'function') renderAutoSchedulePanel();
    if(typeof onOccQueryChange === 'function' && document.getElementById('tab-occupancy')?.classList.contains('active')){
        onOccQueryChange();
    }
}

async function delCurrentTable(){
    if(tableList.length <= 1){alert("至少保留一张课表");return;}
    const curr = getCurrentTableInfo();
    if(!curr) return;
    const className = curr.bindClass || curr.name;
    if(!(await showAppConfirm('确定删除课表「' + className + '」？班级列表中对应班级及该班课程也将删除。'))) return;

    const classes = getClassData();
    const cIdx = classes.indexOf(className);
    if(cIdx !== -1){
        classes.splice(cIdx, 1);
        saveClassData(classes);
    }
    removeCoursesForClass(className);

    let idx = tableList.findIndex(t=>t.id === currentTableId);
    tableList.splice(idx,1);
    saveTableList();
    currentTableId = tableList[0].id;
    renderTableTags();
    renderClass();
    renderTime();
    renderSchedule();
    renderCourse();
    renderCourseNameSelect();
    renderCourseSelects();
    checkAllConflict();
    saveSnapshot();
}

// 一键清空当前选中课表所有单元格数据
let clearAllLock = false;
async function clearAllCurrentTable(){
    if(clearAllLock) return;
    if(!currentTableId){
        return alert("请先选中一张课表再操作");
    }
    const currTable = tableList.find(t => t.id === currentTableId);
    if(!currTable) return;
    const hasData = currTable.data && Object.keys(currTable.data).some(function(k){
        return currTable.data[k];
    });
    if(!hasData){
        return alert("当前课表没有课程数据，无需清空");
    }
    if(!(await showAppConfirm("确定要清空当前这张课表所有课程数据吗？该操作不可撤销！"))){
        return;
    }
    clearAllLock = true;
    currTable.data = {};
    if(typeof exitClearCellMode === 'function') exitClearCellMode();
    renderSchedule();
    checkAllConflict();
    saveSnapshot();
    setTimeout(function(){ clearAllLock = false; }, 300);
}
// 导出当前课表为Excel（带全边框+规范排版+边距适配）
// 导出当前课表为Excel（打印居中+单页适配+全边框+规范排版）
function exportScheduleToExcel(){
    if(!currentTableId){
        return alert("请先选中一张有课程的课表再导出");
    }
    const currTable = tableList.find(t => t.id === currentTableId);
    if(!currTable || !currTable.data){
        return alert("未找到当前课表的课程数据");
    }
    exportScheduleToExcelAsync(currTable);
}

function exportScheduleToImage(){
    if(!currentTableId){
        return alert("请先选中一张课表再导出");
    }
    const currTable = tableList.find(t => t.id === currentTableId);
    if(!currTable){
        return alert("未找到当前课表");
    }
    exportScheduleToImageAsync(currTable);
}

function buildCurrentScheduleExportHtml(currTable){
    const tableData = currTable.data || {};
    const timeList = currTable.timeList || getTimeData();
    const tt = (typeof t === 'function') ? t : (k, v) => {
        if (k === 'export.scheduleTitle') return (v && v.name ? v.name : '') + ' 课程表';
        if (k === 'export.periodFallback') return '课时' + (v && v.n != null ? v.n : '');
        if (k === 'export.teacher') return '教师：' + (v && v.name != null ? v.name : '');
        if (k === 'export.room') return '教室：' + (v && v.name != null ? v.name : '');
        const weekMap = {
            'export.corner': '课时/星期',
            'export.week.mon': '星期一', 'export.week.tue': '星期二', 'export.week.wed': '星期三',
            'export.week.thu': '星期四', 'export.week.fri': '星期五', 'export.week.sat': '星期六', 'export.week.sun': '星期日'
        };
        return weekMap[k] || k;
    };
    const dispPeriod = (typeof displayPeriodLabel === 'function') ? displayPeriodLabel : (s) => s;
    const dispCourse = (typeof displayCourseName === 'function') ? displayCourseName : (s) => s;
    const dispLocale = (typeof displayLocaleText === 'function') ? displayLocaleText : (s) => s;
    const weekKeys = ['export.week.mon','export.week.tue','export.week.wed','export.week.thu','export.week.fri','export.week.sat','export.week.sun'];
    const weekList = weekKeys.map(k => tt(k));
    const tableTitle = tt('export.scheduleTitle', { name: dispLocale(currTable.name || '') });

    let maxRow = 0, maxCol = 0;
    Object.keys(tableData).forEach(key => {
        const [row, col] = key.split("-").map(Number);
        if(!isNaN(row) && !isNaN(col)){
            maxRow = Math.max(maxRow, row);
            maxCol = Math.max(maxCol, col);
        }
    });
    maxRow = Math.max(maxRow, timeList.length - 1);
    maxCol = Math.max(maxCol, weekList.length - 1);

    let html = `<html><meta charset="utf-8"><style>${EXPORT_EXCEL_STYLE}</style><body style="font-family:微软雅黑,宋体,Arial,sans-serif;margin:0;padding:0;background:#fff;">`;
    html += `<table border="1" cellpadding="3" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;width:830px;">`;
    html += `<tr><td colspan="8" align="center" style="font-size:22px;font-weight:bold;padding:6px 0;background:#4472C4;color:#fff;border:#000 solid 1px;">${tableTitle}</td></tr>`;
    html += `<tr style="font-size:11px;font-weight:bold;background:#D9D9D9;text-align:center;height:26px;">
        <td class="time-col" style="border:#000 solid 1px;">${tt('export.corner')}</td>`;
    weekList.forEach(w => {
        html += `<td width="100px" style="border:#000 solid 1px;">${w}</td>`;
    });
    html += `</tr>`;

    for(let rowIdx = 0; rowIdx <= maxRow; rowIdx++){
        const timeNameRaw = timeList[rowIdx]?.name || tt('export.periodFallback', { n: rowIdx + 1 });
        const timeName = dispPeriod(timeNameRaw);
        const isRestRow = /午饭|晚饭/.test(String(timeNameRaw)) || timeList[rowIdx]?.isSplit;
        const bg = isRestRow ? "#F2F2F2" : "#fff";
        const h = isRestRow ? "36px" : "68px";

        if(isRestRow){
            html += `<tr style="text-align:center;vertical-align:center;height:${h};background:${bg};font-weight:bold;font-size:11px;">
                <td colspan="8" style="border:#000 solid 1px;">${timeName}</td>
            </tr>`;
        }else{
            html += `<tr style="text-align:center;vertical-align:center;height:${h};background:${bg};font-size:10px;">
                <td class="time-col" style="border:#000 solid 1px;">${timeName}</td>`;
            for(let colIdx=0;colIdx<7;colIdx++){
                const key = `${rowIdx}-${colIdx}`;
                const val = tableData[key];
                const cellBg = val ? "#fff" : "#F8F8F8";
                if(val){
                    const parts = val.split("|");
                    const course = dispCourse(parts[0] || '');
                    const teacher = parts[1] || '';
                    const room = dispLocale(parts[2] || '');
                    const start = parts[4] || '';
                    const end = parts[5] || '';
                    const content = `<span style="font-size:11px">${course}</span><br><span style="font-size:9px">${tt('export.teacher',{name:teacher})}<br>${tt('export.room',{name:room})}<br>${start}-${end}</span>`;
                    html += `<td style="border:#000 solid 1px;background:${cellBg};padding:2px;">${content}</td>`;
                }else{
                    html += `<td style="border:#000 solid 1px;background:${cellBg};padding:2px;"></td>`;
                }
            }
            html += `</tr>`;
        }
    }

    html += `</table></body></html>`;
    return html;
}

async function exportScheduleToExcelAsync(currTable){
    const html = buildCurrentScheduleExportHtml(currTable);
    const base = (typeof t === 'function')
        ? t('export.fileSchedule', { name: currTable.name })
        : `${currTable.name}_课表`;
    const filename = `${base}.xls`;
    const saved = await saveFileWithPicker(html, filename, {
        extensions: ['xls'], mimeType: 'application/vnd.ms-excel', utf8Bom: true
    });
    if(saved && typeof markBackupExported === 'function') markBackupExported();
}

async function exportScheduleToImageAsync(currTable){
    const html = buildCurrentScheduleExportHtml(currTable);
    const base = (typeof t === 'function')
        ? t('export.fileSchedule', { name: currTable.name })
        : `${currTable.name}_课表`;
    const saved = await exportHtmlDocumentAsPng(html, `${base}.png`);
    if(saved) alert(typeof t === 'function' ? t('export.imageOk') : '✅ 课表图片导出成功');
}
function testScheduleData(){
    if(!currentTableId){
        console.log("❌ 未选中课表");
        return alert("请先选中一张有课程的课表");
    }
    const currTable = tableList.find(t => t.id === currentTableId);
    console.log("✅ 当前课表：", currTable.name);
    console.log("✅ 课表所有课程数据：", currTable.data);
    console.log("✅ 课时数据：", getTimeData());
    alert("数据已打印到浏览器控制台，按F12打开控制台查看");
}

// 1. 导出全部备份（含所有课表排课内容、基础数据、课时模版）
async function exportAllBackup() {
    const backupData = {
        backupType: "fullBackup",
        backupTime: new Date().toLocaleString(),
        multiTableData: JSON.parse(JSON.stringify(tableList)),
        classList: JSON.parse(appGetItem('classList') || '[]'),
        teacherList: JSON.parse(appGetItem('teacherList') || '[]'),
        roomList: JSON.parse(appGetItem('roomList') || '[]'),
        courseList: JSON.parse(appGetItem('courseList') || '[]'),
        timeTemplateList: JSON.parse(appGetItem('timeTemplateList') || '[]'),
        currentTableId: currentTableId || '',
        appName: getAppName(),
        appSubtitle: getAppSubtitle()
    };
    const filename = `${sanitizeAppFileName(getAppName())}_全量备份_${new Date().getTime()}.json`;
    const saved = await saveFileWithPicker(JSON.stringify(backupData, null, 2), filename, {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved){
        alert(`✅ 全量备份导出成功，共 ${tableList.length} 张课表（含排课内容）`);
        if(typeof markBackupExported === 'function') markBackupExported();
    }
}

// 2. 全局导入恢复
function importAllBackup() {
    const fileInput = document.getElementById('allBackupFile');
    if (!fileInput.files || fileInput.files.length === 0) {
        return alert('请先点击选择文件，选中后缀为.json的备份文件');
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);
            const importedTables = backupData.multiTableData || backupData.tableList || [];
            tableList = importedTables.map(table => ({
                id: table.id,
                name: table.name,
                bindClass: table.bindClass || "",
                data: table.data || {},
                timeList: table.timeList ? table.timeList : JSON.parse(JSON.stringify(DEFAULT_TIME)),
                autoScheduleConfig: table.autoScheduleConfig || { constraints: [], settings: { onlyEmpty: true, checkGlobal: true, spreadWeek: true } }
            }));
            saveTableList();

            appSetItem('classList', JSON.stringify(backupData.classList || []));
            appSetItem('teacherList', JSON.stringify(backupData.teacherList || []));
            appSetItem('roomList', JSON.stringify(backupData.roomList || []));
            appSetItem('courseList', JSON.stringify(backupData.courseList || []));
            if(typeof invalidateCourseInfoCache === 'function') invalidateCourseInfoCache();

            if (backupData.timeTemplateList) {
                timeTemplateList = backupData.timeTemplateList;
                saveTimeTemplateListStorage();
            }

            if (backupData.currentTableId && tableList.find(t => t.id === backupData.currentTableId)) {
                currentTableId = backupData.currentTableId;
            } else if (tableList.length > 0) {
                currentTableId = tableList[0].id;
            } else {
                currentTableId = "";
            }

            restoreAppBrandingFromBackup(backupData);

            renderTableTags();
            renderClass();
            renderTeacher();
            renderRoom();
            renderCourse();
            renderCourseSelects();
            if(typeof syncClassesAndTables === 'function') syncClassesAndTables();
            renderTimeTemplateSelect();
            renderTime();
            renderSchedule();
            checkAllConflict();
            saveSnapshot();
            fileInput.value = "";

            alert(`✅ 全局数据导入成功，已恢复 ${tableList.length} 张课表及全部排课内容`);
        } catch (err) {
            alert("❌ 备份文件格式错误，导入失败");
            console.error('全局导入异常：', err);
        }
    };
    reader.readAsText(file);
}

// 3. 重置所有数据
async function resetAllData() {
    if (!(await showAppConfirm('警告：确定要清空所有课表、班级、教师、教室、课程全部数据吗？操作后数据无法恢复！'))) {
        return;
    }
    if(typeof clearAppDataStorage === 'function'){
        await clearAppDataStorage();
    }else{
        appRemoveItem('multiTableData');
        appRemoveItem('timeTemplateList');
        appRemoveItem('classList');
        appRemoveItem('teacherList');
        appRemoveItem('roomList');
        appRemoveItem('courseList');
    }
    if(typeof flushAppDataNow === 'function') await flushAppDataNow();
    alert('✅ 所有数据已重置清空，页面即将刷新');
    location.reload();
}

// ====================== 单课表导出（含课时结构与全部排课内容） ======================
function exportCurrentTableBackup() {
    if (!currentTableId) {
        return alert("请先在课表下拉框选中需要备份的课表");
    }
    const targetTable = tableList.find(item => item.id === currentTableId);
    if (!targetTable) return alert("未找到当前课表数据");
    exportCurrentTableBackupAsync(targetTable);
}
async function exportCurrentTableBackupAsync(targetTable) {
    const singleTableBackup = {
        backupType: "singleTableBackup",
        backupTime: new Date().toLocaleString(),
        tableInfo: JSON.parse(JSON.stringify(targetTable))
    };
    const filename = `【${targetTable.name}】课表单独备份.json`;
    const saved = await saveFileWithPicker(JSON.stringify(singleTableBackup, null, 2), filename, {
        extensions: ['json'], mimeType: 'application/json'
    });
    if(saved){
        alert(`✅ 课表【${targetTable.name}】备份导出成功，已包含课时结构与全部排课内容`);
        if(typeof markBackupExported === 'function') markBackupExported();
    }
}

// ====================== 单课表导入（只恢复这一张课表，不影响其他数据） ======================
function importSingleTableBackup() {
    const fileInputDom = document.getElementById("allBackupFile");
    if (!fileInputDom.files.length) {
        return alert("请先点击【选择文件】，选中单课表备份的 .json 文件");
    }
    const file = fileInputDom.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (backupData.backupType !== "singleTableBackup") {
                return alert("当前不是单课表备份文件，请选择【单课表导出】的json文件");
            }

            const importTable = backupData.tableInfo;
            if (!importTable || !importTable.id) {
                return alert("❌ 备份文件缺少课表信息");
            }
            if (backupData.tableTimeList) {
                importTable.timeList = backupData.tableTimeList;
            }
            importTable.data = importTable.data || {};
            importTable.timeList = importTable.timeList || JSON.parse(JSON.stringify(DEFAULT_TIME));
            importTable.bindClass = importTable.bindClass || "";

            const existTableIndex = tableList.findIndex(t => t.bindClass === importTable.bindClass && importTable.bindClass);
            if (existTableIndex > -1) {
                if (!(await showAppConfirm(`班级【${importTable.bindClass}】已有课表，是否覆盖？`))) return;
                tableList[existTableIndex] = importTable;
            } else {
                const idConflict = tableList.findIndex(t => t.id === importTable.id);
                if (idConflict > -1) {
                    if (!(await showAppConfirm(`课表【${importTable.name}】已存在，是否覆盖？`))) return;
                    tableList[idConflict] = importTable;
                } else {
                    tableList.push(importTable);
                }
            }

            saveTableList();
            currentTableId = importTable.id;

            renderTableTags();
            renderTime();
            renderSchedule();
            renderCourseSelects();
            checkAllConflict();
            saveSnapshot();
            fileInputDom.value = "";

            alert(`✅ 课表【${importTable.name}】导入成功，排课内容已恢复！`);
        } catch (err) {
            alert("❌ 导入失败：文件格式错误");
            console.error("单课表导入异常：", err);
        }
    };
    reader.readAsText(file);
}

// ===================== 全局读取课表数据工具函数 =====================
function getTableList() {
    if (Array.isArray(tableList) && tableList.length > 0) {
        return tableList;
    }
    return JSON.parse(appGetItem('multiTableData') || '[]');
}

// ===================== 跨课表合并导出（按实际时段对齐） =====================
const EXPORT_EXCEL_STYLE = `
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 微软雅黑, 宋体; }
    table { border-collapse: collapse; width: 830px !important; table-layout: fixed !important; }
    td {
        border: 1px solid #000;
        padding: 3px 2px;
        text-align: center;
        vertical-align: middle;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        white-space: normal !important;
    }
    td.time-col {
        width: 130px !important;
        min-width: 130px !important;
        max-width: 130px !important;
        white-space: nowrap !important;
        word-wrap: normal !important;
        overflow-wrap: normal !important;
        font-size: 10px;
        line-height: 1.25;
        padding: 3px 4px;
    }
    @page { size: A4 landscape; margin: 7mm; page-break-inside: avoid; }
    @media print {
        html, body { width: 100%; height: 100%; overflow: hidden; }
        table {
            width: 100% !important;
            transform: scale(0.95);
            transform-origin: top center;
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
        }
        tr, td { page-break-inside: avoid; }
        td.time-col { white-space: nowrap !important; }
    }
`;

function buildMergedExportTimeRows(allTableList){
    const slotMap = new Map();
    let lunchLabel = null;
    let dinnerLabel = null;

    allTableList.forEach(table=>{
        (table.timeList || []).forEach(item=>{
            if(item.isSplit || /午饭|晚饭/.test(item.name)){
                if(item.name.includes('午饭')) lunchLabel = lunchLabel || item.name;
                if(item.name.includes('晚饭')) dinnerLabel = dinnerLabel || item.name;
                return;
            }
            const parsed = typeof parsePeriodTimeRange === 'function' ? parsePeriodTimeRange(item.name) : null;
            if(!parsed) return;
            const key = `${parsed.start}-${parsed.end}`;
            if(!slotMap.has(key)){
                slotMap.set(key, { type: 'slot', start: parsed.start, end: parsed.end, label: item.name });
            }
        });
    });

    const slots = Array.from(slotMap.values()).sort((a, b)=> timeToMin(a.start) - timeToMin(b.start));
    const rows = [];
    let lunchInserted = false;
    let dinnerInserted = false;

    const insertSplit = (label, insertedFlag, minStartMin)=>{
        if(!label || insertedFlag.value) return;
        const idx = rows.findIndex(r=> r.type === 'slot' && timeToMin(r.start) >= minStartMin);
        const insertAt = idx === -1 ? rows.length : idx;
        rows.splice(insertAt, 0, { type: 'split', label });
        insertedFlag.value = true;
    };

    slots.forEach(slot=>{
        if(lunchLabel && !lunchInserted && timeToMin(slot.start) >= 12 * 60){
            rows.push({ type: 'split', label: lunchLabel });
            lunchInserted = true;
        }
        if(dinnerLabel && !dinnerInserted && timeToMin(slot.start) >= 17 * 60 + 30){
            rows.push({ type: 'split', label: dinnerLabel });
            dinnerInserted = true;
        }
        rows.push(slot);
    });

    if(lunchLabel && !lunchInserted){
        const idx = rows.findIndex(r=> r.type === 'slot' && timeToMin(r.start) >= 12 * 60);
        rows.splice(idx === -1 ? rows.length : idx, 0, { type: 'split', label: lunchLabel });
    }
    if(dinnerLabel && !dinnerInserted){
        const idx = rows.findIndex(r=> r.type === 'slot' && timeToMin(r.start) >= 17 * 60 + 30);
        rows.splice(idx === -1 ? rows.length : idx, 0, { type: 'split', label: dinnerLabel });
    }

    return rows;
}

function collectResourceAssignments(allTableList, resourceType, resourceName){
    const list = [];
    allTableList.forEach(table=>{
        Object.keys(table.data || {}).forEach(cellKey=>{
            const [rowIdx, weekIdx] = cellKey.split('-').map(Number);
            const cellStr = table.data[cellKey];
            if(!cellStr) return;
            const parsed = typeof parseCellAssignment === 'function'
                ? parseCellAssignment(cellStr, table.timeList, rowIdx)
                : null;
            if(!parsed?.info) return;
            const matchVal = resourceType === 'teacher' ? parsed.info.teacher : parsed.info.room;
            if(matchVal !== resourceName) return;
            list.push({
                weekIdx,
                start: parsed.startTime,
                end: parsed.endTime,
                course: parsed.info.name,
                teacher: parsed.info.teacher,
                room: parsed.info.room,
                cls: parsed.info.cls,
                tableName: table.name
            });
        });
    });
    return list;
}

function findAssignmentsInExportSlot(assignments, weekIdx, slot){
    return assignments.filter(a=>
        a.weekIdx === weekIdx &&
        isTimeOverlap(a.start, a.end, slot.start, slot.end)
    );
}

function buildResourceExportHtml(title, timeRows, assignments, formatHit){
    const tt = (typeof t === 'function') ? t : (k) => ({
        'export.corner': '课时/星期',
        'export.week.mon': '星期一', 'export.week.tue': '星期二', 'export.week.wed': '星期三',
        'export.week.thu': '星期四', 'export.week.fri': '星期五', 'export.week.sat': '星期六', 'export.week.sun': '星期日'
    }[k] || k);
    const dispPeriod = (typeof displayPeriodLabel === 'function') ? displayPeriodLabel : (s) => s;
    const weekKeys = ['export.week.mon','export.week.tue','export.week.wed','export.week.thu','export.week.fri','export.week.sat','export.week.sun'];

    let html = `<html><meta charset="utf-8"><style>${EXPORT_EXCEL_STYLE}</style><body><table>`;
    html += `<tr><td colspan="8" style="font-size:22px;font-weight:bold;background:#4472C4;color:#fff;height:45px;">${title}</td></tr>`;
    html += `<tr style="font-size:11px;font-weight:bold;background:#D9D9D9;height:30px;">
        <td class="time-col">${tt('export.corner')}</td>`;
    weekKeys.forEach(k => { html += `<td width="100px">${tt(k)}</td>`; });
    html += `</tr>`;

    timeRows.forEach(row=>{
        if(row.type === 'split'){
            html += `<tr><td colspan="8" style="font-size:11px;font-weight:bold;background:#F2F2F2;height:25px;">${dispPeriod(row.label)}</td></tr>`;
            return;
        }
        html += `<tr style="height:55px;font-size:10px;"><td class="time-col">${dispPeriod(row.label)}</td>`;
        for(let week = 0; week < 7; week++){
            const hits = findAssignmentsInExportSlot(assignments, week, row);
            const cellContent = hits.length
                ? hits.map(formatHit).join('<br><span style="color:#999;">—</span><br>')
                : '';
            html += `<td>${cellContent}</td>`;
        }
        html += `</tr>`;
    });

    html += `</table></body></html>`;
    return html;
}

async function downloadExcelHtml(filename, html){
    const saved = await saveFileWithPicker(html, filename, {
        extensions: ['xls'], mimeType: 'application/vnd.ms-excel', utf8Bom: true
    });
    if(saved && typeof markBackupExported === 'function') markBackupExported();
    return saved;
}

async function exportSelectedTeacherSchedule() {
    const selectedTeacher = document.getElementById('exportTeacherSelect').value.trim();
    if (!selectedTeacher) return alert(typeof t==='function'?t('schedule.selectTeacher'):'请先选择教师');
    const allTableList = getTableList();
    if (allTableList.length === 0) return alert(typeof t==='function'?t('msg.noTimetable'):'暂无课表数据');

    const timeRows = buildMergedExportTimeRows(allTableList);
    const assignments = collectResourceAssignments(allTableList, 'teacher', selectedTeacher);
    if(assignments.length === 0){
        return alert(typeof t==='function'?t('export.noTeacherLessons',{name:selectedTeacher}):`未找到教师【${selectedTeacher}】的排课记录`);
    }

    const dispCourse = (typeof displayCourseName === 'function') ? displayCourseName : (s) => s;
    const dispLocale = (typeof displayLocaleText === 'function') ? displayLocaleText : (s) => s;
    const tt = (typeof t === 'function') ? t : null;
    const html = buildResourceExportHtml(
        tt ? tt('export.teacherScheduleTitle', { name: selectedTeacher }) : `${selectedTeacher} 教师课程表（全部课表合并）`,
        timeRows,
        assignments,
        h => `${dispCourse(h.course)}<br>${tt?tt('export.class',{name:dispLocale(h.cls)}):('班级：'+h.cls)}<br>${tt?tt('export.room',{name:dispLocale(h.room)}):('教室：'+h.room)}<br>${h.start}-${h.end}<br><span style="font-size:9px;color:#666;">${dispLocale(h.tableName)}</span>`
    );
    const base = tt ? tt('export.fileTeacher', { name: selectedTeacher }) : `${selectedTeacher}_教师课表`;
    await downloadExcelHtml(`${base}.xls`, html);
}

async function exportSelectedTeacherScheduleImage() {
    const selectedTeacher = document.getElementById('exportTeacherSelect').value.trim();
    if (!selectedTeacher) return alert(typeof t==='function'?t('schedule.selectTeacher'):'请先选择教师');
    const allTableList = getTableList();
    if (allTableList.length === 0) return alert(typeof t==='function'?t('msg.noTimetable'):'暂无课表数据');

    const timeRows = buildMergedExportTimeRows(allTableList);
    const assignments = collectResourceAssignments(allTableList, 'teacher', selectedTeacher);
    if(assignments.length === 0){
        return alert(typeof t==='function'?t('export.noTeacherLessons',{name:selectedTeacher}):`未找到教师【${selectedTeacher}】的排课记录`);
    }

    const dispCourse = (typeof displayCourseName === 'function') ? displayCourseName : (s) => s;
    const dispLocale = (typeof displayLocaleText === 'function') ? displayLocaleText : (s) => s;
    const tt = (typeof t === 'function') ? t : null;
    const html = buildResourceExportHtml(
        tt ? tt('export.teacherScheduleTitle', { name: selectedTeacher }) : `${selectedTeacher} 教师课程表（全部课表合并）`,
        timeRows,
        assignments,
        h => `${dispCourse(h.course)}<br>${tt?tt('export.class',{name:dispLocale(h.cls)}):('班级：'+h.cls)}<br>${tt?tt('export.room',{name:dispLocale(h.room)}):('教室：'+h.room)}<br>${h.start}-${h.end}<br><span style="font-size:9px;color:#666;">${dispLocale(h.tableName)}</span>`
    );
    const base = tt ? tt('export.fileTeacher', { name: selectedTeacher }) : `${selectedTeacher}_教师课表`;
    const saved = await exportHtmlDocumentAsPng(html, `${base}.png`);
    if(saved) alert(tt ? tt('export.teacherImageOk') : '✅ 教师课表图片导出成功');
}

async function exportSelectedRoomSchedule() {
    const selectedRoom = document.getElementById('exportRoomSelect').value.trim();
    if (!selectedRoom) return alert(typeof t==='function'?t('schedule.selectRoom'):'请先选择教室');
    const allTableList = getTableList();
    if (allTableList.length === 0) return alert(typeof t==='function'?t('msg.noTimetable'):'暂无课表数据');

    const timeRows = buildMergedExportTimeRows(allTableList);
    const assignments = collectResourceAssignments(allTableList, 'room', selectedRoom);
    if(assignments.length === 0){
        return alert(typeof t==='function'?t('export.noRoomLessons',{name:selectedRoom}):`未找到教室【${selectedRoom}】的占用记录`);
    }

    const dispCourse = (typeof displayCourseName === 'function') ? displayCourseName : (s) => s;
    const dispLocale = (typeof displayLocaleText === 'function') ? displayLocaleText : (s) => s;
    const tt = (typeof t === 'function') ? t : null;
    const html = buildResourceExportHtml(
        tt ? tt('export.roomScheduleTitle', { name: dispLocale(selectedRoom) }) : `${selectedRoom} 教室占用表（全部课表合并）`,
        timeRows,
        assignments,
        h => `${dispCourse(h.course)}<br>${tt?tt('export.class',{name:dispLocale(h.cls)}):('班级：'+h.cls)}<br>${tt?tt('export.teacher',{name:h.teacher}):('教师：'+h.teacher)}<br>${h.start}-${h.end}<br><span style="font-size:9px;color:#666;">${dispLocale(h.tableName)}</span>`
    );
    const base = tt ? tt('export.fileRoom', { name: selectedRoom }) : `${selectedRoom}_教室占用表`;
    await downloadExcelHtml(`${base}.xls`, html);
}

async function exportSelectedRoomScheduleImage() {
    const selectedRoom = document.getElementById('exportRoomSelect').value.trim();
    if (!selectedRoom) return alert(typeof t==='function'?t('schedule.selectRoom'):'请先选择教室');
    const allTableList = getTableList();
    if (allTableList.length === 0) return alert(typeof t==='function'?t('msg.noTimetable'):'暂无课表数据');

    const timeRows = buildMergedExportTimeRows(allTableList);
    const assignments = collectResourceAssignments(allTableList, 'room', selectedRoom);
    if(assignments.length === 0){
        return alert(typeof t==='function'?t('export.noRoomLessons',{name:selectedRoom}):`未找到教室【${selectedRoom}】的占用记录`);
    }

    const dispCourse = (typeof displayCourseName === 'function') ? displayCourseName : (s) => s;
    const dispLocale = (typeof displayLocaleText === 'function') ? displayLocaleText : (s) => s;
    const tt = (typeof t === 'function') ? t : null;
    const html = buildResourceExportHtml(
        tt ? tt('export.roomScheduleTitle', { name: dispLocale(selectedRoom) }) : `${selectedRoom} 教室占用表（全部课表合并）`,
        timeRows,
        assignments,
        h => `${dispCourse(h.course)}<br>${tt?tt('export.class',{name:dispLocale(h.cls)}):('班级：'+h.cls)}<br>${tt?tt('export.teacher',{name:h.teacher}):('教师：'+h.teacher)}<br>${h.start}-${h.end}<br><span style="font-size:9px;color:#666;">${dispLocale(h.tableName)}</span>`
    );
    const base = tt ? tt('export.fileRoom', { name: selectedRoom }) : `${selectedRoom}_教室占用表`;
    const saved = await exportHtmlDocumentAsPng(html, `${base}.png`);
    if(saved) alert(tt ? tt('export.roomImageOk') : '✅ 教室占用表图片导出成功');
}
// 渲染导出教师下拉框
function renderExportTeacherSelect() {
    const selectEl = document.getElementById('exportTeacherSelect');
    if (!selectEl) return;
    const teacherArr = JSON.parse(appGetItem('teacherList') || '[]');
    selectEl.innerHTML = '<option value="">'+(typeof t==='function'?t('schedule.selectTeacher'):'请选择教师')+'</option>';
    teacherArr.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        selectEl.appendChild(opt);
    });
}

// 渲染导出教室下拉框
function renderExportRoomSelect() {
    const selectEl = document.getElementById('exportRoomSelect');
    if (!selectEl) return;
    const roomArr = JSON.parse(appGetItem('roomList') || '[]');
    selectEl.innerHTML = '<option value="">'+(typeof t==='function'?t('schedule.selectRoom'):'请选择教室')+'</option>';
    roomArr.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        selectEl.appendChild(opt);
    });
}

// 页面初始化统一挂载
const originOnload = window.onload || function(){};
window.onload = function(){
    originOnload();
    renderExportTeacherSelect();
    renderExportRoomSelect();
};

// 新增删除教师后自动刷新下拉
const originalAddTeacher = addTeacher;
addTeacher = function() {
    originalAddTeacher();
    setTimeout(renderExportTeacherSelect, 100);
    setTimeout(()=>{ if(typeof initOccupancyQueryPanel === 'function') initOccupancyQueryPanel(); }, 100);
};
const originalDelTeacher = delTeacher;
delTeacher = function(id) {
    originalDelTeacher(id);
    setTimeout(renderExportTeacherSelect, 100);
    setTimeout(()=>{ if(typeof initOccupancyQueryPanel === 'function') initOccupancyQueryPanel(); }, 100);
};

// 新增删除教室后自动刷新下拉
const originalAddRoom = addRoom;
addRoom = function() {
    originalAddRoom();
    setTimeout(renderExportRoomSelect, 100);
    setTimeout(()=>{ if(typeof initOccupancyQueryPanel === 'function') initOccupancyQueryPanel(); }, 100);
};
const originalDelRoom = delRoom;
delRoom = function(id) {
    originalDelRoom(id);
    setTimeout(renderExportRoomSelect, 100);
    setTimeout(()=>{ if(typeof initOccupancyQueryPanel === 'function') initOccupancyQueryPanel(); }, 100);
};

// 页面加载兜底渲染
setTimeout(() => {
    renderExportTeacherSelect();
    renderExportRoomSelect();
}, 300);