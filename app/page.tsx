"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Area = "phone" | "browser" | "map" | "evidence" | "board";
type AppId = "home" | "messages" | "photos" | "notes" | "files" | "shopping" | "music" | "weather";
type Article = { id: string; chapter: number; tag: string; date: string; title: string; excerpt: string; body: string[]; source?: string; author?: string; image?: string; caption?: string; deleted?: boolean; redacted?: boolean };
type Clue = { id: string; chapter: number; title: string; source: string; text: string };

const CHAPTERS = [
  { no: 1, device: "林岚的手机", title: "回潮口", question: "母亲为什么来雾港，她是否已经离开这座岛？", count: 6 },
  { no: 2, device: "林琴的旧手机", title: "旧名册", question: "散落在不同地区的十二份记录，为什么指向同一间病区？", count: 5 },
  { no: 3, device: "郭宁的手机", title: "雾笛之后", question: "雾港的编号在记录什么，郭维今晚准备做什么？", count: 5 },
];

const CLUES: Clue[] = [
  { id: "last-chat", chapter: 1, title: "6月14日母女微信", source: "林岚手机 / 微信 / 妈妈", text: "林琴18:42发来：‘到了，住潮生宾馆306。房间有点潮。’她没有购买返程票。" },
  { id: "hotel-log", chapter: 1, title: "306房门卡记录", source: "潮生宾馆前台打印件", text: "入住：6月14日17:36；最后刷出：6月15日21:48；此后无开门记录。登记状态仍为在住。" },
  { id: "ferry-list", chapter: 1, title: "林琴客轮实名记录", source: "客运码头自助终端", text: "6月14日16:30航班有登岛核验。6月14日至16日的离岛核验结果为空。" },
  { id: "workboat", chapter: 1, title: "旧港22:20工作船记录", source: "港务简报 / 工作码头", text: "口头说明写离泊22:20；船员表登记3人；当次加油单为0升；大陆目的港没有对应卸货回执。" },
  { id: "weather", chapter: 1, title: "6月16日晚间航班通告", source: "雾港气象站 / 客运公告", text: "16:00发布能见度预警；18:30取消20:10客轮。公告期间移动通信与固定电话状态正常。" },
  { id: "badge1704", chapter: 1, title: "便利店夜班胸牌照片", source: "林岚手机 / 照片", text: "胸牌上栏标注‘门店17’，下栏标注‘员工04’。佩戴者为夜班店员陶小雨。" },
  { id: "voucher1704", chapter: 1, title: "306房早餐券照片", source: "林岚手机 / 照片", text: "早餐券右上角手写‘C17/04’，其后标注‘低盐’。房号栏为306。" },
  { id: "twelve", chapter: 2, title: "十二张儿童寻人启事", source: "林琴旧手机 / 沈砚资料夹", text: "启事发布地涉及六个县市，日期为1989年至1992年。每张均保留年龄、衣物和最后出现地点。" },
  { id: "ward", chapter: 2, title: "四张转院单扫描件", source: "林琴旧手机 / 照片", text: "四张转院单的转出医院不同。接收栏均盖有‘潮生康养院乙区’椭圆章。" },
  { id: "nurse", chapter: 2, title: "周岚护士证及值班表", source: "1992年乙区档案", text: "护士证姓名为周岚。6月16日乙区夜班表中，她的值班时段为20:00至次日08:00。23:10后十二个床位的状态有手写改动。" },
  { id: "ship", chapter: 2, title: "归潮号领用及事故记录", source: "1992年港务内参", text: "归潮号核载6人，6月16日晚领用救生衣17件。6月19日公开稿标题为‘无人维护船漂移’。" },
  { id: "qin-note", chapter: 2, title: "林琴2009年备忘录", source: "林琴旧手机 / 备忘录", text: "备忘录写：‘名单先分开存。不能把收到器官的人和做这件事的人写在一起。沈砚如果没回来，先别交原件。’" },
  { id: "family-group", chapter: 3, title: "郭家健康群聊天记录", source: "郭宁手机 / 群聊", text: "群公告列出体检、服药、奖学金和出岛申请。发布者均为郭维。郭宁要求查看体检报告，未收到文件。" },
  { id: "codes", chapter: 3, title: "内部观察编号表", source: "潮生健康账户 / 导出文件", text: "表格分为A、B、C三组，每名对象另有两组数字。C17-01与C17-04位于同一分组页。" },
  { id: "payments", chapter: 3, title: "三份日期相邻的财务文件", source: "郭宁手机 / 文件", text: "文件分别为旧港冷链运输单、康养院耗材单和境外付款回执。三份文件的日期均为2025年11月08日。" },
  { id: "fog-horn", chapter: 3, title: "雾笛观察日志与录音", source: "白塔观察记录", text: "日志逐项记录低潮时间、雾笛播放、受试者姓名应答和生理数值。附录音时长18分42秒。" },
  { id: "rescue", chapter: 3, title: "03:17日程及检修图", source: "郭维日程 / 白塔平面图", text: "日程写‘03:17，LQ转观察区’。平面图标出一条从白塔检修门通往地下观察区的通道。" },
  { id: "lan-transplant", chapter: 3, title: "林岚儿童移植随访表", source: "潮生健康 / 旧档", text: "患者林岚，9岁；手术日期2008年8月17日；供体年龄12岁。公开副本的供体姓名栏被遮盖。" },
];

const ordinaryTitles = [
  ["民生", "雾港夏季客轮加开两班"], ["生活", "望潮饭店六月海鲜价目公示"], ["旅游", "白塔步道东段暂停开放"],
  ["社区", "归潮广场周末露天电影排片"], ["教育", "雾港中学旧校服征集启事"], ["气象", "内湾平流雾形成原因答疑"],
  ["商业", "潮声便利店夜班招聘一人"], ["交通", "老街施工公交临时绕行"], ["文化", "木名牌不是旅游纪念品"],
  ["健康", "卫生站提醒慢病居民按时复诊"], ["港务", "冷链码头完成季度消杀"], ["寻物", "游客遗失银色卡片相机"],
  ["市集", "周三渔获早市摊位调整"], ["社区", "停水通知：南坡巷管道检修"], ["人物", "许伯和他修了四十年的钟"],
  ["地方志", "雾港岛为什么像一只合拢的手"], ["旅游", "雨天在雾港可以去的五个地方"], ["生活", "潮生宾馆早餐供应时间调整"],
  ["教育", "海岛学生往返大陆补贴办法"], ["论坛", "本地人真的会怕三声雾笛吗"], ["文化", "旧港木器铺口述史整理完成"],
  ["政务", "2026旧港更新项目意见征集"], ["天气", "今晚20:10航班可能受能见度影响"], ["商业", "一勺外卖新增夜间配送区域"],
  ["档案", "1992年港务月报开放查阅目录"], ["论坛", "为什么地图上没有引水洞"], ["医疗", "潮生康养院旧址修缮说明"],
  ["历史", "归潮号事故报道版本索引"], ["社会", "2009年老街钟表铺火灾回访"], ["公告", "地方陈列馆扫描档案纠错说明"],
  ["港务", "工作船实名登记试行办法"], ["社区", "寻找1992年乙区旧职工"], ["健康", "海岛儿童健康档案数字化完成"],
  ["民俗", "沉名礼原来要在岸上叫一次名字"], ["法治", "失踪人口报案与跨区协查流程"], ["观察", "旧港改造前的最后一个汛期"],
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
  "民俗研究者梳理‘沉名礼’时发现，仪式最后一步恰恰是公开叫回真名。|家属先把写有乳名的木牌沉入浅水，退潮后在岸上喊一次户籍姓名，象征让海知道人已归家。不同村落没有统一日期。|文章指出后来流传的‘永远不提名字’缺乏早期记录，可能是近几十年的误传。",
  "警方说明，成年人失联不满二十四小时也可以报案，不存在必须等待的统一规定。|接报后将根据最后出现地点、危险因素和通信情况决定查找措施；跨区出行可调取实名交通记录协查。旅馆发现住客异常应及时联系登记人并报警。|家属应提供近期照片、衣着和医疗风险，不要自行发布身份证完整号码。",
  "旧港改造前最后一个汛期，六码头仍承担岛上大部分建材和冷藏货物。|记者跟随夜班记录潮位、车辆和船舶交接。门岗使用纸本登记，凌晨后有两次涂改，值班员解释为雨水浸湿后重写。|报道只呈现当晚所见，未核实更早年份的事故传闻。"
];

