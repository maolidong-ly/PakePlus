// ========== 视图切换（仅保留班级/教师/教室三种视图，移除排课模式切换） ==========
function switchView(view){
    currentView = view;
    renderSchedule();
    checkAllConflict();
}

function escapeScheduleHtml(text){
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function scheduleCellShowLabel(info){
    if(!info) return '';
    if(currentView === 'classView'){
        return (typeof displayCourseName === 'function' ? displayCourseName(info.name) : info.name);
    }
    if(currentView === 'teacherView') return info.teacher;
    return (typeof displayLocaleText === 'function' ? displayLocaleText(info.room) : info.room);
}

/** 按名称排序取色时，前若干门课也要色相分散：蓝→橙→绿→紫→红→黄…（避免前 6 门全是粉紫） */
const SCHEDULE_COURSE_PALETTE = [
    { h: 210, s: 62, l: 58 },
    { h: 28,  s: 72, l: 54 },
    { h: 136, s: 58, l: 52 },
    { h: 278, s: 58, l: 58 },
    { h: 352, s: 66, l: 56 },
    { h: 50,  s: 70, l: 52 },
    { h: 188, s: 58, l: 52 },
    { h: 318, s: 62, l: 56 },
    { h: 165, s: 54, l: 50 },
    { h: 95,  s: 56, l: 54 },
    { h: 245, s: 58, l: 58 },
    { h: 305, s: 60, l: 56 }
];
let _scheduleCourseColorMap = new Map();
function hashCourseNameForColor(name){
    const s = String(name || '');
    let h = 5381;
    for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
}
function rebuildScheduleCourseColorMap(schedule){
    const names = new Set();
    if(typeof getCourseData === 'function'){
        try{
            getCourseData().forEach(function(c){
                if(c && c.name) names.add(c.name);
            });
        }catch(e){}
    }
    if(schedule && typeof schedule === 'object'){
        Object.keys(schedule).forEach(function(key){
            const cKey = schedule[key];
            if(!cKey) return;
            const info = getCourseInfo(cKey);
            if(info && info.name) names.add(info.name);
        });
    }
    const sorted = Array.from(names).sort(function(a, b){
        return String(a).localeCompare(String(b), 'zh-CN');
    });
    const map = new Map();
    sorted.forEach(function(name, i){
        map.set(name, SCHEDULE_COURSE_PALETTE[i % SCHEDULE_COURSE_PALETTE.length]);
    });
    _scheduleCourseColorMap = map;
}
function scheduleCourseBackgroundColor(courseName){
    if(!courseName) return '';
    if(!_scheduleCourseColorMap.size && typeof getCurrentTableData === 'function'){
        rebuildScheduleCourseColorMap(getCurrentTableData());
    }
    const light = typeof document !== 'undefined' && document.body && document.body.classList.contains('light-mode');
    let slot = _scheduleCourseColorMap.get(courseName);
    if(!slot){
        const fb = SCHEDULE_COURSE_PALETTE[hashCourseNameForColor(courseName) % SCHEDULE_COURSE_PALETTE.length];
        slot = fb;
    }
    const sat = light ? slot.s : Math.max(48, slot.s - 6);
    const lit = light ? slot.l : Math.max(44, slot.l - 4);
    const alpha = light ? 0.28 : 0.3;
    return `hsla(${slot.h}, ${sat}%, ${lit}%, ${alpha})`;
}
function buildScheduleCellStyle(info, isConflict){
    const parts = [];
    if(info && info.name){
        parts.push('--course-cell-bg:' + scheduleCourseBackgroundColor(info.name));
    }
    if(isConflict){
        parts.push('color:red', 'font-weight:bold');
    }
    return parts.join(';');
}
function applyScheduleCellCourseTint(cell, cKey){
    if(!cell) return;
    const info = getCourseInfo(cKey);
    if(info && info.name){
        cell.style.setProperty('--course-cell-bg', scheduleCourseBackgroundColor(info.name));
        cell.dataset.courseName = info.name;
    }else{
        cell.style.removeProperty('--course-cell-bg');
        delete cell.dataset.courseName;
    }
}

function buildScheduleCellInnerHtml(cKey, rowIdx, timeArr){
    const info = getCourseInfo(cKey);
    if(!info) return '';
    const label = scheduleCellShowLabel(info);
    const times = typeof parseCellAssignmentTimes === 'function'
        ? parseCellAssignmentTimes(cKey, timeArr, rowIdx)
        : null;
    const timeStr = times ? `${times.start}–${times.end}` : '';
    const safeLabel = escapeScheduleHtml(label);
    const safeTime = escapeScheduleHtml(timeStr);
    if(!timeStr) return `<span class="sched-cell-main">${safeLabel}</span>`;
    return `<span class="sched-cell-main">${safeLabel}</span><span class="sched-cell-time">${safeTime}</span>`;
}

// ========== 课表表格渲染（读取当前选中课表的独立课时，冲突单元格红色加粗） ==========
function renderSchedule(){
    if(!currentTableId){
        document.querySelector("#scheduleTable tbody").innerHTML = '<tr><td colspan="8" style="color:#ef4444;text-align:center;padding:30px;font-size:16px;">' + (typeof t==='function'?t('msg.emptySchedule'):'暂无课表，请打开课表模板编辑器同步课表后再进行排课操作') + '</td></tr>';
        document.getElementById("conflictTip").innerText = "";
        return;
    }
    if(typeof sanitizeCurrentTableScheduleData === 'function') sanitizeCurrentTableScheduleData();
    let schedule=getCurrentTableData();
    rebuildScheduleCourseColorMap(schedule);
    let timeArr=getTimeData();
    let tbody=document.querySelector("#scheduleTable tbody");
    let html="";
    const currentConflictSet = new Set();
    if(window.globalConflictList){
        window.globalConflictList.forEach(item=>{
            const [tableId, cellKey] = item.cellKey.split('|');
            if(tableId === currentTableId) currentConflictSet.add(cellKey);
        });
    }

    for(let tIdx=0;tIdx<timeArr.length;tIdx++){
        const timeItem = timeArr[tIdx];
        const timeStr = timeItem.name;
        const timeDisplay = escapeScheduleHtml(typeof displayPeriodLabel==='function'?displayPeriodLabel(timeStr):timeStr);
        const isSplitRow = timeItem.isSplit;
        if(isSplitRow){
            html += `<tr class="split-row">
                <td colspan="8">${timeDisplay}</td>
            </tr>`;
        }else{
            html+=`<tr><td>${timeDisplay}</td>`;
            for(let w=0;w<weekCount;w++){
                let key=`${tIdx}-${w}`;
                let cKey=schedule[key]||"";
                let info=getCourseInfo(cKey);
                const isConflict = currentConflictSet.has(key);
                let style = buildScheduleCellStyle(info, isConflict);
                if(!info){
                    html+=`<td data-key="${key}" onclick="clickCell(this)" style="${style}"></td>`;
                    continue;
                }
                const cellInner = buildScheduleCellInnerHtml(cKey, tIdx, timeArr);
                const courseAttr = info.name ? ` data-course-name="${String(info.name).replace(/"/g, '&quot;')}"` : '';
                html+=`<td class="has-course" data-key="${key}"${courseAttr} onclick="clickCell(this)" style="${style}">${cellInner}</td>`;
            }
            html+="</tr>";
        }
    }
    tbody.innerHTML=html;
}

// ========== 连续清空单元格模式 ==========
let clearMode = false;

function enterClearCellMode(){
    if(!currentTableId) return alert(typeof t==="function"?t("msg.noTable"):"暂无选中课表");
    clearMode = true;
    alert(typeof t==="function"?t("msg.clearMode"):"已进入连续清空模式：点击单元格即可清除内容；点击排课设置中的【课程】下拉框后退出");
}

function exitClearCellMode(){
    clearMode = false;
}

function clearCell(){
    enterClearCellMode();
}

function paintScheduleCell(cell, cKey){
    if(!cell) return;
    const key = cell.dataset.key || '';
    const rowIdx = parseInt(String(key).split('-')[0], 10);
    const timeArr = getTimeData();
    const info = getCourseInfo(cKey);
    if(info){
        cell.innerHTML = buildScheduleCellInnerHtml(cKey, rowIdx, timeArr);
        cell.classList.add('has-course');
        applyScheduleCellCourseTint(cell, cKey);
    }else{
        cell.innerHTML = '';
        cell.classList.remove('has-course');
        applyScheduleCellCourseTint(cell, '');
    }
    cell.style.color = '';
    cell.style.fontWeight = '';
}

// ========== 单元格操作 ==========
function clickCell(cell){
    if(typeof canEditData === 'function' && !canEditData()){
        return alert(typeof t==='function'?t('msg.readonlyNoEdit'):'当前账号为只读，无法排课。请使用编辑或管理员账号登录。');
    }
    if(!currentTableId) return alert(typeof t==="function"?t("msg.noTable"):"暂无选中课表，无法排课");

    const key = cell.dataset.key;

    if(clearMode){
        const schedule = getCurrentTableData();
        delete schedule[key];
        saveCurrentTableData(schedule);
        saveSnapshot();
        rebuildScheduleCourseColorMap(schedule);
        paintScheduleCell(cell, '');
        if(typeof scheduleConflictCheckSoon === 'function') scheduleConflictCheckSoon();
        else checkAllConflict();
        return;
    }

    activeCell=cell;
    // 课时模版中已写好的时间：未手动指定时自动识别；手动选过起止时间则优先生效（任意课表通用）
    const [rowIdx] = key.split('-').map(Number);
    const timeArr = getTimeData();
    const timeStr = timeArr[rowIdx]?.name || "";
    if(typeof applyPeriodTimeToSelects === 'function'){
        applyPeriodTimeToSelects(timeStr, false);
    }else{
        const timeMatch = typeof parsePeriodTimeRange === 'function'
            ? parsePeriodTimeRange(timeStr)
            : null;
        if(timeMatch){
            document.getElementById("startTimeSelect").value = timeMatch.start;
            document.getElementById("endTimeSelect").value = timeMatch.end;
        }
    }

    // 读取课程与起止时间（手动选择或课时自动识别）
    const selectVal = document.getElementById("courseSelect").value;
    const startTime = document.getElementById("startTimeSelect").value;
    const endTime = document.getElementById("endTimeSelect").value;

    // 基础校验
    if(!selectVal) return alert(typeof t==="function"?t("msg.selectCourseFirst"):"请先选择课程");
    if(!validTimeRange(startTime, endTime)) return;

    // 直接使用下拉中的时间存储，脱离行文本依赖
    const saveVal = `${selectVal}|${startTime}|${endTime}`;

    let schedule = getCurrentTableData();
    schedule[key] = saveVal;
    saveCurrentTableData(schedule);
    saveSnapshot();
    rebuildScheduleCourseColorMap(schedule);

    // 只更新当前格，冲突检测延后合并执行，避免 200 张课表时连点卡顿
    paintScheduleCell(cell, saveVal);
    if(typeof scheduleConflictCheckSoon === 'function') scheduleConflictCheckSoon();
    else checkAllConflict();
}