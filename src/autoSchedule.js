// ========== 自动排课与限制条件 ==========

const AUTO_CONSTRAINT_TYPES = {
    teacher_unavailable: '教师不可上课',
    teacher_available_only: '教师仅可上课时段',
    room_unavailable: '教室不可使用',
    teacher_max_daily: '教师每日最多节数',
    slot_blocked: '课时行全员不可用',
    week_blocked: '星期不可用'
};

const WEEK_LABELS = ['周一','周二','周三','周四','周五','周六','周日'];

function ensureAutoConfig(table){
    if(!table.autoScheduleConfig){
        table.autoScheduleConfig = { constraints: [], settings: { onlyEmpty: true, checkGlobal: true, spreadWeek: true } };
    }
    if(!table.autoScheduleConfig.constraints) table.autoScheduleConfig.constraints = [];
    if(!table.autoScheduleConfig.settings){
        table.autoScheduleConfig.settings = { onlyEmpty: true, checkGlobal: true, spreadWeek: true };
    }
    return table.autoScheduleConfig;
}

function getAutoConfigTable(){
    if(!currentTableId) return null;
    return tableList.find(t => t.id === currentTableId);
}

function saveAutoConfigFromUI(){
    const table = getAutoConfigTable();
    if(!table) return;
    const cfg = ensureAutoConfig(table);
    cfg.settings.onlyEmpty = document.getElementById('autoOnlyEmpty')?.checked !== false;
    cfg.settings.checkGlobal = document.getElementById('autoCheckGlobal')?.checked !== false;
    cfg.settings.spreadWeek = document.getElementById('autoSpreadWeek')?.checked !== false;
    saveTableList();
}

function parseRowTimes(timeArr, rowIdx){
    const name = timeArr[rowIdx]?.name || '';
    const m = name.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    if(!m) return null;
    return { start: m[1], end: m[2] };
}

function parseCellAssignment(cellStr, timeArr, rowIdx){
    if(!cellStr) return null;
    const parts = cellStr.split('|');
    if(parts.length >= 6){
        return {
            courseKey: parts.slice(0, 4).join('|'),
            startTime: parts[4],
            endTime: parts[5],
            info: getCourseInfo(parts.slice(0, 4).join('|'))
        };
    }
    if(parts.length === 4){
        const times = parseRowTimes(timeArr, rowIdx);
        if(!times) return null;
        return {
            courseKey: cellStr,
            startTime: times.start,
            endTime: times.end,
            info: getCourseInfo(cellStr)
        };
    }
    return null;
}

function weeksMatch(ruleWeeks, weekIdx){
    if(!ruleWeeks || ruleWeeks.length === 0) return true;
    return ruleWeeks.includes('all') || ruleWeeks.includes(weekIdx) || ruleWeeks.includes(String(weekIdx));
}

function slotsMatch(ruleSlots, rowIdx){
    if(!ruleSlots || ruleSlots.length === 0) return true;
    return ruleSlots.includes('all') || ruleSlots.includes(rowIdx) || ruleSlots.includes(String(rowIdx));
}

function timeRangeOverlap(rule, start, end){
    if(!rule.startTime || !rule.endTime) return true;
    return isTimeOverlap(start, end, rule.startTime, rule.endTime);
}

function constraintAppliesToSlot(rule, ctx){
    if(!weeksMatch(rule.weeks, ctx.weekIdx)) return false;
    if(!slotsMatch(rule.timeSlots, ctx.rowIdx)) return false;
    if(rule.startTime && rule.endTime && !timeRangeOverlap(rule, ctx.start, ctx.end)) return false;
    return true;
}

function countTeacherOnDay(teacher, weekIdx, tableId, scheduleDraft, includeGlobal){
    let count = 0;
    const countInData = (data, timeArr, tid) => {
        Object.keys(data || {}).forEach(key => {
            const [rowIdx, wIdx] = key.split('-').map(Number);
            if(wIdx !== weekIdx) return;
            const cell = parseCellAssignment(data[key], timeArr, rowIdx);
            if(cell?.info?.teacher === teacher) count++;
        });
    };
    if(includeGlobal){
        tableList.forEach(t => {
            const data = (t.id === tableId && scheduleDraft) ? scheduleDraft : t.data;
            countInData(data, t.timeList, t.id);
        });
    }else{
        const t = tableList.find(x => x.id === tableId);
        if(t) countInData(scheduleDraft || t.data, t.timeList, tableId);
    }
    return count;
}

