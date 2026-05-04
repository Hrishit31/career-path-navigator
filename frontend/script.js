/* ═══════════════════════════════════════════════════════════════════════
   Career Path Navigator · script.js  — Complete build
   Session auth + OTP + All 9 new features
═══════════════════════════════════════════════════════════════════════ */

const API = "http://localhost:5000/api";
let currentUser  = null;
let lastResults  = null;
let bookmarks    = JSON.parse(localStorage.getItem("cpn-bookmarks") || "[]");
let roadmapNodes = JSON.parse(localStorage.getItem("cpn-roadmap")   || "[]");
let analysesCount = parseInt(localStorage.getItem("cpn-analyses")   || "0");
let allCareers   = [];
let radarChart   = null, trendCh = null, confCh = null, resultCh = null, compareCh = null;
let quizAnswers  = {}, quizIdx = 0, quizQuestions = [];
let draggedStep  = null;

/* ── SVG icons for theme toggle ───────────────────────────────────── */
const MOON_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SUN_SVG  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  const dark = t === "dark";
  document.querySelectorAll(".th-tog").forEach(b => { if (b) b.innerHTML = dark ? MOON_SVG : SUN_SVG; });
  const tog = document.getElementById("dark-tog");
  if (tog) tog.classList.toggle("on", dark);
  localStorage.setItem("cpn-theme", t);
}
function toggleTheme() {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
}

/* ══════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════ */
window.addEventListener("scroll", () => {
  const el = document.getElementById("scroll-bar");
  if (el) el.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + "%";
}, {passive:true});

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const pg = document.getElementById(id);
  if (pg) { pg.classList.add("active"); window.scrollTo(0,0); }
}

function toggleSidebar() { document.getElementById("sidebar").classList.toggle("open"); }

function switchSec(el) {
  const id = el.dataset.sec;
  if (!id) return;
  document.querySelectorAll(".sb-item").forEach(i => i.classList.remove("active"));
  el.classList.add("active");
  document.querySelectorAll(".sec").forEach(s => s.classList.remove("active"));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add("active");
  if (id === "sec-history") loadHistory();
  if (id === "sec-dashboard") refreshDashboard();
  if (id === "sec-checkin") { loadCheckins(); renderMoodCalendar([]); }
  if (id === "sec-compare") populateCompareDropdowns();
  if (id === "sec-skillgap") renderGapCareerBtns();
  if (id === "sec-quiz" && quizQuestions.length === 0) loadQuizQuestions();
}

function setLoader(on, msg = "Loading…") {
  document.getElementById("loader").classList.toggle("on", on);
  document.getElementById("loader-text").textContent = msg;
}

