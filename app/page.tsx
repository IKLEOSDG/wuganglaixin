"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Area = "phone" | "browser" | "map" | "evidence" | "board" | "side";
type AppId = "home" | "messages" | "photos" | "notes" | "files" | "shopping" | "music" | "weather" | "cracker" | "appstore" | "camera" | "calculator" | "amap" | "phone";
type SimCall = { name: string; number: string; status: "dialing" | "connected" | "ended"; elapsed: number; reply: string };
type WechatCall = { name: string; mode: "voice" | "video"; status: "calling" | "unanswered" };
type Article = { id: string; chapter: number; tag: string; date: string; title: string; excerpt: string; body: string[]; source?: string; author?: string; image?: string; caption?: string; deleted?: boolean; redacted?: boolean; related?: boolean };
type Clue = { id: string; chapter: number; title: string; source: string; text: string };
type Deduction = { id: string; chapter: number; title: string; requires: [string,string]; source: string; text: string; question: string };
type Item = { id: string; title: string; text: string };
type PhoneFile = [name:string, meta:string, clueId:string];

const CHAPTERS = [
  { no: 1, device: "林岚的手机", title: "回潮口", question: "林琴离开306后去了哪里，她是否已经离开这座岛？", count: 6 },
  { no: 2, device: "林岚的手机", title: "旧名册", question: "散落在不同地区的十二份记录，为什么指向同一间病区？", count: 5 },
  { no: 3, device: "林岚的手机", title: "雾笛之后", question: "03:17将发生什么，怎样在救人时保全证据？", count: 5 },
];

const CLUES: Clue[] = [
  { id: "last-chat", chapter: 1, title: "6月14日母女微信", source: "林岚手机 / 微信 / 妈妈", text: "林琴18:42发来：‘到了，住潮生宾馆306。房间有点潮。’之后没有再回复林岚。" },
  { id: "hotel-log", chapter: 1, title: "306房门卡记录", source: "潮生宾馆登记系统 / 门锁离线缓存", text: "入住：6月14日17:36；最后刷出：6月15日21:48；此后无开门记录。登记状态仍为在住。" },
  { id: "ferry-list", chapter: 1, title: "林琴客轮实名记录", source: "客运码头自助终端", text: "6月14日16:30航班有登岛核验。6月14日至16日的离岛核验结果为空。" },
  { id: "workboat", chapter: 1, title: "旧港22:20工作船记录", source: "港务简报 / 工作码头", text: "6月15日口头说明写离泊22:20；船员表登记3人；当次加油单为0升；大陆目的港没有对应卸货回执。" },
  { id: "weather", chapter: 1, title: "6月16日晚间航班通告", source: "雾港气象站 / 客运公告", text: "16:00发布能见度预警；18:30取消20:10客轮。公告期间移动通信与固定电话状态正常。" },
  { id: "badge1704", chapter: 1, title: "便利店夜班胸牌照片", source: "林岚手机 / 照片", text: "胸牌上栏标注‘门店17’，下栏标注‘员工04’。佩戴者为夜班店员陶小雨。" },
  { id: "voucher1704", chapter: 1, title: "306房早餐券照片", source: "林岚手机 / 照片", text: "早餐券右上角手写‘C17/04’，其后标注‘低盐’。房号栏为306。" },
  { id: "room-timeline", chapter: 1, title: "306房间的时间断点", source: "调查手记 / 组合推演", text: "林琴18:42说自己已住进306；门卡记录却在次日21:48刷出后彻底中断。房间没有退房或再次进入记录。" },
  { id: "departure-gap", chapter: 1, title: "两套离岛记录互相冲突", source: "调查手记 / 组合推演", text: "客轮系统没有林琴离岛记录；被怀疑用于秘密离岛的工作船又没有燃油与目的港回执。两种说法都缺少能证明她抵达大陆的记录。" },
  { id: "number-pattern", chapter: 1, title: "C17/04并非单一门店编号", source: "调查手记 / 组合推演", text: "员工胸牌将17和04分栏，306早餐券却把它们写成C17/04。同一顺序跨越零售与住宿系统，不能只用门店编号解释。" },
  { id: "weather-alibi", chapter: 1, title: "停航通告与通信记录的时间重叠", source: "调查手记 / 组合推演", text: "晚班客轮因雾取消，但同一时段移动通信与固定电话记录正常。" },
  { id: "twelve", chapter: 2, title: "十二张儿童寻人启事", source: "林琴旧机备份 / 沈砚资料夹", text: "启事发布地涉及六个县市，日期为1989年至1992年。每张均保留年龄、衣物和最后出现地点。" },
  { id: "ward", chapter: 2, title: "四张转院单扫描件", source: "林琴旧机备份 / 照片", text: "四张转院单的转出医院不同。接收栏均盖有‘潮生康养院乙区’椭圆章。" },
  { id: "nurse", chapter: 2, title: "周岚护士证及值班表", source: "1992年乙区档案", text: "护士证姓名为周岚。6月16日乙区夜班表中，她的值班时段为20:00至次日08:00。23:10后十二个床位的状态有手写改动。" },
  { id: "ship", chapter: 2, title: "归潮号领用及事故记录", source: "1992年港务内参", text: "归潮号核载6人，6月16日晚领用救生衣17件。6月19日公开稿标题为‘无人维护船漂移’。" },
  { id: "qin-note", chapter: 2, title: "林琴2009年备忘录", source: "林琴旧机备份 / 备忘录", text: "备忘录写：‘名单先分开存。被带走的人、后来登记的人、做这件事的人不能混在一起。沈砚如果没回来，先别交原件。’" },
  { id: "ward-chain", chapter: 2, title: "启事与转院单出现四组对应项", source: "调查手记 / 组合推演", text: "四份启事的年龄、衣物描述能够与四张转院单逐项对应；接收栏都指向乙区。" },
  { id: "seventeen-children", chapter: 2, title: "床位改动与救生衣领用发生在同一晚", source: "调查手记 / 组合推演", text: "23:10后的床位改动与归潮号17件救生衣领用时间接近，船只核载为6人。" },
  { id: "victim-boundary", chapter: 2, title: "备忘录要求把名单分开保存", source: "调查手记 / 组合推演", text: "林琴明确写下不同身份不能混在一起，但现有启事没有标注分类结果。" },
  { id: "family-group", chapter: 3, title: "郭家健康群聊天记录", source: "郭宁设备备份 / 群聊", text: "群公告列出体检、服药、奖学金和出岛申请。发布者均为郭维。郭宁要求查看体检报告，未收到文件。" },
  { id: "codes", chapter: 3, title: "C组年度随访表", source: "潮生健康账户 / 导出文件", text: "表格按A、B、C分页，每条记录另有两组数字。C17-01与C17-04位于同一页；页脚另列历史随访索引TX-0817-12，字段用途没有说明。" },
  { id: "payments", chapter: 3, title: "三份执行时间相同的财务文件", source: "郭宁设备备份 / 文件", text: "文件分别为旧港冷链运输单、康养院耗材单和境外付款指令，执行时间均标注为2026年6月17日03:17。运输附件另列一项‘B1镜像节点维护’，位置在冷链地下一层。" },
  { id: "fog-horn", chapter: 3, title: "雾笛观察日志与录音", source: "白塔观察记录", text: "日志逐项记录低潮时间、雾笛播放、受试者姓名应答和生理数值。附录音时长18分42秒。" },
  { id: "rescue", chapter: 3, title: "03:17日程及检修图", source: "郭维日程 / 白塔平面图", text: "日程只写‘03:17，LQ转入’。平面图标出一条从白塔检修门通往地下设备层的通道。" },
  { id: "lan-transplant", chapter: 3, title: "林岚儿童移植随访表", source: "潮生健康 / 旧档", text: "患者林岚，9岁；手术日期2008年8月17日；供体年龄12岁；档案尾号TX-0817-12。公开副本的供体姓名栏被遮盖。" },
  { id: "observation-family", chapter: 3, title: "群公告与C组表使用相同字段", source: "调查手记 / 组合推演", text: "体检、服药与出岛审批日期在两份材料中重复出现，但两者为何同步仍无法从表面判断。" },
  { id: "transfer-chain", chapter: 3, title: "03:17前后的四份记录", source: "调查手记 / 组合推演", text: "冷链、耗材、付款与LQ日程集中在同一时间窗口；文件没有写明实际收货人。" },
  { id: "trigger-protocol", chapter: 3, title: "雾笛之后出现固定记录顺序", source: "调查手记 / 组合推演", text: "每次声音记录后都出现姓名缩写和数值，相关性明确，具体用途未注明。" },
  { id: "donor-link", chapter: 3, title: "随访表与一条编号尾号吻合", source: "调查手记 / 组合推演", text: "日期和年龄能够相互对应，但被遮盖的供体姓名仍无法从现有材料直接确认。" },
];

const DEDUCTIONS: Deduction[] = [
  { id:"room-timeline",chapter:1,title:"把母亲微信与门卡时间放在一起",requires:["last-chat","hotel-log"],source:"6月14日母女微信 ＋ 306房门卡记录",text:"两条生活记录之间出现了无法解释的断点。",question:"她离开房间之后，为什么没有退房，也没有再次进入306？" },
  { id:"departure-gap",chapter:1,title:"比对客轮与工作船记录",requires:["ferry-list","workboat"],source:"客轮实名记录 ＋ 工作船记录",text:"公开与非公开两种离岛方式都缺少关键凭据。",question:"如果工作船没有真正抵达大陆，林琴是否仍在岛上？" },
  { id:"number-pattern",chapter:1,title:"记录两处重复出现的编号",requires:["badge1704","voucher1704"],source:"便利店胸牌 ＋ 306房早餐券",text:"17与04以相同顺序出现在两种用途完全不同的纸面记录上。",question:"这组数字是巧合、交接代码，还是另一套尚未找到的索引？" },
  { id:"weather-alibi",chapter:1,title:"把停航通告与实名记录放在一起",requires:["weather","ferry-list"],source:"晚间航班通告 ＋ 客轮实名记录",text:"天气解释了停航，却解释不了通信正常时的彻底失联。",question:"停航是否只是失联发生时的背景，而不是她已经离岛的证据？" },
  { id:"ward-chain",chapter:2,title:"对照寻人启事与转院单",requires:["twelve","ward"],source:"十二张寻人启事 ＋ 四张转院单",text:"地域不同的失踪记录开始指向同一套转院路径。",question:"这些跨地区记录为什么最终都落到乙区？" },
  { id:"seventeen-children",chapter:2,title:"把床位改动与救生衣数量对齐",requires:["nurse","ship"],source:"乙区值班表 ＋ 归潮号内参",text:"23:10后的床位改动与异常物资领用发生在同一晚。",question:"十七件救生衣究竟对应多少名孩子和工作人员？" },
  { id:"victim-boundary",chapter:2,title:"核对备忘录与十二张启事的分类方式",requires:["qin-note","twelve"],source:"2009年备忘录 ＋ 十二张寻人启事",text:"林琴反复提醒自己不要只按姓名归档，说明这十二份材料并非同一种记录。",question:"她原本打算依据什么重新分类？" },
  { id:"observation-family",chapter:3,title:"对照群公告与编号表的字段",requires:["family-group","codes"],source:"郭家健康群 ＋ 内部编号表",text:"服药、体检和出岛审批的日期能在编号表里找到对应栏位。",question:"两张表为何需要同步更新？" },
  { id:"transfer-chain",chapter:3,title:"核对付款文件与03:17日程",requires:["payments","rescue"],source:"三份财务文件 ＋ 03:17检修图",text:"几份材料共享同一日期与时间窗口，但收货人与实际用途仍未写明。",question:"这些记录是否属于同一次安排？" },
  { id:"trigger-protocol",chapter:3,title:"核对雾笛日志与编号表时间",requires:["fog-horn","codes"],source:"雾笛日志 ＋ 内部编号表",text:"数次雾笛记录后都紧跟着一组姓名缩写和生理数值。",question:"记录者为什么要把声音、姓名与身体反应写在一起？" },
  { id:"donor-link",chapter:3,title:"核对随访表与编号尾号",requires:["lan-transplant","codes"],source:"林岚移植随访表 ＋ 内部编号表",text:"手术日期、年龄与一条被遮盖的索引能够对上，姓名仍然缺失。",question:"TX-0817-12究竟指向谁？" },
];

const ITEMS: Record<string,Item> = {
  "room-card": { id:"room-card", title:"306备用房卡", text:"前台核对你的身份证、林琴登记的紧急联系人信息，并向接警民警确认后交给你。只能打开306，调查结束前需要归还。" },
  "night-meal": { id:"night-meal", title:"夜班餐盒", text:"陈放按旧港夜班口味装了一份热饭。与其盘问门岗，不如先让他愿意停下来聊两句。" },
  "archive-slip": { id:"archive-slip", title:"档案调阅单", text:"陈列馆开具的纸质调阅单，盖有当日阅览章，可调取一册1992年港务领用簿。" },
  "locker-key": { id:"locker-key", title:"旧铁柜钥匙", text:"旧港六号柜的备用钥匙。许伯核对陈列馆调阅单后，只同意陪林岚去仓库试锁，钥匙不能带走。" },
  "maintenance-tag": { id:"maintenance-tag", title:"冷链检修挂牌", text:"无牌冷藏车副驾遗落的检修挂牌，背面写着白塔低潮通行窗口。" },
  "mirror-index": { id:"mirror-index", title:"监控镜像索引", text:"从B1节点复制出的只读索引，保留五处镜头编号与时间戳，没有复制或破坏原始录像。" },
  "bed-location": { id:"bed-location", title:"LQ床位定位截图", text:"地下终端显示LQ仍有生命体征，位置在B-06。截图只保留床位、时间与状态，没有拍到病人。" },
  "ward-record": { id:"ward-record", title:"乙区病床记录残页", text:"从康养院旧址废弃物中找到的半页纸，记录着C17-01至C17-04的‘转入时间’和‘备注’。备注栏只写了三个字：不醒。" },
  "night-recording": { id:"night-recording", title:"旧港夜间录音片段", text:"手机在306房间自动录下的一段音频，时间戳显示03:17。录音里只有潮水声和一个模糊的、重复的女声——像在数数。" },
};

type SideMystery = {
  id: string;
  chapter: number;
  title: string;
  question: string;
  answer: string;
  requires: string[];
};
const SIDE_MYSTERIES: SideMystery[] = [
  { id:"sm-1", chapter:1, title:"两个C17/04", question:"为什么便利店胸牌和早餐券上出现了同一组数字？", requires:["badge1704","voucher1704"],
    answer:"便利店胸牌把17和04分栏书写，早餐券却写成C17/04——它们不是同一套编号系统。C17代表项目组，04代表入组顺序。这组数字跨越零售和住宿，指向一个更大的编号体系：潮生健康的C组随访表。陶小雨的C17-04和郭宁的C17-01，都在同一张表上。" },
  { id:"sm-2", chapter:1, title:"工作船的燃料", question:"加油量0升的工作船，当晚真的离泊了吗？", requires:["workboat"],
    answer:"船员表登记3人、加油单为0升、目的港回执空白——三项缺一，值班员不得补签放行。工作船22:20的离泊记录只是口头说明，没有实际航行证据。这条记录的目的是制造一个'林琴可能乘船离开'的假象。" },
  { id:"sm-3", chapter:2, title:"沈砚的下落", question:"那个调查乙区的自由研究者，最终去了哪里？", requires:["a44","qin-note"],
    answer:"沈砚，2008年至2009年在雾港查阅旧港、康养院和失踪人口剪报。他发现了乙区转院链与归潮号事故的关联，在准备交出材料前失踪。林琴的备忘录写'沈砚如果没回来，先别交原件'。他的登记卡背面被撕去、电话已停用、两盘访谈带缺失——他的名字可能也在某份死亡名单上。" },
  { id:"sm-4", chapter:2, title:"归潮号的十七件救生衣", question:"核载6人的船，为什么领走17件救生衣？", requires:["ship","nurse"],
    answer:"6月16日晚，乙区23:10后床位被手写改动，同时归潮号领走17件救生衣。船只核载6人——17件对应的是12名孩子加5名工作人员。这艘船当晚被用来转运儿童，随后被伪装成事故沉没。6月19日公开稿改称'无人维护船漂移'，月报只列设备损失。" },
  { id:"sm-5", chapter:2, title:"2009年的大火", question:"钟表铺火灾真的只烧掉了账本吗？", requires:["a29"],
    answer:"报警记录比报纸报道早八分钟。许伯回忆起火前有人来取一只寄存铁盒，身份未登记。沈砚的调查材料当时存放在钟表铺阁楼——火灾后部分账本被烧毁，残存账本由许伯家属捐给陈列馆，但其中几页与陈列馆扫描件对不上。被抽走的页面很可能包含了沈砚的原始记录和乙区名单。" },
  { id:"sm-6", chapter:3, title:"同一个梦", question:"为什么陶小雨和郭宁会做同一个走廊梦？", requires:["fog-horn","codes"],
    answer:"雾笛不仅是航标信号，也是乙区实验中的声音触发装置。陶小雨（C17-04）和郭宁（C17-01）都是C组入组者，童年时期在乙区接受过声音条件反射训练。雾笛播放时，被压抑的记忆以梦境形式浮现——没有窗的走廊、尽头的床、床上睁着眼睛的人，都是乙区病房的真实场景。雾笛日志记录的姓名缩写和生理数值，就是她们对声音的反应数据。" },
  { id:"sm-7", chapter:3, title:"郭维的双面角色", question:"郭维在03:17的安排中到底扮演了什么角色？", requires:["family-group","rescue","a48"],
    answer:"郭维以家族企业名义资助慢病学生交通和寄宿费用，同时担任潮生健康项目顾问。他的女儿郭宁是C17-01入组者。白塔的03:17'LQ转入'日程由他签署，群公告中'今晚03:17统一转入'的指令也来自他。他既是项目的推动者，也是项目的受害者——他清楚那晚会发生什么，但他的女儿也在其中。" },
  { id:"sm-8", chapter:3, title:"TX-0817-12", question:"档案尾号TX-0817-12，究竟指向谁？", requires:["lan-transplant","a38","codes"],
    answer:"TX-0817-12同时出现在林岚的移植随访表和一条正文缺页的民政死亡登记索引中。0817代表8月17日，12是当年档案编号。随访表显示供体年龄十二岁、姓名被遮盖；死亡登记记录一名十二岁未成年人于2008年8月17日死亡——同一天，九岁的林岚接受急诊肝移植。岛外警方调取纸本原卷后，最后一个名字才出现：叶知潮，十二岁。" },
];

const MYSTERY_MILESTONES = [
  { count:2, title:"编号互证", text:"你已经能把跨场景出现的编号放回同一套档案体系。新的支线会优先提示缺失材料。" },
  { count:5, title:"旧港拼图", text:"火灾、转院与归潮号不再是孤立事件。未解之谜现在会显示线索来源。" },
  { count:8, title:"全貌归档", text:"八条旁证全部闭合。真结局会追加完整的支线归档记录。" },
] as const;

const ordinaryTitles = [
  ["民生", "雾港夏季客轮加开两班"], ["生活", "望潮饭店六月海鲜价目公示"], ["旅游", "白塔步道东段暂停开放"],
  ["社区", "归潮广场周末露天电影排片"], ["教育", "雾港中学旧校服征集启事"], ["气象", "内湾平流雾形成原因答疑"],
  ["商业", "潮声便利店夜班招聘一人"], ["交通", "老街施工公交临时绕行"], ["文化", "木名牌不是旅游纪念品"],
  ["健康", "卫生站提醒慢病居民按时复诊"], ["港务", "冷链码头完成季度消杀"], ["寻物", "游客遗失银色卡片相机"],
  ["市集", "周三渔获早市摊位调整"], ["社区", "停水通知：南坡巷管道检修"], ["人物", "许伯和他修了四十年的钟"],
  ["地方志", "雾港岛为什么像一只合拢的手"], ["旅游", "雨天在雾港可以去的五个地方"], ["生活", "潮生宾馆早餐供应时间调整"],
  ["教育", "海岛学生往返大陆补贴办法"], ["论坛", "本地人真的会怕三声雾笛吗"], ["文化", "旧港木器铺口述史整理完成"],
  ["政务", "旧港更新项目意见征集"], ["天气", "今晚20:10航班可能受能见度影响"], ["商业", "一勺外卖新增夜间配送区域"],
  ["档案", "1992年港务月报开放查阅目录"], ["论坛", "为什么地图上没有引水洞"], ["医疗", "潮生康养院旧址修缮说明"],
  ["历史", "归潮号事故报道版本索引"], ["社会", "2009年老街钟表铺火灾回访"], ["公告", "地方陈列馆扫描档案纠错说明"],
  ["港务", "工作船实名登记试行办法"], ["社区", "寻找1992年乙区旧职工"], ["健康", "海岛儿童健康档案数字化完成"],
  ["民俗", "旧港叫名礼原来要在岸上喊一次真名"], ["法治", "失踪人口报案与跨区协查流程"], ["观察", "旧港改造前的最后一个汛期"],
];

