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

// 全局变量挂载window（仅保留手动排课必需全局变量，移除自动排课模式变量）
window.currentView = "classView";
window.activeCell = null;
window.tableList = [];
window.currentTableId = "";
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
            timeList: table.timeList ? table.timeList : JSON.parse(JSON.stringify(DEFAULT_TIME))
        }
    });
    
    if(tableList.length > 0){
        currentTableId = tableList[0].id;
    }
    saveSnapshot();
}

function saveTableList(){
    localStorage.multiTableData = JSON.stringify(tableList);
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
function saveClassData(arr){localStorage.classList = JSON.stringify(arr);}

function getTeacherData(){return JSON.parse(localStorage.teacherList);}
function saveTeacherData(arr){localStorage.teacherList = JSON.stringify(arr);}

function getRoomData(){return JSON.parse(localStorage.roomList);}
function saveRoomData(arr){localStorage.roomList = JSON.stringify(arr);}

function getCourseData(){return JSON.parse(localStorage.courseList);}
function saveCourseData(arr){localStorage.courseList = JSON.stringify(arr);}

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

// ========== 仅导出【当前课表】的课时备份（Tauri适配） ==========
async function exportTimeBackup(){
    const table = getCurrentTableInfo();
    const jsonStr = JSON.stringify(table.timeList,null,2);
    const blob = new Blob([jsonStr],{type:"application/json"});
    const fileName = `${table.name}_课时备份_${new Date().getTime()}.json`;
    const ok = await saveFileByTauri(fileName, blob);
    if(ok){
        alert("✅ 当前课表课时数据导出完成，仅备份本班级课时，不会影响其他课表");
    }
}

// 导入课时：仅覆盖当前选中课表的课时，不影响全局、其他班级
function importTimeBackup(){
    const file = document.getElementById("timeBackupFile").files[0];
    if(!file) return alert("请选择备份文件");
    const reader = new FileReader();
    reader.onload = e=>{
        try{
            const arr = JSON.parse(e.target.result);
            const fixArr = arr.map(item=>typeof item==='string'?{name:item,isSplit:false}:item);
            const table = getCurrentTableInfo();
            table.timeList = fixArr;
            saveTableList();
            renderTime();
            renderSchedule();
            checkAllConflict();
            alert("✅ 仅当前选中课表课时导入成功，其他班级课表结构不受影响");
        }catch(err){
            alert("❌ 文件格式错误，请选择正确的课时备份JSON文件");
        }
    };
    reader.readAsText(file);
}

// 班级模块备份 Tauri适配
async function exportClassBackup(){
    const data = localStorage.classList;
    const blob = new Blob([data],{type:"application/json"});
    const fileName = `班级学员组备份_${new Date().getTime()}.json`;
    const ok = await saveFileByTauri(fileName, blob);
    if(ok) alert("✅ 班级数据导出完成");
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

// 教师模块备份 Tauri适配
async function exportTeacherBackup(){
    const data = localStorage.teacherList;
    const blob = new Blob([data],{type:"application/json"});
    const fileName = `教师数据备份_${new Date().getTime()}.json`;
    const ok = await saveFileByTauri(fileName, blob);
    if(ok) alert("✅ 教师数据导出完成");
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

// 教室模块备份 Tauri适配
async function exportRoomBackup(){
    const data = localStorage.roomList;
    const blob = new Blob([data],{type:"application/json"});
    const fileName = `教室场地备份_${new Date().getTime()}.json`;
    const ok = await saveFileByTauri(fileName, blob);
    if(ok) alert("✅ 教室数据导出完成");
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

// 课程模块备份 Tauri适配
async function exportCourseBackup(){
    const data = localStorage.courseList;
    const blob = new Blob([data],{type:"application/json"});
    const fileName = `课程数据备份_${new Date().getTime()}.json`;
    const ok = await saveFileByTauri(fileName, blob);
    if(ok) alert("✅ 课程数据导出完成");
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