const ARTICLES: Article[] = ordinaryTitles.map(([tag, title], i) => ({
  id: `a${i + 1}`, chapter: i > 31 ? 2 : 1, tag, title, date: `${2026 - Math.floor(i / 12)}.${String(6 - (i % 6)).padStart(2, "0")}.${String((i * 3) % 15 + 1).padStart(2, "0")}`,
  excerpt: articleDetails[i].split("|")[0],
  body: articleDetails[i].split("|"), source: ["今日雾港","雾港政务公开","雾港地方档案","岛民论坛"][i%4], author: i%5===0?"记者 许蔚":"编辑部整理",
  image: [0,1,2,3,5,10,15,17,22,26,30,35].includes(i) ? ["/photos/venue-terminal.webp","/photos/venue-restaurant.webp","/photos/lighthouse-door.webp","/photos/venue-plaza.webp","/photos/wugang-aerial.webp","/photos/venue-cold-chain.webp","/photos/wugang-aerial.webp","/photos/venue-hotel.webp","/photos/venue-terminal.webp","/photos/venue-hotel.webp","/photos/venue-cold-chain.webp","/photos/wugang-aerial.webp"][[0,1,2,3,5,10,15,17,22,26,30,35].indexOf(i)] : undefined,
  deleted: i === 25 || i === 31, redacted: i === 27 || i === 32,
}));

ARTICLES.push({ id: "a37", chapter: 3, tag: "医疗", date: "2008.08.17", title: "跨区儿童器官移植术后随访登记", excerpt: "患者林岚，9岁；供体身份在公开副本中隐去。", redacted: true, body: ["登记显示患者因急性肝衰竭接受急诊移植，术后转入长期随访。供体年龄十二岁，死亡时间与器官获取时间相隔四小时。", "原件的供体姓名栏并非空白，而是在2026年数字化时被遮盖。档案号为TX-0817-12，与一张异地死亡证明使用相同尾号。"] });
ARTICLES.push({ id: "a38", chapter: 3, tag: "民政", date: "2008.08.17", title: "未成年人叶知潮死亡登记更正页", excerpt: "该页仅能通过移植档案号反查，普通姓名搜索未被收录。", body: ["叶知潮，男，十二岁。登记死亡原因为交通事故后重型颅脑损伤。监护人签署器官捐献同意书。", "死亡证明的签发机构与事故发生地相距三百余公里，补录经办人来自雾港潮生康养院。‘叶知潮’三个字是档案恢复后第一次完整出现。"] });

const APPS: { id: AppId; icon: string; name: string }[] = [
  { id: "messages", icon: "微", name: "微信" }, { id: "photos", icon: "相", name: "照片" },
  { id: "notes", icon: "记", name: "备忘录" }, { id: "files", icon: "档", name: "文件" },
  { id: "shopping", icon: "淘", name: "手机淘宝" }, { id: "music", icon: "声", name: "泊声音乐" },
  { id: "weather", icon: "雾", name: "天气" },
];

const PHOTO_SETS = {
  1: [
    { title: "便利店夜班胸牌", caption: "潮声便利店 · 门店17 / 员工04", clue: "badge1704", src: "/photos/clerk-badge.webp", meta: "2026/06/16 20:07 · 林岚的手机", transcript: "胸牌上栏：潮声便利店　门店17\n姓名：陶小雨\n岗位：夜班收银\n员工号：04" },
    { title: "宾馆早餐券", caption: "306房随身物品 · C17 / 04 · 低盐", clue: "voucher1704", src: "/photos/breakfast-voucher.webp", meta: "2026/06/16 10:31 · 林岚的手机", transcript: "潮生宾馆早餐券\n房号：306\n餐别：低盐\n右上角手写：C17 / 04\n使用日期：6月15日" },
    { title: "306房门", caption: "门锁指示正常，走廊靠近安全楼梯", clue: "", src: "/photos/hotel-306.webp", meta: "2026/06/16 10:22 · 林岚的手机", transcript: "房门号：306\n电子门锁指示灯：绿色\n拍摄时间：2026年6月16日 10:22\n位置：潮生宾馆三层东侧走廊" },
  ],
  2: [
    { title: "四张转院单", caption: "来自不同县市，均残留乙区印章", clue: "ward", src: "/photos/transfer-forms.webp", meta: "扫描件整理 · 原件年代1989—1992", transcript: "四份原件分别签发于1989、1990、1991和1992年。\n转出医院不同，接收栏均盖有：潮生康养院乙区。\n患者年龄依次为12岁、9岁、11岁、13岁。\n四张单据的转院理由均写作“进一步观察”。" },
    { title: "周岚护士证", caption: "与事故当夜乙区值班表放在一起", clue: "nurse", src: "/photos/nurse-id-1992.webp", meta: "地方陈列馆扫描 · 1992", transcript: "姓名：周岚\n职务：护士\n单位：潮生康养院乙区\n有效期：1991年1月至1993年12月\n背面手写：6月16日夜班，20:00—次日08:00" },
    { title: "十二件衣物", caption: "寻人启事中的衣物描述复原陈列", clue: "twelve", src: "/photos/children-clothes.webp", meta: "沈砚资料夹 · 2009年翻拍" },
  ],
  3: [
    { title: "体检分组记录", caption: "同一张桌上的C17-01与C17-04", clue: "codes", src: "/photos/health-records.webp", meta: "郭宁的手机 · 2026/06/17", transcript: "潮生健康年度随访分组\nC17-01　郭维　心率观察\nC17-02　吴启明　服药复核\nC17-03　郭宁　夜间脑电\nC17-04　陶小雨　雾笛应答\n备注：四人列入同一观察页，编号并非员工号。" },
    { title: "白塔检修门", caption: "门禁日程显示03:17自动解锁", clue: "rescue", src: "/photos/lighthouse-door.webp", meta: "郭宁的手机 · 雨夜", transcript: "白塔东侧检修门\n门禁状态：锁定\n计划任务：03:17 自动解锁\n关联日程：LQ 转观察区\n门后通道：地下设备层 / 观察区" },
    { title: "郭家聚餐", caption: "饭局看起来和平常没有不同", clue: "", src: "/photos/family-dinner.webp", meta: "家庭共享相册 · 2026/05/02" },
  ],
} satisfies Record<number, { title: string; caption: string; clue: string; src: string; meta: string; transcript?: string }[]>;

const HINTS = [
  ["先确认母亲最后一次正常联系留下了哪些可核对的地点。", "比较宾馆、客轮和工作码头三套独立记录。", "打开微信里的‘妈妈’，再查地图中的潮生宾馆和客运码头。"],
  ["不要从姓名入手，先找各份记录里重复的字段。", "比较病区号、年龄、血型、衣物与转院编号。", "打开旧手机的文件与照片，再搜索‘乙区’和‘归潮号’。"],
  ["同一个编号可能在工作以外的系统里留下痕迹。", "比较家族群、健康账户、付款与雾笛日志。", "打开郭宁手机的微信与文件，再在证据板提交处置顺序。"],
];