const articleDetails = [
  "港务客运站自7月1日起在周五、周日各加开一班往返客轮，试运行至8月31日。|加班船分别于14:10从大陆临海客运站发出、17:40从雾港返航，采用实名购票，开航前十分钟停止检票。大雾黄色预警期间不执行加班计划。|客运站提醒岛上居民，学生、慢病复诊人员原有优惠不变；携带冷藏药品者可向服务台申请冰袋。",
  "望潮饭店公布六月主要海鲜称重价格，明码标价表已张贴在进门右侧。|梭子蟹、海鲈和小管按当日进货价浮动，海蛎煎、紫菜汤等固定菜价本月不变。消费者如遇短斤少两，可保留结算小票向市场监管联络点反映。|老板陈放称，休渔期内部分品种来自大陆冷链，菜单会用蓝章注明，不冒充本地渔获。",
  "白塔步道东段因连续降雨出现边坡松动，自6月12日起临时封闭。|封闭范围为二号观景台至雾笛塔检修门，西段木栈道和塔下平台照常开放。港务站将在雨停后进行排水沟清理和落石检查。|公告未给出恢复日期，现场围栏夜间无照明，游客不要翻越。",
  "归潮广场本周六19:30放映修复版《海街旧事》，遇雨移至文化站礼堂。|活动免费，不设固定座位。社区为老人准备六十把折叠椅，其余观众可自带坐垫。片长108分钟，末班环岛公交将延后十五分钟。|放映前十分钟播放客轮安全短片，广场西侧保留消防通道。",
  "雾港中学征集1985年至2005年间使用过的校服、校徽与毕业照。|实物将用于校史室秋季展览，捐赠者可选择实名、匿名或展后取回。带有姓名贴的衣物由工作人员遮盖个人信息后陈列。|校方特别征集1992届资料，但不接受来源不明的医疗单据和户籍复印件。",
  "气象站解释，初夏暖湿空气流经较冷海面时容易形成平流雾。|这种雾通常从外海向内湾推进，风力很小时可能持续数小时。它会显著降低航道能见度，却不必然造成手机信号中断。|是否停航由港务部门根据航道实测决定，居民应以18:30复核通告为准，不要凭塔顶是否可见猜测。",
  "潮声便利店招聘一名长期夜班收银员，工作时间23:00至次日07:00。|岗位负责收银、鲜食报损和交接货，须年满十八周岁。工资按月结算，连续值夜班不超过五日。|应聘时登记姓名和联系电话；门店编号与员工号分栏印在胸牌上，离职时统一交回。",
  "受老街雨污管道施工影响，环岛公交自6月18日起临时绕行南坡巷。|潮生宾馆站暂时向东移动约一百二十米，归潮广场末班车时间不变。施工方预计十日内恢复原线。|老人及携带大件行李乘客可在客运码头服务台索取临时站点图。",
  "陈列馆说明，旧港木名牌原本用于寄存渔具和认领工位，并非旅游纪念品。|名牌一面刻姓名，一面刻船号或铺位。出海者失联时，家属会把牌带到岸边核对，但不同年代做法并不一致。|馆藏名牌均有捐赠记录，纪念品商店销售的是缩小复制品，背面有‘复刻’字样。",
  "卫生站本月慢病复诊集中在周二、周四上午，取药窗口提前半小时开放。|高血压、糖尿病患者需携带既往处方；行动不便者可由登记家属代领。工作人员不会通过私人聊天要求居民发送完整病历。|需离岛检查者可现场申请交通补贴证明，审批结果由政务短信发送。",
  "旧港冷链码头完成第二季度公共区域消杀，作业未进入封存仓库。|消杀范围包括装卸坡道、司机休息室与门岗，使用药剂和用量已登记。作业期间两班货船调整至内湾临时泊位。|码头称冷库出入仍执行车辆、货单、人员三项核验，访客不能以参观名义进入。",
  "一名游客6月9日在白塔西段遗失银色卡片相机，机身右下角有划痕。|相机内约有两百张家庭旅行照片，失主愿支付邮寄费用。最后一张确认拍摄地点为塔下售水亭。|拾到者可交客运站失物柜，公告不公开失主手机号，由服务台转接。",
  "受凌晨风浪影响，周三渔获早市由六码头移至归潮广场北侧雨棚。|摊位按原抽签顺序排列，活水车从东口进出。经营时间为05:30至09:00，结束后统一清运泡沫箱。|市场监管员将在入口复核电子秤，冷链水产须展示来源标签。",
  "南坡巷将于6月20日09:00至15:00停水，涉及七十二户和两家旅馆。|施工内容为更换一段老化铸铁管。潮生宾馆处于支管末端，恢复供水后可能短暂出现浑水。|维修队建议居民提前储水，消防栓和卫生站用水由临时水车保障。",
  "许伯的钟表铺在老街营业四十年，墙上仍挂着第一张个体户执照。|他最忙时替客轮站、学校和冷库校过钟。过去岛上不同单位偶有几分钟时差，港务记录最终以航标台报时为准。|2009年火灾后铺面重修，烧损账本由许伯家属捐给陈列馆保存。",
  "地方志用‘合拢的手’描述雾港岛：北坡像拇指，内湾被其余山脊包住。|岛长约七公里，居民区集中在东南缓坡；旧港、冷链和白塔分布在较陡的西北岸。公路环岛但没有贯穿北坡的机动车道。|引水洞属于废弃海蚀通道，因坍塌风险未绘入普通旅游图。",
  "连续下雨时，游客仍可去地方陈列馆、老街木器铺、文化站阅览室、鱼市雨棚和望潮饭店。|文章逐一核对开放时间：陈列馆周一闭馆，阅览室17:00关门，鱼市只在上午。白塔东段和引水洞不在推荐范围。|客运站提醒，游玩前先确认返程船，不要把工作码头当作观景点。",
  "潮生宾馆自本周起将早餐提前至06:30供应，结束时间仍为09:00。|住客凭房号用餐，低盐、无糖等特殊餐券由前台单独标注。没有提前登记的特殊餐不保证当日提供。|宾馆称早餐券右上角为餐别和后厨交接码，并非会员编号。",
  "在岛就读、户籍在大陆的学生可申请学期往返交通补贴。|申请材料包括学籍证明、监护关系和实际乘船记录，每学期集中审核一次。补贴直接进入监护人账户，不由学校代领现金。|办法明确，医疗检查和家庭活动不属于学生交通补贴范围。",
  "论坛用户讨论‘三声雾笛’的说法，多数本地回复认为只是天气与值班记忆。|老船员解释，短短长是旧时引航信号，不同雾况会重复播放。有人说夜里听见叫名，但没有录音能证明声音来自雾笛。|版主将帖子移入民俗区，并提醒不要擅闯白塔检修区域验证传言。",
  "陈列馆完成对旧港三家木器铺的口述访谈，录音共十一小时。|内容涉及船箱、工牌、名牌和棺木修补等日常生意。受访者会记错年份，整理稿在有争议处保留不同说法。|其中一段谈到‘牌留岸上，人才能回来’，馆方将其标为个人记忆而非史实。",
  "旧港更新项目公开征集岸线步道、排水和闲置仓库利用意见。|规划草案保留六码头吊机和一座冷库外墙，拆除三处危险棚屋。白塔检修通道不在此次开放范围。|居民可实名或匿名提交意见，涉及产权的材料需另附证明，不在公开网页展示。",
  "气象台16:00发布低能见度预警，20:10客轮是否开航将在18:30复核。|截至公告发布，07:20、11:40和16:30三班船均正常，移动通信与固定电话未中断。旅客可免费改签次日首班。|停航决定只适用于客轮，港务工作船另按作业许可管理。",
  "一勺外卖把夜间配送范围扩大到南坡巷和潮生宾馆，最晚接单时间22:30。|白塔、旧港冷链库区和客运码头登船区仍不配送。骑手须在宾馆前台交付，不能自行上楼。|平台保存订单和交付照片九十天，住客可凭订单号申请核对。",
  "地方档案室开放1992年港务月报目录，原件需预约到馆查阅。|目录包括客轮班次、工作船领用、燃油、救生器材与事故简报；人员电话和住址在公开副本中遮盖。|六月卷的页码从41跳至47，工作人员注记称中间材料在2009年移交调查机关。",
  "论坛提问‘为什么地图上没有引水洞’，收到港务站认证账号回复。|回复称该洞是旧港北侧自然海蚀通道，上世纪曾短暂用作缆绳仓，1993年后因两次坍塌封闭。普通地图只标注可通行设施。|帖子随后关闭评论，原作者补充自己只在老照片中见过入口。",
  "潮生康养院旧址将进行屋面加固和外墙除险，不改变建筑用途登记。|施工范围为主楼和食堂，乙区旧病房因档案权属未清暂不进入。工程现场不对游客开放。|公告所附平面图缺少地下层，建设方称本次测绘依据现存房产图。",
  "档案馆整理出‘归潮号’事故的四个公开报道版本，标题和人数记载并不一致。|6月17日简讯称工作船失联；6月19日改为无人维护船漂移；月底月报只列设备损失。港务内参另记领用救生衣十七件。|索引仅列版本差异，不判断哪一版属实，研究者需申请原件。",
  "2009年老街钟表铺火灾的报警人、消防记录和报纸报道在时间上相差八分钟。|许伯回忆起火前有人来取一只寄存铁盒，身份未登记。消防部门认定电线短路，不涉及人员伤亡。|受潮账本后来在阁楼找到，部分页码与地方陈列馆扫描件对不上。",
  "地方陈列馆发布扫描档案纠错规则，邀请捐赠者核对姓名、日期和倒置页。|更正必须保留原扫描图，网页新增修订记录，不直接覆盖原件。涉及未成年人和医疗信息的页面继续限制公开。|馆方承认早期批量识别把‘乙区’多次识别成‘二区’，已逐页复核。",
  "港务站试行工作船实名登记，离泊前须同时核验人员、燃油和目的港。|船长提交船员表，油料员填写加油数，目的港回执由收货方确认。三项缺一，值班员不得补签放行。|夜间紧急抢险可以先口头报备，但须在次日上午补齐记录并说明任务。",
  "社区寻找1992年曾在潮生康养院乙区工作的护理、后勤及维修人员。|征集用于补充地方医疗史，提供口述可匿名，原始证件由本人决定是否扫描。公告没有公布现存职工名单。|联系人使用陈列馆办公电话，来访者需预约，不接受未核实的转述。",
  "卫生站宣布完成1986年至2010年海岛儿童健康档案数字化。|项目录入接种、常规体检和转诊索引，医疗正文仍需监护关系或本人授权查阅。不同医院重复建档的记录暂不合并。|少量档案只有编号没有姓名，工作人员将保留原状，等待纸本来源核对。",
  "民俗研究者梳理旧港叫名礼时发现，仪式最后一步恰恰是公开叫回真名。|家属先把写有乳名的木牌沉入浅水，退潮后在岸上喊一次户籍姓名，象征让海知道人已归家。不同村落没有统一日期。|文章指出后来流传的‘永远不提名字’缺乏早期记录，可能是近几十年的误传。",
  "警方说明，成年人失联不满二十四小时也可以报案，不存在必须等待的统一规定。|接报后将根据最后出现地点、危险因素和通信情况决定查找措施；跨区出行可调取实名交通记录协查。旅馆发现住客异常应及时联系登记人并报警。|家属应提供近期照片、衣着和医疗风险，不要自行发布身份证完整号码。",
  "旧港改造前最后一个汛期，六码头仍承担岛上大部分建材和冷藏货物。|记者跟随夜班记录潮位、车辆和船舶交接。门岗使用纸本登记，凌晨后有两次涂改，值班员解释为雨水浸湿后重写。|报道只呈现当晚所见，未核实更早年份的事故传闻。"
];

const articleDates = [
  "2026.06.01","2026.06.02","2026.06.03","2026.06.06","2026.05.28","2025.09.12",
  "2026.06.10","2026.06.12","2024.08.15","2026.06.13","2026.06.09","2026.06.08",
  "2026.06.15","2026.06.15","2024.11.04","2023.07.21","2026.05.30","2026.06.11",
  "2025.08.26","2024.10.07","2025.12.03","2026.04.18","2026.06.16","2026.06.12",
  "2024.06.13","2024.05.04","2026.03.17","2024.06.13","2024.05.04","2026.02.18",
  "2023.09.01","2024.05.04","2026.02.13","2023.08.17","2025.10.21","2022.06.30",
];

const articleSourceFor = (tag:string) => tag === "论坛" ? "岛民论坛"
  : ["政务","公告","交通","法治"].includes(tag) ? "雾港政务公开"
  : ["档案","地方志","历史","民俗"].includes(tag) ? "雾港地方档案"
  : "今日雾港";

const ARTICLES: Article[] = ordinaryTitles.map(([tag, title], i) => ({
  id: `a${i + 1}`, chapter: i >= 24 ? 2 : 1, tag, title, date: articleDates[i],
  excerpt: articleDetails[i].split("|")[0],
  body: articleDetails[i].split("|").slice(1), source: articleSourceFor(tag), author: tag==="论坛"?"岛民投稿":i%5===0?"记者 许蔚":"编辑部整理",
  image: [0,1,2,3,5,10,15,17,22,26,30,35].includes(i) ? ["/photos/venue-terminal.webp","/photos/venue-restaurant.webp","/photos/lighthouse-door.webp","/photos/venue-plaza.webp","/photos/wugang-aerial.webp","/photos/venue-cold-chain.webp","/photos/wugang-aerial.webp","/photos/venue-hotel.webp","/photos/venue-terminal.webp","/photos/venue-hotel.webp","/photos/venue-cold-chain.webp","/photos/wugang-aerial.webp"][[0,1,2,3,5,10,15,17,22,26,30,35].indexOf(i)] : undefined,
  deleted: i === 25 || i === 31, redacted: i === 27 || i === 32,
  related: [22,24,27,30,31].includes(i) ? true : undefined,
}));

ARTICLES.push({ id: "a37", chapter: 3, tag: "医疗", date: "2008.08.17", title: "跨区儿童器官移植术后随访登记", excerpt: "患者林岚，9岁；供体身份在公开副本中隐去。", redacted: true, related: true, body: ["登记显示患者因急性肝衰竭接受急诊移植，术后转入长期随访。供体年龄十二岁，供体姓名栏在数字化副本中被整段遮盖。", "附件目录原有死亡证明、转运交接和监护人同意书三项，当前扫描包只剩随访首页。档案尾号为TX-0817-12。"] });
ARTICLES.push({ id: "a38", chapter: 3, tag: "民政", date: "2008.08.18", title: "TX-0817-12死亡登记索引（正文缺页）", excerpt: "索引可以检索，登记正文与更正页均不在公开扫描包内。", deleted: true, redacted: true, related: true, body: ["目录记录一名十二岁未成年人于2008年8月17日死亡，姓名、户籍地与监护人字段未公开。", "纸本卷宗第12页与第13页之间留有撕裂装订孔。移交备注只剩半枚印章，无法确认经办机构。"] });

ARTICLES.push(
  {id:"a39",chapter:1,tag:"即时",date:"2026.06.16",title:"今日雾港：晚班船18:30复核，岛内公交正常",excerpt:"截至16:20，阵雨减弱，客运站尚未决定是否取消20:10班次。",source:"今日雾港",author:"值班编辑 周俐",image:"/photos/wugang-map-rain.webp",related:true,body:["气象站称内湾能见度仍在下降，是否停航以客运站现场广播为准。岛内环线、商店和旅馆正常营业。","通信运营商未报告基站故障。客运站提醒旅客不要前往工作码头等待替代船只。"]},
  {id:"a40",chapter:1,tag:"人物",date:"2024.11.03",title:"望潮饭店经营者陈放：休渔期也得把来源写清楚",excerpt:"一篇普通的本地商户访谈，记录陈放从修相机到经营饭店的经历。",source:"雾港商户通讯",author:"记者 许蔚",image:"/photos/venue-restaurant.webp",related:true,body:["陈放，1988年生，早年在大陆影像器材店工作，2021年回岛接手亲属饭店。工商登记、食品许可与采访信息一致。","采访附件中的个人履历止于2021年，未涉及港务、医疗或康养院。"]},
  {id:"a41",chapter:1,tag:"旅业",date:"2025.12.19",title:"潮生宾馆年度消防检查记录",excerpt:"检查记录列出经营者与当班员工，住客信息依法不公开。",source:"雾港政务公开",author:"消防联络点",image:"/photos/venue-hotel.webp",redacted:true,related:true,body:["宾馆1998年登记营业，现有客房二十八间。前台员工蒋小蕊于2024年完成消防培训。","附件三‘万能卡领用人员’在网页扫描中缺失，目录显示原件共两页，当前只能打开第一页。"]},
  {id:"a42",chapter:1,tag:"巡检",date:"2026.06.15",title:"白塔东侧夜间异响完成设备排查",excerpt:"港务站称异响来自检修门受风振动，暂未发现线路故障。",source:"今日雾港",author:"港务站值班室",image:"/photos/lighthouse-door.webp",related:true,body:["巡检时间为22:40至23:15，东侧道路因边坡维护未向公众开放。","巡检单的第二名签字被水浸开，只能辨认姓氏左半部分。港务站称纸本会在月底统一扫描。"]},
  {id:"a43",chapter:2,tag:"今日雾港",date:"2026.06.16",title:"陈列馆夜间更新一批旧港医疗史目录",excerpt:"新增目录包括转院单、值班表和器材领用簿，正文仍按隐私等级开放。",source:"今日雾港",author:"文化版编辑",image:"/photos/nurse-id-1992.webp",related:true,body:["这批目录于22:00完成上传，只开放题名、年代、页数和来源，不公开未成年人姓名及医疗正文。","工作人员发现1992年六月卷有四页缺口，装订线显示纸张曾被人为拆走，缺页去向没有移交记录。"]},
  {id:"a44",chapter:2,tag:"人物残档",date:"2010.02.08",title:"沈砚旧港口述史项目登记卡",excerpt:"项目登记人存在，但联系方式、结项页和两盘访谈带均已缺失。",source:"雾港地方档案",author:"目录自动生成",image:"/photos/wugang-map-archive.webp",related:true,body:["沈砚，男，项目登记时34岁，身份栏填写‘自由研究者’。2008年至2009年申请查阅旧港、康养院和失踪人口剪报。","登记卡背面被整页撕去，只剩订书钉孔。联系电话已停用，档案馆没有保存身份证复印件。"]},
  {id:"a45",chapter:2,tag:"执业索引",date:"1993.01.12",title:"周岚护理执业登记变更索引",excerpt:"公开索引显示执业地点曾为潮生康养院乙区，变更附件无法查看。",source:"卫生档案目录",author:"系统迁移",redacted:true,related:true,body:["周岚的登记状态于1993年1月变更，原因字段被遮盖。公开页没有照片、住址和后续执业地点。","目录显示附件应有三页，目前扫描包只有封面；纸本借阅卡最后一次签出时间为2009年。"]},
  {id:"a46",chapter:2,tag:"事故旧闻",date:"1992.06.20",title:"归潮号搜索第四日：仅发现空油桶与缆绳",excerpt:"当年短讯没有提到人员，只称工作船可能在大雾中漂移。",source:"《临海晚报》剪报",author:"记者署名缺失",deleted:true,related:true,body:["剪报下半段被撕掉，现存文字无法确认船上是否有人。照片背面却写有‘家属在客运站等候’。","同日港务月报将事故归为设备损失，两份材料的叙述对象并不一致。"]},
  {id:"a47",chapter:3,tag:"今日雾港",date:"2026.06.17",title:"白塔检修门将于凌晨低潮窗口短时开启",excerpt:"港务站提示03:10至03:35有设备运输，公众不要进入东侧封闭路段。",source:"今日雾港",author:"港务通知",image:"/photos/wugang-map-night.webp",related:true,body:["通知称运输内容为备用电池和除湿设备，车辆从旧港冷链方向进入。","附件中的车辆号牌、承运单位和现场负责人均以个人信息为由遮盖。"]},
  {id:"a48",chapter:3,tag:"人物",date:"2023.09.22",title:"郭维向雾港中学捐赠慢病学生交通基金",excerpt:"公开报道只记录其公益身份，没有披露资金管理细节。",source:"今日雾港",author:"教育记者 何岑",image:"/photos/family-dinner.webp",related:true,body:["郭维长期以家族企业名义资助复诊交通和寄宿费用，同时担任潮生健康项目顾问。","基金年度报告的受助者名单依法隐去，但附件中的审批人页在2025年后停止公开。"]},
  {id:"a49",chapter:3,tag:"医师公示",date:"2026.03.04",title:"吴启明医师多点执业备案",excerpt:"备案包含卫生站与潮生健康门诊两个地点，执业范围为内科。",source:"卫生监督公示",author:"政务数据同步",redacted:true,related:true,body:["吴启明的学历、资格证号与常规执业信息完整。2008年至2010年的工作经历一栏显示‘材料核验中’。","附件目录曾包含一份儿童随访项目任职表，当前链接返回文件不存在。"]},
  {id:"a50",chapter:3,tag:"校园",date:"2025.12.28",title:"郭宁获海岛学生生物观察竞赛二等奖",excerpt:"学校报道中的郭宁只是普通学生，文章没有健康项目相关内容。",source:"雾港中学",author:"校团委",related:true,body:["郭宁的作品记录潮间带生物，没有使用人体或医疗数据。指导教师评价她观察细、记录完整。","获奖名单页的监护人签字栏被后期遮盖，学校称未成年人信息不对外公开。"]},
  {id:"a51",chapter:3,tag:"社区",date:"2026.06.17",title:"多名居民反映凌晨听到旧雾笛，港务站称未安排试鸣",excerpt:"声音出现时间不一，没有一段录音能完整记录三次鸣响。",source:"岛民论坛存档",author:"社区版主",image:"/photos/lighthouse-door.webp",related:true,body:["发帖者分布在南坡巷、旧港和学校宿舍，部分人称声音里像夹着名字，其他人只听见机械低频。","港务站回复公开系统没有试鸣任务，可能是海风与金属共振。帖子仍保留，但评论中的人名已全部删除。"]}
);

