// ========== 自动排课与限制条件 ==========

function getAutoConstraintTypes(){
    if(typeof t === 'function'){
        return {
            teacher_unavailable: t('auto.teacherUnavailable'),
            teacher_available_only: t('auto.teacherAvailableOnly'),
            room_unavailable: t('auto.roomUnavailable'),
            teacher_max_daily: t('auto.teacherMaxDaily'),
            slot_blocked: t('auto.slotBlocked'),
            week_blocked: t('auto.weekBlocked')
        };
    }
    return {
        teacher_unavailable: '教师不可上课',
        teacher_available_only: '教师仅可上课时段',
        room_unavailable: '教室不可使用',
        teacher_max_daily: '教师每日最多节数',
        slot_blocked: '课时行全员不可用',
        week_blocked: '星期不可用'
    };
}
const AUTO_CONSTRAINT_TYPES = getAutoConstraintTypes();

function getWeekLabels(){
    return (typeof i18nWeekLabels === 'function') ? i18nWeekLabels() : ['周一','周二','周三','周四','周五','周六','周日'];
}
const WEEK_LABELS = getWeekLabels();

function ensureAutoConfig(table){
    if(!table.autoScheduleConfig){
        table.autoScheduleConfig = { constraints: [], settings: { onlyEmpty: true, checkGlobal: true, spreadWeek: true, allowRepack: true } };
    }
    if(!table.autoScheduleConfig.constraints) table.autoScheduleConfig.constraints = [];
    if(!table.autoScheduleConfig.settings){
        table.autoScheduleConfig.settings = { onlyEmpty: true, checkGlobal: true, spreadWeek: true, allowRepack: true };
    }
    const cfg = table.autoScheduleConfig;
    if(cfg.settings.allowRepack === undefined) cfg.settings.allowRepack = true;
    return cfg;
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
    cfg.settings.allowRepack = document.getElementById('autoAllowRepack')?.checked !== false;
    saveTableList();
}

function parseRowTimes(timeArr, rowIdx){
    const name = timeArr[rowIdx]?.name || '';
    if(typeof parsePeriodTimeRange === 'function') return parsePeriodTimeRange(name);
    const m = name.match(/(\d{1,2}:\d{2})\s*[-–—~～]\s*(\d{1,2}:\d{2})/);
    if(!m) return null;
    const pad = (t) => {
        const p = t.split(':');
        return String(p[0]).padStart(2,'0') + ':' + String(p[1]).padStart(2,'0');
    };
    return { start: pad(m[1]), end: pad(m[2]) };
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

function normalizeTeacherKey(name){
    return String(name == null ? '' : name).trim();
}

function constraintTeacherMatches(ruleTeacher, ctxTeacher){
    return normalizeTeacherKey(ruleTeacher) === normalizeTeacherKey(ctxTeacher);
}

function weeksMatch(ruleWeeks, weekIdx){
    if(!ruleWeeks || ruleWeeks.length === 0) return true;
    return ruleWeeks.includes('all') || ruleWeeks.includes(weekIdx) || ruleWeeks.includes(String(weekIdx));
}

function getEffectiveWeekDaySlots(rule){
    if(!rule) return {};
    if(rule.weekDaySlots && typeof rule.weekDaySlots === 'object'){
        const keys = Object.keys(rule.weekDaySlots);
        if(keys.length > 0) return rule.weekDaySlots;
    }
    if(!rule.weeks || rule.weeks.length === 0) return {};
    const map = {};
    const slotList = (rule.timeSlots && rule.timeSlots.length) ? rule.timeSlots.slice() : [];
    rule.weeks.forEach(w => { map[String(w)] = slotList.slice(); });
    return map;
}

function ruleHasExplicitWeeks(rule){
    if(Object.keys(getEffectiveWeekDaySlots(rule)).length > 0) return true;
    return !!(rule.weeks && rule.weeks.length > 0);
}

function ruleHasExplicitSlotsOrTime(rule){
    if(rule.startTime && rule.endTime) return true;
    const wds = getEffectiveWeekDaySlots(rule);
    const wdsKeys = Object.keys(wds);
    if(wdsKeys.length > 0){
        return wdsKeys.some(k => wds[k] && wds[k].length > 0);
    }
    return !!(rule.timeSlots && rule.timeSlots.length > 0);
}

/** 「仅可」规则若星期/课时/时段全为「不限」，会等价于全时段放行 */
function isOpenEndedWhitelistRule(rule){
    return !ruleHasExplicitWeeks(rule) && !ruleHasExplicitSlotsOrTime(rule);
}

function teacherAvailableRuleMatches(rule, ctx, allWhitelistRules){
    if(isOpenEndedWhitelistRule(rule) && allWhitelistRules.some(r => r !== rule && ruleHasExplicitWeeks(r))){
        return false;
    }
    return constraintAppliesToSlot(rule, ctx);
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
    const wds = getEffectiveWeekDaySlots(rule);
    const wdsKeys = Object.keys(wds);
    if(wdsKeys.length > 0){
        const dayKey = String(ctx.weekIdx);
        if(!wdsKeys.includes(dayKey)) return false;
        const daySlots = wds[dayKey];
        if(Array.isArray(daySlots) && daySlots.length > 0){
            if(!slotsMatch(daySlots, ctx.rowIdx)) return false;
        }
    }else{
        if(!weeksMatch(rule.weeks, ctx.weekIdx)) return false;
        if(!slotsMatch(rule.timeSlots, ctx.rowIdx)) return false;
    }
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
            if(cell?.info?.teacher && normalizeTeacherKey(cell.info.teacher) === normalizeTeacherKey(teacher)) count++;
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
                if(rule.teacher && constraintTeacherMatches(rule.teacher, ctx.teacher)) return false;
                break;
            case 'room_unavailable':
                if(rule.room && rule.room === ctx.room) return false;
                break;
            case 'slot_blocked':
                return false;
            case 'week_blocked':
                if(!rule.teacher || constraintTeacherMatches(rule.teacher, ctx.teacher)) return false;
                break;
        }
    }
    const whiteList = constraints.filter(r => r.type === 'teacher_available_only' && constraintTeacherMatches(r.teacher, ctx.teacher));
    if(whiteList.length > 0){
        if(!whiteList.some(r => teacherAvailableRuleMatches(r, ctx, whiteList))) return false;
    }
    const maxRules = constraints.filter(r => r.type === 'teacher_max_daily' && constraintTeacherMatches(r.teacher, ctx.teacher));
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
            if(cell.info?.teacher && normalizeTeacherKey(cell.info.teacher) === normalizeTeacherKey(teacher) && isTimeOverlap(start, end, cell.startTime, cell.endTime)){
                conflict = true;
            }
            if(cell.info?.room === room && isTimeOverlap(start, end, cell.startTime, cell.endTime)){
                conflict = true;
            }
        });
    });
    return conflict;
}