function isSlotAllowed(constraints, ctx){
    for(const rule of constraints){
        if(!constraintAppliesToSlot(rule, ctx)) continue;
        switch(rule.type){
            case 'teacher_unavailable':
                if(rule.teacher && rule.teacher === ctx.teacher) return false;
                break;
            case 'room_unavailable':
                if(rule.room && rule.room === ctx.room) return false;
                break;
            case 'slot_blocked':
                return false;
            case 'week_blocked':
                if(!rule.teacher || rule.teacher === ctx.teacher) return false;
                break;
        }
    }
    const whiteList = constraints.filter(r => r.type === 'teacher_available_only' && r.teacher === ctx.teacher);
    if(whiteList.length > 0){
        if(!whiteList.some(r => constraintAppliesToSlot(r, ctx))) return false;
    }
    const maxRules = constraints.filter(r => r.type === 'teacher_max_daily' && r.teacher === ctx.teacher);
    for(const rule of maxRules){
        const max = parseInt(rule.maxCount, 10) || 1;
        const dayCount = countTeacherOnDay(ctx.teacher, ctx.weekIdx, ctx.tableId, ctx.scheduleDraft, true);
        if(dayCount >= max) return false;
    }
    return true;
}

function hasScheduleConflict(teacher, room, weekIdx, start, end, excludeTableId, excludeKey, scheduleDraft){
    let conflict = false;
    tableList.forEach(tableItem => {
        const timeArr = tableItem.timeList;
        const data = (tableItem.id === excludeTableId && scheduleDraft) ? scheduleDraft : tableItem.data;
        Object.keys(data || {}).forEach(cellKey => {
            if(tableItem.id === excludeTableId && cellKey === excludeKey) return;
            const [rowIdx, wIdx] = cellKey.split('-').map(Number);
            if(wIdx !== weekIdx) return;
            const cell = parseCellAssignment(data[cellKey], timeArr, rowIdx);
            if(!cell) return;
            if(cell.info?.teacher === teacher && isTimeOverlap(start, end, cell.startTime, cell.endTime)){
                conflict = true;
            }
            if(cell.info?.room === room && isTimeOverlap(start, end, cell.startTime, cell.endTime)){
                conflict = true;
            }
        });
    });
    return conflict;
}

function buildCandidateSlots(table, onlyEmpty){
    const timeArr = table.timeList;
    const slots = [];
    for(let rowIdx = 0; rowIdx < timeArr.length; rowIdx++){
        if(timeArr[rowIdx].isSplit) continue;
        const times = parseRowTimes(timeArr, rowIdx);
        if(!times) continue;
        for(let weekIdx = 0; weekIdx < weekCount; weekIdx++){
            const key = `${rowIdx}-${weekIdx}`;
            if(onlyEmpty && table.data[key]) continue;
            slots.push({ rowIdx, weekIdx, key, start: times.start, end: times.end });
        }
    }
    return slots;
}

function orderSlotsForSpread(slots, teacher, scheduleDraft, tableId){
    const dayCount = {};
    for(let d = 0; d < weekCount; d++) dayCount[d] = 0;
    tableList.forEach(t => {
        const data = (t.id === tableId && scheduleDraft) ? scheduleDraft : t.data;
        Object.keys(data || {}).forEach(key => {
            const [rowIdx, wIdx] = key.split('-').map(Number);
            const cell = parseCellAssignment(data[key], t.timeList, rowIdx);
            if(cell?.info?.teacher === teacher) dayCount[wIdx]++;
        });
    });
    return slots.slice().sort((a, b) => {
        const diff = dayCount[a.weekIdx] - dayCount[b.weekIdx];
        if(diff !== 0) return diff;
        return a.rowIdx - b.rowIdx || a.weekIdx - b.weekIdx;
    });
}

function getTeacherCoursesForTable(teacher, bindClass, courseKeyFilter){
    let list = getCourseData().filter(c => c.teacher === teacher);
    if(bindClass) list = list.filter(c => c.cls === bindClass);
    if(courseKeyFilter){
        list = list.filter(c => `${c.name}|${c.teacher}|${c.room}|${c.cls}` === courseKeyFilter);
    }
    return list;
}

