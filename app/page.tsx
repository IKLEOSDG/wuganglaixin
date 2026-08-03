"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Panel = "message" | "evidence" | "archive" | "paper" | "radio" | "map" | "gate";
type Clue = { id: string; label: string; detail: string };

const CLUES: Record<string, Clue> = {
  voice: { id: "voice", label: "最后语音", detail: "林岚反复说：查十七号，别信日期。" },
  buoy: { id: "buoy", label: "17号浮标", detail: "现场照片中的锈蚀浮标，编号仍清晰可见。" },
  time: { id: "time", label: "停摆时间 03:17", detail: "钟表行里所有大钟都停在同一时刻。" },
  case: { id: "case", label: "木箱编号 0617", detail: "码头照片右侧木箱上的四位数字。" },
  shop: { id: "shop", label: "白鹭钟表行", detail: "海事档案提到的铜钥匙来自这家店。" },
  acrostic: { id: "acrostic", label: "藏头：白塔低潮", detail: "旧报四段文字的首字连成新的指示。" },
  morse: { id: "morse", label: "信号译码 317", detail: "17号浮标最后发出：...-- .---- --..." },
  route: { id: "route", label: "路线：浮标→钟表行→灯塔", detail: "地图上的红线不是边界，而是抵达顺序。" },
};

const PANELS: { id: Panel; icon: string; label: string }[] = [
  { id: "message", icon: "信", label: "来信" },
  { id: "evidence", icon: "片", label: "照片" },
  { id: "archive", icon: "档", label: "档案" },
  { id: "paper", icon: "报", label: "旧报" },
  { id: "radio", icon: "波", label: "电台" },
  { id: "map", icon: "图", label: "地图" },
  { id: "gate", icon: "锁", label: "入口" },
];