const APPS: { id: AppId; icon: string; name: string }[] = [
  { id: "messages", icon: "微", name: "微信" }, { id: "photos", icon: "相", name: "照片" },
  { id: "notes", icon: "记", name: "备忘录" }, { id: "files", icon: "档", name: "文件" },
  { id: "shopping", icon: "淘", name: "手机淘宝" }, { id: "music", icon: "声", name: "泊声音乐" },
  { id: "weather", icon: "雾", name: "天气" }, { id: "appstore", icon: "A", name: "App Store" },
  { id: "camera", icon: "相", name: "相机" },
  { id: "amap", icon: "图", name: "高德地图" }, { id: "calculator", icon: "算", name: "计算器" },
  { id: "phone", icon: "电", name: "电话" },
];

const PHOTO_SETS = {
  1: [
    { title: "便利店夜班胸牌", caption: "潮声便利店 · 门店17 / 员工04", clue: "badge1704", src: "/photos/clerk-badge.webp", meta: "2026/06/16 20:07 · 林岚的手机", transcript: "胸牌上栏：潮声便利店　门店17\n姓名：陶小雨\n岗位：夜班收银\n员工号：04" },
    { title: "宾馆早餐券", caption: "306房随身物品 · C17 / 04 · 低盐", clue: "voucher1704", src: "/photos/breakfast-voucher.webp", meta: "2026/06/16 17:18 · 林岚的手机", transcript: "潮生宾馆早餐券\n房号：306\n餐别：低盐\n右上角手写：C17 / 04\n使用日期：6月15日" },
    { title: "306房门", caption: "门锁指示正常，走廊靠近安全楼梯", clue: "", src: "/photos/hotel-306.webp", meta: "2026/06/16 17:12 · 林岚的手机", transcript: "房门号：306\n电子门锁指示灯：绿色\n拍摄时间：2026年6月16日 17:12\n位置：潮生宾馆三层东侧走廊" },
  ],
  2: [
    { title: "四张转院单", caption: "来自不同县市，均残留乙区印章", clue: "ward", src: "/photos/transfer-forms.webp", meta: "林琴旧机备份导入 · 原件年代1989—1992", transcript: "四份原件分别签发于1989、1990、1991和1992年。\n转出医院不同，接收栏均盖有：潮生康养院乙区。\n患者年龄依次为12岁、9岁、11岁、13岁。\n四张单据的转院理由均写作“进一步观察”。" },
    { title: "周岚护士证", caption: "与事故当夜乙区值班表放在一起", clue: "nurse", src: "/photos/nurse-id-1992.webp", meta: "地方陈列馆扫描 · 1992", transcript: "姓名：周岚\n职务：护士\n单位：潮生康养院乙区\n有效期：1991年1月至1993年12月\n背面手写：6月16日夜班，20:00—次日08:00" },
    { title: "十二件衣物", caption: "寻人启事中的衣物描述复原陈列", clue: "twelve", src: "/photos/children-clothes.webp", meta: "沈砚资料夹 · 2009年翻拍" },
  ],
  3: [
    { title: "年度随访表", caption: "同一页上的C17-01与C17-04", clue: "codes", src: "/photos/health-records.webp", meta: "郭宁设备备份导入 · 2026/06/17", transcript: "潮生健康年度随访\nB11-05　郭维　心率\nB09-02　吴启明　服药\nC17-01　郭宁　夜间脑电\nC17-04　陶小雨　声音应答\n页脚：历史随访索引 TX-0817-12\n备注栏缺失，表头没有解释字母和数字的含义。" },
    { title: "白塔检修门", caption: "门禁日程显示03:17自动解锁", clue: "rescue", src: "/photos/lighthouse-door.webp", meta: "郭宁设备备份导入 · 雨夜", transcript: "白塔东侧检修门\n门禁状态：锁定\n计划任务：03:17 自动解锁\n关联日程：LQ 转入\n门后通道：地下设备层" },
    { title: "郭家聚餐", caption: "饭局看起来和平常没有不同", clue: "", src: "/photos/family-dinner.webp", meta: "家庭共享相册 · 2026/05/02" },
  ],
} satisfies Record<number, { title: string; caption: string; clue: string; src: string; meta: string; transcript?: string }[]>;

type ChatLine = { side: "them" | "me" | "system"; text: string; terror?: boolean; redText?: boolean };
function conversationFor(chapter: number, thread: string): ChatLine[] {
  if(thread==="陌生号码") return chapter===1?[
    {side:"them",text:"306的备用卡不是给你翻东西用的"},{side:"me",text:"你是谁"},{side:"them",text:"你刚从三楼下来 雨衣左肩破了"},{side:"them",text:"快走 他们知道你来了"}
  ]:chapter===2?[
    {side:"them",text:"缺掉的页不是遗失"},{side:"me",text:"沈砚在哪"},{side:"them",text:"旧纸会烂 人也会 别再查乙区"}
  ]:[
    {side:"them",text:"别去白塔"},{side:"them",text:"[监控照片] 旧港冷链东门 02:41"},{side:"me",text:"林琴在下面对不对"},{side:"them",text:"现在回头 你还能当没看见"},{side:"system",text:"对方撤回了一条消息"},{side:"them",text:"扫码缴费，快速离开，快，快",redText:true},{side:"them",text:"你刚才是不是听见了 那个声音",terror:true},{side:"me",text:"什么声音"},{side:"them",text:"算了 你继续查吧 别查乙区"},{side:"system",text:"6月17日 03:17"},{side:"them",text:"她醒了",terror:true},{side:"me",text:"谁醒了"},{side:"them",text:"她在问你的名字",terror:true},{side:"them",text:"快走。别回头。",redText:true}
  ];
  if (thread === "潮") {
    const first:ChatLine[] = [
    { side: "them", text: "到了？" }, { side: "me", text: "嗯 雨刚停" },
    { side: "them", text: "你妈住哪间" }, { side: "me", text: "306 人不在 行李还在" },
    { side: "them", text: "先查门卡记录 别急着翻行李" }, { side: "me", text: "你觉得她没走？" },
    { side: "them", text: "……我说不好。你先看记录。" },
    ];
    const second:ChatLine[] = [
    {side:"system",text:"6月16日 22:04"},
    { side: "me", text: "十二张 看得我眼睛快瞎了" }, { side: "them", text: "别盯名字 没用" },
    { side: "me", text: "那盯什么" }, { side: "them", text: "年龄 衣服 转院章 哪个重复就是哪个" },
    { side: "me", text: "你以前干过这个啊" }, { side: "them", text: "没有。就是看不得人把人写成编号。" },
    ];
    const third:ChatLine[] = [
    {side:"system",text:"6月17日 02:46"},
    { side: "them", text: "找到人了？" }, { side: "me", text: "知道在哪 但还没进去" },
    { side: "them", text: "位置先发出去 别等" }, { side: "me", text: "名单呢 一起发？" },
    { side: "them", text: "别 里面有病人 先备份" }, { side: "me", text: "你到底是哪边的" },
    { side: "them", text: "你这边。快。", redText: true },
    ];
    return chapter===1?first:chapter===2?second:third;
  }
  const chats: Record<string, ChatLine[]> = {
    "1:妈妈": [
      { side: "them", text: "护膝到了 颜色比照片深一点 不过还行" }, { side: "me", text: "能戴就行 你别又舍不得拆啊" },
      { side: "them", text: "到雾港了 住潮生宾馆306 房间有点潮" }, { side: "me", text: "后天几点的船 我去码头接你" },
      { side: "them", text: "办完事再说 冰箱第二层有汤 别老点外卖😅" },
    ],
    "1:潮生宾馆": [
      { side: "them", text: "您好 潮生宾馆前台 您问306的林女士是吧" }, { side: "me", text: "对 她两天没回消息了 能帮我敲下门吗" },
      { side: "them", text: "行李还在 人昨晚没回来 我们已经报过警了" },
      { side: "me", text: "房间的东西先别动 我马上到" }, { side: "them", text: "好 到了找我前台就行 我姓蒋" },
    ],
    "1:陈放": [
      { side: "them", text: "喂 你那台35还在我这儿 遮光罩磕了个角" }, { side: "me", text: "先放着 电池帮我充上" },
      { side: "them", text: "又出差？你不是说最近不跑了吗" }, { side: "me", text: "不是出差 我妈在雾港失联了 我得过去" },
      { side: "them", text: "……雾港？定位发我一个 有事喊一声 别一个人往废码头跑" },
    ],
    "1:蒋小蕊": [
      { side: "them", text: "林姐 我是前台小蒋 警察刚走 看了房间 说旧手机和帆布包先封存登记" },
      { side: "me", text: "昨晚有人进去过吗" }, { side: "them", text: "保洁没进 老板有总卡 但系统没显示开门记录 你到了我给你看" },
      { side: "me", text: "好 你先别跟老板提这事" }, { side: "them", text: "嗯 路上慢点 码头地砖滑得很🌧️" },
    ],
    "2:沈砚（旧号码）": [
      { side: "them", text: "别查名字 那份名单是后来补的" }, { side: "them", text: "[文件] 十二张启事_扫描件.pdf" }, { side: "me", text: "你谁啊 为什么用沈砚的号" },
      { side: "them", text: "先看年龄 衣服 还有转院章 名字没用" }, { side: "me", text: "你认识我妈？" },
      { side: "them", text: "认识。她不一定记得我。" }, { side: "system", text: "该账号已停止接收消息" },
    ],
    "2:许医生": [
      { side: "them", text: "这次量表比三月好一点 药暂时不加" },
      { side: "me", text: "她老梦见潮水和小孩唱歌 这算以前的事吗" }, { side: "them", text: "梦不能直接当记忆用 你先记频率 记她睡得好不好 白天接触了什么" },
      { side: "me", text: "好 我把这三周记录发您" },
    ],
    "3:郭家健康群": [
      { side: "them", text: "C组复查改周五 早餐后别自己加药" }, { side: "me", text: "我周五模拟考 能不能下周去" },
      { side: "them", text: "不能 今晚03:17统一转入 C组家属不要靠近白塔" }, { side: "me", text: "为什么每次都不给我们看报告" },
      { side: "them", text: "C17-01 复查异常 心率夜间骤降 请确认是否停药" }, { side: "me", text: "没停过啊 一直都按时吃的" },
      { side: "them", text: "收到。明早抽血复核。白塔夜间有设备检修，家属不要靠近北坡。", terror: true },
    ],
    "3:爸爸": [
      { side: "them", text: "晚上回来吃饭 你姑带了黄鱼" }, { side: "me", text: "在小雨店里写卷子 晚点回" },
      { side: "them", text: "十点前回来 明早抽血" }, { side: "me", text: "又抽？上个月不是才抽过" },
      { side: "them", text: "别跟我犟 你的药 学校名额 以后出岛 哪样不是家里在安排" },
    ],
    "3:吴医生": [
      { side: "them", text: "药袋拍17·01那个 别跟小雨的混一块儿" }, { side: "me", text: "我们吃的不是一样的吗" },
      { side: "them", text: "剂量不一样 不能混。最近还听见那首歌吗" }, { side: "me", text: "她也听见了 可我们小时候不认识啊" },
      { side: "them", text: "别在群里说这个 先记时间 回头告诉我" },
    ],
    "3:陶小雨": [
      { side: "them", text: "你那把蓝伞还在店里 啥时候来拿" }, { side: "me", text: "帮我塞收银台下面 明天拿" },
      { side: "them", text: "你爸刚来过了 脸臭得要死" }, { side: "me", text: "他一提体检就这样 药袋拍了吗" },
      { side: "them", text: "拍了 还是C17/04😓 昨晚又梦到那个走廊了 没窗那个" }, { side: "me", text: "又梦到了？" },
      { side: "them", text: "这次不一样 走廊尽头有张床 床上的人睁着眼睛看我", terror: true }, { side: "me", text: "……别说了 我害怕" },
      { side: "them", text: "她好像在叫我 但声音不对 像从水底下传上来的", terror: true },
    ],
  };
  if(thread==="妈妈") return chats["1:妈妈"];
  if(thread==="潮生宾馆"||thread==="陈放"||thread==="蒋小蕊") return chats[`1:${thread}`];
  return chats[`${chapter}:${thread.replace("（导入备份）","")}`] || [
    { side: "them", text: "今天风大 回来的船晚了十分钟" }, { side: "me", text: "知道了 路上小心" },
  ];
}

const avatarFor = (name: string) => name === "潮" || name === "陌生号码" ? "/avatars/tide.webp" : name.includes("郭家")
  ? "/photos/family-dinner.webp" : name.includes("妈妈") ? "/avatars/mom.webp" : name.includes("爸爸") ? "/avatars/chen.webp" : name.includes("宾馆") ? "/avatars/hotel-key.webp" : name.includes("沈砚")
  ? "/avatars/shen-yan.webp" : name.includes("吴医生") ? "/avatars/wu-doctor.webp" : name.includes("医生") ? "/avatars/doctor.webp" : name.includes("陶") ? "/avatars/clerk.webp" : name.includes("蒋") ? "/avatars/jiang.webp" : name.includes("陈放") ? "/avatars/chen.webp" : "/avatars/lin-lan.webp";

const replyChoicesFor = (chapter:number, name:string) => {
  if(name === "潮") return chapter === 1 ? ["先查哪儿","你觉得她还在岛上","那个编号呢"] : chapter === 2 ? ["为什么不查名字","十二张怎么排","归潮号跟乙区有关吗"] : ["先救人还是先发名单","你到底谁啊","白塔下面有人吗"];
  if(name === "妈妈") return ["妈 你还在宾馆吗","我明天去接你","看见了回我一下🙏"];
  if(name.includes("宾馆")) return ["306的东西先别动","能拍一下门卡记录吗","你们几点报的警"];
  if(name.includes("郭家")) return ["原始报告呢","今晚我不去白塔","编号谁定的"];
  if(name === "爸爸") return ["把报告发我","你们到底瞒了什么","今晚别等我"];
  if(name.includes("许医生")) return ["她最近总说梦到走廊","量表能让我看下吗","她以前也这样过吗"];
  if(name.includes("吴医生")) return ["药袋编号是什么意思","剂量哪里不一样","那首歌是什么"];
  if(name.includes("陶")||name.includes("蒋")) return ["原图留一下🙏","你还记得几点吗","先别跟别人说"];
  return ["最后一次见她是几点","原始记录能拍吗","你再想想还有没有别的"];
};

