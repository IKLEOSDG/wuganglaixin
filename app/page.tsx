"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Area = "phone" | "browser" | "map" | "evidence" | "board";
type AppId = "home" | "messages" | "photos" | "notes" | "files" | "shopping" | "music" | "weather";
type Article = { id: string; chapter: number; tag: string; date: string; title: string; excerpt: string; body: string[]; deleted?: boolean; redacted?: boolean };
type Clue = { id: string; chapter: number; title: string; source: string; text: string };

const CHAPTERS = [
  { no: 1, device: "林岚的手机", title: "没有离岛的人", question: "母亲为什么来雾港，她是否已经离开这座岛？", count: 6 },
  { no: 2, device: "林琴的旧手机", title: "十二个没有共同地点的孩子", question: "散落在不同地区的十二份记录，为什么指向同一间病区？", count: 5 },
  { no: 3, device: "郭宁的手机", title: "被保护的孩子", question: "雾港的编号在记录什么，郭维今晚准备做什么？", count: 5 },
];

const CLUES: Clue[] = [
  { id: "last-chat", chapter: 1, title: "母亲主动入住306", source: "讯息 / 林琴", text: "6月14日，林琴主动告知入住潮生宾馆306，并说两天后回来。" },
  { id: "hotel-log", chapter: 1, title: "306没有退房", source: "潮生宾馆 / 门卡记录", text: "行李仍在房内；门卡6月15日21:48离开后再未刷回。" },
  { id: "ferry-list", chapter: 1, title: "实名船票无离岛记录", source: "客运码头 / 航班查询", text: "林琴只在6月14日16:30实名登岛，之后四班客轮均无她的登船记录。" },
  { id: "workboat", chapter: 1, title: "22:20工作船说法矛盾", source: "今日雾港 / 港务简报", text: "郭维称林琴搭工作船离岛，但船员表、燃油数与大陆卸货记录互相冲突。" },
  { id: "weather", chapter: 1, title: "停航并非突然发生", source: "今日雾港 / 天气", text: "18:30发布的停航通知早有预警；岛上网络与报警电话始终正常。" },
  { id: "c1704", chapter: 1, title: "重复出现的17·04", source: "照片 / 生活记录", text: "便利店胸牌写门店17/员工04，宾馆早餐券却写C17/04低盐。" },
  { id: "twelve", chapter: 2, title: "十二份异地寻人启事", source: "文件 / 沈砚资料", text: "姓名、地点各不相同，但年龄区间、失踪月份与衣物描述存在重叠。" },
  { id: "ward", chapter: 2, title: "相同的旧病区号", source: "照片 / 转院单", text: "四张来自不同县市的转院单，都残留‘潮生康养院乙区’旧章。" },
  { id: "nurse", chapter: 2, title: "周岚的护士证与值班表", source: "文件 / 1992", text: "周岚在事故当夜负责乙区；她从23:10起连续更改十二名儿童的护理状态。" },
  { id: "ship", chapter: 2, title: "归潮号载有十七人", source: "档案 / 港务内参", text: "维修船核载六人，却领走十七件救生衣；官方稿后来改成‘无人船漂移’。" },
  { id: "qin-note", chapter: 2, title: "林琴不是组织成员", source: "备忘录 / 2009", text: "她因记忆缺口持续就诊，并把沈砚材料拆分保存，担心公开会伤害不知情的受体。" },
  { id: "family-group", chapter: 3, title: "家族群里的健康计划", source: "郭宁手机 / 群聊", text: "体检、服药、奖学金与出岛申请由郭维统一安排，‘保护’实为长期控制。" },
  { id: "codes", chapter: 3, title: "A/B/C三代编号表", source: "潮生健康 / 内部账户", text: "A为创始批，B为子代观察，C为第三代；后两位是供体谱系与对象序号。" },
  { id: "payments", chapter: 3, title: "冷链、医疗与客户付款", source: "文件 / 对账单", text: "工作码头冷链单、康养院手术耗材与境外付款可按日期互证。" },
  { id: "fog-horn", chapter: 3, title: "雾笛被用于诱发反应", source: "录音 / 观察日志", text: "低潮、旧雾笛与应答姓名是三项诱发条件；记录者无法解释私密记忆来源。" },
  { id: "rescue", chapter: 3, title: "03:17处置与检修通道", source: "郭维 / 日程与地图", text: "林琴将在03:17被转入地下病区；白塔检修道可绕开正门抵达观察区。" },
  { id: "lan-transplant", chapter: 3, title: "林岚的儿童移植随访", source: "潮生健康 / 旧档", text: "林岚九岁时接受过急诊肝移植。公开副本遮盖了供体姓名，只留下年龄12岁与日期2008年8月17日。" },
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

const HINTS = [
  ["先确认母亲最后一次正常联系留下了哪些可核对的地点。", "比较宾馆、客轮和工作码头三套独立记录。", "打开讯息里的‘妈妈’，再查地图中的潮生宾馆和客运码头。"],
  ["不要从姓名入手，先找各份记录里重复的字段。", "比较病区号、年龄、血型、衣物与转院编号。", "打开旧手机的文件与照片，再搜索‘乙区’和‘归潮号’。"],
  ["同一个编号可能在工作以外的系统里留下痕迹。", "比较家族群、健康账户、付款与雾笛日志。", "打开郭宁手机的讯息与文件，再在证据板提交处置顺序。"],
];

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
  const [thread, setThread] = useState("妈妈");
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
  const openArea = (next: Area) => { setArea(next); setApp("home"); setArticle(null); };
  const changeChapter = (n: number) => { if (n > unlocked) { notify("先完成当前章节的阶段结论"); return; } setChapter(n); setArea("phone"); setApp("home"); setSelected([]); setAnswer(""); };
  const toggleEvidence = (id: string) => setSelected(v => v.includes(id) ? v.filter(x => x !== id) : v.length < 4 ? [...v, id] : v);
  const submit = (e: FormEvent) => {
    e.preventDefault();
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

      <section className="content">
        {area === "phone" && <Phone chapter={chapter} app={app} setApp={setApp} thread={thread} setThread={setThread} collect={collect} found={found} playing={playing} setPlaying={setPlaying} track={track} setTrack={setTrack} notify={notify} />}
        {area === "browser" && <Browser query={query} setQuery={setQuery} results={results} article={article} setArticle={setArticle} collect={collect} found={found} chapter={chapter} />}
        {area === "map" && <MapPanel collect={collect} found={found} notify={notify} />}
        {area === "evidence" && <Evidence found={found} chapter={chapter} />}
        {area === "board" && <Board chapter={chapter} collected={collected} selected={selected} toggle={toggleEvidence} answer={answer} setAnswer={setAnswer} submit={submit} />}
      </section>
    </div>
  </main>;
}

function CollectButton({ id, found, collect }: { id: string; found: string[]; collect: (id:string)=>void }) {
  return <button className={found.includes(id) ? "collected" : "collect"} onClick={() => collect(id)}>{found.includes(id) ? "✓ 已收录" : "+ 收录材料"}</button>;
}

function Phone({ chapter, app, setApp, thread, setThread, collect, found, playing, setPlaying, track, setTrack, notify }: any) {
  const messages: Record<number, string[]> = { 1: ["潮", "妈妈", "潮生宾馆", "陈放", "蒋小蕊"], 2: ["潮", "沈砚（旧号码）", "妈妈", "许医生"], 3: ["潮", "郭家健康群", "爸爸", "吴医生", "陶小雨"] };
  const tracks = ["内湾晴天", "返程票", "二楼走廊", "夜船不开", "未命名录音"];
  const back = () => setApp("home");
  return <div className="phone-stage"><div className={`phone phone-${chapter}`}>
    <div className="phone-status"><span>21:48</span><b>雾港 5G　▰</b></div>
    {app === "home" && <div className="phone-home">
      <div className="phone-date"><b>6月{chapter === 1 ? "16" : chapter === 2 ? "17" : "18"}日</b><span>{chapter === 1 ? "阵雨 · 末班船预警" : "雾 · 低潮将至"}</span></div>
      <div className="app-grid">{APPS.map((a,i) => <button key={a.id} onClick={() => setApp(a.id)}><i className={`app-icon ai-${i}`}>{a.icon}</i><span>{a.name}</span>{((chapter === 1 && a.id === "messages") || (chapter === 2 && ["files","photos"].includes(a.id)) || (chapter === 3 && ["messages","files"].includes(a.id))) && <em />}</button>)}</div>
    </div>}
    {app === "messages" && <div className="phone-page"><PhoneHead title="讯息" back={back} />
      {thread === "list" ? <div /> : <div className="message-layout"><div className="thread-list">{messages[chapter].map((m:string) => <button key={m} onClick={() => setThread(m)}><b>{m.slice(0,1)}</b><span>{m}<small>{m.includes("妈妈") ? "到了，住潮生宾馆306……" : "有一条未读讯息"}</small></span></button>)}</div>
      <div className="conversation"><h3>{thread}</h3>{thread === "潮" ? <>
        <p className="bubble them">先别猜她去了哪。一个人要离开岛，总得在某套记录里留下重量。</p>
        <p className="bubble me">你怎么总能一下抓到重点？</p>
        <p className="bubble them">我只是把你已经看见的东西，换个顺序放回去。</p>
        <p className="bubble them">{chapter === 1 ? "宾馆知道她没回来，客轮知道她没上船。那艘工作船靠什么证明自己真的开过？" : chapter === 2 ? "名字会改，年龄和衣服不太会。别把十二个人一次搜完，先找重复字段。" : "先把救人的路线和公开证据分开。名单里不只有坏人。"}</p>
        <time>对方没有头像、号码与账号主页</time>
      </> : chapter === 1 && thread === "妈妈" ? <>
        <p className="bubble them">我到雾港了，住潮生宾馆306。房间有点潮。</p><p className="bubble me">后天几点的船？我去接你。</p><p className="bubble them">事情办完再买。冰箱第二层有汤，别又点外卖。</p><time>6月14日 18:42</time><CollectButton id="last-chat" found={found} collect={collect}/>
      </> : chapter === 1 && thread === "潮生宾馆" ? <><div className="call-card"><b>去电：潮生宾馆</b><p>前台蒋小蕊：行李还在306。最后一次刷卡是15日21:48，出去以后没有回来。老板说她可能投亲，但登记里没有本地联系人。</p></div><CollectButton id="hotel-log" found={found} collect={collect}/></> : chapter === 2 ? <><p className="bubble them">别搜孩子的名字。名字都改过。看年龄、衣服、转院章。</p><p className="bubble them">周岚当晚带走的不是病历，是人。</p><CollectButton id="twelve" found={found} collect={collect}/></> : chapter === 3 ? <><p className="bubble them">今晚03:17转观察区。C组家属不要靠近白塔。</p><p className="bubble me">妈到底在哪里？</p><p className="bubble them">别问。你也是为了这个家。</p><CollectButton id="family-group" found={found} collect={collect}/></> : <p className="empty-state">这段聊天大多是普通生活，没有直接线索。</p>}</div></div>}
    </div>}
    {app === "photos" && <div className="phone-page"><PhoneHead title="照片" back={back}/><div className="photo-grid">
      {(chapter === 1 ? [["便利店夜班胸牌","门店17 / 员工04","c1704"],["宾馆早餐券","C17 / 04 · 低盐","c1704"],["306房门","6月16日 10:22",""]] : chapter === 2 ? [["四张转院单","乙区印章残痕","ward"],["周岚护士证","雾港疗养院 1992","nurse"],["十二件衣物","来自寻人启事截图","twelve"]] : [["体检分组","C17-01 / C17-04","codes"],["白塔检修门","03:17自动解锁","rescue"],["家庭聚餐","每个人手腕都有旧针痕",""]]).map((p:any,i:number) => <button key={p[0]} onClick={() => p[2] ? collect(p[2]) : notify("已查看照片信息") }><div className={`photo-placeholder ph-${i}`}>{i === 0 ? "IMG" : i === 1 ? "SCAN" : "LIVE"}</div><b>{p[0]}</b><span>{p[1]}</span>{p[2] && found.includes(p[2]) && <em>已收录</em>}</button>)}
    </div></div>}
    {app === "files" && <div className="phone-page"><PhoneHead title="文件" back={back}/><div className="file-list">
      {(chapter === 1 ? [["客轮实名订单.pdf","仅有登岛票","ferry-list"],["工作船说明.txt","郭维口述", "workboat"]] : chapter === 2 ? [["1992_乙区值班表.pdf","扫描件 · 4页","nurse"],["归潮号港务内参.pdf","公开版已删除","ship"],["2009_就诊备忘.txt","林琴自述","qin-note"]] : [["第三代观察表.xlsx","内部导出","codes"],["冷链付款对账.pdf","三套系统日期一致","payments"],["今晚处置日程.ics","03:17 观察区","rescue"],["雾笛反应日志.m4a","原始录音","fog-horn"],["林岚_儿童移植随访.pdf","供体姓名已遮盖","lan-transplant"]]).map((f:any) => <button key={f[0]} onClick={() => collect(f[2])}><i>文</i><span><b>{f[0]}</b><small>{f[1]}</small></span><em>{found.includes(f[2]) ? "✓" : "打开"}</em></button>)}
    </div></div>}
    {app === "notes" && <div className="phone-page"><PhoneHead title="备忘录" back={back}/><article className="note-paper"><h3>{chapter === 1 ? "去雾港前" : chapter === 2 ? "如果又忘了" : "我不想继续体检"}</h3><p>{chapter === 1 ? "相机、充电线、雨衣。先去宾馆，再去派出所。不要把妈妈以前的记忆问题告诉不相干的人。" : chapter === 2 ? "沈砚说，公开名单前先分清失踪者、受体和后代。有人做了坏事，不等于岛上每个人都知道。" : "爸爸说这是保护，说奖学金、药和出岛名额都靠家里。可是为什么保护一个人，需要删掉她做过的梦？"}</p>{chapter === 2 && <CollectButton id="qin-note" found={found} collect={collect}/>}</article></div>}
    {app === "shopping" && <div className="phone-page lifestyle"><PhoneHead title="青橙购" back={back}/><input placeholder="搜索商品"/><h3>最近订单</h3>{["防潮相机袋","速溶咖啡 20条","白色运动鞋","给妈妈的护膝"].map((x,i)=><button key={x} onClick={()=>notify(i===3?"物流：6月13日已由林琴签收":"订单详情已打开")}><i>{["袋","咖","鞋","礼"][i]}</i><span><b>{x}</b><small>{i===3?"已签收 · 潮生宾馆代收":"已完成 · 可再次购买"}</small></span></button>)}</div>}
    {app === "music" && <div className="phone-page lifestyle"><PhoneHead title="泊声音乐" back={back}/><div className="album"><i>泊</i><div><b>{tracks[track]}</b><span>林岚的通勤收藏</span></div><button onClick={()=>setPlaying(!playing)}>{playing?"暂停":"播放"}</button></div>{tracks.map((t,i)=><button className={track===i?"playing":""} key={t} onClick={()=>{setTrack(i);setPlaying(true)}}><span>{String(i+1).padStart(2,"0")}</span><b>{t}</b><small>{2+i}:1{i}</small></button>)}</div>}
    {app === "weather" && <div className="phone-page"><PhoneHead title="天气" back={back}/><div className="weather-card"><b>雾港岛</b><strong>19°</strong><p>阵雨转平流雾</p><ul><li>16:00　能见度下降预警</li><li>18:30　复核20:10末班船</li><li>通信　正常</li></ul><CollectButton id="weather" found={found} collect={collect}/></div></div>}
  </div><aside className="phone-caption"><b>{CHAPTERS[chapter-1].device}</b><p>{chapter === 1 ? "使用习惯：摄影、出行、给母亲买东西。" : chapter === 2 ? "无SIM卡。资料被刻意拆散，但没有谜语密码。" : "家族管理渗进健康、学校和日常聊天。"}</p></aside></div>;
}

function PhoneHead({title,back}:{title:string;back:()=>void}) { return <header className="phone-head"><button onClick={back}>‹ 桌面</button><b>{title}</b><span /></header> }

function Browser({ query, setQuery, results, article, setArticle, collect, found, chapter }: any) {
  if (article) return <div className="browser-page article-page"><header className="browser-bar"><button onClick={()=>setArticle(null)}>← 返回结果</button><span>archive.wugang.local / {article.id}</span></header><article><div className="article-meta"><span>{article.tag}</span><time>{article.date}</time></div><h1>{article.title}</h1><p className="lead">{article.excerpt}</p>{article.deleted && <div className="deleted">原页面已删除。当前内容来自搜索摘要、RSS与纸质剪报交叉恢复。</div>}{article.redacted && <p>公开档案中的经办人：<mark>　　　　　　</mark>。遮盖由2026年数字化整理时添加，理由为“个人信息”。</p>}{article.body.map((p:string,i:number)=><p key={i}>{p}</p>)}
    {article.id === "a23" && <CollectButton id="weather" found={found} collect={collect}/>} {article.id === "a31" && <CollectButton id="workboat" found={found} collect={collect}/>} {article.id === "a28" && chapter>=2 && <CollectButton id="ship" found={found} collect={collect}/>}</article></div>;
  return <div className="browser-page"><header className="browser-bar"><span>今日雾港</span><form onSubmit={(e)=>e.preventDefault()}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索地点、机构、年份或事件"/><button>搜索</button></form></header>
    {!query && <section className="portal-hero"><div><p>2026年6月16日　星期二</p><h1>今日雾港</h1><span>19°C　阵雨转雾　末班船待复核</span></div><aside><b>航班提醒</b><p>20:10客轮是否开航，将于18:30根据能见度决定。</p></aside></section>}
    <div className="browser-layout"><div><div className="result-head"><b>{query ? `“${query}”的结果` : "本地资讯与档案"}</b><span>{results.length} 篇可读</span></div>{results.length ? <div className="article-list">{results.map((a:Article)=><button key={a.id} onClick={()=>setArticle(a)}><div><span>{a.tag}</span><time>{a.date}</time>{a.deleted&&<em>原页删除</em>}</div><h3>{a.title}</h3><p>{a.excerpt}</p></button>)}</div> : <div className="no-result"><b>没有找到完全匹配的页面</b><p>试试机构名、旧地名或年份。系统不会替你自动比对人物。</p></div>}</div>
    <aside className="browser-side"><h3>资料分类</h3>{["岛内新闻 10","生活商业 8","历史民俗 8","1992事故 8","健康教育 10"].map(x=><button key={x} onClick={()=>setQuery(x.slice(0,2))}>{x}</button>)}<p>共收录36篇全文。多数文章只用于理解这里怎样生活，不一定是谜题。</p></aside></div>
  </div>;
}

function MapPanel({collect,found,notify}:any) { const [place,setPlace]=useState("客运码头"); const places:any={"客运码头":["距潮生宾馆1.2km","实名客轮 07:20 / 11:40 / 16:30 / 20:10"],"潮生宾馆":["老街东口","306最后刷出 6月15日21:48"],"潮声便利店":["24小时营业","夜班店员陶小雨"],"望潮饭店":["内湾边","本地家常菜，21:30打烊"],"归潮广场":["镇中心","露天电影与公交换乘"],"旧港冷链":["工作码头","非工作人员禁止进入"],"白塔":["北坡尽头","步行约42分钟；东段封闭"]}; return <div className="map-page"><div className="map-canvas"><div className="island-shape" />{Object.keys(places).map((p,i)=><button key={p} style={{left:`${16+(i*13)%70}%`,top:`${18+(i*17)%62}%`}} className={place===p?"active":""} onClick={()=>setPlace(p)}><i>{i+1}</i>{p}</button>)}</div><aside><p>雾港岛 · 公开地图</p><h2>{place}</h2><b>{places[place][0]}</b><p>{places[place][1]}</p>{place==="客运码头"&&<CollectButton id="ferry-list" found={found} collect={collect}/>} {place==="潮生宾馆"&&<CollectButton id="hotel-log" found={found} collect={collect}/>}<button className="route" onClick={()=>notify("路线已加入行程：地图距离不会随剧情改变")}>查看步行路线</button></aside></div> }

function Evidence({found,chapter}:{found:string[];chapter:number}) { const items=CLUES.filter(c=>found.includes(c.id)); return <div className="evidence-page"><header><p>INVESTIGATION NOTES</p><h1>调查手记</h1><span>只保存原始材料，不替你写结论。</span></header>{items.length?<div className="evidence-grid">{items.map((c,i)=><article key={c.id}><span>{String(i+1).padStart(2,"0")} · 第{c.chapter}章</span><h3>{c.title}</h3><p>{c.text}</p><small>来源：{c.source}</small></article>)}</div>:<div className="empty-evidence">还没有收录材料。打开讯息中的妈妈，完成第一次“查看—收录—返回问题”循环。</div>}<footer>当前章节：{CHAPTERS[chapter-1].title}</footer></div> }

function Board({chapter,collected,selected,toggle,answer,setAnswer,submit}:any) { return <div className="board-page"><header><p>阶段结论随时开放</p><h1>{CHAPTERS[chapter-1].question}</h1><span>请选择2—4份材料。系统只判断整组证据是否足够，不逐项提示对错。</span></header><form onSubmit={submit}><div className="board-columns"><section><h3>一、选择支撑材料 <small>{selected.length}/4</small></h3>{collected.length?collected.map((c:Clue)=><button type="button" key={c.id} className={selected.includes(c.id)?"selected":""} onClick={()=>toggle(c.id)}><i>{selected.includes(c.id)?"✓":"+"}</i><span><b>{c.title}</b><small>{c.source}</small></span></button>):<p className="board-empty">先去调查并收录本章材料。</p>}</section><section><h3>二、写下阶段判断</h3>{chapter===1?<div className="answers"><label><input type="radio" name="a" value="left" checked={answer==="left"} onChange={e=>setAnswer(e.target.value)}/>林琴已经通过非公开方式离岛</label><label><input type="radio" name="a" value="island" checked={answer==="island"} onChange={e=>setAnswer(e.target.value)}/>没有可靠记录证明她离岛，她仍在岛上的可能性最高</label><label><input type="radio" name="a" value="accident" checked={answer==="accident"} onChange={e=>setAnswer(e.target.value)}/>她在海上遭遇了无法解释的事故</label></div>:chapter===2?<div className="answers"><label><input type="radio" name="a" value="coincidence" checked={answer==="coincidence"} onChange={e=>setAnswer(e.target.value)}/>十二份记录只是年代接近</label><label><input type="radio" name="a" value="transfer" checked={answer==="transfer"} onChange={e=>setAnswer(e.target.value)}/>儿童经福利、医疗和港口系统被分散转运到乙区</label><label><input type="radio" name="a" value="ghost" checked={answer==="ghost"} onChange={e=>setAnswer(e.target.value)}/>孩子们被民俗仪式召集到岛上</label></div>:<div className="answers"><label><input type="radio" name="a" value="publish" checked={answer==="publish"} onChange={e=>setAnswer(e.target.value)}/>立刻公开所有供体、受体与后代姓名</label><label><input type="radio" name="a" value="destroy" checked={answer==="destroy"} onChange={e=>setAnswer(e.target.value)}/>先销毁编号表，阻止灵异扩散</label><label><input type="radio" name="a" value="rescue-first" checked={answer==="rescue-first"} onChange={e=>setAnswer(e.target.value)}/>先按检修道救人并异地备份，再分层公开犯罪证据</label></div>}<button className="submit-conclusion" disabled={selected.length<2||!answer}>{chapter===3?"执行最终行动":"提交阶段结论"}</button></section></div></form></div> }
