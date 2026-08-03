"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Panel =
  | "phone"
  | "people"
  | "archive"
  | "signal"
  | "identity"
  | "timeline"
  | "board"
  | "conclusion";
type Verdict = "key" | "doubt" | "noise";
type Ending = "wrong" | "partial" | "truth" | null;
type PhoneView =
  | "home"
  | "wechat"
  | "lin"
  | "chen"
  | "files"
  | "group"
  | "gallery"
  | "notes"
  | "weather"
  | "map"
  | "phone"
  | "contacts"
  | "messages"
  | "browser";
type ArchiveResult =
  | "notices"
  | "article"
  | "ledger"
  | "town"
  | "harbor"
  | "clockmaker"
  | "weather"
  | "school"
  | "empty";
type Clue = {
  id: string;
  title: string;
  body: string;
  kind: "statement" | "object" | "record" | "correction";
  source: string;
};

const CLUES: Record<string, Clue> = {
  voice: {
    id: "voice",
    title: "最后语音",
    body: "林岚追查母亲林琴的失踪。民宿老板娘却把她叫作外婆年轻时的名字“周岚”。",
    kind: "statement",
    source: "手机 / 23:17",
  },
  ex: {
    id: "ex",
    title: "陈放的威胁",
    body: "前男友发来“你敢走，我一定找到你”。最符合常见失踪案的嫌疑人。",
    kind: "statement",
    source: "已删除聊天",
  },
  pills: {
    id: "pills",
    title: "安眠药收据",
    body: "失踪当天下午购买了两盒处方安眠药，取药人栏模糊。",
    kind: "object",
    source: "林岚外套口袋",
  },
  buoy: {
    id: "buoy",
    title: "17号浮标",
    body: "林岚相机中的第一张照片。编号17被重新刷过，底下隐约还有别的数字。",
    kind: "object",
    source: "照片 A",
  },
  clock: {
    id: "clock",
    title: "停在03:17的钟",
    body: "烧毁的钟表行里，能辨认的钟全部停在03:17，年份却横跨三十年。",
    kind: "object",
    source: "照片 B",
  },
  crate: {
    id: "crate",
    title: "木箱编号0617",
    body: "北码头木箱上的编号。与失踪日期相同，像是刻意留下的答案。",
    kind: "object",
    source: "照片 D",
  },
  alibi: {
    id: "alibi",
    title: "陈放的不在场证明",
    body: "23:00—次日01:20，陈放在跨城高速收费站连续出现。威胁指的是林岚借走的相机。",
    kind: "correction",
    source: "收费站回执",
  },
  prescription: {
    id: "prescription",
    title: "处方属于林母",
    body: "药店留档的患者是林琴——林岚患失眠的母亲。林岚只是代取。",
    kind: "correction",
    source: "海潮药房",
  },
  notices: {
    id: "notices",
    title: "三张失踪启事",
    body: "1992、2009、2026年的寻人启事，姓名不同，照片里的女人却长着同一张脸；每一代都在下一代出现前三天失踪。",
    kind: "record",
    source: "旧报缩微库",
  },
  article: {
    id: "article",
    title: "“白塔低潮”",
    body: "四段火灾报道的首字组成“白塔低潮”。报道日期每17年被重印一次。",
    kind: "record",
    source: "雾港旧闻",
  },
  signal: {
    id: "signal",
    title: "浮标残余信号",
    body: "摩斯码译出317；降噪后的女声说：“不是第十七号，是第十七次。”",
    kind: "record",
    source: "143.17 kHz",
  },
  ledger: {
    id: "ledger",
    title: "沉名会乙册",
    body: "名册前17行是归潮号死者；第18行记录每一轮意外闯入、看见真相后必须消失的目击者——这一轮是你。",
    kind: "record",
    source: "来源不明 / 乙册",
  },
  identity: {
    id: "identity",
    title: "三名一人",
    body: "周岚、林琴和林岚不是祖孙三代。照片、血型与左耳伤痕证明她们是同一个“返乡者”。",
    kind: "record",
    source: "身份归并表",
  },
  timeline: {
    id: "timeline",
    title: "两次十七年",
    body: "1992、2009、2026不是巧合：事故、火灾与失踪分别发生在同一轮回的三个节点。",
    kind: "record",
    source: "时间线复原",
  },
};

const NAV: { id: Panel; icon: string; label: string; act: number }[] = [
  { id: "phone", icon: "信", label: "手机", act: 1 },
  { id: "people", icon: "人", label: "关系", act: 1 },
  { id: "archive", icon: "档", label: "旧档", act: 2 },
  { id: "signal", icon: "波", label: "信号", act: 2 },
  { id: "identity", icon: "名", label: "身份", act: 2 },
  { id: "timeline", icon: "时", label: "时间线", act: 2 },
  { id: "board", icon: "证", label: "证据板", act: 2 },
  { id: "conclusion", icon: "结", label: "结案", act: 3 },
];

const PHOTOS = [
  {
    src: "/evidence/buoy-17.webp",
    title: "外礁现场",
    clue: "buoy",
    hint: "IMG_0617_A / 创建时间不可信",
    x: "23%",
    y: "61%",
  },
  {
    src: "/evidence/clock-shop.webp",
    title: "白鹭钟表行",
    clue: "clock",
    hint: "IMG_0617_B / 文件曾被覆盖",
    x: "51%",
    y: "28%",
  },
  {
    src: "/evidence/harbor-map.webp",
    title: "无名航图",
    clue: null,
    hint: "IMG_0617_C / 无定位信息",
    x: "50%",
    y: "50%",
  },
  {
    src: "/evidence/pier-0617.webp",
    title: "北码头",
    clue: "crate",
    hint: "IMG_0617_D / 镜头焦距 35mm",
    x: "83%",
    y: "71%",
  },
];

const TIMELINE_EVENTS = [
  {
    id: "arrival",
    date: "2026.06.17",
    title: "林岚抵达雾港",
    text: "手机最后定位进入旧港区。",
  },
  {
    id: "first",
    date: "1992.06.18",
    title: "周岚户籍首次出现",
    text: "此前没有出生、入学或医疗记录。",
  },
  {
    id: "fire",
    date: "2009.06.17",
    title: "白鹭钟表行起火",
    text: "店主沈砚失踪，林琴户籍同日建立。",
  },
  {
    id: "wreck",
    date: "1992.06.17",
    title: "“归潮号”失联",
    text: "船上17人，官方记录为零伤亡。",
  },
  {
    id: "mother",
    date: "2026.06.14",
    title: "林琴失联",
    text: "家中旧表停在03:17。",
  },
  {
    id: "blackout",
    date: "1992.06.17 03:17",
    title: "灯塔人为熄灭",
    text: "值守记录被撕去一页。",
  },
];

const VICTIMS = [
  "许望海",
  "周岚",
  "沈萍",
  "顾长青",
  "白小满",
  "陈述",
  "林鹤",
  "江秋生",
  "宋娟",
  "何有福",
  "冯春来",
  "叶知潮",
  "吴静",
  "赵棠",
  "韩树",
  "乔冬青",
  "罗闻舟",
];