function buildCandidateSlots(table, onlyEmpty, dataOverride){
    const timeArr = table.timeList;
    const data = dataOverride || table.data || {};
    const slots = [];
    for(let rowIdx = 0; rowIdx < timeArr.length; rowIdx++){
        if(timeArr[rowIdx].isSplit) continue;
        const times = parseRowTimes(timeArr, rowIdx);
        if(!times) continue;
        for(let weekIdx = 0; weekIdx < weekCount; weekIdx++){
            const key = `${rowIdx}-${weekIdx}`;
            if(onlyEmpty && data[key]) continue;
            slots.push({ rowIdx, weekIdx, key, start: times.start, end: times.end });
        }
    }
    return slots;
}

/** 均匀分配：只统计当前课表内该教师各天已排节数（不含其它课表） */
function getTeacherDayCounts(teacher, scheduleDraft, tableId){
    const dayCount = {};
    for(let d = 0; d < weekCount; d++) dayCount[d] = 0;
    const tKey = normalizeTeacherKey(teacher);
    const t = tableList.find(x => x.id === tableId);
    if(!t) return dayCount;
    const data = scheduleDraft || t.data || {};
    Object.keys(data).forEach(key => {
        const [rowIdx, wIdx] = key.split('-').map(Number);
        const cell = parseCellAssignment(data[key], t.timeList, rowIdx);
        if(cell?.info?.teacher && normalizeTeacherKey(cell.info.teacher) === tKey) dayCount[wIdx]++;
    });
    return dayCount;
}

/** 当前课表内，该教师在某天仍可用的空白格数量（已通过限制与冲突校验） */
function buildTeacherDayScarcity(candidates, table, cfg, teacherKey, course, scheduleDraft){
    const scarcity = {};
    for(let d = 0; d < weekCount; d++) scarcity[d] = 0;
    candidates.forEach(slot => {
        if(cfg.settings.onlyEmpty && scheduleDraft[slot.key]) return;
        if(!canPlaceAutoSession(table, cfg, teacherKey, slot, course, scheduleDraft)) return;
        scarcity[slot.weekIdx]++;
    });
    return scarcity;
}

/** 负数表示 a 优先于 b */
function compareSlotsForSpread(a, b, dayCount, scarcity){
    const da = dayCount[a.weekIdx] || 0;
    const db = dayCount[b.weekIdx] || 0;
    if(da !== db) return da - db;
    const sa = scarcity[a.weekIdx] || 999;
    const sb = scarcity[b.weekIdx] || 999;
    if(sa !== sb) return sa - sb;
    if(a.weekIdx !== b.weekIdx) return a.weekIdx - b.weekIdx;
    return a.rowIdx - b.rowIdx;
}

function canPlaceAutoSession(table, cfg, teacherKey, slot, course, scheduleDraft, placeOptions){
    placeOptions = placeOptions || {};
    const ctx = {
        teacher: teacherKey,
        room: course.room,
        rowIdx: slot.rowIdx,
        weekIdx: slot.weekIdx,
        start: slot.start,
        end: slot.end,
        tableId: table.id,
        scheduleDraft: scheduleDraft
    };
    if(!isSlotAllowed(cfg.constraints, ctx)) return false;
    const conflictExcludeKey = placeOptions.replaceKey != null ? placeOptions.replaceKey : slot.key;
    if(cfg.settings.checkGlobal && hasScheduleConflict(teacherKey, course.room, slot.weekIdx, slot.start, slot.end, table.id, conflictExcludeKey, scheduleDraft)){
        return false;
    }
    if(!placeOptions.ignoreOccupancy){
        if(cfg.settings.onlyEmpty && scheduleDraft[slot.key]) return false;
        if(!cfg.settings.onlyEmpty && scheduleDraft[slot.key]){
            const existing = parseCellAssignment(scheduleDraft[slot.key], table.timeList, slot.rowIdx);
            if(existing?.info?.teacher && normalizeTeacherKey(existing.info.teacher) !== teacherKey) return false;
        }
    }
    return true;
}

function writeAssignmentToSlot(scheduleDraft, slot, courseKey){
    scheduleDraft[slot.key] = `${courseKey}|${slot.start}|${slot.end}`;
}

function tryRelocateSessionAtKey(table, cfg, fromKey, scheduleDraft){
    const cellStr = scheduleDraft[fromKey];
    if(!cellStr) return false;
    const [rowIdx] = fromKey.split('-').map(Number);
    const parsed = parseCellAssignment(cellStr, table.timeList, rowIdx);
    if(!parsed?.info?.teacher) return false;
    const blockerKey = normalizeTeacherKey(parsed.info.teacher);
    const courseKey = parsed.courseKey;
    const courses = getTeacherCoursesForTable(blockerKey, table.bindClass, '');
    const course = courses.find(c => `${c.name}|${c.teacher}|${c.room}|${c.cls}` === courseKey) || courses[0] || parsed.info;
    if(!course) return false;

    delete scheduleDraft[fromKey];
    const candidates = buildCandidateSlots(table, true, scheduleDraft);
    const dest = pickNextAutoSlot(candidates, table, cfg, blockerKey, course, scheduleDraft);
    if(dest){
        writeAssignmentToSlot(scheduleDraft, dest, courseKey);
        return true;
    }
    scheduleDraft[fromKey] = cellStr;
    return false;
}