const autoReplyFor = (chapter:number, name:string, text:string): string | null => {
  const map: Record<string, Record<string, string>> = {
    "潮": {
      "先查哪儿":"门卡和船票。先把时间线理清楚，别急着翻行李。",
      "你觉得她还在岛上":"船票没出岛记录，工作船也没目的港回执。你自己想。",
      "那个编号呢":"C17/04在两个地方出现。先记着，后面会用到。",
      "为什么不查名字":"名字是后来补的。先看年龄、衣服、转院章。",
      "十二张怎么排":"先按医院分。转院单上的章是同一个，跑不了。",
      "归潮号跟乙区有关吗":"同一天晚上。床位改了，救生衣也领了十七件。你说呢。",
      "先救人还是先发名单":"先发位置。里面有病人，不能停设备。",
      "你到底谁啊":"现在说了你也不信。先找TX-0817-12。",
      "白塔下面有人吗":"有。你妈在下面。",
    },
    "潮生宾馆": {
      "306的东西先别动":"没动 锁着呢 警察说了保持原样",
      "能拍一下门卡记录吗":"行 打印机有点慢 我拍清楚发你",
      "你们几点报的警":"昨晚十一点多 前台换班发现没人回来就报了",
      "最后一次见她是几点":"昨天下午她还下来拿过快递 之后就没人见了",
      "原始记录能拍吗":"我试试 拍清楚发你",
      "你再想想还有没有别的":"嗯……好像没了 想到再跟你说",
    },
    "陈放": {
      "最后一次见她是几点":"前天傍晚吧 她来店里吃了碗面 一个人坐靠窗",
      "原始记录能拍吗":"行 我找找相册 拍完发你",
      "你再想想还有没有别的":"她那天好像拿着个牛皮纸信封 鼓鼓的",
      "先查哪儿":"宾馆和码头 这两个地方先跑",
      "你觉得她还在岛上":"说不好 但船没出去 人应该还在",
    },
    "蒋小蕊": {
      "原图留一下🙏":"留着了 👍 原图我不删",
      "你还记得几点吗":"大概十一点 具体没看时间 换班才发现的",
      "先别跟别人说":"知道 嘴严得很😂",
      "最后一次见她是几点":"昨天下午她还下来过 拿了个快递",
      "你再想想还有没有别的":"她那天好像有点心不在焉 说话反应慢半拍",
    },
    "郭家健康群": {
      "原始报告呢":"郭维：临时不在手边 回头拍给你",
      "今晚我不去白塔":"郭维：不是让你去 是让你别靠近 今晚有设备检修",
      "编号谁定的":"郭维：家里的事回家说 别在群里问",
    },
    "爸爸": {
      "把报告发我":"原件不在我这 你先回来",
      "你们到底瞒了什么":"没什么好瞒的 你回来再说",
      "今晚别等我":"别一个人去白塔 先回家",
    },
    "陶小雨": {
      "原图留一下🙏":"留着了 拍得清楚 👍",
      "你还记得几点吗":"好像十一点多 具体记不清了",
      "先别跟别人说":"放心 我不说😂",
      "你再想想还有没有别的":"她最近老提起一个梦 说走廊没窗……",
    },
    "许医生": {
      "她最近总说梦到走廊":"梦到走廊的人不止她一个。你先把频率记下来，别急着下结论。",
      "量表能让我看下吗":"量表结果不能直接给你，但可以告诉你：三月比一月好，夜间指标还是偏低。",
      "她以前也这样过吗":"她小时候的事不太愿意说。不过梦的内容……你最好问问她小时候认识的人。",
    },
    "吴医生": {
      "药袋编号是什么意思":"C17是项目组，01到04是入组顺序。这个编号只在系统里用，跟药名没关系。",
      "剂量哪里不一样":"C17-01和C17-04差一倍。混了会出问题，所以我让你分开放。",
      "那首歌是什么":"不是什么歌。是旧雾笛的声音。她们都听过，但不一定在同一时间。",
      "把报告发我":"只能先核对编号 身份信息要本人申请",
      "你们到底瞒了什么":"医疗记录不能随便给 你得走流程",
      "今晚别等我":"今晚我值班 你别乱跑",
    },
  };
  const replies = map[name];
  if (replies && replies[text]) return replies[text];
  // fallback
  if(name === "妈妈" || name.includes("沈砚")) return null;
  if(name.includes("郭家")) return "郭维：家里的事回家说 别在群里问";
  if(name.includes("医生")) return "先核对编号 身份信息要本人申请";
  if(name.includes("陶") || name.includes("蒋")) return "留着了 👍";
  return "我找找 等会回你";
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [area, setArea] = useState<Area>("phone");
  const [app, setApp] = useState<AppId>("home");
  const [found, setFound] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [collectionNotice, setCollectionNotice] = useState<Clue | null>(null);
  const [query, setQuery] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [thread, setThread] = useState("");
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [ending, setEnding] = useState<string | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [itemNotice, setItemNotice] = useState<Item | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<Record<number,number>>({});
  const [introSeen,setIntroSeen]=useState(false);
  const [lockTouch,setLockTouch]=useState<number|null>(null);
  const [unlocking,setUnlocking]=useState(false);
  const [tutorialShown,setTutorialShown]=useState(false);
  const [terrorActive,setTerrorActive]=useState(false);
  const [terrorInfo,setTerrorInfo]=useState({text:"",reward:""});
  const [terrorTime,setTerrorTime]=useState(0);
  const [resolvedMysteries,setResolvedMysteries]=useState<string[]>([]);
  const [acceptedFriends,setAcceptedFriends]=useState<string[]>([]);
  const [hydrated,setHydrated]=useState(false);

  useEffect(() => { try { const v = JSON.parse(localStorage.getItem("wugang-v6") || "null"); if (v) { setStarted(Boolean(v.started)); setChapter(v.chapter || 1); setUnlocked(v.unlocked || 1); setFound(v.found || []); setInventory(v.inventory || []); setIntroSeen(Boolean(v.introSeen)); setTutorialShown(Boolean(v.tutorialShown)); setResolvedMysteries(v.resolvedMysteries || []); setAcceptedFriends(v.acceptedFriends || []); } } catch {} finally { setHydrated(true); } }, []);
  useEffect(() => { if(!hydrated)return;localStorage.setItem("wugang-v6", JSON.stringify({ started, chapter, unlocked, found, inventory, introSeen, tutorialShown, resolvedMysteries, acceptedFriends })); }, [hydrated, started, chapter, unlocked, found, inventory, introSeen, tutorialShown, resolvedMysteries, acceptedFriends]);

  useEffect(()=>{if(!terrorActive)return;const t=window.setInterval(()=>{setTerrorTime(v=>{if(v<=1){clearInterval(t);setTerrorActive(false);setTerrorInfo({text:"",reward:""});return 0}return v-1})},1000);return()=>clearInterval(t)},[terrorActive]);

  const chapterClues = CLUES.filter(c => c.chapter === chapter);
  const collected = chapterClues.filter(c => found.includes(c.id));
  const availableArticles = ARTICLES.filter(a => a.chapter <= chapter);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableArticles;
    return availableArticles.filter(a => `${a.title}${a.tag}${a.excerpt}${a.body.join("")}`.toLowerCase().includes(q));
  }, [query, chapter]);

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const collect = (id: string) => {
    if (found.includes(id)) { notify("这份材料已经收录"); return; }
    const clue = CLUES.find(c => c.id === id); if (!clue) return;
    setFound(v => [...v, id]); setCollectionNotice(clue);
  };
  const acquireItem = (id:string) => {
    const item = ITEMS[id]; if (!item) return;
    if (inventory.includes(id)) { notify(`${item.title}已经在随身物品里`); return; }
    setInventory(value=>[...value,id]); setItemNotice(item);
  };
  const withTransition = (update: () => void) => {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(update);
    else update();
  };
  const openArea = (next: Area) => withTransition(() => { setArea(next); setApp("home"); setThread(""); setArticle(null); });
  const changeChapter = (n: number) => { if (n > unlocked) { notify("先完成当前章节的阶段结论"); return; } withTransition(() => { setChapter(n); setArea("phone"); setApp("home"); setThread(""); setSelected([]); setAnswer(""); }); };
  const toggleEvidence = (id: string) => setSelected(v => v.includes(id) ? [] : [id]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!answer) { notify("先写下你目前最倾向的解释。判断不是锁死的，之后还可以改。"); return; }
    if(chapter===3&&answer==="rescue-first"&&!inventory.includes("maintenance-tag")){notify("你知道时间，却还没有能进入地下设备层的凭据。先检查旧港冷链的无牌车辆。");return}
    if(chapter===3&&answer==="rescue-first"&&!inventory.includes("bed-location")){notify("先确认LQ的具体床位与生命状态。只有日程，没有救援位置还不能行动。");return}
    const deduction = DEDUCTIONS.find(d=>d.chapter===chapter&&selected.includes(d.id)&&d.requires.every(id=>found.includes(id)));
    const correct = answer === (chapter === 1 ? "island" : chapter === 2 ? "transfer" : "rescue-first");
    const acceptedArguments:Record<number,string[]>={1:["room-timeline","departure-gap","weather-alibi"],2:["ward-chain","seventeen-children"],3:["transfer-chain"]};
    const argumentValid=Boolean(deduction&&acceptedArguments[chapter].includes(deduction.id));
    if (!argumentValid || !correct) {
      const attempts=(failedAttempts[chapter]||0)+1; setFailedAttempts(value=>({...value,[chapter]:attempts}));
      const ideas = chapter===1
        ? ["别急着找‘最重要’的那张。先在调查手记里看看，哪些记录能在时间上互相对照。","能支撑这一问的，是房间时间断点、两种离岛记录，或停航与通信时间。重复编号值得记，但还不能证明她去了哪里。"]
        : chapter===2
        ? ["单张名单很容易误导。把人物记录与同一晚发生的转院、值班或船具变化放在一起。","调查手记里已经出现可组合的材料。回到结论页，选择最能支撑当前判断的一条推演。"]
        : ["先把‘今晚会发生什么’和‘这套编号长期在做什么’分开梳理。","选择一条能说明今晚行动的组合推演。救援位置比公开名单更有时间压力。"];
      notify(ideas[Math.min(attempts-1,ideas.length-1)]); return;
    }
    if (chapter < 3) {
      const nextNotice=chapter===1
        ? "警方完成登记，306内的无卡旧手机已交给林岚；备份已导入本机。"
        : "郭宁在便利店后门交出只读备份；聊天、文件和健康记录已导入。";
      setUnlocked(chapter + 1); setChapter(chapter + 1); setArea("phone"); setApp("home"); setSelected([]); setAnswer(""); notify(nextNotice);
    }
    else setEnding("truth");
  };
  const reset = () => { localStorage.removeItem("wugang-v6");localStorage.removeItem("wugang-tool-installed");localStorage.removeItem("wugang-wechat-log");[1,2,3].forEach(n=>localStorage.removeItem(`wugang-recovered-${n}`)); setStarted(false); setIntroSeen(false); setTutorialShown(false); setChapter(1); setUnlocked(1); setFound([]); setInventory([]); setResolvedMysteries([]); setAcceptedFriends([]); setEnding(null); setArea("phone"); setApp("home"); };
  const unlockPhone=()=>{if(unlocking)return;setUnlocking(true);window.setTimeout(()=>setIntroSeen(true),520)};

  if (!started) return <main className="cover">
    <div className="cover-noise" />
    <div className="island-mark"><span /><i /></div>
    <section className="cover-copy">
      <p className="edition">雾港港镇 · 访客服务 / 旅客登录</p>
      <h1>雾港</h1>
      <p className="subtitle">一座被内湾与旧港围住的海岛小镇。客轮每日往返，海雾来时，航班会临时调整。</p>
      <div className="case-brief"><p>岛不大，从客运码头出发，步行可以到老街、归潮广场与北坡白塔。</p><ol><li><b>客运码头</b><span>游客进出岛的主要通道</span></li><li><b>老街</b><span>旅店、饭馆与杂货铺集中在这里</span></li><li><b>白塔</b><span>旧雾笛塔仍是岛上最醒目的航标</span></li></ol></div>
      <button className="primary" onClick={() => setStarted(true)}>登岛</button>
      <div className="rules"><span>客轮入岛</span><span>步行可达</span><small>夜间起雾，请留意港务站临时通知</small></div>
    </section>
    <aside className="opening-card"><b>我的登岛行程</b><time>6月16日 16:30</time><p>临海客运站　→　雾港客运码头<br/>乘船人：林岚　座位：12A</p><em>已核验</em></aside>
  </main>;

  if (ending) return <main className="ending">
    <p>TRUE ENDING · 名字归岸</p><h1>先救人，再让证据说话。</h1>
    <div className="ending-text"><p>郭宁关闭雾笛，吴启明交出第三代观察记录。你沿白塔检修道找到林琴，把救援位置、低潮时间和三套证据分别发给岛外警方、律师与媒体。</p><p>引水洞里的归潮号终于被找到。受害者姓名由家属确认，无辜受体的医疗隐私没有成为猎奇标题。</p><p>恢复工具只找回手术日期、供体年龄和档案尾号。TX-0817-12同时出现在一条正文缺页的民政死亡登记索引里。岛外警方调取纸本原卷后，最后一个名字才出现：<b>叶知潮，十二岁，死亡于2008年8月17日。</b>同一天，九岁的林岚接受急诊肝移植。你再打开微信，“潮”的会话不存在；系统从未记录过这个联系人。</p><p>他没有替你找到任何线索。他只是把你已经看见的东西，换个顺序放回去。</p><div className="post-record"><span>档案反查 / TX-0817-12</span><strong>叶知潮死亡登记　↔　林岚移植随访证明</strong><small>签发机构相距342公里，经办人却属于同一间潮生康养院。</small></div>{resolvedMysteries.length===SIDE_MYSTERIES.length?<div className="ending-archive"><span>SIDE ARCHIVE · 8/8</span><strong>所有旁证已经归档</strong><p>两个C17/04、十七件救生衣、沈砚失踪与2009年的火灾终于落在同一条时间线上。雾港留下的不再只是一个结论，而是一套可以被复核的完整记录。</p></div>:<div className="ending-archive incomplete"><span>SIDE ARCHIVE · {resolvedMysteries.length}/8</span><strong>仍有旁证没有闭合</strong><p>主线已经结束，但雾港的旧记录还没有全部归岸。你可以返回未解之谜，补完支线归档。</p><button onClick={()=>{setEnding(null);setArea("side")}}>返回补完未解之谜</button></div>}<p>监护设备停下后，空病房录到一句孩子的声音：“这次有人记得我们了。”房里没有音频设备。</p></div>
    <button className="primary" onClick={reset}>重新调查</button>
  </main>;

  return <main className="game-shell">
    {toast && <div className="toast">{toast}</div>}
    {!tutorialShown && introSeen && <TutorialOverlay dismiss={() => setTutorialShown(true)} />}
    {terrorActive && <div className="terror-prompt" role="dialog" aria-modal="true"><div className="terror-prompt-bg"/><div className="terror-prompt-card"><div className="terror-prompt-icon">!</div><p>{terrorInfo.text}</p><div className="terror-prompt-bar"><span style={{width:`${(terrorTime/5)*100}%`}}/></div><button className="terror-prompt-btn" onClick={()=>{if(terrorInfo.reward)acquireItem(terrorInfo.reward);setTerrorActive(false);setTerrorInfo({text:"",reward:""});setTerrorTime(0);}}>赶快逃！{terrorTime}s</button></div></div>}
    {collectionNotice && <div className={`collection-modal ${collectionNotice.source.includes("组合推演")?"deduction-achievement":""}`} role="dialog" aria-modal="true"><article>{collectionNotice.source.includes("组合推演")?<div className="achievement-mark"><i/><span>推演成立</span></div>:<div className="clue-mark">＋</div>}<small>{collectionNotice.source.includes("组合推演")?"新的材料关系已写入调查手记":`线索已收录 · ${CHAPTERS[collectionNotice.chapter-1].title}`}</small><h2>{collectionNotice.title}</h2><b>{collectionNotice.source}</b><p>{collectionNotice.text}</p><button onClick={()=>setCollectionNotice(null)}>{collectionNotice.source.includes("组合推演")?"查看新的推演":"我已查看"}</button></article></div>}
    {itemNotice && <div className="item-modal item-achievement" role="dialog" aria-modal="true"><article><div className="achievement-rays"/><small>道具获得 · 已加入调查清单</small><div className="item-icon">{itemNotice.title.slice(0,1)}</div><h2>{itemNotice.title}</h2><p>{itemNotice.text}</p><button onClick={()=>setItemNotice(null)}>记下并继续调查</button></article></div>}
    <header className="topbar">
      <button className="brand" onClick={() => openArea("phone")}>雾港来信 <small>调查记录 0616</small></button>
      <div className="chapter-tabs">{CHAPTERS.map(c => <button key={c.no} className={chapter === c.no ? "active" : ""} onClick={() => changeChapter(c.no)}><span>0{c.no}</span>{c.title}{c.no > unlocked && <i>锁</i>}</button>)}</div>
    </header>

    <section className="mission">
      <div><span>当前设备</span><b>{CHAPTERS[chapter - 1].device}</b></div>
      <div className="question"><span>本章调查问题</span><strong>{CHAPTERS[chapter - 1].question}</strong></div>
      <div className="chapter-progress"><b>{collected.length}</b><span>本章手记 · 谜 {resolvedMysteries.length}/{SIDE_MYSTERIES.filter(m=>m.chapter<=chapter).length}</span></div>
    </section>
    <div className="workspace">
      <nav className="rail">
        {([ ["phone","手机","机"], ["browser","档案搜索","搜"], ["map","岛内地图","图"], ["evidence","调查手记","证"], ["board","阶段结论","结"], ["side","未解之谜","谜"] ] as [Area,string,string][]).map(([id,label,icon]) => <button key={id} className={area === id ? "active" : ""} onClick={() => openArea(id)}><i>{icon}</i><span>{label}</span>{id === "evidence" && collected.length > 0 && <em>{collected.length}</em>}{id === "side" && SIDE_MYSTERIES.filter(m=>m.chapter<=chapter&&m.requires.every(r=>found.includes(r))).length>resolvedMysteries.length && <em className="rail-dot" />}</button>)}
      </nav>

      <section className="content" key={`${area}-${chapter}`}>
        {area === "phone" && (!introSeen?<PhoneLock unlocking={unlocking} lockTouch={lockTouch} setLockTouch={setLockTouch} unlockPhone={unlockPhone}/>:<Phone chapter={chapter} app={app} setApp={setApp} thread={thread} setThread={setThread} collect={collect} found={found} inventory={inventory} playing={playing} setPlaying={setPlaying} track={track} setTrack={setTrack} notify={notify} acquireItem={acquireItem} acceptedFriends={acceptedFriends} setAcceptedFriends={setAcceptedFriends} setTerrorActive={setTerrorActive} setTerrorInfo={setTerrorInfo} setTerrorTime={setTerrorTime} />)}
        {area === "browser" && <Browser query={query} setQuery={setQuery} results={results} article={article} setArticle={setArticle} collect={collect} found={found} chapter={chapter} />}
        {area === "map" && <MapPanel chapter={chapter} collect={collect} found={found} notify={notify} inventory={inventory} acquireItem={acquireItem} />}
        {area === "evidence" && <Evidence found={found} chapter={chapter} collect={collect} />}
        {area === "board" && <Board chapter={chapter} collected={collected} selected={selected} toggle={toggleEvidence} answer={answer} setAnswer={setAnswer} submit={submit} investigate={() => openArea("phone")} />}
        {area === "side" && <SideMysteries chapter={chapter} found={found} resolvedMysteries={resolvedMysteries} setResolvedMysteries={setResolvedMysteries} notify={notify} />}
      </section>
    </div>
  </main>;
}

function PhoneLock({unlocking,lockTouch,setLockTouch,unlockPhone}:{unlocking:boolean;lockTouch:number|null;setLockTouch:(value:number|null)=>void;unlockPhone:()=>void}){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1000);return()=>window.clearInterval(timer)},[]);
  const lockTime=now.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false});
  return <div className="phone-stage lock-stage"><div className={`phone lock-device ${unlocking?"unlocking":""}`}><div className="lock-wallpaper"><div className="lock-status"><span>{lockTime}</span><b>雾港 5G　▰</b></div><div className="lock-clock"><small>6月16日　星期二</small><strong>{lockTime}</strong><i>⌁</i></div><section className="lock-notice"><img src="/avatars/mom.webp" alt="妈妈"/><div><header><b>微信</b><time>6月14日</time></header><strong>妈妈</strong><p>到了 住潮生宾馆306 房间有点潮</p></div></section><section className="device-restored"><span>未接来电 · 潮生宾馆</span><p>林小姐，看到后请尽快回电话。</p></section><button className="unlock-handle" onClick={unlockPhone} onTouchStart={e=>{e.stopPropagation();setLockTouch(e.touches[0].clientY)}} onTouchEnd={e=>{e.stopPropagation();if(lockTouch!==null&&lockTouch-e.changedTouches[0].clientY>55)unlockPhone();setLockTouch(null)}} onTouchCancel={()=>setLockTouch(null)}><i>⌃</i><span>从这里向上滑动解锁</span></button></div></div><aside className="phone-caption"><b>林岚的手机</b><p>屏幕上停着一条两天前的微信，和一通刚刚打来的电话。</p></aside></div>
}

