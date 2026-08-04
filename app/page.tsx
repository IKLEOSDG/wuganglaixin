"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Area = "phone" | "browser" | "map" | "evidence" | "board";
type AppId = "home" | "messages" | "photos" | "notes" | "files" | "shopping" | "music" | "weather";
type Article = { id: string; chapter: number; tag: string; date: string; title: string; excerpt: string; body: string[]; deleted?: boolean; redacted?: boolean };
type Clue = { id: string; chapter: number; title: string; source: string; text: string };

const CHAPTERS = [
  { no: 1, device: "林岚的手机", title: "回潮口", question: "母亲为什么来雾港，她是否已经离开这座岛？", count: 6 },
  { no: 2, device: "林琴的旧手机", title: "旧名册", question: "散落在不同地区的十二份记录，为什么指向同一间病区？", count: 5 },
  { no: 3, device: "郭宁的手机", title: "雾笛之后", question: "雾港的编号在记录什么，郭维今晚准备做什么？", count: 5 },
];

const CLUES: Clue[] = [
  { id: "last-chat", chapter: 1, title: "6月14日母女讯息", source: "林岚手机 / 妈妈", text: "林琴18:42发来：‘到了，住潮生宾馆306。房间有点潮。’她没有购买返程票。" },
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

const ARTICLES: Article[] = ordinaryTitles.map(([tag, title], i) => ({
  id: `a${i + 1}`, chapter: i > 31 ? 2 : 1, tag, title, date: `${2026 - Math.floor(i / 12)}.${String((i % 12) + 1).padStart(2, "0")}.${String((i * 3) % 27 + 1).padStart(2, "0")}`,
  excerpt: i === 22 ? "气象台提示晚间能见度可能降至停航标准，请留意18:30复核通知。" : i === 30 ? "登记包含船员、燃油与目的港三项，缺一不得离泊。" : "来自《今日雾港》与地方档案的公开资料。文章主要记录岛上普通生活，也保留了历次修改痕迹。",
  body: [
    `${title}。这是一篇完整的地方资料。编辑部核对了公开记录、现场告示与居民采访，文中时间均按雾港当地记录整理。`,
    i === 30 ? "试行表要求工作船离港前同时提交实名船员表、当次加油数和大陆目的港卸货回执。三份材料应由不同岗位填写，事后不得以口头说明替代。" : "雾港的日常并不神秘：船按时靠岸，店铺照常开门，孩子放学后在归潮广场等车。真正有价值的是这些平常记录彼此能否对得上。",
    i === 22 ? "当天16:00已出现低云与风向转变，18:30决定取消20:10末班船。此前三班客轮照常运行，移动通信及固定电话均未中断。" : "公开版页面曾在整理中修改。若标题、日期或机构名称与其他材料冲突，应回到原始出处，而不是把单篇文章当作结论。",
  ],
  deleted: i === 25 || i === 31, redacted: i === 27 || i === 32,
}));

ARTICLES.push({ id: "a37", chapter: 3, tag: "医疗", date: "2008.08.17", title: "跨区儿童器官移植术后随访登记", excerpt: "患者林岚，9岁；供体身份在公开副本中隐去。", redacted: true, body: ["登记显示患者因急性肝衰竭接受急诊移植，术后转入长期随访。供体年龄十二岁，死亡时间与器官获取时间相隔四小时。", "原件的供体姓名栏并非空白，而是在2026年数字化时被遮盖。档案号为TX-0817-12，与一张异地死亡证明使用相同尾号。"] });
ARTICLES.push({ id: "a38", chapter: 3, tag: "民政", date: "2008.08.17", title: "未成年人叶知潮死亡登记更正页", excerpt: "该页仅能通过移植档案号反查，普通姓名搜索未被收录。", body: ["叶知潮，男，十二岁。登记死亡原因为交通事故后重型颅脑损伤。监护人签署器官捐献同意书。", "死亡证明的签发机构与事故发生地相距三百余公里，补录经办人来自雾港潮生康养院。‘叶知潮’三个字是档案恢复后第一次完整出现。"] });

const APPS: { id: AppId; icon: string; name: string }[] = [
  { id: "messages", icon: "讯", name: "讯息" }, { id: "photos", icon: "相", name: "照片" },
  { id: "notes", icon: "记", name: "备忘录" }, { id: "files", icon: "档", name: "文件" },
  { id: "shopping", icon: "购", name: "青橙购" }, { id: "music", icon: "声", name: "泊声音乐" },
  { id: "weather", icon: "雾", name: "天气" },
];

const PHOTO_SETS = {
  1: [
    { title: "便利店夜班胸牌", caption: "潮声便利店 · 门店17 / 员工04", clue: "badge1704", src: "/photos/clerk-badge.png", meta: "2026/06/16 20:07 · 林岚的手机" },
    { title: "宾馆早餐券", caption: "306房随身物品 · C17 / 04 · 低盐", clue: "voucher1704", src: "/photos/breakfast-voucher.png", meta: "2026/06/16 10:31 · 林岚的手机" },
    { title: "306房门", caption: "门锁指示正常，走廊靠近安全楼梯", clue: "", src: "/photos/hotel-306.png", meta: "2026/06/16 10:22 · 林岚的手机" },
  ],
  2: [
    { title: "四张转院单", caption: "来自不同县市，均残留乙区印章", clue: "ward", src: "/photos/transfer-forms.png", meta: "扫描件整理 · 原件年代1989—1992" },
    { title: "周岚护士证", caption: "与事故当夜乙区值班表放在一起", clue: "nurse", src: "/photos/nurse-id-1992.png", meta: "地方陈列馆扫描 · 1992" },
    { title: "十二件衣物", caption: "寻人启事中的衣物描述复原陈列", clue: "twelve", src: "/photos/children-clothes.png", meta: "沈砚资料夹 · 2009年翻拍" },
  ],
  3: [
    { title: "体检分组记录", caption: "同一张桌上的C17-01与C17-04", clue: "codes", src: "/photos/health-records.png", meta: "郭宁的手机 · 2026/06/17" },
    { title: "白塔检修门", caption: "门禁日程显示03:17自动解锁", clue: "rescue", src: "/photos/lighthouse-door.png", meta: "郭宁的手机 · 雨夜" },
    { title: "郭家聚餐", caption: "饭局看起来和平常没有不同", clue: "", src: "/photos/family-dinner.png", meta: "家庭共享相册 · 2026/05/02" },
  ],
} satisfies Record<number, { title: string; caption: string; clue: string; src: string; meta: string }[]>;

const HINTS = [
  ["先确认母亲最后一次正常联系留下了哪些可核对的地点。", "比较宾馆、客轮和工作码头三套独立记录。", "打开讯息里的‘妈妈’，再查地图中的潮生宾馆和客运码头。"],
  ["不要从姓名入手，先找各份记录里重复的字段。", "比较病区号、年龄、血型、衣物与转院编号。", "打开旧手机的文件与照片，再搜索‘乙区’和‘归潮号’。"],
  ["同一个编号可能在工作以外的系统里留下痕迹。", "比较家族群、健康账户、付款与雾笛日志。", "打开郭宁手机的讯息与文件，再在证据板提交处置顺序。"],
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

export default function Home() {
  const [started, setStarted] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [area, setArea] = useState<Area>("phone");
  const [app, setApp] = useState<AppId>("home");
  const [found, setFound] = useState<string[]>([]);
  const [toast, setToast] = useState("");
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
    if (!q) return availableArticles.slice(0, 12);
    return availableArticles.filter(a => `${a.title}${a.tag}${a.excerpt}${a.body.join("")}`.toLowerCase().includes(q));
  }, [query, chapter]);

  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };
  const collect = (id: string) => {
    if (found.includes(id)) { notify("这份材料已经收录"); return; }
    const clue = CLUES.find(c => c.id === id); if (!clue) return;
    setFound(v => [...v, id]); notify(`已收录：${clue.title}`);
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
    <aside className="opening-card"><b>最后一条讯息</b><time>6月14日 18:42</time><p>到了，住潮生宾馆306。房间有点潮。冰箱第二层有汤，别又点外卖。</p><em>——妈妈</em></aside>
  </main>;

  if (ending) return <main className="ending">
    <p>TRUE ENDING · 名字归岸</p><h1>先救人，再让证据说话。</h1>
    <div className="ending-text"><p>郭宁关闭雾笛，吴启明交出第三代观察记录。你沿白塔检修道找到林琴，把救援位置、低潮时间和三套证据分别发给岛外警方、律师与媒体。</p><p>引水洞里的归潮号终于被找到。受害者姓名由家属确认，无辜受体的医疗隐私没有成为猎奇标题。</p><p>恢复的移植原件给了你最后一个名字：<b>叶知潮，十二岁，死亡于2008年8月17日。</b>同一天，九岁的林岚接受急诊肝移植。你再打开讯息，“潮”的会话不存在；系统从未记录过这个联系人。</p><p>他没有替你找到任何线索。他只是把你已经看见的东西，换个顺序放回去。</p><div className="post-record"><span>档案反查 / TX-0817-12</span><strong>叶知潮死亡登记　↔　林岚移植随访证明</strong><small>签发机构相距342公里，经办人却属于同一间潮生康养院。</small></div><p>监护设备停下后，空病房录到一句孩子的声音：“这次有人记得我们了。”房里没有音频设备。</p></div>
    <button className="primary" onClick={reset}>重新调查</button>
  </main>;

  return <main className="game-shell">
    {toast && <div className="toast">✓ {toast}<small>证据册 {found.length}/16</small></div>}
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
        {([ ["phone","手机","机"], ["browser","档案搜索","搜"], ["map","岛内地图","图"], ["evidence","调查手记","证"], ["board","阶段结论","结"] ] as [Area,string,string][]).map(([id,label,icon]) => <button key={id} className={area === id ? "active" : ""} onClick={() => openArea(id)}><i>{icon}</i><span>{label}</span>{id === "evidence" && found.length > 0 && <em>{found.length}</em>}</button>)}
      </nav>

      <section className="content" key={`${area}-${chapter}`}>
        {area === "phone" && <Phone chapter={chapter} app={app} setApp={setApp} thread={thread} setThread={setThread} collect={collect} found={found} playing={playing} setPlaying={setPlaying} track={track} setTrack={setTrack} notify={notify} />}
        {area === "browser" && <Browser query={query} setQuery={setQuery} results={results} article={article} setArticle={setArticle} collect={collect} found={found} chapter={chapter} />}
        {area === "map" && <MapPanel collect={collect} found={found} notify={notify} />}
        {area === "evidence" && <Evidence found={found} chapter={chapter} />}
        {area === "board" && <Board chapter={chapter} collected={collected} selected={selected} toggle={toggleEvidence} answer={answer} setAnswer={setAnswer} submit={submit} investigate={() => openArea("phone")} />}
      </section>
    </div>
  </main>;
}