const PHOTOS = [
  { src: "/evidence/buoy-17.webp", title: "外礁现场 A", caption: "冲洗日期被刮去。浮标表面似乎还有编号。", clue: "buoy", hint: "点按浮标上的白色数字", x: "23%", y: "61%" },
  { src: "/evidence/clock-shop.webp", title: "白鹭钟表行 B", caption: "火灾后的室内。所有钟都坏了吗？", clue: "time", hint: "点按最大的钟面", x: "51%", y: "27%" },
  { src: "/evidence/harbor-map.webp", title: "无名航图 C", caption: "三处地点被红笔连起，顺序尚不明确。", clue: null, hint: "这张图稍后会用到", x: "50%", y: "50%" },
  { src: "/evidence/pier-0617.webp", title: "北码头 D", caption: "注意画面右侧，而不是灯塔倒影。", clue: "case", hint: "点按右侧木箱", x: "83%", y: "71%" },
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<Panel>("message");
  const [found, setFound] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<"idle" | "buoy" | "shop" | "empty">("idle");
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [paperMarked, setPaperMarked] = useState(false);
  const [morseAnswer, setMorseAnswer] = useState("");
  const [route, setRoute] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [ended, setEnded] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("fog-harbor-save-v2");
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      setStarted(Boolean(state.started));
      setFound(Array.isArray(state.found) ? state.found : []);
      setEnded(Boolean(state.ended));
    } catch { /* corrupted saves are ignored */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("fog-harbor-save-v2", JSON.stringify({ started, found, ended }));
  }, [started, found, ended]);

  const notes = useMemo(() => found.map((id) => CLUES[id]).filter(Boolean), [found]);
  const progress = Math.round((found.length / Object.keys(CLUES).length) * 100);

  function toast(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function discover(id: string) {
    setFound((current) => current.includes(id) ? current : [...current, id]);
    toast(`线索已归档：${CLUES[id].label}`);
  }

  function go(next: Panel) {
    setPanel(next); setQuery(""); setResult("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function search(event: FormEvent) {
    event.preventDefault();
    const key = query.trim().replaceAll(" ", "");
    if (panel === "archive" && (key.includes("17") || key.includes("浮标"))) {
      setResult("buoy"); discover("shop");
    } else if (panel === "paper" && (key.includes("白鹭") || key.includes("钟表"))) {
      setResult("shop");
    } else setResult("empty");
  }

  function markPaper() {
    setPaperMarked(true); discover("acrostic");
  }

  function decodeMorse(event: FormEvent) {
    event.preventDefault();
    if (morseAnswer === "317") discover("morse");
    else { setMorseAnswer(""); toast("译码不对。对照下方数字表逐组转换。 "); }
  }

  function chooseRoute(place: string) {
    const answer = ["浮标", "钟表行", "灯塔"];
    const next = [...route, place];
    const valid = next.every((item, index) => item === answer[index]);
    if (!valid) { setRoute([]); toast("路线中断。照片里的红线要从林岚最先调查的地方开始。"); return; }
    setRoute(next);
    if (next.length === answer.length) discover("route");
  }

  function resetGame() {
    localStorage.removeItem("fog-harbor-save-v2");
    setStarted(false); setFound([]); setEnded(false); setPanel("message");
    setQuery(""); setResult("idle"); setCode(""); setRoute([]); setPaperMarked(false); setMorseAnswer("");
  }

  if (!started) return <main className="landing">
    <section className="hero" aria-label="雾港灯塔">
      <div className="moon" /><div className="mist mist-one" /><div className="mist mist-two" />
      <div className="mountain mountain-one" /><div className="mountain mountain-two" />
      <div className="lighthouse"><i /><span /></div><div className="sea"><i /><i /><i /></div>
      <div className="hero-copy"><p className="eyebrow">一 封 来 自 雾 中 的 信</p><h1>雾 港 来 信</h1><p className="roman">LETTERS FROM THE FOG HARBOR</p><button className="seal-button" onClick={() => setStarted(true)}>拆 阅</button></div>
      <div className="scroll-mark">向下 · 案件编号 0617</div>
    </section>
    <section className="prologue"><div className="prologue-index">01 — PROLOGUE</div><div><p className="kicker">沉浸式网页解谜 · 第一章</p><h2>潮水退去之前，<br />找到失踪的林岚。</h2></div><div className="prologue-body"><p>四张未冲洗完整的照片、一段受干扰的短波信号、一份日期被篡改的旧报纸，是她留下的全部。</p><p>观察图片细节，检索关键词，破解藏头与摩斯电码，再把地点按正确顺序连起来。</p><button className="text-button" onClick={() => setStarted(true)}>开始调查 <span>↗</span></button></div></section>
  </main>;

  if (ended) return <main className="ending"><div className="ending-light" /><div className="ending-card"><p className="eyebrow">TRUE ENDING · 破晓之前</p><h1>灯，亮了。</h1><p>凌晨 03:17，外礁步道露出海面。你用木箱编号和停摆时间打开了旧灯塔的门，在地窖里找到了林岚。</p><p>她手里的航海记录证明：十年前，雾港有人故意熄灭灯塔，引导一艘船撞向暗礁。那些被改掉的日期，终于重新回到纸上。</p><div className="ending-meta"><span>完整线索 {found.length} / 8</span><span>结局：雾散</span></div><button className="seal-button" onClick={resetGame}>重新调查</button></div></main>;

  return <main className="game-shell">
    <header className="game-header"><div className="brand"><span>雾</span><div>雾港来信<small>调查终端 · 0617</small></div></div><div className="progress-wrap"><div className="progress-copy"><span>调查进度</span><b>{String(progress).padStart(2, "0")}%</b></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div></div><button className="reset" onClick={resetGame}>重置调查</button></header>
    <div className="workspace">
      <nav className="app-nav" aria-label="调查工具">{PANELS.map((item, index) => <button key={item.id} className={panel === item.id ? "active" : ""} onClick={() => go(item.id)}><span>{item.icon}</span><em>0{index + 1}</em><b>{item.label}</b></button>)}</nav>
      <section className="case-window">
        <div className="window-bar"><span>●　●　●</span><b>FOG-HARBOR / {panel.toUpperCase()}</b><time>03:08</time></div>

        {panel === "message" && <div className="message-view panel-view"><div className="section-heading"><p>最后通讯 · 未结案</p><h2>林岚</h2><span>离线 · 6月17日 23:40</span></div><div className="chat-thread"><div className="date-line">6月17日</div><div className="bubble incoming">我到雾港了。这里的人一到天黑就把钟停掉。</div><div className="bubble outgoing">你不是只去拍灯塔吗？</div><div className="bubble incoming">事情不对。十年前那场火不是事故。我把照片传给你，原图里有东西。</div><button className="voice-note" onClick={() => discover("voice")}><i>▶</i><span><b>最后一条语音 · 00:18</b><small>点击转写受损录音</small></span></button>{found.includes("voice") && <div className="transcript">“……查十七号。别信他们写下的日期……<mark>时间藏在烧掉的店里</mark>。潮落后，从红线走。”</div>}</div><div className="next-action"><span>建议步骤</span><p>先查看林岚上传的四张原始照片。</p><button onClick={() => go("evidence")}>打开证物袋 →</button></div></div>}

        {panel === "evidence" && <div className="evidence-view panel-view"><div className="section-heading"><p>证物袋 E-0617</p><h2>未冲洗的照片</h2><span>4 张 · 点击放大调查</span></div><div className="photo-grid">{PHOTOS.map((photo, index) => <button className="photo-card" key={photo.src} onClick={() => setSelectedPhoto(index)}><img src={photo.src} alt={photo.title} /><span><b>{photo.title}</b><small>{found.includes(photo.clue || "-") ? "✓ 已发现线索" : "待调查"}</small></span></button>)}</div><p className="evidence-help">放大后点击照片中闪烁的调查点。不是每张照片都直接给出答案。</p></div>}

        {(panel === "archive" || panel === "paper") && <div className="search-view panel-view"><div className="section-heading"><p>{panel === "archive" ? "雾港海事局 · 内部镜像" : "地方报刊缩微数据库"}</p><h2>{panel === "archive" ? "航标维护档案" : "《雾港旧闻》"}</h2><span>{panel === "archive" ? "1979—2026" : "1988—2026"}</span></div><form className="search-box" onSubmit={search}><input aria-label="搜索关键词" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={panel === "archive" ? "输入照片中发现的航标编号" : "输入档案中出现的店名"} /><button>检索</button></form>{result === "idle" && <div className="empty-state"><span>⌕</span><p>输入从照片或其他档案中得到的关键词。<br />宽泛的词不会返回结果。</p></div>}{result === "empty" && <div className="no-result">没有完全匹配的记录。换一个更具体的编号或名称。</div>}{result === "buoy" && <article className="record-card"><div><span>限制公开 / 已恢复</span><time>2016.06.17</time></div><h3>17号近岸浮标 · 异常维护记录</h3><p>设备于凌晨 03:17 失去信号。打捞人员在电池仓内发现一枚铜制钥匙，背面铸有“<mark>白鹭钟表行</mark>”。当夜最后信号：<code>...-- .---- --...</code></p><footer>档案号 / M-17-0617　记录人 / 已涂销</footer></article>}{result === "shop" && <article className={`record-card newspaper ${paperMarked ? "marked" : ""}`}><div><span>第 04 版 / OCR恢复</span><time>报载日期有涂改</time></div><h3>白鹭钟表行深夜失火，店主去向不明</h3><div className="acrostic"><p><i>白</i>雾封住南岸那晚，巡夜人说没有听见钟响。</p><p><i>塔</i>影在海面断成三截，十三座钟同时停摆。</p><p><i>低</i>声报时的老座钟背后，砖墙曾被人重新砌过。</p><p><i>潮</i>水退尽时，旧地窖会露出一道只容一人通过的门。</p></div><footer><button onClick={markPaper}>{paperMarked ? "段首已标记" : "用红笔标记每段首字"}</button><span>记者 / 沈砚</span></footer></article>}</div>}

        {panel === "radio" && <div className="radio-view panel-view"><div className="section-heading"><p>短波接收机 · 143.17 kHz</p><h2>最后的信号</h2><span>来源：17号浮标</span></div><div className="radio-console"><div className="frequency"><small>SIGNAL FOUND</small><b>...--　 .----　 --...</b><div className="waveform">{Array.from({length:34}).map((_,i)=><i key={i} style={{height:`${18 + ((i*17)%55)}%`}} />)}</div></div><form onSubmit={decodeMorse}><label>将三组信号译成数字</label><div><input aria-label="摩斯电码答案" maxLength={3} inputMode="numeric" value={morseAnswer} onChange={(e)=>setMorseAnswer(e.target.value.replace(/\D/g,""))} placeholder="???" /><button>提交译码</button></div></form></div><div className="morse-sheet"><b>数字摩斯速查</b><div>{["1 ·----","2 ··---","3 ···--","4 ····-","5 ·····","6 -····","7 --···","8 ---··","9 ----·","0 -----"].map(x=><span key={x}>{x}</span>)}</div></div>{found.includes("morse") && <div className="decoded-message">译码成功：<strong>317</strong><p>它与照片里停摆的时间完全一致，但最终密码还缺少前两位。</p></div>}</div>}

        {panel === "map" && <div className="map-view panel-view"><div className="section-heading"><p>照片 C · 地图复原</p><h2>沿红线抵达灯塔</h2><span>按顺序点击 3 个地点</span></div><div className="interactive-map"><img src="/evidence/harbor-map.webp" alt="雾港旧航图" /><button className="map-point buoy-point" onClick={()=>chooseRoute("浮标")}><i />17号浮标</button><button className="map-point shop-point" onClick={()=>chooseRoute("钟表行")}><i />白鹭钟表行</button><button className="map-point tower-point" onClick={()=>chooseRoute("灯塔")}><i />旧灯塔</button></div><div className="route-strip"><span>抵达顺序</span><div>{[0,1,2].map(i=><b key={i}>{route[i] || "?"}</b>)}</div>{found.includes("route") && <p>路线确认。最低潮时，地窖入口可从灯塔东侧抵达。</p>}</div></div>}

        {panel === "gate" && <div className="gate-view panel-view"><div className="gate-illustration"><div className="door"><i /><span>VI</span></div></div><div className="gate-copy"><p className="kicker">旧灯塔 · 地下入口</p><h2>最后一扇门</h2><p>门锁需要六位数字。门框内刻着两行字：</p><blockquote>“先写木箱上的日期，<br />再写所有钟沉默的时间。”</blockquote><div className="requirements"><span className={found.includes("case") ? "done" : ""}>木箱编号</span><span className={found.includes("time") ? "done" : ""}>停摆时间</span><span className={found.includes("route") ? "done" : ""}>抵达路线</span></div><form onSubmit={(e)=>{e.preventDefault();if(code==="06170317"&&found.includes("route"))setEnded(true);else{setCode("");toast(found.includes("route")?"密码错误。按门框上的顺序拼接两组数字。":"铁门没有反应。你还没有确认抵达路线。");}}}><input aria-label="八位密码" inputMode="numeric" maxLength={8} value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,""))} placeholder="········" /><button disabled={code.length!==8}>解锁</button></form></div></div>}
      </section>

      <aside className="notebook"><div className="notebook-title"><span>✎</span><div><b>调查手记</b><small>{found.length} / 8 条线索</small></div></div><div className="note-list">{notes.length ? notes.map((clue,index)=><div className="note" key={clue.id}><em>{String(index+1).padStart(2,"0")}</em><div><b>{clue.label}</b><p>{clue.detail}</p></div></div>) : <p className="blank-notes">点击录音、照片调查点和关键文档，线索会自动记录。</p>}</div><div className="case-tip"><span>当前建议</span><p>{found.length<1?"转写林岚最后的语音":found.length<4?"放大四张照片，检查局部细节":!found.includes("shop")?"用浮标编号检索海事档案":!found.includes("acrostic")?"检索钟表行并标记报纸段首":!found.includes("morse")?"到短波电台译出最后信号":!found.includes("route")?"按线索顺序复原地图路线":"拼接木箱编号与停摆时间"}</p></div></aside>
    </div>

    {selectedPhoto !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="照片调查"><button className="lightbox-close" onClick={()=>setSelectedPhoto(null)}>关闭 ×</button><div className="photo-stage"><img src={PHOTOS[selectedPhoto].src} alt={PHOTOS[selectedPhoto].title} />{PHOTOS[selectedPhoto].clue && <button className="hotspot" style={{left:PHOTOS[selectedPhoto].x,top:PHOTOS[selectedPhoto].y}} aria-label={PHOTOS[selectedPhoto].hint} onClick={()=>discover(PHOTOS[selectedPhoto].clue!)}><i /></button>}</div><div className="lightbox-caption"><span>证物 0{selectedPhoto+1}</span><div><h3>{PHOTOS[selectedPhoto].title}</h3><p>{PHOTOS[selectedPhoto].caption}</p><small>{PHOTOS[selectedPhoto].hint}</small></div></div></div>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </main>;
}