function toast(msg, type = "inf") {
  const wrap  = document.getElementById("toast-wrap");
  const icons = {ok:"✅", err:"❌", inf:"💡"};
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="t-ic">${icons[type]||"💡"}</span><span style="flex:1">${msg}</span><button class="t-cl" onclick="this.parentElement.remove()">✕</button>`;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 4000);
}

/* Ripple */
document.addEventListener("click", e => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  const r = document.createElement("span"); r.className = "rip";
  const d = Math.max(btn.clientWidth, btn.clientHeight);
  const rect = btn.getBoundingClientRect();
  r.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-rect.left-d/2}px;top:${e.clientY-rect.top-d/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
});

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    ...opts
    // NOTE: removed credentials:"include" — sessions won't work from file://
    // Use Live Server at http://127.0.0.1:5500 for full session support
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* Counter animation */
function animateCount(el, target, suffix = "") {
  let cur = 0; const step = target / 40;
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = Math.round(cur) + suffix;
    if (cur >= target) clearInterval(t);
  }, 30);
}

/* ══════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════ */
async function checkSession() {
  try {
    const d = await apiFetch("/me");
    if (d.logged_in) { currentUser = {username: d.username}; initApp(); showPage("page-app"); return; }
  } catch {}
  showPage("page-landing");
}

async function handleLogin(e) {
  e.preventDefault();
  const err = document.getElementById("login-err"); err.textContent = "";
  try {
    const d = await apiFetch("/login", {method:"POST", body:JSON.stringify({username:document.getElementById("lu").value.trim(), password:document.getElementById("lp").value})});
    currentUser = {username: d.username};
    toast("Welcome back, " + d.username + "!", "ok");
    initApp(); showPage("page-app");
  } catch(ex) { err.textContent = ex.message; }
}

async function handleSignup(e) {
  e.preventDefault();
  const err = document.getElementById("signup-err"); err.textContent = "";
  try {
    await apiFetch("/signup", {method:"POST", body:JSON.stringify({username:document.getElementById("su").value.trim(), password:document.getElementById("sp").value})});
    toast("Account created! Sign in now.", "ok");
    showPage("page-login");
  } catch(ex) { err.textContent = ex.message; }
}

async function handleLogout() {
  await apiFetch("/logout", {method:"POST"}).catch(()=>{});
  currentUser = null;
  toast("Signed out.", "inf");
  showPage("page-landing");
}

/* ── OTP flow ─────────────────────────────────────────────────────── */
function switchAuthTab(tab) {
  const isPw = tab === "pw";
  document.getElementById("panel-pw").style.display  = isPw ? "block" : "none";
  document.getElementById("panel-otp").style.display = isPw ? "none"  : "block";
  document.getElementById("tab-pw").style.background  = isPw ? "var(--gold)" : "transparent";
  document.getElementById("tab-pw").style.color       = isPw ? "#0a0a0a" : "var(--text2)";
  document.getElementById("tab-otp").style.background = isPw ? "transparent" : "var(--gold)";
  document.getElementById("tab-otp").style.color      = isPw ? "var(--text2)" : "#0a0a0a";
}

async function sendOtp() {
  const email = (document.getElementById("otp-email").value || "").trim();
  const err   = document.getElementById("otp-err1"); err.textContent = "";
  if (!email || !email.includes("@")) { err.textContent = "Enter a valid email."; return; }
  const btn = document.querySelector("#otp-step1 .btn");
  btn.disabled = true; btn.textContent = "Sending…";
  try {
    const d = await apiFetch("/send-otp", {method:"POST", body:JSON.stringify({email})});
    document.getElementById("otp-step1").style.display = "none";
    document.getElementById("otp-step2").style.display = "block";
    if (d.dev_mode) {
      document.getElementById("dev-otp-box").style.display = "block";
      document.getElementById("dev-otp-val").textContent   = d.otp;
      document.getElementById("otp-sent-msg").textContent  = "Dev mode — OTP shown below.";
    } else {
      document.getElementById("otp-sent-msg").textContent = "OTP sent to " + email;
    }
    toast("OTP sent!", "ok");
  } catch(ex) { err.textContent = ex.message; }
  finally { btn.disabled = false; btn.textContent = "Send OTP"; }
}

async function verifyOtp() {
  const email = (document.getElementById("otp-email").value || "").trim();
  const otp   = (document.getElementById("otp-code").value  || "").trim();
  const err   = document.getElementById("otp-err2"); err.textContent = "";
  if (otp.length !== 6) { err.textContent = "Enter the 6-digit OTP."; return; }
  const btn = document.querySelector("#otp-step2 .btn-p");
  btn.disabled = true; btn.textContent = "Verifying…";
  try {
    const d = await apiFetch("/verify-otp", {method:"POST", body:JSON.stringify({email, otp})});
    currentUser = {username: d.username};
    toast("Welcome, " + d.username + "!", "ok");
    initApp(); showPage("page-app"); resetOtp();
  } catch(ex) { err.textContent = ex.message; document.getElementById("otp-code").value = ""; }
  finally { btn.disabled = false; btn.textContent = "Verify OTP"; }
}

function resetOtp() {
  document.getElementById("otp-step1").style.display = "block";
  document.getElementById("otp-step2").style.display = "none";
  ["otp-email","otp-code"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("dev-otp-box").style.display = "none";
  ["otp-err1","otp-err2"].forEach(id => document.getElementById(id).textContent = "");
}

/* ══════════════════════════════════════════════
   APP INIT
══════════════════════════════════════════════ */
function initApp() {
  updateGreeting();
  loadAllCareers();
  loadQuizQuestions();
  renderTrendChart();
  renderConfChart();
  renderRoadmapLibrary();
  renderRoadmapNodes();
  refreshDashboard();
  if (lastResults) renderResults(lastResults);
}

function updateGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const el = document.getElementById("dash-greeting");
  if (el && currentUser) el.textContent = `${g}, ${currentUser.username} ✨`;
  const sub = document.getElementById("dash-sub");
  if (sub) sub.textContent = new Date().toLocaleDateString("en-IN", {weekday:"long", year:"numeric", month:"long", day:"numeric"});
}

/* ══════════════════════════════════════════════
   ASSESSMENT STEPPER
══════════════════════════════════════════════ */
let currentStep = 1;

function goStep(n) {
  if (n === 4 && !document.getElementById("journal").value.trim()) {
    document.getElementById("journal-err").textContent = "Please write something first."; return;
  }
  document.getElementById("journal-err").textContent = "";
  if (n === 5) buildReview();
  document.getElementById("step" + currentStep).classList.remove("active");
  currentStep = n;
  document.getElementById("step" + n).classList.add("active");
  for (let i = 1; i <= 5; i++) {
    const d = document.getElementById("sd"+i);
    d.classList.remove("active","done");
    if (i < n) { d.classList.add("done"); d.textContent = "✓"; }
    else if (i === n) { d.classList.add("active"); d.textContent = i; }
    else d.textContent = i;
    if (i < 5) document.getElementById("sl"+i).classList.toggle("done", i < n);
  }
}

function upd(el) {
  const v = document.getElementById(el.id + "-v");
  if (v) { v.textContent = el.value; v.style.transform = "scale(1.2)"; setTimeout(() => v.style.transform = "", 200); }
}

function buildReview() {
  const fields = {Mathematics:"math",Science:"science",English:"english",Arts:"arts",Commerce:"commerce",Coding:"coding_skill",Communication:"communication",Creativity:"creativity",Analytical:"analytical",Leadership:"leadership"};
  let html = "";
  Object.entries(fields).forEach(([k,v]) => { html += `<span style="display:inline-block;margin-right:1rem;margin-bottom:.4rem"><strong>${k}:</strong> ${document.getElementById(v)?.value||50}</span>`; });
  const j = document.getElementById("journal").value.trim();
  html += `<br><br><strong>Journal:</strong> "${j.substring(0,100)}${j.length>100?'…':''}"`;
  document.getElementById("review-summary").innerHTML = html;
}

function loadDemo() {
  const demo = {math:85,science:78,english:70,arts:45,commerce:55,coding_skill:90,communication:65,creativity:60,analytical:88,leadership:70,interest_tech:92,interest_science:80,interest_arts:40,interest_business:55,stress_tolerance:72};
  Object.entries(demo).forEach(([k,v]) => { const el = document.getElementById(k); if(el){el.value=v; upd(el);} });
  document.getElementById("journal").value = "I feel excited about technology and solving complex problems. Sometimes the workload feels heavy but I stay motivated by the outcomes.";
  toast("Demo profile loaded!", "inf");
}

function gatherPayload() {
  const keys = ["math","science","english","arts","commerce","coding_skill","communication","creativity","analytical","leadership","interest_tech","interest_science","interest_arts","interest_business","stress_tolerance"];
  const p = {};
  keys.forEach(k => { p[k] = parseFloat(document.getElementById(k)?.value || 50); });
  p.text = document.getElementById("journal").value.trim();
  return p;
}

async function runAnalysis() {
  const payload = gatherPayload();
  if (!payload.text) { toast("Please write in your journal first.", "err"); goStep(4); return; }
  setLoader(true, "Running ML models + NLP analysis…");
  document.getElementById("analyse-btn").disabled = true;
  try {
    const result = await apiFetch("/get-recommendation", {method:"POST", body:JSON.stringify(payload)});
    lastResults = result;
    analysesCount++;
    localStorage.setItem("cpn-analyses", analysesCount);
    renderResults(result);
    // Reveal results section
    document.getElementById("results-empty").style.display = "none";
    document.getElementById("results-content").style.display = "block";
    switchSec(document.querySelector("[data-sec=sec-results]"));
    toast("Analysis complete! 🎯", "ok");
    refreshDashboard();
  } catch(ex) {
    toast("Error: " + ex.message, "err");
  } finally {
    setLoader(false);
    document.getElementById("analyse-btn").disabled = false;
  }
}

/* ══════════════════════════════════════════════
   RENDER RESULTS
══════════════════════════════════════════════ */
function renderResults(data) {
  const {career_recs, sentiment, final_recs, advisory} = data;
  document.getElementById("advisory-text").textContent = advisory;

  // Polarity ring
  const pol  = sentiment.polarity;
  const pct  = (pol + 1) / 2 * 100;
  const circ = Math.PI * 2 * 46;
  const fg   = document.getElementById("pol-fg");
  if (fg) {
    fg.style.strokeDashoffset = circ - (pct/100)*circ;
    fg.style.stroke = pol < -0.1 ? "var(--red)" : pol > 0.1 ? "var(--green)" : "var(--gold)";
  }
  document.getElementById("pol-val").textContent = (pol>=0?"+":"") + pol.toFixed(2);

  // Stress badge
  const sb  = document.getElementById("stress-badge");
  const map = {low:["s-low","😌 Low Stress"], medium:["s-med","😐 Medium Stress"], high:["s-hi","😟 High Stress"]};
  const [cls, lbl] = map[sentiment.stress_level] || ["s-med","—"];
  sb.className = "stress-ind " + cls; sb.textContent = lbl;
  document.getElementById("sent-summary").textContent = sentiment.summary;

  renderCareerCards("ml-recs",    career_recs, false);
  renderCareerCards("fused-recs", final_recs,  true);

  // Quick gap buttons
  const qg = document.getElementById("quick-gap-btns");
  if (qg) {
    qg.innerHTML = final_recs.map(r =>
      `<button class="btn btn-g btn-sm" onclick="openSkillGap('${r.career}')">${r.career}</button>`
    ).join("");
  }

  // Result bar chart
  if (resultCh) resultCh.destroy();
  const ctx = document.getElementById("result-chart");
  if (ctx) {
    resultCh = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: career_recs.map(r => r.career.split(" ").slice(-1)[0]),
        datasets: [{data: career_recs.map(r => r.confidence), backgroundColor:["rgba(240,192,96,.75)","rgba(139,92,246,.75)","rgba(45,212,191,.75)"], borderWidth:0, borderRadius:6}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:"#6b7394",font:{size:11}},grid:{color:"rgba(255,255,255,.04)"}},y:{beginAtZero:true,max:100,ticks:{color:"#6b7394",font:{size:11},callback:v=>v+"%"},grid:{color:"rgba(255,255,255,.04)"}}}}
    });
  }

  // Dashboard preview
  renderCareerCards("dash-recs", final_recs.slice(0,2), true);
}

function renderCareerCards(cid, recs, showAdj) {
  const c = document.getElementById(cid); if (!c) return;
  c.innerHTML = recs.map((r,i) => `
    <div class="cc r${i+1}" onclick="toggleBookmark(this,'${r.career}')">
      <div class="cc-rank">${i+1}</div>
      <div class="cc-body">
        <div class="cc-name">${r.career}${showAdj && r.adjusted ? ' <span class="adj-tag">⚡ adj</span>' : ''}</div>
        <div class="cc-bar-w"><div class="cc-bar" style="width:0%" data-w="${r.confidence}%"></div></div>
        <div class="cc-conf">Confidence: <span>${r.confidence}%</span></div>
      </div>
      <button class="bm ${bookmarks.includes(r.career)?'on':''}" title="Bookmark">★</button>
    </div>`).join("");
  requestAnimationFrame(() => c.querySelectorAll(".cc-bar").forEach(b => b.style.width = b.dataset.w));
}

function toggleBookmark(el, career) {
  const btn = el.querySelector(".bm"); if (!btn) return;
  const idx = bookmarks.indexOf(career);
  if (idx === -1) { bookmarks.push(career); btn.classList.add("on"); toast(`Bookmarked: ${career}`, "ok"); }
  else { bookmarks.splice(idx,1); btn.classList.remove("on"); toast(`Removed: ${career}`, "inf"); }
  localStorage.setItem("cpn-bookmarks", JSON.stringify(bookmarks));
}

/* ══════════════════════════════════════════════
   DASHBOARD CHARTS
══════════════════════════════════════════════ */
function renderTrendChart() {
  const ctx = document.getElementById("trend-chart"); if (!ctx || trendCh) return;
  trendCh = new Chart(ctx.getContext("2d"), {
    type:"line",
    data:{labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],datasets:[{label:"Sentiment",data:[0.3,-0.1,0.15,0.4,0.2,0.55,0.35],borderColor:"var(--gold)",backgroundColor:"rgba(240,192,96,.07)",tension:0.4,pointBackgroundColor:"var(--gold)",pointRadius:4,fill:true}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"#6b7394",font:{size:11}},grid:{color:"rgba(255,255,255,.04)"}},y:{min:-1,max:1,ticks:{color:"#6b7394",font:{size:11}},grid:{color:"rgba(255,255,255,.04)"}}}}
  });
}

function renderConfChart() {
  const ctx = document.getElementById("conf-chart"); if (!ctx || confCh) return;
  confCh = new Chart(ctx.getContext("2d"), {
    type:"doughnut",
    data:{labels:["Software Eng","Entrepreneur","Data Scientist","Other"],datasets:[{data:[45,30,15,10],backgroundColor:["rgba(240,192,96,.85)","rgba(139,92,246,.85)","rgba(45,212,191,.85)","rgba(90,97,130,.5)"],borderWidth:0,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{color:"#9ba3c9",font:{size:11},padding:10,boxWidth:10}}}}
  });
}

function refreshDashboard() {
  document.getElementById("d-analyses").textContent = analysesCount || "0";
  if (lastResults) {
    const top = lastResults.final_recs[0];
    document.getElementById("d-top").textContent = top ? top.career.split(" ").slice(-1)[0] : "—";
    const pol = lastResults.sentiment.polarity;
    document.getElementById("d-sentiment").textContent = (pol>=0?"+":"")+pol.toFixed(2);
    const sl  = lastResults.sentiment.stress_level;
    const sel = document.getElementById("d-stress");
    sel.textContent = sl.charAt(0).toUpperCase()+sl.slice(1);
    sel.style.color = sl==="high"?"var(--red)":sl==="medium"?"var(--gold)":"var(--green)";
  }
  loadJobMarketDash();
}

/* ══════════════════════════════════════════════
   CAREER EXPLORER + DETAIL MODAL
══════════════════════════════════════════════ */
let activeTag = "all";

async function loadAllCareers() {
  try {
    const d = await apiFetch("/careers");
    allCareers = d.careers;
    filterCareers();
    renderGapCareerBtns();
    populateCompareDropdowns();
  } catch(e) { console.warn("Could not load careers:", e); }
}

function filterTag(el, tag) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("on"));
  el.classList.add("on"); activeTag = tag; filterCareers();
}

function filterCareers() {
  const q  = (document.getElementById("exp-search")?.value||"").toLowerCase();
  const filtered = allCareers.filter(c =>
    (activeTag==="all" || c.tag===activeTag) &&
    (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  );
  const g = document.getElementById("exp-grid"); if (!g) return;
  if (!filtered.length) { g.innerHTML = '<p style="color:var(--text3)">No careers match your search.</p>'; return; }
  g.innerHTML = filtered.map((c,i) => `
    <div class="exp-card afu" style="animation-delay:${i*.06}s" onclick="openCareerModal('${c.name}')">
      <div style="font-size:1.8rem;margin-bottom:.5rem">${c.icon}</div>
      <div class="exp-card-tag">${c.tag}</div>
      <h3>${c.name}</h3>
      <p>${c.description}</p>
      <div class="exp-foot">
        <span class="sal">💰 ${c.salary_display}</span>
        <div style="display:flex;align-items:center;gap:.35rem"><span style="font-size:.72rem;color:var(--text3)">Demand</span><div class="dem-w"><div class="dem-f" style="width:${c.demand}%"></div></div></div>
      </div>
      <div style="margin-top:.7rem;font-size:.76rem;color:var(--text3);display:flex;gap:.8rem">
        <span>📈 ${c.growth}</span><span>😰 ${c.stress_level}</span>
      </div>
    </div>`).join("");
}

async function openCareerModal(name) {
  document.getElementById("career-modal").style.display = "block";
  document.getElementById("modal-content").innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text2)"><div class="lring" style="margin:0 auto"></div></div>';
  try {
    const d = await apiFetch("/career-profile/" + encodeURIComponent(name));
    const p = d.profile;
    document.getElementById("modal-content").innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)">
        <div style="font-size:3rem">${p.icon||"🎯"}</div>
        <div><h2 style="font-family:Syne,sans-serif;font-size:1.6rem;font-weight:700;margin-bottom:.3rem">${d.career}</h2>
          <span style="display:inline-block;font-size:.75rem;padding:.2rem .6rem;border-radius:50px;background:var(--gold-d);color:var(--gold)">${p.tag}</span>
        </div>
      </div>
      <p style="color:var(--text2);line-height:1.75;margin-bottom:1.5rem">${p.description}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
        <div style="background:var(--glass);border-radius:var(--r);padding:1rem;text-align:center"><div style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;color:var(--green)">${p.salary_display}</div><div style="font-size:.78rem;color:var(--text3);margin-top:.2rem">Salary Range</div></div>
        <div style="background:var(--glass);border-radius:var(--r);padding:1rem;text-align:center"><div style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;color:var(--teal)">${p.demand}%</div><div style="font-size:.78rem;color:var(--text3);margin-top:.2rem">Job Demand</div></div>
        <div style="background:var(--glass);border-radius:var(--r);padding:1rem;text-align:center"><div style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;color:var(--violet)">${p.growth}</div><div style="font-size:.78rem;color:var(--text3);margin-top:.2rem">Growth Rate</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div><div style="font-size:.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem">Education Paths</div>${p.education.map(e=>`<div style="font-size:.86rem;padding:.3rem 0;border-bottom:1px solid var(--border);color:var(--text2)">• ${e}</div>`).join("")}</div>
        <div><div style="font-size:.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem">Top Companies</div>${p.top_companies.map(c=>`<div style="font-size:.86rem;padding:.3rem 0;border-bottom:1px solid var(--border);color:var(--text2)">• ${c}</div>`).join("")}</div>
      </div>
      <div style="margin-bottom:1.5rem">
        <div style="font-size:.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.8rem">Career Roadmap</div>
        <div style="display:flex;gap:0;flex-wrap:wrap">${p.roadmap.map((step,i)=>`<div style="display:flex;align-items:center"><div style="background:var(--gold-d);border:1px solid rgba(240,192,96,.2);border-radius:8px;padding:.4rem .8rem;font-size:.8rem;color:var(--gold)">${i+1}. ${step}</div>${i<p.roadmap.length-1?'<div style="color:var(--text3);margin:0 .3rem">→</div>':''}</div>`).join("")}</div>
      </div>
      <div>
        <div style="font-size:.78rem;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.8rem">Recommended Courses</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${p.courses.map(c=>`<a href="${c.url}" target="_blank" style="background:var(--glass);border:1px solid var(--border);border-radius:var(--r);padding:.8rem;display:flex;flex-direction:column;gap:.2rem;transition:border-color .2s;cursor:pointer" onmouseover="this.style.borderColor='rgba(240,192,96,.4)'" onmouseout="this.style.borderColor='var(--border)'"><div style="font-size:.85rem;font-weight:500">${c.title}</div><div style="font-size:.75rem;color:var(--text3)">${c.platform} · ${c.free?'<span style="color:var(--green)">Free</span>':'Paid'}</div></a>`).join("")}</div>
      </div>
      <div style="margin-top:1.5rem;display:flex;gap:.8rem">
        <button class="btn btn-p" onclick="openSkillGap('${d.career}');closeModal()">View Skill Gap →</button>
        <button class="btn btn-g" onclick="closeModal()">Close</button>
      </div>`;
  } catch(ex) {
    document.getElementById("modal-content").innerHTML = `<p style="color:var(--red)">Could not load career profile: ${ex.message}</p>`;
  }
}

