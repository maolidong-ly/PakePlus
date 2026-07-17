// ========== 视图切换（仅保留班级/教师/教室三种视图，移除排课模式切换） ==========
function switchView(view){
    currentView = view;
    renderSchedule();
    checkAllConflict();
}

// ========== 课表表格渲染（读取当前选中课表的独立课时，冲突单元格红色加粗） ==========
function renderSchedule(){
    if(!currentTableId){
        document.querySelector("#scheduleTable tbody").innerHTML = '<tr><td colspan="8" style="color:#ef4444;text-align:center;padding:30px;font-size:16px;">' + (typeof t==='function'?t('msg.emptySchedule'):'暂无课表，请打开课表模板编辑器同步课表后再进行排课操作') + '</td></tr>';
        document.getElementById("conflictTip").innerText = "";
        return;
    }
    let schedule=getCurrentTableData();
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
        const timeDisplay = (typeof displayPeriodLabel==='function'?displayPeriodLabel(timeStr):timeStr);
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
                let showText="";
                let info=getCourseInfo(cKey);
                let style = "";
                if(currentConflictSet.has(key)){
                    style = 'color:red;font-weight:bold;';
                }
                if(!info){
                    html+=`<td data-key="${key}" onclick="clickCell(this)" style="${style}"></td>`;
                    continue;
                }
                // 仅保留三种视图展示逻辑（显示名可英文化，存储值不变）
                if(currentView==="classView"){
                    showText = (typeof displayCourseName==='function'?displayCourseName(info.name):info.name);
                }else if(currentView==="teacherView"){
                    showText = info.teacher;
                }else if(currentView=="roomView"){
                    showText = (typeof displayLocaleText==='function'?displayLocaleText(info.room):info.room);
                }
                
                html+=`<td data-key="${key}" onclick="clickCell(this)" style="${style}">${showText}</td>`;
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
    const info = getCourseInfo(cKey);
    let showText = '';
    if(info){
        if(currentView === 'classView'){
            showText = (typeof displayCourseName==='function'?displayCourseName(info.name):info.name);
        }else if(currentView === 'teacherView'){
            showText = info.teacher;
        }else{
            showText = (typeof displayLocaleText==='function'?displayLocaleText(info.room):info.room);
        }
    }
    cell.textContent = showText;
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

    // 只更新当前格，冲突检测延后合并执行，避免 200 张课表时连点卡顿
    paintScheduleCell(cell, saveVal);
    if(typeof scheduleConflictCheckSoon === 'function') scheduleConflictCheckSoon();
    else checkAllConflict();
}