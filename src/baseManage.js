// 清空单元格模式标记
let clearMode = false;
// ===================== 【新增开始：时间工具函数】 =====================
/**
 * 生成 08:00 ~ 22:30 间隔5分钟的时间选项数组
 */
function generateTimeOptions() {
    const timeList = [];
    let hour = 8;
    let minute = 0;
    while (!(hour === 22 && minute > 30)) {
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

/**
 * 初始化页面开始、结束时间下拉框
 */
function initTimeSelect() {
    const startSel = document.getElementById('startTimeSelect');
    const endSel = document.getElementById('endTimeSelect');
    if (!startSel || !endSel) return;

    startSel.innerHTML = '<option value="">请选择开始时间</option>';
    endSel.innerHTML = '<option value="">请选择结束时间</option>';

    TIME_OPTIONS.forEach(time => {
        startSel.innerHTML += `<option value="${time}">${time}</option>`;
        endSel.innerHTML += `<option value="${time}">${time}</option>`;
    });
}

/**
 * 校验起止时间合法性
 * @param {string} start 开始时间 HH:mm
 * @param {string} end 结束时间 HH:mm
 * @returns {boolean}
 */
function validTimeRange(start, end) {
    if (!start || !end) {
        alert('请选择开始时间和结束时间');
        return false;
    }
    const toMin = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };
    const sMin = toMin(start);
    const eMin = toMin(end);
    if (eMin <= sMin) {
        alert('结束时间必须晚于开始时间');
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
    let arr=getTimeData();let html="";
    arr.forEach((item,idx)=>{
        const name = item.name;
        const splitTag = item.isSplit ? '<span style="color:#2563eb;margin-left:8px;">【分割行】</span>' : '';
        html+=`<tr>
            <td>${idx+1}</td>
            <td ondblclick="editTime(${idx},'${name.replace(/'/g,"\\'")}',${item.isSplit},this)">${name}${splitTag}</td>
            <td>
                <button class="edit" onclick="editTime(${idx},'${name.replace(/'/g,"\\'")}',${item.isSplit},this.parentElement.previousElementSibling)">修改</button>
                <button class="del" onclick="delTime(${idx})">删除</button>
            </td>
        </tr>`;
    });
    document.getElementById("timeList").innerHTML=html;
}

// ========== 班级管理 ==========
function addClass(){
    let name=document.getElementById("className").value.trim();if(!name)return alert("请填写名称");
    let arr=getClassData();arr.push(name);saveClassData(arr);
    document.getElementById("className").value="";renderClass();renderCourseSelects();renderNewTableClassSelect();
}
function delClass(idx){let arr=getClassData();arr.splice(idx,1);saveClassData(arr);renderClass();renderCourseSelects();renderNewTableClassSelect();}
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
        <button class="edit" onclick="saveEditClassName(${idx})">确认修改</button>
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
    arr[idx] = newName;
    saveClassData(arr);
    renderClass();
    renderCourseSelects();
    renderNewTableClassSelect();
    closeAutoModal();
}
function renderClass(){
    let arr=getClassData();let html="";
    arr.forEach((item,idx)=>{
        html+=`<tr><td>${idx+1}</td><td>${item}</td><td>
            <button class="edit" onclick="editClass(${idx})">修改</button>
            <button class="del" onclick="delClass(${idx})">删除</button>
        </td></tr>`;
    });
    document.getElementById("classList").innerHTML=html;
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
        <button class="edit" onclick="saveEditTeacherName(${idx})">确认修改</button>
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
    let arr=getTeacherData();let html="";
    arr.forEach((item,idx)=>{
        html+=`<tr><td>${idx+1}</td><td>${item}</td><td>
            <button class="edit" onclick="editTeacher(${idx})">修改</button>
            <button class="del" onclick="delTeacher(${idx})">删除</button>
        </td></tr>`;
    });
    // 修复点：原来 document.getElementById('teacherList') → 改为 teacherTableBody
    document.getElementById("teacherTableBody").innerHTML=html;
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
        <button class="edit" onclick="saveEditRoomName(${idx})">确认修改</button>
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
            <button class="edit" onclick="editRoom(${idx})">修改</button>
            <button class="del" onclick="delRoom(${idx})">删除</button>
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

function renderCourseNameSelect(){
    const courseList = getCourseData();
    // 提取用户自定义新增的课程（排除固定预置科目）
    const customNameSet = new Set();
    courseList.forEach(item=>{
        if(!FIX_COURSE_NAMES.includes(item.name)){
            customNameSet.add(item.name);
        }
    });
    const customNameArr = Array.from(customNameSet).sort();
    // 最终顺序：固定科目在前，自定义新增在后
    const allNameArr = [...FIX_COURSE_NAMES, ...customNameArr];

    let optHtml = `<option value="">请选择课程名称</option>`;
    allNameArr.forEach(name=>{
        optHtml += `<option value="${name}">${name}</option>`;
    });
    document.getElementById("courseNameSelect").innerHTML = optHtml;
}

function renderCourse(){
    const arr = getCourseData();
    const teacherList = getTeacherData();
    const roomList = getRoomData();
    const classList = getClassData();

    // 固定科目 + 末尾追加自定义课程，顺序永久不变
    const customNameSet = new Set();
    arr.forEach(item=>{
        if(!FIX_COURSE_NAMES.includes(item.name)){
            customNameSet.add(item.name);
        }
    });
    const customNameArr = Array.from(customNameSet).sort();
    const allNameArr = [...FIX_COURSE_NAMES, ...customNameArr];

    let nameOptionHtml = `<option value="">请选择课程名称</option>`;
    allNameArr.forEach(name=>{
        nameOptionHtml += `<option value="${name}">${name}</option>`;
    });

    let html="";
    arr.forEach((item,idx)=>{
        // 课程名称下拉，沿用固定排序
        let nameSelect = `<select onchange="updateCourseField(${idx},'name',this.value)" style="width:120px;padding:4px;">`;
        allNameArr.forEach(name=>{
            const selected = name === item.name ? "selected" : "";
            nameSelect += `<option value="${name}" ${selected}>${name}</option>`;
        });
        nameSelect += `</select>`;

        let tOpt = teacherList.map(t=>`<option value="${t}" ${t===item.teacher?'selected':''}>${t}</option>`).join('');
        let tSelect = `<select onchange="updateCourseField(${idx},'teacher',this.value)" style="width:120px;padding:4px;">${tOpt}</select>`;
        let rOpt = roomList.map(r=>`<option value="${r}" ${r===item.room?'selected':''}>${r}</option>`).join('');
        let rSelect = `<select onchange="updateCourseField(${idx},'room',this.value)" style="width:120px;padding:4px;">${rOpt}</select>`;
        let cOpt = classList.map(c=>`<option value="${c}" ${c===item.cls?'selected':''}>${c}</option>`).join('');
        let cSelect = `<select onchange="updateCourseField(${idx},'cls',this.value)" style="width:140px;padding:4px;">${cOpt}</select>`;

        html+=`<tr>
            <td>${idx+1}</td>
            <td>${nameSelect}</td>
            <td>${tSelect}</td>
            <td>${rSelect}</td>
            <td>${cSelect}</td>
            <td>
                <button class="del" onclick="delCourse(${idx})">删除</button>
            </td>
        </tr>`;
    });
    document.getElementById("courseList").innerHTML=html;
}

// ========== 下拉选项渲染【已修改：课程只展示当前课表绑定班级】 ==========
function renderCourseSelects(){
    let tData=getTeacherData();let rData=getRoomData();let clsData=getClassData();let cData=getCourseData();
    let s1='<option value="">选择教师</option>';tData.forEach(x=>s1+=`<option value="${x}">${x}</option>`);document.getElementById("courseTeacher").innerHTML=s1;
    let s2='<option value="">选择场地</option>';rData.forEach(x=>s2+=`<option value="${x}">${x}</option>`);document.getElementById("courseRoom").innerHTML=s2;
    let s3='<option value="">选择学员组</option>';clsData.forEach(x=>s3+=`<option value="${x}">${x}</option>`);document.getElementById("courseClass").innerHTML=s3;

    // 按当前课表绑定班级过滤课程
    const currentTable = getCurrentTableInfo();
    const bindClass = currentTable?.bindClass?.trim() || "";
    let filterCourseList = [];
    if(bindClass){
        filterCourseList = cData.filter(item => item.cls.trim() === bindClass);
    }

    let s4='<option value="">请选择课程</option>';
    if(filterCourseList.length === 0){
        s4 = '<option value="" disabled>当前班级暂无可用课程，请前往课程管理添加</option>';
    }else{
        filterCourseList.forEach(x=>{
            const valKey = `${x.name}|${x.teacher}|${x.room}|${x.cls}`;
            const showTxt = `${x.name} | 教师：${x.teacher} | 教室：${x.room} | 班级：${x.cls}`;
            const selected = valKey === lastSelectCourseValue ? "selected" : "";
            s4+=`<option value="${valKey}" ${selected}>${showTxt}</option>`;
        });
    }
    document.getElementById("courseSelect").innerHTML=s4;
}

// ========== 课表绑定班级下拉 ==========
function renderNewTableClassSelect(){
    let classList = getClassData();
    let select = document.getElementById("newTableBindClass");
    let html = '<option value="">绑定班级</option>';
    classList.forEach(c=>{
        html += `<option value="${c}">${c}</option>`;
    });
    select.innerHTML = html;
}

// ========== 课表标签渲染 ==========
function renderTableTags(){
    let select = document.getElementById("tableSelect");
    let currentNameDom = document.getElementById("currentTableName");
    if(!select) return;
    let html = "";
    if(tableList.length === 0){
        select.innerHTML = '<option value="">暂无课表</option>';
        if(currentNameDom) currentNameDom.innerText = "暂无";
        return;
    }
    tableList.forEach(t=>{
        let bindClassText = t.bindClass ? t.bindClass : "未绑定";
        let label = `${t.name}【${bindClassText}】`;
        let selected = t.id === currentTableId ? "selected" : "";
        html += `<option value="${t.id}" ${selected}>${label}</option>`;
    });
    select.innerHTML = html;
    const currTable = tableList.find(t=>t.id === currentTableId);
    if(currTable && currentNameDom){
        let bindClassText = currTable.bindClass ? currTable.bindClass : "未绑定";
        currentNameDom.innerText = `${currTable.name}【${bindClassText}】`;
    }
}
// ========== 多课表操作【新建课表自动绑定默认独立课时，互不干扰】 ==========
function addNewTable(){
    let name = document.getElementById("newTableName").value.trim();
    let bindClass = document.getElementById("newTableBindClass").value;
    if(!name){alert("请输入课表名称");return;}
    if(!bindClass){alert("请从下拉框选择绑定班级，禁止手动输入");return;}
    const existTable = tableList.find(t => t.bindClass === bindClass);
    if(existTable){
        if(!confirm(`该班级【${bindClass}】已存在课表【${existTable.name}】，是否覆盖该班级原有课表数据（仅影响本班级，其他课表完全不受影响）？`)) return;
        existTable.data = {};
        existTable.timeList = JSON.parse(JSON.stringify(DEFAULT_TIME));
        currentTableId = existTable.id;
    }else{
        let newId = "table_" + Date.now();
        tableList.push({
            id:newId,
            name:name,
            bindClass:bindClass,
            data:{},
            timeList:JSON.parse(JSON.stringify(DEFAULT_TIME))
        });
        currentTableId = newId;
    }
    saveTableList();
    renderTableTags();
    renderTime();
    renderSchedule();
    checkAllConflict();
    saveSnapshot();
    document.getElementById("newTableName").value = "";
    document.getElementById("newTableBindClass").value = "";
}

// ========== 修改绑定班级（弹窗修复） ==========
function editCurrentTableBind(){
    if(!currentTableId) return alert("暂无选中课表");
    let currTable = getCurrentTableInfo();
    if(!currTable)return;
    let classList = getClassData();
    let optionHtml = classList.map(c=>`<option value="${c}" ${c===currTable.bindClass?"selected":""}>${c}</option>`).join("");
    document.getElementById("modalTitle").innerText = "修改课表绑定班级";
    document.getElementById("modalBody").innerHTML = `
        <div style="margin:10px 0;">
            <label style="width:100px;display:inline-block;">当前课表：</label>
            <span>${currTable.name}</span>
        </div>
        <div style="margin:10px 0;">
            <label style="width:100px;display:inline-block;">绑定班级：</label>
            <select id="editBindClassSelect" style="width:200px;">${optionHtml}</select>
        </div>
    `;
    document.getElementById("modalFooter").innerHTML = `
        <button onclick="closeAutoModal()">取消</button>
        <button class="edit" onclick="saveNewBindClass()">确认修改</button>
    `;
    document.getElementById("autoModal").style.display = "block";
    window.tempEditTableId = currentTableId;
}
function saveNewBindClass(){
    const newBindClass = document.getElementById("editBindClassSelect").value;
    if(!newBindClass){
        alert("请从下拉列表选择绑定班级，禁止手动输入");
        return;
    }
    const repeatTable = tableList.find(t=>t.bindClass === newBindClass && t.id !== window.tempEditTableId);
    if(repeatTable) return alert(`班级【${newBindClass}】已绑定课表【${repeatTable.name}】，不可重复绑定`);
    let tableIndex = tableList.findIndex(t=>t.id === window.tempEditTableId);
    if(tableIndex !== -1){
        tableList[tableIndex].bindClass = newBindClass;
        saveTableList();
        renderTableTags();
        alert(`✅ 绑定班级已修改为：${newBindClass}`);
    }
    closeAutoModal();
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
    // 切换课表不重置清空模式，保留清空状态，且只作用于当前课表
    if(document.getElementById('startTimeSelect')) document.getElementById('startTimeSelect').value = '';
    if(document.getElementById('endTimeSelect')) document.getElementById('endTimeSelect').value = '';
    // 切换课表强制刷新导出下拉
    renderExportTeacherSelect();
    renderExportRoomSelect();
}

function delCurrentTable(){
    if(tableList.length <= 1){alert("至少保留一张课表");return;}
    let idx = tableList.findIndex(t=>t.id === currentTableId);
    tableList.splice(idx,1);
    saveTableList();
    currentTableId = tableList[0].id;
    renderTableTags();
    renderTime();
    renderSchedule();
    checkAllConflict();
    saveSnapshot();
}

// 开启批量清空单元格模式
function clearCell(){
    clearMode = true;
    alert("已进入批量清空模式，点击任意单元格即可连续清空；点击课程格子自动退出清空模式");
}

/**
 * 课表单元格点击事件（已完整整合原有逻辑+批量清空，修复失效问题）
 * @param {number} row 行
 * @param {number} col 列
 */
function cellClick(row, col){
    const currTable = tableList.find(item => item.id === currentTableId);
    if(!currTable) return alert("请先选择一张课表");

    // 批量清空模式：连续点击可多次清空，不会自动关闭
    if(clearMode){
        const key = `${row}_${col}`;
        delete currTable.data[key];
        renderSchedule();
        return;
    }

    // 正常排课：点击选课时自动退出清空模式
    clearMode = false;

    // 原有完整选课逻辑
    const key = row + "_" + col;
    const selectVal = lastSelectCourseValue;
    if(!selectVal){
        alert("请先在课程下拉框选择一门课程");
        return;
    }
    saveLastSelectCourse(selectVal);
    currTable.data[key] = selectVal;
    renderSchedule();
    checkAllConflict();
}
// 一键清空当前选中课表所有单元格数据
function clearAllCurrentTable(){
    if(!currentTableId){
        return alert("请先选中一张课表再操作");
    }
    if(!confirm("确定要清空当前这张课表所有课程数据吗？该操作不可撤销！")){
        return;
    }
    // 只清空当前课表，其他课表完全不受影响
    const currTable = tableList.find(t => t.id === currentTableId);
    if(currTable){
        currTable.data = {};
        renderSchedule();
        checkAllConflict();
        saveSnapshot();
        alert("当前课表已全部清空");
    }
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
    const tableData = currTable.data;
    const timeList = getTimeData();
    const weekList = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
    const tableTitle = `${currTable.name} 课程表`;

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

    // 【新增】打印居中+单页适配专属CSS，和教师/教室课表规范完全统一
    const printCSS = `
    <style type="text/css" media="print">
        @page {
            size: A4 landscape;
            margin: 7mm;
            page-break-inside: avoid;
        }
        html,body{
            margin:0;
            padding:0;
            width:100%;
            height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: hidden;
        }
        table{
            width:50% !important;
            table-layout:fixed;
            page-break-inside:avoid;
            transform: scale(0.95);
            transform-origin: center center;
        }
        tr,td{
            page-break-inside:avoid;
            overflow:hidden;
        }
    </style>
    `;

    let html = `<html><meta charset="utf-8">${printCSS}<body style="font-family:微软雅黑,宋体;margin:0;padding:0;">`;
    html += `<table border="1" cellpadding="3" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;">`;

    // 标题行（打印居中适配）
    html += `<tr>
        <td colspan="8" align="center" style="font-size:22px;font-weight:bold;padding:6px 0;background:#4472C4;color:#fff;border:#000 solid 1px;">
            ${tableTitle}
        </td>
    </tr>`;

    // 表头行
    html += `<tr style="font-size:11px;font-weight:bold;background:#D9D9D9;text-align:center;height:26px;">
        <td width="12%" style="border:#000 solid 1px;">课时/星期</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期一</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期二</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期三</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期四</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期五</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期六</td>
        <td width="12.57%" style="border:#000 solid 1px;">星期日</td>
    </tr>`;

    // 课时行
    for(let rowIdx = 0; rowIdx <= maxRow; rowIdx++){
        const timeName = timeList[rowIdx]?.name || `课时${rowIdx+1}`;
        const isRestRow = timeName.includes("午饭") || timeName.includes("晚饭");
        const bg = isRestRow ? "#F2F2F2" : "#fff";
        const h = isRestRow ? "36px" : "68px";

        if(isRestRow){
            html += `<tr style="text-align:center;vertical-align:center;height:${h};background:${bg};font-weight:bold;font-size:11px;">
                <td colspan="8" style="border:#000 solid 1px;">${timeName}</td>
            </tr>`;
        }else{
            html += `<tr style="text-align:center;vertical-align:center;height:${h};background:${bg};font-size:10px;">
                <td style="border:#000 solid 1px;">${timeName}</td>`;
            for(let colIdx=0;colIdx<7;colIdx++){
                const key = `${rowIdx}-${colIdx}`;
                const val = tableData[key];
                const cellBg = val ? "#fff" : "#F8F8F8";
                if(val){
                    const [course,teacher,room,cls,start,end] = val.split("|");
                    const content = `<span style="font-size:11px">${course}</span><br><span style="font-size:9px">教师：${teacher}<br>教室：${room}<br>${start}-${end}</span>`;
                    html += `<td style="border:#000 solid 1px;background:${cellBg};padding:2px;">${content}</td>`;
                }else{
                    html += `<td style="border:#000 solid 1px;background:${cellBg};padding:2px;"></td>`;
                }
            }
            html += `</tr>`;
        }
    }

    html += `</table></body></html>`;

    const blob = new Blob([html], {type:"application/vnd.ms-excel"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${currTable.name}_表格居中_宽度减半课表.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
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

// 1. 导出全部备份
function exportAllBackup() {
    const backupData = {
        tableList: JSON.parse(localStorage.getItem('tableList') || '[]'),
        classList: JSON.parse(localStorage.getItem('classList') || '[]'),
        teacherList: JSON.parse(localStorage.getItem('teacherList') || '[]'),
        roomList: JSON.parse(localStorage.getItem('roomList') || '[]'),
        courseList: JSON.parse(localStorage.getItem('courseList') || '[]')
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `西典排课系统_备份_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// 2. 导入恢复（和页面onclick函数名完全匹配：importAllBackup）
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
            localStorage.setItem('tableList', JSON.stringify(backupData.tableList || []));
            localStorage.setItem('classList', JSON.stringify(backupData.classList || []));
            localStorage.setItem('teacherList', JSON.stringify(backupData.teacherList || []));
            localStorage.setItem('roomList', JSON.stringify(backupData.roomList || []));
            localStorage.setItem('courseList', JSON.stringify(backupData.courseList || []));

            tableList = JSON.parse(localStorage.getItem("tableList") || '[]');
            if (tableList.length > 0) {
                currentTableId = tableList[0].id;
            }

            renderTableTags();
            renderClass();
            renderTeacher();
            renderRoom();
            renderCourse();
            renderCourseSelects();
            renderNewTableClassSelect();
            renderTime();
            renderSchedule();

            alert("✅ 全局数据导入成功，所有课表已恢复");
        } catch (err) {
            alert("❌ 备份文件格式错误，导入失败");
            console.error('全局导入异常：', err);
        }
    };
    reader.readAsText(file);
}

// 3. 重置所有数据（函数名匹配resetAllData）
function resetAllData() {
    if (!confirm('⚠️ 警告：确定要清空所有课表、班级、教师、教室、课程全部数据吗？操作后数据无法恢复！')) {
        return;
    }
    localStorage.removeItem('tableList');
    localStorage.removeItem('classList');
    localStorage.removeItem('teacherList');
    localStorage.removeItem('roomList');
    localStorage.removeItem('courseList');
    alert('✅ 所有数据已重置清空，页面即将刷新');
    location.reload();
}

// ====================== 单课表导出（仅导出当前选中这一张课表，不覆盖其他数据） ======================
function exportCurrentTableBackup() {
    if (!currentTableId) {
        return alert("请先在课表下拉框选中需要备份的课表");
    }
    const targetTable = tableList.find(item => item.id === currentTableId);
    const tableTimeArr = getTimeData();

    const singleTableBackup = {
        backupType: "singleTableBackup",
        backupTime: new Date().toLocaleString(),
        tableInfo: targetTable,
        tableTimeList: tableTimeArr
    };

    const blob = new Blob([JSON.stringify(singleTableBackup, null, 2)], {
        type: "application/json"
    });
    const aTag = document.createElement("a");
    aTag.href = URL.createObjectURL(blob);
    aTag.download = `【${targetTable.name}】课表单独备份.json`;
    aTag.click();
    URL.revokeObjectURL(aTag.href);
}

// ====================== 单课表导入（只恢复这一张课表，不影响其他数据） ======================
function importSingleTableBackup() {
    const fileInputDom = document.getElementById("allBackupFile");
    if (!fileInputDom.files.length) {
        return alert("请先点击【选择文件】，选中单课表备份的 .json 文件");
    }
    const file = fileInputDom.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (backupData.backupType !== "singleTableBackup") {
                return alert("当前不是单课表备份文件，请选择【单课表导出】的json文件");
            }

            const importTable = backupData.tableInfo;
            const importTimeList = backupData.tableTimeList;

            const existTableIndex = tableList.findIndex(t => t.bindClass === importTable.bindClass);
            if (existTableIndex > -1) {
                if (!confirm(`班级【${importTable.bindClass}】已有课表，是否覆盖？`)) return;
                tableList[existTableIndex] = importTable;
            } else {
                tableList.push(importTable);
            }

            saveTableList();
            currentTableId = importTable.id;
            saveTimeData(importTimeList);

            renderTableTags();
            renderTime();
            renderSchedule();
            renderCourseSelects();

            alert(`✅ 课表【${importTable.name}】导入成功！`);
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
    return JSON.parse(localStorage.getItem('tableList') || '[]');
}

// ===================== 【修复版】导出选中教师的课表Excel =====================
// 修复：导出选中教师课表
// 教师课表导出（完全复刻原表格式+完整内容+居中样式）
// 教师课表导出（完全复刻原表格式+完整内容+居中样式）
// 教师课表导出（完全复刻原表格式+完整内容+居中样式）
// 教师课表导出（完全复刻原表格式+完整内容+居中样式）
function exportSelectedTeacherSchedule() {
    const selectedTeacher = document.getElementById('exportTeacherSelect').value.trim();
    if (!selectedTeacher) return alert('请先选择教师');
    const allTableList = getTableList();
    if (allTableList.length === 0) return alert('暂无课表数据');

    // 收集所有唯一课时
    const timeMap = new Map();
    allTableList.forEach(table => {
        table.timeList.forEach(item => {
            if (!timeMap.has(item.name)) timeMap.set(item.name, item);
        });
    });
    const allTimeList = Array.from(timeMap.values());

    // 构建HTML表格（时间栏缩窄优化版）
    let html = `
    <html>
    <meta charset="utf-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 微软雅黑, 宋体;
        }
        table {
            border-collapse: collapse;
            width: 800px !important;
            table-layout: fixed !important;
        }
        td {
            border: 1px solid #000;
            padding: 3px 1px; /* 内边距进一步压缩，减少留白 */
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
        }

        /* A4横向单页打印强制适配 */
        @page {
            size: A4 landscape;
            margin: 7mm; /* 页边距再压缩，适配更窄表格 */
            page-break-inside: avoid;
        }
        @media print {
            html, body {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            table {
                width: 100% !important;
                transform: scale(0.95); /* 缩放微调，保证单页 */
                transform-origin: top center;
                page-break-after: avoid;
                page-break-before: avoid;
                page-break-inside: avoid;
            }
            tr, td {
                page-break-inside: avoid;
            }
        }
    </style>
    <body>
    <table>
    `;

    // 标题行
    html += `
    <tr>
        <td colspan="8" style="font-size:22px;font-weight:bold;background:#4472C4;color:#fff;height:45px;">
            ${selectedTeacher} 教师课程表
        </td>
    </tr>
    `;

    // 表头行（重点缩窄第一列时间栏）
    html += `
    <tr style="font-size:11px;font-weight:bold;background:#D9D9D9;height:30px;">
        <td width="65px">课时/星期</td> <!-- 第一列从80px缩至65px -->
        <td width="105px">星期一</td> <!-- 星期列适配调整，7列总宽735px -->
        <td width="105px">星期二</td>
        <td width="105px">星期三</td>
        <td width="105px">星期四</td>
        <td width="105px">星期五</td>
        <td width="105px">星期六</td>
        <td width="105px">星期日</td>
    </tr>
    `;

    // 课时行（行高压缩至55px）
    allTimeList.forEach(timeItem => {
        const timeName = timeItem.name;
        if (timeName.includes('午饭') || timeName.includes('晚饭')) {
            html += `
            <tr>
                <td colspan="8" style="font-size:11px;font-weight:bold;background:#F2F2F2;height:25px;">
                    ${timeName}
                </td>
            </tr>
            `;
            return;
        }

        html += `<tr style="height:55px;font-size:10px;">`; <!-- 行高从60px缩至55px -->
        html += `<td>${timeName}</td>`;
        for (let week = 0; week < 7; week++) {
            let cellContent = '';
            allTableList.forEach(table => {
                const rowIdx = table.timeList.findIndex(t => t.name === timeName);
                if (rowIdx === -1) return;
                const key = `${rowIdx}-${week}`;
                const val = table.data[key];
                if (!val) return;
                const [course, tea, room, cls, st, et] = val.split('|');
                if (tea === selectedTeacher && cellContent === '') {
                    cellContent = `${course}<br>班级：${cls}<br>教师：${tea}<br>教室：${room}<br>${st}-${et}`;
                }
            });
            html += `<td>${cellContent}</td>`;
        }
        html += `</tr>`;
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedTeacher}_教师课表.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function exportSelectedRoomSchedule() {
    const selectedRoom = document.getElementById('exportRoomSelect').value.trim();
    if (!selectedRoom) return alert('请先选择教室');
    const allTableList = getTableList();
    if (allTableList.length === 0) return alert('暂无课表数据');

    const timeMap = new Map();
    allTableList.forEach(table => {
        table.timeList.forEach(item => {
            if (!timeMap.has(item.name)) timeMap.set(item.name, item);
        });
    });
    const allTimeList = Array.from(timeMap.values());

    let html = `
    <html>
    <meta charset="utf-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 微软雅黑, 宋体;
        }
        table {
            border-collapse: collapse;
            width: 800px !important;
            table-layout: fixed !important;
        }
        td {
            border: 1px solid #000;
            padding: 3px 1px;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
        }

        @page {
            size: A4 landscape;
            margin: 7mm;
            page-break-inside: avoid;
        }
        @media print {
            html, body {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            table {
                width: 100% !important;
                transform: scale(0.95);
                transform-origin: top center;
                page-break-after: avoid;
                page-break-before: avoid;
                page-break-inside: avoid;
            }
            tr, td {
                page-break-inside: avoid;
            }
        }
    </style>
    <body>
    <table>
    `;

    html += `
    <tr>
        <td colspan="8" style="font-size:22px;font-weight:bold;background:#4472C4;color:#fff;height:45px;">
            ${selectedRoom} 教室占用表
        </td>
    </tr>
    `;

    html += `
    <tr style="font-size:11px;font-weight:bold;background:#D9D9D9;height:30px;">
        <td width="65px">课时/星期</td>
        <td width="105px">星期一</td>
        <td width="105px">星期二</td>
        <td width="105px">星期三</td>
        <td width="105px">星期四</td>
        <td width="105px">星期五</td>
        <td width="105px">星期六</td>
        <td width="105px">星期日</td>
    </tr>
    `;

    allTimeList.forEach(timeItem => {
        const timeName = timeItem.name;
        if (timeName.includes('午饭') || timeName.includes('晚饭')) {
            html += `
            <tr>
                <td colspan="8" style="font-size:11px;font-weight:bold;background:#F2F2F2;height:25px;">
                    ${timeName}
                </td>
            </tr>
            `;
            return;
        }

        html += `<tr style="height:55px;font-size:10px;">`;
        html += `<td>${timeName}</td>`;
        for (let week = 0; week < 7; week++) {
            let cellContent = '';
            allTableList.forEach(table => {
                const rowIdx = table.timeList.findIndex(t => t.name === timeName);
                if (rowIdx === -1) return;
                const key = `${rowIdx}-${week}`;
                const val = table.data[key];
                if (!val) return;
                const [course, tea, room, cls, st, et] = val.split('|');
                if (room === selectedRoom && cellContent === '') {
                    cellContent = `${course}<br>班级：${cls}<br>教师：${tea}<br>${st}-${et}`;
                }
            });
            html += `<td>${cellContent}</td>`;
        }
        html += `</tr>`;
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedRoom}_教室占用表.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
}
// 渲染导出教师下拉框
function renderExportTeacherSelect() {
    const selectEl = document.getElementById('exportTeacherSelect');
    if (!selectEl) return;
    const teacherArr = JSON.parse(localStorage.getItem('teacherList') || '[]');
    selectEl.innerHTML = '<option value="">请选择教师</option>';
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
    const roomArr = JSON.parse(localStorage.getItem('roomList') || '[]');
    selectEl.innerHTML = '<option value="">请选择教室</option>';
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
};
const originalDelTeacher = delTeacher;
delTeacher = function(id) {
    originalDelTeacher(id);
    setTimeout(renderExportTeacherSelect, 100);
};

// 新增删除教室后自动刷新下拉
const originalAddRoom = addRoom;
addRoom = function() {
    originalAddRoom();
    setTimeout(renderExportRoomSelect, 100);
};
const originalDelRoom = delRoom;
delRoom = function(id) {
    originalDelRoom(id);
    setTimeout(renderExportRoomSelect, 100);
};

// 页面加载兜底渲染
setTimeout(() => {
    renderExportTeacherSelect();
    renderExportRoomSelect();
}, 300);