type ChatLine = { side: "them" | "me" | "system"; text: string };
function conversationFor(chapter: number, thread: string): ChatLine[] {
  if (thread === "潮") return chapter === 1 ? [
    { side: "them", text: "到岛上了？雨大不大。" }, { side: "me", text: "刚停。宾馆的人说话都留半句，听着难受。" },
    { side: "them", text: "先吃饭。饿着的时候容易把猜测当事实。" }, { side: "me", text: "你怎么总能一下抓到重点？" },
    { side: "them", text: "我只是把你已经看见的东西，换个顺序放回去。" }, { side: "them", text: "一个人要离开岛，总得在某套记录里留下重量。" },
  ] : chapter === 2 ? [
    { side: "me", text: "十二张启事，十二个名字。我越看越像有人故意让我看不懂。" }, { side: "them", text: "那就先别看名字。名字最容易被改。" },
    { side: "them", text: "年龄、衣服、转院章，挑两样不会一起撒谎的。" }, { side: "me", text: "你小时候是不是特别会整理错题？" },
    { side: "them", text: "不记得了。可能我只是讨厌别人把人写成编号。" },
  ] : [
    { side: "them", text: "你找到她的位置了？" }, { side: "me", text: "差不多。但名单也在我手里。" },
    { side: "them", text: "先把救人的路线和公开证据分开。名单里不只有坏人。" }, { side: "me", text: "你今天说话特别像我妈。" },
    { side: "them", text: "那你就当有两个人催你别逞强。" },
  ];
  const chats: Record<string, ChatLine[]> = {
    "1:妈妈": [
      { side: "them", text: "你上次买的那个护膝到了，颜色比照片深。" }, { side: "me", text: "能戴就行，别又舍不得拆。" },
      { side: "them", text: "我到雾港了，住潮生宾馆306。房间有点潮。" }, { side: "me", text: "后天几点的船？我去接你。" },
      { side: "them", text: "事情办完再买。冰箱第二层有汤，别又点外卖。" },
    ],
    "1:潮生宾馆": [
      { side: "them", text: "您好，这里是潮生宾馆前台。您问的是306房林琴女士吗？" }, { side: "me", text: "对。她两天没回消息，麻烦帮我敲一下门。" },
      { side: "them", text: "行李还在房里。门卡15日21:48刷出后没有再刷回，我们已经向老板报告了。" },
      { side: "me", text: "她没有本地亲戚。如果回来请马上联系我，也请不要移动她的东西。" }, { side: "them", text: "明白，我姓蒋，今天白班。已经给您备注。" },
    ],
    "1:陈放": [
      { side: "them", text: "你的35定焦还在我这，遮光罩磕了一点，不影响用。" }, { side: "me", text: "先放着，我回来再拿。电池帮我充一下。" },
      { side: "them", text: "你又临时出差？" }, { side: "me", text: "去找我妈。她在雾港失联了。" },
      { side: "them", text: "定位发我。需要我过去就说，别自己往废码头钻。" },
    ],
    "1:蒋小蕊": [
      { side: "them", text: "林姐，我是刚才接电话的前台小蒋。警察看完房间了，您妈妈的旧手机和一个帆布包先登记封存。" },
      { side: "me", text: "谢谢。房间昨晚有人进去过吗？" }, { side: "them", text: "保洁没有。老板有总卡，但系统里没显示开门。您到了我把打印记录给您看。" },
      { side: "me", text: "好。你先别跟老板争，我到了再说。" }, { side: "them", text: "嗯，路上慢点，码头地砖下雨很滑。" },
    ],
    "2:沈砚（旧号码）": [
      { side: "them", text: "别从姓名入手。那十二个名字里至少七个是后来补的。" }, { side: "me", text: "你到底是谁？为什么用沈砚的号码？" },
      { side: "them", text: "先看年龄、衣物、转院章。周岚当晚带走的不是病历，是人。" }, { side: "me", text: "你认识我母亲？" },
      { side: "them", text: "她比她自己记得的更早认识雾港。" },
    ],
    "2:妈妈": [
      { side: "me", text: "妈，医生说你最近又忘记关火。要不换个带定时的灶？" }, { side: "them", text: "是汤扑了，不是忘了。你别听陈姨夸张。" },
      { side: "me", text: "那周六复诊我陪你。" }, { side: "them", text: "不用，你拍你的。我认得路。" },
      { side: "me", text: "你每次说认得路我就更不放心。" }, { side: "them", text: "知道了，小管家。" },
    ],
    "2:许医生": [
      { side: "them", text: "林琴这次量表比三月稳定，但旧事刺激仍会诱发短时记忆混乱。药先不加量。" },
      { side: "me", text: "她总梦见潮水和孩子唱歌，这算旧事吗？" }, { side: "them", text: "梦的内容不能直接当记忆。先记录频率、睡眠和当天接触过的信息。" },
      { side: "me", text: "明白，我把最近三周的表发您。" },
    ],
    "3:郭家健康群": [
      { side: "them", text: "本月C组复查改到周五，早餐后不要自行加药。" }, { side: "me", text: "我周五有模拟考，能不能下周去？" },
      { side: "them", text: "不能。今晚03:17转观察区，C组家属不要靠近白塔。" }, { side: "me", text: "为什么每次体检都不让我们看报告？" },
      { side: "them", text: "这是为了你们的健康，也是为了这个家。" },
    ],
    "3:爸爸": [
      { side: "them", text: "晚上回来吃饭，你姑带了黄鱼。" }, { side: "me", text: "我在陶小雨店里写卷子，晚一点。" },
      { side: "them", text: "十点前回来，明早还要抽血。" }, { side: "me", text: "又抽？上个月才抽过。" },
      { side: "them", text: "别跟家里闹。你的药、学校名额、以后出岛，哪样不是大家替你安排。" },
    ],
    "3:吴医生": [
      { side: "them", text: "药袋上如果还是17·01，拍照发我，不要和小雨的混用。" }, { side: "me", text: "我们明明吃的是同一种药。" },
      { side: "them", text: "剂量不同。最近还听见那首儿歌吗？" }, { side: "me", text: "她也听见了。可我们小时候不认识。" },
      { side: "them", text: "先别在群里说。把时间记下来。" },
    ],
    "3:陶小雨": [
      { side: "them", text: "你伞还在店里，蓝色那把。" }, { side: "me", text: "帮我放收银台下面，明天拿。" },
      { side: "them", text: "你爸刚来问过你。脸色很差。" }, { side: "me", text: "他一提体检就这样。你今天药袋拍了吗？" },
      { side: "them", text: "拍了。还是C17/04。晚上我又梦见那个没窗的走廊。" },
    ],
  };
  return chats[`${chapter}:${thread}`] || [
    { side: "them", text: "今天风大，回来的船比平时晚了十分钟。" }, { side: "me", text: "知道了，路上注意安全。" },
  ];
}

const avatarFor = (name: string) => name === "潮" ? "/avatars/tide.webp" : name.includes("妈妈") || name === "爸爸" || name.includes("郭家")
  ? "/avatars/mom.webp" : name.includes("宾馆") ? "/avatars/hotel-key.webp" : name.includes("医生") || name.includes("沈砚")
  ? "/avatars/doctor.webp" : name.includes("陶") || name.includes("蒋") ? "/avatars/clerk.webp" : "/avatars/chen.webp";

const replyChoicesFor = (chapter:number, name:string) => {
  if(name === "潮") return chapter === 1 ? ["如果她没有离岛，还能藏在哪里？","我应该先核对哪两份记录？","那些重复编号值得查吗？"] : chapter === 2 ? ["为什么不能先查姓名？","十二份记录该怎么排？","归潮号和乙区有什么关系？"] : ["今晚应该先救人还是先公开？","你到底是谁？","白塔下面真的有人吗？"];
  if(name === "妈妈") return ["你现在还在宾馆吗？","我明天去接你。","看到消息马上回我。"];
  if(name.includes("宾馆")) return ["请不要动306里的东西。","能把门卡记录发给我吗？","你们什么时候发现她没回来？"];
  if(name.includes("郭家")) return ["体检原始报告在哪里？","今晚我不去白塔。","编号是谁定的？"];
  if(name === "爸爸") return ["把我的体检报告发来。","你们到底在保护谁？","我今晚不会回家。"];
  return ["你最后一次见到她是什么时候？","能把原始记录拍给我吗？","这件事先别告诉别人。"];
};