function Phone({ chapter, app, setApp, thread, setThread, collect, found, inventory, playing, setPlaying, track, setTrack, notify, acquireItem, acceptedFriends, setAcceptedFriends, setTerrorActive, setTerrorInfo, setTerrorTime }: any) {
  const chapterFound=CLUES.filter(c=>c.chapter===chapter&&found.includes(c.id)&&!c.source.includes("组合推演")).length;
  const threatUnlocked=chapterFound>=(chapter===1?3:chapter===2?3:2);
  const baseContacts=["潮","妈妈","潮生宾馆","陈放","蒋小蕊"];
  const chapterTwoContacts=["沈砚（旧号码）","许医生"];
  const chapterThreeContacts=["郭家健康群（导入备份）","爸爸（导入备份）","吴医生（导入备份）","陶小雨（导入备份）"];
  const chapterNewContacts=chapter===1?[]:chapter===2?chapterTwoContacts:[...chapterTwoContacts,...chapterThreeContacts];
  const pendingFriends=chapterNewContacts.filter((c:string)=>!acceptedFriends.includes(c)&&!c.includes("导入备份"));
  const acceptedThisChapter=acceptedFriends.filter((c:string)=>chapterNewContacts.includes(c));
  const autoImported=chapter>=3?chapterThreeContacts:[] as string[];
  const messages:Record<number,string[]>={1:[...baseContacts],2:[...baseContacts,...acceptedThisChapter,...autoImported],3:[...baseContacts,...acceptedThisChapter,...autoImported]};
  if(threatUnlocked)messages[chapter].unshift("陌生号码");
  const acceptFriend=(name:string)=>{setAcceptedFriends((value:string[])=>value.includes(name)?value:[...value,name]);notify(`你已添加了${name}，现在可以开始聊天了`);};
  const photos = ([1,2,3] as const).filter(no=>no<=chapter).flatMap(no=>PHOTO_SETS[no]) as Array<{title:string;caption:string;clue:string;src:string;meta:string;transcript?:string}>;
  const tracks = ["内湾晴天", "返程票", "二楼走廊", "夜船不开", "未命名录音"];
  const orders = [{name:"防潮相机袋",icon:"袋",status:"交易成功",detail:"深灰色 · 单肩防水款",price:"¥79.00",logistics:["6月9日 14:12 已签收","6月9日 09:30 到达雾港客运站","6月8日 18:05 临海转运中心发出"]},{name:"速溶咖啡 20条",icon:"咖",status:"交易成功",detail:"无糖黑咖啡 · 20条",price:"¥32.80",logistics:["6月11日 16:40 前台代收","6月11日 11:20 随客轮进岛"]},{name:"白色运动鞋",icon:"鞋",status:"交易成功",detail:"37码 · 米白色",price:"¥159.00",logistics:["5月28日 19:08 本人签收","5月28日 13:10 派送中"]},{name:"给妈妈的护膝",icon:"礼",status:"已签收",detail:"保暖护膝 · 深灰 · M码",price:"¥68.00",logistics:["6月13日 17:46 潮生宾馆前台代收","6月13日 16:55 到达老街配送点","6月12日 20:20 临海转运中心发出"]}];
  const fileSets:PhoneFile[][]=[[["客轮实名订单.pdf","林岚下载 · 仅有登岛票","ferry-list"],["工作船说明.txt","林岚下载 · 文件有缺损","workboat"]],[["1992_乙区值班表.pdf","旧机备份导入 · 4页","nurse"],["归潮号港务内参.pdf","旧机备份导入 · 公开版已删除","ship"],["2009_就诊备忘.txt","林琴旧机备份","qin-note"]],[["C组年度随访表.xlsx","郭宁备份导入","codes"],["冷链付款对账.pdf","本机缓存 · 文件有缺损","payments"],["今晚处置日程.ics","郭宁备份导入","rescue"],["雾笛反应日志.m4a","现场设备导入","fog-horn"],["林岚_儿童移植随访.pdf","本机打印缓存","lan-transplant"]]];
  const phoneFiles=fileSets.slice(0,chapter).flat();
  const recoveryItems = chapter===1 ? [
    {id:"workboat",name:"工作船说明.txt",method:"日志尾部被零字节覆盖，可用同目录校验记录重建。",result:"已恢复离泊时间、船员数与目的港回执字段。",clue:true},
    {id:"cache-weather",name:"天气页离线缓存",method:"网页缓存头损坏，正文分片仍在。",result:"恢复出6月16日16:00发布的能见度预警副本。",clue:false},
    {id:"thumb-306",name:"IMG_306 缩略图索引",method:"原图已不存在，只剩相册数据库里的缩略图。",result:"恢复一张306走廊缩略图，拍摄时间为17:12。",clue:false}
  ] : chapter===2 ? [
    {id:"ship",name:"归潮号港务内参.pdf",method:"网页副本已删除，但本机缓存保留六个不连续分片。",result:"恢复出核载人数、救生衣领用数与事故标题。",clue:true},
    {id:"shen-contact",name:"沈砚联系人残片.db",method:"通讯录条目已删除，号码备注区仍有残片。",result:"号码最后一次修改于2009年，备注只剩‘别用真名’。",clue:false},
    {id:"ward-index",name:"乙区扫描目录.idx",method:"目录页损坏，可按文件创建时间重排。",result:"四份扫描件来自不同医院，入库时间却在同一天。",clue:false}
  ] : [
    {id:"payments",name:"冷链付款对账.pdf",method:"导出索引损坏，可从临时缓存拼合三张付款表。",result:"三份文件的执行时间均恢复为6月17日03:17。",clue:true},
    {id:"lan-transplant",name:"林岚_儿童移植随访.pdf",method:"正文页被覆盖，打印缓存留有低清文本层。",result:"恢复手术日期与供体年龄，姓名仍被合法遮盖。",clue:true},
    {id:"camera-fragment",name:"B1监控缩略图缓存",method:"视频不存在，只剩设备生成的关键帧。",result:"关键帧显示一名背影进入旧港冷链B1层。",clue:false}
  ];
  const noteSets=[[{title:"去雾港前",date:"6月15日",text:"相机 充电线 雨衣\n先去宾馆 再去派出所\n妈妈记忆不太好 这事先别跟不相干的人说"},{title:"护膝订单",date:"6月12日",text:"M码 深灰\n别买太厚 她嫌热\n送到宾馆前台也行"},{title:"要问的",date:"6月14日",text:"为什么只有去程票\n陈放有没有见过她\n306的行李少了什么"}],[{title:"导入 · 如果又忘了",date:"2009年9月",text:"别先问名字\n先看年龄 衣服 转院章\n几类记录不能混在一起"},{title:"导入 · 乙区",date:"1992年8月",text:"十二张床\n夜班只签了一个姓周的\n第二页被抽走了"},{title:"导入 · 沈砚",date:"未保存",text:"这个名字不一定是真的\n他说名单是后来补的\n先查归潮号"}],[{title:"导入 · 不想继续体检",date:"6月15日",text:"爸爸说药 学校和出岛都靠家里\n可为什么保护一个人\n要把她做过的梦删掉"},{title:"导入 · 小雨",date:"6月16日",text:"C17/04\n又梦见没窗的走廊\n她说03:17会听见雾笛"},{title:"白塔",date:"今天",text:"东侧检修门\n低潮时开二十二分钟\n先把位置发出去"}]];
  const notes=noteSets.slice(0,chapter).flat();
  const [now, setNow] = useState(() => new Date());
  const [batteryLevel, setBatteryLevel] = useState(.78);
  const [charging, setCharging] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [wifiOn, setWifiOn] = useState(true);
  const [mobileOn, setMobileOn] = useState(true);
  const [airplaneOn, setAirplaneOn] = useState(false);
  const [brightness, setBrightness] = useState(82);
  const [volume, setVolume] = useState(38);
  const [focusOn,setFocusOn]=useState(false);
  const [torchOn,setTorchOn]=useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [photoOpen, setPhotoOpen] = useState<(typeof PHOTO_SETS)[1][number] | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [composer, setComposer] = useState<"replies"|"emoji"|"more"|null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [sentMessages, setSentMessages] = useState<Record<string,ChatLine[]>>({});
  const [typing, setTyping] = useState(false);
  const [wechatTab,setWechatTab]=useState<"chats"|"contacts"|"discover"|"me">("chats");
  const [wechatSub,setWechatSub]=useState("");
  const [wechatCall,setWechatCall]=useState<WechatCall|null>(null);
  const [phoneTab,setPhoneTab]=useState<"recents"|"contacts"|"keypad">("recents");
  const [dialNumber,setDialNumber]=useState("");
  const [activeCall,setActiveCall]=useState<SimCall|null>(null);
  const [selectedOrder,setSelectedOrder]=useState<(typeof orders)[number]|null>(null);
  const [selectedFile,setSelectedFile]=useState<PhoneFile|null>(null);
  const [selectedFolder,setSelectedFolder]=useState<string|null>(null);
  const fileFolders = [{name:"下载",icon:"↓",files:fileSets[0]},...(chapter>=2?[{name:"旧机备份",icon:"↩",files:fileSets[1]}]:[]),...(chapter>=3?[{name:"郭宁备份",icon:"📦",files:fileSets[2].slice(0,1).concat(fileSets[2].slice(2,3))},{name:"本机缓存",icon:"💾",files:[fileSets[2][2]].concat(fileSets[2].slice(4))},{name:"现场设备",icon:"🎤",files:[fileSets[2][3]]}]:[])];
  const [noteOpen,setNoteOpen]=useState<number|null>(null);
  const [weatherMode,setWeatherMode]=useState<"hourly"|"daily">("hourly");
  const [musicProgress,setMusicProgress]=useState(0);
  const [recovering,setRecovering]=useState("");
  const [recoveryProgress,setRecoveryProgress]=useState(0);
  const [recoveryOpen,setRecoveryOpen]=useState<string|null>(null);
  const [recoveredItems,setRecoveredItems]=useState<string[]>([]);
  const [recoveryInstalled,setRecoveryInstalled]=useState(false);
  const [installingRecovery,setInstallingRecovery]=useState(false);
  const [installProgress,setInstallProgress]=useState(0);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const [cameraStream,setCameraStream]=useState<MediaStream|null>(null);
  const [cameraFacing,setCameraFacing]=useState<"user"|"environment">("user");
  const [cameraShot,setCameraShot]=useState("");
  const [cameraError,setCameraError]=useState("");
  const [cameraGlitch,setCameraGlitch]=useState(false);
  const [calcInput,setCalcInput]=useState("0");
  const [calcSecret,setCalcSecret]=useState(false);
  const [amapQuery,setAmapQuery]=useState("雾港");
  const [torchStream,setTorchStream]=useState<MediaStream|null>(null);
  const [screenLight,setScreenLight]=useState(false);
  const conversationRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{try{setSentMessages(JSON.parse(localStorage.getItem("wugang-wechat-log")||"{}"))}catch{}},[]);
  useEffect(()=>{if(Object.keys(sentMessages).length)localStorage.setItem("wugang-wechat-log",JSON.stringify(sentMessages))},[sentMessages]);
  useEffect(()=>{if(!thread)return;const frame=window.requestAnimationFrame(()=>conversationRef.current?.scrollTo({top:conversationRef.current.scrollHeight,behavior:"smooth"}));return()=>window.cancelAnimationFrame(frame)},[thread,sentMessages,composer]);
  useEffect(()=>{try{setRecoveryInstalled(localStorage.getItem("wugang-tool-installed")==="1");setRecoveredItems(JSON.parse(localStorage.getItem(`wugang-recovered-${chapter}`)||"[]"))}catch{}},[]);
  useEffect(()=>{if(recoveryInstalled)localStorage.setItem("wugang-tool-installed","1")},[recoveryInstalled]);
  useEffect(()=>{if(recoveredItems.length)localStorage.setItem(`wugang-recovered-${chapter}`,JSON.stringify(recoveredItems))},[recoveredItems,chapter]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setMusicProgress(value=>value>=100?0:value+1),1200);return()=>window.clearInterval(timer)},[playing,track]);
  useEffect(()=>{if(!recovering)return;const target=recoveryItems.find(item=>item.id===recovering);const timer=window.setInterval(()=>setRecoveryProgress(value=>{if(value<88)return value+11;window.clearInterval(timer);window.setTimeout(()=>{setRecovering("");setRecoveryProgress(100);setRecoveredItems(items=>items.includes(target?.id||"")?items:[...items,target?.id||""]);if(target?.clue&&!found.includes(target.id))collect(target.id)},220);return 100}),180);return()=>window.clearInterval(timer)},[recovering]);
  useEffect(()=>{if(!installingRecovery)return;const timer=window.setInterval(()=>setInstallProgress(value=>{if(value<90)return value+10;window.clearInterval(timer);window.setTimeout(()=>{setInstallProgress(100);setInstallingRecovery(false);setRecoveryInstalled(true);notify("‘拾遗’已安装到桌面")},240);return 100}),120);return()=>window.clearInterval(timer)},[installingRecovery]);
  useEffect(()=>{if(!wechatCall||wechatCall.status!=="calling")return;const timer=window.setTimeout(()=>setWechatCall(value=>value?{...value,status:"unanswered"}:null),4200);return()=>window.clearTimeout(timer)},[wechatCall?.status,wechatCall?.name,wechatCall?.mode]);
  useEffect(()=>{if(!activeCall||activeCall.status!=="dialing")return;const timer=window.setTimeout(()=>setActiveCall(value=>value?{...value,status:value.reply.startsWith("您拨打")?"ended":"connected"}:null),1100);return()=>window.clearTimeout(timer)},[activeCall?.status,activeCall?.number]);
  useEffect(()=>{if(!activeCall||activeCall.status!=="connected")return;const timer=window.setInterval(()=>setActiveCall(value=>value?{...value,elapsed:value.elapsed+1}:null),1000);return()=>window.clearInterval(timer)},[activeCall?.status]);
  useEffect(()=>()=>cameraStream?.getTracks().forEach(track=>track.stop()),[cameraStream]);
  useEffect(() => {
    let active = true;
    let battery: any;
    let fallback: number | undefined;
    const updateBattery = () => { if (active && battery) { setBatteryLevel(battery.level); setCharging(battery.charging); } };
    const batteryNavigator = navigator as Navigator & { getBattery?: () => Promise<any> };
    if (batteryNavigator.getBattery) batteryNavigator.getBattery().then(value => {
      if (!active) return;
      battery = value; updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    });
    else fallback = window.setInterval(() => setBatteryLevel(value => Math.max(.12, value - .001)), 60000);
    return () => {
      active = false;
      if (fallback) window.clearInterval(fallback);
      battery?.removeEventListener("levelchange", updateBattery);
      battery?.removeEventListener("chargingchange", updateBattery);
    };
  }, []);
  const phoneTime = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const phoneDay = chapter===3?"6月17日周三":"6月16日周二";
  const signalLevel = airplaneOn || !mobileOn ? 0 : 2 + (now.getMinutes() % 3);
  const phoneContacts = chapter===1 ? [
    {name:"妈妈",number:"138 0616 2041"},{name:"潮生宾馆",number:"0580 761 0306"},{name:"陈放",number:"137 8804 1127"},{name:"雾港客运站",number:"0580 761 0120"}
  ] : chapter===2 ? [
    {name:"妈妈",number:"138 0616 2041"},{name:"陈放",number:"137 8804 1127"},{name:"许医生",number:"139 7730 0912"},{name:"沈砚（旧号码）",number:"136 5521 1992"},{name:"潮生宾馆",number:"0580 761 0306"}
  ] : [
    {name:"爸爸",number:"139 0616 1701"},{name:"吴医生",number:"138 3170 1702"},{name:"陶小雨",number:"137 3170 1704"},{name:"雾港客运站",number:"0580 761 0120"}
  ];
  const phoneReply=(name:string)=>name.includes("妈妈")?"您拨打的用户暂时无法接通，请稍后再拨。":name.includes("沈砚")?"您拨打的号码是空号。":name.includes("宾馆")?"潮生宾馆前台。您好，请问住客姓名和房号？":name.includes("客运站")?"您好，这里是雾港客运站。今晚班次以港务站现场公告为准。":name.includes("医生")?"我现在不方便接长电话，有事发微信。":name.includes("爸爸")?"喂？信号不好，你说慢一点。":"喂，我在。";
  const startPhoneCall=(number:string,name?:string)=>{
    const normalized=number.replace(/\s/g,"");
    const known=phoneContacts.find(item=>item.number.replace(/\s/g,"")===normalized);
    const callName=name||known?.name||normalized;
    setActiveCall({name:callName,number:known?.number||number,status:"dialing",elapsed:0,reply:known?phoneReply(callName):"您拨打的号码不存在，请查证后再拨。"});
  };
  const startWechatCall=(mode:"voice"|"video")=>{setComposer(null);setWechatCall({name:thread,mode,status:"calling"})};
  const callDuration=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const phoneApps = recoveryInstalled ? [...APPS,{id:"cracker" as AppId,icon:"解",name:"数据复原"}] : APPS;
  const dockIds:AppId[]=["phone","messages","camera","amap"];
  const gridApps=phoneApps.filter(a=>!dockIds.includes(a.id));
  const dockApps=phoneApps.filter(a=>dockIds.includes(a.id)).sort((a,b)=>dockIds.indexOf(a.id)-dockIds.indexOf(b.id));
  const appBadge=(id:AppId)=>(chapter===1&&id==="messages")||(chapter===2&&["files","photos"].includes(id))||(chapter===3&&["messages","files"].includes(id))||(id==="cracker"&&recoveryItems.some(item=>!found.includes(item.id)&&!recoveredItems.includes(item.id)));
  const selectedRecovery = selectedFile ? recoveryItems.find(item=>item.id===selectedFile[2]) : undefined;
  const transition = (update: () => void) => {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(update);
    else update();
  };
  const stopCamera=()=>{cameraStream?.getTracks().forEach(track=>track.stop());setCameraStream(null);setCameraGlitch(false)};
  const startCamera=async(facing:"user"|"environment"=cameraFacing)=>{
    try{stopCamera();setCameraError("");const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false});setCameraStream(stream);setCameraFacing(facing);window.setTimeout(()=>{if(videoRef.current)videoRef.current.srcObject=stream},0);if(chapter===3)window.setTimeout(()=>{setCameraGlitch(true);window.setTimeout(()=>setCameraGlitch(false),950)},2600)}catch{setCameraError("摄像头没有启用 可以在浏览器权限里重新允许")}
  };
  const captureCamera=()=>{const video=videoRef.current;if(!video||!video.videoWidth)return;const canvas=document.createElement("canvas");canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext("2d")?.drawImage(video,0,0);setCameraShot(canvas.toDataURL("image/jpeg",.86))};
  const toggleTorch=async()=>{if(torchOn){torchStream?.getTracks().forEach(track=>track.stop());setTorchStream(null);setScreenLight(false);setTorchOn(false);return}try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});const track=stream.getVideoTracks()[0];const capabilities=track.getCapabilities() as MediaTrackCapabilities&{torch?:boolean};if(capabilities.torch){await track.applyConstraints({advanced:[{torch:true} as MediaTrackConstraintSet]});setTorchStream(stream);setTorchOn(true)}else{stream.getTracks().forEach(item=>item.stop());setScreenLight(true);setTorchOn(true)}}catch{setScreenLight(true);setTorchOn(true)}};
  const pressCalc=(key:string)=>{if(key==="C"){setCalcInput("0");setCalcSecret(false);return}if(key==="="){if(calcInput==="999999"){setCalcSecret(true);return}const match=calcInput.match(/^(-?\d+(?:\.\d+)?)([+\-×÷])(-?\d+(?:\.\d+)?)$/);if(match){const a=Number(match[1]),b=Number(match[3]),op=match[2];setCalcInput(String(op==="+"?a+b:op==="-"?a-b:op==="×"?a*b:b===0?"错误":a/b))}return}setCalcInput(value=>value==="0"&&!".+-×÷".includes(key)?key:value+key)};
  const openApp = (next: AppId) => {
    if(next!=="camera")stopCamera();
    if(next!=="phone")setActiveCall(null);
    if (next === "weather" && chapter === 1 && !found.includes("weather")) collect("weather");
    transition(() => { setThread(""); setWechatSub(""); setSelectedOrder(null); setSelectedFile(null); setNoteOpen(null); setApp(next); });
  };
  const openThread = (name: string) => {
    const clue = chapter === 1 && name === "妈妈" ? "last-chat" : chapter === 2 && name === "沈砚（旧号码）" ? "twelve" : chapter === 3 && name.includes("郭家健康群") ? "family-group" : "";
    if (clue && !found.includes(clue)) collect(clue);
    transition(() => { setThread(name); setComposer(null); setVoiceMode(false); });
    if(chapter===3&&name==="陌生号码"&&!found.includes("ward-record")){
      window.setTimeout(()=>{
        setTerrorActive(true);
        setTerrorInfo({text:"手机屏幕突然闪烁了一下……\n好像有什么东西在窗外看着你。",reward:"ward-record"});
        setTerrorTime(5);
      },1800);
    }
    if(chapter===3&&name==="陶小雨"&&!found.includes("night-recording")){
      window.setTimeout(()=>{
        setTerrorActive(true);
        setTerrorInfo({text:"手机麦克风突然自动开启了。\n录音界面显示一段未保存的音频文件。\n时间戳：03:17",reward:"night-recording"});
        setTerrorTime(5);
      },2500);
    }
  };
  const chatKey=(name:string)=>["潮","妈妈","潮生宾馆","陈放","蒋小蕊"].includes(name)?`live:${name}`:`${chapter}:${name}`;
  const chatDayFor=(name:string)=>name.includes("导入备份")?"原设备记录":name==="妈妈"?"6月14日 周日":name==="潮"?phoneDay:"6月16日 周二";
  const appendMessage = (name:string,line:ChatLine) => setSentMessages(value => ({...value,[chatKey(name)]:[...(value[chatKey(name)]||[]),line]}));
  const tideAnswer=(question:string)=>{
    const chapterDeductions=DEDUCTIONS.filter(d=>d.chapter===chapter&&!found.includes(d.id));
    const ready=chapterDeductions.find(d=>d.requires.every(id=>found.includes(id)));
    const nearest=[...chapterDeductions].sort((a,b)=>a.requires.filter(id=>!found.includes(id)).length-b.requires.filter(id=>!found.includes(id)).length)[0];
    if(question==="我下一步查什么"){
      if(ready)return `先去调查手记 你手里的“${ready.source}”已经能做组合推演了`;
      if(chapter===1&&!found.includes("last-chat"))return "先开微信看妈妈最后一段聊天 确认她自己说过住哪";
      if(chapter===1&&!found.includes("hotel-log"))return "去岛内地图找潮生宾馆 前台核对身份拿房卡 再进306看门锁缓存";
      if(chapter===2&&!found.includes("twelve"))return "打开沈砚的旧号码 先收十二张启事 别急着查姓名";
      if(chapter===2&&!found.includes("ward"))return "去照片看四张转院单 重点看接收章";
      if(chapter===3&&!found.includes("payments"))return "文件里的冷链付款对账读不全 用数据复原把分片拼回来";
      if(chapter===3&&!found.includes("rescue"))return "去文件看今晚处置日程 或者直接去白塔查检修门";
      if(chapter===3&&!inventory.includes("maintenance-tag"))return "证据之外还得把路走通 去旧港冷链检查那辆无牌冷藏车";
      if(chapter===3&&!inventory.includes("bed-location"))return "检修挂牌能打开地下设备层 先确认LQ的床位和生命状态";
      if(chapter===3&&!inventory.includes("mirror-index"))return "去旧港监控室！先复制只读索引再拔线 远端能看到你 快";
      return nearest?`离“${nearest.title}”最近 还差：${nearest.requires.filter(id=>!found.includes(id)).map(id=>CLUES.find(c=>c.id===id)?.title).join("、")}`:"去调查手记看看已经完成的推演";
    }
    if(question==="哪些材料能放一起"){
      if(ready)return `现在就能组合：${ready.source}。进调查手记点“开始推演”`;
      return nearest?`先凑这组：${nearest.source}。还缺 ${nearest.requires.filter(id=>!found.includes(id)).map(id=>CLUES.find(c=>c.id===id)?.title).join("、")}`:"本章能组合的关系已经做完了";
    }
    if(question==="为什么结论过不了"){
      if(chapter===3&&!inventory.includes("maintenance-tag"))return "证据够了 但行动路线还没通 去旧港冷链看看那辆没挂牌的车";
      if(chapter===3&&!inventory.includes("bed-location"))return "先用检修挂牌进入地下层 确认LQ在哪张床 不能只靠日程猜";
      if(chapter===3&&!inventory.includes("mirror-index"))return "去旧港监控室复制只读索引 远端还在看着你 别直接拔线";
      return chapter===3?"最后一章只选一条已经成立的03:17相关推演 原始材料不用重复勾 然后判断先保全位置和救援窗口":"结论页只选一条已经成立的组合推演 原始材料不用再勾一次 再看看你的判断和这条推演是不是一回事";
    }
    return chapter===1?"第一章先证明她没有可靠离岛记录 编号的含义可以晚一点再追":"编号先当索引用 别把编号相同直接当成同一个人";
  };
  const askTide=(question:string)=>{
    appendMessage("潮",{side:"me",text:question});
    setTyping(true);
    window.setTimeout(()=>{
      setTyping(false);
      appendMessage("潮",{side:"them",text:tideAnswer(question)});
    },800+Math.random()*600);
  };
  const sendPreset = (text:string) => {
    appendMessage(thread,{side:"me",text}); setComposer(null);
    if(thread==="妈妈"){
      window.setTimeout(()=>appendMessage(thread,{side:"system",text:"消息未送达。对方设备可能已关机。"}),1500);
      return;
    }
    if(thread.includes("沈砚")){
      window.setTimeout(()=>appendMessage(thread,{side:"system",text:"消息发送失败。该账号当前无法接收消息。"}),1300);
      return;
    }
    const reply=autoReplyFor(chapter,thread,text);
    if(reply){
      const delay=800+Math.random()*800;
      setTyping(true);
      window.setTimeout(()=>{
        setTyping(false);
        appendMessage(thread,{side:"them",text:reply});
      },delay);
    }
  };
  const sendAttachment = (kind:string) => {
    const content = kind === "位置" ? "[位置] 雾港岛 · 归潮广场" : kind === "照片" ? "[照片] 白塔东侧检修门" : "[文件] 港务记录摘录.pdf";
    appendMessage(thread,{side:"me",text:content}); setComposer(null);
    const delay=600+Math.random()*600;
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      appendMessage(thread,{side:"them",text:kind === "位置" ? "收到了 别走东段 那边围栏刚换" : "收到了 我留原图"});
    }, delay);
  };
  const renderWechatSubpage=()=>{
    switch(wechatSub){
      case "朋友圈": return <><article><img src="/photos/venue-plaza.webp" alt="归潮广场" loading="lazy" decoding="async"/><b>蒋小蕊</b><p>广场电影又取消了 椅子全搬回仓库</p><small>陈放：这雨看着还得下</small></article><article><img src="/photos/venue-restaurant.webp" alt="望潮饭店" loading="lazy" decoding="async"/><b>陈放</b><p>休渔期菜单 别再问有没有刚上岸的😂</p></article></>;
      case "新的朋友": return <div className="new-friends-page">{pendingFriends.length?pendingFriends.map((name:string)=><div key={name} className="friend-request"><img src={avatarFor(name)} alt="" loading="lazy" decoding="async"/><div><b>{name}</b><small>请求添加你为朋友</small></div><button className="friend-accept" onClick={()=>acceptFriend(name)}>接受</button></div>):<div className="wechat-empty"><b>新的朋友</b><p>暂无新的朋友请求</p></div>}</div>;
      case "扫一扫": return <div className="scan-page"><i>⌗</i><p>将二维码放入框内自动扫描</p><button onClick={()=>setWechatSub("扫描结果")}>从相册选择门卡背面</button></div>;
      case "扫描结果": return <div className="wechat-article"><small>扫描结果</small><h3>潮生宾馆住客无线网</h3><p>网络：CHAOSHENG_GUEST</p><p>有效期：退房当日12:00</p><p>二维码下方印着前台电话和消防疏散图编号，并没有调查提示。</p></div>;
      case "看一看": return <div className="look-page"><button onClick={()=>setWechatSub("末班船复核")}><b>雾港今晚末班船待复核</b><span>港务站 · 18分钟前</span></button><button onClick={()=>setWechatSub("白塔封闭")}><b>白塔东段继续封闭</b><span>市政提醒 · 昨天</span></button></div>;
      case "末班船复核": return <div className="wechat-article"><img src="/photos/wugang-map-rain.webp" alt="雨后雾港客运码头" loading="lazy" decoding="async"/><small>今日雾港</small><h3>20:10末班船仍待能见度复核</h3><p>港务站将在18:30再次测量航道能见度。此前售出的船票可以改签，但系统不会自动生成返程订单。</p><p>工作船不使用客运闸机，船员和临时乘员另记纸质名册。</p></div>;
      case "白塔封闭": return <div className="wechat-article"><img src="/photos/lighthouse-door.webp" alt="白塔检修门" loading="lazy" decoding="async"/><small>雾港市政</small><h3>白塔东段检修步道继续封闭</h3><p>封闭范围只到地面步道。夜间设备运输由旧港冷链入口进出，不经过游客入口。</p></div>;
      case "设置": return <div className="setting-page"><label>消息通知<input type="checkbox" defaultChecked/></label><label>听筒模式<input type="checkbox"/></label><button onClick={()=>setWechatSub("聊天记录")}>聊天记录</button></div>;
      case "聊天记录": return <div className="wechat-article"><h3>聊天记录</h3><p>本机记录已恢复至6月16日12:46</p><p>语音与图片原件保存在设备内，不会自动上传。</p><button onClick={()=>setWechatSub("设置")}>返回设置</button></div>;
      default: return <div className="wechat-empty"><b>{wechatSub}</b><p>{wechatSub==="文件"?"最近文件会按会话来源保存在这里。":wechatSub==="群聊"?"当前设备里没有置顶群聊。":"没有新的内容"}</p></div>;
    }
  };
  const back = () => transition(() => { stopCamera();setThread(""); setComposer(null); setWechatSub(""); setWechatCall(null); setActiveCall(null); setSelectedOrder(null); setSelectedFile(null); setNoteOpen(null); setApp("home"); });
  return <div className="phone-stage"><div className={`phone phone-${chapter}`} onTouchStart={event => {
    const y = event.touches[0].clientY;
    const fromStatusBar = (event.target as HTMLElement).closest(".phone-status");
    setTouchStart(fromStatusBar ? y : null);
  }} onTouchEnd={event => {
    if (touchStart !== null && event.changedTouches[0].clientY - touchStart > 46) setControlOpen(true);
    setTouchStart(null);
  }} onTouchCancel={() => setTouchStart(null)}>
    <button className="phone-status" onClick={() => setControlOpen(true)} aria-label="打开控制中心"><span>{phoneTime}</span><b><i className="signal-bars">{[1,2,3,4].map(level => <span key={level} className={level <= signalLevel ? "on" : ""} />)}</i><i className={`wifi ${wifiOn && !airplaneOn ? "on" : ""}`}>⌁</i><i className={`battery ${charging ? "charging" : ""}`}><span style={{width:`${Math.round(batteryLevel * 100)}%`}} /></i></b></button>
    <div className={`control-center ${controlOpen ? "open" : ""}`} aria-hidden={!controlOpen}>
      <button className="control-dismiss" onClick={() => setControlOpen(false)} aria-label="关闭控制中心" />
      <div className="control-panel">
        <div className="control-top"><b>{phoneTime}</b><span>{Math.round(batteryLevel * 100)}% {charging ? "· 正在充电" : ""}</span></div>
        <div className="control-toggles">
          <button className={airplaneOn ? "active orange" : ""} onClick={() => setAirplaneOn(value => !value)}><i>✈</i><span>飞行模式</span></button>
          <button className={mobileOn && !airplaneOn ? "active green" : ""} onClick={() => setMobileOn(value => !value)}><i>蜂</i><span>蜂窝网络</span></button>
          <button className={wifiOn && !airplaneOn ? "active blue" : ""} onClick={() => setWifiOn(value => !value)}><i>⌁</i><span>无线局域网</span></button>
          <button className={focusOn?"active purple":""} onClick={()=>setFocusOn(value=>!value)}><i>月</i><span>{focusOn?"专注模式已开":"专注模式"}</span></button>
        </div>
        <label className="control-slider"><span>☀</span><input type="range" min="15" max="100" value={brightness} onChange={event => setBrightness(Number(event.target.value))}/></label>
        <label className="control-slider"><span>声</span><input type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))}/></label>
        <div className="control-bottom"><button className={torchOn?"active":""} onClick={toggleTorch}>灯</button><button onClick={() => notify("计时器 00:00:00")}>计</button><button onClick={() => {setControlOpen(false);openApp("calculator")}}>算</button><button onClick={() => openApp("camera")}>相</button></div>
        <button className="control-handle" onClick={() => setControlOpen(false)} aria-label="收起控制中心" />
      </div>
    </div>
    {app === "home" && <div className="phone-home">
      <div className="phone-date"><b>{phoneTime}</b><span>{phoneDay} · {chapter === 1 ? "阵雨" : "雾"}</span></div>
      <div className="app-grid">{gridApps.map(a => {const i=APPS.findIndex(item=>item.id===a.id);return <button key={a.id} onClick={() => openApp(a.id)}><i className={`app-icon app-${a.id} ai-${i}`}>{a.icon}</i><span>{a.name}</span>{appBadge(a.id)&&<em />}</button>})}</div>
      <nav className="phone-dock" aria-label="常用应用">{dockApps.map(a=>{const i=APPS.findIndex(item=>item.id===a.id);return <button key={a.id} onClick={()=>openApp(a.id)} aria-label={a.name}><i className={`app-icon app-${a.id} ai-${i}`}>{a.icon}</i>{appBadge(a.id)&&<em />}</button>})}</nav>
    </div>}
    {app === "messages" && <div className="phone-page message-page">
      {!thread ? <><PhoneHead title={wechatSub||({chats:"微信",contacts:"通讯录",discover:"发现",me:"我"} as any)[wechatTab]} back={wechatSub?()=>setWechatSub(""):back} backLabel={wechatSub?"发现":"桌面"} /><div className="wechat-section">
        {!wechatSub&&wechatTab==="chats"&&<div className="thread-list">{[...messages[chapter]].sort((a,b)=>a==="潮"?-1:b==="潮"?1:0).map((m:string) => <button key={m} className={m==="潮"?"tide-pinned":""} onClick={() => openThread(m)}><img className="thread-avatar" src={avatarFor(m)} alt=""/><span><strong>{m}{m==="潮"&&<i className="tide-badge">顾问</i>}</strong><small>{m.includes("妈妈") ? "到了，住潮生宾馆306……" : m === "潮" ? "我把你说的重新排了下。调查中卡住了可以随时问我。" : conversationFor(chapter,m).at(-1)?.text}</small></span><time>{m === "潮" ? phoneTime : "昨天"}</time></button>)}</div>}
        {!wechatSub&&wechatTab==="contacts"&&<div className="contact-list"><div className="contact-tools"><button onClick={()=>setWechatSub("新的朋友")}>＋<span>新的朋友</span></button><button onClick={()=>setWechatSub("群聊")}>群<span>群聊</span></button></div><p>联系人</p>{messages[chapter].map((m:string)=><button key={m} onClick={()=>openThread(m)}><img src={avatarFor(m)} alt=""/><span>{m}</span></button>)}</div>}
        {!wechatSub&&wechatTab==="discover"&&<div className="wechat-menu"><button onClick={()=>setWechatSub("朋友圈")}><i>◎</i><span>朋友圈</span><b>›</b></button><button onClick={()=>setWechatSub("扫一扫")}><i>⌗</i><span>扫一扫</span><b>›</b></button><button onClick={()=>setWechatSub("看一看")}><i>看</i><span>看一看</span><b>›</b></button></div>}
        {!wechatSub&&wechatTab==="me"&&<div className="wechat-me"><header><img src="/avatars/lin-lan.webp" alt="林岚"/><div><b>林岚</b><span>微信号：lan_0616</span></div></header><div className="wechat-menu"><button onClick={()=>setWechatSub("收藏")}><i>☆</i><span>收藏</span><b>›</b></button><button onClick={()=>setWechatSub("文件")}><i>文</i><span>文件</span><b>›</b></button><button onClick={()=>setWechatSub("设置")}><i>⚙</i><span>设置</span><b>›</b></button></div></div>}
        {wechatSub&&<div className="wechat-subpage">{renderWechatSubpage()}</div>}
      </div><nav className="wechat-tabs">{([['chats','微信','◉'],['contacts','通讯录','♟'],['discover','发现','◎'],['me','我','●']] as const).map(([id,label,icon])=><button key={id} className={wechatTab===id?"active":""} onClick={()=>{setWechatTab(id);setWechatSub("");}}><i>{icon}</i><span>{label}</span>{id==="contacts"&&pendingFriends.length>0&&<em className="contact-badge">{pendingFriends.length}</em>}</button>)}</nav></> : <><PhoneHead title={thread} back={() => transition(() => setThread(""))} backLabel="微信" actions={!thread.includes("导入备份")&&<div className="wechat-call-actions"><button onClick={()=>startWechatCall("voice")} aria-label="发起语音通话">☎</button><button onClick={()=>startWechatCall("video")} aria-label="发起视频通话">🎥</button></div>} />
      {thread.includes("导入备份")&&<div className="imported-chat-label">从郭宁设备备份导入 · 只读记录</div>}
      <div className="conversation" ref={conversationRef}><div className="chat-day">{chatDayFor(thread)}</div>{[...conversationFor(chapter, thread),...(sentMessages[chatKey(thread)]||[])].map((line, index) => {const bubbleClass=`bubble ${line.side}${line.terror?" chat-terror":""}${line.redText?" chat-red-text":""}`;return line.side === "system" ? <time className="system-note" key={index}>{line.text}</time> : <div className={`chat-row ${line.side}`} key={index}>{line.side === "them" && <img src={avatarFor(thread)} alt="" loading="lazy" decoding="async"/>}{line.text.startsWith("[监控照片]")?<figure className="chat-surveillance"><img src="/photos/surveillance-room.webp" alt="旧港监控截图中林岚的背影" loading="lazy" decoding="async"/><figcaption>{line.text.replace("[监控照片]","")}</figcaption></figure>:<p className={bubbleClass}>{line.text}</p>}{line.side === "me" && <img src={thread.includes("导入备份")?"/photos/family-dinner.webp":"/avatars/lin-lan.webp"} alt="" loading="lazy" decoding="async"/>}</div>})}{typing&&<div className="chat-row them typing-row"><img src={avatarFor(thread)} alt="" loading="lazy" decoding="async"/><p className="bubble typing-bubble"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></p></div>}</div>
      {thread==="潮"&&!composer&&<section className="tide-qa"><header><img src="/avatars/tide.webp" alt=""/><div><b>问潮</b><span>卡住了就直接问 不影响结局</span></div></header><div>{["我下一步查什么","哪些材料能放一起","为什么结论过不了","编号该怎么理解"].map(question=><button key={question} onClick={()=>askTide(question)}>{question}</button>)}</div></section>}
      {composer === "replies" && <div className="composer-sheet reply-sheet"><header><b>选择一句回复</b><button onClick={()=>setComposer(null)}>关闭</button></header>{replyChoicesFor(chapter,thread).map(text=><button key={text} onClick={()=>sendPreset(text)}>{text}<span>发送</span></button>)}</div>}
      {composer === "emoji" && <div className="composer-sheet emoji-sheet"><header><b>表情</b><button onClick={()=>setComposer(null)}>关闭</button></header><div>{["🙂","😟","👌","🙏","❓","🌫️","📍","⚠️"].map(icon=><button key={icon} onClick={()=>sendPreset(icon)}>{icon}</button>)}</div></div>}
      {composer === "more" && <div className="composer-sheet more-sheet"><header><b>更多</b><button onClick={()=>setComposer(null)}>关闭</button></header><div>{["照片","位置","文件"].map((kind,i)=><button key={kind} onClick={()=>sendAttachment(kind)}><i>{["▧","⌖","文"][i]}</i><span>{kind}</span></button>)}</div></div>}
      {!thread.includes("导入备份")&&<div className="wechat-input"><button className={voiceMode?"active":""} onClick={()=>{setVoiceMode(value=>!value);setComposer(null);}} aria-label="切换语音输入">◉</button><button className="composer-field" onClick={()=>voiceMode?sendPreset("[语音] 3″"):setComposer(composer==="replies"?null:"replies")}>{voiceMode?"按住说话":"发消息"}</button><button onClick={()=>setComposer(composer==="emoji"?null:"emoji")} aria-label="打开表情">☺</button><button onClick={()=>setComposer(composer==="more"?null:"more")} aria-label="打开更多">＋</button></div>}</>}
      {wechatCall&&<div className={`wechat-call-screen ${wechatCall.mode}`} role="dialog" aria-modal="true"><div className="wechat-call-bg" style={{backgroundImage:`url(${avatarFor(wechatCall.name)})`}}/><header><img src={avatarFor(wechatCall.name)} alt=""/><h3>{wechatCall.name}</h3><p>{wechatCall.status==="calling"?(wechatCall.mode==="video"?"正在等待对方接受邀请…":"正在呼叫…"):"对方无应答"}</p></header>{wechatCall.mode==="video"&&<div className="video-self-preview"><span>你的画面</span></div>}<footer><button><i>麦</i><span>静音</span></button><button className="hangup" onClick={()=>setWechatCall(null)}><i>☎</i><span>{wechatCall.status==="unanswered"?"关闭":"挂断"}</span></button><button><i>扬</i><span>免提</span></button></footer></div>}
    </div>}
    {app === "phone" && <div className="phone-page system-phone-page"><PhoneHead title="电话" back={back}/>{activeCall?<div className={`system-call-screen ${activeCall.status}`}><small>{activeCall.status==="dialing"?"正在呼叫…":activeCall.status==="connected"?callDuration(activeCall.elapsed):"无法接通"}</small><h2>{activeCall.name}</h2><p>{activeCall.number}</p>{activeCall.status!=="dialing"&&<blockquote>{activeCall.reply}</blockquote>}<div className="call-controls"><button><i>静</i><span>静音</span></button><button><i>键</i><span>键盘</span></button><button><i>扬</i><span>免提</span></button></div><button className="system-hangup" onClick={()=>setActiveCall(null)} aria-label="挂断电话">☎</button></div>:<><div className="phone-tab-content">{phoneTab==="recents"&&<div className="call-list"><h3>最近通话</h3>{phoneContacts.slice(0,3).map((item,index)=><button key={item.number} onClick={()=>startPhoneCall(item.number,item.name)}><i className={index===0?"missed":""}>↗</i><span><b>{item.name}</b><small>{index===0?"未接来电":"呼出电话"} · {index===0?"今天":"昨天"}</small></span><em>ⓘ</em></button>)}</div>}{phoneTab==="contacts"&&<div className="call-list contacts"><h3>通讯录</h3>{phoneContacts.map(item=><button key={item.number} onClick={()=>startPhoneCall(item.number,item.name)}><span><b>{item.name}</b><small>{item.number}</small></span><em>☎</em></button>)}</div>}{phoneTab==="keypad"&&<div className="dialer"><output>{dialNumber||"输入号码"}</output><div>{["1","2","3","4","5","6","7","8","9","*","0","#"].map(key=><button key={key} onClick={()=>setDialNumber(value=>(value+key).slice(0,14))}>{key}</button>)}</div><footer><button className="dial-call" disabled={!dialNumber} onClick={()=>startPhoneCall(dialNumber)}>☎</button><button className="dial-delete" onClick={()=>setDialNumber(value=>value.slice(0,-1))}>⌫</button></footer></div>}</div><nav className="phone-tabs">{([['recents','最近通话','时'],['contacts','通讯录','人'],['keypad','拨号键盘','键']] as const).map(([id,label,icon])=><button key={id} className={phoneTab===id?"active":""} onClick={()=>setPhoneTab(id)}><i>{icon}</i><span>{label}</span></button>)}</nav></>}</div>}
    {app === "photos" && <div className="phone-page"><PhoneHead title="照片" back={back}/><div className="photo-grid">{photos.map(photo => <button key={photo.title} onClick={() => { setPhotoOpen(photo as any); setTranscriptOpen(false); if (photo.clue && !found.includes(photo.clue)) collect(photo.clue); }}><img src={photo.src} alt={photo.title} loading="lazy" decoding="async"/><b>{photo.title}</b><span>{photo.caption}</span>{photo.clue && found.includes(photo.clue) && <em>已收录</em>}</button>)}</div>{photoOpen && <div className="photo-viewer"><button className="photo-close" onClick={() => { setPhotoOpen(null); setTranscriptOpen(false); }}>关闭</button><button className="photo-image-button" onClick={() => setTranscriptOpen(true)}><img src={photoOpen.src} alt={photoOpen.title} decoding="async"/><span>点击查看文字内容</span></button><div><b>{photoOpen.title}</b><p>{photoOpen.caption}</p><small>{photoOpen.meta}</small></div>{transcriptOpen && <div className="transcript-modal" role="dialog" aria-modal="true"><article><small>照片文字抄录</small><h3>{photoOpen.title}</h3><p>{photoOpen.transcript || `${photoOpen.caption}\n${photoOpen.meta}`}</p><button onClick={() => setTranscriptOpen(false)}>关闭文字内容</button></article></div>}</div>}</div>}
    {app === "files" && <div className="phone-page"><PhoneHead title={selectedFile?String(selectedFile[0]):selectedFolder?selectedFolder:"文件"} back={selectedFile?()=>setSelectedFile(null):selectedFolder?()=>setSelectedFolder(null):back} backLabel={selectedFile?"文件":selectedFolder?"文件":"桌面"}/>{selectedFile?<article className="file-detail"><i>文</i><h3>{selectedFile[0]}</h3><small>{selectedFile[1]}</small>{selectedRecovery&&!found.includes(selectedRecovery.id)?<div className="corrupt-file"><b>无法完整读取</b><p>文件正文出现连续空白块，修改时间与缓存索引不一致。</p><small>{recoveryInstalled?"已安装的数据复原可以检查这份文件。":"本机没有能处理残留分片的工具，可去 App Store 搜索‘数据恢复’。"}</small><button onClick={()=>{setSelectedFile(null);setApp(recoveryInstalled?"cracker":"appstore")}}>{recoveryInstalled?"用数据复原打开":"去 App Store 搜索"}</button></div>:<><p>{CLUES.find(c=>c.id===selectedFile[2])?.text}</p><div><span>来源</span><b>{CLUES.find(c=>c.id===selectedFile[2])?.source}</b></div></>}<button onClick={()=>setSelectedFile(null)}>返回</button></article>:selectedFolder?<div className="file-list">{phoneFiles.filter(f=>fileFolders.find(fo=>fo.name===selectedFolder)?.files.includes(f)).map(f => {const damaged=recoveryItems.some(item=>item.id===f[2])&&!found.includes(f[2]);return <button key={f[0]} onClick={() => {setSelectedFile(f);if(!recoveryItems.some(item=>item.id===f[2])&&!found.includes(f[2]))collect(f[2]);}}><i>文</i><span><b>{f[0]}</b><small>{damaged?"读取异常 · 文件可能损坏":f[1]}</small></span><em>{found.includes(f[2]) ? "✓" : "打开"}</em></button>})}</div>:<div className="file-folder-list">{fileFolders.map(fo=><button key={fo.name} onClick={()=>setSelectedFolder(fo.name)}><i>{fo.icon}</i><span><b>{fo.name}</b><small>{fo.files.length} 个文件</small></span><em>›</em></button>)}</div>}</div>}
    {app === "notes" && <div className="phone-page"><PhoneHead title={noteOpen!==null?notes[noteOpen].title:"备忘录"} back={noteOpen!==null?()=>setNoteOpen(null):back} backLabel={noteOpen!==null?"备忘录":"桌面"}/>{noteOpen!==null?<article className="note-paper note-detail"><small>{notes[noteOpen].date}</small><h3>{notes[noteOpen].title}</h3><p>{notes[noteOpen].text}</p></article>:<div className="note-list">{notes.map((note,i)=><button key={note.title} onClick={()=>{setNoteOpen(i);if(note.title.includes("如果又忘了")&&!found.includes("qin-note"))collect("qin-note");}}><b>{note.title}</b><p>{note.text.split("\n")[0]}</p><time>{note.date}</time></button>)}</div>}</div>}
    {app === "shopping" && <div className="phone-page lifestyle taobao-page"><PhoneHead title={selectedOrder?"订单详情":"手机淘宝"} back={selectedOrder?()=>setSelectedOrder(null):back} backLabel={selectedOrder?"我的订单":"桌面"}/>{selectedOrder?<article className="order-detail"><header><i>{selectedOrder.icon}</i><div><h3>{selectedOrder.name}</h3><p>{selectedOrder.detail}</p></div></header><strong>{selectedOrder.price}</strong><section><b>物流信息</b>{selectedOrder.logistics.map((line,i)=><p key={line} className={i===0?"current":""}>{line}</p>)}</section><footer>收货人：林岚　尾号0616</footer></article>:<><input placeholder="搜索淘宝商品"/><h3>我的订单</h3>{orders.map(order=><button key={order.name} onClick={()=>setSelectedOrder(order)}><i>{order.icon}</i><span><b>{order.name}</b><small>{order.status} · 查看物流</small></span></button>)}</>}</div>}
    {app === "music" && <div className="phone-page lifestyle"><PhoneHead title="泊声音乐" back={back}/><div className="album"><i>泊</i><div><b>{tracks[track]}</b><span>林岚的通勤收藏</span><input aria-label="播放进度" type="range" min="0" max="100" value={musicProgress} onChange={e=>setMusicProgress(Number(e.target.value))}/></div><button onClick={()=>setPlaying(!playing)}>{playing?"暂停":"播放"}</button></div>{tracks.map((t,i)=><button className={track===i?"playing":""} key={t} onClick={()=>{setTrack(i);setMusicProgress(0);setPlaying(true)}}><span>{String(i+1).padStart(2,"0")}</span><b>{t}</b><small>{2+i}:1{i}</small></button>)}</div>}
    {app === "weather" && <div className="phone-page"><PhoneHead title="天气" back={back}/><div className={`weather-card weather-${chapter}`}><b>雾港岛</b><strong>{chapter===1?"19°":chapter===2?"17°":"16°"}</strong><p>{chapter===1?"阵雨转平流雾":chapter===2?"海雾回流 风弱":"浓雾 低潮"}</p><nav><button className={weatherMode==="hourly"?"active":""} onClick={()=>setWeatherMode("hourly")}>逐小时</button><button className={weatherMode==="daily"?"active":""} onClick={()=>setWeatherMode("daily")}>十日天气</button></nav>{weatherMode==="hourly"?<ul>{(chapter===1?["16:00　阵雨停 19°","18:30　能见度复核 18°","20:10　末班船待定 17°"]:chapter===2?["21:00　低云 18°","23:00　海雾回流 17°","02:00　能见度下降 16°"]:["02:00　浓雾 16°","03:17　低潮 15°","04:00　能见度不足百米 15°"]).map(x=><li key={x}>{x}</li>)}</ul>:<ul>{["今天　雨 / 雾","明天　阴","周五　阵雨","周六　多云"].map(x=><li key={x}>{x}</li>)}</ul>}</div></div>}
    {app === "appstore" && <div className="phone-page app-store-page"><PhoneHead title="App Store" back={back}/><header><small>App 与游戏</small><h2>实用工具</h2></header><div className="store-search">⌕　搜索 App</div><article><i className="store-weather">云</i><div><b>岛屿天气</b><span>天气 · 本地预警</span><small>逐小时降雨、海雾与客轮天气提醒。</small></div><button onClick={()=>setApp("weather")}>打开</button></article><article><i className="store-scan">扫</i><div><b>简扫</b><span>效率 · 文档扫描</span><small>调用相机拍摄纸张，支持离线文字查看。</small></div><button onClick={()=>setApp("camera")}>打开</button></article><article className={installingRecovery?"installing":recoveryInstalled?"installed":""}><i>拾</i><div><b>拾遗 · 本地数据复原</b><span>工具 · 仅扫描本机文件</span><small>重建仍留在设备上的缓存与索引，不恢复正确遮盖的内容。</small></div><button className="store-install" disabled={installingRecovery} onClick={()=>recoveryInstalled?setApp("cracker"):(setInstallProgress(0),setInstallingRecovery(true))}>{installingRecovery?<i className="install-ring" style={{background:`conic-gradient(#1875d1 ${installProgress*3.6}deg,#d8d9dc 0)`}}><span/></i>:recoveryInstalled?"打开":"获取"}</button></article><article><i className="store-tide">汐</i><div><b>潮汐表</b><span>天气 · 海事数据</span><small>近岸潮位预报与日出日落时间。</small></div><button onClick={()=>setApp("weather")}>打开</button></article>{installingRecovery&&<div className="install-status"><span style={{width:`${installProgress}%`}}/><b>正在下载并验证… {installProgress}%</b></div>}{recoveryInstalled&&<div className="install-complete"><i>✓</i><span>安装完成，应用已经出现在桌面</span></div>}<section><h3>隐私说明</h3><p>安装前请核对工具申请的权限。本地处理不等于能够恢复彻底删除或依法遮盖的信息。</p></section></div>}
    {app === "cracker" && <div className="phone-page recovery-app"><PhoneHead title="数据复原" back={back}/><header><i>拾</i><div><b>本机扫描完成</b><span>按文件逐项检查可恢复内容</span></div></header><div className="recovery-list">{recoveryItems.filter(item=>found.includes(item.id)||recoveredItems.includes(item.id)).length>0?recoveryItems.filter(item=>found.includes(item.id)||recoveredItems.includes(item.id)).map(item=>{const done=found.includes(item.id)||recoveredItems.includes(item.id);const active=recovering===item.id;return <article key={item.id} className={done?"done":""}><small>{item.clue?"文件残片":"缓存残片"}</small><h3>{item.name}</h3><p>{done?item.result:item.method}</p><div className="recovery-track"><span style={{width:`${done?100:active?recoveryProgress:0}%`}}/></div><em>{done?(item.clue?"恢复完成 · 已收录到调查手记":"恢复完成 · 仅保存在工具内"):active?`正在重建 ${recoveryProgress}%`:"可尝试恢复"}</em><button disabled={Boolean(recovering)} onClick={()=>done?setRecoveryOpen(item.id):(setRecoveryProgress(0),setRecovering(item.id))}>{done?"查看恢复内容":"开始复原"}</button></article>}):<div className="recovery-empty"><b>没有可恢复的文件</b><p>先在本机文件系统中找到损坏或无法读取的文件，再回到这里尝试恢复。</p></div>}</div><p className="recovery-rule">恢复结果只是原始材料。工具保留原文件名、来源路径与缺损位置，不替你作判断。</p>{recoveryOpen&&(()=>{const item=recoveryItems.find(entry=>entry.id===recoveryOpen);return item?<div className="recovery-view" role="dialog" aria-modal="true"><article><small>只读恢复副本</small><h3>{item.name}</h3><p>{item.result}</p><dl><dt>复原方法</dt><dd>{item.method}</dd><dt>完整性</dt><dd>{item.clue?"可读字段已写入调查手记；缺损字段保持空白。":"仅恢复缓存信息，不作为独立结论材料。"}</dd></dl><button onClick={()=>setRecoveryOpen(null)}>关闭</button></article></div>:null})()}</div>}
    {app === "camera" && <div className="phone-page camera-app"><PhoneHead title="相机" back={back}/><div className={`camera-preview ${cameraGlitch?"glitch":""}`}>{cameraStream?<video ref={videoRef} autoPlay playsInline muted/>:<div className="camera-permission"><i>相</i><p>启用后会调用你的摄像头<br/>画面只在当前页面处理</p><button onClick={()=>startCamera("user")}>启用前置摄像头</button>{cameraError&&<small>{cameraError}</small>}</div>}{cameraGlitch&&<div className="focus-anomaly"><i/><span>正在重新对焦</span></div>}</div>{cameraStream&&<div className="camera-controls"><button onClick={()=>startCamera(cameraFacing==="user"?"environment":"user")}>切换</button><button className="shutter" aria-label="拍照" onClick={captureCamera}/><button onClick={()=>{stopCamera();setCameraShot("")}}>关闭</button></div>}{cameraShot&&<div className="camera-shot" role="dialog"><img src={cameraShot} alt="刚拍摄的照片"/><button onClick={()=>setCameraShot("")}>继续拍摄</button></div>}</div>}
    {app === "amap" && <div className="phone-page amap-app"><PhoneHead title="高德地图" back={back}/><div className="amap-search"><input value={amapQuery} onChange={e=>setAmapQuery(e.target.value)} placeholder="搜索地点"/><button onClick={()=>window.open(`https://uri.amap.com/search?keyword=${encodeURIComponent(amapQuery)}`,"_blank","noopener,noreferrer")}>搜索</button></div><section><div className="amap-pin">⌖</div><small>搜索建议</small><h3>雾港</h3><p>未找到可验证的公开地点</p><article><b>设备离线记录</b><span>雾港岛 · 最近访问</span><em>{chapter===3?"定位曾短暂下沉至白塔下方12米":"离线地图由设备持有人保存"}</em></article><button onClick={()=>window.open(`https://uri.amap.com/search?keyword=${encodeURIComponent(amapQuery)}`,"_blank","noopener,noreferrer")}>在高德地图中继续搜索</button></section></div>}
    {app === "calculator" && <div className="phone-page calculator-app"><PhoneHead title="计算器" back={back}/><output>{calcInput}</output>{calcSecret&&<aside><small>设备管理诊断</small><b>监督配置：CS-C17</b><p>远程策略上次同步：03:17<br/>定位镜像：启用<br/>相机权限：由用户控制</p><button onClick={()=>setCalcSecret(false)}>关闭</button></aside>}<div>{["C","÷","×","-","7","8","9","+","4","5","6","=","1","2","3","0","."] .map(key=><button key={key} className={"÷×-+=".includes(key)?"operator":""} onClick={()=>pressCalc(key)}>{key}</button>)}</div></div>}
    {screenLight&&<div className="screen-light" role="dialog"><p>设备不支持网页控制补光灯<br/>已改用屏幕照明</p><button onClick={toggleTorch}>关闭照明</button></div>}
  </div><aside className="phone-caption"><b>林岚的手机</b><p>{chapter === 1 ? "刚登岛。妈妈最后的微信、订单和行程都还在。" : chapter === 2 ? "原有内容完整保留，新增林琴旧机备份与档案扫描件。" : "原有调查继续累积，郭宁交出的备份以只读内容导入。"}</p></aside></div>;
}