const PEOPLE: {
  id: string;
  name: string;
  role: string;
  avatar: string;
  photo: string;
  text: string;
  action: string;
  need?: string;
  clue?: string;
  archive?: boolean;
}[] = [
  {
    id: "chen",
    name: "陈放",
    role: "前男友 / 摄影器材租赁",
    avatar: "陈",
    photo: "/people/chen-fang-real.png",
    text: "承认发过威胁消息。称争执围绕一台未归还的相机，案发夜正在跨城高速。",
    action: "核对行程",
    need: "ex",
    clue: "alibi",
  },
  {
    id: "pharmacist",
    name: "吴敏",
    role: "海潮药房 / 夜班药师",
    avatar: "吴",
    photo: "/people/wu-min-real.png",
    text: "记得取药的年轻女人，也记得处方上的患者姓名被胶带遮住一半。",
    action: "调取处方",
    need: "pills",
    clue: "prescription",
  },
  {
    id: "qin",
    name: "林琴",
    role: "母亲 / 失联3日",
    avatar: "琴",
    photo: "/people/lin-qin-real.png",
    text: "旧户籍显示生于雾港，出生地址却是一片在1987年填海形成的空地。",
    action: "查旧报",
    archive: true,
  },
  {
    id: "landlady",
    name: "赵桂香",
    role: "潮生民宿 / 老板娘",
    avatar: "赵",
    photo: "/people/zhao-guixiang-real.png",
    text: "坚持自己从未见过林琴，却在群聊里把林岚叫作‘周岚’。",
    action: "记下口供",
  },
  {
    id: "driver",
    name: "高进",
    role: "网约车司机 / 最后接触者",
    avatar: "高",
    photo: "/people/gao-jin-real.png",
    text: "称22:46把林岚送到北码头；订单轨迹却在距码头两公里处提前结束。",
    action: "查看轨迹",
  },
  {
    id: "classmate",
    name: "苏晴",
    role: "大学同学 / 合作摄影师",
    avatar: "苏",
    photo: "/people/su-qing-real.png",
    text: "说林岚近一个月沉迷家族史，还把三张不同年代的女人照片当作同一人的自拍。",
    action: "记录证词",
  },
];

const ARCHIVE_BACKGROUND: Record<
  string,
  { date: string; section: string; title: string; excerpt: string }