const autoReplyFor = (chapter:number, name:string, text:string) => {
  if(name === "潮") return text.includes("谁") ? "等你找到TX-0817-12，名字会自己回来。" : text.includes("救人") ? "先把位置发到岛外，再进检修道。证据可以复制，人不能。" : text.includes("编号") ? "先记下它出现在哪些互不相干的地方，别急着给它命名。" : "把宾馆、客轮和工作码头按时间排一遍，缺口会自己露出来。";
  if(name === "妈妈") return "消息已发出，但一直没有送达。";
  if(name.includes("宾馆")) return text.includes("门卡") ? "可以。前台打印机有点慢，我拍清楚后发给您。" : "老板已经报警备案，306暂时封存，只有前台和民警能开门。";
  if(name.includes("郭家")) return "郭维：家里的事回家说，不要在群里讨论编号。";
  if(name === "爸爸") return text.includes("报告") ? "纸质原件不在我这里。你先回来，我当面解释。" : "你现在情绪不稳定，别一个人去白塔。";
  if(name.includes("陶") || name.includes("蒋")) return "我把照片原图留着了。下班以后当面给你看，微信里先别转发。";
  if(name.includes("医生")) return "我只能确认档案编号，涉及患者身份的部分需要本人到场申请。";
  return "我再翻一下手边的记录，找到原件就拍给你。";
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
  const [hint, setHint] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [thread, setThread] = useState("");
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [ending, setEnding] = useState<string | null>(null);

  useEffect(() => { try { const v = JSON.parse(localStorage.getItem("wugang-v5") || "null"); if (v) { setStarted(v.started); setChapter(v.chapter); setUnlocked(v.unlocked); setFound(v.found || []); } } catch {} }, []);
  useEffect(() => { localStorage.setItem("wugang-v5", JSON.stringify({ started, chapter, unlocked, found })); }, [started, chapter, unlocked, found]);

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
  const withTransition = (update: () => void) => {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(update);
    else update();
  };
  const openArea = (next: Area) => withTransition(() => { setArea(next); setApp("home"); setThread(""); setArticle(null); });
  const changeChapter = (n: number) => { if (n > unlocked) { notify("先完成当前章节的阶段结论"); return; } withTransition(() => { setChapter(n); setArea("phone"); setApp("home"); setThread(""); setSelected([]); setAnswer(""); }); };
  const toggleEvidence = (id: string) => setSelected(v => v.includes(id) ? v.filter(x => x !== id) : v.length < 4 ? [...v, id] : v);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (selected.length < 2) { notify(`先去调查。本章至少需要2份独立来源，你还缺${2 - selected.length}份。`); return; }
    if (!answer) { notify("先写下阶段判断，再用材料支撑它。"); return; }
    const required = chapter === 1 ? ["hotel-log", "ferry-list", "workboat"] : chapter === 2 ? ["ward", "ship", "nurse"] : ["codes", "rescue", "payments"];
    const supported = selected.filter(id => required.includes(id)).length >= 2;
    const correct = answer === (chapter === 1 ? "island" : chapter === 2 ? "transfer" : "rescue-first");
    if (!supported || !correct) { notify("这组材料还不足以支撑整个判断，请换两份独立来源"); return; }
    if (chapter < 3) { setUnlocked(chapter + 1); setChapter(chapter + 1); setArea("phone"); setApp("home"); setSelected([]); setAnswer(""); notify(`第${chapter + 1}章已开启：设备已切换`); }
    else setEnding("truth");
  };
  const reset = () => { localStorage.removeItem("wugang-v5"); setStarted(false); setChapter(1); setUnlocked(1); setFound([]); setEnding(null); setArea("phone"); setApp("home"); };

  if (!started) return <main className="cover">
    <div className="cover-noise" />
    <div className="island-mark"><span /><i /></div>
    <section className="cover-copy">
      <p className="edition">雾港岛失踪人口协查 · 2026/06/16</p>
      <h1>雾港来信</h1>
      <p className="subtitle">一座有正常船班、正常网络和正常居民的岛。<br />你的母亲进去了，却没有任何一份记录能证明她出来过。</p>
      <button className="primary" onClick={() => setStarted(true)}>登岛确认物品</button>
      <div className="rules"><span>探寻</span><span>搜索</span><span>记录</span><small>结论必须由两份独立材料支撑</small></div>
    </section>
    <aside className="opening-card"><b>最后一条微信</b><time>6月14日 18:42</time><p>到了，住潮生宾馆306。房间有点潮。冰箱第二层有汤，别又点外卖。</p><em>——妈妈</em></aside>
  </main>;

  if (ending) return <main className="ending">
    <p>TRUE ENDING · 名字归岸</p><h1>先救人，再让证据说话。</h1>
    <div className="ending-text"><p>郭宁关闭雾笛，吴启明交出第三代观察记录。你沿白塔检修道找到林琴，把救援位置、低潮时间和三套证据分别发给岛外警方、律师与媒体。</p><p>引水洞里的归潮号终于被找到。受害者姓名由家属确认，无辜受体的医疗隐私没有成为猎奇标题。</p><p>恢复的移植原件给了你最后一个名字：<b>叶知潮，十二岁，死亡于2008年8月17日。</b>同一天，九岁的林岚接受急诊肝移植。你再打开微信，“潮”的会话不存在；系统从未记录过这个联系人。</p><p>他没有替你找到任何线索。他只是把你已经看见的东西，换个顺序放回去。</p><div className="post-record"><span>档案反查 / TX-0817-12</span><strong>叶知潮死亡登记　↔　林岚移植随访证明</strong><small>签发机构相距342公里，经办人却属于同一间潮生康养院。</small></div><p>监护设备停下后，空病房录到一句孩子的声音：“这次有人记得我们了。”房里没有音频设备。</p></div>
    <button className="primary" onClick={reset}>重新调查</button>
  </main>;

  return <main className="game-shell">
    {toast && <div className="toast">{toast}</div>}
    {collectionNotice && <div className="collection-modal" role="dialog" aria-modal="true"><article><small>线索已收录 · {CHAPTERS[collectionNotice.chapter-1].title}</small><h2>{collectionNotice.title}</h2><b>{collectionNotice.source}</b><p>{collectionNotice.text}</p><button onClick={()=>setCollectionNotice(null)}>我已查看</button></article></div>}
    <header className="topbar">
      <button className="brand" onClick={() => openArea("phone")}>雾港来信 <small>调查记录 0616</small></button>
      <div className="chapter-tabs">{CHAPTERS.map(c => <button key={c.no} className={chapter === c.no ? "active" : ""} onClick={() => changeChapter(c.no)}><span>0{c.no}</span>{c.title}{c.no > unlocked && <i>锁</i>}</button>)}</div>
      <button className="help" onClick={() => setHint(v => v >= 3 ? 0 : v + 1)}>需要帮助 {hint ? `${hint}/3` : ""}</button>
    </header>

    <section className="mission">
      <div><span>当前设备</span><b>{CHAPTERS[chapter - 1].device}</b></div>
      <div className="question"><span>本章调查问题</span><strong>{CHAPTERS[chapter - 1].question}</strong></div>
      <div className="chapter-progress"><b>{collected.length}</b> / {chapterClues.length}<span>相关材料</span></div>
    </section>
    {hint > 0 && <div className="hint-strip"><b>提示 {hint}</b><p>{HINTS[chapter - 1][hint - 1]}</p><button onClick={() => setHint(0)}>收起</button></div>}

    <div className="workspace">
      <nav className="rail">
        {([ ["phone","手机","机"], ["browser","档案搜索","搜"], ["map","岛内地图","图"], ["evidence","调查手记","证"], ["board","阶段结论","结"] ] as [Area,string,string][]).map(([id,label,icon]) => <button key={id} className={area === id ? "active" : ""} onClick={() => openArea(id)}><i>{icon}</i><span>{label}</span>{id === "evidence" && collected.length > 0 && <em>{collected.length}</em>}</button>)}
      </nav>

      <section className="content" key={`${area}-${chapter}`}>
        {area === "phone" && <Phone chapter={chapter} app={app} setApp={setApp} thread={thread} setThread={setThread} collect={collect} found={found} playing={playing} setPlaying={setPlaying} track={track} setTrack={setTrack} notify={notify} />}
        {area === "browser" && <Browser query={query} setQuery={setQuery} results={results} article={article} setArticle={setArticle} collect={collect} found={found} chapter={chapter} />}
        {area === "map" && <MapPanel chapter={chapter} collect={collect} found={found} notify={notify} />}
        {area === "evidence" && <Evidence found={found} chapter={chapter} />}
        {area === "board" && <Board chapter={chapter} collected={collected} selected={selected} toggle={toggleEvidence} answer={answer} setAnswer={setAnswer} submit={submit} investigate={() => openArea("phone")} />}
      </section>
    </div>
  </main>;
}