function closeModal() { document.getElementById("career-modal").style.display = "none"; }

/* ══════════════════════════════════════════════
   SKILL GAP RADAR
══════════════════════════════════════════════ */
function renderGapCareerBtns() {
  const c = document.getElementById("gap-career-btns"); if (!c) return;
  const careers = allCareers.length ? allCareers.map(x=>x.name) :
    ["Software Engineer","Data Scientist","Doctor","Lawyer","Graphic Designer","Mechanical Engineer","Teacher","Accountant","Psychologist","Entrepreneur"];
  c.innerHTML = careers.map(name =>
    `<button class="btn btn-g btn-sm" onclick="loadSkillGap('${name}')">${name}</button>`
  ).join("");
}

function openSkillGap(career) {
  switchSec(document.querySelector("[data-sec=sec-skillgap]"));
  loadSkillGap(career);
}

async function loadSkillGap(career) {
  // Highlight selected button
  document.querySelectorAll("#gap-career-btns .btn").forEach(b => {
    b.classList.toggle("btn-p", b.textContent.trim() === career);
    b.classList.toggle("btn-g", b.textContent.trim() !== career);
  });

  const payload = lastResults ? gatherPayload() :
    {math:65,science:60,english:65,arts:50,commerce:50,coding_skill:50,communication:50,creativity:50,analytical:50,leadership:50,interest_tech:50,interest_science:50,interest_arts:50,interest_business:50,stress_tolerance:50};

  try {
    const d = await apiFetch("/skill-gap", {method:"POST", body:JSON.stringify({career, skills:payload})});
    document.getElementById("gap-empty").style.display = "none";
    document.getElementById("gap-content").style.display = "block";
    document.getElementById("gap-career-title").textContent = career + " — Skill Gap Radar";
    document.getElementById("gap-match-pct").textContent = d.match_pct + "%";
    document.getElementById("gap-match-pct").style.color = d.match_pct >= 70 ? "var(--green)" : d.match_pct >= 45 ? "var(--gold)" : "var(--red)";

    // Gap list
    const gl = document.getElementById("gap-list");
    if (d.top_gaps.length) {
      gl.innerHTML = d.top_gaps.map(g => `
        <div style="padding:.7rem 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
            <span style="font-size:.88rem;font-weight:500">${g.skill}</span>
            <span style="font-size:.78rem;color:var(--red)">Gap: ${g.gap.toFixed(0)}</span>
          </div>
          <div style="display:flex;gap:.4rem;align-items:center">
            <span style="font-size:.74rem;color:var(--text3);width:55px">You: ${g.user}</span>
            <div style="flex:1;height:4px;background:var(--border);border-radius:2px;overflow:hidden">
              <div style="height:100%;border-radius:2px;background:var(--gold);width:${g.user}%"></div>
            </div>
          </div>
          <div style="display:flex;gap:.4rem;align-items:center;margin-top:.2rem">
            <span style="font-size:.74rem;color:var(--text3);width:55px">Ideal: ${g.ideal}</span>
            <div style="flex:1;height:4px;background:var(--border);border-radius:2px;overflow:hidden">
              <div style="height:100%;border-radius:2px;background:var(--violet);width:${g.ideal}%"></div>
            </div>
          </div>
        </div>`).join("");
    } else {
      gl.innerHTML = '<p style="color:var(--green);font-size:.88rem;padding:.7rem 0">✅ Great match! No major skill gaps.</p>';
    }

    // Courses
    const cl = document.getElementById("courses-list");
    cl.innerHTML = d.courses.map(c => `
      <a href="${c.url}" target="_blank" style="background:var(--glass);border:1px solid var(--border);border-radius:var(--r);padding:1rem;display:block;transition:border-color .2s" onmouseover="this.style.borderColor='rgba(240,192,96,.4)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="font-size:.88rem;font-weight:500;margin-bottom:.3rem">${c.title}</div>
        <div style="font-size:.76rem;color:var(--text3)">${c.platform} · ${c.free?'<span style="color:var(--green)">Free</span>':'Paid'}</div>
      </a>`).join("");

    // Radar chart
    if (radarChart) radarChart.destroy();
    const rc = document.getElementById("radar-chart");
    if (rc) {
      radarChart = new Chart(rc.getContext("2d"), {
        type:"radar",
        data:{
          labels: d.labels,
          datasets:[
            {label:"Your Profile", data:d.user, borderColor:"rgba(240,192,96,.9)", backgroundColor:"rgba(240,192,96,.15)", pointBackgroundColor:"var(--gold)", borderWidth:2, pointRadius:3},
            {label:"Ideal Profile", data:d.ideal, borderColor:"rgba(139,92,246,.9)", backgroundColor:"rgba(139,92,246,.1)", pointBackgroundColor:"var(--violet)", borderWidth:2, pointRadius:3, borderDash:[4,3]}
          ]
        },
        options:{responsive:true, maintainAspectRatio:false,
          scales:{r:{min:0,max:100,ticks:{stepSize:25,color:"#5a6182",backdropColor:"transparent",font:{size:9}},grid:{color:"rgba(255,255,255,.06)"},pointLabels:{color:"#9ba3c9",font:{size:10}},angleLines:{color:"rgba(255,255,255,.06)"}}},
          plugins:{legend:{position:"bottom",labels:{color:"#9ba3c9",font:{size:11},boxWidth:12,padding:12}}}
        }
      });
    }
  } catch(ex) { toast("Error loading skill gap: " + ex.message, "err"); }
}