> = {
  town: {
    date: "1987.09.02",
    section: "地方志 / 城建",
    title: "东滩完成填海，旧门牌整体注销",
    excerpt: "新建海堤覆盖原周家坳、白塔坡等七处旧址。迁出人口名册缺失第17页。",
  },
  harbor: {
    date: "1992.06.19",
    section: "港务简报 / 内参",
    title: "北码头夜间封闭，十七只货箱下落不明",
    excerpt: "港务局称系台风预案演练。值守表上两名签字人后来否认当夜到岗。",
  },
  clockmaker: {
    date: "2009.06.18",
    section: "社会新闻 / 第03版",
    title: "白鹭钟表行失火，店主沈砚失踪",
    excerpt:
      "火场内有十七只停在03:17的旧钟。警方按电路老化结案，未发现店主遗体。",
  },
  weather: {
    date: "1992.06.17",
    section: "气象观测 / 站史",
    title: "当夜能见度并未达到停航标准",
    excerpt:
      "03:00—04:00海面能见度1.8公里、风力三级，与‘极端浓雾导致事故’的报道矛盾。",
  },
  school: {
    date: "2009.09.01",
    section: "教育年鉴 / 新生",
    title: "南陵小学接收一名无转学档案女生",
    excerpt: "女生登记名林琴，监护人栏为空。班主任备注：她坚持自己已经十七岁。",
  },
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<Panel>("phone");
  const [found, setFound] = useState<string[]>([]);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [peopleVerdicts, setPeopleVerdicts] = useState<Record<string, Verdict>>(
    {},
  );
  const [photo, setPhoto] = useState<number | null>(null);
  const [phonePhoto, setPhonePhoto] = useState<{
    src: string;
    title: string;
    crop?: string;
    cropSize?: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [archiveResults, setArchiveResults] = useState<ArchiveResult[]>([]);
  const [archiveSearched, setArchiveSearched] = useState(false);
  const [phoneView, setPhoneView] = useState<PhoneView>("home");
  const [notesOpen, setNotesOpen] = useState(false);
  const [callState, setCallState] = useState<{
    name: string;
    status: "calling" | "failed";
  } | null>(null);
  const [morse, setMorse] = useState("");
  const [answers, setAnswers] = useState({ cause: "", cycle: "", self: "" });
  const [ending, setEnding] = useState<Ending>(null);
  const [notice, setNotice] = useState("");
  const [identityDraft, setIdentityDraft] = useState<Record<string, string>>({
    "1992": "",
    "2009": "",
    "2026": "",
  });
  const [timelineDraft, setTimelineDraft] = useState<string[]>([]);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("fog-harbor-v4") || "null");
      if (s) {
        setStarted(!!s.started);
        setFound(s.found || []);
        setVerdicts(s.verdicts || {});
      }
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "fog-harbor-v4",
      JSON.stringify({ started, found, verdicts }),
    );
  }, [started, found, verdicts]);
  const act =
    found.includes("ledger") &&
    found.includes("identity") &&
    found.includes("timeline")
      ? 3
      : found.length >= 6
        ? 2
        : 1;
  const progress = Math.min(
    100,
    Math.round((found.length / Object.keys(CLUES).length) * 100),
  );
  const notes = useMemo(
    () => found.map((id) => CLUES[id]).filter(Boolean),
    [found],
  );
  const toast = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2400);
  };
  const discover = (id: string) => {
    setFound((v) => (v.includes(id) ? v : [...v, id]));
    toast(`新证据：${CLUES[id].title}`);
  };
  const go = (id: Panel, need: number) => {
    if (need > act) {
      toast("该模块暂时无法连接。");
      return;
    }
    setPanel(id);
    setArchiveResults([]);
    setArchiveSearched(false);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => {
    localStorage.removeItem("fog-harbor-v4");
    setStarted(false);
    setFound([]);
    setVerdicts({});
    setPeopleVerdicts({});
    setPanel("phone");
    setEnding(null);
    setAnswers({ cause: "", cycle: "", self: "" });
    setIdentityDraft({ "1992": "", "2009": "", "2026": "" });
    setTimelineDraft([]);
    setMorse("");
    setPhoneView("home");
    setCallState(null);
  };
  const lookup = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    const hits: ArchiveResult[] = [];
    if (q.includes("林岚") || q.includes("周岚") || q.includes("林琴")) {
      hits.push("notices", "school");
      discover("notices");
    }
    if (q.includes("白鹭") || q.includes("钟表") || q.includes("沈砚")) {
      hits.push("article", "clockmaker");
      discover("article");
    }
    if (q.includes("归潮") || q.includes("沉船") || q.includes("渡船")) {
      hits.push("article", "weather", "harbor");
      discover("article");
    }
    if (q.includes("雾港") || q.includes("地方志") || q.includes("周家坳"))
      hits.push("town", "harbor");
    if (q.includes("灯塔") || q.includes("浓雾") || q.includes("天气"))
      hits.push("weather", "article");
    if (q.includes("北码头") || q.includes("港务") || q.includes("走私"))
      hits.push("harbor");
    if (q.includes("学校") || q.includes("南陵") || q.includes("新生"))
      hits.push("school");
    if (
      (q.includes("0617") || q.includes("沉名")) &&
      found.includes("identity") &&
      found.includes("timeline")
    ) {
      hits.push("ledger");
      discover("ledger");
    }
    const unique = [...new Set(hits)];
    setArchiveResults(unique.length ? unique : ["empty"]);
    setArchiveSearched(true);
  };
  const submitMorse = (e: FormEvent) => {
    e.preventDefault();
    if (morse === "317") discover("signal");
    else {
      setMorse("");
      toast("译码错误。三组信号分别对应三个数字。");
    }
  };
  const placeCall = (name: string) => {
    setCallState({ name, status: "calling" });
    window.setTimeout(() => setCallState({ name, status: "failed" }), 1800);
  };
  const submitIdentity = (e: FormEvent) => {
    e.preventDefault();
    const ok =
      identityDraft["1992"] === "zhou-first" &&
      identityDraft["2009"] === "qin-second" &&
      identityDraft["2026"] === "lan-third";
    if (ok) discover("identity");
    else toast("身份归并存在矛盾。系统不会指出是哪一行。");
  };
  const timelineAnswer = [
    "blackout",
    "wreck",
    "first",
    "fire",
    "mother",
    "arrival",
  ];
  const submitTimeline = () => {
    if (timelineDraft.length !== timelineAnswer.length) {
      toast("时间线尚未完整。");
      return;
    }
    if (timelineDraft.every((x, i) => x === timelineAnswer[i]))
      discover("timeline");
    else {
      setTimelineDraft([]);
      toast("时间线无法成立，已清空排序。");
    }
  };
  const submitConclusion = (e: FormEvent) => {
    e.preventDefault();
    if (
      answers.cause === "coverup" &&
      answers.cycle === "borrow" &&
      answers.self === "names"
    )
      setEnding("truth");
    else if (answers.self === "rescue" || answers.cause === "smuggling")
      setEnding("partial");
    else setEnding("wrong");
  };

  if (!started)
    return (
      <main className="landing">
        <section className="hero">
          <div className="moon" />
          <div className="mist mist-one" />
          <div className="mist mist-two" />
          <div className="mountain mountain-one" />
          <div className="mountain mountain-two" />
          <div className="lighthouse">
            <i />
          </div>
          <div className="sea">
            <i />
            <i />
            <i />
          </div>
          <div className="hero-copy">
            <p className="eyebrow">普通失踪案 · 编号 0617</p>
            <h1>雾 港 来 信</h1>
            <p className="roman">SHE WAS ONLY SUPPOSED TO BE MISSING</p>
            <button className="seal-button" onClick={() => setStarted(true)}>
              接 案
            </button>
          </div>
          <div className="visitor-number">RECOVERED VIDEO / 018</div>
        </section>
        <section className="prologue">
          <div className="prologue-index">CASE 0617</div>
          <div>
            <p className="kicker">失踪第 19 小时</p>
            <h2>
              她去找失踪的母亲，
              <br />
              然后也没有回来。
            </h2>
          </div>
          <div className="prologue-body">
            <p>
              林岚，27岁，自由摄影师。母亲林琴失联三天后，她独自去了母亲从不肯提起的故乡——雾港。
            </p>
            <p>
              你只是途经雾港的路人。回城末班车上，你在最后一排捡到一部手机；锁屏写着：“如果我没回来，请把它交给顾远。”
            </p>
            <p>
              公交站已经无人值守，手机没有信号。你打开随身相机，决定先找到失主。前男友的威胁、安眠药、一个不存在的地址——看上去，这只是普通失踪。
            </p>
            <button className="text-button" onClick={() => setStarted(true)}>
              查看她的手机 <span>↗</span>
            </button>
          </div>
        </section>
      </main>
    );

  if (ending) return <EndingView type={ending} onReset={reset} />;

  return (
    <main className={`game-shell act-${act}`}>
      <header className="game-header">
        <div className="brand">
          <span>雾</span>
          <div>
            REC-018 现场记录<small>记录者身份不明 · 文件已恢复</small>
          </div>
        </div>
        <div className="progress-wrap">
          <div className="progress-copy">
            <span>证据完整度</span>
            <b>{progress}%</b>
          </div>
          <div className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button className="reset" onClick={reset}>
          清空档案
        </button>
      </header>
      <div className="act-ribbon">
        <b>第 {act === 1 ? "一" : act === 2 ? "二" : "三"} 幕</b>
        <span>
          {act === 1
            ? "她为什么离开"
            : act === 2
              ? "这不是第一次"
              : "录像没有记录你的离开"}
        </span>
      </div>
      <div className="workspace">
        <nav className="app-nav">
          {NAV.map((n, i) => (
            <button
              key={n.id}
              className={`${panel === n.id ? "active" : ""} ${n.act > act ? "locked" : ""}`}
              onClick={() => go(n.id, n.act)}
            >
              <span>{n.act > act ? "·" : n.icon}</span>
              <em>0{i + 1}</em>
              <b>{n.label}</b>
            </button>
          ))}
        </nav>
        <section className="case-window">
          <div className="window-bar">
            <span>●　●　●</span>
            <b>CASE / 0617 / {panel.toUpperCase()}</b>
            <time>03:17</time>
          </div>
          {panel === "phone" && (
            <div className="panel-view phone-case">
              <div className="section-heading">
                <p>末班车遗失物 · 无网络</p>
                <h2>林岚的手机</h2>
                <span>电量 17%</span>
              </div>
              <div className="phone-layout">
                <div className="wechat-phone">
                  <div className="wechat-status">
                    <span>23:17</span>
                    <b>··· ᯤ 17%</b>
                  </div>
                  {phoneView === "home" ? (
                    <div className="phone-home">
                      <div className="phone-date">
                        <b>23:17</b>
                        <span>6月17日　星期三</span>
                      </div>
                      <div className="phone-apps">
                        <button onClick={() => setPhoneView("wechat")}>
                          <i className="app-wechat" />
                          <span>微信</span>
                          <em>3</em>
                        </button>
                        <button onClick={() => setPhoneView("gallery")}>
                          <i className="app-gallery">✿</i>
                          <span>照片</span>
                        </button>
                        <button onClick={() => setPhoneView("notes")}>
                          <i className="app-notes">▤</i>
                          <span>备忘录</span>
                        </button>
                        <button onClick={() => setPhoneView("weather")}>
                          <i className="app-weather">☁</i>
                          <span>天气</span>
                        </button>
                        <button onClick={() => setPhoneView("map")}>
                          <i className="app-map" />
                          <span>地图</span>
                        </button>
                        <button onClick={() => setPhoneView("phone")}>
                          <i className="app-phone" />
                          <span>电话</span>
                        </button>
                        <button onClick={() => setPhoneView("contacts")}>
                          <i className="app-contacts" />
                          <span>通讯录</span>
                        </button>
                        <button onClick={() => setPhoneView("messages")}>
                          <i className="app-messages" />
                          <span>信息</span>
                          <em>2</em>
                        </button>
                        <button onClick={() => setPhoneView("browser")}>
                          <i className="app-browser" />
                          <span>Safari</span>
                        </button>
                      </div>
                      <div className="phone-dock">
                        <button onClick={() => setPhoneView("phone")}>
                          <i className="dock-phone">☎</i>
                          <span>电话</span>
                        </button>
                        <button onClick={() => setPhoneView("messages")}>
                          <i className="dock-messages">●</i>
                          <span>信息</span>
                        </button>
                        <button onClick={() => setPhoneView("wechat")}>
                          <i className="dock-wechat">••</i>
                          <span>微信</span>
                        </button>
                        <button onClick={() => setPhoneView("gallery")}>
                          <i className="dock-gallery">✿</i>
                          <span>照片</span>
                        </button>
                      </div>
                    </div>
                  ) : phoneView === "wechat" ? (
                    <>
                      <div className="wechat-header">
                        <button
                          className="app-back"
                          onClick={() => setPhoneView("home")}
                        >
                          ‹
                        </button>
                        微信 <small>(3)</small>
                        <i>⊕</i>
                      </div>
                      <div className="wechat-search">⌕　搜索</div>
                      <div className="wechat-list">
                        <button onClick={() => setPhoneView("lin")}>
                          <span className="wx-avatar self">顾</span>
                          <div>
                            <b>顾远</b>
                            <p>[语音] 00:17</p>
                          </div>
                          <time>
                            23:17<em>1</em>
                          </time>
                        </button>
                        <button onClick={() => setPhoneView("chen")}>
                          <span className="wx-avatar dark">陈</span>
                          <div>
                            <b>陈放</b>
                            <p>你敢走，我一定找到你。</p>
                          </div>
                          <time>
                            22:17<em>2</em>
                          </time>
                        </button>
                        <button onClick={() => setPhoneView("files")}>
                          <span className="wx-avatar folder">票</span>
                          <div>
                            <b>票证卡包</b>
                            <p>海潮药房电子票据</p>
                          </div>
                          <time>16:17</time>
                        </button>
                        <button onClick={() => setPhoneView("group")}>
                          <span className="wx-avatar group">群</span>
                          <div>
                            <b>雾港民宿住客群</b>
                            <p>“老板娘”撤回了一条消息</p>
                          </div>
                          <time>03:17</time>
                        </button>
                      </div>
                      <div className="wechat-tabs">
                        <span className="active">
                          ●<b>微信</b>
                        </span>
                        <span>
                          ♧<b>通讯录</b>
                        </span>
                        <span>
                          ◎<b>发现</b>
                        </span>
                        <span>
                          ○<b>我</b>
                        </span>
                      </div>
                    </>
                  ) : (
                      ["lin", "chen", "files", "group"] as PhoneView[]
                    ).includes(phoneView) ? (
                    <>
                      <div className="wechat-chatbar">
                        <button onClick={() => setPhoneView("wechat")}>
                          ‹
                        </button>
                        <b>
                          {phoneView === "lin"
                            ? "顾远"
                            : phoneView === "chen"
                              ? "陈放"
                              : phoneView === "files"
                                ? "票证卡包"
                                : "雾港民宿住客群"}
                        </b>
                        <i>•••</i>
                      </div>
                      <div className="wechat-conversation">
                        {phoneView === "lin" && (
                          <>
                            <div className="wx-time">昨天 22:17</div>
                            <div className="wx-row right">
                              <p>我妈失联三天了。她旧表背面刻着“白鹭”。</p>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-row left">
                              <span className="wx-avatar self">顾</span>
                              <p>报警了吗？你别一个人去雾港。</p>
                            </div>
                            <div className="wx-row right">
                              <p>
                                警察说成年人失联不够24小时。她户籍上的出生地根本不存在。
                              </p>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-row right wx-photo-row">
                              <button
                                className="wx-photo"
                                onClick={() => setPhoto(0)}
                              >
                                <img src={PHOTOS[0].src} alt="17号浮标" />
                              </button>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-row right">
                              <p>浮标明明是17号，漆下面却像写着“第17次”。</p>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-row right wx-photo-row">
                              <button
                                className="wx-photo"
                                onClick={() => setPhoto(1)}
                              >
                                <img src={PHOTOS[1].src} alt="白鹭钟表行" />
                              </button>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-row left">
                              <span className="wx-avatar self">顾</span>
                              <p>别进店，先发定位给我。</p>
                            </div>
                            <div className="wx-row right wx-photo-row two">
                              <button
                                className="wx-photo"
                                onClick={() => setPhoto(2)}
                              >
                                <img src={PHOTOS[2].src} alt="航图" />
                              </button>
                              <button
                                className="wx-photo"
                                onClick={() => setPhoto(3)}
                              >
                                <img src={PHOTOS[3].src} alt="北码头" />
                              </button>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-time">23:17</div>
                            <div className="wx-row right voice">
                              <button onClick={() => discover("voice")}>
                                )))　17″
                              </button>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            {found.includes("voice") && (
                              <div className="wx-transcript">
                                “民宿老板娘认识我。她叫我周岚……但那是我外婆年轻时的名字。她还问，你这次怎么没和我一起来。”
                              </div>
                            )}
                          </>
                        )}
                        {phoneView === "chen" && (
                          <>
                            <div className="wx-time">星期二 21:17</div>
                            <div className="wx-row left">
                              <span className="wx-avatar dark">陈</span>
                              <p>相机还我。</p>
                            </div>
                            <div className="wx-row right">
                              <p>拍完这个项目就还。</p>
                              <span className="wx-avatar green">岚</span>
                            </div>
                            <div className="wx-row left">
                              <span className="wx-avatar dark">陈</span>
                              <p>你敢走，我一定找到你。</p>
                            </div>
                            <button
                              className="wx-save"
                              onClick={() => discover("ex")}
                            >
                              {found.includes("ex")
                                ? "已加入证据板"
                                : "将对话加入证据板"}
                            </button>
                          </>
                        )}
                        {phoneView === "files" && (
                          <>
                            <div className="wx-time">昨天 16:17</div>
                            <div className="receipt">
                              <b>海潮药房</b>
                              <span>电子票据</span>
                              <p>佐匹克隆片　2盒</p>
                              <p>患者：周*　取药人：林*</p>
                              <strong>¥ 76.00</strong>
                            </div>
                            <button
                              className="wx-save"
                              onClick={() => discover("pills")}
                            >
                              {found.includes("pills")
                                ? "已加入证据板"
                                : "将票据加入证据板"}
                            </button>
                          </>
                        )}
                        {phoneView === "group" && (
                          <>
                            <div className="wx-time">昨天 18:41</div>
                            <div className="wx-group-line">
                              <b>老板娘</b>
                              <p>
                                今晚三点后退潮。住客不要离开房间，也不要回应走廊里叫名字的人。
                              </p>
                            </div>
                            <div className="wx-group-line mine">
                              <b>林岚</b>
                              <p>请问白鹭钟表行怎么走？我来找林琴。</p>
                            </div>
                            <div className="wx-group-line">
                              <b>老板娘</b>
                              <p>周岚，你外婆没告诉你不要回来吗？</p>
                            </div>
                            <div className="wx-revoked">
                              “老板娘”撤回了一条消息
                            </div>
                            <div className="wx-group-line">
                              <b>103房</b>
                              <p>老板娘认错人了吧，她姓林。</p>
                            </div>
                            <div className="wx-group-line">
                              <b>老板娘</b>
                              <p>我们这里，从来没有人姓林。</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="wechat-input">
                        <button>＋</button>
                        <span />
                        <button>☺</button>
                      </div>
                    </>
                  ) : null}
                  {phoneView === "gallery" && (
                    <div className="phone-app-view">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>照片</b>
                        <span>选择</span>
                      </header>
                      <div className="album-meta">
                        <b>最近项目</b>
                        <span>11张照片</span>
                      </div>
                      <div className="phone-gallery">
                        <button
                          onClick={() =>
                            setPhonePhoto({
                              src: "/people/lin-lan-real.png",
                              title: "自拍 · 6月14日",
                            })
                          }
                        >
                          <img
                            src="/people/lin-lan-real.png"
                            alt="林岚的自拍"
                          />
                          <span>自拍 · 6月14日</span>
                        </button>
                        {PHOTOS.map((item, index) => (
                          <button
                            key={item.src}
                            onClick={() => setPhoto(index)}
                          >
                            <img src={item.src} alt={item.title} />
                            <span>
                              {item.title}
                              {item.clue && found.includes(item.clue)
                                ? " · 已检查"
                                : ""}
                            </span>
                          </button>
                        ))}
                        {[
                          ["left top", "22:58 · 末班车"],
                          ["right top", "00:41 · 钟表行"],
                          ["left bottom", "02:52 · 0617木箱"],
                          ["right bottom", "03:17 · 最后画面"],
                        ].map(([crop, title]) => (
                          <button
                            key={crop}
                            onClick={() =>
                              setPhonePhoto({
                                src: "/evidence/rec-018-contact.png",
                                title,
                                crop,
                                cropSize: "200% 200%",
                              })
                            }
                          >
                            <i
                              className="gallery-crop recovered-gallery-crop"
                              style={{
                                backgroundImage:
                                  "url(/evidence/rec-018-contact.png)",
                                backgroundPosition: crop,
                              }}
                            />
                            <span>{title}</span>
                          </button>
                        ))}
                        {[
                          ["/evidence/escape-031648.png", "03:16 · 逃离钟表行"],
                          ["/evidence/fall-031709.png", "03:17 · 坠落前"],
                        ].map(([src, title]) => (
                          <button
                            key={src}
                            onClick={() => setPhonePhoto({ src, title })}
                          >
                            <img src={src} alt={title} />
                            <span>{title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {phoneView === "notes" && (
                    <div className="phone-app-view notes-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>备忘录</b>
                        <span>完成</span>
                      </header>
                      <h3>去雾港前</h3>
                      <time>6月16日 23:17</time>
                      <p>1. 找到妈妈，不要相信她留在家里的信。</p>
                      <p>2. 白鹭不是鸟，是旧表背面的刻字。</p>
                      <p>3. 如果老板娘叫我周岚，先别纠正她。</p>
                      <p>4. 手机交给顾远。别让捡到它的人来找我。</p>
                    </div>
                  )}
                  {phoneView === "weather" && (
                    <div className="phone-app-view weather-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>雾港</b>
                        <span>⋯</span>
                      </header>
                      <strong>17°</strong>
                      <p>浓雾　能见度1.8公里</p>
                      <div>
                        <b>03:00</b>
                        <span>退潮</span>
                        <em>0.17m</em>
                      </div>
                      <small>气象缓存更新时间：1992年6月17日 03:17</small>
                    </div>
                  )}
                  {phoneView === "map" && (
                    <div className="phone-app-view ios-map-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>地图</b>
                        <span>⋯</span>
                      </header>
                      <div className="ios-map-canvas">
                        <i className="map-route" />
                        <button
                          className="ios-pin pin-a"
                          onClick={() =>
                            toast("22:46 · 车辆轨迹在海堤检查站结束。")
                          }
                        >
                          22:46
                        </button>
                        <button
                          className="ios-pin pin-b"
                          onClick={() =>
                            toast("23:11 · 林岚步行经过白鹭钟表行。")
                          }
                        >
                          23:11
                        </button>
                        <button
                          className="ios-pin pin-c"
                          onClick={() =>
                            toast("23:17 · 最后定位漂移至北码头水面。")
                          }
                        >
                          23:17
                        </button>
                      </div>
                      <section className="map-card">
                        <small>最后位置</small>
                        <h3>北码头外堤</h3>
                        <p>精度 ±170 米　·　23:17停止更新</p>
                        <div>
                          <b>路线中断</b>
                          <span>车辆并未到达最后定位点</span>
                        </div>
                      </section>
                    </div>
                  )}
                  {phoneView === "phone" && (
                    <div className="phone-app-view ios-list-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>最近通话</b>
                        <span>编辑</span>
                      </header>
                      <div className="ios-segment">
                        <b>全部</b>
                        <span>未接来电</span>
                      </div>
                      {[
                        ["妈妈", "未接来电 · 3次", "03:17"],
                        ["顾远", "移动电话", "昨天"],
                        ["+86 0317 0017", "已注销号码", "6月14日"],
                        ["潮生民宿", "呼出电话 · 17秒", "6月14日"],
                      ].map(([name, meta, time]) => (
                        <button
                          className="ios-call-row"
                          key={name}
                          onClick={() => placeCall(name)}
                        >
                          <i>☎</i>
                          <div>
                            <b>{name}</b>
                            <small>{meta}</small>
                          </div>
                          <time>{time}</time>
                          <em>ⓘ</em>
                        </button>
                      ))}
                      <nav className="ios-tabbar">
                        <span>
                          ☆<b>个人收藏</b>
                        </span>
                        <span className="active">
                          ◷<b>最近通话</b>
                        </span>
                        <button onClick={() => setPhoneView("contacts")}>
                          ♙<b>通讯录</b>
                        </button>
                        <span>
                          ⌨<b>拨号键盘</b>
                        </span>
                      </nav>
                    </div>
                  )}
                  {phoneView === "contacts" && (
                    <div className="phone-app-view ios-list-app contacts-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>通讯录</b>
                        <span>＋</span>
                      </header>
                      <div className="ios-search">⌕　搜索</div>
                      <h4>我的名片　林岚</h4>
                      {[
                        ["顾远", "摄影搭档"],
                        ["妈妈", "林琴"],
                        ["陈放", "不要接"],
                        ["海潮药房", "处方"],
                        ["潮生民宿", "雾港"],
                        ["白鹭钟表行", "号码创建于2009年"],
                      ].map(([name, meta]) => (
                        <button
                          className="contact-row"
                          key={name}
                          onClick={() => placeCall(name)}
                        >
                          <i>{name.slice(0, 1)}</i>
                          <div>
                            <b>{name}</b>
                            <small>{meta}</small>
                          </div>
                          <span>☎</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {phoneView === "messages" && (
                    <div className="phone-app-view ios-list-app messages-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>‹</button>
                        <b>信息</b>
                        <span>□</span>
                      </header>
                      <div className="ios-search">⌕　搜索</div>
                      <article>
                        <i>妈</i>
                        <div>
                          <b>妈妈</b>
                          <time>6月14日</time>
                          <p>草稿：岚岚，如果我又叫错你的名字，不要回答……</p>
                        </div>
                      </article>
                      <article>
                        <i>顾</i>
                        <div>
                          <b>顾远</b>
                          <time>昨天</time>
                          <p>我到了以后给你回电话。</p>
                        </div>
                      </article>
                      <article className="unread">
                        <i>17</i>
                        <div>
                          <b>未知发件人</b>
                          <time>03:17</time>
                          <p>你捡到的不是手机，是她留下的位置。</p>
                        </div>
                      </article>
                      <article>
                        <i>中</i>
                        <div>
                          <b>中国移动</b>
                          <time>2009/06/17</time>
                          <p>欢迎回到雾港。本地服务有效期：17年。</p>
                        </div>
                      </article>
                    </div>
                  )}
                  {phoneView === "browser" && (
                    <div className="phone-app-view safari-app">
                      <header>
                        <button onClick={() => setPhoneView("home")}>
                          完成
                        </button>
                        <b>历史记录</b>
                        <span>清除</span>
                      </header>
                      <div className="safari-address">
                        aA　⌕ 搜索或输入网址　↻
                      </div>
                      <section>
                        <h3>今天</h3>
                        {[
                          ["23:08", "白鹭钟表行 雾港", "未找到仍在营业的商户"],
                          ["22:51", "成年人失联多久可以报警", "公安政务服务"],
                          [
                            "21:17",
                            "照片日期早于相机发布日期",
                            "数码影像时间戳修复",
                          ],
                          [
                            "20:43",
                            "一个人会记得自己没经历过的事吗",
                            "记忆错构与代际创伤",
                          ],
                          [
                            "19:02",
                            "归潮号 1992 雾港",
                            "该搜索结果已根据当地法规移除",
                          ],
                        ].map(([time, title, meta]) => (
                          <button key={time} onClick={() => toast(meta)}>
                            <time>{time}</time>
                            <div>
                              <b>{title}</b>
                              <small>{meta}</small>
                            </div>
                            <span>›</span>
                          </button>
                        ))}
                      </section>
                      <section>
                        <h3>6月14日</h3>
                        <button
                          onClick={() =>
                            toast("网页缓存只剩一句：别让第十八个人看见名单。")
                          }
                        >
                          <time>03:17</time>
                          <div>
                            <b>雾港地方志 PDF 下载</b>
                            <small>连接已失效</small>
                          </div>
                          <span>›</span>
                        </button>
                      </section>
                    </div>
                  )}
                  {callState && (
                    <div className="call-overlay">
                      <small>
                        {callState.status === "calling"
                          ? "正在呼叫…"
                          : "呼叫失败"}
                      </small>
                      <h3>{callState.name}</h3>
                      <p>
                        {callState.status === "calling"
                          ? "雾港　移动电话"
                          : "您拨打的号码不在服务区"}
                      </p>
                      <div className="call-actions">
                        <i>静音</i>
                        <i>键盘</i>
                        <i>免提</i>
                      </div>
                      <button onClick={() => setCallState(null)}>☎</button>
                    </div>
                  )}
                </div>
                <div className="phone-extract">
                  <h3>随身录像</h3>
                  <dl>
                    <div>
                      <dt>记录编号</dt>
                      <dd>REC-018</dd>
                    </div>
                    <div>
                      <dt>开始时间</dt>
                      <dd>2026.06.17 22:51</dd>
                    </div>
                    <div>
                      <dt>最后画面</dt>
                      <dd className="danger">03:17:42</dd>
                    </div>
                    <div>
                      <dt>记录者</dt>
                      <dd>身份未知</dd>
                    </div>
                  </dl>
                  <p>你以为录像仍在实时保存。</p>
                </div>
              </div>
            </div>
          )}

          {panel === "people" && (
            <div className="panel-view">
              <div className="section-heading">
                <p>基础走访</p>
                <h2>她身边的人</h2>
                <span>口供可能说谎，时间不会</span>
              </div>
              <div className="people-list">
                {PEOPLE.map((person) => (
                  <article
                    key={person.id}
                    className={peopleVerdicts[person.id] || ""}
                  >
                    <button
                      className="person-photo-button"
                      aria-label={`查看${person.name}照片`}
                      onClick={() =>
                        setPhonePhoto({ src: person.photo, title: person.name })
                      }
                    >
                      <img
                        className="person-photo"
                        src={person.photo}
                        alt={person.name}
                      />
                    </button>
                    <div className="person-copy">
                      <small>{person.role}</small>
                      <h3>{person.name}</h3>
                      <p>{person.text}</p>
                      <div className="person-judgment">
                        <span>你的判断</span>
                        {(["key", "doubt", "noise"] as Verdict[]).map((v) => (
                          <button
                            key={v}
                            className={
                              peopleVerdicts[person.id] === v ? "active" : ""
                            }
                            onClick={() =>
                              setPeopleVerdicts((x) => ({
                                ...x,
                                [person.id]: v,
                              }))
                            }
                          >
                            {v === "key"
                              ? "相关"
                              : v === "doubt"
                                ? "待查"
                                : "无关"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      className="person-action"
                      disabled={!!person.need && !found.includes(person.need)}
                      onClick={() => {
                        if (person.archive)
                          return found.length >= 6
                            ? go("archive", 2)
                            : toast("旧报数据库尚未授权。先检查其他基础证据。");
                        if (person.clue) return discover(person.clue);
                        toast(
                          person.id === "driver"
                            ? "平台回执：轨迹在海堤检查站中断，司机未进入码头。"
                            : person.id === "landlady"
                              ? "口供已保存：她在三个日期都使用过同一身份证号。"
                              : "证词已保存，但暂时无法验证。",
                        );
                      }}
                    >
                      {person.action}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {panel === "archive" && (
            <div className="panel-view archive-case">
              <div className="section-heading">
                <p>雾港地方志 · 缩微档案</p>
                <h2>搜索被忘记的人</h2>
                <span>资料范围 1975—2026</span>
              </div>
              <form className="search-box" onSubmit={lookup}>
                <span>雾港报刊联合索引</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="输入关键词"
                />
                <button>检索</button>
              </form>
              <div className="archive-toolbar">
                <span>馆藏 12,804 页</span>
                <span>报纸　地方志　内部简报</span>
                <b>
                  {archiveSearched
                    ? `${archiveResults.filter((x) => x !== "empty").length} 条结果`
                    : "离线检索"}
                </b>
              </div>
              {!archiveSearched && (
                <div className="archive-hints">
                  <p>
                    索引包含人名、地名、商号、船名与年份。扫描件可能存在识别错误。
                  </p>
                </div>
              )}
              {archiveResults.includes("empty") && (
                <div className="no-result">
                  未找到“{search}”的精确记录。尝试完整姓名、旧地名或机构名称。
                </div>
              )}
              {archiveResults.filter((id) => id in ARCHIVE_BACKGROUND).length >
                0 && (
                <div className="archive-results">
                  {archiveResults
                    .filter((id) => id in ARCHIVE_BACKGROUND)
                    .map((id) => {
                      const item = ARCHIVE_BACKGROUND[id];
                      return (
                        <article key={id}>
                          <header>
                            <span>{item.section}</span>
                            <time>{item.date}</time>
                          </header>
                          <h3>{item.title}</h3>
                          <p>{item.excerpt}</p>
                          {(id === "harbor" || id === "town") && (
                            <div className="archive-redacted-lines">
                              <i />
                              <i />
                              <i />
                            </div>
                          )}
                          <footer>
                            OCR置信度 {id === "harbor" ? "63" : "91"}
                            %　·　馆藏缩微胶片
                          </footer>
                        </article>
                      );
                    })}
                </div>
              )}
              {archiveResults.includes("notices") && (
                <div className="notices-grid">
                  {[
                    ["1992", "周岚", "17岁"],
                    ["2009", "林琴", "17岁"],
                    ["2026", "林岚", "27岁"],
                  ].map((x, i) => (
                    <article key={x[0]}>
                      <div className="notice-face">
                        <img
                          src={
                            [
                              "/people/zhou-lan-real.png",
                              "/people/lin-qin-real.png",
                              "/people/lin-lan-real.png",
                            ][i]
                          }
                          alt={x[1]}
                        />
                      </div>
                      <b>寻 人 启 事</b>
                      <h3>{x[1]}</h3>
                      <p>{x[2]}，最后出现于白鹭钟表行附近。</p>
                      <time>{x[0]}.06.17</time>
                    </article>
                  ))}
                  <div className="archive-shock">
                    三张照片经面部比对，相似度 97.8%。原始比对员姓名已被覆盖。
                    <br />
                    <small>
                      <span className="redaction wide" />
                      　批注：不要让她知道自己见过这张脸。
                    </small>
                  </div>
                </div>
              )}
              {archiveResults.includes("article") && (
                <article className="record-card newspaper marked">
                  <div>
                    <span>雾港旧闻 / 第04版</span>
                    <time>每17年重印</time>
                  </div>
                  <h3>“归潮号”雾中失联，官方通报零伤亡</h3>
                  <div className="acrostic">
                    <p>
                      <i>白</i>雾封岸那晚，灯塔比排班提前熄灭了四十分钟。
                    </p>
                    <p>
                      <i>塔</i>下找到十七双鞋，第二天却被水泥封死。
                    </p>
                    <p>
                      <i>低</i>潮时，钟表匠沈砚将十七个名字刻进店里的座钟。
                    </p>
                    <p>
                      <i>潮</i>退之后，周家多了一个女儿，没人记得她从哪里来。
                    </p>
                    <p className="redacted-copy">
                      <i>■</i>
                      <span className="redaction" />
                      于03:17签署封口令。现场第十八人
                      <span className="redaction short" />。
                    </p>
                  </div>
                  <footer>
                    <span>
                      记者署名：沈砚 / 编辑：
                      <i className="redaction short" /> / 该版发行前全部回收
                    </span>
                  </footer>
                  <div className="reporter-file">
                    <img src="/people/shen-yan-real.png" alt="沈砚档案照" />
                    <p>
                      <b>沈砚</b>
                      <span>记者 / 白鹭钟表行店主</span>
                      <small>
                        2009年火灾后失踪。警方档案没有尸检记录，却在死亡证明上盖了两次章。
                      </small>
                    </p>
                  </div>
                </article>
              )}
              {archiveResults.includes("ledger") && (
                <div className="ledger">
                  <header>
                    <b>沉 名 会 · 乙 册</b>
                    <span>第七码头 / 不得誊抄</span>
                  </header>
                  {[...VICTIMS, "第十八席"].map((name, i) => (
                    <div className={i === 17 ? "you" : ""} key={i}>
                      <em>{String(i + 1).padStart(2, "0")}</em>
                      <span>{i < 17 ? name : "你的名字"}</span>
                      <time>{i === 17 ? "2026.06.18" : "1992.06.17"}</time>
                      <b>
                        {i === 17 ? "待处理" : i === 1 ? "借名中" : "待念名"}
                      </b>
                    </div>
                  ))}
                  <p>
                    “第十八席”不是成员称谓，而是每轮被留在现场的目击者。登记时间比当前录像晚了四小时；姓名栏的衣着描述与你一致。沉名会从不吸收新人，只负责让知情者没有名字。
                  </p>
                </div>
              )}
            </div>
          )}

          {panel === "signal" && (
            <div className="panel-view">
              <div className="section-heading">
                <p>17号浮标 · 断电前缓存</p>
                <h2>一段不像求救的信号</h2>
                <span>循环间隔 00:17</span>
              </div>
              <div className="radio-console">
                <div className="frequency">
                  <small>RECEIVED / 03:17:17</small>
                  <b>...--　 .----　 --...</b>
                  <div className="waveform">
                    {Array.from({ length: 38 }).map((_, i) => (
                      <i
                        key={i}
                        style={{ height: `${15 + ((i * 23) % 65)}%` }}
                      />
                    ))}
                  </div>
                </div>
                <form onSubmit={submitMorse}>
                  <label>输入三位译码</label>
                  <div>
                    <input
                      value={morse}
                      onChange={(e) =>
                        setMorse(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={3}
                      inputMode="numeric"
                      placeholder="???"
                    />
                    <button>降噪</button>
                  </div>
                </form>
              </div>
              {found.includes("signal") && (
                <div className="signal-transcript">
                  <span>降噪文本 / 女性 / 身份未知</span>
                  <p>
                    “……不是第十七号，是第十七次。林岚没有失踪，她只是被想起来了。下一次，他们会叫她别的名字。”
                  </p>
                  <small>
                    声纹比对：与林岚相似度 51%，与其母林琴相似度 98%。
                  </small>
                </div>
              )}
            </div>
          )}

          {panel === "identity" && (
            <div className="panel-view identity-view">
              <div className="section-heading">
                <p>户籍冲突 / 三份档案</p>
                <h2>她们究竟是谁</h2>
                <span>系统只验证整张表，不反馈单项</span>
              </div>
              <div className="identity-source">
                <p>
                  三人的血型均为 AB−，左耳后均有一道 2.1cm 旧伤。照片面部相似度
                  97.8%。
                </p>
                <p>户籍系统却将她们登记为外婆、母亲与女儿。</p>
              </div>
              <form className="identity-table" onSubmit={submitIdentity}>
                {[
                  ["1992", "周岚", "17岁", "1992年寻人启事"],
                  ["2009", "林琴", "17岁", "2009年火灾附件"],
                  ["2026", "林岚", "27岁", "当前失踪人口"],
                ].map((row) => (
                  <label key={row[0]}>
                    <time>{row[0]}</time>
                    <div>
                      <b>{row[1]}</b>
                      <small>
                        {row[2]} · {row[3]}
                      </small>
                    </div>
                    <select
                      value={identityDraft[row[0]]}
                      onChange={(e) =>
                        setIdentityDraft((v) => ({
                          ...v,
                          [row[0]]: e.target.value,
                        }))
                      }
                    >
                      <option value="">选择她在仪式中的身份</option>
                      <option value="zhou-first">
                        第一代借名者 / 原名周岚
                      </option>
                      <option value="qin-second">
                        第二代借名者 / 继承周岚记忆
                      </option>
                      <option value="lan-third">
                        第三代借名者 / 本轮返乡者
                      </option>
                      <option value="relative">普通血亲 / 与仪式无关</option>
                    </select>
                  </label>
                ))}
                <button className="verify-sheet">提交三项归并</button>
              </form>
              {found.includes("identity") && (
                <div className="identity-reveal">
                  <b>归并通过</b>
                  <p>
                    所谓“三代女性”没有任何同时出现的合影。每一次新户籍建立，上一代就在三天前失踪。
                  </p>
                </div>
              )}
            </div>
          )}

          {panel === "timeline" && (
            <div className="panel-view timeline-view">
              <div className="section-heading">
                <p>事件复盘 / 批量验证</p>
                <h2>把因果放回时间里</h2>
                <span>依次选择事件；错误时全部清空</span>
              </div>
              <div className="timeline-pool">
                {TIMELINE_EVENTS.map((event) => (
                  <button
                    key={event.id}
                    disabled={timelineDraft.includes(event.id)}
                    onClick={() => setTimelineDraft((v) => [...v, event.id])}
                  >
                    <time>{event.date}</time>
                    <b>{event.title}</b>
                    <p>{event.text}</p>
                  </button>
                ))}
              </div>
              <div className="timeline-sequence">
                <header>
                  <span>你的顺序</span>
                  <button onClick={() => setTimelineDraft([])}>清空</button>
                </header>
                <ol>
                  {timelineDraft.map((id) => (
                    <li key={id}>
                      {TIMELINE_EVENTS.find((e) => e.id === id)?.title}
                    </li>
                  ))}
                </ol>
                <button className="verify-sheet" onClick={submitTimeline}>
                  验证完整时间线
                </button>
              </div>
              {found.includes("timeline") && (
                <div className="identity-reveal">
                  <b>时间线成立</b>
                  <p>
                    灯塔熄灭在前，沉船在后；“零伤亡”报道与17人名单同时存在。2009年的火灾不是事故，而是沈砚第一次试图烧掉借名簿。
                  </p>
                </div>
              )}
            </div>
          )}

          {panel === "board" && (
            <div className="panel-view">
              <div className="section-heading">
                <p>自由推理</p>
                <h2>证据可信度</h2>
                <span>标记不会阻止剧情，但会影响你的判断</span>
              </div>
              <div className="board-summary">
                <b>{Object.keys(verdicts).length}</b>
                <span>已判断 / {found.length} 条证据</span>
                <p>
                  {verdicts.ex === "noise" && verdicts.pills === "noise"
                    ? "你开始把“看起来最合理的故事”与事实分开。"
                    : "越符合常识的线索，越可能让你过早结案。"}
                </p>
              </div>
              <div className="clue-board">
                {notes.map((c) => (
                  <article
                    key={c.id}
                    className={`${c.kind} ${verdicts[c.id] || ""}`}
                  >
                    <header>
                      <span>{c.source}</span>
                      <i>
                        {c.kind === "correction"
                          ? "反证"
                          : c.kind === "record"
                            ? "档案"
                            : "证物"}
                      </i>
                    </header>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                    <footer>
                      {(["key", "doubt", "noise"] as Verdict[]).map((v) => (
                        <button
                          key={v}
                          className={verdicts[c.id] === v ? "active" : ""}
                          onClick={() =>
                            setVerdicts((x) => ({ ...x, [c.id]: v }))
                          }
                        >
                          {v === "key"
                            ? "关键"
                            : v === "doubt"
                              ? "存疑"
                              : "干扰"}
                        </button>
                      ))}
                    </footer>
                  </article>
                ))}
              </div>
            </div>
          )}

          {panel === "conclusion" && (
            <div className="panel-view conclusion-view">
              <div className="section-heading">
                <p>结案前最后确认</p>
                <h2>你愿意相信哪个故事？</h2>
                <span>提交后不可撤回</span>
              </div>
              <form onSubmit={submitConclusion}>
                <Question
                  title="林岚失踪的真正原因"
                  value={answers.cause}
                  onChange={(v) => setAnswers((a) => ({ ...a, cause: v }))}
                  options={[
                    ["ex", "前男友报复"],
                    ["smuggling", "她撞破了1992年延续至今的走私案"],
                    ["coverup", "当年的责任人与借名仪式共同制造了本次失踪"],
                  ]}
                />
                <Question
                  title="三代女性拥有同一张脸，最合理的解释是什么"
                  value={answers.cycle}
                  onChange={(v) => setAnswers((a) => ({ ...a, cycle: v }))}
                  options={[
                    ["photos", "档案照片被人替换"],
                    ["bloodline", "罕见的家族遗传"],
                    ["borrow", "同一个死者正在沿着伪造的母女关系不断借名"],
                  ]}
                />
                <Question
                  title="现在，你准备怎样结束这件事"
                  value={answers.self}
                  onChange={(v) => setAnswers((a) => ({ ...a, self: v }))}
                  options={[
                    ["arrest", "把最像凶手的人交给警方，结束调查"],
                    ["rescue", "只带林岚离开，公开走私证据"],
                    [
                      "names",
                      "在03:17念出17名死者的姓名，让他们不再借别人的名字回来",
                    ],
                  ]}
                />
                <button
                  className="submit-case"
                  disabled={!answers.cause || !answers.cycle || !answers.self}
                >
                  提交结案报告
                </button>
              </form>
            </div>
          )}
        </section>
        <aside className={`notebook ${notesOpen ? "open" : ""}`}>
          <button
            className="notebook-toggle"
            onClick={() => setNotesOpen((v) => !v)}
            aria-expanded={notesOpen}
          >
            <span>调查手记</span>
            <b>
              {found.length}/{Object.keys(CLUES).length}
            </b>
            <i>{notesOpen ? "收起" : "展开"}</i>
          </button>
          <div className="notebook-title">
            <span>✎</span>
            <div>
              <b>调查手记</b>
              <small>
                {found.length} / {Object.keys(CLUES).length} 条证据
              </small>
            </div>
          </div>
          <div className="note-list grouped-notes">
            {(
              [
                ["statement", "对话与口供"],
                ["object", "照片与实物"],
                ["record", "档案与记录"],
                ["correction", "核查与反证"],
              ] as const
            ).map(([kind, label]) => {
              const items = notes.filter((c) => c.kind === kind).reverse();
              return (
                <details key={kind}>
                  <summary>
                    <span>{label}</span>
                    <b>{items.length}</b>
                  </summary>
                  {items.length ? (
                    items.map((c, i) => (
                      <div className="note" key={c.id}>
                        <em>{String(i + 1).padStart(2, "0")}</em>
                        <div>
                          <b>{c.title}</b>
                          <p>{c.body}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="notes-empty">尚无记录</p>
                  )}
                </details>
              );
            })}
          </div>
        </aside>
      </div>
      {photo !== null && (
        <div className="lightbox">
          <button className="lightbox-close" onClick={() => setPhoto(null)}>
            关闭 ×
          </button>
          <div className="photo-stage">
            <img src={PHOTOS[photo].src} alt={PHOTOS[photo].title} />
            {PHOTOS[photo].clue && (
              <button
                className="hotspot"
                style={{ left: PHOTOS[photo].x, top: PHOTOS[photo].y }}
                onClick={() => discover(PHOTOS[photo].clue!)}
              >
                <i />
              </button>
            )}
          </div>
          <div className="lightbox-caption">
            <span>RECOVERED / 2009</span>
            <div>
              <h3>{PHOTOS[photo].title}</h3>
              <p>{PHOTOS[photo].hint}</p>
              <small>
                文件哈希首次出现：2009.06.17
                <br />
                当前文件创建：2026.06.17
              </small>
            </div>
          </div>
        </div>
      )}
      {phonePhoto && (
        <div className="file-preview" onClick={() => setPhonePhoto(null)}>
          <button onClick={() => setPhonePhoto(null)}>关闭 ×</button>
          {phonePhoto.crop ? (
            <div
              className="cropped-frame"
              style={{
                backgroundImage: `url(${phonePhoto.src})`,
                backgroundPosition: phonePhoto.crop,
                backgroundSize: phonePhoto.cropSize || "cover",
              }}
            />
          ) : (
            <img src={phonePhoto.src} alt={phonePhoto.title} />
          )}
          <p>{phonePhoto.title}</p>
        </div>
      )}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}

function Question({
  title,
  value,
  onChange,
  options,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {options.map((o) => (
        <label key={o[0]} className={value === o[0] ? "selected" : ""}>
          <input
            type="radio"
            name={title}
            value={o[0]}
            checked={value === o[0]}
            onChange={() => onChange(o[0])}
          />
          <span>{o[1]}</span>
        </label>
      ))}
    </fieldset>
  );
}

function EndingView({
  type,
  onReset,
}: {
  type: Exclude<Ending, null>;
  onReset: () => void;
}) {
  if (type === "wrong")
    return (
      <main className="ending wrong-ending">
        <div className="ending-card">
          <p className="eyebrow">ENDING 01 · 最合理的答案</p>
          <h1>一个凶手。</h1>
          <p>
            陈放因涉嫌绑架被捕。警方在他的车里找到林岚相机的包装盒，却没有找到林岚。三个月后，他因证据不足获释。
          </p>
          <p>
            白鹭钟表行被拆除，归潮号的卷宗重新封存。林琴和林岚被登记为“主动离家”，案件在系统里显示已办结。
          </p>
          <p>
            画面在你把陈放的名字写进结案报告后中断。警方找到相机时，它躺在北码头储物柜里；你的遗体从未被找到。
          </p>
          <div className="last-message">
            <span>警方恢复记录 / 2026.07.03</span>
            “录像里的人身份不明，暂列第18名失踪者。”
          </div>
          <PoliceCoda />
          <button className="seal-button" onClick={onReset}>
            重新调查
          </button>
        </div>
      </main>
    );
  if (type === "partial")
    return (
      <main className="ending partial-ending">
        <div className="ending-card">
          <p className="eyebrow">ENDING 02 · 水面之下</p>
          <h1>你带她离开。</h1>
          <p>
            低潮时，你在灯塔地窖找到了林岚。码头仓库随后被查封，三名退休官员承认1992年曾为走私船关闭灯塔。
          </p>
          <p>
            官方把事件定性为走私、伪造户籍与长期非法拘禁。借名簿被当作封建迷信证物封存，没有人念出上面的名字。
          </p>
          <p>
            林岚出院后不再认识你。她坚持自己叫周岚，今年十七岁，母亲正在码头等她回家。
          </p>
          <p>
            这是警方根据你胸前相机恢复出的最后一段完整影像。救援人员在灯塔下找到林岚，却只在海堤边找到你的鞋。
          </p>
          <div className="last-message">
            <span>17年后 / 户籍自动登记</span>
            林岚，女，监护人不详。随附照片中的女人没有变老。
          </div>
          <PoliceCoda />
          <button className="seal-button" onClick={onReset}>
            重新调查
          </button>
        </div>
      </main>
    );
  return (
    <main className="ending truth-ending">
      <div className="ending-light" />
      <div className="ending-card">
        <p className="eyebrow">TRUE ENDING · 归还姓名</p>
        <h1>你把名字还给了海。</h1>
        <p>
          03:17，你在白塔下打开沈砚留下的座钟。录音里，他承认1992年的灯塔是为走私船人为熄灭的；十七名死者没有得到葬礼，村民便用一个女孩的名字替他们“活下去”。
        </p>
        <p>
          你没有再叫她周岚、林琴或林岚，而是照着名册念完十七个真正的姓名。每念一个，店里便有一只停了三十四年的钟重新走动。
        </p>
        <div className="victim-roll">
          {VICTIMS.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
        <p>
          最后一声钟响后，林岚醒来。她不记得雾港，也不再背负周岚与林琴的人生。她第一次可以决定自己叫什么。
        </p>
        <p>
          而你没有离开。画面倒在潮水里，直到三周后警方从灯塔排水沟找到相机。此刻发生的一切，是技术人员对你最后四小时录像的交互式复原。
        </p>
        <div className="last-message">
          <span>警方卷宗补录 / REC-018</span>
          “无名记录者死亡原因不明。因其影像，归潮号17名遇难者于34年后恢复姓名。”
        </div>
        <p className="afterthought">
          名册第18行只剩一句：路过的人，也应该有名字。
        </p>
        <PoliceCoda />
        <button className="seal-button" onClick={onReset}>
          忘掉，再来一次
        </button>
      </div>
    </main>
  );
}

function PoliceCoda() {
  return (
    <section className="police-coda">
      <span>恢复录像结束　04:01:17</span>
      <p>警察默默看完这盘录像带，摘下耳机，回头看了看天花板的一角。</p>
      <p>那里正在渗水。水滴落在文件柜顶，声音每隔十七秒重复一次。</p>
      <p>
        他推开门，门外仍是这间放映室。桌上的名册自己翻到最后一页，第十八席的旧字被划掉，重新写上了他的名字。
      </p>
      <b>进入轮回的人，从来没有出去过。</b>
    </section>
  );
}