function Phone({ chapter, app, setApp, thread, setThread, collect, found, playing, setPlaying, track, setTrack, notify }: any) {
  const messages: Record<number, string[]> = { 1: ["潮", "妈妈", "潮生宾馆", "陈放", "蒋小蕊"], 2: ["潮", "沈砚（旧号码）", "妈妈", "许医生"], 3: ["潮", "郭家健康群", "爸爸", "吴医生", "陶小雨"] };
  const tracks = ["内湾晴天", "返程票", "二楼走廊", "夜船不开", "未命名录音"];
  const [now, setNow] = useState(() => new Date());
  const [batteryLevel, setBatteryLevel] = useState(.78);
  const [charging, setCharging] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [wifiOn, setWifiOn] = useState(true);
  const [mobileOn, setMobileOn] = useState(true);
  const [airplaneOn, setAirplaneOn] = useState(false);
  const [brightness, setBrightness] = useState(82);
  const [volume, setVolume] = useState(38);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [photoOpen, setPhotoOpen] = useState<(typeof PHOTO_SETS)[1][number] | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
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
    transition(() => { setThread(""); setApp(next); });
  };
  const openThread = (name: string) => {
    const clue = chapter === 1 && name === "妈妈" ? "last-chat" : chapter === 1 && name === "潮生宾馆" ? "hotel-log" : chapter === 2 && name === "沈砚（旧号码）" ? "twelve" : chapter === 3 && name === "郭家健康群" ? "family-group" : "";
    if (clue && !found.includes(clue)) collect(clue);
    transition(() => setThread(name));
  };
  const back = () => transition(() => { setThread(""); setApp("home"); });
  return <div className="phone-stage"><div className={`phone phone-${chapter}`} onTouchStart={event => setTouchStart(event.touches[0].clientY)} onTouchEnd={event => { if (touchStart !== null && event.changedTouches[0].clientY - touchStart > 46) setControlOpen(true); setTouchStart(null); }}>
    <button className="phone-status" onClick={() => setControlOpen(true)} aria-label="打开控制中心"><span>{phoneTime}</span><b><i className="signal-bars">{[1,2,3,4].map(level => <span key={level} className={level <= signalLevel ? "on" : ""} />)}</i><i className={`wifi ${wifiOn && !airplaneOn ? "on" : ""}`}>⌁</i><i className={`battery ${charging ? "charging" : ""}`}><span style={{width:`${Math.round(batteryLevel * 100)}%`}} /></i></b></button>
    <div className={`control-center ${controlOpen ? "open" : ""}`} aria-hidden={!controlOpen}>
      <button className="control-dismiss" onClick={() => setControlOpen(false)} aria-label="关闭控制中心" />
      <div className="control-panel">
        <div className="control-top"><b>{phoneTime}</b><span>{Math.round(batteryLevel * 100)}% {charging ? "· 正在充电" : ""}</span></div>
        <div className="control-toggles">
          <button className={airplaneOn ? "active orange" : ""} onClick={() => setAirplaneOn(value => !value)}><i>✈</i><span>飞行模式</span></button>
          <button className={mobileOn && !airplaneOn ? "active green" : ""} onClick={() => setMobileOn(value => !value)}><i>蜂</i><span>蜂窝网络</span></button>
          <button className={wifiOn && !airplaneOn ? "active blue" : ""} onClick={() => setWifiOn(value => !value)}><i>⌁</i><span>无线局域网</span></button>
          <button><i>月</i><span>专注模式</span></button>
        </div>
        <label className="control-slider"><span>☀</span><input type="range" min="15" max="100" value={brightness} onChange={event => setBrightness(Number(event.target.value))}/></label>
        <label className="control-slider"><span>声</span><input type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))}/></label>
        <div className="control-bottom"><button onClick={() => notify("手电筒已切换")}>灯</button><button onClick={() => notify("计时器已打开")}>计</button><button onClick={() => notify("计算器已打开")}>算</button><button onClick={() => notify("相机已打开")}>相</button></div>
        <button className="control-handle" onClick={() => setControlOpen(false)} aria-label="收起控制中心" />
      </div>
    </div>
    {app === "home" && <div className="phone-home">
      <div className="phone-date"><b>{phoneTime}</b><span>{phoneDay} · {chapter === 1 ? "阵雨" : "雾"}</span></div>
      <div className="app-grid">{APPS.map((a,i) => <button key={a.id} onClick={() => openApp(a.id)}><i className={`app-icon ai-${i}`}>{a.icon}</i><span>{a.name}</span>{((chapter === 1 && a.id === "messages") || (chapter === 2 && ["files","photos"].includes(a.id)) || (chapter === 3 && ["messages","files"].includes(a.id))) && <em />}</button>)}</div>
    </div>}
    {app === "messages" && <div className="phone-page message-page">
      {!thread ? <><PhoneHead title="讯息" back={back} /><div className="thread-list">{messages[chapter].map((m:string) => <button key={m} onClick={() => openThread(m)}><b>{m.slice(0,1)}</b><span>{m}<small>{m.includes("妈妈") ? "到了，住潮生宾馆306……" : m === "潮" ? "我只是把它们换个顺序。" : conversationFor(chapter,m).at(-1)?.text}</small></span><time>{m === "潮" ? phoneTime : "昨天"}</time></button>)}</div></> : <><PhoneHead title={thread} back={() => transition(() => setThread(""))} backLabel="讯息" />
      <div className="conversation"><div className="chat-day">{phoneDay}</div>{conversationFor(chapter, thread).map((line, index) => line.side === "system" ? <time className="system-note" key={index}>{line.text}</time> : <p className={`bubble ${line.side}`} key={index}>{line.text}</p>)}</div></>}
    </div>}
    {app === "photos" && <div className="phone-page"><PhoneHead title="照片" back={back}/><div className="photo-grid">{PHOTO_SETS[chapter].map(photo => <button key={photo.title} onClick={() => { setPhotoOpen(photo); if (photo.clue && !found.includes(photo.clue)) collect(photo.clue); }}><img src={photo.src} alt={photo.title}/><b>{photo.title}</b><span>{photo.caption}</span>{photo.clue && found.includes(photo.clue) && <em>已收录</em>}</button>)}</div>{photoOpen && <div className="photo-viewer"><button className="photo-close" onClick={() => setPhotoOpen(null)}>完成</button><img src={photoOpen.src} alt={photoOpen.title}/><div><b>{photoOpen.title}</b><p>{photoOpen.caption}</p><small>{photoOpen.meta}</small></div></div>}</div>}
    {app === "files" && <div className="phone-page"><PhoneHead title="文件" back={back}/><div className="file-list">
      {(chapter === 1 ? [["客轮实名订单.pdf","仅有登岛票","ferry-list"],["工作船说明.txt","郭维口述", "workboat"]] : chapter === 2 ? [["1992_乙区值班表.pdf","扫描件 · 4页","nurse"],["归潮号港务内参.pdf","公开版已删除","ship"],["2009_就诊备忘.txt","林琴自述","qin-note"]] : [["第三代观察表.xlsx","内部导出","codes"],["冷链付款对账.pdf","三套系统日期一致","payments"],["今晚处置日程.ics","03:17 观察区","rescue"],["雾笛反应日志.m4a","原始录音","fog-horn"],["林岚_儿童移植随访.pdf","供体姓名已遮盖","lan-transplant"]]).map((f:any) => <button key={f[0]} onClick={() => collect(f[2])}><i>文</i><span><b>{f[0]}</b><small>{f[1]}</small></span><em>{found.includes(f[2]) ? "✓" : "打开"}</em></button>)}
    </div></div>}
    {app === "notes" && <div className="phone-page"><PhoneHead title="备忘录" back={back}/><article className="note-paper"><h3>{chapter === 1 ? "去雾港前" : chapter === 2 ? "如果又忘了" : "我不想继续体检"}</h3><p>{chapter === 1 ? "相机、充电线、雨衣。先去宾馆，再去派出所。不要把妈妈以前的记忆问题告诉不相干的人。" : chapter === 2 ? "沈砚说，公开名单前先分清失踪者、受体和后代。有人做了坏事，不等于岛上每个人都知道。" : "爸爸说这是保护，说奖学金、药和出岛名额都靠家里。可是为什么保护一个人，需要删掉她做过的梦？"}</p></article></div>}
    {app === "shopping" && <div className="phone-page lifestyle"><PhoneHead title="青橙购" back={back}/><input placeholder="搜索商品"/><h3>最近订单</h3>{["防潮相机袋","速溶咖啡 20条","白色运动鞋","给妈妈的护膝"].map((x,i)=><button key={x} onClick={()=>notify(i===3?"物流：6月13日已由林琴签收":"订单详情已打开")}><i>{["袋","咖","鞋","礼"][i]}</i><span><b>{x}</b><small>{i===3?"已签收 · 潮生宾馆代收":"已完成 · 可再次购买"}</small></span></button>)}</div>}
    {app === "music" && <div className="phone-page lifestyle"><PhoneHead title="泊声音乐" back={back}/><div className="album"><i>泊</i><div><b>{tracks[track]}</b><span>林岚的通勤收藏</span></div><button onClick={()=>setPlaying(!playing)}>{playing?"暂停":"播放"}</button></div>{tracks.map((t,i)=><button className={track===i?"playing":""} key={t} onClick={()=>{setTrack(i);setPlaying(true)}}><span>{String(i+1).padStart(2,"0")}</span><b>{t}</b><small>{2+i}:1{i}</small></button>)}</div>}
    {app === "weather" && <div className="phone-page"><PhoneHead title="天气" back={back}/><div className="weather-card"><b>雾港岛</b><strong>19°</strong><p>阵雨转平流雾</p><ul><li>16:00　能见度下降预警</li><li>18:30　复核20:10末班船</li><li>通信　正常</li></ul></div></div>}
  </div><aside className="phone-caption"><b>{CHAPTERS[chapter-1].device}</b><p>{chapter === 1 ? "使用习惯：摄影、出行、给母亲买东西。" : chapter === 2 ? "无SIM卡。资料被刻意拆散，但没有谜语密码。" : "家族管理渗进健康、学校和日常聊天。"}</p></aside></div>;
}