/* ══════════════════════════════════════════════
   CAREER COMPARISON
══════════════════════════════════════════════ */
function populateCompareDropdowns() {
  const careers = allCareers.length ? allCareers.map(c=>c.name) :
    ["Software Engineer","Data Scientist","Doctor","Lawyer","Graphic Designer","Mechanical Engineer","Teacher","Accountant","Psychologist","Entrepreneur"];
  ["compare-c1","compare-c2"].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = `<option value="">Select career…</option>` + careers.map(c=>`<option value="${c}" ${c===cur?"selected":""}>${c}</option>`).join("");
  });
}

async function runComparison() {
  const c1 = document.getElementById("compare-c1")?.value;
  const c2 = document.getElementById("compare-c2")?.value;
  if (!c1 || !c2 || c1 === c2) { document.getElementById("compare-empty").style.display = "block"; document.getElementById("compare-content").style.display = "none"; return; }

  try {
    const d = await apiFetch("/compare-careers", {method:"POST", body:JSON.stringify({career1:c1, career2:c2})});
    document.getElementById("compare-empty").style.display  = "none";
    document.getElementById("compare-content").style.display = "block";

    // Career header cards
    ["career1","career2"].forEach((key,idx) => {
      const p = d[key];
      const card = document.getElementById(`comp-card${idx+1}`);
      card.innerHTML = `
        <div style="text-align:center;padding:.5rem 0 1rem">
          <div style="font-size:2.5rem;margin-bottom:.5rem">${allCareers.find(c=>c.name===p.name)?.icon||"🎯"}</div>
          <h3 style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700">${p.name}</h3>
          <p style="font-size:.82rem;color:var(--text2);margin-top:.4rem;line-height:1.6">${p.description}</p>
          <div style="margin-top:.8rem;display:inline-flex;align-items:center;gap:.4rem;background:var(--glass);border-radius:8px;padding:.4rem .8rem;font-size:.8rem;color:var(--green)">💰 ${p.salary_display||"—"}</div>
        </div>`;
    });

    // Comparison table
    const ct = document.getElementById("compare-table");
    ct.innerHTML = d.comparison.map(row => `
      <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:1rem;padding:.8rem 0;border-bottom:1px solid var(--border);align-items:center">
        <div style="font-size:.82rem;font-weight:500;color:var(--text3)">${row.label}</div>
        <div style="font-size:.88rem;color:var(--text)">${row.career1}</div>
        <div style="font-size:.88rem;color:var(--text)">${row.career2}</div>
      </div>`).join("");

    // Salary bar chart
    if (compareCh) compareCh.destroy();
    const ctx = document.getElementById("compare-chart");
    if (ctx) {
      compareCh = new Chart(ctx.getContext("2d"), {
        type:"bar",
        data:{
          labels:["Min Salary (₹L)","Max Salary (₹L)"],
          datasets:[
            {label:c1,data:[d.career1.salary_min/100000, d.career1.salary_max/100000],backgroundColor:"rgba(240,192,96,.75)",borderRadius:6,borderWidth:0},
            {label:c2,data:[d.career2.salary_min/100000, d.career2.salary_max/100000],backgroundColor:"rgba(139,92,246,.75)",borderRadius:6,borderWidth:0}
          ]
        },
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{color:"#9ba3c9",font:{size:11},padding:10,boxWidth:12}}},scales:{x:{ticks:{color:"#6b7394"},grid:{color:"rgba(255,255,255,.04)"}},y:{ticks:{color:"#6b7394",callback:v=>v+"L"},grid:{color:"rgba(255,255,255,.04)"}}}}
      });
    }
  } catch(ex) { toast("Error comparing: " + ex.message, "err"); }
}