function listOccupiedSlotsAllowedForTeacher(table, cfg, teacherKey, course, scheduleDraft){
    const slots = buildCandidateSlots(table, false, scheduleDraft);
    const list = [];
    slots.forEach(slot => {
        if(!scheduleDraft[slot.key]) return;
        const cell = parseCellAssignment(scheduleDraft[slot.key], table.timeList, slot.rowIdx);
        if(!cell?.info?.teacher) return;
        if(normalizeTeacherKey(cell.info.teacher) === teacherKey) return;
        if(!canPlaceAutoSession(table, cfg, teacherKey, slot, course, scheduleDraft, { ignoreOccupancy: true, replaceKey: slot.key })){
            return;
        }
        list.push({
            slot,
            blockerTeacher: normalizeTeacherKey(cell.info.teacher)
        });
    });
    list.sort((a, b) => {
        const da = a.slot.weekIdx;
        const db = b.slot.weekIdx;
        if(da !== db) return da - db;
        return a.slot.rowIdx - b.slot.rowIdx;
    });
    return list;
}

function repackFillRemaining(table, cfg, teacherKey, need, courseKeyFilter, scheduleDraft, startCourseIdx){
    if(need <= 0 || cfg.settings.allowRepack === false) return { added: 0, courseIdx: startCourseIdx || 0 };
    const courses = getTeacherCoursesForTable(teacherKey, table.bindClass, courseKeyFilter);
    if(!courses.length) return { added: 0, courseIdx: startCourseIdx || 0 };

    let courseIdx = startCourseIdx || 0;
    let added = 0;
    const candidates = buildCandidateSlots(table, true, scheduleDraft);
    const maxAttempts = Math.max(need * 40, 80);
    let attempts = 0;

    while(added < need && attempts < maxAttempts){
        attempts++;
        const course = courses[courseIdx % courses.length];
        let slot = pickNextAutoSlot(candidates, table, cfg, teacherKey, course, scheduleDraft);
        if(slot){
            const courseKey = `${course.name}|${course.teacher}|${course.room}|${course.cls}`;
            writeAssignmentToSlot(scheduleDraft, slot, courseKey);
            added++;
            courseIdx++;
            continue;
        }

        const blocked = listOccupiedSlotsAllowedForTeacher(table, cfg, teacherKey, course, scheduleDraft);
        let progressed = false;
        for(let i = 0; i < blocked.length; i++){
            const target = blocked[i].slot;
            if(!tryRelocateSessionAtKey(table, cfg, target.key, scheduleDraft)) continue;
            if(!canPlaceAutoSession(table, cfg, teacherKey, target, course, scheduleDraft)){
                continue;
            }
            const courseKey = `${course.name}|${course.teacher}|${course.room}|${course.cls}`;
            writeAssignmentToSlot(scheduleDraft, target, courseKey);
            added++;
            courseIdx++;
            progressed = true;
            break;
        }
        if(!progressed) break;
    }

    return { added, courseIdx };
}

function pickNextAutoSlot(candidates, table, cfg, teacherKey, course, scheduleDraft){
    const spread = cfg.settings.spreadWeek;
    const dayCount = spread ? getTeacherDayCounts(teacherKey, scheduleDraft, table.id) : null;
    const scarcity = spread ? buildTeacherDayScarcity(candidates, table, cfg, teacherKey, course, scheduleDraft) : null;
    let best = null;
    for(const slot of candidates){
        if(cfg.settings.onlyEmpty && scheduleDraft[slot.key]) continue;
        if(!canPlaceAutoSession(table, cfg, teacherKey, slot, course, scheduleDraft)) continue;
        if(!spread) return slot;
        if(!best || compareSlotsForSpread(slot, best, dayCount, scarcity) < 0) best = slot;
    }
    return best;
}

function getTeacherCoursesForTable(teacher, bindClass, courseKeyFilter){
    const tKey = normalizeTeacherKey(teacher);
    let list = getCourseData().filter(c => normalizeTeacherKey(c.teacher) === tKey);
    if(bindClass) list = list.filter(c => c.cls === bindClass);
    if(courseKeyFilter){
        list = list.filter(c => `${c.name}|${c.teacher}|${c.room}|${c.cls}` === courseKeyFilter);
    }
    return list;
}

/** 当前课表绑定班级下，在课程数据里出现过的教师（自动排课教师下拉用） */
function getTeachersForCurrentTableClass(){
    const table = getAutoConfigTable();
    const bindClass = table && table.bindClass ? String(table.bindClass).trim() : '';
    const seen = new Set();
    getCourseData().forEach(function(c){
        if(bindClass && String(c.cls || '').trim() !== bindClass) return;
        const teacher = String(c.teacher || '').trim();
        if(teacher) seen.add(teacher);
    });
    return Array.from(seen).sort(function(a, b){ return a.localeCompare(b, 'zh-CN'); });
}

function removeTeacherConstraintViolationsFromDraft(table, cfg, teacher, draft){
    const timeArr = table.timeList;
    const tKey = normalizeTeacherKey(teacher);
    Object.keys(draft || {}).forEach(key => {
        const [rowIdx, weekIdx] = key.split('-').map(Number);
        const cell = parseCellAssignment(draft[key], timeArr, rowIdx);
        if(!cell?.info || normalizeTeacherKey(cell.info.teacher) !== tKey) return;
        const times = parseRowTimes(timeArr, rowIdx);
        if(!times) return;
        const ctx = {
            teacher: tKey,
            room: cell.info.room,
            rowIdx,
            weekIdx,
            start: times.start,
            end: times.end,
            tableId: table.id,
            scheduleDraft: draft
        };
        if(!isSlotAllowed(cfg.constraints, ctx)) delete draft[key];
    });
}