function PhoneHead({title,back,backLabel="桌面"}:{title:string;back:()=>void;backLabel?:string}) { return <header className="phone-head"><button onClick={back}>‹ {backLabel}</button><b>{title}</b><span /></header> }

function Browser({ query, setQuery, results, article, setArticle, collect, found, chapter }: any) {
  const openArticle = (next: Article) => { const clue = next.id === "a23" ? "weather" : next.id === "a31" ? "workboat" : next.id === "a28" && chapter >= 2 ? "ship" : ""; if (clue && !found.includes(clue)) collect(clue); setArticle(next); };
  if (article) return <div className="browser-page article-page"><header className="browser-bar"><button onClick={()=>setArticle(null)}>← 返回结果</button><span>archive.wugang.local / {article.id}</span></header><article><div className="article-meta"><span>{article.tag}</span><time>{article.date}</time></div><h1>{article.title}</h1><p className="lead">{article.excerpt}</p>{article.deleted && <div className="deleted">原页面已删除。当前内容来自搜索摘要、RSS与纸质剪报交叉恢复。</div>}{article.redacted && <p>公开档案中的经办人：<mark>　　　　　　</mark>。遮盖由2026年数字化整理时添加，理由为“个人信息”。</p>}{article.body.map((p:string,i:number)=><p key={i}>{p}</p>)}</article></div>;
  return <div className="browser-page"><header className="browser-bar"><span>今日雾港</span><form onSubmit={(e)=>e.preventDefault()}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索地点、机构、年份或事件"/><button>搜索</button></form></header>
    {!query && <section className="portal-hero"><div><p>2026年6月16日　星期二</p><h1>今日雾港</h1><span>19°C　阵雨转雾　末班船待复核</span></div><aside><b>航班提醒</b><p>20:10客轮是否开航，将于18:30根据能见度决定。</p></aside></section>}
    <div className="browser-layout"><div><div className="result-head"><b>{query ? `“${query}”的结果` : "本地资讯与档案"}</b><span>{results.length} 篇可读</span></div>{results.length ? <div className="article-list">{results.map((a:Article)=><button key={a.id} onClick={()=>openArticle(a)}><div><span>{a.tag}</span><time>{a.date}</time>{a.deleted&&<em>原页删除</em>}</div><h3>{a.title}</h3><p>{a.excerpt}</p></button>)}</div> : <div className="no-result"><b>没有找到完全匹配的页面</b><p>试试机构名、旧地名或年份。系统不会替你自动比对人物。</p></div>}</div>
    <aside className="browser-side"><h3>资料分类</h3>{["岛内新闻 10","生活商业 8","历史民俗 8","1992事故 8","健康教育 10"].map(x=><button key={x} onClick={()=>setQuery(x.slice(0,2))}>{x}</button>)}<p>共收录36篇全文。多数文章只用于理解这里怎样生活，不一定是谜题。</p></aside></div>
  </div>;
}