/* ══════════════════════════════════════════════
   CAREER QUIZ
══════════════════════════════════════════════ */
async function loadQuizQuestions() {
  try {
    const d = await apiFetch("/quiz-questions");
    quizQuestions = d.questions;
  } catch(e) { console.warn("Quiz questions not loaded:", e); }
}

function startQuiz() {
  quizAnswers = {}; quizIdx = 0;
  document.getElementById("quiz-start").style.display   = "none";
  document.getElementById("quiz-body").style.display    = "block";
  document.getElementById("quiz-results").style.display = "none";
  renderQuestion();
}

function renderQuestion() {
  if (!quizQuestions.length) { toast("Quiz not loaded. Check backend.", "err"); return; }
  const q = quizQuestions[quizIdx];
  document.getElementById("q-num").textContent = quizIdx + 1;
  document.getElementById("quiz-prog").style.width = ((quizIdx + 1) / quizQuestions.length * 100) + "%";
  document.getElementById("quiz-question").textContent = q.question;
  const opts = document.getElementById("quiz-options");
  opts.innerHTML = q.options.map((o,i) => `
    <div class="quiz-opt ${quizAnswers[quizIdx]===i?'selected':''}" onclick="selectOpt(${i})"
      style="padding:.85rem 1.1rem;border-radius:10px;border:1px solid var(--border);margin-bottom:.55rem;cursor:pointer;font-size:.9rem;transition:all .2s;background:${quizAnswers[quizIdx]===i?'var(--gold-d)':'var(--glass)'};border-color:${quizAnswers[quizIdx]===i?'var(--border-a)':'var(--border)'}">
      <span style="display:inline-block;width:22px;height:22px;border-radius:50%;border:1.5px solid ${quizAnswers[quizIdx]===i?'var(--gold)':'var(--border)'};margin-right:.7rem;vertical-align:middle;background:${quizAnswers[quizIdx]===i?'var(--gold)':'transparent'};font-size:.7rem;text-align:center;line-height:20px;color:#000">${quizAnswers[quizIdx]===i?'✓':''}</span>${o.text}
    </div>`).join("");
}