function placeAutoSessionsForTeacher(table, cfg, teacher, count, courseKeyFilter, scheduleDraft, options){
    options = options || {};
    const teacherKey = normalizeTeacherKey(teacher);
    const courses = getTeacherCoursesForTable(teacherKey, table.bindClass, courseKeyFilter);
    if(courses.length === 0) return { placed: 0, scheduleDraft: scheduleDraft, noCourses: true };

    const draft = scheduleDraft || {};
    if(options.cleanViolations !== false){
        removeTeacherConstraintViolationsFromDraft(table, cfg, teacherKey, draft);
    }
    scheduleDraft = draft;

    const candidates = buildCandidateSlots(table, cfg.settings.onlyEmpty, scheduleDraft);
    let placed = 0;
    let courseIdx = 0;

    while(placed < count){
        const course = courses[courseIdx % courses.length];
        const slot = pickNextAutoSlot(candidates, table, cfg, teacherKey, course, scheduleDraft);
        if(!slot) break;
        const courseKey = `${course.name}|${course.teacher}|${course.room}|${course.cls}`;
        writeAssignmentToSlot(scheduleDraft, slot, courseKey);
        placed++;
        courseIdx++;
    }

    if(placed < count && cfg.settings.allowRepack !== false){
        const repack = repackFillRemaining(table, cfg, teacherKey, count - placed, courseKeyFilter, scheduleDraft, courseIdx);
        placed += repack.added;
    }

    return { placed: placed, scheduleDraft: scheduleDraft, noCourses: false };
}

function commitAutoScheduleDraft(table, scheduleDraft){
    table.data = scheduleDraft;
    saveTableList();
    saveSnapshot();
    renderSchedule();
    checkAllConflict();
}

function runAutoScheduleForTeacher(){
    if(!currentTableId) return alert(typeof t==='function'?t('msg.selectTableFirst'):'请先选中一张课表');
    const table = getAutoConfigTable();
    if(!table) return;

    const teacher = document.getElementById('autoTeacherSelect')?.value;
    const count = parseInt(document.getElementById('autoSessionCount')?.value, 10);
    const courseKeyFilter = document.getElementById('autoCourseSelect')?.value || '';

    if(!teacher) return alert(typeof t==='function'?t('course.selectTeacher'):'请选择要排课的教师');
    if(!count || count < 1) return alert(typeof t==='function'?t('auto.countRequired'):'请设置排课次数');

    saveAutoConfigFromUI();
    const cfg = ensureAutoConfig(table);
    let scheduleDraft = JSON.parse(JSON.stringify(table.data || {}));
    const result = placeAutoSessionsForTeacher(table, cfg, teacher, count, courseKeyFilter, scheduleDraft);
    if(result.noCourses){
        return alert(typeof t==='function'?t('auto.noCoursesForTeacher',{name:teacher}):`教师【${teacher}】在当前课表绑定班级下没有可用课程，请先在课程管理中添加`);
    }
    scheduleDraft = result.scheduleDraft;
    const placed = result.placed;
    commitAutoScheduleDraft(table, scheduleDraft);

    if(placed === 0){
        alert(typeof t==='function'?t('auto.nonePlaced'):'未能排入任何课程，请检查：空白格是否充足、限制条件是否过严、或是否存在全局冲突');
    }else if(placed < count){
        alert(typeof t==='function'?t('auto.partialPlaced',{placed:placed,count:count}):`已排入 ${placed} / ${count} 节（部分格子因限制条件或冲突无法使用）`);
    }else{
        alert(typeof t==='function'?t('auto.okOneTeacher',{name:teacher,placed:placed}):`✅ 已成功为【${teacher}】排入 ${placed} 节课`);
    }
}

