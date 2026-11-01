import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, BookOpen, CalendarDays, Check, CheckCheck,
  ChevronDown, CircleHelp, Clock3, CloudOff, Filter, GraduationCap,
  LayoutDashboard, ListChecks, Menu, Plus, RotateCcw, Search, Settings2,
  ShieldCheck, Sparkles, Target, X
} from "lucide-react";
import Dexie, { type Table } from "dexie";

type TopicStatus = "Not started" | "In progress" | "Complete";
type Track = { id: string; label: string; kind: "School" | "Competitive"; board?: string; standard?: string; year?: string };
type Topic = { id: string; trackId: string; subject: string; title: string; status: TopicStatus; updatedAt: string; nextRevision?: string; note?: string };
type Profile = { board: string; standard: string; year: string; competitive: string[]; name: string };

class SyllaDatabase extends Dexie {
  topics!: Table<Topic, string>;
  constructor() {
    super("syllakeep-prototype");
    this.version(1).stores({ topics: "id, trackId, subject, status, nextRevision" });
  }
}
const db = new SyllaDatabase();
const STORAGE_KEY = "syllakeep-prototype-profile-v1";
const TRACK_KEY = "syllakeep-prototype-active-track-v1";
const PREVIEW_KEY = "syllakeep-prototype-preview-v1";
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const id = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2);

const seedTopics: Topic[] = [
  { id: "demo-1", trackId: "demo-school", subject: "Physics", title: "Thermodynamics", status: "In progress", updatedAt: today(), nextRevision: plusDays(1) },
  { id: "demo-2", trackId: "demo-school", subject: "Physics", title: "Oscillations", status: "Not started", updatedAt: today() },
  { id: "demo-3", trackId: "demo-school", subject: "Chemistry", title: "Chemical Bonding", status: "Complete", updatedAt: today(), nextRevision: today() },
  { id: "demo-4", trackId: "demo-school", subject: "Mathematics", title: "Sequences and Series", status: "In progress", updatedAt: today() },
  { id: "demo-5", trackId: "demo-jee", subject: "Physics", title: "Rotational Motion", status: "In progress", updatedAt: today(), nextRevision: plusDays(-1) },
  { id: "demo-6", trackId: "demo-jee", subject: "Chemistry", title: "Equilibrium", status: "Not started", updatedAt: today() }
];

