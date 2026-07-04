// ========== 教师 / 教室 占用与空余查询 ==========

const OCC_WEEK_LABELS = ['周一','周二','周三','周四','周五','周六','周日'];
let occQueryType = 'teacher';
let occTeacherAll = [];
let occRoomAll = [];

function setOccQueryType(type){
    occQueryType = type;
    document.querySelectorAll('.occ-type-btn').forEach(btn=>{
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    const teacherWrap = document.getElementById('occTeacherWrap');
    const roomWrap = document.getElementById('occRoomWrap');
    if(teacherWrap) teacherWrap.style.display = type === 'teacher' ? 'flex' : 'none';
    if(roomWrap) roomWrap.style.display = type === 'room' ? 'flex' : 'none';
    renderOccupancyQuery();
}

function getOccScope(){
    const el = document.querySelector('input[name="occScope"]:checked');
    return el ? el.value : 'all';
}

function collectAllAssignments(scope){
    const list = [];
    tableList.forEach(tableItem=>{
        if(scope === 'current' && tableItem.id !== currentTableId) return;
        const timeArr = tableItem.timeList || [];
        Object.keys(tableItem.data || {}).forEach(cellKey=>{
            const [rowIdx, weekIdx] = cellKey.split('-').map(Number);
            const cellStr = tableItem.data[cellKey];
            if(!cellStr) return;
            const parsed = typeof parseCellAssignment === 'function'
                ? parseCellAssignment(cellStr, timeArr, rowIdx)
                : null;
            if(!parsed?.info) return;
            list.push({
                tableId: tableItem.id,
                tableName: tableItem.name,
                bindClass: tableItem.bindClass || '',
                weekIdx,
                rowIdx,
                start: parsed.startTime,
                end: parsed.endTime,
                teacher: parsed.info.teacher,
                room: parsed.info.room,
                courseName: parsed.info.name,
                cls: parsed.info.cls,
                label: `${parsed.info.name} · ${parsed.info.cls}`
            });
        });
    });
    return list;
}

function collectReferenceSlots(scope){
    const slotMap = new Map();
    const addSlot = (start, end, label)=>{
        if(!start || !end) return;
        const key = `${start}-${end}`;
        if(!slotMap.has(key)) slotMap.set(key, { start, end, label: label || `${start}-${end}` });
    };

    const tables = scope === 'current' && currentTableId
        ? tableList.filter(t => t.id === currentTableId)
        : tableList;

    tables.forEach(table=>{
        (table.timeList || []).forEach(item=>{
            if(item.isSplit) return;
            const m = item.name.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
            if(m) addSlot(m[1], m[2], item.name);
        });
    });

    if(slotMap.size === 0){
        DEFAULT_TIME.forEach(item=>{
            if(item.isSplit) return;
            const m = item.name.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
            if(m) addSlot(m[1], m[2], item.name);
        });
    }

    return Array.from(slotMap.values()).sort((a, b)=> timeToMin(a.start) - timeToMin(b.start));
}

function findAssignmentsInSlot(assignments, target, type, weekIdx, slot){
    return assignments.filter(a=>{
        if(a.weekIdx !== weekIdx) return false;
        if(type === 'teacher' && a.teacher !== target) return false;
        if(type === 'room' && a.room !== target) return false;
        return isTimeOverlap(a.start, a.end, slot.start, slot.end);
    });
}

function renderOccupancyQuery(){
    const gridWrap = document.getElementById('occGridWrap');
    const summaryEl = document.getElementById('occSummary');
    if(!gridWrap) return;

    const type = occQueryType;
    const target = type === 'teacher'
        ? document.getElementById('occTeacherSelect')?.value
        : document.getElementById('occRoomSelect')?.value;
    const scope = getOccScope();

    if(!target){
        gridWrap.innerHTML = '<div class="occ-empty">请选择' + (type === 'teacher' ? '教师' : '教室') + '查看占用情况</div>';
        if(summaryEl){
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
        }
        return;
    }

    const assignments = collectAllAssignments(scope);
    const filtered = assignments.filter(a => type === 'teacher' ? a.teacher === target : a.room === target);
    const slots = collectReferenceSlots(scope);

    let busyCount = 0;
    let freeCount = 0;
    let html = '<table class="occ-grid"><thead><tr><th>时段</th>';
    OCC_WEEK_LABELS.forEach(w => { html += `<th>${w}</th>`; });
    html += '</tr></thead><tbody>';

    slots.forEach(slot=>{
        html += `<tr><td class="occ-time-col">${escCourseHtml(slot.label)}</td>`;
        for(let w = 0; w < weekCount; w++){
            const hits = findAssignmentsInSlot(filtered, target, type, w, slot);
            if(hits.length > 0){
                busyCount++;
                const detail = hits.map(h =>
                    `<div class="occ-busy-item"><strong>${escCourseHtml(h.courseName)}</strong><span>${escCourseHtml(h.bindClass || h.cls)}</span><span class="occ-meta">${escCourseHtml(h.start)}-${escCourseHtml(h.end)} · ${escCourseHtml(h.tableName)}</span></div>`
                ).join('');
                html += `<td class="occ-cell occ-busy">${detail}</td>`;
            }else{
                freeCount++;
                html += `<td class="occ-cell occ-free"><span class="occ-free-tag">空闲</span><span class="occ-meta">${escCourseHtml(slot.start)}-${escCourseHtml(slot.end)}</span></td>`;
            }
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    gridWrap.innerHTML = html;

    const tableSet = new Set(filtered.map(f => f.tableName));
    const targetLabel = type === 'teacher' ? `教师【${target}】` : `教室【${target}】`;
    const scopeLabel = scope === 'current' ? '当前课表' : '全部课表';
    if(summaryEl){
        summaryEl.innerHTML = `
            <span class="occ-stat"><strong>${targetLabel}</strong></span>
            <span class="occ-stat">${scopeLabel}</span>
            <span class="occ-stat occ-stat-busy">占用 ${busyCount} 格</span>
            <span class="occ-stat occ-stat-free">空余 ${freeCount} 格</span>
            <span class="occ-stat">共 ${filtered.length} 条排课 · ${tableSet.size} 张课表</span>
        `;
        summaryEl.style.display = '';
    }
}

function initOccupancyQueryPanel(){
    const teacherSel = document.getElementById('occTeacherSelect');
    const roomSel = document.getElementById('occRoomSelect');
    if(!teacherSel || !roomSel) return;

    occTeacherAll = JSON.parse(localStorage.getItem('teacherList') || '[]');
    occRoomAll = JSON.parse(localStorage.getItem('roomList') || '[]');
    filterOccTeacherOptions(true);
    filterOccRoomOptions(true);
    setOccQueryType(occQueryType);
}

function filterOccTeacherOptions(keepValue){
    const sel = document.getElementById('occTeacherSelect');
    const kw = (document.getElementById('occTeacherSearch')?.value || '').trim().toLowerCase();
    const prev = keepValue ? sel?.value : '';
    if(!sel) return;
    const list = kw ? occTeacherAll.filter(t => t.toLowerCase().includes(kw)) : occTeacherAll;
    let html = '<option value="">选择教师</option>';
    list.forEach(t => { html += `<option value="${escCourseHtml(t)}">${escCourseHtml(t)}</option>`; });
    sel.innerHTML = html;
    if(prev && list.includes(prev)) sel.value = prev;
}

function filterOccRoomOptions(keepValue){
    const sel = document.getElementById('occRoomSelect');
    const kw = (document.getElementById('occRoomSearch')?.value || '').trim().toLowerCase();
    const prev = keepValue ? sel?.value : '';
    if(!sel) return;
    const list = kw ? occRoomAll.filter(r => r.toLowerCase().includes(kw)) : occRoomAll;
    let html = '<option value="">选择教室</option>';
    list.forEach(r => { html += `<option value="${escCourseHtml(r)}">${escCourseHtml(r)}</option>`; });
    sel.innerHTML = html;
    if(prev && list.includes(prev)) sel.value = prev;
}

function renderOccupancyFreeList(){
    const listEl = document.getElementById('occFreeList');
    if(!listEl) return;

    const type = occQueryType;
    const target = type === 'teacher'
        ? document.getElementById('occTeacherSelect')?.value
        : document.getElementById('occRoomSelect')?.value;
    if(!target){
        listEl.innerHTML = '';
        return;
    }

    const scope = getOccScope();
    const assignments = collectAllAssignments(scope).filter(a =>
        type === 'teacher' ? a.teacher === target : a.room === target
    );
    const slots = collectReferenceSlots(scope);
    const freeItems = [];

    slots.forEach(slot=>{
        for(let w = 0; w < weekCount; w++){
            const hits = findAssignmentsInSlot(assignments, target, type, w, slot);
            if(hits.length === 0){
                freeItems.push(`${OCC_WEEK_LABELS[w]} ${slot.start}-${slot.end}`);
            }
        }
    });

    if(freeItems.length === 0){
        listEl.innerHTML = '<div class="occ-empty">当前范围内无空余时段</div>';
        return;
    }
    listEl.innerHTML = '<div class="occ-free-chips">' + freeItems.map(t =>
        `<span class="occ-free-chip">${escCourseHtml(t)}</span>`
    ).join('') + '</div>';
}

function renderOccupancyPage(){
    initOccupancyQueryPanel();
    renderOccupancyQuery();
    renderOccupancyFreeList();
}

// 查询变更时同步刷新列表
function onOccQueryChange(){
    renderOccupancyQuery();
    renderOccupancyFreeList();
}