function runAutoScheduleForAllTeachers(){
    if(!currentTableId) return alert(typeof t==='function'?t('msg.selectTableFirst'):'请先选中一张课表');
    const table = getAutoConfigTable();
    if(!table) return;

    const count = parseInt(document.getElementById('autoSessionCount')?.value, 10);
    if(!count || count < 1) return alert(typeof t==='function'?t('auto.countRequired'):'请设置排课次数');

    saveAutoConfigFromUI();
    const cfg = ensureAutoConfig(table);
    const teachers = getTeachersForCurrentTableClass();
    if(!teachers.length){
        return alert(typeof t==='function'?t('auto.noTeachersInClass'):'当前课表班级下没有可排课的教师，请先在课程管理中添加');
    }

    let scheduleDraft = JSON.parse(JSON.stringify(table.data || {}));
    teachers.forEach(function(teacher){
        removeTeacherConstraintViolationsFromDraft(table, cfg, teacher, scheduleDraft);
    });

    const remaining = {};
    const placedByTeacher = {};
    const noCoursesTeachers = new Set();
    teachers.forEach(function(teacher){
        remaining[teacher] = count;
        placedByTeacher[teacher] = 0;
    });

    let totalPlaced = 0;
    for(let round = 0; round < count; round++){
        let anyThisRound = false;
        teachers.forEach(function(teacher){
            if(remaining[teacher] <= 0) return;
            const result = placeAutoSessionsForTeacher(table, cfg, teacher, 1, '', scheduleDraft, { cleanViolations: false });
            scheduleDraft = result.scheduleDraft;
            if(result.noCourses){
                noCoursesTeachers.add(teacher);
                remaining[teacher] = 0;
                return;
            }
            if(result.placed > 0){
                remaining[teacher]--;
                placedByTeacher[teacher]++;
                totalPlaced++;
                anyThisRound = true;
            }
        });
        if(!anyThisRound) break;
    }

    if(cfg.settings.allowRepack !== false){
        for(let pass = 0; pass < Math.max(teachers.length * 3, 6); pass++){
            let repackProgress = false;
            const sorted = teachers.slice().sort(function(a, b){
                return (count - placedByTeacher[b]) - (count - placedByTeacher[a]);
            });
            sorted.forEach(function(teacher){
                if(noCoursesTeachers.has(teacher)) return;
                const need = count - placedByTeacher[teacher];
                if(need <= 0) return;
                const repack = repackFillRemaining(table, cfg, normalizeTeacherKey(teacher), need, '', scheduleDraft, 0);
                if(repack.added > 0){
                    placedByTeacher[teacher] += repack.added;
                    totalPlaced += repack.added;
                    repackProgress = true;
                }
            });
            if(!repackProgress) break;
        }
    }

    const lines = teachers.map(function(teacher){
        if(noCoursesTeachers.has(teacher)) return `${teacher}: 0（无课程）`;
        return `${teacher}: ${placedByTeacher[teacher]}/${count}`;
    });

    commitAutoScheduleDraft(table, scheduleDraft);

    const body = lines.join('\n');
    if(totalPlaced === 0){
        alert((typeof t==='function'?t('auto.nonePlacedAll'):'所有教师均未排入课程，请检查空白格、限制条件与冲突')+'\n\n'+body);
    }else{
        alert((typeof t==='function'?t('auto.okAllTeachers',{total:totalPlaced,n:teachers.length}):`✅ 已为 ${teachers.length} 位教师共排入 ${totalPlaced} 节课`) + '\n\n' + body);
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

function onConstraintTypeChange(){
    updateConstraintFieldsVisibility();
    loadConstraintFormFromSaved();
}

function onConstraintTeacherChange(){
    loadConstraintFormFromSaved();
}

function onConstraintRoomChange(){
    loadConstraintFormFromSaved();
}

function mergeRulesIntoWeekDaySlots(rules){
    const merged = {};
    (rules || []).forEach(rule => {
        const wds = getEffectiveWeekDaySlots(rule);
        Object.keys(wds).forEach(dayKey => {
            const slots = wds[dayKey];
            if(!merged[dayKey]){
                merged[dayKey] = Array.isArray(slots) ? slots.slice() : [];
                return;
            }
            if(!slots || slots.length === 0){
                merged[dayKey] = [];
                return;
            }
            if(merged[dayKey].length === 0) return;
            const set = new Set(merged[dayKey].map(n => Number(n)));
            slots.forEach(s => set.add(Number(s)));
            merged[dayKey] = Array.from(set).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
        });
    });
    return merged;
}

function resetConstraintDayPanelToEmpty(){
    applyWeekDaySlotsToConstraintUI({});
}

function applyWeekDaySlotsToConstraintUI(weekDaySlots){
    weekDaySlots = weekDaySlots || {};
    for(let w = 0; w < weekCount; w++){
        const dayKey = String(w);
        const active = document.querySelector('.constraint-day-active[data-week="'+w+'"]');
        const allCb = document.querySelector('.constraint-day-all[data-week="'+w+'"]');
        const slotCbs = document.querySelectorAll('.constraint-day-slot-cb[data-week="'+w+'"]');
        if(!active) continue;
        if(!weekDaySlots[dayKey]){
            active.checked = false;
            if(allCb) allCb.checked = true;
            slotCbs.forEach(cb => { cb.checked = false; });
            onConstraintDayActiveChange(w);
            continue;
        }
        active.checked = true;
        const slots = weekDaySlots[dayKey];
        if(!slots || slots.length === 0){
            if(allCb) allCb.checked = true;
            slotCbs.forEach(cb => { cb.checked = false; });
        }else{
            if(allCb) allCb.checked = false;
            const slotSet = new Set(slots.map(s => Number(s)));
            slotCbs.forEach(cb => {
                cb.checked = slotSet.has(parseInt(cb.value, 10));
            });
        }
        onConstraintDayActiveChange(w);
    }
    syncConstraintChipStyles();
}

function applyWeeksToConstraintUI(weeksList){
    const weekSet = new Set();
    (weeksList || []).forEach(w => {
        if(w === 'all') return;
        const n = parseInt(w, 10);
        if(!Number.isNaN(n)) weekSet.add(n);
    });
    const allCb = document.getElementById('constraintWeekAll');
    if(weekSet.size === 0){
        if(allCb) allCb.checked = true;
        document.querySelectorAll('.constraint-week-cb').forEach(cb => { cb.checked = false; });
    }else{
        if(allCb) allCb.checked = false;
        document.querySelectorAll('.constraint-week-cb').forEach(cb => {
            cb.checked = weekSet.has(parseInt(cb.value, 10));
        });
    }
    syncConstraintChipStyles();
}

function loadConstraintFormFromSaved(){
    const panel = document.getElementById('constraintByDayPanel');
    if(!panel || !panel.querySelector('.constraint-day-row')) return;

    const table = getAutoConfigTable();
    const type = document.getElementById('constraintType')?.value;
    if(!table || !type) return;

    const cfg = ensureAutoConfig(table);
    const teacher = document.getElementById('constraintTeacher')?.value || '';
    const room = document.getElementById('constraintRoom')?.value || '';

    let rules = cfg.constraints.filter(r => r.type === type);
    if(type === 'room_unavailable'){
        if(!room){
            resetConstraintDayPanelToEmpty();
            return;
        }
        rules = rules.filter(r => r.room === room);
    }else if(['teacher_unavailable','teacher_available_only','teacher_max_daily','week_blocked'].includes(type)){
        if(!teacher){
            resetConstraintDayPanelToEmpty();
            applyWeeksToConstraintUI([]);
            return;
        }
        rules = rules.filter(r => constraintTeacherMatches(r.teacher, teacher));
    }

    if(type === 'teacher_max_daily'){
        const weeksMerged = [];
        rules.forEach(r => {
            if(r.weeks && r.weeks.length) weeksMerged.push(...r.weeks);
        });
        applyWeeksToConstraintUI(weeksMerged);
        const maxSel = document.getElementById('constraintMaxCount');
        if(maxSel && rules.length){
            const maxVal = parseInt(rules[rules.length - 1].maxCount, 10);
            if(!Number.isNaN(maxVal)) maxSel.value = String(maxVal);
        }
        return;
    }

    const merged = mergeRulesIntoWeekDaySlots(rules);
    applyWeekDaySlotsToConstraintUI(merged);

    const startSel = document.getElementById('constraintStartTime');
    const endSel = document.getElementById('constraintEndTime');
    const withTime = rules.find(r => r.startTime && r.endTime);
    if(startSel) startSel.value = withTime ? withTime.startTime : '';
    if(endSel) endSel.value = withTime ? withTime.endTime : '';
}

function updateConstraintFieldsVisibility(){
    const type = document.getElementById('constraintType')?.value;
    const teacherWrap = document.getElementById('constraintTeacherWrap');
    const roomWrap = document.getElementById('constraintRoomWrap');
    const maxWrap = document.getElementById('constraintMaxWrap');
    const timeRangeWrap = document.getElementById('constraintTimeRangeWrap');
    const byDayWrap = document.getElementById('constraintByDayWrap');
    const weeksSimpleWrap = document.getElementById('constraintWeeksSimpleWrap');
    if(!type) return;

    const needTeacher = ['teacher_unavailable','teacher_available_only','teacher_max_daily','week_blocked'].includes(type);
    const needRoom = type === 'room_unavailable';
    const needMax = type === 'teacher_max_daily';
    const needTimeRange = !['teacher_max_daily'].includes(type);

    if(teacherWrap) teacherWrap.style.display = needTeacher ? 'inline-flex' : 'none';
    if(roomWrap) roomWrap.style.display = needRoom ? 'inline-flex' : 'none';
    if(maxWrap) maxWrap.style.display = needMax ? 'inline-flex' : 'none';
    if(timeRangeWrap) timeRangeWrap.style.display = needTimeRange ? 'inline-flex' : 'none';
    if(byDayWrap) byDayWrap.style.display = needMax ? 'none' : 'flex';
    if(weeksSimpleWrap) weeksSimpleWrap.style.display = needMax ? 'flex' : 'none';
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

function getSelectedConstraintWeeks(){
    const allCb = document.getElementById('constraintWeekAll');
    if(!allCb || allCb.checked) return [];
    return Array.from(document.querySelectorAll('.constraint-week-cb:checked'))
        .map(cb => parseInt(cb.value, 10))
        .filter(n => !Number.isNaN(n));
}

function getSelectedWeekDaySlotsFromUI(){
    const map = {};
    for(let w = 0; w < weekCount; w++){
        const active = document.querySelector('.constraint-day-active[data-week="'+w+'"]');
        if(!active || !active.checked) continue;
        const allCb = document.querySelector('.constraint-day-all[data-week="'+w+'"]');
        const slotCbs = document.querySelectorAll('.constraint-day-slot-cb[data-week="'+w+'"]:checked');
        if(allCb && allCb.checked){
            map[String(w)] = [];
            continue;
        }
        const slots = Array.from(slotCbs)
            .map(cb => parseInt(cb.value, 10))
            .filter(n => !Number.isNaN(n));
        if(slots.length === 0){
            continue;
        }
        map[String(w)] = slots;
    }
    return map;
}

function toggleConstraintDayAll(week, el){
    document.querySelectorAll('.constraint-day-slot-cb[data-week="'+week+'"]').forEach(cb=>{
        if(el.checked) cb.checked = false;
    });
    const active = document.querySelector('.constraint-day-active[data-week="'+week+'"]');
    if(active && el.checked) active.checked = true;
    onConstraintDayActiveChange(week);
    syncConstraintChipStyles();
}

function onConstraintDaySlotPick(week){
    const allCb = document.querySelector('.constraint-day-all[data-week="'+week+'"]');
    const any = document.querySelectorAll('.constraint-day-slot-cb[data-week="'+week+'"]:checked').length > 0;
    if(any){
        const active = document.querySelector('.constraint-day-active[data-week="'+week+'"]');
        if(active) active.checked = true;
        if(allCb) allCb.checked = false;
    }else if(allCb){
        allCb.checked = true;
    }
    onConstraintDayActiveChange(week);
    syncConstraintChipStyles();
}

function onConstraintDayActiveChange(week){
    const row = document.querySelector('.constraint-day-row[data-week="'+week+'"]');
    const active = document.querySelector('.constraint-day-active[data-week="'+week+'"]');
    if(row && active) row.classList.toggle('inactive', !active.checked);
    syncConstraintChipStyles();
}

function renderConstraintByDayPanel(){
    const panel = document.getElementById('constraintByDayPanel');
    if(!panel) return;
    const allLabel = (typeof t==='function'?t('common.all'):'全部');
    const weekLabels = getWeekLabels();
    const timeArr = getTimeData();
    let html = '';
    for(let w = 0; w < weekCount; w++){
        const dayLabel = weekLabels[w] || ('D'+w);
        let slotsHtml = '<label class="constraint-chip active"><input type="checkbox" class="constraint-day-all" data-week="'+w+'" checked onchange="toggleConstraintDayAll('+w+', this)"> <span>'+allLabel+'</span></label>';
        timeArr.forEach((item, idx)=>{
            if(item.isSplit) return;
            const label = (typeof displayPeriodLabel==='function'?displayPeriodLabel(item.name):item.name);
            slotsHtml += `<label class="constraint-chip"><input type="checkbox" class="constraint-day-slot-cb" data-week="${w}" value="${idx}" onchange="onConstraintDaySlotPick(${w})"> ${escCourseHtml(label)}</label>`;
        });
        html += `<div class="constraint-day-row inactive" data-week="${w}">
            <div class="constraint-day-title"><label><input type="checkbox" class="constraint-day-active" data-week="${w}" onchange="onConstraintDayActiveChange(${w})"> ${escCourseHtml(dayLabel)}</label></div>
            <div class="constraint-day-slots constraint-checkgroup">${slotsHtml}</div>
        </div>`;
    }
    panel.innerHTML = html;
    syncConstraintChipStyles();
    loadConstraintFormFromSaved();
}

function formatWeekDaySlotsLabel(weekDaySlots){
    const labels = getWeekLabels();
    const table = getAutoConfigTable();
    const allSlotsLabel = (typeof t==='function'?t('auto.labelAllSlots'):'全部课时');
    const sepDay = (typeof getAppLang==='function'&&getAppLang()==='en') ? '; ' : '；';
    const sepSlot = (typeof getAppLang==='function'&&getAppLang()==='en') ? ', ' : '、';
    return Object.keys(weekDaySlots).sort((a,b)=>Number(a)-Number(b)).map(dayKey=>{
        const w = parseInt(dayKey, 10);
        const dayName = labels[w] || dayKey;
        const slots = weekDaySlots[dayKey];
        if(!slots || slots.length === 0) return dayName + allSlotsLabel;
        const names = slots.map(i => {
            const raw = table?.timeList[i]?.name || ('第'+(i+1)+'节');
            return (typeof displayPeriodLabel==='function'?displayPeriodLabel(raw):raw);
        }).join(sepSlot);
        return dayName + names;
    }).join(sepDay);
}

function addAutoConstraint(){
    const table = getAutoConfigTable();
    if(!table) return alert(typeof t==='function'?t('auto.selectTable'):'请先选中课表');

    const type = document.getElementById('constraintType').value;
    const teacher = document.getElementById('constraintTeacher')?.value || '';
    const room = document.getElementById('constraintRoom')?.value || '';
    const startTime = document.getElementById('constraintStartTime')?.value || '';
    const endTime = document.getElementById('constraintEndTime')?.value || '';
    const maxCount = parseInt(document.getElementById('constraintMaxCount')?.value, 10) || 2;
    let weeks = [];
    let timeSlots = [];
    let weekDaySlots = {};
    if(type === 'teacher_max_daily'){
        weeks = getSelectedConstraintWeeks();
    }else{
        weekDaySlots = getSelectedWeekDaySlotsFromUI();
        const dayKeys = Object.keys(weekDaySlots);
        const hasTime = !!(startTime && endTime);
        if(dayKeys.length === 0 && !hasTime){
            return alert(typeof t==='function'?t('auto.needDayScope'):'请至少勾选一天并选择课时，或设置起止时段');
        }
    }

    if(['teacher_unavailable','teacher_available_only','teacher_max_daily','week_blocked'].includes(type) && !teacher){
        return alert(typeof t==='function'?t('course.selectTeacher'):'请选择教师');
    }
    if(type === 'room_unavailable' && !room) return alert(typeof t==='function'?t('course.selectRoom'):'请选择教室');

    const rule = {
        id: 'rule_' + Date.now(),
        type,
        teacher: normalizeTeacherKey(teacher),
        room,
        weeks,
        timeSlots,
        weekDaySlots,
        startTime,
        endTime,
        maxCount,
        label: buildConstraintLabel(type, { teacher, room, weeks, timeSlots, weekDaySlots, startTime, endTime, maxCount })
    };

    const cfg = ensureAutoConfig(table);
    cfg.constraints.push(rule);
    saveTableList();
    renderConstraintList();
    loadConstraintFormFromSaved();
    alert(typeof t==='function'?t('auto.constraintAdded'):'✅ 限制条件已添加');
}

function buildConstraintLabel(type, o){
    const typeName = getAutoConstraintTypes()[type] || type;
    let parts = [typeName];
    if(o.teacher) parts.push(typeof t==='function'?t('auto.labelTeacher',{name:o.teacher}):(`教师:${o.teacher}`));
    if(o.room) parts.push(typeof t==='function'?t('auto.labelRoom',{name:o.room}):(`教室:${o.room}`));
    if(o.weekDaySlots && Object.keys(o.weekDaySlots).length > 0){
        parts.push(formatWeekDaySlotsLabel(o.weekDaySlots));
    }else if(o.weeks?.length){
        parts.push(o.weeks.map(w => getWeekLabels()[w]).join(typeof getAppLang==='function'&&getAppLang()==='en'?', ':'、'));
    }else if(type !== 'teacher_max_daily'){
        parts.push(typeof t==='function'?t('auto.labelAllWeek'):'全周');
    }
    if(!o.weekDaySlots || Object.keys(o.weekDaySlots).length === 0){
        if(o.timeSlots?.length){
            const table = getAutoConfigTable();
            const names = o.timeSlots.map(i => {
                const raw = table?.timeList[i]?.name || (`第${i+1}节`);
                return (typeof displayPeriodLabel==='function'?displayPeriodLabel(raw):raw);
            }).join(typeof getAppLang==='function'&&getAppLang()==='en'?', ':'、');
            parts.push(names);
        }
    }
    if(o.startTime && o.endTime) parts.push(`${o.startTime}-${o.endTime}`);
    if(type === 'teacher_max_daily') parts.push(typeof t==='function'?t('auto.labelMaxDaily',{n:o.maxCount}):(`最多${o.maxCount}节/天`));
    return parts.join(' · ');
}

function delAutoConstraint(id){
    const table = getAutoConfigTable();
    if(!table) return;
    const cfg = ensureAutoConfig(table);
    cfg.constraints = cfg.constraints.filter(r => r.id !== id);
    saveTableList();
    renderConstraintList();
    loadConstraintFormFromSaved();
}

function renderConstraintList(){
    const tbody = document.getElementById('constraintListBody');
    if(!tbody) return;
    const table = getAutoConfigTable();
    const rules = table ? ensureAutoConfig(table).constraints : [];
    if(rules.length === 0){
        tbody.innerHTML = '<tr><td colspan="3" class="search-empty">'+(typeof t==='function'?t('auto.noConstraints'):'暂无限定条件，可在下方添加')+'</td></tr>';
        return;
    }
    tbody.innerHTML = rules.map(r => `<tr>
        <td>${escCourseHtml(r.label || r.type)}</td>
        <td>${escCourseHtml(getAutoConstraintTypes()[r.type] || r.type)}</td>
        <td><button class="del" onclick="delAutoConstraint('${r.id}')">${typeof t==='function'?t('common.delete'):'删除'}</button></td>
    </tr>`).join('');
}

const AUTO_SESSION_COUNT_MAX = 50;

function renderAutoSessionCountSelect(){
    const sel = document.getElementById('autoSessionCount');
    if(!sel) return;
    const prev = parseInt(sel.value, 10);
    let html = '';
    for(let n = 1; n <= AUTO_SESSION_COUNT_MAX; n++){
        const label = (typeof t === 'function')
            ? t('auto.sessions', { n: n })
            : (n + ' 节');
        html += `<option value="${n}" data-i18n="auto.sessions" data-i18n-n="${n}">${escCourseHtml(label)}</option>`;
    }
    sel.innerHTML = html;
    const restore = (!Number.isNaN(prev) && prev >= 1 && prev <= AUTO_SESSION_COUNT_MAX) ? prev : 5;
    sel.value = String(restore);
}

function renderAutoSchedulePanel(){
    const teacherSel = document.getElementById('autoTeacherSelect');
    const courseSel = document.getElementById('autoCourseSelect');
    const cTeacherSel = document.getElementById('constraintTeacher');
    const cRoomSel = document.getElementById('constraintRoom');
    if(!teacherSel) return;

    renderAutoSessionCountSelect();

    const prevTeacher = teacherSel.value;
    const prevConstraintTeacher = cTeacherSel ? cTeacherSel.value : '';
    const teachers = getTeachersForCurrentTableClass();
    let tHtml = '<option value="">'+(typeof t==='function'?t('course.selectTeacher'):'选择教师')+'</option>';
    teachers.forEach(name => { tHtml += `<option value="${escCourseHtml(name)}">${escCourseHtml(name)}</option>`; });
    teacherSel.innerHTML = tHtml;
    if(prevTeacher && teachers.includes(prevTeacher)) teacherSel.value = prevTeacher;
    if(cTeacherSel){
        cTeacherSel.innerHTML = tHtml;
        if(prevConstraintTeacher && teachers.includes(prevConstraintTeacher)) cTeacherSel.value = prevConstraintTeacher;
    }

    const rooms = getRoomData();
    if(cRoomSel){
        let rHtml = '<option value="">'+(typeof t==='function'?t('course.selectRoom'):'选择教室')+'</option>';
        rooms.forEach(name => { rHtml += `<option value="${escCourseHtml(name)}">${escCourseHtml(name)}</option>`; });
        cRoomSel.innerHTML = rHtml;
    }

    refreshAutoCourseSelect();
    renderConstraintByDayPanel();

    const table = getAutoConfigTable();
    if(table){
        const cfg = ensureAutoConfig(table);
        const onlyEmpty = document.getElementById('autoOnlyEmpty');
        const checkGlobal = document.getElementById('autoCheckGlobal');
        const spreadWeek = document.getElementById('autoSpreadWeek');
        if(onlyEmpty) onlyEmpty.checked = cfg.settings.onlyEmpty !== false;
        if(checkGlobal) checkGlobal.checked = cfg.settings.checkGlobal !== false;
        if(spreadWeek) spreadWeek.checked = cfg.settings.spreadWeek !== false;
        const allowRepack = document.getElementById('autoAllowRepack');
        if(allowRepack) allowRepack.checked = cfg.settings.allowRepack !== false;
    }

    renderConstraintList();
    updateConstraintFieldsVisibility();
    loadConstraintFormFromSaved();
    syncConstraintChipStyles();
}

function refreshAutoCourseSelect(){
    const courseSel = document.getElementById('autoCourseSelect');
    const teacher = document.getElementById('autoTeacherSelect')?.value;
    if(!courseSel) return;
    const table = getAutoConfigTable();
    const bindClass = table?.bindClass || '';
    let html = '<option value="">'+(typeof t==='function'?t('auto.matchCourse'):'自动匹配课程')+'</option>';
    if(teacher){
        getTeacherCoursesForTable(teacher, bindClass).forEach(c => {
            const key = `${c.name}|${c.teacher}|${c.room}|${c.cls}`;
            const nameLabel = (typeof displayCourseName==='function'?displayCourseName(c.name):c.name);
            const roomLabel = (typeof displayLocaleText==='function'?displayLocaleText(c.room):c.room);
            html += `<option value="${escCourseHtml(key)}">${escCourseHtml(nameLabel)} · ${escCourseHtml(roomLabel)}</option>`;
        });
    }
    courseSel.innerHTML = html;
}

function initAutoConstraintTimeSelects(){
    const startSel = document.getElementById('constraintStartTime');
    const endSel = document.getElementById('constraintEndTime');
    if(!startSel || !endSel || typeof TIME_OPTIONS === 'undefined') return;
    const prevStart = startSel.value;
    const prevEnd = endSel.value;
    const anyLabel = (typeof t==='function'?t('auto.unlimited'):'不限');
    let opt = '<option value="">'+anyLabel+'</option>';
    TIME_OPTIONS.forEach(tm => { opt += `<option value="${tm}">${tm}</option>`; });
    startSel.innerHTML = opt;
    endSel.innerHTML = opt;
    if(prevStart) startSel.value = prevStart;
    if(prevEnd) endSel.value = prevEnd;
}