function selectOpt(idx) {
  quizAnswers[quizIdx] = idx;
  renderQuestion();
  setTimeout(() => {
    if (quizIdx < quizQuestions.length - 1) { quizIdx++; renderQuestion(); }
    else submitQuiz();
  }, 380);
}

async function submitQuiz() {
  setLoader(true, "Calculating your career match…");
  try {
    const answers = {};
    Object.entries(quizAnswers).forEach(([qi, oi]) => { answers[quizQuestions[qi].id] = oi; });
    const d = await apiFetch("/quiz-result", {method:"POST", body:JSON.stringify({answers})});
    document.getElementById("quiz-body").style.display    = "none";
    document.getElementById("quiz-results").style.display = "block";
    document.getElementById("quiz-advisory").textContent  =
      `🎯 Based on your personality and preferences, your top career match is ${d.top_career}! Here are your full results:`;
    const rc = document.getElementById("quiz-result-cards");
    rc.innerHTML = d.results.map((r,i) => `
      <div class="card" style="text-align:center;border-color:${i===0?r.color:'var(--border)'}">
        <div style="font-size:2.5rem;margin-bottom:.5rem">${r.icon}</div>
        <div style="font-family:Syne,sans-serif;font-size:2rem;font-weight:700;color:${r.color};margin-bottom:.3rem">${r.pct}%</div>
        <div style="font-weight:600;margin-bottom:.3rem">${r.career}</div>
        <div style="font-size:.78rem;color:var(--text3)">#${i+1} match</div>
        <button class="btn btn-g btn-sm" style="margin-top:.8rem" onclick="openCareerModal('${r.career}')">View Profile</button>
      </div>`).join("");
  } catch(ex) { toast("Quiz error: " + ex.message, "err"); }
  finally { setLoader(false); }
}

function resetQuiz() {
  quizAnswers = {}; quizIdx = 0;
  document.getElementById("quiz-start").style.display   = "block";
  document.getElementById("quiz-body").style.display    = "none";
  document.getElementById("quiz-results").style.display = "none";
}

/* ══════════════════════════════════════════════
   DAILY CHECK-IN
══════════════════════════════════════════════ */
async function saveCheckin() {
  const mood   = document.getElementById("ci-mood").value;
  const energy = document.getElementById("ci-energy").value;
  const word   = document.getElementById("ci-word").value.trim();
  const note   = document.getElementById("ci-note").value.trim();
  try {
    await apiFetch("/daily-checkin", {method:"POST", body:JSON.stringify({mood,energy,word,note})});
    toast("Check-in saved! 🌟", "ok");
    loadCheckins();
  } catch(ex) { toast("Error: " + ex.message, "err"); }
}

async function loadCheckins() {
  try {
    const d = await apiFetch("/get-checkins");
    renderMoodCalendar(d.checkins);
    const ch = document.getElementById("checkin-history"); if (!ch) return;
    if (!d.checkins.length) { ch.innerHTML = '<p style="color:var(--text3);font-size:.88rem">No check-ins yet. Save your first one above!</p>'; return; }
    ch.innerHTML = d.checkins.slice(0,7).map(c => `
      <div style="display:flex;align-items:center;gap:1rem;padding:.7rem 0;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:10px;background:${moodColor(c.mood)};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${moodEmoji(c.mood)}</div>
        <div style="flex:1"><div style="font-size:.88rem;font-weight:500">${c.date} ${c.word ? '· <em style="color:var(--text3)">' + c.word + '</em>' : ''}</div><div style="font-size:.8rem;color:var(--text3)">Mood: ${c.mood}/10 · Energy: ${c.energy}/10</div>${c.note?`<div style="font-size:.78rem;color:var(--text3);margin-top:.15rem">${c.note}</div>`:''}</div>
      </div>`).join("");
  } catch(ex) { console.warn("Checkins:", ex.message); }
}

function moodColor(m) { return m>=8?"rgba(52,211,153,.2)":m>=5?"rgba(240,192,96,.15)":"rgba(248,113,113,.15)"; }
function moodEmoji(m) { return m>=8?"😊":m>=5?"😐":"😔"; }

function renderMoodCalendar(checkins) {
  const cal = document.getElementById("mood-calendar"); if (!cal) return;
  const map = {}; checkins.forEach(c => { map[c.date] = c.mood; });
  const today = new Date();
  const days  = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({date: key, mood: map[key] || 0});
  }
  cal.innerHTML = days.map(d => `
    <div title="${d.date}${d.mood?': Mood '+d.mood:''}" style="height:14px;border-radius:3px;background:${d.mood>=8?"var(--green)":d.mood>=5?"var(--gold)":d.mood>0?"var(--red)":"var(--border)"};opacity:${d.mood?1:.35};cursor:default;transition:transform .1s" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>`
  ).join("");
}