function PhoneHead({title,back,backLabel="桌面",actions}:{title:string;back:()=>void;backLabel?:string;actions?:any}) { return <header className="phone-head"><button onClick={back}>‹ {backLabel}</button><b>{title}</b>{actions||<span />}</header> }

function Browser({ query, setQuery, results, article, setArticle, collect, found, chapter }: any) {
  const openArticle = (next: Article) => { const clue = next.id === "a23" ? "weather" : next.id === "a28" && chapter >= 2 ? "ship" : ""; if (clue && !found.includes(clue)) collect(clue); setArticle(next); };
  const updateIds=chapter===1?["a39","a42"]:chapter===2?["a43","a44","a46"]:["a47","a48","a51"];
  const updates=updateIds.map(id=>ARTICLES.find(a=>a.id===id)).filter(Boolean) as Article[];
  if (article) return <div className="browser-page article-page"><header className="browser-bar"><button onClick={()=>setArticle(null)}>← 返回结果</button><span>archive.wugang.local / {article.id}</span></header><article><div className="article-meta"><span>{article.tag}</span><time>{article.date}</time></div><h1>{article.title}</h1><div className="article-byline"><b>{article.source || "雾港地方资料库"}</b><span>{article.author || "资料整理员"}</span><time>发布于 {article.date}</time></div><p className="lead">{article.excerpt}</p>{article.image&&<figure><img src={article.image} alt="" loading="lazy" decoding="async"/><figcaption>{article.caption||`${article.title}相关现场资料图，图片时间以正文记录为准。`}</figcaption></figure>}{article.deleted && <div className="deleted">原页面已删除。当前内容来自搜索摘要、RSS与纸质剪报交叉恢复。</div>}{article.redacted && <p>公开档案中的经办人：<mark>　　　　　　</mark>。遮盖由2026年数字化整理时添加，理由为“个人信息”。</p>}{article.body.map((p:string,i:number)=><p key={i}>{p}</p>)}<footer className="article-footer">资料编号 {article.id.toUpperCase()} · 页面按原发布来源整理；修订与删除状态单独保留。</footer></article></div>;
  return <div className="browser-page"><header className="browser-bar"><span>今日雾港</span><form onSubmit={(e)=>e.preventDefault()}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索地点、机构、年份或事件"/><button>搜索</button></form></header>
    {!query && <><section className={`portal-hero portal-chapter-${chapter}`}><div><p>{chapter===1?"2026年6月16日　星期二":chapter===2?"2026年6月16日　夜间版":"2026年6月17日　凌晨版"}</p><h1>今日雾港</h1><span>{chapter===1?"19°C　阵雨刚停　末班船待复核":chapter===2?"17°C　海雾回流　档案目录更新":"16°C　浓雾　03:17低潮窗口"}</span></div><aside><b>{chapter===1?"航班提醒":chapter===2?"档案更新":"夜间提醒"}</b><p>{chapter===1?"20:10客轮是否开航，将于18:30根据能见度决定。":chapter===2?"一批旧港医疗史目录已于22:00更新，正文仍按隐私等级查阅。":"白塔东段正在设备运输，公众不要进入封闭路段。"}</p></aside></section><section className="portal-updates"><header><b>本章新增</b><span>调查推进后，首页会保留当时可见的更新</span></header>{updates.map(a=><button key={a.id} onClick={()=>openArticle(a)}><time>{a.date}</time><b>{a.title}</b><p>{a.excerpt}</p></button>)}</section></>}
    <div className="browser-layout"><div><div className="result-head"><b>{query ? `“${query}”的结果` : "本地资讯与档案"}</b></div>{results.length ? <div className="article-list">{results.map((a:Article)=><button key={a.id} className={a.related?"related":""} onClick={()=>openArticle(a)}><div><span>{a.tag}</span><time>{a.date}</time>{a.deleted&&<em>原页删除</em>}{a.related&&<em className="article-related">🔍 与调查相关</em>}</div><h3>{a.title}</h3><p>{a.excerpt}</p></button>)}</div> : <div className="no-result"><b>没有找到完全匹配的页面</b><p>可以更换地点、机构或年份重新搜索。</p></div>}</div>
    <aside className="browser-side"><h3>资料分类</h3>{[{label:"岛内新闻",q:"雾港"},{label:"生活商业",q:"生活"},{label:"历史民俗",q:"民俗"},{label:"1992事故",q:"1992"},{label:"健康教育",q:"健康"}].map(item=><button key={item.label} onClick={()=>setQuery(item.q)}>{item.label}</button>)}</aside></div>
  </div>;
}