function MapPanel({collect,found,notify}:any) { const [place,setPlace]=useState("客运码头"); const places:any={"客运码头":["距潮生宾馆1.2km","实名客轮 07:20 / 11:40 / 16:30 / 20:10"],"潮生宾馆":["老街东口","306最后刷出 6月15日21:48"],"潮声便利店":["24小时营业","夜班店员陶小雨"],"望潮饭店":["内湾边","本地家常菜，21:30打烊"],"归潮广场":["镇中心","露天电影与公交换乘"],"旧港冷链":["工作码头","非工作人员禁止进入"],"白塔":["北坡尽头","步行约42分钟；东段封闭"]}; const openPlace=(name:string)=>{setPlace(name);const clue=name==="客运码头"?"ferry-list":name==="潮生宾馆"?"hotel-log":"";if(clue&&!found.includes(clue))collect(clue)}; return <div className="map-page"><div className="map-canvas"><div className="island-shape" />{Object.keys(places).map((p,i)=><button key={p} style={{left:`${16+(i*13)%70}%`,top:`${18+(i*17)%62}%`}} className={place===p?"active":""} onClick={()=>openPlace(p)}><i>{i+1}</i>{p}</button>)}</div><aside><p>雾港岛 · 公开地图</p><h2>{place}</h2><b>{places[place][0]}</b><p>{places[place][1]}</p><button className="route" onClick={()=>notify(`路线已加入行程：从当前位置前往${place}`)}>查看步行路线</button></aside></div> }

