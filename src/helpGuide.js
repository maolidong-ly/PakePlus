/**
 * In-app user guide (zh / en). No product/brand name in the copy.
 */
(function (global) {
    'use strict';

    var HELP_GUIDE = {
        zh: {
            title: '说明与操作指南',
            html: [
                '<h3>一、功能说明</h3>',
                '<p>本软件用于课表管理，支持：班级、教师、教室、课程维护；课时模版；手工与自动排课；冲突检测；占用查询；Excel / 图片导出与 JSON 备份；多用户权限与局域网同步（可选）。</p>',
                '<p><b>数据存储：</b>桌面版写入本机应用数据目录；浏览器版使用本地存储。清除浏览器缓存可能导致数据丢失，请定期「导出全部备份」。</p>',
                '<p><b>授权：</b>首次使用享有试用期，到期后需激活。点击试用角标可打开激活窗口。</p>',

                '<h3>二、重要规则</h3>',
                '<ul>',
                '<li><b>班级名称 = 课表名称</b>；在「班级」页新增后自动创建同名课表。</li>',
                '<li><b>课程必须绑定班级</b>；排课时只显示当前课表对应班级的课程。</li>',
                '<li><b>删除班级</b>会同步删除对应课表、排课数据及该班全部课程。</li>',
                '<li><b>修改班级名</b>会同步课表名与课程中的班级字段。</li>',
                '<li><b>每张课表有独立课时列表</b>；切换顶部「当前课表」后，「课时」页随之变化。</li>',
                '<li><b>上课时间建议写在课时名称中</b>（如「第1节 08:20-09:10」）；也可在排课区手动选择起止时间覆盖。清空起止时间可恢复自动识别。</li>',
                '<li><b>分割行</b>（午休 / 晚饭等）仅作分隔，不可排课。</li>',
                '</ul>',

                '<h3>三、推荐上手顺序</h3>',
                '<p>登录 → 课时（选模版或自建）→ 班级 → 教师 / 教室 → 课程 → 排课 → 冲突检测 → 导出 / 备份</p>',

                '<h3>四、分模块操作</h3>',
                '<h4>1. 用户与权限</h4>',
                '<p>首次创建管理员账号。角色：管理员（可编辑+管用户）、编辑（可改课表）、只读（仅查看）。</p>',

                '<h4>2. 课时</h4>',
                '<p>先选当前课表。可手动添加课时，或从「课时模版」下拉选择（下方列表立即切换）。编辑后点「保存模版」写入本地。名称示例：第1节 08:20-09:10；早自习7:40-8:15。</p>',

                '<h4>3. 班级</h4>',
                '<p>输入名称（可选课时模版）→ 新增。可改名、删除、检索，并单独备份 / 导入。</p>',

                '<h4>4. 教师 / 教室</h4>',
                '<p>新增、检索、修改、删除；各自支持 JSON 备份与导入。</p>',

                '<h4>5. 课程</h4>',
                '<p>一条课程 = 课程名 + 教师 + 教室 + 班级。可按班级 / 教师 / 教室分组查看。班级删除后，该班课程会自动清理。</p>',

                '<h4>6. 手工排课</h4>',
                '<p>选课表 → 选课程（及可选起止时间）→ 点击单元格写入。工具：撤销 / 重做、冲突检测、清空单元格、一键清空、保存快照、导出 Excel / 图片 / 打印、按教师或教室导出。</p>',

                '<h4>7. 自动排课</h4>',
                '<p>选择教师、节数、课程后执行。可设限制条件（如某师周三不可排、每日最多 N 节等），条件保存在当前课表。</p>',

                '<h4>8. 冲突检测</h4>',
                '<p>检查全部课表中教师、教室时间重叠；冲突格标红，可查看详情。</p>',

                '<h4>9. 占用查询</h4>',
                '<p>按教师或教室查看占用与空余；绿=空闲，红=已排；范围可选全部课表或当前课表。</p>',

                '<h4>10. 导出与备份</h4>',
                '<p>导出 Excel / 图片 / 打印；全量或单课表 JSON 备份与导入。退出前建议先备份。桌面版使用系统「另存为」；浏览器可能提示允许下载。</p>',

                '<h4>11. 语言与主题</h4>',
                '<p>顶栏可切换中文 / English，以及深色 / 浅色主题。</p>',

                '<h4>12. 局域网（可选）</h4>',
                '<p>一台主机运行配套服务并上传数据；其他电脑填写主机 IP 后用账号登录。权限跟随账号。</p>',

                '<h3>五、常见问题</h3>',
                '<ul>',
                '<li><b>课程下拉为空：</b>请为当前课表对应班级添加课程，并确认已选中该课表。</li>',
                '<li><b>提示选择起止时间：</b>课时名中无可识别时间段，请补全或手动选择时间。</li>',
                '<li><b>担心丢数据：</b>定期「导出全部备份」保存 JSON 文件。</li>',
                '</ul>'
            ].join('')
        },
        en: {
            title: 'Guide & Instructions',
            html: [
                '<h3>1. Overview</h3>',
                '<p>This app is for timetable management: classes, teachers, rooms, courses, period templates, manual and auto scheduling, conflict checks, occupancy queries, Excel/image export, JSON backup, multi-user roles, and optional LAN sync.</p>',
                '<p><b>Data storage:</b> Desktop builds write to the app data folder; the browser uses local storage. Clearing browser cache may erase data—export a full backup regularly.</p>',
                '<p><b>License:</b> A trial period starts on first use; activation is required when it ends. Click the trial badge to open activation.</p>',

                '<h3>2. Key rules</h3>',
                '<ul>',
                '<li><b>Class name = timetable name.</b> Adding a class creates a matching timetable automatically.</li>',
                '<li><b>Every course is bound to a class.</b> The schedule course list only shows courses for the current timetable’s class.</li>',
                '<li><b>Deleting a class</b> also deletes its timetable, schedule data, and all courses for that class.</li>',
                '<li><b>Renaming a class</b> updates the timetable name and course class fields.</li>',
                '<li><b>Each timetable has its own period list.</b> Switch “Current” in the top bar to edit that timetable’s periods.</li>',
                '<li><b>Put times in period names</b> (e.g. “Period 1 08:20-09:10”). You can also set start/end time manually when scheduling; clear both fields to restore auto detection.</li>',
                '<li><b>Split rows</b> (lunch / dinner, etc.) are separators only—not schedulable.</li>',
                '</ul>',

                '<h3>3. Suggested setup order</h3>',
                '<p>Sign in → Periods (template or custom) → Classes → Teachers / Rooms → Courses → Schedule → Conflict check → Export / Backup</p>',

                '<h3>4. Modules</h3>',
                '<h4>1. Users & roles</h4>',
                '<p>Create an admin on first launch. Roles: Admin (edit + manage users), Editor (edit data), Viewer (read-only).</p>',

                '<h4>2. Periods</h4>',
                '<p>Select the current timetable first. Add periods manually, or pick a saved template (the list below switches immediately). Use “Save template” after editing. Examples: Period 1 08:20-09:10; Morning study 7:40-8:15.</p>',

                '<h4>3. Classes</h4>',
                '<p>Enter a name (optional period template) → Add. Rename, delete, search; export/import class lists separately.</p>',

                '<h4>4. Teachers / Rooms</h4>',
                '<p>Add, search, edit, delete; each supports JSON backup/import.</p>',

                '<h4>5. Courses</h4>',
                '<p>One course = name + teacher + room + class. Group by class / teacher / room. Courses for a deleted class are removed automatically.</p>',

                '<h4>6. Manual scheduling</h4>',
                '<p>Select timetable → choose course (and optional start/end) → click a cell. Tools: undo/redo, conflict check, clear cell, clear all, snapshot, export Excel/image/print, export by teacher or room.</p>',

                '<h4>7. Auto-schedule</h4>',
                '<p>Pick teacher, session count, and course, then run. Add constraints (e.g. unavailable weekdays, max periods per day). Constraints are saved on the current timetable.</p>',

                '<h4>8. Conflict check</h4>',
                '<p>Detects teacher/room overlaps across all timetables; conflicting cells are highlighted; open details for more.</p>',

                '<h4>9. Occupancy query</h4>',
                '<p>View teacher or room busy/free slots. Green = free, red = booked. Scope: all timetables or current only.</p>',

                '<h4>10. Export & backup</h4>',
                '<p>Export Excel/image/print; full or single-timetable JSON backup/restore. Back up before exit. Desktop uses a Save dialog; browsers may ask to allow downloads.</p>',

                '<h4>11. Language & theme</h4>',
                '<p>Switch Chinese / English and dark / light theme from the header.</p>',

                '<h4>12. LAN sync (optional)</h4>',
                '<p>One host runs the companion server and uploads data; other PCs enter the host IP and sign in. Permissions follow the account.</p>',

                '<h3>5. FAQ</h3>',
                '<ul>',
                '<li><b>Empty course list:</b> Add courses for the current class and confirm the correct timetable is selected.</li>',
                '<li><b>Asked for start/end time:</b> Period name has no parseable time—fix it or set times manually.</li>',
                '<li><b>Data safety:</b> Export a full JSON backup regularly.</li>',
                '</ul>'
            ].join('')
        }
    };

    function getHelpLang() {
        if (typeof getAppLang === 'function') {
            var lang = getAppLang();
            if (lang === 'en' || lang === 'zh') return lang;
        }
        return 'zh';
    }

    function renderHelpGuide() {
        var pack = HELP_GUIDE[getHelpLang()] || HELP_GUIDE.zh;
        var titleEl = document.getElementById('helpGuideTitle');
        var bodyEl = document.getElementById('helpGuideBody');
        if (titleEl) titleEl.textContent = pack.title;
        if (bodyEl) bodyEl.innerHTML = pack.html;
    }

    function openHelpGuide() {
        renderHelpGuide();
        var modal = document.getElementById('helpGuideModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeHelpGuide() {
        var modal = document.getElementById('helpGuideModal');
        if (modal) modal.style.display = 'none';
    }

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var modal = document.getElementById('helpGuideModal');
        if (modal && modal.style.display === 'flex') closeHelpGuide();
    });

    global.HELP_GUIDE = HELP_GUIDE;
    global.renderHelpGuide = renderHelpGuide;
    global.openHelpGuide = openHelpGuide;
    global.closeHelpGuide = closeHelpGuide;
})(window);