function runAutoScheduleForTeacher(){
    if(!currentTableId) return alert('请先选中一张课表');
    const table = getAutoConfigTable();
    if(!table) return;

    const teacher = document.getElementById('autoTeacherSelect')?.value;
    const count = parseInt(document.getElementById('autoSessionCount')?.value, 10);
    const courseKeyFilter = document.getElementById('autoCourseSelect')?.value || '';

    if(!teacher) return alert('请选择要排课的教师');
    if(!count || count < 1) return alert('请设置排课次数');

    saveAutoConfigFromUI();
    const cfg = ensureAutoConfig(table);
    const courses = getTeacherCoursesForTable(teacher, table.bindClass, courseKeyFilter);
    if(courses.length === 0){
        return alert(`教师【${teacher}】在当前课表绑定班级下没有可用课程，请先在课程管理中添加`);
    }

    let candidates = buildCandidateSlots(table, cfg.settings.onlyEmpty);
    if(cfg.settings.spreadWeek){
        candidates = orderSlotsForSpread(candidates, teacher, table.data, table.id);
    }

    const scheduleDraft = JSON.parse(JSON.stringify(table.data || {}));
    let placed = 0;
    let courseIdx = 0;

    for(const slot of candidates){
        if(placed >= count) break;
        const course = courses[courseIdx % courses.length];
        courseIdx++;
        const courseKey = `${course.name}|${course.teacher}|${course.room}|${course.cls}`;
        const ctx = {
            teacher,
            room: course.room,
            rowIdx: slot.rowIdx,
            weekIdx: slot.weekIdx,
            start: slot.start,
            end: slot.end,
            tableId: table.id,
            scheduleDraft
        };
        if(!isSlotAllowed(cfg.constraints, ctx)) continue;
        if(cfg.settings.checkGlobal && hasScheduleConflict(teacher, course.room, slot.weekIdx, slot.start, slot.end, table.id, slot.key, scheduleDraft)){
            continue;
        }
        if(!cfg.settings.onlyEmpty && scheduleDraft[slot.key]){
            const existing = parseCellAssignment(scheduleDraft[slot.key], table.timeList, slot.rowIdx);
            if(existing?.info?.teacher !== teacher) continue;
        }
        scheduleDraft[slot.key] = `${courseKey}|${slot.start}|${slot.end}`;
        placed++;
    }

    table.data = scheduleDraft;
    saveTableList();
    saveSnapshot();
    renderSchedule();
    checkAllConflict();

    if(placed === 0){
        alert('未能排入任何课程，请检查：空白格是否充足、限制条件是否过严、或是否存在全局冲突');
    }else if(placed < count){
        alert(`已排入 ${placed} / ${count} 节（部分格子因限制条件或冲突无法使用）`);
    }else{
        alert(`✅ 已成功为【${teacher}】排入 ${placed} 节课`);
    }
}

async function clearTeacherInCurrentTable(){
    if(!currentTableId) return alert('请先选中课表');
    const teacher = document.getElementById('autoTeacherSelect')?.value;
    if(!teacher) return alert('请选择教师');
    if(!(await showAppConfirm(`确定清除【${teacher}】在当前课表中的所有排课吗？`))) return;

    const table = getAutoConfigTable();
    const timeArr = table.timeList;
    const schedule = { ...table.data };
    let removed = 0;
    Object.keys(schedule).forEach(key => {
        const [rowIdx] = key.split('-').map(Number);
        const cell = parseCellAssignment(schedule[key], timeArr, rowIdx);
        if(cell?.info?.teacher === teacher){
            delete schedule[key];
            removed++;
        }
    });
    table.data = schedule;
    saveTableList();
    saveSnapshot();
    renderSchedule();
    checkAllConflict();
    alert(`已清除 ${removed} 节`);
}

function updateConstraintFieldsVisibility(){
    const type = document.getElementById('constraintType')?.value;
    const teacherWrap = document.getElementById('constraintTeacherWrap');
    const roomWrap = document.getElementById('constraintRoomWrap');
    const maxWrap = document.getElementById('constraintMaxWrap');
    const timeRangeWrap = document.getElementById('constraintTimeRangeWrap');
    if(!type) return;

    const needTeacher = ['teacher_unavailable','teacher_available_only','teacher_max_daily','week_blocked'].includes(type);
    const needRoom = type === 'room_unavailable';
    const needMax = type === 'teacher_max_daily';
    const needTimeRange = !['teacher_max_daily'].includes(type);

    if(teacherWrap) teacherWrap.style.display = needTeacher ? 'inline-flex' : 'none';
    if(roomWrap) roomWrap.style.display = needRoom ? 'inline-flex' : 'none';
    if(maxWrap) maxWrap.style.display = needMax ? 'inline-flex' : 'none';
    if(timeRangeWrap) timeRangeWrap.style.display = needTimeRange ? 'inline-flex' : 'none';
}