function Evidence({found,chapter}:{found:string[];chapter:number}) { const items=CLUES.filter(c=>found.includes(c.id)); return <div className="evidence-page"><header><p>INVESTIGATION NOTES</p><h1>调查手记</h1><span>只保存原始材料，不替你写结论。</span></header>{items.length?<div className="evidence-grid">{items.map((c,i)=><article key={c.id}><span>{String(i+1).padStart(2,"0")} · 第{c.chapter}章</span><h3>{c.title}</h3><p>{c.text}</p><small>来源：{c.source}</small></article>)}</div>:<div className="empty-evidence">还没有收录材料。打开讯息中的妈妈，完成第一次“查看—收录—返回问题”循环。</div>}<footer>当前章节：{CHAPTERS[chapter-1].title}</footer></div> }

function Board({chapter,collected,selected,toggle,answer,setAnswer,submit,investigate}:any) { return <div className="board-page"><header><p>阶段结论随时开放</p><h1>{CHAPTERS[chapter-1].question}</h1><span>请选择2—4份材料。系统只判断整组证据是否足够，不逐项提示对错。</span></header>{collected.length < 2 && <div className="investigate-callout"><div><b>现在还不能形成结论</b><p>已收录{collected.length}份，本章至少需要2份来自不同系统的材料。先回到手机、档案搜索或地图调查。</p></div><button onClick={investigate}>返回手机调查 →</button></div>}<form onSubmit={submit}><div className="board-columns"><section><h3>一、选择支撑材料 <small>{selected.length}/4</small></h3>{collected.length?collected.map((c:Clue)=><button type="button" key={c.id} className={selected.includes(c.id)?"selected":""} onClick={()=>toggle(c.id)}><i>{selected.includes(c.id)?"✓":"+"}</i><span><b>{c.title}</b><small>{c.source}</small></span></button>):<div className="board-empty"><p>调查手记还是空的。</p><button type="button" onClick={investigate}>先去查看母亲的讯息</button></div>}</section><section><h3>二、写下阶段判断</h3>{chapter===1?<div className="answers"><label><input type="radio" name="a" value="left" checked={answer==="left"} onChange={e=>setAnswer(e.target.value)}/>林琴已经通过非公开方式离岛</label><label><input type="radio" name="a" value="island" checked={answer==="island"} onChange={e=>setAnswer(e.target.value)}/>没有可靠记录证明她离岛，她仍在岛上的可能性最高</label><label><input type="radio" name="a" value="accident" checked={answer==="accident"} onChange={e=>setAnswer(e.target.value)}/>她在海上遭遇了无法解释的事故</label></div>:chapter===2?<div className="answers"><label><input type="radio" name="a" value="coincidence" checked={answer==="coincidence"} onChange={e=>setAnswer(e.target.value)}/>十二份记录只是年代接近</label><label><input type="radio" name="a" value="transfer" checked={answer==="transfer"} onChange={e=>setAnswer(e.target.value)}/>儿童经福利、医疗和港口系统被分散转运到乙区</label><label><input type="radio" name="a" value="ghost" checked={answer==="ghost"} onChange={e=>setAnswer(e.target.value)}/>孩子们被民俗仪式召集到岛上</label></div>:<div className="answers"><label><input type="radio" name="a" value="publish" checked={answer==="publish"} onChange={e=>setAnswer(e.target.value)}/>立刻公开所有供体、受体与后代姓名</label><label><input type="radio" name="a" value="destroy" checked={answer==="destroy"} onChange={e=>setAnswer(e.target.value)}/>先销毁编号表，阻止灵异扩散</label><label><input type="radio" name="a" value="rescue-first" checked={answer==="rescue-first"} onChange={e=>setAnswer(e.target.value)}/>先按检修道救人并异地备份，再分层公开犯罪证据</label></div>}<button className="submit-conclusion">{chapter===3?"执行最终行动":"提交阶段结论"}</button><small className="submit-note">材料不足时也可以点击，系统会告诉你下一步该做什么。</small></section></div></form></div> }
