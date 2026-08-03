"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Panel = "message" | "archive" | "paper" | "tide" | "gate";
type Clue = { id: string; label: string; detail: string };

const clues: Record<string, Clue> = {
  buoy: { id: "buoy", label: "17号浮标", detail: "林岚失踪前最后追查的航标。" },
  time: { id: "time", label: "03:17", detail: "浮标失去信号的时间，也是钟表停摆的时刻。" },
  shop: { id: "shop", label: "白鹭钟表行", detail: "十年前的火灾现场，与旧灯塔地窖相通。" },
  tide: { id: "tide", label: "最低潮", detail: "凌晨 03:17，通往灯塔地窖的礁路会露出。" },
};

const panels: { id: Panel; icon: string; label: string }[] = [
  { id: "message", icon: "信", label: "来信" },
  { id: "archive", icon: "档", label: "海事档案" },
  { id: "paper", icon: "报", label: "旧报刊" },
  { id: "tide", icon: "潮", label: "潮汐表" },
  { id: "gate", icon: "锁", label: "灯塔入口" },
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<Panel>("message");
  const [found, setFound] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<"idle" | "buoy" | "shop" | "empty">("idle");
  const [code, setCode] = useState("");
  const [ended, setEnded] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("fog-harbor-save");
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      setStarted(Boolean(state.started));
      setFound(Array.isArray(state.found) ? state.found : []);
      setEnded(Boolean(state.ended));
    } catch { /* ignore an invalid local save */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("fog-harbor-save", JSON.stringify({ started, found, ended }));
  }, [started, found, ended]);

  const progress = Math.round((found.length / 4) * 100);
  const notes = useMemo(() => found.map((id) => clues[id]).filter(Boolean), [found]);

  function discover(id: string) {
    setFound((current) => current.includes(id) ? current : [...current, id]);
    setNotice(`线索已记录：${clues[id].label}`);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function search(event: FormEvent) {
    event.preventDefault();
    const key = query.trim().replaceAll(" ", "");
    if (panel === "archive" && (key.includes("17号") || key.includes("浮标"))) {
      setResult("buoy"); discover("time"); discover("shop");
    } else if (panel === "paper" && (key.includes("白鹭") || key.includes("钟表"))) {
      setResult("shop"); discover("shop");
    } else setResult("empty");
  }

  function resetGame() {
    localStorage.removeItem("fog-harbor-save");
    setStarted(false); setFound([]); setEnded(false); setPanel("message");
    setQuery(""); setResult("idle"); setCode("");
  }

  if (!started) {
    return <main className="landing">
      <section className="hero" aria-label="雾港灯塔">
        <div className="moon" />
        <div className="mist mist-one" /><div className="mist mist-two" />
        <div className="mountain mountain-one" /><div className="mountain mountain-two" />
        <div className="lighthouse"><i /><span /></div>
        <div className="sea"><i /><i /><i /></div>
        <div className="hero-copy">
          <p className="eyebrow">一 封 来 自 雾 中 的 信</p>
          <h1>雾 港 来 信</h1>
          <p className="roman">LETTERS FROM THE FOG HARBOR</p>
          <button className="seal-button" onClick={() => setStarted(true)}>拆 阅</button>
        </div>
        <div className="scroll-mark">向下 · 案件编号 0617</div>
      </section>
      <section className="prologue">
        <div className="prologue-index">01 — PROLOGUE</div>
        <div>
          <p className="kicker">网页解谜 · 原创短篇</p>
          <h2>潮水退去之前，<br />找到失踪的林岚。</h2>
        </div>
        <div className="prologue-body">
          <p>昨夜 23:40，你收到好友林岚发来的最后一条语音。背景里有钟声、海浪，以及一句模糊的“十七号”。</p>
          <p>搜索档案、交叉验证旧报刊和潮汐记录。每一条看似无关的信息，都可能是她留下的路标。</p>
          <button className="text-button" onClick={() => setStarted(true)}>进入调查 <span>↗</span></button>
        </div>
      </section>
    </main>;
  }

  if (ended) {
    return <main className="ending">
      <div className="ending-light" />
      <div className="ending-card">
        <p className="eyebrow">ENDING · 破晓之前</p>
        <h1>灯，亮了。</h1>
        <p>03:17，礁路从潮水下露出。你在旧灯塔的地窖找到了林岚，也找到了那本被藏了十年的航海记录。</p>
        <p>雾港没有吞掉秘密。它只是在等一个愿意把碎片拼起来的人。</p>
        <div className="ending-meta"><span>用时不重要</span><span>线索 {found.length} / 4</span></div>
        <button className="seal-button" onClick={resetGame}>再读一次</button>
      </div>
    </main>;
  }

  return <main className="game-shell">
    <header className="game-header">
      <div className="brand"><span>雾</span><div>雾港来信<small>调查终端 · 0617</small></div></div>
      <div className="progress-wrap" aria-label={`调查进度 ${progress}%`}>
        <div className="progress-copy"><span>调查进度</span><b>{String(progress).padStart(2, "0")}%</b></div>
        <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <button className="reset" onClick={resetGame}>重置调查</button>
    </header>

    <div className="workspace">
      <nav className="app-nav" aria-label="调查工具">
        {panels.map((item, index) => <button key={item.id} className={panel === item.id ? "active" : ""} onClick={() => { setPanel(item.id); setResult("idle"); setQuery(""); }}>
          <span>{item.icon}</span><em>0{index + 1}</em><b>{item.label}</b>
        </button>)}
      </nav>

      <section className="case-window">
        <div className="window-bar"><span>●　●　●</span><b>FOG-HARBOR / {panel.toUpperCase()}</b><time>03:08</time></div>

        {panel === "message" && <div className="message-view panel-view">
          <div className="section-heading"><p>最后通讯</p><h2>林岚</h2><span>离线 · 昨夜 23:40</span></div>
          <div className="chat-thread">
            <div className="date-line">6月17日</div>
            <div className="bubble incoming">我到雾港了。这里的人一到天黑就把钟停掉。</div>
            <div className="bubble outgoing">你不是只去拍灯塔吗？</div>
            <div className="bubble incoming">事情不对。十年前那场火不是事故。</div>
            <button className="voice-note" onClick={() => discover("buoy")}><i>▶</i><span><b>最后一条语音 · 00:12</b><small>点击转写录音</small></span></button>
            {found.includes("buoy") && <div className="transcript">“……如果我没回来，查 <mark>17号浮标</mark>。别信他们写下的日期，去找钟停下的时间。”</div>}
          </div>
          {!found.includes("buoy") && <p className="soft-hint">提示：有些声音，比文字更接近真相。</p>}
        </div>}

        {(panel === "archive" || panel === "paper") && <div className="search-view panel-view">
          <div className="section-heading"><p>{panel === "archive" ? "雾港海事局" : "地方报刊数字库"}</p><h2>{panel === "archive" ? "航标维护档案" : "《雾港旧闻》"}</h2><span>{panel === "archive" ? "1979—2026" : "1988—2026"}</span></div>
          <form className="search-box" onSubmit={search}><input aria-label="搜索关键词" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={panel === "archive" ? "输入航标编号或关键词" : "输入店名、事件或人物"} /><button>检索</button></form>
          {result === "idle" && <div className="empty-state"><span>⌕</span><p>档案不会主动开口。<br />输入你在别处找到的关键词。</p></div>}
          {result === "empty" && <div className="no-result">没有完全匹配的记录。换一个更具体的关键词。</div>}
          {result === "buoy" && <article className="record-card"><div><span>限制公开</span><time>2016.06.17</time></div><h3>17号近岸浮标 · 异常维护记录</h3><p>设备于凌晨 <mark>03:17</mark> 失去信号。现场打捞出一枚印有“<mark>白鹭钟表行</mark>”字样的铜制钥匙。记录人姓名已涂销。</p><footer>档案号 / M-17-0617</footer></article>}
          {result === "shop" && <article className="record-card newspaper"><div><span>第 04 版</span><time>2016.06.18</time></div><h3>白鹭钟表行深夜失火，店主去向不明</h3><p>火灾发生时，全店十三座钟均停在 <mark>03:17</mark>。老店后墙原与废弃灯塔的地下储藏室相通，通道只在最低潮时可进入。</p><footer>记者 / 沈砚　校对 / 佚名</footer></article>}
        </div>}

        {panel === "tide" && <div className="tide-view panel-view">
          <div className="section-heading"><p>6月18日 · 雾港外湾</p><h2>今夜潮汐</h2><span>数据每小时更新</span></div>
          <div className="tide-chart" aria-label="潮汐高度图"><div className="curve" /><div className="tide-point high"><i /><b>1.8m</b><small>00:20</small></div><button className="tide-point low" onClick={() => discover("tide")}><i /><b>0.2m</b><small>03:17 · 最低潮</small></button><div className="tide-point last"><i /><b>1.5m</b><small>07:40</small></div></div>
          <div className="tide-note"><b>航行提醒</b><p>03:02—03:31 外礁步道将短暂露出。非工作人员请勿前往旧灯塔。</p></div>
        </div>}

        {panel === "gate" && <div className="gate-view panel-view">
          <div className="gate-illustration"><div className="door"><i /><span>IV</span></div></div>
          <div className="gate-copy"><p className="kicker">旧灯塔 · 地下入口</p><h2>最后一扇门</h2><p>铁门上只有四个数字键。门框背面刻着一句话：</p><blockquote>“当所有钟都沉默，时间就是钥匙。”</blockquote>
            <form onSubmit={(e) => { e.preventDefault(); if (code === "0317") setEnded(true); else { setNotice("密码错误。回到档案中找钟停下的时间。"); setCode(""); } }}>
              <input aria-label="四位密码" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="····" /><button disabled={code.length !== 4}>解锁</button>
            </form>
          </div>
        </div>}
      </section>

      <aside className="notebook">
        <div className="notebook-title"><span>✎</span><div><b>调查手记</b><small>{found.length} / 4 条线索</small></div></div>
        <div className="note-list">{notes.length ? notes.map((clue, index) => <div className="note" key={clue.id}><em>0{index + 1}</em><div><b>{clue.label}</b><p>{clue.detail}</p></div></div>) : <p className="blank-notes">点击关键录音或数据，线索会自动记录在这里。</p>}</div>
        <div className="case-tip"><span>当前目标</span><p>{found.length === 0 ? "听完林岚的最后一条语音" : found.length < 3 ? "用关键词检索档案与旧报刊" : found.length < 4 ? "确认最低潮出现的时间" : "前往旧灯塔，输入四位密码"}</p></div>
      </aside>
    </div>
    {notice && <div className="toast" role="status">{notice}</div>}
  </main>;
}
