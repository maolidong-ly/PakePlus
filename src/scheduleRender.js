// ========== 视图切换（仅保留班级/教师/教室三种视图，移除排课模式切换） ==========
function switchView(view){
    currentView = view;
    renderSchedule();
    checkAllConflict();
}

// ========== 课表表格渲染（读取当前选中课表的独立课时，冲突单元格红色加粗） ==========
function renderSchedule(){
    if(!currentTableId){
        document.querySelector("#scheduleTable tbody").innerHTML = '<tr><td colspan="8" style="color:#ef4444;text-align:center;padding:30px;font-size:16px;">暂无课表，请打开课表模板编辑器同步课表后再进行排课操作</td></tr>';
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
        const isSplitRow = timeItem.isSplit;
        if(isSplitRow){
            html += `<tr class="split-row">
                <td colspan="8" style="text-align:center;background:#f5f7fa;font-weight:500;color:#333;border-top:1px solid #ccc;">${timeStr}</td>
            </tr>`;
        }else{
            html+=`<tr><td>${timeStr}</td>`;
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
                // 仅保留三种视图展示逻辑
                if(currentView==="classView")showText=info.name;
                else if(currentView==="teacherView")showText=info.teacher;
                else if(currentView=="roomView")showText=info.room;
                
                html+=`<td data-key="${key}" onclick="clickCell(this)" style="${style}">${showText}</td>`;
            }
            html+="</tr>";
        }
    }
    tbody.innerHTML=html;
}

// ========== 单元格操作 ==========
function clickCell(cell){
    if(!currentTableId) return alert("暂无选中课表，无法排课");
    activeCell=cell;
    const key = cell.dataset.key;
    // 【优化：点击单元格自动预填充当前行默认时间段，不用每次手动选择】
    const [rowIdx] = key.split('-').map(Number);
    const timeArr = getTimeData();
    const timeStr = timeArr[rowIdx]?.name || "";
    const timeMatch = timeStr.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    if(timeMatch){
        document.getElementById("startTimeSelect").value = timeMatch[1];
        document.getElementById("endTimeSelect").value = timeMatch[2];
    }

    // 读取课程与自动填充的起止时间
    const selectVal = document.getElementById("courseSelect").value;
    const startTime = document.getElementById("startTimeSelect").value;
    const endTime = document.getElementById("endTimeSelect").value;

    // 基础校验
    if(!selectVal) return alert("请先选择课程");
    if(!validTimeRange(startTime, endTime)) return;

    // 直接使用下拉中的时间存储，脱离行文本依赖
    const saveVal = `${selectVal}|${startTime}|${endTime}`;

    let schedule = getCurrentTableData();
    schedule[key] = saveVal;
    saveCurrentTableData(schedule);
    saveSnapshot();

    // 【关键】不清空课程，实现连续排课不用重复选
    // document.getElementById("courseSelect").value = "";

    renderSchedule();
    checkAllConflict();
}

function clearCell(){
    if(!currentTableId) return alert("暂无选中课表");
    if(!activeCell)return alert("请先点击单元格");
    let key=activeCell.dataset.key;
    let schedule=getCurrentTableData();
    schedule[key]="";
    saveCurrentTableData(schedule);
    saveSnapshot();
    renderSchedule();
    checkAllConflict();
}