function MapPanel({chapter,collect,found,notify,inventory,acquireItem}:any) {
  type MapAction=[string,string,string?,string?,string?];
  const defaultPlace=chapter===1?"客运码头":chapter===2?"地方陈列馆":"白塔";
  const [place,setPlace]=useState(defaultPlace);
  const [inside,setInside]=useState<string | null>(null);
  const [event,setEvent]=useState<{title:string;text:string;image:string}|null>(null);
  const [mapGlitch,setMapGlitch]=useState(false);
  const [mapHorror,setMapHorror]=useState<{text:string;visible:boolean}>({text:"",visible:false});
  const triggerPlace=(name:string)=>{if(chapter===3&&name==="白塔"){setMapHorror({text:"小心身后",visible:true});setMapGlitch(true);window.setTimeout(()=>{setMapHorror({text:"快跑",visible:true});window.setTimeout(()=>{setMapHorror({text:"",visible:false});setMapGlitch(false)},1200)},1800);}setPlace(name);};
  const chapterOne:Record<string,{sub:string;desc:string;image:string;actions:MapAction[]}>={
    "客运码头":{sub:"北岸渡口",desc:"实名客轮每日四班，候船厅与售票窗口仍在营业。",image:"/photos/venue-terminal.webp",actions:[["查询实名航班","自助终端显示：林琴6月14日16:30登岛，之后没有离岛核验。","ferry-list"],["询问售票员","售票员翻了纸质补票册：这两天没有林琴，也没有使用她证件的旅客。"]]},
    "潮生宾馆":{sub:"老街东口",desc:"一间经营二十余年的家庭宾馆。警方登记过306，但房内物品尚未移交家属。",image:"/photos/venue-hotel.webp",actions:[["向前台说明身份","蒋小蕊核对你的身份证、林琴登记的紧急联系人信息，又向接警民警确认后，交给你一张只能开启306的备用房卡。",undefined,"room-card"],["询问昨晚值班情况","前台只确认林琴整夜未归。完整门卡记录不能口头提供，她建议你先核对房内物品是否有缺失。"]]},
    "306房间":{sub:"潮生宾馆 · 三楼",desc:"房卡亮起绿灯。行李箱、外套和未拆封的护膝都在，房间不像正常退房。",image:"/photos/hotel-306.webp",actions:[["检查电子门锁缓存","门内锁体保留最近一条离线缓存：6月15日21:48刷出，此后没有开门记录。","hotel-log"],["查看书桌上的早餐券","房号306，右上角手写C17/04，后面标注低盐。","voucher1704"],["核对随身行李","相机包还在，常穿的灰外套也在；林琴只带走了手机和房卡。"]]},
    "潮声便利店":{sub:"归潮广场西侧",desc:"二十四小时营业，收银台上贴着三张轮班表。",image:"/photos/clerk-badge.webp",actions:[["和夜班店员交谈","陶小雨说林琴来买过矿泉水，问过白塔东段为什么封路。她胸前的号码分成上下两栏。","badge1704"],["请店员核对旧小票","陶小雨把6月15日22点后的废票逐张翻了一遍，没有找到林琴的付款记录。"]]},
    "望潮饭店":{sub:"内湾堤岸",desc:"晚市以工作码头的工人为主，后厨九点半熄火。",image:"/photos/venue-restaurant.webp",actions:[["坐下点餐","陈放认出你是林琴的女儿。他没见过她离岛，只记得她来问过一艘夜间工作船。"],["替旧港门岗带份夜宵","陈放没收钱：‘他胃不好，别放辣。你别一上来就问失踪的人，先问那晚谁值班。’",undefined,"night-meal"],["听邻桌说话","装卸工只肯确认22:20听见过汽笛，是否离泊他没有亲眼看到。"]]},
    "归潮广场":{sub:"镇中心",desc:"公交、露天电影和居民活动都集中在这里。",image:"/photos/venue-plaza.webp",actions:[["阅读航班公告","公告栏保留着6月16日晚班船因平流雾取消的通知。","weather"],["看露天电影排片","今晚放映《海街旧事》，旁边坐着等末班公交的学生。广场看起来一切正常。"]]},
    "旧港冷链":{sub:"西侧工作码头",desc:"冷库仍在运转。访客隔着门岗玻璃，根本看不到登记夹。",image:"/photos/venue-cold-chain.webp",actions:[["敲门询问夜班记录","门卫没有开窗，只指了指‘访客止步’。你一个外地人直接盘问，他没有理由配合。"],["把夜宵递给门岗","他先核对餐盒上陈放写的名字，才把窗推开一点。闲聊中他让你看了一眼22:20登记：三名船员、加油0升，目的港回执空白。","workboat",undefined,"night-meal"]]},
    "白塔":{sub:"北坡尽头",desc:"旧雾笛塔兼作航标，东侧检修路长期封闭。",image:"/photos/lighthouse-door.webp",actions:[["查看封闭告示","告示落款是港务站，封闭理由为边坡维护，日期却被雨水泡掉。"],["绕塔查看","塔后能听见稳定的机械声，但检修门需要内部门禁。"],["查看雾笛时刻表","公开时刻表只记录航标播报，没有人员名单。"]]}
  };
  const chapterTwo:typeof chapterOne={
    "地方陈列馆":{sub:"老街北口",desc:"旧港、学校与康养院的纸本档案在这里数字化。",image:"/photos/nurse-id-1992.webp",actions:[["查转院单目录","四张来自不同县市的转院单，都留下潮生康养院乙区印章。","ward"],["填写纸质调阅申请","管理员核验资料用途后盖了当天的阅览章。凭这张单可以去旧港仓库查一册尚未数字化的领用簿。",undefined,"archive-slip"],["申请查看值班表","1992年6月16日夜班护士为周岚，23:10后十二个床位被手写改动。","nurse"]]},
    "潮生康养院旧址":{sub:"南坡尽头",desc:"主楼正在修缮。陈列馆管理员同意陪你查看尚未移交完的乙区旧物。",image:"/photos/venue-hotel.webp",actions:[["查看施工平面图","公开平面图没有地下层，乙区被标成‘权属待核’。"],["核对移交箱里的旧章","管理员从封存箱取出乙区旧章；外形与四张转院单残留的椭圆章一致。","ward"]]},
    "旧港仓库":{sub:"西侧六码头",desc:"废弃木仓旁保留着1992年的船具领用房。",image:"/photos/venue-cold-chain.webp",actions:[["调阅船具领用簿","管理员先收下调阅单才开库门。归潮号核载6人，当晚却领走17件救生衣。","ship",undefined,"archive-slip"],["试开六号铁柜","钥匙能转动，但柜门仍贴着调查机关封条。你只记录了锁号，没有擅自破坏封存。",undefined,undefined,"locker-key"]]},
    "许伯钟表铺":{sub:"老街中段",desc:"火灾后重新开过门，墙上的钟仍慢七分钟。",image:"/photos/clerk-badge.webp",actions:[["出示调阅单并询问旧钥匙","许伯核对陈列馆的调阅章后，才拿出旧港六号柜的备用钥匙。他只答应陪你去仓库试锁，不能把钥匙带走。",undefined,"locker-key","archive-slip"],["核对旧报时间","报警记录比报纸写的起火时间早八分钟。"]]},
    "客运码头":{sub:"北岸渡口",desc:"陈列馆移交记录里，有一批档案从这里运往大陆。",image:"/photos/venue-terminal.webp",actions:[["查1992年工作船","公开客轮系统查不到归潮号，它登记在工作船名录。","ship"],["问旧站务员","他记得事故后几天，码头曾连夜运走一批病床。"]]},
    "白塔":{sub:"北坡尽头",desc:"旧雾笛时刻与归潮号事故发生在同一晚。",image:"/photos/lighthouse-door.webp",actions:[["查看旧时刻表","1992年6月16日23:10后有一次未说明原因的人工播报。"],["看塔内维修签名","维修栏里‘周岚’两个字与护士值班表同名，但笔迹不同。"]]}
  };
  const chapterThree:typeof chapterOne={
    "白塔":{sub:"北坡尽头 · 03:17",desc:"检修门将在低潮时自动解锁，门后通向地下设备层。",image:"/photos/lighthouse-door.webp",actions:[["检查检修门","门禁日程显示03:17自动解锁，关联任务只写了‘LQ转入’。","rescue"],["刷检修挂牌进入控制室","挂牌通过离线核验。控制室日志逐项记录低潮、姓名缩写和生理数值。","fog-horn",undefined,"maintenance-tag"]]},
    "地下观察区":{sub:"白塔下层",desc:"平面图中没有这个房间，电力来自旧港冷链备用线。",image:"/photos/health-records.webp",actions:[["查看床位终端","终端按A、B、C分页显示对象，C17-01至04在同一页，表头没有解释编号含义。","codes"],["确认LQ床位","B-06床位仍有生命体征，转运状态显示‘等待03:17’。你只截取位置和时间，避免拍到病人。",undefined,"bed-location"]]},
    "旧港冷链":{sub:"西侧工作码头",desc:"夜间仍有一条电缆和一辆无牌冷藏车在运行。",image:"/photos/venue-cold-chain.webp",actions:[["查看对账机柜","机柜只留下三条文件路径，正文已经从现场终端清除。要看内容，得回手机恢复本地副本。"],["检查无牌冷藏车","副驾脚垫下压着一块冷链检修挂牌；背面写有白塔03:17的低潮通行窗口。",undefined,"maintenance-tag"]]},
    "郭家旧宅":{sub:"归潮广场东巷",desc:"郭宁带你从后门进入自己的房间。她不肯交出家人的隐私，只同意核对与自己有关的记录。",image:"/photos/family-dinner.webp",actions:[["查看郭宁导出的群公告","群公告把体检、服药和出岛申请写在同一张表里。","family-group"],["核对郭宁保存的药袋照片","四个药袋分别写着C17-01至C17-04；她只让你拍编号，没有拍姓名。","codes"]]},
    "引水洞":{sub:"旧港北侧海蚀通道",desc:"普通地图没有标注，退潮后入口才露出半米。",image:"/photos/wugang-aerial.webp",actions:[["核对潮位","03:17前后有二十二分钟可通行窗口。","rescue"],["查看洞口拖痕","新鲜轮痕从冷链码头方向一直延伸到水线。"]]},
    "客运码头":{sub:"北岸渡口",desc:"救援位置和证据可在这里接入岛外网络发送。",image:"/photos/venue-terminal.webp",actions:[["测试岛外上传","固定网络可用，三个加密备份目标均已连通。"],["查询凌晨船班","04:20有一艘海事巡逻艇靠岸，可作为撤离接应。"]]},
    "旧港监控室":{sub:"冷链地下一层 · 镜像节点",desc:"五套本应彼此独立的监控，在这里被接进同一面屏幕墙。中心画面正停在你经过冷链东门的那一帧。",image:"/photos/surveillance-room.webp",actions:[["查看中心屏幕","画面里是你的背影。左侧小屏按时间倒序保存着你进入宾馆、客运站和旧港的路线；陌生号码不是在猜。"],["复制只读镜像索引","你用手机扫描节点二维码，只复制镜头编号与时间戳，原始录像仍留在设备中。",undefined,"mirror-index"],["断开远端观看","确认只读索引已经保存后，你拔掉标为WAN的上行线。本地录像继续运行，远端画面中断。",undefined,undefined,"mirror-index"]]}
  };
  const places=chapter===1?chapterOne:chapter===2?chapterTwo:chapterThree;
  const mapImage=chapter===1?"/photos/wugang-map-rain.webp":chapter===2?"/photos/wugang-map-archive.webp":"/photos/wugang-map-night.webp";
  const monitorUnlocked=chapter===3&&found.includes("payments")&&found.includes("rescue")&&inventory.includes("maintenance-tag");
  const visiblePlaces=Object.keys(places).filter(name=>name!=="306房间"&&(name!=="地下观察区"||inventory.includes("maintenance-tag"))&&(name!=="旧港监控室"||monitorUnlocked));
  const imageFor=(action:MapAction,item:{image:string})=>action[2]==="hotel-log"?"/photos/hotel-306.webp":action[2]==="badge1704"?"/photos/clerk-badge.webp":action[2]==="ward"?"/photos/transfer-forms.webp":action[2]==="nurse"?"/photos/nurse-id-1992.webp":action[2]==="codes"?"/photos/health-records.webp":item.image;
  const visit=(name:string)=>{setPlace(name);setInside(name);setEvent(null);};
  const act=(action:MapAction,item:any)=>{if(action[4]&&!inventory.includes(action[4])){const needed=ITEMS[action[4]];setEvent({title:"现在还缺一个由头",text:`对方没有理由配合。先找到“${needed?.title||"必要物品"}”，也许能让这次交涉有个自然的开场。`,image:item.image});return}setEvent({title:action[0],text:action[1],image:imageFor(action,item)});if(action[2]&&!found.includes(action[2]))collect(action[2]);if(action[3])acquireItem(action[3]);};
  if(inside){const item=places[inside];const hasRoomCard=inventory.includes("room-card");return <div className={`venue-page venue-chapter-${chapter}`} style={{backgroundImage:`linear-gradient(180deg,rgba(10,18,16,.12),rgba(10,18,16,.82)),url(${item.image})`}}><header><button onClick={()=>{inside==="306房间"?setInside("潮生宾馆"):setInside(null);setEvent(null);}}>← {inside==="306房间"?"返回前台":"离开，返回地图"}</button><span>{CHAPTERS[chapter-1].title} · {item.sub}</span></header><section><p>当前地点</p><h1>{inside}</h1><strong>{item.desc}</strong>{inside==="潮生宾馆"&&<button className={`room-entry ${hasRoomCard?"unlocked":"locked"}`} onClick={()=>hasRoomCard?setInside("306房间"):notify("前台不会让你直接上楼。先说明身份并完成登记。")}>{hasRoomCard?"刷卡进入306房间 →":"306房间 · 需要房卡"}</button>}<div className="venue-actions">{item.actions.map((action,i)=><button key={i} onClick={()=>act(action,item)}><span>{String(i+1).padStart(2,"0")}</span>{action[0]}</button>)}</div></section>{event&&<div className="venue-modal" role="dialog" aria-modal="true"><article><figure><img src={event.image} alt=""/></figure><small>{event.title.includes("房卡")||event.title.includes("身份")?"交互结果":"现场查看"}</small><h2>{event.title}</h2><p>{event.text}</p><button onClick={()=>setEvent(null)}>关闭</button></article></div>}</div>}
  return <div className={`map-page map-chapter-${chapter}`}><div className="map-canvas real-map" style={{backgroundImage:`linear-gradient(rgba(15,28,25,.16),rgba(15,28,25,.22)),url(${mapImage})`}}>{visiblePlaces.map((p,i)=><button key={p} style={{left:`${12+(i*15)%70}%`,top:`${14+(i*21)%64}%`}} className={place===p?"active":""} onClick={()=>triggerPlace(p)}><i>{i+1}</i>{p}</button>)}<div className="map-time"><b>{chapter===1?"20:26":chapter===2?"22:36":"03:17"}</b><span>{chapter===1?"海雾渐浓":chapter===2?"海雾回流":"低潮 · 浓雾"}</span></div>{mapGlitch&&<div className="map-glitch"><i/><b>当前位置</b><span>白塔下方 · -12m</span><em>定位信号异常</em></div>}{mapHorror.visible&&<div className="map-horror"><span>{mapHorror.text}</span></div>}</div><aside><p>{CHAPTERS[chapter-1].title} · 岛内地图</p><h2>{place}</h2><b>{places[place].sub}</b><p>{places[place].desc}</p>{inventory.length>0&&<div className="map-items"><span>调查道具</span>{inventory.map((id:string)=><b key={id}>{ITEMS[id]?.title}</b>)}</div>}<button className="route" onClick={()=>visit(place)}>进入地点</button></aside></div>
}