function App() {
  const [profile, setProfile] = useState<Profile | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Profile | null; } catch { return null; }
  });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState(localStorage.getItem(TRACK_KEY) || "");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState("Today");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showSetup, setShowSetup] = useState(!profile);
  const [showAdd, setShowAdd] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [preview, setPreview] = useState(localStorage.getItem(PREVIEW_KEY) === "yes");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ subject: "Physics", title: "", status: "Not started" as TopicStatus });
  const [setup, setSetup] = useState({ board: "ISC", standard: "Class 11", year: "2026–27", competitive: [] as string[], name: "" });

  useEffect(() => {
    let alive = true;
    db.topics.toArray().then((rows) => {
      if (alive) setTopics(rows);
    }).catch(() => setNotice("Local storage could not be opened in this browser."));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!profile) { setTracks([]); return; }
    const schoolId = "school-" + profile.board.toLowerCase() + "-" + profile.standard.replace(" ", "").toLowerCase();
    const next: Track[] = preview
      ? [
          { id: "demo-school", label: "ISC · Class 11 (preview)", kind: "School" },
          { id: "demo-jee", label: "JEE Main (preview)", kind: "Competitive" }
        ]
      : [{ id: schoolId, label: profile.board + " · " + profile.standard, kind: "School", board: profile.board, standard: profile.standard, year: profile.year }];
    if (!preview) profile.competitive.forEach((exam) => next.push({ id: "exam-" + exam.toLowerCase().replace(/ /g, "-"), label: exam, kind: "Competitive" }));
    setTracks(next);
    if (!activeTrack || !next.some((t) => t.id === activeTrack)) {
      setActiveTrack(next[0].id);
      localStorage.setItem(TRACK_KEY, next[0].id);
    }
  }, [profile, preview]);

  useEffect(() => { if (activeTrack) localStorage.setItem(TRACK_KEY, activeTrack); }, [activeTrack]);

  const active = tracks.find((t) => t.id === activeTrack) ?? tracks[0];
  const trackTopics = useMemo(() => topics.filter((t) => t.trackId === activeTrack), [topics, activeTrack]);
  const completed = trackTopics.filter((t) => t.status === "Complete").length;
  const started = trackTopics.filter((t) => t.status === "In progress").length;
  const dueTopics = trackTopics.filter((t) => t.nextRevision && t.nextRevision <= today());
  const upcomingTopics = trackTopics.filter((t) => t.nextRevision && t.nextRevision > today());
  const pct = trackTopics.length ? Math.round(completed / trackTopics.length * 100) : 0;
  const visibleTopics = trackTopics.filter((t) => {
    const matches = (t.title + " " + t.subject).toLowerCase().includes(query.toLowerCase());
    return matches && (filter === "All" || t.status === filter);
  });
  const isDemo = preview && (activeTrack === "demo-school" || activeTrack === "demo-jee");

  const showToast = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 3200); };
  const changeStatus = async (topic: Topic) => {
    const statuses: TopicStatus[] = ["Not started", "In progress", "Complete"];
    const nextStatus = statuses[(statuses.indexOf(topic.status) + 1) % statuses.length];
    const updated = { ...topic, status: nextStatus, updatedAt: today() };
    await db.topics.put(updated);
    setTopics((old) => old.map((t) => t.id === topic.id ? updated : t));
    showToast("“" + topic.title + "” marked " + nextStatus.toLowerCase() + ".");
  };
  const scheduleRevision = async (topic: Topic, days = 3) => {
    const updated = { ...topic, nextRevision: plusDays(days), updatedAt: today() };
    await db.topics.put(updated);
    setTopics((old) => old.map((t) => t.id === topic.id ? updated : t));
    showToast("Revision scheduled for " + new Date(updated.nextRevision!).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + ".");
  };
  const addTopic = async () => {
    if (!form.title.trim() || !active) return;
    const topic: Topic = { id: id(), trackId: active.id, subject: form.subject.trim() || "Other", title: form.title.trim(), status: form.status, updatedAt: today() };
    await db.topics.put(topic);
    setTopics((old) => [...old, topic]);
    setForm({ subject: "Physics", title: "", status: "Not started" });
    setShowAdd(false);
    showToast("Chapter added to your local record.");
  };
  const saveSetup = async () => {
    const nextProfile: Profile = { ...setup, name: setup.name.trim() };
    const schoolId = "school-" + nextProfile.board.toLowerCase() + "-" + nextProfile.standard.replace(" ", "").toLowerCase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setShowSetup(false);
    if (!activeTrack || activeTrack.startsWith("demo-")) setActiveTrack(schoolId);
    setPreview(false);
    localStorage.removeItem(PREVIEW_KEY);
    showToast("Your workspace is set up on this device.");
  };
  const loadDemo = async () => {
    await db.topics.bulkPut(seedTopics);
    setTopics((old) => [...old.filter((t) => !seedTopics.some((s) => s.id === t.id)), ...seedTopics]);
    setProfile({ board: "ISC", standard: "Class 11", year: "2026–27", competitive: ["JEE Main"], name: "Student" });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ board: "ISC", standard: "Class 11", year: "2026–27", competitive: ["JEE Main"], name: "Student" }));
    localStorage.setItem(PREVIEW_KEY, "yes");
    setPreview(true);
    setTracks([school, exam]);
    setActiveTrack("demo-school");
    localStorage.setItem(TRACK_KEY, "demo-school");
    setShowSetup(false);
    showToast("Preview workspace loaded. Sample chapters are illustrative only.");
  };
  const resetLocal = async () => {
    if (!window.confirm("Clear this prototype's saved profile and chapters from this browser? This cannot be undone.")) return;
    await db.topics.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRACK_KEY);
    localStorage.removeItem(PREVIEW_KEY);
    setTopics([]);
    setProfile(null);
    setTracks([]);
    setActiveTrack("");
    setPreview(false);
    setShowSetup(true);
    setPage("Today");
  };

  const nav = [
    { name: "Today", icon: LayoutDashboard },
    { name: "Syllabus", icon: ListChecks },
    { name: "Revisions", icon: RotateCcw },
    { name: "Progress", icon: Target }
  ];
  const title = page === "Today" ? "Your study day" : page;
  const greeting = profile?.name ? "Good to see you, " + profile.name : "Your preparation, kept in order";

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileMenu ? "sidebar-open" : "")}>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setPage("Today"); }}>
          <img src="/syllakeep-logo.svg" alt="" />
          <span>SyllaKeep<small>Your progress, kept in order.</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="track-switcher">
          {tracks.map((track) => (
            <button key={track.id} className={"track-option " + (activeTrack === track.id ? "selected" : "")} onClick={() => { setActiveTrack(track.id); setMobileMenu(false); }}>
              <span className={"track-dot " + (track.kind === "Competitive" ? "dot-amber" : "")}></span>
              <span>{track.label}</span>
              {activeTrack === track.id && <Check size={15} />}
            </button>
          ))}
          {tracks.length > 0 && <button className="add-track" onClick={() => setShowSetup(true)}><Plus size={15} /> Edit tracks</button>}
          {tracks.length === 0 && <button className="add-track" onClick={() => setShowSetup(true)}><Plus size={15} /> Set up workspace</button>}
        </div>
        <div className="workspace-label nav-label">YOUR SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            return <button key={item.name} className={"nav-item " + (page === item.name ? "nav-active" : "")} onClick={() => { setPage(item.name); setMobileMenu(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{item.name}</span>
              {item.name === "Revisions" && dueTopics.length > 0 && <span className="nav-count">{dueTopics.length}</span>}
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={17} /><span><strong>Your record stays here</strong><small>Saved on this device in this prototype.</small></span></div>
          <button className="nav-item" onClick={() => setShowSetup(true)}><Settings2 size={18} /><span>Workspace settings</span></button>
          <button className="nav-item" onClick={resetLocal}><RotateCcw size={18} /><span>Reset local data</span></button>
          <div className="version-note">SyllaKeep prototype · v0.1</div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={21} /></button>
          <div className="breadcrumb">{active?.kind === "Competitive" ? "Competitive preparation" : "School preparation"} <span>/</span> {active?.label ?? "Set up your workspace"}</div>
          <div className="topbar-actions">
            <span className={"save-state " + (navigator.onLine ? "" : "offline")}><span className="status-dot"></span>{navigator.onLine ? "Saved on this device" : "Offline · local save"}</span>
            <button className="avatar" aria-label="Open workspace settings" onClick={() => setShowSetup(true)}>{profile?.name?.slice(0, 1).toUpperCase() || "S"}</button>
          </div>
        </header>

        <div className="page-content">
          {isDemo && <div className="demo-banner"><Sparkles size={16} /><span><strong>Preview data.</strong> These chapters and dates are illustrative, not an official syllabus. Set up your own workspace to start fresh.</span><button onClick={() => { setShowSetup(true); }}>Set up mine <ArrowRight size={14} /></button></div>}
          <div className="page-heading">
            <div><p className="eyebrow">{active?.kind === "Competitive" ? "COMPETITIVE TRACK" : "SCHOOL TRACK"} {active?.year ? "· " + active.year : ""}</p><h1>{title}</h1><p className="heading-sub">{page === "Today" ? greeting + ". Here is a clear place to pick up." : page === "Syllabus" ? "A practical record of what you have covered." : page === "Revisions" ? "Bring important chapters back into view." : "Progress calculated from the chapters you track."}</p></div>
            {page === "Syllabus" && <button className="button button-primary" onClick={() => setShowAdd(true)}><Plus size={17} /> Add chapter</button>}
          </div>

          {!active ? (
            <section className="empty-workspace"><div className="empty-icon"><GraduationCap size={28} /></div><h2>Make this space yours</h2><p>Choose your board, class and academic year. Add a competitive exam only if it is part of your preparation.</p><button className="button button-primary" onClick={() => setShowSetup(true)}>Set up workspace <ArrowRight size={16} /></button><button className="text-button" onClick={loadDemo}>Explore an illustrative preview</button></section>
          ) : page === "Today" ? (
            <>
              <section className="summary-grid">
                <article className="summary-card summary-progress"><div className="summary-top"><span>Chapters completed</span><span className="summary-icon"><CheckCheck size={17} /></span></div><div className="summary-number">{completed}<small> / {trackTopics.length}</small></div><div className="progress-track"><span style={{ width: pct + "%" }} /></div><div className="summary-foot">{trackTopics.length ? pct + "% of tracked chapters" : "No chapters added yet"}</div></article>
                <article className="summary-card"><div className="summary-top"><span>In progress</span><span className="summary-icon pale"><BookOpen size={17} /></span></div><div className="summary-number">{started}</div><div className="summary-foot">Chapters you have started</div></article>
                <article className="summary-card"><div className="summary-top"><span>Revisions due</span><span className="summary-icon amber"><CalendarDays size={17} /></span></div><div className="summary-number">{dueTopics.length}</div><div className="summary-foot">{dueTopics.length ? "Ready to bring back into focus" : "Nothing overdue in this track"}</div></article>
              </section>
              <div className="content-grid">
                <section className="panel next-panel"><div className="panel-heading"><div><h2>A good next step</h2><p>One useful action, based on your record.</p></div><span className="panel-icon"><ArrowDownRight size={19} /></span></div>
                  {dueTopics[0] ? <div className="next-task"><div className="task-kicker"><Clock3 size={14} /> REVISION DUE</div><h3>Revise {dueTopics[0].title}</h3><p>{dueTopics[0].subject} · scheduled for today or earlier</p><div className="task-actions"><button className="button button-primary" onClick={() => scheduleRevision(dueTopics[0], 3)}>Mark revised <Check size={16} /></button><button className="button button-quiet" onClick={() => setPage("Revisions")}>View revisions</button></div></div>
                    : trackTopics.find((t) => t.status === "In progress") ? <div className="next-task"><div className="task-kicker"><BookOpen size={14} /> PICK UP WHERE YOU LEFT OFF</div><h3>Continue {trackTopics.find((t) => t.status === "In progress")!.title}</h3><p>{trackTopics.find((t) => t.status === "In progress")!.subject} · currently in progress</p><div className="task-actions"><button className="button button-primary" onClick={() => setPage("Syllabus")}>Open syllabus <ArrowRight size={16} /></button></div></div>
                    : <div className="empty-inline"><p>{trackTopics.length ? "No immediate task. Choose a chapter to revise or review your progress." : "Start with one chapter. Your progress will build from the topics you add."}</p><button className="text-button" onClick={() => trackTopics.length ? setPage("Syllabus") : setShowAdd(true)}>{trackTopics.length ? "Browse syllabus" : "Add your first chapter"} <ArrowRight size={15} /></button></div>}
                </section>
                <section className="panel"><div className="panel-heading"><div><h2>Coming up</h2><p>Your next scheduled revisions.</p></div><button className="icon-button" aria-label="View all revisions" onClick={() => setPage("Revisions")}><ArrowRight size={17} /></button></div>
                  {upcomingTopics.length ? <div className="upcoming-list">{upcomingTopics.slice(0, 3).map((t) => <div className="upcoming-row" key={t.id}><span className="date-pill">{new Date((t.nextRevision || today()) + "T12:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span><span className="upcoming-copy"><strong>{t.title}</strong><small>{t.subject}</small></span><button className="icon-button" aria-label={"Open " + t.title} onClick={() => setPage("Syllabus")}><ArrowRight size={16} /></button></div>)}</div>
                    : <div className="empty-small"><CalendarDays size={20} /><p>No upcoming revisions yet.</p><small>Schedule one from any chapter.</small></div>}
                </section>
              </div>
              <section className="panel recent-panel"><div className="panel-heading"><div><h2>Pick up a chapter</h2><p>Your recently tracked topics.</p></div><button className="text-button" onClick={() => setPage("Syllabus")}>View syllabus <ArrowRight size={15} /></button></div>
                {trackTopics.length ? <div className="topic-list compact-list">{trackTopics.slice(0, 4).map((topic) => <TopicRow key={topic.id} topic={topic} onStatus={changeStatus} onRevise={scheduleRevision} />)}</div>
                  : <div className="empty-inline"><p>Your chapter list is ready when you are.</p><button className="button button-secondary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add a chapter</button></div>}
              </section>
            </>
          ) : page === "Syllabus" ? (
            <section className="panel syllabus-panel"><div className="syllabus-tools"><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a chapter or subject" aria-label="Search chapters" /><kbd>/</kbd></div><div className="filter-box"><Filter size={15} /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by progress"><option>All</option><option>Not started</option><option>In progress</option><option>Complete</option></select><ChevronDown size={14} /></div></div>
              <div className="list-summary"><span>{visibleTopics.length} {visibleTopics.length === 1 ? "chapter" : "chapters"}</span><span>Tap a status to change it</span></div>
              {visibleTopics.length ? <div className="topic-list">{visibleTopics.map((topic) => <TopicRow key={topic.id} topic={topic} onStatus={changeStatus} onRevise={scheduleRevision} />)}</div> : <div className="empty-inline"><div className="empty-icon small"><BookOpen size={21} /></div><h3>{trackTopics.length ? "No chapters match this view" : "No chapters here yet"}</h3><p>{trackTopics.length ? "Try a different search or status filter." : "Add chapters from your own syllabus. Official syllabus packs are not connected in this prototype."}</p>{!trackTopics.length && <button className="button button-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add your first chapter</button>}</div>}
              <div className="local-note"><CloudOff size={15} /><span>Changes are stored locally on this device. Cloud sync and account sign-in are not connected in this prototype.</span></div>
            </section>
          ) : page === "Revisions" ? (
            <section className="panel"><div className="panel-heading"><div><h2>Revision list</h2><p>Based on dates you have scheduled.</p></div><span className="quiet-count">{dueTopics.length} due</span></div>
              {trackTopics.filter((t) => t.nextRevision).length ? <div className="topic-list">{[...dueTopics, ...upcomingTopics].sort((a, b) => (a.nextRevision || "").localeCompare(b.nextRevision || "")).map((topic) => <div className="revision-row" key={topic.id}><div className="revision-date"><span>{topic.nextRevision && topic.nextRevision <= today() ? "DUE" : "UP NEXT"}</span><strong>{new Date(topic.nextRevision! + "T12:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</strong></div><div className="revision-copy"><strong>{topic.title}</strong><small>{topic.subject} · {topic.status}</small></div><button className="button button-secondary" onClick={() => scheduleRevision(topic, 3)}><Check size={15} /> Mark revised</button></div>)}</div> : <div className="empty-inline"><div className="empty-icon small"><CalendarDays size={21} /></div><h3>No revisions scheduled</h3><p>Schedule a revision from a chapter when you are ready to revisit it.</p><button className="button button-secondary" onClick={() => setPage("Syllabus")}>Open syllabus <ArrowRight size={15} /></button></div>}
            </section>
          ) : (
            <>
              <section className="progress-hero"><div><p className="eyebrow">YOUR CURRENT RECORD</p><h2>{pct}% <span>of tracked chapters complete</span></h2><p>Calculated as completed chapters divided by all chapters you have added to this workspace.</p></div><div className="progress-ring" style={{ background: "conic-gradient(#203b5e " + pct + "%, #e9e8e1 0)" }}><div><strong>{pct}%</strong><small>complete</small></div></div></section>
              <div className="summary-grid progress-cards"><article className="summary-card"><div className="summary-top"><span>Complete</span><span className="summary-icon"><CheckCheck size={17} /></span></div><div className="summary-number">{completed}</div><div className="summary-foot">Marked complete by you</div></article><article className="summary-card"><div className="summary-top"><span>In progress</span><span className="summary-icon pale"><BookOpen size={17} /></span></div><div className="summary-number">{started}</div><div className="summary-foot">Currently being worked on</div></article><article className="summary-card"><div className="summary-top"><span>Not started</span><span className="summary-icon amber"><Clock3 size={17} /></span></div><div className="summary-number">{trackTopics.length - completed - started}</div><div className="summary-foot">Not yet marked in progress</div></article></div>
              <section className="panel calculation-panel"><div className="panel-heading"><div><h2>How this is calculated</h2><p>No readiness score, ranking or estimated marks.</p></div><CircleHelp size={19} /></div><div className="calculation-line"><span>Completion rate</span><strong>{completed} ÷ {trackTopics.length || 0} chapters {trackTopics.length ? "= " + pct + "%" : "— no chapters added"}</strong></div><p className="muted-paragraph">Only the chapters in this workspace are counted. The tracker does not claim to know your exam readiness or mastery from a completion tick.</p></section>
            </>
          )}
          <footer className="page-footer"><span>SyllaKeep · Your syllabus. Your progress. Your record.</span><span><ShieldCheck size={14} /> Private by design · Prototype stored locally</span></footer>
        </div>
      </main>

      {showSetup && <div className="modal-backdrop" role="presentation"><section className="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div className="modal-top"><div className="modal-brand"><img src="/syllakeep-logo.svg" alt="" /><span>SyllaKeep</span></div><button className="icon-button" aria-label="Close setup" onClick={() => setShowSetup(false)}><X size={19} /></button></div><p className="eyebrow">LET'S SET UP YOUR SPACE</p><h2 id="setup-title">A tracker that fits your preparation.</h2><p className="modal-intro">Choose your school track first. Competitive exams are optional and stay in a separate workspace.</p>
        <label className="field-label">Your name <span>Optional</span><input value={setup.name} onChange={(e) => setSetup({ ...setup, name: e.target.value })} placeholder="What should we call you?" /></label>
        <div className="field-grid"><label className="field-label">School board<select value={setup.board} onChange={(e) => setSetup({ ...setup, board: e.target.value })}><option>ISC</option><option>CBSE</option></select></label><label className="field-label">Class<select value={setup.standard} onChange={(e) => setSetup({ ...setup, standard: e.target.value })}><option>Class 11</option><option>Class 12</option></select></label></div>
        <label className="field-label">Academic year<select value={setup.year} onChange={(e) => setSetup({ ...setup, year: e.target.value })}><option>2026–27</option><option>2027–28</option><option>2028–29</option></select></label>
        <fieldset className="exam-fieldset"><legend>Are you preparing for a competitive exam? <span>Optional</span></legend><p>Select any that apply.</p><div className="exam-options">{["JEE Main", "JEE Advanced", "NEET UG"].map((exam) => <label key={exam} className={"exam-option " + (setup.competitive.includes(exam) ? "exam-selected" : "")}><input type="checkbox" checked={setup.competitive.includes(exam)} onChange={(e) => setSetup({ ...setup, competitive: e.target.checked ? [...setup.competitive, exam] : setup.competitive.filter((x) => x !== exam) })} /><span>{exam}</span><Check size={15} /></label>)}</div></fieldset>
        <button className="button button-primary full-button" onClick={saveSetup}>Create my workspace <ArrowRight size={16} /></button><button className="text-button centered" onClick={loadDemo}>Explore with illustrative preview data</button><p className="privacy-copy"><ShieldCheck size={14} /> Saved in this browser only. No account or cloud sync is connected.</p>
      </section></div>}

      {showAdd && <div className="modal-backdrop" role="presentation"><section className="modal add-modal" role="dialog" aria-modal="true" aria-labelledby="add-title"><div className="modal-top"><div><p className="eyebrow">YOUR SYLLABUS</p><h2 id="add-title">Add a chapter</h2></div><button className="icon-button" aria-label="Close add chapter" onClick={() => setShowAdd(false)}><X size={19} /></button></div><p className="modal-intro">Add a topic from your own syllabus. Official syllabus data is not bundled yet.</p><label className="field-label">Chapter name<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Laws of Motion" onKeyDown={(e) => { if (e.key === "Enter") void addTopic(); }} /></label><label className="field-label">Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Physics" /></label><label className="field-label">Starting status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TopicStatus })}><option>Not started</option><option>In progress</option><option>Complete</option></select></label><div className="modal-actions"><button className="button button-quiet" onClick={() => setShowAdd(false)}>Cancel</button><button className="button button-primary" disabled={!form.title.trim()} onClick={() => void addTopic()}><Plus size={16} /> Add chapter</button></div></section></div>}
      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
    </div>
  );
}

function TopicRow({ topic, onStatus, onRevise }: { topic: Topic; onStatus: (topic: Topic) => void; onRevise: (topic: Topic, days?: number) => void }) {
  return <div className="topic-row"><button className={"status-control status-" + topic.status.toLowerCase().replace(" ", "-")} onClick={() => onStatus(topic)} aria-label={"Change status for " + topic.title + ". Current status: " + topic.status}><span>{topic.status === "Complete" ? <Check size={14} /> : topic.status === "In progress" ? <span className="status-half" /> : null}</span></button><div className="topic-main"><strong>{topic.title}</strong><small>{topic.subject} <span>·</span> Updated {topic.updatedAt === today() ? "today" : new Date(topic.updatedAt + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></div><span className={"status-label " + (topic.status === "Complete" ? "label-complete" : topic.status === "In progress" ? "label-progress" : "")}>{topic.status}</span><button className="revision-action" onClick={() => onRevise(topic, 3)}><CalendarDays size={15} /><span>Revise</span></button></div>;
}

export default App;