function syncConstraintChipStyles(){
    document.querySelectorAll('.constraint-chip').forEach(label=>{
        const input = label.querySelector('input[type="checkbox"]');
        if(input) label.classList.toggle('active', input.checked);
    });
}

function toggleConstraintWeekAll(el){
    document.querySelectorAll('.constraint-week-cb').forEach(cb=>{
        if(el.checked){
            cb.checked = false;
        }
    });
    syncConstraintChipStyles();
}

function onConstraintWeekPick(){
    const allCb = document.getElementById('constraintWeekAll');
    const any = document.querySelectorAll('.constraint-week-cb:checked').length > 0;
    if(any && allCb) allCb.checked = false;
    if(!any && allCb) allCb.checked = true;
    syncConstraintChipStyles();
}

function toggleConstraintSlotAll(el){
    document.querySelectorAll('.constraint-slot-cb').forEach(cb=>{
        if(el.checked) cb.checked = false;
    });
    syncConstraintChipStyles();
}

function onConstraintSlotPick(){
    const allCb = document.getElementById('constraintSlotAll');
    const any = document.querySelectorAll('.constraint-slot-cb:checked').length > 0;
    if(any && allCb) allCb.checked = false;
    if(!any && allCb) allCb.checked = true;
    syncConstraintChipStyles();
}

function getSelectedConstraintWeeks(){
    const allCb = document.getElementById('constraintWeekAll');
    if(!allCb || allCb.checked) return [];
    return Array.from(document.querySelectorAll('.constraint-week-cb:checked'))
        .map(cb => parseInt(cb.value, 10))
        .filter(n => !Number.isNaN(n));
}

function getSelectedConstraintSlots(){
    const allCb = document.getElementById('constraintSlotAll');
    if(!allCb || allCb.checked) return [];
    return Array.from(document.querySelectorAll('.constraint-slot-cb:checked'))
        .map(cb => parseInt(cb.value, 10))
        .filter(n => !Number.isNaN(n));
}

function renderConstraintSlotCheckboxes(){
    const group = document.getElementById('constraintSlotsGroup');
    if(!group) return;
    const allHtml = '<label class="constraint-chip active" id="constraintSlotAllLabel"><input type="checkbox" id="constraintSlotAll" checked onchange="toggleConstraintSlotAll(this)"> 全部</label>';
    const timeArr = getTimeData();
    let slotsHtml = '';
    timeArr.forEach((item, idx)=>{
        if(item.isSplit) return;
        slotsHtml += `<label class="constraint-chip"><input type="checkbox" class="constraint-slot-cb" value="${idx}" onchange="onConstraintSlotPick()"> ${escCourseHtml(item.name)}</label>`;
    });
    group.innerHTML = allHtml + slotsHtml;
    syncConstraintChipStyles();
}

function addAutoConstraint(){
    const table = getAutoConfigTable();
    if(!table) return alert('请先选中课表');

    const type = document.getElementById('constraintType').value;
    const teacher = document.getElementById('constraintTeacher')?.value || '';
    const room = document.getElementById('constraintRoom')?.value || '';
    const weeks = getSelectedConstraintWeeks();
    const timeSlots = getSelectedConstraintSlots();
    const startTime = document.getElementById('constraintStartTime')?.value || '';
    const endTime = document.getElementById('constraintEndTime')?.value || '';
    const maxCount = parseInt(document.getElementById('constraintMaxCount')?.value, 10) || 2;

    if(['teacher_unavailable','teacher_available_only','teacher_max_daily','week_blocked'].includes(type) && !teacher){
        return alert('请选择教师');
    }
    if(type === 'room_unavailable' && !room) return alert('请选择教室');

    const rule = {
        id: 'rule_' + Date.now(),
        type,
        teacher,
        room,
        weeks,
        timeSlots,
        startTime,
        endTime,
        maxCount,
        label: buildConstraintLabel(type, { teacher, room, weeks, timeSlots, startTime, endTime, maxCount })
    };

    const cfg = ensureAutoConfig(table);
    cfg.constraints.push(rule);
    saveTableList();
    renderConstraintList();
    alert('✅ 限制条件已添加');
}

