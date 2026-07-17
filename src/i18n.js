/* 多语言：中文 / English */
(function (global) {
    'use strict';

    var LANG_KEY = 'schedule_app_lang';

    var DICT = {
        zh: {
            'app.title': '西典学校排课系统',
            'app.subtitle': '智能课表管理 · 多维度排课',
            'app.editBrand': '点击修改程序名称',
            'app.namePlaceholder': '程序名称',
            'app.subtitlePlaceholder': '副标题（可选）',
            'app.docTitle': '西典学校排课系统',

            'common.save': '保存',
            'common.cancel': '取消',
            'common.confirm': '确定',
            'common.close': '关闭',
            'common.delete': '删除',
            'common.edit': '修改',
            'common.add': '添加',
            'common.search': '检索',
            'common.copy': '复制',
            'common.index': '序号',
            'common.action': '操作',
            'common.pleaseSelect': '请选择',
            'common.tip': '提示',
            'common.loading': '加载中…',
            'common.backupImport': '备份 / 导入',
            'common.all': '全部',
            'common.type': '类型',
            'common.expand': '展开',
            'common.collapse': '折叠',

            'week.mon': '周一',
            'week.tue': '周二',
            'week.wed': '周三',
            'week.thu': '周四',
            'week.fri': '周五',
            'week.sat': '周六',
            'week.sun': '周日',
            'week.period': '课时',

            'header.lan': '局域网',
            'header.lanTitle': '局域网主机连接与同步',
            'header.userManage': '用户管理',
            'header.userManageTitle': '添加或删除用户、修改密码',
            'header.help': '说明',
            'header.helpTitle': '说明与操作指南',
            'header.logout': '退出登录',
            'header.logoutTitle': '退出当前登录',
            'header.theme': '主题',
            'header.themeTitle': '切换主题',
            'header.themeDark': '深色',
            'header.themeLight': '浅色',
            'header.exit': '退出',
            'header.lang': 'Language',
            'header.langTitle': 'Switch language / 切换语言',
            'header.trial': '试用期',
            'header.currentUser': '当前登录用户',
            'header.lanRole': '局域网权限',

            'tableMgr.current': '当前',
            'tableMgr.searchPlaceholder': '检索课表…',
            'tableMgr.deleteCurrent': '删除当前课表',
            'tableMgr.hint': '课表名称与班级名称一致；请在「班级」页新增或修改班级，系统自动创建/同步课表。',
            'tableMgr.storageTitle': '本地存储占用',
            'tableMgr.storageClick': '点击查看备份',
            'tableMgr.storageComputing': '存储用量计算中…',

            'nav.time': '课时',
            'nav.class': '班级',
            'nav.teacher': '教师',
            'nav.room': '教室',
            'nav.course': '课程',
            'nav.schedule': '排课',
            'nav.query': '查询',

            'time.name': '课时名称：',
            'time.namePlaceholder': '输入课时名称',
            'time.normal': '普通课时',
            'time.split': '分割行(午休/晚饭)',
            'time.add': '添加课时',
            'time.template': '课时模版：',
            'time.templateSelect': '选择已保存模版',
            'time.preview': '查看模版',
            'time.load': '加载模版',
            'time.saveTpl': '保存模版',
            'time.exportTpl': '导出模版文件',
            'time.rename': '重命名',
            'time.deleteTpl': '删除',
            'time.hint': '下拉选择模版即切换下方课时；编辑后点「保存模版」写入本机。打包前请点「导出模版文件」并替换项目里的 timeTemplates.json',
            'time.colName': '课时名称',

            'class.name': '班级名称：',
            'class.namePlaceholder': '输入班级名称（即课表名称）',
            'class.defaultTime': '默认课时',
            'class.timeTplTitle': '课时模版',
            'class.add': '新增班级',
            'class.hint': '新增班级后自动创建同名课表，无需再单独新建课表',
            'class.export': '导出班级',
            'class.import': '导入班级',
            'class.searchPlaceholder': '输入班级名称快速筛选…',
            'class.colName': '班级名称',

            'teacher.name': '教师姓名：',
            'teacher.namePlaceholder': '输入教师姓名',
            'teacher.add': '新增教师',
            'teacher.export': '导出教师',
            'teacher.import': '导入教师',
            'teacher.searchPlaceholder': '输入教师姓名快速筛选…',
            'teacher.colName': '教师姓名',

            'room.name': '教室名称：',
            'room.namePlaceholder': '输入教室名称',
            'room.add': '新增教室',
            'room.export': '导出教室',
            'room.import': '导入教室',
            'room.colName': '教室名称',

            'course.name': '课程名称：',
            'course.selectName': '请选择课程名称',
            'course.selectTeacher': '选择教师',
            'course.selectRoom': '选择场地',
            'course.selectClass': '选择学员组',
            'course.add': '新增课程',
            'course.export': '导出课程',
            'course.import': '导入课程数据',
            'course.groupBy': '分组维度：',
            'course.byClass': '按班级',
            'course.byTeacher': '按教师',
            'course.byRoom': '按教室',
            'course.searchPlaceholder': '检索课程/教师/教室/班级…',

            'schedule.undo': '上一步',
            'schedule.redo': '下一步',
            'schedule.conflictCheck': '冲突检测',
            'schedule.conflictDetail': '查看冲突详情',
            'schedule.exportExcel': '导出 Excel',
            'schedule.exportImage': '导出图片',
            'schedule.print': '打印',
            'schedule.clearCell': '清空单元格',
            'schedule.clearAll': '一键清空',
            'schedule.saveSnapshot': '保存快照',
            'schedule.exportMore': '导出教师/教室课表',
            'schedule.exportByTarget': '按教师 / 教室导出',
            'schedule.selectTeacher': '选择教师',
            'schedule.selectRoom': '选择教室',
            'schedule.settings': '排课设置',
            'schedule.view': '视图',
            'schedule.viewClass': '学员组视图',
            'schedule.viewTeacher': '教师视图',
            'schedule.viewRoom': '场地视图',
            'schedule.course': '课程',
            'schedule.startTime': '开始时间',
            'schedule.endTime': '结束时间',
            'schedule.selectStart': '请选择开始时间',
            'schedule.selectEnd': '请选择结束时间',
            'schedule.timeHint': '未选手动时间时按课时自动识别；手动选择后优先生效（各课表通用）。清空起止时间可恢复自动识别。',

            'export.corner': '课时/星期',
            'export.week.mon': '星期一',
            'export.week.tue': '星期二',
            'export.week.wed': '星期三',
            'export.week.thu': '星期四',
            'export.week.fri': '星期五',
            'export.week.sat': '星期六',
            'export.week.sun': '星期日',
            'export.scheduleTitle': '{name} 课程表',
            'export.teacherScheduleTitle': '{name} 教师课程表（全部课表合并）',
            'export.roomScheduleTitle': '{name} 教室占用表（全部课表合并）',
            'export.teacher': '教师：{name}',
            'export.room': '教室：{name}',
            'export.class': '班级：{name}',
            'export.periodFallback': '课时{n}',
            'export.fileSchedule': '{name}_课表',
            'export.fileTeacher': '{name}_教师课表',
            'export.fileRoom': '{name}_教室占用表',
            'export.imageOk': '✅ 课表图片导出成功',
            'export.teacherImageOk': '✅ 教师课表图片导出成功',
            'export.roomImageOk': '✅ 教室占用表图片导出成功',
            'export.noTeacherLessons': '未找到教师【{name}】的排课记录',
            'export.noRoomLessons': '未找到教室【{name}】的占用记录',
            'export.fileFilter': '文件',
            'export.fileTypeDesc': '{ext} 文件',
            'export.saveFallbackDownload': '无法保存到所选文件夹，文件已导出到默认下载目录：\n{name}',
            'export.savePermissionFail': '保存失败，请检查应用是否有写入文件的权限',
            'export.saveDialogFail': '无法打开保存对话框，请更新 PakePlus 后重新打包，或开启 Debug 模式查看控制台报错',
            'export.browserNoPicker': '当前浏览器不支持选择保存位置，文件将保存到默认下载文件夹',
            'export.imageFallbackDownload': '图片已保存到下载文件夹（所选位置写入失败）：\n{name}',
            'export.html2canvasMissing': '图片导出模块未加载，请检查网络连接后重试',
            'export.imageGenFail': '图片生成失败，请重试',
            'export.imageExportFail': '图片导出失败：{msg}',
            'export.unknownError': '未知错误',

            'auto.title': '自动排课与限制条件',
            'auto.teacher': '教师',
            'auto.count': '次数',
            'auto.course': '课程',
            'auto.matchCourse': '自动匹配课程',
            'auto.run': '执行自动排课',
            'auto.clearTeacher': '清除该师排课',
            'auto.onlyEmpty': '仅填空白格',
            'auto.checkGlobal': '检测全局冲突',
            'auto.spreadWeek': '均匀分布到各天',
            'auto.addConstraint': '添加限制条件',
            'auto.constraintType': '类型',
            'auto.teacherUnavailable': '教师不可上课',
            'auto.teacherAvailableOnly': '教师仅可上课时段',
            'auto.roomUnavailable': '教室不可使用',
            'auto.teacherMaxDaily': '教师每日最多节数',
            'auto.slotBlocked': '课时行全员不可用',
            'auto.weekBlocked': '星期不可用',
            'auto.room': '教室',
            'auto.week': '星期',
            'auto.slotRow': '课时行',
            'auto.timeRange': '时段',
            'auto.max': '最多',
            'auto.sessionsPerDay': '{n} 节/天',
            'auto.sessions': '{n} 节',
            'auto.addRule': '添加条件',
            'auto.colDesc': '条件说明',
            'auto.colType': '类型',
            'auto.hint': '提示：限制条件保存在当前课表中。可组合多条规则，如「某师周三不可排」「某师仅上午可排」「每日最多2节」等。',
            'auto.unlimited': '不限',
            'auto.noConstraints': '暂无限定条件，可在下方添加',
            'auto.constraintAdded': '✅ 限制条件已添加',
            'auto.selectTable': '请先选中课表',
            'auto.labelTeacher': '教师:{name}',
            'auto.labelRoom': '教室:{name}',
            'auto.labelAllWeek': '全周',
            'auto.labelMaxDaily': '最多{n}节/天',

            'backup.title': '备份与恢复',
            'backup.exportAll': '导出全部备份',
            'backup.exportCurrent': '导出当前课表',
            'backup.importAll': '全局导入',
            'backup.importSingle': '单课表导入',
            'backup.reset': '重置数据',
            'backup.hint': '全量备份含所有课表与基础数据；建议定期导出 JSON 备份。',

            'occ.title': '占用查询',
            'occ.desc': '跨课表查看教师 / 教室的占用与空余时段，绿色为空闲，红色区域为已排课',
            'occ.teacher': '教师',
            'occ.room': '教室',
            'occ.searchTeacher': '搜索教师…',
            'occ.searchRoom': '搜索教室…',
            'occ.scope': '范围',
            'occ.scopeAll': '全部课表',
            'occ.scopeCurrent': '当前课表',
            'occ.empty': '请选择教师或教室开始查询',
            'occ.freeList': '空余时段一览',

            'license.title': '软件激活',
            'license.hint': '请将下方机器码发给管理员，获取激活码后输入。',
            'license.machineId': '本机机器码',
            'license.reading': '读取中…',
            'license.key': '激活码',
            'license.activate': '激活',

            'login.title': '用户登录',
            'login.hint': '请输入用户名和密码登录系统。',
            'login.username': '用户名',
            'login.password': '密码',
            'login.confirmPassword': '确认密码',
            'login.confirmPlaceholder': '再次输入密码',
            'login.submit': '登录',
            'login.setupTitle': '创建管理员账号',
            'login.setupHint': '首次使用，请创建管理员账号。',

            'user.title': '用户管理',
            'user.existing': '已有用户',
            'user.noteLocal': '密码保存在本机浏览器中，仅作简单访问控制，请勿用于高安全场景。',
            'user.addUser': '添加用户',
            'user.roleViewer': '只读',
            'user.roleEditor': '编辑',
            'user.roleAdmin': '管理员',
            'user.roleTitle': '权限',
            'user.notePerm': '权限说明：管理员=可编辑+管用户；编辑=可改课表；只读=仅查看。局域网下权限跟随账号，不限电脑。',
            'user.changePwd': '修改我的密码',
            'user.oldPwd': '原密码',
            'user.newPwd': '新密码',
            'user.confirmNewPwd': '确认新密码',
            'user.change': '修改',

            'lan.title': '局域网同步',
            'lan.help': '指定一台电脑作主机：把 lan-server 整夹拷过去，Windows 双击 start-host-windows.bat（自带运行环境，不必装 Python），Mac 双击「启动主机-Mac.command」，再在本机「初始化主机」上传数据。其他电脑填写主机 IP，用有权限账号登录即可；管理员/编辑可在任意电脑执行全部编辑功能，只读账号仅可查看。',
            'lan.hostAddress': '主机地址',
            'lan.hostPlaceholder': '主机 IP，如 192.168.1.8',
            'lan.port': '端口',
            'lan.probe': '检测主机',
            'lan.statusOffline': '未连接（本机独立使用）',
            'lan.asHost': '本机作为主机（首次）',
            'lan.bootstrap': '初始化主机并上传本机数据',
            'lan.connectSection': '其他电脑连接主机',
            'lan.connect': '连接并登录',
            'lan.disconnect': '断开',

            'exit.title': '退出前请备份数据',
            'exit.body': '关闭软件前，建议先完成以下操作，以免数据丢失：',
            'exit.item1': '导出课表 — 在「课表排课」中导出 Excel 课表、教师课表或教室占用表',
            'exit.item2': '导出全部备份 — 在「课表排课 → 全局 / 单课表备份与恢复」中导出 JSON 全量备份',
            'exit.warn': '数据仅保存在浏览器本地，清除缓存、更换设备或误删浏览器数据可能导致无法恢复。',
            'exit.goBackup': '去备份 / 导出',
            'exit.force': '仍要退出',

            'role.viewer': '只读',
            'role.editor': '编辑',
            'role.admin': '管理员',
            'role.viewerFull': '只读（仅查看）',
            'role.editorFull': '编辑（可改课表）',
            'role.adminFull': '管理员（可编辑+管用户）',

            'msg.enterUsername': '请输入用户名',
            'msg.enterPassword': '请输入密码',
            'msg.passwordMismatch': '两次输入的密码不一致',
            'msg.userExists': '该用户名已存在',
            'msg.badCredentials': '用户名或密码错误',
            'msg.confirmLogout': '确定退出当前登录？',
            'msg.pleaseLogin': '请先登录',
            'msg.needAdmin': '需要管理员权限',
            'msg.keepOneAdmin': '至少保留一名管理员',
            'msg.cannotRemoveOwnAdmin': '不能取消自己的管理员权限',
            'msg.cannotDeleteSelf': '不能删除当前登录的账号，请先换其他账号登录',
            'msg.confirmDeleteUser': '确定删除用户「{name}」？',
            'msg.keepOneUser': '至少保留一个用户，无法删除',
            'msg.fillComplete': '请填写完整',
            'msg.oldPasswordWrong': '原密码错误',
            'msg.newPasswordMismatch': '两次新密码不一致',
            'msg.passwordChanged': '密码已修改',
            'msg.userAdded': '用户「{name}」已添加（{role}）',
            'msg.userAddedHost': '用户「{name}」已添加到主机',
            'msg.lanLoginBlocked': '局域网模式下请在主机初始化账号，或先断开局域网',
            'msg.lanLoginFail': '局域网登录失败：{err}\n\n若主机刚重启或用户列表异常，可先在「局域网」里断开，再用本机账号登录。',
            'msg.lanPwdHint': '局域网模式下修改密码请在主机用户数据中维护（后续可加改密接口）',
            'msg.needAdminAddUser': '需要管理员权限才能添加用户',
            'msg.noManageUsers': '当前账号无权管理用户',

            'msg.lanDataUpdated': '主机数据已更新，已为你刷新；请再确认后重新保存。',
            'msg.lanProbeOk': '主机在线。\n可连接地址：{ips}\n当前用户数：{count}',
            'msg.lanProbeFail': '无法连接主机：{err}\n请确认已在主机电脑运行「启动主机」脚本，且防火墙放行端口 {port}',
            'msg.lanBootstrapOk': '主机初始化成功。\n其他电脑请连接：{addr}\n然后用有权限的账号登录即可编辑。',
            'msg.lanBootstrapFail': '初始化失败：{err}',
            'msg.lanNeedHost': '请填写主机 IP',
            'msg.lanNeedLogin': '请填写局域网登录用户名和密码',
            'msg.lanConnected': '已连接局域网主机。权限跟随账号：有编辑权限即可在本机完整操作。',
            'msg.lanConnectFail': '连接失败：{err}',
            'msg.lanConfirmDisconnect': '确定断开局域网主机？将回到本机本地数据。',
            'msg.lanDisconnected': '已断开局域网连接',
            'msg.lanStatusConnected': '已连接主机 {host} · {role}',
            'msg.lanStatusPending': '已填写主机 {host}，待登录',
            'msg.lanEditable': '可编辑',
            'msg.lanReadonly': '只读',

            'msg.brandEmpty': '程序名称不能为空',
            'msg.noTable': '暂无选中课表，请先新建或选择课表',
            'msg.undoEnd': '已经是最早一步，无法撤销',
            'msg.redoEnd': '已经是最新一步，无法重做',
            'msg.saveFailed': '❌ 数据保存失败（当前方案：{backend}）。请先导出全部备份，并删除不需要的课表或基础数据后重试。',
            'msg.selectTableFirst': '请先选中一张课表',
            'msg.noPeriods': '当前课表没有课时，无法保存模版',
            'msg.updateTemplate': '是否更新模版「{name}」？\n点「取消」可另存为新模版。',
            'msg.templateUpdated': '课时模版「{name}」已更新',
            'msg.enterTemplateName': '请输入课时模版名称',
            'msg.templateExists': '该模版名称已存在，请换一个名称，或先在下拉菜单选中该模版后点保存进行更新',
            'msg.templateSaved': '课时模版保存成功，已写入软件本地，下次打开仍可使用',
            'msg.selectTemplate': '请先在下拉列表选择一个已保存的模版',
            'msg.templateNotFound': '未找到该模版',
            'msg.confirmApplyTemplate': '确定用选中模版覆盖当前课表的课时设置吗？',
            'msg.templateLoaded': '模版加载完成，当前课表课时已更新',
            'msg.selectRenameTemplate': '请先选择要重命名的模版',
            'msg.enterNewTemplateName': '请输入模版新名称',
            'msg.confirmDeleteTemplate': '确定删除模版「{name}」？',
            'msg.templateDeleted': '模版已删除',
            'msg.templateRenamed': '模版已重命名',

            'msg.emptySchedule': '暂无课表，请打开课表模板编辑器同步课表后再进行排课操作',
            'msg.clearMode': '已进入连续清空模式，点击单元格即可清空；再次点击「清空单元格」退出',
            'msg.readonlyNoEdit': '当前账号为只读，无法排课。请使用有编辑权限的账号，或联系管理员。',
            'msg.selectCourseFirst': '请先选择课程',

            'msg.trialDays': '{n} 天试用',
            'msg.trialLeft': '试用期剩余 {n} 天',
            'msg.trialExpired': '试用已到期，请激活后继续使用',
            'msg.machineReadFail': '读取失败',
            'msg.machineCopied': '机器码已复制到剪贴板',
            'msg.activateOk': '激活成功，感谢支持！',
            'msg.activateFail': '激活码无效，请核对后重试',

            'msg.needStartEnd': '请选择开始时间和结束时间',
            'msg.endAfterStart': '结束时间必须晚于开始时间',
            'msg.countTotal': '共 {n} 条',
            'msg.countFound': '找到 {n} / {m} 条',
            'msg.noMatch': '无匹配结果',
            'msg.unnamedTable': '未命名课表',
            'msg.noTimetable': '暂无课表',
            'msg.noMatchTable': '无匹配课表',
            'msg.splitRow': '【分割行】',
            'msg.noPeriodsInTemplate': '该模版暂无课时',
            'msg.noTemplatesExport': '暂无课时模版可导出',
            'msg.templatesExportOk': '已导出 timeTemplates.json。打包前请用此文件替换项目目录中的同名文件，自定义模版才会打进安装包。',
            'msg.confirmDelete': '确定删除？',
            'msg.noMatchClass': '无匹配的班级',
            'msg.noMatchTeacher': '无匹配的教师',
            'msg.noClassData': '暂无班级数据',
            'msg.noTeacherData': '暂无教师数据',
            'msg.noRoomData': '暂无教室数据',
            'msg.courseCount': '{n} 条课程',
            'msg.courseGroupHint': '共 {n} 条课程，{g} 个{dim}分组',
            'msg.courseGroupFound': '找到 {n} 条课程，{g} 个{dim}分组',
            'msg.storageLocalFile': '本地文件（无 5MB 限制）',
            'msg.storageIdb': 'IndexedDB（大容量）',
            'msg.storageLs': 'localStorage（约 5MB 上限）',

            'msg.confirmDialog': '请确认',
            'msg.promptDialog': '请输入',
            'msg.free': '空闲',
            'msg.occupied': '占用 {n} 格',
            'msg.freeSlots': '空余 {n} 格',
            'msg.currentTable': '当前课表',
            'msg.selectTeacherOrRoom': '请选择教师或教室查看占用情况',
            'msg.noFreeSlots': '当前范围内无空余时段',
            'msg.teacherLabel': '教师【{name}】',
            'msg.roomLabel': '教室【{name}】',
            'occ.summaryEntries': '共 {entries} 条排课 · {tables} 张课表',
            'occ.timeCol': '时段',
            'conflict.none': '✅ 全局检测完成：所有教师、教室时段无冲突',
            'conflict.found': '❌ 全局共 {total} 处冲突，当前课表检测到 {current} 处冲突，冲突单元格已标红，可点击【查看冲突详情】按钮查看',
            'conflict.noConflict': '暂无排课冲突，请先执行全局冲突检测',
            'conflict.detailHeader': '===== 全局排课冲突详情（共 {n} 处）=====',
            'conflict.typeTeacher': '教师时间冲突',
            'conflict.typeRoom': '教室场地冲突',
            'conflict.detailLine': '【{idx}】{type}\n星期：{week}  时段：{time}\n冲突资源：{target}\n待排【{nowClass}】：{nowCourse}\n已占用【{existClass}】：{existCourse}\n',

            'login.setupHintLong': '首次使用，请创建管理员账号。随后可在「用户管理」添加编辑/只读账号；局域网也使用这些权限。',
            'login.hintLan': '请输入用户名和密码。局域网模式下请先在「局域网」连接主机后登录。',
            'login.submitSetup': '创建并登录',
            'common.editBtn': '修改',
            'common.deleteBtn': '删除',

            'app.editBrandHint': '点击可修改名称标语',
            'msg.trialFirst': '首次使用自动享有 100 天试用。如需永久授权，请将机器码发给管理员获取激活码。',
            'msg.currentAccount': '当前账号',
            'msg.noUsers': '暂无用户',
            'msg.loadFailed': '加载失败：{err}',
            'msg.noManageUsersNeedAdmin': '当前账号无权管理用户（需要管理员）',
            'storage.local': '本地存储',
            'storage.tables': '课表 {n} 张',
            'storage.spaceOk': '空间充足',
            'storage.spaceNormal': '用量正常',
            'storage.spaceLarge': '数据量较大，建议定期导出备份',
            'storage.spaceTight': '空间紧张，约还可增 {n} 张',
            'storage.spaceWarn': '空间偏紧，约还可增 {n} 张',
            'storage.spaceMid': '空间适中',
            'storage.suggestBackup': '建议导出备份',
            'storage.daysNoBackup': '已 {n} 天未备份',
            'storage.backupSoon': '请尽快导出备份',
            'storage.suggestBackupShort': '建议备份',
            'storage.backendFile': '本地文件（无 5MB 限制）',
            'storage.backendIdb': 'IndexedDB（大容量）',
            'storage.backendLs': 'localStorage（约 5MB 上限）',
            'course.name.chinese': '语文',
            'course.name.math': '数学',
            'course.name.english': '英语',
            'course.name.japanese': '日语',
            'course.name.physics': '物理',
            'course.name.chemistry': '化学',
            'course.name.biology': '生物',
            'course.name.politics': '政治',
            'course.name.history': '历史',
            'course.name.geography': '地理',
            'course.name.vocational': '职业综合',
            'msg.uncategorized': '未分类',
            'course.optionLine': '{name} | 教师：{teacher} | 教室：{room} | 班级：{cls}',
            'msg.noCourseForClass': '当前班级暂无可用课程，请前往课程管理添加',

            'dialog.confirmTitle': '请确认',
            'dialog.promptTitle': '请输入',
            'dialog.alertTitle': '提示'
        },
        en: {
            'app.title': 'School Timetable System',
            'app.subtitle': 'Smart scheduling · Multi-view timetables',
            'app.editBrand': 'Click to rename the app',
            'app.namePlaceholder': 'App name',
            'app.subtitlePlaceholder': 'Subtitle (optional)',
            'app.docTitle': 'School Timetable System',

            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.confirm': 'OK',
            'common.close': 'Close',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.add': 'Add',
            'common.search': 'Search',
            'common.copy': 'Copy',
            'common.index': '#',
            'common.action': 'Actions',
            'common.pleaseSelect': 'Please select',
            'common.tip': 'Notice',
            'common.loading': 'Loading…',
            'common.backupImport': 'Backup / Import',
            'common.all': 'All',
            'common.type': 'Type',
            'common.expand': 'Expand',
            'common.collapse': 'Collapse',

            'week.mon': 'Mon',
            'week.tue': 'Tue',
            'week.wed': 'Wed',
            'week.thu': 'Thu',
            'week.fri': 'Fri',
            'week.sat': 'Sat',
            'week.sun': 'Sun',
            'week.period': 'Period',

            'header.lan': 'LAN',
            'header.lanTitle': 'LAN host connection & sync',
            'header.userManage': 'Users',
            'header.userManageTitle': 'Add/remove users, change password',
            'header.help': 'Help',
            'header.helpTitle': 'Guide & Instructions',
            'header.logout': 'Log out',
            'header.logoutTitle': 'Sign out of current account',
            'header.theme': 'Theme',
            'header.themeTitle': 'Toggle theme',
            'header.themeDark': 'Dark',
            'header.themeLight': 'Light',
            'header.exit': 'Exit',
            'header.lang': '中文',
            'header.langTitle': 'Switch language / 切换语言',
            'header.trial': 'Trial',
            'header.currentUser': 'Signed-in user',
            'header.lanRole': 'LAN permission',

            'tableMgr.current': 'Current',
            'tableMgr.searchPlaceholder': 'Search timetables…',
            'tableMgr.deleteCurrent': 'Delete current',
            'tableMgr.hint': 'Timetable names match class names. Add or edit classes on the Classes page; timetables sync automatically.',
            'tableMgr.storageTitle': 'Local storage usage',
            'tableMgr.storageClick': 'Click for backup tips',
            'tableMgr.storageComputing': 'Calculating storage…',

            'nav.time': 'Periods',
            'nav.class': 'Classes',
            'nav.teacher': 'Teachers',
            'nav.room': 'Rooms',
            'nav.course': 'Courses',
            'nav.schedule': 'Schedule',
            'nav.query': 'Query',

            'time.name': 'Period name:',
            'time.namePlaceholder': 'Enter period name',
            'time.normal': 'Regular period',
            'time.split': 'Divider (break / meal)',
            'time.add': 'Add period',
            'time.template': 'Period template:',
            'time.templateSelect': 'Select a saved template',
            'time.preview': 'Preview',
            'time.load': 'Load',
            'time.saveTpl': 'Save template',
            'time.exportTpl': 'Export template file',
            'time.rename': 'Rename',
            'time.deleteTpl': 'Delete',
            'time.hint': 'Pick a template to switch periods. Save stores locally. Before packaging, Export template file and replace timeTemplates.json in the project folder.',
            'time.colName': 'Period name',

            'class.name': 'Class name:',
            'class.namePlaceholder': 'Class name (= timetable name)',
            'class.defaultTime': 'Default periods',
            'class.timeTplTitle': 'Period template',
            'class.add': 'Add class',
            'class.hint': 'Adding a class creates a matching timetable automatically.',
            'class.export': 'Export classes',
            'class.import': 'Import classes',
            'class.searchPlaceholder': 'Filter by class name…',
            'class.colName': 'Class name',

            'teacher.name': 'Teacher name:',
            'teacher.namePlaceholder': 'Enter teacher name',
            'teacher.add': 'Add teacher',
            'teacher.export': 'Export teachers',
            'teacher.import': 'Import teachers',
            'teacher.searchPlaceholder': 'Filter by teacher name…',
            'teacher.colName': 'Teacher name',

            'room.name': 'Room name:',
            'room.namePlaceholder': 'Enter room name',
            'room.add': 'Add room',
            'room.export': 'Export rooms',
            'room.import': 'Import rooms',
            'room.colName': 'Room name',

            'course.name': 'Course:',
            'course.selectName': 'Select course name',
            'course.selectTeacher': 'Select teacher',
            'course.selectRoom': 'Select room',
            'course.selectClass': 'Select class',
            'course.add': 'Add course',
            'course.export': 'Export courses',
            'course.import': 'Import courses',
            'course.groupBy': 'Group by:',
            'course.byClass': 'By class',
            'course.byTeacher': 'By teacher',
            'course.byRoom': 'By room',
            'course.searchPlaceholder': 'Search course / teacher / room / class…',

            'schedule.undo': 'Undo',
            'schedule.redo': 'Redo',
            'schedule.conflictCheck': 'Check conflicts',
            'schedule.conflictDetail': 'Conflict details',
            'schedule.exportExcel': 'Export Excel',
            'schedule.exportImage': 'Export image',
            'schedule.print': 'Print',
            'schedule.clearCell': 'Clear cell',
            'schedule.clearAll': 'Clear all',
            'schedule.saveSnapshot': 'Save snapshot',
            'schedule.exportMore': 'Export teacher / room grids',
            'schedule.exportByTarget': 'Export by teacher / room',
            'schedule.selectTeacher': 'Select teacher',
            'schedule.selectRoom': 'Select room',
            'schedule.settings': 'Schedule settings',
            'schedule.view': 'View',
            'schedule.viewClass': 'Class view',
            'schedule.viewTeacher': 'Teacher view',
            'schedule.viewRoom': 'Room view',
            'schedule.course': 'Course',
            'schedule.startTime': 'Start time',
            'schedule.endTime': 'End time',
            'schedule.selectStart': 'Select start time',
            'schedule.selectEnd': 'Select end time',
            'schedule.timeHint': 'Empty = auto from period template. Manual start/end overrides (all tables). Clear both to restore auto.',

            'export.corner': 'Period / Day',
            'export.week.mon': 'Monday',
            'export.week.tue': 'Tuesday',
            'export.week.wed': 'Wednesday',
            'export.week.thu': 'Thursday',
            'export.week.fri': 'Friday',
            'export.week.sat': 'Saturday',
            'export.week.sun': 'Sunday',
            'export.scheduleTitle': '{name} Timetable',
            'export.teacherScheduleTitle': '{name} — Teacher Schedule (All Tables)',
            'export.roomScheduleTitle': '{name} — Room Occupancy (All Tables)',
            'export.teacher': 'Teacher: {name}',
            'export.room': 'Room: {name}',
            'export.class': 'Class: {name}',
            'export.periodFallback': 'Period {n}',
            'export.fileSchedule': '{name}_schedule',
            'export.fileTeacher': '{name}_teacher_schedule',
            'export.fileRoom': '{name}_room_schedule',
            'export.imageOk': '✅ Schedule image exported',
            'export.teacherImageOk': '✅ Teacher schedule image exported',
            'export.roomImageOk': '✅ Room occupancy image exported',
            'export.noTeacherLessons': 'No lessons found for teacher [{name}]',
            'export.noRoomLessons': 'No occupancy found for room [{name}]',
            'export.fileFilter': 'File',
            'export.fileTypeDesc': '{ext} file',
            'export.saveFallbackDownload': 'Could not write to the chosen folder. File saved to Downloads:\n{name}',
            'export.savePermissionFail': 'Save failed. Check that the app has permission to write files.',
            'export.saveDialogFail': 'Could not open the save dialog. Update PakePlus and rebuild, or enable Debug to check the console.',
            'export.browserNoPicker': 'This browser cannot choose a save location. The file will be saved to Downloads.',
            'export.imageFallbackDownload': 'Image saved to Downloads (could not write to the chosen location):\n{name}',
            'export.html2canvasMissing': 'Image export module failed to load. Check your network and try again.',
            'export.imageGenFail': 'Failed to generate image. Please try again.',
            'export.imageExportFail': 'Image export failed: {msg}',
            'export.unknownError': 'Unknown error',

            'auto.title': 'Auto-schedule & constraints',
            'auto.teacher': 'Teacher',
            'auto.count': 'Sessions',
            'auto.course': 'Course',
            'auto.matchCourse': 'Auto-match course',
            'auto.run': 'Run auto-schedule',
            'auto.clearTeacher': 'Clear this teacher',
            'auto.onlyEmpty': 'Fill empty cells only',
            'auto.checkGlobal': 'Check global conflicts',
            'auto.spreadWeek': 'Spread across weekdays',
            'auto.addConstraint': 'Add constraint',
            'auto.constraintType': 'Type',
            'auto.teacherUnavailable': 'Teacher unavailable',
            'auto.teacherAvailableOnly': 'Teacher available only in',
            'auto.roomUnavailable': 'Room unavailable',
            'auto.teacherMaxDaily': 'Max periods per day',
            'auto.slotBlocked': 'Period blocked for all',
            'auto.weekBlocked': 'Weekday blocked',
            'auto.room': 'Room',
            'auto.week': 'Weekday',
            'auto.slotRow': 'Period row',
            'auto.timeRange': 'Time range',
            'auto.max': 'Max',
            'auto.sessionsPerDay': '{n} / day',
            'auto.sessions': '{n} sessions',
            'auto.addRule': 'Add rule',
            'auto.colDesc': 'Description',
            'auto.colType': 'Type',
            'auto.hint': 'Constraints are saved with the current timetable. Combine rules such as “unavailable Wed”, “mornings only”, or “max 2/day”.',
            'auto.unlimited': 'Any',
            'auto.noConstraints': 'No constraints yet — add one below',
            'auto.constraintAdded': '✅ Constraint added',
            'auto.selectTable': 'Please select a timetable first',
            'auto.labelTeacher': 'Teacher: {name}',
            'auto.labelRoom': 'Room: {name}',
            'auto.labelAllWeek': 'All week',
            'auto.labelMaxDaily': 'Max {n}/day',

            'backup.title': 'Backup & restore',
            'backup.exportAll': 'Export full backup',
            'backup.exportCurrent': 'Export current table',
            'backup.importAll': 'Import all',
            'backup.importSingle': 'Import one table',
            'backup.reset': 'Reset data',
            'backup.hint': 'Full backup includes all timetables and base data. Export JSON regularly.',

            'occ.title': 'Availability query',
            'occ.desc': 'Check teacher / room occupancy across timetables. Green = free, red = booked.',
            'occ.teacher': 'Teacher',
            'occ.room': 'Room',
            'occ.searchTeacher': 'Search teachers…',
            'occ.searchRoom': 'Search rooms…',
            'occ.scope': 'Scope',
            'occ.scopeAll': 'All timetables',
            'occ.scopeCurrent': 'Current timetable',
            'occ.empty': 'Select a teacher or room to start',
            'occ.freeList': 'Free slots',

            'license.title': 'Activation',
            'license.hint': 'Send the machine code below to the admin, then enter the activation key.',
            'license.machineId': 'Machine code',
            'license.reading': 'Reading…',
            'license.key': 'Activation key',
            'license.activate': 'Activate',

            'login.title': 'Sign in',
            'login.hint': 'Enter your username and password.',
            'login.username': 'Username',
            'login.password': 'Password',
            'login.confirmPassword': 'Confirm password',
            'login.confirmPlaceholder': 'Enter password again',
            'login.submit': 'Sign in',
            'login.setupTitle': 'Create admin account',
            'login.setupHint': 'First launch: create an admin account.',

            'user.title': 'User management',
            'user.existing': 'Existing users',
            'user.noteLocal': 'Passwords are stored in this browser for simple access control—not for high-security use.',
            'user.addUser': 'Add user',
            'user.roleViewer': 'Viewer',
            'user.roleEditor': 'Editor',
            'user.roleAdmin': 'Admin',
            'user.roleTitle': 'Role',
            'user.notePerm': 'Admin = edit + manage users; Editor = edit timetables; Viewer = read-only. On LAN, permissions follow the account.',
            'user.changePwd': 'Change my password',
            'user.oldPwd': 'Current password',
            'user.newPwd': 'New password',
            'user.confirmNewPwd': 'Confirm new password',
            'user.change': 'Update',

            'lan.title': 'LAN sync',
            'lan.help': 'Pick one PC as host: copy the lan-server folder there. On Windows run start-host-windows.bat (portable runtime, no Python needed); on Mac run the host script. Then “Initialize host” to upload data. Other PCs enter the host IP and sign in. Admin/Editor can edit from any PC; Viewer is read-only.',
            'lan.hostAddress': 'Host address',
            'lan.hostPlaceholder': 'Host IP, e.g. 192.168.1.8',
            'lan.port': 'Port',
            'lan.probe': 'Probe host',
            'lan.statusOffline': 'Not connected (local only)',
            'lan.asHost': 'This PC as host (first time)',
            'lan.bootstrap': 'Initialize host & upload local data',
            'lan.connectSection': 'Connect other PCs to host',
            'lan.connect': 'Connect & sign in',
            'lan.disconnect': 'Disconnect',

            'exit.title': 'Back up before exit',
            'exit.body': 'Before closing, please do the following to avoid data loss:',
            'exit.item1': 'Export timetables — from Schedule, export Excel / teacher / room grids',
            'exit.item2': 'Export full backup — from Schedule → Backup & restore, export JSON',
            'exit.warn': 'Data is stored locally in the browser. Clearing cache or switching devices may make it unrecoverable.',
            'exit.goBackup': 'Go to backup',
            'exit.force': 'Exit anyway',

            'role.viewer': 'Viewer',
            'role.editor': 'Editor',
            'role.admin': 'Admin',
            'role.viewerFull': 'Viewer (read-only)',
            'role.editorFull': 'Editor (can edit)',
            'role.adminFull': 'Admin (edit + users)',

            'msg.enterUsername': 'Please enter a username',
            'msg.enterPassword': 'Please enter a password',
            'msg.passwordMismatch': 'Passwords do not match',
            'msg.userExists': 'Username already exists',
            'msg.badCredentials': 'Incorrect username or password',
            'msg.confirmLogout': 'Sign out of the current account?',
            'msg.pleaseLogin': 'Please sign in first',
            'msg.needAdmin': 'Admin permission required',
            'msg.keepOneAdmin': 'Keep at least one admin',
            'msg.cannotRemoveOwnAdmin': 'You cannot remove your own admin role',
            'msg.cannotDeleteSelf': 'Cannot delete the signed-in account. Switch accounts first.',
            'msg.confirmDeleteUser': 'Delete user “{name}”?',
            'msg.keepOneUser': 'Keep at least one user',
            'msg.fillComplete': 'Please fill in all fields',
            'msg.oldPasswordWrong': 'Current password is incorrect',
            'msg.newPasswordMismatch': 'New passwords do not match',
            'msg.passwordChanged': 'Password updated',
            'msg.userAdded': 'User “{name}” added ({role})',
            'msg.userAddedHost': 'User “{name}” added on the host',
            'msg.lanLoginBlocked': 'In LAN mode, create accounts on the host, or disconnect LAN first',
            'msg.lanLoginFail': 'LAN sign-in failed: {err}\n\nIf the host just restarted, disconnect in LAN settings and sign in with a local account.',
            'msg.lanPwdHint': 'In LAN mode, change passwords on the host user data (API coming later)',
            'msg.needAdminAddUser': 'Admin permission required to add users',
            'msg.noManageUsers': 'This account cannot manage users',

            'msg.lanDataUpdated': 'Host data was updated and refreshed. Please review and save again if needed.',
            'msg.lanProbeOk': 'Host is online.\nAddresses: {ips}\nUsers: {count}',
            'msg.lanProbeFail': 'Cannot reach host: {err}\nMake sure the host script is running and firewall allows port {port}',
            'msg.lanBootstrapOk': 'Host initialized.\nOther PCs connect to: {addr}\nThen sign in with a permitted account.',
            'msg.lanBootstrapFail': 'Initialization failed: {err}',
            'msg.lanNeedHost': 'Please enter the host IP',
            'msg.lanNeedLogin': 'Please enter LAN username and password',
            'msg.lanConnected': 'Connected to LAN host. Permissions follow the account.',
            'msg.lanConnectFail': 'Connection failed: {err}',
            'msg.lanConfirmDisconnect': 'Disconnect from LAN host and return to local data?',
            'msg.lanDisconnected': 'Disconnected from LAN',
            'msg.lanStatusConnected': 'Connected to {host} · {role}',
            'msg.lanStatusPending': 'Host {host} set, awaiting sign-in',
            'msg.lanEditable': 'Can edit',
            'msg.lanReadonly': 'Read-only',

            'msg.brandEmpty': 'App name cannot be empty',
            'msg.noTable': 'No timetable selected. Create or select one first.',
            'msg.undoEnd': 'Already at the earliest step',
            'msg.redoEnd': 'Already at the latest step',
            'msg.saveFailed': '❌ Save failed (backend: {backend}). Export a full backup, then remove unused data and retry.',
            'msg.selectTableFirst': 'Please select a timetable first',
            'msg.noPeriods': 'This timetable has no periods; cannot save a template',
            'msg.updateTemplate': 'Update template “{name}”?\nCancel to save as a new template.',
            'msg.templateUpdated': 'Template “{name}” updated',
            'msg.enterTemplateName': 'Enter template name',
            'msg.templateExists': 'Template name already exists. Choose another, or select it and Save to update.',
            'msg.templateSaved': 'Template saved locally',
            'msg.selectTemplate': 'Select a saved template first',
            'msg.templateNotFound': 'Template not found',
            'msg.confirmApplyTemplate': 'Overwrite this timetable’s periods with the selected template?',
            'msg.templateLoaded': 'Template loaded; periods updated',
            'msg.selectRenameTemplate': 'Select a template to rename',
            'msg.enterNewTemplateName': 'Enter new template name',
            'msg.confirmDeleteTemplate': 'Delete template “{name}”?',
            'msg.templateDeleted': 'Template deleted',
            'msg.templateRenamed': 'Template renamed',

            'msg.emptySchedule': 'No timetable yet. Sync periods from a template, then schedule.',
            'msg.clearMode': 'Continuous clear mode on. Click cells to clear; click Clear cell again to exit.',
            'msg.readonlyNoEdit': 'This account is read-only. Use an editor account or contact an admin.',
            'msg.selectCourseFirst': 'Please select a course first',

            'msg.trialDays': '{n}-day trial',
            'msg.trialLeft': 'Trial: {n} day(s) left',
            'msg.trialExpired': 'Trial expired. Please activate to continue.',
            'msg.machineReadFail': 'Failed to read',
            'msg.machineCopied': 'Machine code copied',
            'msg.activateOk': 'Activated. Thank you!',
            'msg.activateFail': 'Invalid activation key. Please try again.',

            'msg.needStartEnd': 'Please select start and end time',
            'msg.endAfterStart': 'End time must be after start time',
            'msg.countTotal': '{n} total',
            'msg.countFound': 'Found {n} / {m}',
            'msg.noMatch': 'No matches',
            'msg.unnamedTable': 'Untitled timetable',
            'msg.noTimetable': 'No timetables',
            'msg.noMatchTable': 'No matching timetables',
            'msg.splitRow': '[Divider]',
            'msg.noPeriodsInTemplate': 'This template has no periods',
            'msg.noTemplatesExport': 'No period templates to export',
            'msg.templatesExportOk': 'Exported timeTemplates.json. Before packaging, replace the same file in the project folder so custom templates ship in the installer.',
            'msg.confirmDelete': 'Delete this item?',
            'msg.noMatchClass': 'No matching classes',
            'msg.noMatchTeacher': 'No matching teachers',
            'msg.noClassData': 'No classes yet',
            'msg.noTeacherData': 'No teachers yet',
            'msg.noRoomData': 'No rooms yet',
            'msg.courseCount': '{n} courses',
            'msg.courseGroupHint': '{n} courses · {g} {dim} groups',
            'msg.courseGroupFound': 'Found {n} courses · {g} {dim} groups',
            'msg.storageLocalFile': 'Local file (no 5MB limit)',
            'msg.storageIdb': 'IndexedDB (large)',
            'msg.storageLs': 'localStorage (~5MB)',

            'msg.confirmDialog': 'Confirm',
            'msg.promptDialog': 'Input',
            'msg.free': 'Free',
            'msg.occupied': '{n} booked',
            'msg.freeSlots': '{n} free',
            'msg.currentTable': 'Current timetable',
            'msg.selectTeacherOrRoom': 'Select a teacher or room',
            'msg.noFreeSlots': 'No free slots in this scope',
            'msg.teacherLabel': 'Teacher [{name}]',
            'msg.roomLabel': 'Room [{name}]',
            'occ.summaryEntries': '{entries} entries · {tables} timetable(s)',
            'occ.timeCol': 'Period',
            'conflict.none': '✅ No conflicts — all teacher and room slots are clear',
            'conflict.found': '❌ {total} conflict(s) globally, {current} in current timetable. Conflicts are highlighted in red — click Conflict details',
            'conflict.noConflict': 'No conflicts found. Run Check conflicts first.',
            'conflict.detailHeader': '===== Conflict details ({n} total) =====',
            'conflict.typeTeacher': 'Teacher time conflict',
            'conflict.typeRoom': 'Room conflict',
            'conflict.detailLine': '[{idx}] {type}\nWeekday: {week}  Time: {time}\nResource: {target}\nNew [{nowClass}]: {nowCourse}\nExisting [{existClass}]: {existCourse}\n',

            'login.setupHintLong': 'First launch: create an admin account. Then add editors/viewers in Users. The same roles apply on LAN.',
            'login.hintLan': 'Enter username and password. In LAN mode, connect to the host first via LAN.',
            'login.submitSetup': 'Create & sign in',
            'common.editBtn': 'Edit',
            'common.deleteBtn': 'Delete',

            'app.editBrandHint': 'Click to edit name & slogan',
            'msg.trialFirst': 'You get a 100-day trial on first use. For a permanent license, send the machine code to the admin.',
            'msg.currentAccount': 'Current account',
            'msg.noUsers': 'No users yet',
            'msg.loadFailed': 'Failed to load: {err}',
            'msg.noManageUsersNeedAdmin': 'This account cannot manage users (admin required)',
            'storage.local': 'Local storage',
            'storage.tables': '{n} timetable(s)',
            'storage.spaceOk': 'Plenty of space',
            'storage.spaceNormal': 'Usage normal',
            'storage.spaceLarge': 'Large dataset — export backups regularly',
            'storage.spaceTight': 'Low space — about {n} more tables',
            'storage.spaceWarn': 'Getting full — about {n} more tables',
            'storage.spaceMid': 'Moderate usage',
            'storage.suggestBackup': 'Export a backup recommended',
            'storage.daysNoBackup': 'No backup for {n} day(s)',
            'storage.backupSoon': 'Export a backup soon',
            'storage.suggestBackupShort': 'Backup recommended',
            'storage.backendFile': 'Local file (no 5MB limit)',
            'storage.backendIdb': 'IndexedDB (large)',
            'storage.backendLs': 'localStorage (~5MB)',
            'course.name.chinese': 'Chinese',
            'course.name.math': 'Math',
            'course.name.english': 'English',
            'course.name.japanese': 'Japanese',
            'course.name.physics': 'Physics',
            'course.name.chemistry': 'Chemistry',
            'course.name.biology': 'Biology',
            'course.name.politics': 'Politics',
            'course.name.history': 'History',
            'course.name.geography': 'Geography',
            'course.name.vocational': 'Vocational studies',
            'msg.uncategorized': 'Uncategorized',
            'course.optionLine': '{name} | Teacher: {teacher} | Room: {room} | Class: {cls}',
            'msg.noCourseForClass': 'No courses for this class. Add some on the Courses page.',

            'dialog.confirmTitle': 'Confirm',
            'dialog.promptTitle': 'Input',
            'dialog.alertTitle': 'Notice'
        }
    };

    function getAppLang() {
        var saved = localStorage.getItem(LANG_KEY);
        if (saved === 'en' || saved === 'zh') return saved;
        var nav = (navigator.language || '').toLowerCase();
        return nav.indexOf('zh') === 0 ? 'zh' : 'en';
    }

    function setAppLang(lang) {
        if (lang !== 'zh' && lang !== 'en') lang = 'zh';
        localStorage.setItem(LANG_KEY, lang);
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        applyI18n();
        if (typeof window.onAppLanguageChange === 'function') {
            try { window.onAppLanguageChange(lang); } catch (e) {}
        }
    }

    function t(key, vars) {
        var lang = getAppLang();
        var table = DICT[lang] || DICT.zh;
        var text = table[key];
        if (text == null) text = (DICT.zh[key] != null ? DICT.zh[key] : key);
        if (vars && typeof vars === 'object') {
            Object.keys(vars).forEach(function (k) {
                text = String(text).split('{' + k + '}').join(String(vars[k]));
            });
        }
        return text;
    }

    function applyAttr(el, attr, value) {
        if (!el || value == null) return;
        if (attr === 'text') {
            // keep child elements (e.g. checkboxes) — only replace direct text if simple
            if (el.children.length === 0) {
                el.textContent = value;
            } else {
                // find last text node or set via data
                var found = false;
                for (var i = 0; i < el.childNodes.length; i++) {
                    if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) {
                        el.childNodes[i].textContent = ' ' + value;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    el.appendChild(document.createTextNode(' ' + value));
                }
            }
        } else if (attr === 'html') {
            el.innerHTML = value;
        } else if (attr === 'placeholder') {
            el.placeholder = value;
        } else if (attr === 'title') {
            el.title = value;
        } else if (attr === 'value' && 'value' in el) {
            el.value = value;
        }
    }

    function applyI18n(root) {
        root = root || document;
        var nodes = root.querySelectorAll('[data-i18n]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var key = el.getAttribute('data-i18n');
            if (!key) continue;
            applyAttr(el, 'text', t(key));
        }
        nodes = root.querySelectorAll('[data-i18n-html]');
        for (i = 0; i < nodes.length; i++) {
            applyAttr(nodes[i], 'html', t(nodes[i].getAttribute('data-i18n-html')));
        }
        nodes = root.querySelectorAll('[data-i18n-placeholder]');
        for (i = 0; i < nodes.length; i++) {
            applyAttr(nodes[i], 'placeholder', t(nodes[i].getAttribute('data-i18n-placeholder')));
        }
        nodes = root.querySelectorAll('[data-i18n-title]');
        for (i = 0; i < nodes.length; i++) {
            applyAttr(nodes[i], 'title', t(nodes[i].getAttribute('data-i18n-title')));
        }
        // option elements (support data-i18n-n for {n} placeholders)
        nodes = root.querySelectorAll('option[data-i18n]');
        for (i = 0; i < nodes.length; i++) {
            var opt = nodes[i];
            var optKey = opt.getAttribute('data-i18n');
            var nAttr = opt.getAttribute('data-i18n-n');
            if (nAttr != null) {
                opt.textContent = t(optKey, { n: nAttr });
            } else {
                opt.textContent = t(optKey);
            }
        }
        var titleKey = document.documentElement.getAttribute('data-i18n-title-key') || 'app.docTitle';
        document.title = t(titleKey);

        var langBtn = document.getElementById('langToggleBtn');
        if (langBtn) {
            langBtn.textContent = getAppLang() === 'zh' ? 'EN' : '中文';
            langBtn.title = t('header.langTitle');
        }
        var themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn && !themeBtn.getAttribute('data-i18n')) {
            themeBtn.textContent = document.body.classList.contains('light-mode')
                ? t('header.themeDark')
                : t('header.themeLight');
        }
    }

    function toggleAppLang() {
        setAppLang(getAppLang() === 'zh' ? 'en' : 'zh');
    }

    function weekLabels() {
        return [t('week.mon'), t('week.tue'), t('week.wed'), t('week.thu'), t('week.fri'), t('week.sat'), t('week.sun')];
    }

    global.I18N_DICT = DICT;
    global.LANG_STORAGE_KEY = LANG_KEY;
    global.getAppLang = getAppLang;
    global.setAppLang = setAppLang;
    global.toggleAppLang = toggleAppLang;
    global.t = t;
    global.applyI18n = applyI18n;
    global.i18nWeekLabels = weekLabels;
    var COURSE_NAME_KEYS = {
        '语文': 'course.name.chinese',
        '数学': 'course.name.math',
        '英语': 'course.name.english',
        '日语': 'course.name.japanese',
        '物理': 'course.name.physics',
        '化学': 'course.name.chemistry',
        '生物': 'course.name.biology',
        '政治': 'course.name.politics',
        '历史': 'course.name.history',
        '地理': 'course.name.geography',
        '职业综合': 'course.name.vocational'
    };

    function displayCourseName(name) {
        var key = COURSE_NAME_KEYS[name];
        if (key && typeof t === 'function') return t(key);
        return name;
    }

    /** 课时行名称：第1节 → Period 1，早自习 → Morning study 等 */
    function displayPeriodLabel(text) {
        if (text == null || text === '') return text;
        if (getAppLang() === 'zh') return String(text);
        var s = String(text);
        s = s.replace(/第(\d+)节/g, function (_, n) { return 'Period ' + n; });
        var periodPhrases = {
            '早自习': 'Morning study',
            '午自习': 'Noon study',
            '晚自习': 'Evening study',
            '午饭': 'Lunch',
            '晚饭': 'Dinner',
            '午休': 'Break',
            '晚饭/分割': 'Dinner break'
        };
        Object.keys(periodPhrases).forEach(function (zh) {
            s = s.split(zh).join(periodPhrases[zh]);
        });
        return s;
    }

    /** 班级/课表等用户数据：英文模式下常见词替换（不改存储） */
    function displayLocaleText(text) {
        if (text == null || text === '') return text;
        if (getAppLang() === 'zh') return String(text);
        var s = String(text);
        var pairs = [
            ['全日制', 'Full-time '],
            ['一对一', '1-on-1 '],
            ['小班课', 'Small group '],
            ['学员组', ' group'],
            ['暑假', 'Summer '],
            ['寒假', 'Winter '],
            ['春季', 'Spring '],
            ['秋季', 'Fall '],
            ['文科', 'Arts '],
            ['理科', 'Science '],
            ['高三', 'G12 '],
            ['高二', 'G11 '],
            ['高一', 'G10 '],
            ['初三', 'G9 '],
            ['初二', 'G8 '],
            ['初一', 'G7 '],
            ['初升高', 'Junior-Senior '],
            ['衔接班', 'Bridge Class'],
            ['普通教室', 'Room '],
            ['隔间', ' Booth '],
            ['实验室', 'Lab '],
            ['西', 'W'],
            ['东', 'E'],
            ['班', ' Class']
        ];
        pairs.forEach(function (pair) {
            s = s.split(pair[0]).join(pair[1]);
        });
        return s.replace(/\s+/g, ' ').trim();
    }

    /** 冲突详情里的「地理（教师，教室）」显示用 */
    function displayConflictCourseText(text) {
        if (text == null || text === '') return text;
        var s = String(text);
        var m = s.match(/^(.+?)\s*[（(]\s*(.+?)\s*[，,]\s*(.+?)\s*[）)]\s*$/);
        if (m) {
            var name = displayCourseName(m[1].trim());
            var teacher = m[2].trim();
            var room = displayLocaleText(m[3].trim());
            if (getAppLang() === 'en') return name + ' (' + teacher + ', ' + room + ')';
            return name + '（' + teacher + '，' + room + '）';
        }
        return displayCourseName(s);
    }

    global.displayCourseName = displayCourseName;
    global.displayPeriodLabel = displayPeriodLabel;
    global.displayLocaleText = displayLocaleText;
    global.displayConflictCourseText = displayConflictCourseText;
    global.COURSE_NAME_KEYS = COURSE_NAME_KEYS;


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            document.documentElement.lang = getAppLang() === 'zh' ? 'zh-CN' : 'en';
            applyI18n();
        });
    } else {
        document.documentElement.lang = getAppLang() === 'zh' ? 'zh-CN' : 'en';
        applyI18n();
    }
})(window);