function Phone({ chapter, app, setApp, thread, setThread, collect, found, playing, setPlaying, track, setTrack, notify }: any) {
  const messages: Record<number, string[]> = { 1: ["潮", "妈妈", "潮生宾馆", "陈放", "蒋小蕊"], 2: ["潮", "沈砚（旧号码）", "妈妈", "许医生"], 3: ["潮", "郭家健康群", "爸爸", "吴医生", "陶小雨"] };
  const photos = PHOTO_SETS[chapter as 1 | 2 | 3] as Array<{title:string;caption:string;clue:string;src:string;meta:string;transcript?:string}>;
  const tracks = ["内湾晴天", "返程票", "二楼走廊", "夜船不开", "未命名录音"];
  const orders = [{name:"防潮相机袋",icon:"袋",status:"交易成功",detail:"深灰色 · 单肩防水款",price:"¥79.00",logistics:["6月9日 14:12 已签收","6月9日 09:30 到达雾港客运站","6月8日 18:05 临海转运中心发出"]},{name:"速溶咖啡 20条",icon:"咖",status:"交易成功",detail:"无糖黑咖啡 · 20条",price:"¥32.80",logistics:["6月11日 16:40 前台代收","6月11日 11:20 随客轮进岛"]},{name:"白色运动鞋",icon:"鞋",status:"交易成功",detail:"37码 · 米白色",price:"¥159.00",logistics:["5月28日 19:08 本人签收","5月28日 13:10 派送中"]},{name:"给妈妈的护膝",icon:"礼",status:"已签收",detail:"保暖护膝 · 深灰 · M码",price:"¥68.00",logistics:["6月13日 17:46 潮生宾馆前台代收","6月13日 16:55 到达老街配送点","6月12日 20:20 临海转运中心发出"]}];
  const phoneFiles = chapter === 1 ? [["客轮实名订单.pdf","仅有登岛票","ferry-list"],["工作船说明.txt","郭维口述", "workboat"]] : chapter === 2 ? [["1992_乙区值班表.pdf","扫描件 · 4页","nurse"],["归潮号港务内参.pdf","公开版已删除","ship"],["2009_就诊备忘.txt","林琴自述","qin-note"]] : [["第三代观察表.xlsx","内部导出","codes"],["冷链付款对账.pdf","三套系统日期一致","payments"],["今晚处置日程.ics","03:17 观察区","rescue"],["雾笛反应日志.m4a","原始录音","fog-horn"],["林岚_儿童移植随访.pdf","供体姓名已遮盖","lan-transplant"]];
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
  const [wechatTab,setWechatTab]=useState<"chats"|"contacts"|"discover"|"me">("chats");
  const [wechatSub,setWechatSub]=useState("");
  const [selectedOrder,setSelectedOrder]=useState<(typeof orders)[number]|null>(null);
  const [selectedFile,setSelectedFile]=useState<any[]|null>(null);
  const [noteOpen,setNoteOpen]=useState(false);
  const [weatherMode,setWeatherMode]=useState<"hourly"|"daily">("hourly");
  const [musicProgress,setMusicProgress]=useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setMusicProgress(value=>value>=100?0:value+1),1200);return()=>window.clearInterval(timer)},[playing,track]);
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
  const phoneDay = now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const signalLevel = airplaneOn || !mobileOn ? 0 : 2 + (now.getMinutes() % 3);
  const transition = (update: () => void) => {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(update);
    else update();
  };
  const openApp = (next: AppId) => {
    if (next === "weather" && chapter === 1 && !found.includes("weather")) collect("weather");
    if (next === "notes" && chapter === 2 && !found.includes("qin-note")) collect("qin-note");
    transition(() => { setThread(""); setWechatSub(""); setSelectedOrder(null); setSelectedFile(null); setNoteOpen(false); setApp(next); });
  };
  const openThread = (name: string) => {
    const clue = chapter === 1 && name === "妈妈" ? "last-chat" : chapter === 1 && name === "潮生宾馆" ? "hotel-log" : chapter === 2 && name === "沈砚（旧号码）" ? "twelve" : chapter === 3 && name === "郭家健康群" ? "family-group" : "";
    if (clue && !found.includes(clue)) collect(clue);
    transition(() => { setThread(name); setComposer(null); setVoiceMode(false); });
  };
  const appendMessage = (name:string,line:ChatLine) => setSentMessages(value => ({...value,[`${chapter}:${name}`]:[...(value[`${chapter}:${name}`]||[]),line]}));
  const sendPreset = (text:string) => {
    appendMessage(thread,{side:"me",text}); setComposer(null);
    window.setTimeout(() => appendMessage(thread,{side:"them",text:autoReplyFor(chapter,thread,text)}), 650);
  };
  const sendAttachment = (kind:string) => {
    const content = kind === "位置" ? "[位置] 雾港岛 · 归潮广场" : kind === "照片" ? "[照片] 白塔东侧检修门" : "[文件] 港务记录摘录.pdf";
    appendMessage(thread,{side:"me",text:content}); setComposer(null);
    window.setTimeout(() => appendMessage(thread,{side:"them",text:kind === "位置" ? "位置收到了。别从东段步道走，那里围栏是新换的。" : "收到了，我先保存原件，不转发。"}), 650);
  };
  const back = () => transition(() => { setThread(""); setComposer(null); setWechatSub(""); setSelectedOrder(null); setSelectedFile(null); setNoteOpen(false); setApp("home"); });
  return <div className="phone-stage"><div className={`phone phone-${chapter}`} onTouchStart={event => {
    const y = event.touches[0].clientY;
    const phoneTop = event.currentTarget.getBoundingClientRect().top;
    setTouchStart(y - phoneTop <= 64 ? y : null);
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
        <div className="control-bottom"><button className={torchOn?"active":""} onClick={() => setTorchOn(value=>!value)}>灯</button><button onClick={() => notify("计时器：00:00:00")}>计</button><button onClick={() => notify("计算器已准备")}>算</button><button onClick={() => openApp("photos")}>相</button></div>
        <button className="control-handle" onClick={() => setControlOpen(false)} aria-label="收起控制中心" />
      </div>
    </div>
    {app === "home" && <div className="phone-home">
      <div className="phone-date"><b>{phoneTime}</b><span>{phoneDay} · {chapter === 1 ? "阵雨" : "雾"}</span></div>
      <div className="app-grid">{APPS.map((a,i) => <button key={a.id} onClick={() => openApp(a.id)}><i className={`app-icon ai-${i}`}>{a.icon}</i><span>{a.name}</span>{((chapter === 1 && a.id === "messages") || (chapter === 2 && ["files","photos"].includes(a.id)) || (chapter === 3 && ["messages","files"].includes(a.id))) && <em />}</button>)}</div>
    </div>}
    {app === "messages" && <div className="phone-page message-page">
      {!thread ? <><PhoneHead title={wechatSub||({chats:"微信",contacts:"通讯录",discover:"发现",me:"我"} as any)[wechatTab]} back={wechatSub?()=>setWechatSub(""):back} backLabel={wechatSub?"发现":"桌面"} /><div className="wechat-section">
        {!wechatSub&&wechatTab==="chats"&&<div className="thread-list">{messages[chapter].map((m:string) => <button key={m} onClick={() => openThread(m)}><img className="thread-avatar" src={avatarFor(m)} alt=""/><span><strong>{m}</strong><small>{m.includes("妈妈") ? "到了，住潮生宾馆306……" : m === "潮" ? "我把你说的重新排了下。" : conversationFor(chapter,m).at(-1)?.text}</small></span><time>{m === "潮" ? phoneTime : "昨天"}</time></button>)}</div>}
        {!wechatSub&&wechatTab==="contacts"&&<div className="contact-list"><div className="contact-tools"><button onClick={()=>setWechatSub("新的朋友")}>＋<span>新的朋友</span></button><button onClick={()=>setWechatSub("群聊")}>群<span>群聊</span></button></div><p>联系人</p>{messages[chapter].map((m:string)=><button key={m} onClick={()=>openThread(m)}><img src={avatarFor(m)} alt=""/><span>{m}</span></button>)}</div>}
        {!wechatSub&&wechatTab==="discover"&&<div className="wechat-menu"><button onClick={()=>setWechatSub("朋友圈")}><i>◎</i><span>朋友圈</span><b>›</b></button><button onClick={()=>setWechatSub("扫一扫")}><i>⌗</i><span>扫一扫</span><b>›</b></button><button onClick={()=>setWechatSub("看一看")}><i>看</i><span>看一看</span><b>›</b></button></div>}
        {!wechatSub&&wechatTab==="me"&&<div className="wechat-me"><header><img src="/avatars/clerk.webp" alt=""/><div><b>林岚</b><span>微信号：lan_0616</span></div></header><div className="wechat-menu"><button onClick={()=>setWechatSub("收藏")}><i>☆</i><span>收藏</span><b>›</b></button><button onClick={()=>setWechatSub("文件")}><i>文</i><span>文件</span><b>›</b></button><button onClick={()=>setWechatSub("设置")}><i>⚙</i><span>设置</span><b>›</b></button></div></div>}
        {wechatSub&&<div className="wechat-subpage">{wechatSub==="朋友圈"?<><article><img src="/photos/venue-plaza.webp" alt=""/><b>蒋小蕊</b><p>今天广场电影取消了，椅子都收仓库了。</p></article><article><img src="/photos/venue-restaurant.webp" alt=""/><b>陈放</b><p>休渔期菜单，别问有没有刚上岸的。</p></article></>:wechatSub==="扫一扫"?<div className="scan-page"><i>⌗</i><p>将二维码放入框内，即可自动扫描</p><button onClick={()=>notify("相册中没有可识别的二维码")}>从相册选取</button></div>:wechatSub==="看一看"?<div className="look-page"><button onClick={()=>notify("文章已在微信内打开")}>雾港今晚末班船待复核</button><button onClick={()=>notify("文章已在微信内打开")}>白塔东段继续封闭</button></div>:wechatSub==="设置"?<div className="setting-page"><label>消息通知<input type="checkbox" defaultChecked/></label><label>听筒模式<input type="checkbox"/></label><button onClick={()=>notify("聊天记录已保留在本机")}>聊天记录迁移</button></div>:<div className="wechat-empty"><b>{wechatSub}</b><p>{wechatSub==="文件"?"最近文件会按会话来源保存在这里。":wechatSub==="群聊"?"郭家健康群将在第三章设备中出现。":"当前没有新的内容。"}</p></div>}</div>}
      </div><nav className="wechat-tabs">{([['chats','微信','◉'],['contacts','通讯录','♟'],['discover','发现','◎'],['me','我','●']] as const).map(([id,label,icon])=><button key={id} className={wechatTab===id?"active":""} onClick={()=>{setWechatTab(id);setWechatSub("");}}><i>{icon}</i><span>{label}</span></button>)}</nav></> : <><PhoneHead title={thread} back={() => transition(() => setThread(""))} backLabel="微信" />
      <div className="conversation"><div className="chat-day">{phoneDay}</div>{[...conversationFor(chapter, thread),...(sentMessages[`${chapter}:${thread}`]||[])].map((line, index) => line.side === "system" ? <time className="system-note" key={index}>{line.text}</time> : <div className={`chat-row ${line.side}`} key={index}>{line.side === "them" && <img src={avatarFor(thread)} alt=""/>}<p className={`bubble ${line.side}`}>{line.text}</p>{line.side === "me" && <img src="/og.png" alt=""/>}</div>)}</div>
      {composer === "replies" && <div className="composer-sheet reply-sheet"><header><b>选择一句回复</b><button onClick={()=>setComposer(null)}>关闭</button></header>{replyChoicesFor(chapter,thread).map(text=><button key={text} onClick={()=>sendPreset(text)}>{text}<span>发送</span></button>)}</div>}
      {composer === "emoji" && <div className="composer-sheet emoji-sheet"><header><b>表情</b><button onClick={()=>setComposer(null)}>关闭</button></header><div>{["🙂","😟","👌","🙏","❓","🌫️","📍","⚠️"].map(icon=><button key={icon} onClick={()=>sendPreset(icon)}>{icon}</button>)}</div></div>}
      {composer === "more" && <div className="composer-sheet more-sheet"><header><b>更多</b><button onClick={()=>setComposer(null)}>关闭</button></header><div>{["照片","位置","文件"].map((kind,i)=><button key={kind} onClick={()=>sendAttachment(kind)}><i>{["▧","⌖","文"][i]}</i><span>{kind}</span></button>)}</div></div>}
      <div className="wechat-input"><button className={voiceMode?"active":""} onClick={()=>{setVoiceMode(value=>!value);setComposer(null);}} aria-label="切换语音输入">◉</button><button className="composer-field" onClick={()=>voiceMode?sendPreset("[语音] 3″"):setComposer(composer==="replies"?null:"replies")}>{voiceMode?"按住说话":"发消息"}</button><button onClick={()=>setComposer(composer==="emoji"?null:"emoji")} aria-label="打开表情">☺</button><button onClick={()=>setComposer(composer==="more"?null:"more")} aria-label="打开更多">＋</button></div></>}
    </div>}
    {app === "photos" && <div className="phone-page"><PhoneHead title="照片" back={back}/><div className="photo-grid">{photos.map(photo => <button key={photo.title} onClick={() => { setPhotoOpen(photo as any); setTranscriptOpen(false); if (photo.clue && !found.includes(photo.clue)) collect(photo.clue); }}><img src={photo.src} alt={photo.title}/><b>{photo.title}</b><span>{photo.caption}</span>{photo.clue && found.includes(photo.clue) && <em>已收录</em>}</button>)}</div>{photoOpen && <div className="photo-viewer"><button className="photo-close" onClick={() => { setPhotoOpen(null); setTranscriptOpen(false); }}>关闭</button><button className="photo-image-button" onClick={() => setTranscriptOpen(true)}><img src={photoOpen.src} alt={photoOpen.title}/><span>点击查看文字内容</span></button><div><b>{photoOpen.title}</b><p>{photoOpen.caption}</p><small>{photoOpen.meta}</small></div>{transcriptOpen && <div className="transcript-modal" role="dialog" aria-modal="true"><article><small>照片文字抄录</small><h3>{photoOpen.title}</h3><p>{photoOpen.transcript || `${photoOpen.caption}\n${photoOpen.meta}`}</p><button onClick={() => setTranscriptOpen(false)}>关闭文字内容</button></article></div>}</div>}</div>}
    {app === "files" && <div className="phone-page"><PhoneHead title="文件" back={back}/><div className="file-list">
      {(chapter === 1 ? [["客轮实名订单.pdf","仅有登岛票","ferry-list"],["工作船说明.txt","郭维口述", "workboat"]] : chapter === 2 ? [["1992_乙区值班表.pdf","扫描件 · 4页","nurse"],["归潮号港务内参.pdf","公开版已删除","ship"],["2009_就诊备忘.txt","林琴自述","qin-note"]] : [["第三代观察表.xlsx","内部导出","codes"],["冷链付款对账.pdf","三套系统日期一致","payments"],["今晚处置日程.ics","03:17 观察区","rescue"],["雾笛反应日志.m4a","原始录音","fog-horn"],["林岚_儿童移植随访.pdf","供体姓名已遮盖","lan-transplant"]]).map((f:any) => <button key={f[0]} onClick={() => collect(f[2])}><i>文</i><span><b>{f[0]}</b><small>{f[1]}</small></span><em>{found.includes(f[2]) ? "✓" : "打开"}</em></button>)}
    </div></div>}
    {app === "notes" && <div className="phone-page"><PhoneHead title="备忘录" back={back}/><article className="note-paper"><h3>{chapter === 1 ? "去雾港前" : chapter === 2 ? "如果又忘了" : "我不想继续体检"}</h3><p>{chapter === 1 ? "相机、充电线、雨衣。先去宾馆，再去派出所。不要把妈妈以前的记忆问题告诉不相干的人。" : chapter === 2 ? "沈砚说，公开名单前先分清失踪者、受体和后代。有人做了坏事，不等于岛上每个人都知道。" : "爸爸说这是保护，说奖学金、药和出岛名额都靠家里。可是为什么保护一个人，需要删掉她做过的梦？"}</p></article></div>}
    {app === "shopping" && <div className="phone-page lifestyle taobao-page"><PhoneHead title="手机淘宝" back={back}/><input placeholder="搜索淘宝商品"/><h3>我的订单</h3>{["防潮相机袋","速溶咖啡 20条","白色运动鞋","给妈妈的护膝"].map((x,i)=><button key={x} onClick={()=>notify(i===3?"物流：6月13日已由林琴签收":"订单详情已打开")}><i>{["袋","咖","鞋","礼"][i]}</i><span><b>{x}</b><small>{i===3?"已签收 · 潮生宾馆代收":"交易成功 · 再次购买"}</small></span></button>)}</div>}
    {app === "music" && <div className="phone-page lifestyle"><PhoneHead title="泊声音乐" back={back}/><div className="album"><i>泊</i><div><b>{tracks[track]}</b><span>林岚的通勤收藏</span></div><button onClick={()=>setPlaying(!playing)}>{playing?"暂停":"播放"}</button></div>{tracks.map((t,i)=><button className={track===i?"playing":""} key={t} onClick={()=>{setTrack(i);setPlaying(true)}}><span>{String(i+1).padStart(2,"0")}</span><b>{t}</b><small>{2+i}:1{i}</small></button>)}</div>}
    {app === "weather" && <div className="phone-page"><PhoneHead title="天气" back={back}/><div className="weather-card"><b>雾港岛</b><strong>19°</strong><p>阵雨转平流雾</p><ul><li>16:00　能见度下降预警</li><li>18:30　复核20:10末班船</li><li>通信　正常</li></ul></div></div>}
  </div><aside className="phone-caption"><b>{CHAPTERS[chapter-1].device}</b><p>{chapter === 1 ? "使用习惯：摄影、出行、给母亲买东西。" : chapter === 2 ? "无SIM卡。资料被刻意拆散，但没有谜语密码。" : "家族管理渗进健康、学校和日常聊天。"}</p></aside></div>;
}

function PhoneHead({title,back,backLabel="桌面"}:{title:string;back:()=>void;backLabel?:string}) { return <header className="phone-head"><button onClick={back}>‹ {backLabel}</button><b>{title}</b><span /></header> }

function Browser({ query, setQuery, results, article, setArticle, collect, found, chapter }: any) {
  const openArticle = (next: Article) => { const clue = next.id === "a23" ? "weather" : next.id === "a31" ? "workboat" : next.id === "a28" && chapter >= 2 ? "ship" : ""; if (clue && !found.includes(clue)) collect(clue); setArticle(next); };
  if (article) return <div className="browser-page article-page"><header className="browser-bar"><button onClick={()=>setArticle(null)}>← 返回结果</button><span>archive.wugang.local / {article.id}</span></header><article><div className="article-meta"><span>{article.tag}</span><time>{article.date}</time></div><h1>{article.title}</h1><div className="article-byline"><b>{article.source || "雾港地方资料库"}</b><span>{article.author || "资料整理员"}</span><time>发布于 {article.date}</time></div><p className="lead">{article.excerpt}</p>{article.image&&<figure><img src={article.image} alt=""/><figcaption>{article.caption||`${article.title}相关现场资料图，图片时间以正文记录为准。`}</figcaption></figure>}{article.deleted && <div className="deleted">原页面已删除。当前内容来自搜索摘要、RSS与纸质剪报交叉恢复。</div>}{article.redacted && <p>公开档案中的经办人：<mark>　　　　　　</mark>。遮盖由2026年数字化整理时添加，理由为“个人信息”。</p>}{article.body.map((p:string,i:number)=><p key={i}>{p}</p>)}<footer className="article-footer">资料编号 {article.id.toUpperCase()} · 页面按原发布来源整理；修订与删除状态单独保留。</footer></article></div>;
  return <div className="browser-page"><header className="browser-bar"><span>今日雾港</span><form onSubmit={(e)=>e.preventDefault()}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索地点、机构、年份或事件"/><button>搜索</button></form></header>
    {!query && <section className="portal-hero"><div><p>2026年6月16日　星期二</p><h1>今日雾港</h1><span>19°C　阵雨转雾　末班船待复核</span></div><aside><b>航班提醒</b><p>20:10客轮是否开航，将于18:30根据能见度决定。</p></aside></section>}
    <div className="browser-layout"><div><div className="result-head"><b>{query ? `“${query}”的结果` : "本地资讯与档案"}</b></div>{results.length ? <div className="article-list">{results.map((a:Article)=><button key={a.id} onClick={()=>openArticle(a)}><div><span>{a.tag}</span><time>{a.date}</time>{a.deleted&&<em>原页删除</em>}</div><h3>{a.title}</h3><p>{a.excerpt}</p></button>)}</div> : <div className="no-result"><b>没有找到完全匹配的页面</b><p>可以更换地点、机构或年份重新搜索。</p></div>}</div>
    <aside className="browser-side"><h3>资料分类</h3>{[{label:"岛内新闻",q:"雾港"},{label:"生活商业",q:"生活"},{label:"历史民俗",q:"民俗"},{label:"1992事故",q:"1992"},{label:"健康教育",q:"健康"}].map(item=><button key={item.label} onClick={()=>setQuery(item.q)}>{item.label}</button>)}</aside></div>
  </div>;
}

function MapPanel({chapter,collect,found,notify}:any) {
  const defaultPlace=chapter===1?"客运码头":chapter===2?"地方陈列馆":"白塔";
  const [place,setPlace]=useState(defaultPlace);
  const [inside,setInside]=useState<string | null>(null);
  const [event,setEvent]=useState<{title:string;text:string;image:string}|null>(null);
  const chapterOne:Record<string,{sub:string;desc:string;image:string;actions:[string,string,string?][]}>={
    "客运码头":{sub:"北岸渡口",desc:"实名客轮每日四班，候船厅与售票窗口仍在营业。",image:"/photos/venue-terminal.webp",actions:[["查询实名航班","自助终端显示：林琴6月14日16:30登岛，之后没有离岛核验。","ferry-list"],["询问售票员","售票员翻了纸质补票册：这两天没有林琴，也没有使用她证件的旅客。"]]},
    "潮生宾馆":{sub:"老街东口",desc:"一间经营二十余年的家庭宾馆，前台能调取门卡与监控。",image:"/photos/venue-hotel.webp",actions:[["请前台打印门卡记录","306房6月15日21:48最后一次刷出，此后没有开门。行李仍在房内。","hotel-log"],["查看寄存柜","前台打开寄存柜，林琴没有留下房卡或退房凭据。"]]},
    "潮声便利店":{sub:"归潮广场西侧",desc:"二十四小时营业，收银台上贴着三张轮班表。",image:"/photos/clerk-badge.webp",actions:[["和夜班店员交谈","陶小雨说林琴来买过矿泉水，问过白塔东段为什么封路。她胸前的号码分成上下两栏。","badge1704"],["查看小票箱","6月15日22点后的废票还在，但没有找到林琴的付款记录。"]]},
    "望潮饭店":{sub:"内湾堤岸",desc:"晚市以工作码头的工人为主，后厨九点半熄火。",image:"/photos/venue-restaurant.webp",actions:[["坐下点餐","老板端来海蛎煎，问你是不是林琴的女儿。他记得她问过一艘夜间工作船。"],["听邻桌说话","装卸工说旧港22:20有船离泊，但那晚没人加油，也没有卸货回执。","workboat"]]},
    "归潮广场":{sub:"镇中心",desc:"公交、露天电影和居民活动都集中在这里。",image:"/photos/venue-plaza.webp",actions:[["阅读航班公告","公告栏保留着6月16日晚班船因平流雾取消的通知。","weather"],["看露天电影排片","今晚放映《海街旧事》，旁边坐着等末班公交的学生。广场看起来一切正常。"]]},
    "旧港冷链":{sub:"西侧工作码头",desc:"冷库仍在运转，门岗要求货车出示装卸单。",image:"/photos/venue-cold-chain.webp",actions:[["查看门岗登记夹","22:20工作船登记了三名船员，但加油量为0，目的港没有回执。","workboat"],["询问门卫","门卫说夜班名单每月都换，编号比姓名更好记。他拒绝让你进入库区。"]]},
    "白塔":{sub:"北坡尽头",desc:"旧雾笛塔兼作航标，东侧检修路长期封闭。",image:"/photos/lighthouse-door.webp",actions:[["查看封闭告示","告示落款是港务站，封闭理由为边坡维护，日期却被雨水泡掉。"],["绕塔查看","塔后能听见稳定的机械声，但检修门需要内部门禁。"],["查看雾笛时刻表","公开时刻表只记录航标播报，没有人员名单。"]]}
  };
  const chapterTwo:typeof chapterOne={
    "地方陈列馆":{sub:"老街北口",desc:"旧港、学校与康养院的纸本档案在这里数字化。",image:"/photos/nurse-id-1992.webp",actions:[["查转院单目录","四张来自不同县市的转院单，都留下潮生康养院乙区印章。","ward"],["申请查看值班表","1992年6月16日夜班护士为周岚，23:10后十二个床位被手写改动。","nurse"]]},
    "潮生康养院旧址":{sub:"南坡尽头",desc:"主楼正在修缮，乙区旧病房没有进入施工范围。",image:"/photos/venue-hotel.webp",actions:[["查看施工平面图","公开平面图没有地下层，乙区被标成‘权属待核’。"],["拍摄乙区旧章","门房抽屉里的旧章与四张转院单残留的椭圆章一致。","ward"]]},
    "旧港仓库":{sub:"西侧六码头",desc:"废弃木仓旁保留着1992年的船具领用房。",image:"/photos/venue-cold-chain.webp",actions:[["翻阅船具领用簿","归潮号核载6人，当晚却领走17件救生衣。","ship"],["查看封存铁柜","铁柜贴有2009年调查机关封条，右下角已经翘起。"]]},
    "许伯钟表铺":{sub:"老街中段",desc:"火灾后重新开过门，墙上的钟仍慢七分钟。",image:"/photos/clerk-badge.webp",actions:[["询问2009年火灾","许伯只记得火前有人来取一只铁盒，没留下姓名。"],["核对旧报时间","报警记录比报纸写的起火时间早八分钟。"]]},
    "客运码头":{sub:"北岸渡口",desc:"陈列馆移交记录里，有一批档案从这里运往大陆。",image:"/photos/venue-terminal.webp",actions:[["查1992年工作船","公开客轮系统查不到归潮号，它登记在工作船名录。","ship"],["问旧站务员","他记得事故后几天，码头曾连夜运走一批病床。"]]},
    "白塔":{sub:"北坡尽头",desc:"旧雾笛时刻与归潮号事故发生在同一晚。",image:"/photos/lighthouse-door.webp",actions:[["查看旧时刻表","1992年6月16日23:10后有一次未说明原因的人工播报。"],["看塔内维修签名","维修栏里‘周岚’两个字与护士值班表同名，但笔迹不同。"]]}
  };
  const chapterThree:typeof chapterOne={
    "白塔":{sub:"北坡尽头 · 03:17",desc:"检修门将在低潮时自动解锁，门后通向地下观察区。",image:"/photos/lighthouse-door.webp",actions:[["检查检修门","门禁日程显示03:17自动解锁，关联任务为‘LQ转观察区’。","rescue"],["进入雾笛控制室","日志逐项记录低潮、姓名应答和生理数值。","fog-horn"]]},
    "地下观察区":{sub:"白塔下层",desc:"平面图中没有这个房间，电力来自旧港冷链备用线。",image:"/photos/health-records.webp",actions:[["查看床位终端","终端按A、B、C分组显示对象，C17-01至04在同一页。","codes"],["确认林琴位置","LQ的生命体征仍在，转运状态显示‘等待03:17’。","rescue"]]},
    "旧港冷链":{sub:"西侧工作码头",desc:"夜间仍有一条电缆和一辆无牌冷藏车在运行。",image:"/photos/venue-cold-chain.webp",actions:[["核对三份单据","运输单、康养院耗材单和境外付款回执日期相同。","payments"],["拍下无牌冷藏车","车厢没有货物，地板固定着四组医疗设备卡槽。"]]},
    "郭家旧宅":{sub:"归潮广场东巷",desc:"郭家的健康群、奖学金和出岛申请都由这里统一处理。",image:"/photos/family-dinner.webp",actions:[["查看家庭群公告","群公告把体检、服药和出岛申请写在同一张表里。","family-group"],["翻药箱标签","四个药袋分别写着C17-01至C17-04。","codes"]]},
    "引水洞":{sub:"旧港北侧海蚀通道",desc:"普通地图没有标注，退潮后入口才露出半米。",image:"/photos/wugang-aerial.webp",actions:[["核对潮位","03:17前后有二十二分钟可通行窗口。","rescue"],["查看洞口拖痕","新鲜轮痕从冷链码头方向一直延伸到水线。"]]},
    "客运码头":{sub:"北岸渡口",desc:"救援位置和证据可在这里接入岛外网络发送。",image:"/photos/venue-terminal.webp",actions:[["测试岛外上传","固定网络可用，三个加密备份目标均已连通。"],["查询凌晨船班","04:20有一艘海事巡逻艇靠岸，可作为撤离接应。"]]}
  };
  const places=chapter===1?chapterOne:chapter===2?chapterTwo:chapterThree;
  const imageFor=(action:[string,string,string?],item:{image:string})=>action[2]==="hotel-log"?"/photos/hotel-306.webp":action[2]==="badge1704"?"/photos/clerk-badge.webp":action[2]==="ward"?"/photos/transfer-forms.webp":action[2]==="nurse"?"/photos/nurse-id-1992.webp":action[2]==="codes"?"/photos/health-records.webp":item.image;
  const visit=(name:string)=>{setPlace(name);setInside(name);setEvent(null);};
  const act=(action:[string,string,string?],item:any)=>{setEvent({title:action[0],text:action[1],image:imageFor(action,item)});if(action[2]&&!found.includes(action[2]))collect(action[2]);};
  if(inside){const item=places[inside];return <div className={`venue-page venue-chapter-${chapter}`} style={{backgroundImage:`linear-gradient(180deg,rgba(10,18,16,.12),rgba(10,18,16,.82)),url(${item.image})`}}><header><button onClick={()=>{setInside(null);setEvent(null);}}>← 离开，返回地图</button><span>{CHAPTERS[chapter-1].title} · {item.sub}</span></header><section><p>当前地点</p><h1>{inside}</h1><strong>{item.desc}</strong><div className="venue-actions">{item.actions.map((action,i)=><button key={i} onClick={()=>act(action,item)}><span>{String(i+1).padStart(2,"0")}</span>{action[0]}</button>)}</div></section>{event&&<div className="venue-modal" role="dialog" aria-modal="true"><article><figure><img src={event.image} alt=""/></figure><small>现场查看</small><h2>{event.title}</h2><p>{event.text}</p><button onClick={()=>setEvent(null)}>关闭</button></article></div>}</div>}
  return <div className={`map-page map-chapter-${chapter}`}><div className={`map-canvas real-map chapter-map-${chapter}`}>{Object.keys(places).map((p,i)=><button key={p} style={{left:`${12+(i*15)%70}%`,top:`${14+(i*21)%64}%`}} className={place===p?"active":""} onClick={()=>setPlace(p)}><i>{i+1}</i>{p}</button>)}</div><aside><p>{CHAPTERS[chapter-1].title} · 岛内地图</p><h2>{place}</h2><b>{places[place].sub}</b><p>{places[place].desc}</p><button className="route" onClick={()=>visit(place)}>进入地点</button></aside></div>
}

const clueQuestion=(id:string)=>({
  "last-chat":"她说“事情办完再买”，来雾港究竟要办什么？","hotel-log":"宾馆在发现住客整夜未归后，具体什么时候报了警？","ferry-list":"没有离岛核验，是否还存在不走客轮的离岛方式？","workboat":"加油量为0、目的港无回执，这艘船当晚真的离泊了吗？","badge1704":"门店17与员工04为什么会以相同顺序出现在别处？","voucher1704":"早餐券上的C17/04由谁手写，代表房客还是后厨？","ward":"不同县市的孩子为什么都被转入同一病区？","nurse":"23:10之后是谁改动了十二张床位记录？","ship":"核载6人的船为什么领走17件救生衣？","codes":"生活中的门店号、员工号，与观察编号是巧合吗？","payments":"同一天出现的三套单据，对应的是同一批货还是同一次行动？","fog-horn":"雾笛日志为什么记录人的姓名应答？","lan-transplant":"被遮盖的供体姓名能否通过档案尾号反查？"
} as Record<string,string>)[id];

function Evidence({found,chapter}:{found:string[];chapter:number}) { const [open,setOpen]=useState<Clue|null>(null); const items=CLUES.filter(c=>c.chapter===chapter&&found.includes(c.id)); return <div className="evidence-page"><header><p>INVESTIGATION NOTES</p><h1>调查手记</h1><span>只保存原始材料，不替你写结论。</span></header>{items.length?<div className="evidence-grid">{items.map((c,i)=><button className="evidence-card" key={c.id} onClick={()=>setOpen(c)}><span>{String(i+1).padStart(2,"0")} · {CHAPTERS[c.chapter-1].title}</span><h3>{c.title}</h3><p>{c.text}</p><small>来源：{c.source}</small><em>查看详情 →</em></button>)}</div>:<div className="empty-evidence">本章手记内尚无材料。</div>}<footer>当前章节：{CHAPTERS[chapter-1].title}</footer>{open&&<div className="evidence-modal" role="dialog" aria-modal="true"><article><small>{CHAPTERS[open.chapter-1].title} · 原始材料</small><h2>{open.title}</h2><b>{open.source}</b><p>{open.text}</p>{clueQuestion(open.id)&&<aside><span>尚未解决</span><p>{clueQuestion(open.id)}</p></aside>}<button onClick={()=>setOpen(null)}>关闭</button></article></div>}</div> }

function Board({chapter,collected,selected,toggle,answer,setAnswer,submit,investigate}:any) { return <div className="board-page"><header><p>阶段结论随时开放</p><h1>{CHAPTERS[chapter-1].question}</h1><span>请选择2—4份材料。系统只判断整组证据是否足够，不逐项提示对错。</span></header>{collected.length < 2 && <div className="investigate-callout"><div><b>现在还不能形成结论</b><p>已收录{collected.length}份，本章至少需要2份来自不同系统的材料。先回到手机、档案搜索或地图调查。</p></div><button onClick={investigate}>返回手机调查 →</button></div>}<form onSubmit={submit}><div className="board-columns"><section><h3>一、选择支撑材料 <small>{selected.length}/4</small></h3>{collected.length?collected.map((c:Clue)=><button type="button" key={c.id} className={selected.includes(c.id)?"selected":""} onClick={()=>toggle(c.id)}><i>{selected.includes(c.id)?"✓":"+"}</i><span><b>{c.title}</b><small>{c.source}</small></span></button>):<div className="board-empty"><p>调查手记还是空的。</p><button type="button" onClick={investigate}>先去查看母亲的微信</button></div>}</section><section><h3>二、写下阶段判断</h3>{chapter===1?<div className="answers"><label><input type="radio" name="a" value="left" checked={answer==="left"} onChange={e=>setAnswer(e.target.value)}/>林琴已经通过非公开方式离岛</label><label><input type="radio" name="a" value="island" checked={answer==="island"} onChange={e=>setAnswer(e.target.value)}/>没有可靠记录证明她离岛，她仍在岛上的可能性最高</label><label><input type="radio" name="a" value="accident" checked={answer==="accident"} onChange={e=>setAnswer(e.target.value)}/>她在海上遭遇了无法解释的事故</label></div>:chapter===2?<div className="answers"><label><input type="radio" name="a" value="coincidence" checked={answer==="coincidence"} onChange={e=>setAnswer(e.target.value)}/>十二份记录只是年代接近</label><label><input type="radio" name="a" value="transfer" checked={answer==="transfer"} onChange={e=>setAnswer(e.target.value)}/>儿童经福利、医疗和港口系统被分散转运到乙区</label><label><input type="radio" name="a" value="ghost" checked={answer==="ghost"} onChange={e=>setAnswer(e.target.value)}/>孩子们被民俗仪式召集到岛上</label></div>:<div className="answers"><label><input type="radio" name="a" value="publish" checked={answer==="publish"} onChange={e=>setAnswer(e.target.value)}/>立刻公开所有供体、受体与后代姓名</label><label><input type="radio" name="a" value="destroy" checked={answer==="destroy"} onChange={e=>setAnswer(e.target.value)}/>先销毁编号表，阻止灵异扩散</label><label><input type="radio" name="a" value="rescue-first" checked={answer==="rescue-first"} onChange={e=>setAnswer(e.target.value)}/>先按检修道救人并异地备份，再分层公开犯罪证据</label></div>}<button className="submit-conclusion">{chapter===3?"执行最终行动":"提交阶段结论"}</button><small className="submit-note">材料不足时也可以点击，系统会告诉你下一步该做什么。</small></section></div></form></div> }