function buildConstraintLabel(type, o){
    const typeName = AUTO_CONSTRAINT_TYPES[type] || type;
    let parts = [typeName];
    if(o.teacher) parts.push(`教师:${o.teacher}`);
    if(o.room) parts.push(`教室:${o.room}`);
    if(o.weeks?.length) parts.push(o.weeks.map(w => WEEK_LABELS[w]).join('、'));
    else parts.push('全周');
    if(o.timeSlots?.length){
        const table = getAutoConfigTable();
        const names = o.timeSlots.map(i => table?.timeList[i]?.name || `第${i+1}节`).join('、');
        parts.push(names);
    }
    if(o.startTime && o.endTime) parts.push(`${o.startTime}-${o.endTime}`);
    if(type === 'teacher_max_daily') parts.push(`最多${o.maxCount}节/天`);
    return parts.join(' · ');
}

function delAutoConstraint(id){
    const table = getAutoConfigTable();
    if(!table) return;
    const cfg = ensureAutoConfig(table);
    cfg.constraints = cfg.constraints.filter(r => r.id !== id);
    saveTableList();
    renderConstraintList();
}

function renderConstraintList(){
    const tbody = document.getElementById('constraintListBody');
    if(!tbody) return;
    const table = getAutoConfigTable();
    const rules = table ? ensureAutoConfig(table).constraints : [];
    if(rules.length === 0){
        tbody.innerHTML = '<tr><td colspan="3" class="search-empty">暂无限定条件，可在下方添加</td></tr>';
        return;
    }
    tbody.innerHTML = rules.map(r => `<tr>
        <td>${escCourseHtml(r.label || r.type)}</td>
        <td>${escCourseHtml(AUTO_CONSTRAINT_TYPES[r.type] || r.type)}</td>
        <td><button class="del" onclick="delAutoConstraint('${r.id}')">删除</button></td>
    </tr>`).join('');
}

function renderAutoSchedulePanel(){
    const teacherSel = document.getElementById('autoTeacherSelect');
    const courseSel = document.getElementById('autoCourseSelect');
    const cTeacherSel = document.getElementById('constraintTeacher');
    const cRoomSel = document.getElementById('constraintRoom');
    if(!teacherSel) return;

    const teachers = getTeacherData();
    let tHtml = '<option value="">选择教师</option>';
    teachers.forEach(t => { tHtml += `<option value="${escCourseHtml(t)}">${escCourseHtml(t)}</option>`; });
    teacherSel.innerHTML = tHtml;
    if(cTeacherSel) cTeacherSel.innerHTML = tHtml;

    const rooms = getRoomData();
    if(cRoomSel){
        let rHtml = '<option value="">选择教室</option>';
        rooms.forEach(r => { rHtml += `<option value="${escCourseHtml(r)}">${escCourseHtml(r)}</option>`; });
        cRoomSel.innerHTML = rHtml;
    }

    refreshAutoCourseSelect();
    renderConstraintSlotCheckboxes();

    const table = getAutoConfigTable();
    if(table){
        const cfg = ensureAutoConfig(table);
        const onlyEmpty = document.getElementById('autoOnlyEmpty');
        const checkGlobal = document.getElementById('autoCheckGlobal');
        const spreadWeek = document.getElementById('autoSpreadWeek');
        if(onlyEmpty) onlyEmpty.checked = cfg.settings.onlyEmpty !== false;
        if(checkGlobal) checkGlobal.checked = cfg.settings.checkGlobal !== false;
        if(spreadWeek) spreadWeek.checked = cfg.settings.spreadWeek !== false;
    }

    renderConstraintList();
    updateConstraintFieldsVisibility();
    syncConstraintChipStyles();
}

function refreshAutoCourseSelect(){
    const courseSel = document.getElementById('autoCourseSelect');
    const teacher = document.getElementById('autoTeacherSelect')?.value;
    if(!courseSel) return;
    const table = getAutoConfigTable();
    const bindClass = table?.bindClass || '';
    let html = '<option value="">自动匹配课程</option>';
    if(teacher){
        getTeacherCoursesForTable(teacher, bindClass).forEach(c => {
            const key = `${c.name}|${c.teacher}|${c.room}|${c.cls}`;
            html += `<option value="${escCourseHtml(key)}">${escCourseHtml(c.name)} · ${escCourseHtml(c.room)}</option>`;
        });
    }
    courseSel.innerHTML = html;
}

function initAutoConstraintTimeSelects(){
    const startSel = document.getElementById('constraintStartTime');
    const endSel = document.getElementById('constraintEndTime');
    if(!startSel || !endSel || typeof TIME_OPTIONS === 'undefined') return;
    let opt = '<option value="">不限</option>';
    TIME_OPTIONS.forEach(t => { opt += `<option value="${t}">${t}</option>`; });
    startSel.innerHTML = opt;
    endSel.innerHTML = opt;
}