/* ══════════════════════════════════════════════
   JOB MARKET
══════════════════════════════════════════════ */
async function loadJobMarketDash() {
  const c = document.getElementById("job-market-dash"); if (!c) return;
  try {
    const d = await apiFetch("/job-market");
    const top3 = Object.entries(d.jobs).slice(0,3);
    c.innerHTML = top3.map(([name, info]) => `
      <div style="background:var(--glass);border:1px solid var(--border);border-radius:var(--r);padding:1rem">
        <div style="font-size:.78rem;color:var(--text3);margin-bottom:.3rem">${name}</div>
        <div style="font-family:Syne,sans-serif;font-size:1.3rem;font-weight:700;color:var(--text)">${info.count.toLocaleString()}</div>
        <div style="font-size:.76rem;color:var(--green);margin-top:.15rem">${info.trend} growth</div>
      </div>`).join("");
  } catch(e) { if (c) c.innerHTML = '<p style="color:var(--text3);font-size:.82rem">Job market data unavailable.</p>'; }
}

/* ══════════════════════════════════════════════
   PDF EXPORT
══════════════════════════════════════════════ */
async function exportPDF() {
  if (!lastResults) { toast("Run an assessment first!", "err"); return; }
  toast("Generating PDF…", "inf");
  try {
    const {jsPDF} = window.jspdf;
    const doc     = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});
    const W = 210, M = 18;
    let y = 20;

    // Header
    doc.setFillColor(8, 10, 18);
    doc.rect(0, 0, W, 40, "F");
    doc.setTextColor(240, 192, 96);
    doc.setFontSize(20); doc.setFont("helvetica","bold");
    doc.text("Career Path Navigator", M, y + 4);
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(155,163,201);
    doc.text("Personalised Career Analysis Report", M, y + 12);
    doc.text("Generated: " + new Date().toLocaleDateString("en-IN"), M, y + 19);
    if (currentUser) doc.text("User: " + currentUser.username, W - M - 30, y + 19);
    y = 52;

    // Advisory
    doc.setFillColor(30, 32, 48);
    doc.roundedRect(M, y, W - M*2, 18, 3, 3, "F");
    doc.setFontSize(9); doc.setTextColor(200, 200, 220);
    const advLines = doc.splitTextToSize(lastResults.advisory, W - M*2 - 8);
    doc.text(advLines, M + 4, y + 6);
    y += 26;

    // Career recommendations
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(240,192,96);
    doc.text("Career Recommendations", M, y); y += 8;
    lastResults.final_recs.forEach((r, i) => {
      doc.setFillColor(20, 22, 35);
      doc.roundedRect(M, y, W - M*2, 14, 2, 2, "F");
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(240,242,255);
      doc.text(`#${i+1}  ${r.career}`, M + 5, y + 9);
      doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(155,163,201);
      doc.text(`${r.confidence}% confidence`, W - M - 35, y + 9);
      y += 17;
    });
    y += 5;

    // Mental health
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(240,192,96);
    doc.text("Mental Health Analysis", M, y); y += 8;
    doc.setFillColor(20, 22, 35);
    doc.roundedRect(M, y, W - M*2, 24, 2, 2, "F");
    doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(240,242,255);
    doc.text("Sentiment Polarity:  " + (lastResults.sentiment.polarity >= 0 ? "+" : "") + lastResults.sentiment.polarity.toFixed(3), M+5, y+8);
    doc.text("Stress Level:         " + lastResults.sentiment.stress_level.toUpperCase(), M+5, y+15);
    doc.setTextColor(155,163,201); doc.setFontSize(9);
    const sumLines = doc.splitTextToSize(lastResults.sentiment.summary, W - M*2 - 10);
    doc.text(sumLines, M+5, y+21);
    y += 32;

    // Footer
    doc.setFontSize(8); doc.setTextColor(90,97,130);
    doc.text("Career Path Navigator · ML-powered career guidance · Generated automatically", M, 285);
    doc.text("Page 1 of 1", W - M - 18, 285);

    doc.save(`CPN_Report_${currentUser?.username||"user"}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast("PDF downloaded! 📄", "ok");
  } catch(ex) { toast("PDF error: " + ex.message, "err"); console.error(ex); }
}

/* ══════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════ */
async function loadHistory() {
  const c = document.getElementById("history-list");
  c.innerHTML = '<div class="skel sk-c" style="margin-bottom:.7rem"></div><div class="skel sk-c"></div>';
  try {
    const d = await apiFetch("/history");
    if (!d.history.length) { c.innerHTML = '<p style="color:var(--text3)">No history yet.</p>'; return; }
    c.innerHTML = d.history.map(r => `
      <div class="card" style="margin-bottom:.8rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.7rem">
          <span style="font-size:.78rem;color:var(--text3)">🕐 ${r.timestamp}</span>
          <span class="stress-ind ${r.stress_level==='high'?'s-hi':r.stress_level==='medium'?'s-med':'s-low'}" style="font-size:.72rem;padding:.18rem .6rem">${r.stress_level} stress</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.6rem">
          ${(r.final_recs||[]).map(cr=>`<span style="font-size:.76rem;padding:.18rem .65rem;border-radius:50px;background:var(--gold-d);color:var(--gold);border:1px solid rgba(240,192,96,.18)">🎯 ${cr.career} ${cr.confidence}%</span>`).join("")}
        </div>
        <p style="font-size:.82rem;color:var(--text3);line-height:1.6">${r.advisory}</p>
      </div>`).join("");
  } catch(ex) { c.innerHTML = `<p style="color:var(--red)">Failed: ${ex.message}</p>`; }
}

/* ══════════════════════════════════════════════
   ROADMAP BUILDER
══════════════════════════════════════════════ */
const RM_STEPS = [
  {id:"s1",icon:"🎓",text:"Complete graduation"},{id:"s2",icon:"📜",text:"Get certified"},
  {id:"s3",icon:"💼",text:"Internship / entry role"},{id:"s4",icon:"🛠️",text:"Build portfolio"},
  {id:"s5",icon:"🤝",text:"Network actively"},{id:"s6",icon:"📈",text:"Seek promotion"},
  {id:"s7",icon:"🌍",text:"International opportunity"},{id:"s8",icon:"🚀",text:"Launch side project"},
  {id:"s9",icon:"🎯",text:"Specialise in niche"},{id:"s10",icon:"🏆",text:"Reach senior role"}
];

function renderRoadmapLibrary() {
  const lib = document.getElementById("rm-library"); if (!lib) return;
  lib.innerHTML = RM_STEPS.map(s => `
    <div class="rm-item" draggable="true" data-id="${s.id}" data-text="${s.text}" data-icon="${s.icon}"
         ondragstart="rmDragStart(event)"><span>${s.icon}</span><span>${s.text}</span></div>`).join("");
}

function renderRoadmapNodes() {
  const c = document.getElementById("rm-nodes"); if (!c) return;
  const e = document.getElementById("rm-empty");
  if (!roadmapNodes.length) { c.innerHTML = ""; if(e) e.style.display = "flex"; return; }
  if(e) e.style.display = "none";
  c.innerHTML = roadmapNodes.map((n,i) => `
    <div class="rm-node" style="animation-delay:${i*.04}s">
      <div class="rm-num">${i+1}</div><span style="font-size:1.1rem">${n.icon}</span>
      <span style="font-size:.88rem">${n.text}</span>
      <button class="rm-del" onclick="removeRmNode(${i})">✕</button>
    </div>`).join("");
}

function rmDragStart(e) { draggedStep = {id:e.target.dataset.id, text:e.target.dataset.text, icon:e.target.dataset.icon}; e.dataTransfer.effectAllowed="copy"; }
function rmDragOver(e)  { e.preventDefault(); document.getElementById("rm-canvas").classList.add("over"); }
function rmDragLeave()  { document.getElementById("rm-canvas").classList.remove("over"); }
function rmDrop(e)      { e.preventDefault(); document.getElementById("rm-canvas").classList.remove("over"); if(!draggedStep) return; roadmapNodes.push({...draggedStep}); localStorage.setItem("cpn-roadmap",JSON.stringify(roadmapNodes)); renderRoadmapNodes(); draggedStep=null; }
function removeRmNode(i){ roadmapNodes.splice(i,1); localStorage.setItem("cpn-roadmap",JSON.stringify(roadmapNodes)); renderRoadmapNodes(); }
function clearRoadmap() { roadmapNodes=[]; localStorage.removeItem("cpn-roadmap"); renderRoadmapNodes(); toast("Roadmap cleared","inf"); }
function saveRoadmap()  { if(!roadmapNodes.length){toast("Add steps first!","err");return;} toast(`Roadmap saved! ${roadmapNodes.length} steps. 🗺️`,"ok"); }

/* ══════════════════════════════════════════════
   AI GUIDE (CHAT)
══════════════════════════════════════════════ */
const BOT = {
  "software engineer":"Software Engineering is great for analytical minds! Focus on DSA, build real projects, and contribute to open source. Python, JavaScript, and system design are key skills.",
  "data scientist":"Data Science needs strong maths + Python. Start with Kaggle competitions and the Andrew Ng ML course on Coursera — both are excellent foundations.",
  "doctor":"Medicine requires MBBS (5.5 years) + NEET. Extremely rewarding but demanding — high stress tolerance is key.",
  "stress":"High stress is a signal — slow down. Consider mindfulness, exercise, and speaking to a counsellor. Your wellbeing matters more than any career decision.",
  "salary":"Check the Explorer tab for salary ranges. Software Engineers earn ₹8–35L, Data Scientists ₹10–40L, Doctors ₹12–80L.",
  "otp":"OTP login is on the login page under the Email OTP tab. In dev mode the code appears on screen so no email setup needed.",
  "quiz":"The Career Quiz is in the sidebar! 10 personality questions — no sliders needed. Great for a quick match check.",
  "skill gap":"Go to Skill Gap tab and select your target career. You'll see a radar chart comparing your current profile vs the ideal profile.",
  "pdf":"Click Export PDF on the Results page after running an assessment. It generates a formatted report you can share with counsellors.",
  "default":"Great question! I'd suggest running the full Assessment for personalised insights. You can also try the Career Quiz for a quick match."
};
const SUGGESTIONS = ["Tell me about Data Science","How to handle stress?","What's the salary for Software Engineer?","How does OTP login work?","What is the Career Quiz?"];

function initChat() {
  const msgs = document.getElementById("chat-msgs"); if (!msgs || msgs.children.length > 0) return;
  addBotMsg("Hey! 👋 I'm your AI career guide. Ask me about careers, salaries, the quiz, skill gaps, PDF export, or anything else. What's on your mind?");
  const sugg = document.getElementById("chat-sugg");
  if (sugg) sugg.innerHTML = SUGGESTIONS.map(s=>`<div class="sugg" onclick="sendSugg('${s}')">${s}</div>`).join("");
}

function addBotMsg(text) {
  const c = document.getElementById("chat-msgs");
  const d = document.createElement("div"); d.className = "bubble bot";
  d.innerHTML = `<div class="bot-hd"><div class="bot-av">🤖</div><span class="bot-nm">CPN Guide</span></div><p>${text}</p>`;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}

function addUserMsg(text) {
  const c = document.getElementById("chat-msgs");
  const d = document.createElement("div"); d.className = "bubble usr"; d.textContent = text;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}

function getBotReply(text) {
  const t = text.toLowerCase();
  for (const [key, resp] of Object.entries(BOT)) {
    if (key !== "default" && t.includes(key)) return resp;
  }
  if (lastResults) {
    const top = lastResults.final_recs[0];
    if (t.includes("result")||t.includes("recommend")) return `Your top match is <strong>${top.career}</strong> (${top.confidence}% confidence). Run another assessment or check the Results tab for details.`;
  }
  return BOT.default;
}

function sendChat() {
  const inp = document.getElementById("chat-input"); const text = inp.value.trim(); if(!text) return;
  inp.value = ""; addUserMsg(text);
  const c = document.getElementById("chat-msgs");
  const typ = document.createElement("div"); typ.className = "bubble bot"; typ.id = "typing-ind";
  typ.innerHTML = `<div class="bot-hd"><div class="bot-av">🤖</div><span class="bot-nm">CPN Guide</span></div><div class="typing"><span></span><span></span><span></span></div>`;
  c.appendChild(typ); c.scrollTop = c.scrollHeight;
  setTimeout(() => { typ.remove(); addBotMsg(getBotReply(text)); }, 700 + Math.random()*400);
}

function sendSugg(text) { document.getElementById("chat-input").value = text; sendChat(); }

/* ══════════════════════════════════════════════
   LANDING COUNTERS
══════════════════════════════════════════════ */
function initCounters() {
  const suffixes = {"10":"+","92":"%","9":"+","3":""};
  document.querySelectorAll("[data-count]").forEach(el => {
    const target = parseInt(el.dataset.count); const suffix = suffixes[el.dataset.count]||"";
    const obs = new IntersectionObserver(entries => { if(entries[0].isIntersecting){animateCount(el,target,suffix);obs.disconnect();} },{threshold:0.5});
    obs.observe(el);
  });
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("cpn-theme");
  if (saved) applyTheme(saved);
  else if (window.matchMedia("(prefers-color-scheme: light)").matches) applyTheme("light");
  checkSession();
  initCounters();
  initChat();
});