const clueQuestion=(id:string)=>({
  "last-chat":"她说“事情办完再买”，说明返程日期没有确定。最后一次报平安之后，她去了哪里？","hotel-log":"21:48刷出后，她有没有出现在宾馆附近的其他记录里？","ferry-list":"没有离岛核验，是否还存在不走客轮的离岛方式？","workboat":"加油量为0、目的港无回执，这艘船当晚真的离泊了吗？","badge1704":"门店17与员工04为什么会以相同顺序出现在别处？","voucher1704":"早餐券上的C17/04由谁手写，代表房客还是后厨？","ward":"不同县市的孩子为什么都被转入同一病区？","nurse":"23:10之后是谁改动了十二张床位记录？","ship":"核载6人的船为什么领走17件救生衣？","codes":"生活记录里的数字为何又出现在这张随访表中？","payments":"同一时间执行的三套单据，对应的是同一批货还是同一次安排？","fog-horn":"雾笛日志为什么记录人的姓名应答？","lan-transplant":"被遮盖的供体姓名能否通过档案尾号反查？"
} as Record<string,string>)[id];

function Evidence({found,chapter,collect}:{found:string[];chapter:number;collect:(id:string)=>void}) {
  const [open,setOpen]=useState<Clue|null>(null);
  const items=CLUES.filter(c=>c.chapter===chapter&&found.includes(c.id));
  const ready=DEDUCTIONS.filter(d=>d.chapter===chapter&&d.requires.every(id=>found.includes(id))&&!found.includes(d.id));
  const completed=DEDUCTIONS.filter(d=>d.chapter===chapter&&found.includes(d.id));
  return <div className="evidence-page"><header><p>INVESTIGATION NOTES</p><h1>调查手记</h1><span>原始材料不会自动替你得出结论。把能对上时间、人物或编号的记录放在一起。</span></header>
    {(ready.length>0||completed.length>0)&&<section className="deduction-desk"><div><small>材料关系</small><h2>组合推演</h2><p>每份收录材料至少参与一条推演；不同组合会形成不同的论证路径。</p></div>{ready.map(d=><button key={d.id} onClick={()=>collect(d.id)}><span>{d.source}</span><b>{d.title}</b><em>开始推演 →</em></button>)}{completed.map(d=><button className="done" key={d.id} onClick={()=>setOpen(CLUES.find(c=>c.id===d.id)||null)}><span>已完成推演</span><b>{d.title}</b><em>查看关系 →</em></button>)}</section>}
    {items.length?<div className="evidence-grid">{items.map((c,i)=><button className={`evidence-card ${c.source.includes("组合推演")?"deduced":""}`} key={c.id} onClick={()=>setOpen(c)}><span>{String(i+1).padStart(2,"0")} · {CHAPTERS[c.chapter-1].title}</span><h3>{c.title}</h3><p>{c.text}</p><small>来源：{c.source}</small><em>查看详情 →</em></button>)}</div>:<div className="empty-evidence">本章手记内尚无材料。</div>}<footer>当前章节：{CHAPTERS[chapter-1].title}</footer>{open&&<div className="evidence-modal" role="dialog" aria-modal="true"><article><small>{CHAPTERS[open.chapter-1].title} · {open.source.includes("组合推演")?"材料关系":"原始材料"}</small><h2>{open.title}</h2><b>{open.source}</b><p>{open.text}</p>{(clueQuestion(open.id)||DEDUCTIONS.find(d=>d.id===open.id)?.question)&&<aside><span>尚未解决</span><p>{clueQuestion(open.id)||DEDUCTIONS.find(d=>d.id===open.id)?.question}</p></aside>}<button onClick={()=>setOpen(null)}>关闭</button></article></div>}</div>
}

function TutorialOverlay({dismiss}:{dismiss:()=>void}) {
  const [step,setStep]=useState(0);
  const tips=[
    {title:"欢迎来到雾港",text:"你叫林岚，母亲林琴在雾港岛失联。她的手机现在在你手里——从这里开始调查。"},
    {title:"① 先看微信",text:"打开微信，查看妈妈最后发来的消息。这是调查的起点。"},
    {title:"② 找人帮忙",text:"微信里有一位叫「潮」的联系人——调查中卡住了随时可以问他，不影响结局。"},
    {title:"③ 五个工具",text:"左侧工具栏切换：手机、档案搜索、岛内地图、调查手记、阶段结论。先熟悉手机里的内容。"},
    {title:"④ 支线回收",text:"调查中会陆续解锁「未解之谜」——收集足够线索后，可以查看每条支线的真相。"},
    {title:"⑤ 核心玩法",text:"找到线索 → 调查手记做组合推演 → 阶段结论提交判断。每个章节完成一次即可推进。"},
  ];
  const t=tips[step];
  return <div className="tutorial-overlay" onClick={()=>{if(step<tips.length-1)setStep(s=>s+1);else dismiss()}}>
    <div className="tutorial-card" onClick={e=>e.stopPropagation()}>
      <div className="tutorial-dots">{tips.map((_,i)=><i key={i} className={i===step?"active":""}/>)}</div>
      <h3>{t.title}</h3><p>{t.text}</p>
      <div className="tutorial-actions">
        <button onClick={dismiss}>跳过教程</button>
        <button className="tutorial-next" onClick={()=>{if(step<tips.length-1)setStep(s=>s+1);else dismiss()}}>{step<tips.length-1?"下一步 →":"开始调查"}</button>
      </div>
    </div>
  </div>;
}

function Board({chapter,collected,selected,toggle,answer,setAnswer,submit,investigate}:any) {
  const deductions=collected.filter((c:Clue)=>c.source.includes("组合推演"));
  const hasDeduction=deductions.length>0;
  const choices=chapter===1?[
    ["left","林琴已经通过非公开方式离岛"],
    ["island","没有可靠记录证明她离岛，她仍在岛上的可能性最高"],
    ["accident","她在海上遭遇了无法解释的事故"],
  ]:chapter===2?[
    ["coincidence","康养院只是集中接收疑难患儿，记录重合源于当年归档混乱"],
    ["transfer","儿童经福利、医疗和港口系统被分散转运到乙区"],
    ["ghost","十二份记录只是年代接近，无法证明存在统一转运"],
  ]:[
    ["publish","立刻公开所有供体、受体与后代姓名"],
    ["destroy","立即切断白塔电力并带走设备，人员和证据之后再处理"],
    ["rescue-first","先按检修道救人并异地备份，再分层公开犯罪证据"],
  ];
  return <div className="board-page"><header><p>阶段结论随时开放</p><h1>{CHAPTERS[chapter-1].question}</h1><span>选择一条已经成立的组合推演，再写下阶段判断。原始材料已记录在推演内部，不需要重复提交。</span></header>{!hasDeduction&&<div className="investigate-callout"><div><b>先把材料之间的关系理出来</b><p>回到调查手记。能在时间、人物或编号上互相印证的记录，会出现“组合推演”。</p></div><button onClick={investigate}>继续调查 →</button></div>}<form onSubmit={submit}><div className="board-columns"><section><h3>一、选择论证 <small>{selected.length}/1</small></h3>{hasDeduction?deductions.map((c:Clue)=><button type="button" key={c.id} className={`${selected.includes(c.id)?"selected":""} deduced`} onClick={()=>toggle(c.id)}><i>{selected.includes(c.id)?"✓":"+"}</i><span><b>{c.title}</b><small>{c.source}</small></span></button>):<div className="board-empty"><p>还没有完成组合推演。</p><button type="button" onClick={investigate}>先从手机里的日常记录查起</button></div>}</section><section><h3>二、写下阶段判断</h3><div className="answers">{choices.map(([value,label])=><label key={value}><input type="radio" name="a" value={value} checked={answer===value} onChange={e=>setAnswer(e.target.value)}/>{label}</label>)}</div><button className="submit-conclusion">{chapter===3?"执行最终行动":"提交阶段结论"}</button><small className="submit-note">推演已经保存了引用来源。这里仅判断哪条推演最能支撑你的结论。</small></section></div></form></div>
}

function SideMysteries({chapter,found,resolvedMysteries,setResolvedMysteries,notify}:{chapter:number;found:string[];resolvedMysteries:string[];setResolvedMysteries:(v:string[])=>void;notify:(text:string)=>void}){
  const [open,setOpen]=useState<SideMystery|null>(null);
  const [rewardNotice,setRewardNotice]=useState<(typeof MYSTERY_MILESTONES)[number]|null>(null);
  const available=SIDE_MYSTERIES.filter(m=>m.chapter<=chapter);
  const total=available.length;
  const resolved=available.filter(m=>resolvedMysteries.includes(m.id)).length;
  const percent=total>0?Math.round(resolved/total*100):0;
  const resolveMystery=(mystery:SideMystery)=>{
    if(resolvedMysteries.includes(mystery.id)){setOpen(null);return}
    const next=[...resolvedMysteries,mystery.id];
    setResolvedMysteries(next);
    setOpen(null);
    const milestone=MYSTERY_MILESTONES.find(item=>item.count===next.length);
    if(milestone)setRewardNotice(milestone);
    else notify(`支线已归档 · ${next.length}/8`);
  };
  return <div className="side-page">
    <header><p>SIDE MYSTERIES</p><h1>未解之谜</h1><span>调查中收集到的线索会逐步解锁支线谜题。查看每条谜底的完整叙述，才算真正拼出雾港的全貌。</span></header>
    <div className="side-progress">
      <div className="side-progress-bar"><span style={{width:`${percent}%`}}/></div>
      <b>{resolved}/{total}</b><span>条已解答</span>
    </div>
    <div className="side-milestones" aria-label="支线归档里程碑">{MYSTERY_MILESTONES.map(item=><div key={item.count} className={resolvedMysteries.length>=item.count?"reached":""}><i>{resolvedMysteries.length>=item.count?"✓":item.count}</i><span><b>{item.title}</b><small>{item.count} 条归档</small></span></div>)}</div>
    <div className="side-grid">{available.map(m=>{
      const unlocked=m.requires.every(r=>found.includes(r));
      const done=resolvedMysteries.includes(m.id);
      return <button key={m.id} className={`side-card${done?" done":""}${unlocked&&!done?" unlocked":""}${!unlocked?" locked":""}`} onClick={()=>unlocked&&setOpen(m)}>
        <div className="side-card-head">
          <span className="side-chapter">0{m.chapter}</span>
          {done?<i className="side-check">✓</i>:unlocked?<i className="side-unlock">?</i>:<i className="side-lock">🔒</i>}
        </div>
        <h3>{m.title}</h3>
        <p>{done?"已解答":unlocked?m.question:"需要更多线索"}</p>
        {!unlocked&&<small className="side-hint">缺失：{m.requires.filter(r=>!found.includes(r)).map(r=>CLUES.find(c=>c.id===r)?.title||r).join("、")}</small>}
      </button>;
    })}</div>
    {open&&<div className="side-modal" role="dialog" aria-modal="true">
      <article>
        <small>0{open.chapter} · {CHAPTERS[open.chapter-1].title}</small>
        <h2>{open.title}</h2>
        <p className="side-question">{open.question}</p>
        <div className="side-sources"><span>互证材料</span>{open.requires.map(id=><b key={id}>{CLUES.find(c=>c.id===id)?.title||id}</b>)}</div>
        <hr/>
        <div className="side-answer"><p>{open.answer}</p></div>
        {!resolvedMysteries.includes(open.id)&&<button className="side-resolve" onClick={()=>resolveMystery(open)}>确认互证并归档</button>}
        <button className="side-close" onClick={()=>setOpen(null)}>关闭</button>
      </article>
    </div>}
    {rewardNotice&&<div className="side-modal side-reward" role="dialog" aria-modal="true"><article><small>支线里程碑 · {rewardNotice.count}/8</small><div className="side-reward-mark">✓</div><h2>{rewardNotice.title}</h2><p>{rewardNotice.text}</p><button className="side-resolve" onClick={()=>setRewardNotice(null)}>收下归档反馈</button></article></div>}
  </div>;
}
