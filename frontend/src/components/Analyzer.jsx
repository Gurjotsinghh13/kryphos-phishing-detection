import { useState, useRef } from "react"
import api from "../api"
import {
  Shield, AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown,
  RefreshCw, Link, FileText, ChevronDown, ChevronUp, Zap, Globe, Hash
} from "lucide-react"

function RiskMeter({ score }) {
  const r = 70, circ = Math.PI * r
  const offset = circ - (score/100) * circ
  const color = score>=65?"#f87171":score>=35?"#fbbf24":"#4ade80"
  const label = score>=65?"HIGH RISK":score>=35?"MEDIUM":"LOW RISK"
  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        <svg width="180" height="100" viewBox="0 0 180 100">
          <path d="M 15 95 A 75 75 0 0 1 165 95" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round"/>
          <path d="M 15 95 A 75 75 0 0 1 165 95" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{transition:"stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)",filter:`drop-shadow(0 0 8px ${color})`}}/>
          {[0,25,50,75,100].map(v => {
            const a = -180+(v/100)*180, rad=(a*Math.PI)/180
            return <line key={v}
              x1={90+62*Math.cos(rad)} y1={95+62*Math.sin(rad)}
              x2={90+72*Math.cos(rad)} y2={95+72*Math.sin(rad)}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs font-bold tracking-widest mt-0.5" style={{color}}>{label}</span>
        </div>
      </div>
      <div className="flex justify-between w-44 text-xs text-[var(--text-secondary)] mt-1 px-2">
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  )
}

function ConfBar({ value, label, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-white font-medium mono">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{width:`${value}%`,background:color,boxShadow:`0 0 8px ${color}40`}}/>
      </div>
    </div>
  )
}

function URLCard({ url, score, features }) {
  const [open, setOpen] = useState(false)
  const c = score>=60?"#f87171":score>=30?"#fbbf24":"#4ade80"
  const flags = [
    {label:"HTTPS",     val:features.is_https,       good:true  },
    {label:"IP URL",    val:features.is_ip_address,  good:false },
    {label:"Shortener", val:features.is_shortener,   good:false },
    {label:"Susp. TLD", val:features.suspicious_tld, good:false },
  ]
  return (
    <div className="rounded-xl overflow-hidden border transition-all"
      style={{borderColor:`${c}30`,background:`${c}08`}}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <Globe size={14} style={{color:c,flexShrink:0}}/>
        <span className="text-xs mono text-[var(--text-primary)] truncate flex-1">{url}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold mono" style={{color:c}}>{score}</span>
          {open?<ChevronUp size={13} className="text-[var(--text-secondary)]"/>:<ChevronDown size={13} className="text-[var(--text-secondary)]"/>}
        </div>
      </div>
      {open && (
        <div className="border-t px-4 py-3 grid grid-cols-2 gap-2" style={{borderColor:`${c}20`}}>
          {flags.map(f => {
            const active = f.val===1||f.val===true
            const ok = (active&&f.good)||(!active&&!f.good)
            return (
              <div key={f.label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{background:ok?"#4ade80":"#f87171"}}/>
                <span className="text-xs text-[var(--text-secondary)]">{f.label}</span>
                <span className="text-xs font-medium ml-auto" style={{color:ok?"#4ade80":"#f87171"}}>{active?"Yes":"No"}</span>
              </div>
            )
          })}
          <div className="col-span-2 flex items-center gap-2 mt-1 pt-2 border-t" style={{borderColor:`${c}15`}}>
            <Hash size={12} className="text-[var(--text-muted)]"/>
            <span className="text-xs text-[var(--text-secondary)]">Entropy</span>
            <span className="text-xs mono text-white ml-auto">{features.url_entropy?.toFixed(2)||"—"}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Analyzer() {
  const [form, setForm]           = useState({ subject:"", body:"", urls:"" })
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [feedback, setFeedback]   = useState(null)
  const [fbMsg, setFbMsg]         = useState("")
  const [showUrls, setShowUrls]   = useState(false)
  const [repLoading, setRepLoading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const intervalRef               = useRef(null)

  const analyze = async () => {
    if (!form.subject && !form.body) return
    setLoading(true); setResult(null); setFeedback(null); setFbMsg(""); setProgress(0)
    intervalRef.current = setInterval(() => setProgress(p => p<85?p+Math.random()*8:p), 200)
    try {
      const { data } = await api.post("/analyze", {
        subject: form.subject, body: form.body,
        urls: form.urls.split("\n").filter(Boolean)
      })
      setProgress(100)
      setTimeout(() => { setResult(data); setLoading(false) }, 300)
    } catch(e) {
      alert(e.response?.data?.detail || "Analysis failed. Is the backend running?")
      setLoading(false); setProgress(0)
    } finally { clearInterval(intervalRef.current) }
  }

  const submitFeedback = async (trueLabel) => {
    if (!result?.scan_id) return
    try {
      const { data } = await api.post("/feedback", { scan_id:result.scan_id, true_label:trueLabel })
      setFeedback(trueLabel===(result.prediction==="phishing"?1:0)?"confirmed":"corrected")
      setFbMsg(data.message)
    } catch { setFbMsg("Could not submit feedback.") }
  }

  const downloadReport = async () => {
    setRepLoading(true)
    try {
      const res = await api.post(
        "/report/pdf",
        { subject:form.subject, body:form.body, urls:form.urls.split("\n").filter(Boolean) },
        { responseType:"blob" }
      )
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a"); a.href=url; a.download="kryphos_ai_report.pdf"; a.click()
    } catch { alert("Could not generate report.") }
    finally { setRepLoading(false) }
  }

  const ip = result?.prediction==="phishing"
  const rc = result ? (result.risk_level==="high"?"#f87171":result.risk_level==="medium"?"#fbbf24":"#4ade80") : "#22d3ee"

  return (
    <div className="max-w-5xl space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Input */}
        <div className="lg:col-span-3 glass rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
              <Shield size={16} className="text-cyan-400"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Email Input</p>
              <p className="text-xs text-[var(--text-secondary)]">Paste email content to analyze</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <input placeholder="Email subject line..." value={form.subject}
              className="input-cyber w-full px-4 py-3 rounded-xl text-sm"
              onChange={e => setForm({...form,subject:e.target.value})}/>
            <div className="relative">
              <textarea rows={9} placeholder="Paste the full email body here..."
                value={form.body} className="input-cyber w-full px-4 py-3 rounded-xl text-sm"
                onChange={e => setForm({...form,body:e.target.value})}/>
              {loading && <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <div className="scan-overlay animate-scan"/>
              </div>}
            </div>
            <button onClick={() => setShowUrls(!showUrls)}
              className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-cyan-400 transition-colors">
              <Link size={13}/> Add URLs {showUrls?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
            </button>
            {showUrls && (
              <textarea rows={3} placeholder="Paste URLs — one per line..."
                value={form.urls} className="input-cyber w-full px-4 py-3 rounded-xl text-sm"
                onChange={e => setForm({...form,urls:e.target.value})}/>
            )}
            <div className="relative">
              {loading && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 rounded-full overflow-hidden mb-px">
                  <div className="h-full rounded-full transition-all duration-200"
                    style={{width:`${progress}%`,background:"linear-gradient(90deg,#22d3ee,#3b82f6)"}}/>
                </div>
              )}
              <button onClick={analyze} disabled={loading||(!form.subject&&!form.body)}
                className="btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-1">
                {loading
                  ? <><RefreshCw size={15} className="animate-spin"/>Scanning... {Math.round(progress)}%</>
                  : <><Zap size={15}/>Analyze Email</>}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {!result && !loading && (
            <div className="glass rounded-2xl border border-[var(--border)] p-8 flex flex-col items-center justify-center text-center min-h-64">
              <div className="w-16 h-16 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center mb-4">
                <Shield size={28} className="text-cyan-400/30"/>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Paste an email and click analyze</p>
            </div>
          )}
          {loading && (
            <div className="glass rounded-2xl border border-[var(--border)] p-8 flex flex-col items-center justify-center text-center min-h-64">
              <div className="w-16 h-16 rounded-2xl border border-cyan-400/20 flex items-center justify-center mb-4 relative"
                style={{boxShadow:"0 0 30px rgba(34,211,238,0.15)"}}>
                <Shield size={26} className="text-cyan-400"/>
                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/20 animate-ping"/>
              </div>
              <p className="text-sm text-cyan-400 font-medium">Analyzing threat vectors...</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Running ML models + URL analysis</p>
            </div>
          )}
          {result && (
            <>
              <div className="glass rounded-2xl border overflow-hidden"
                style={{borderColor:`${rc}30`,boxShadow:`0 0 30px ${rc}15`}}>
                <div className="px-5 py-4" style={{background:`${rc}08`}}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {ip?<AlertTriangle size={18} style={{color:rc}}/>:<CheckCircle size={18} style={{color:rc}}/>}
                      <span className="text-lg font-bold text-white capitalize">{result.prediction}</span>
                    </div>
                    <span className="text-xs mono px-2 py-0.5 rounded-lg border"
                      style={{color:rc,borderColor:`${rc}30`,background:`${rc}10`}}>
                      {result.model_source}
                    </span>
                  </div>
                  <RiskMeter score={result.risk_score}/>
                  <div className="space-y-2 mt-2">
                    <ConfBar value={result.confidence} label="AI Confidence"
                      color={ip?"linear-gradient(90deg,#f87171,#fb923c)":"linear-gradient(90deg,#4ade80,#22d3ee)"}/>
                    <ConfBar value={Math.round(result.prob_phishing*100)} label="Phishing probability"
                      color="linear-gradient(90deg,#a855f7,#3b82f6)"/>
                  </div>
                </div>
              </div>
              {result.flagged_keywords?.length > 0 && (
                <div className="glass rounded-2xl border border-[var(--border)] p-4">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Threat keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.flagged_keywords.map(kw => (
                      <span key={kw} className="tag-phishing text-xs px-2.5 py-1 rounded-lg mono">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* URL Analysis */}
      {result?.url_analysis?.length > 0 && (
        <div className="glass rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} className="text-cyan-400"/>
            <p className="text-sm font-semibold text-white">URL Analysis</p>
            <span className="text-xs text-[var(--text-secondary)] ml-auto">
              {result.suspicious_urls?.length||0} suspicious / {result.url_analysis.length} total
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.url_analysis.map((u,i) => <URLCard key={i} url={u.url} score={u.score} features={u.features}/>)}
          </div>
        </div>
      )}

      {/* Feedback + Report */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl border border-[var(--border)] p-5">
            {!feedback ? (
              <>
                <p className="text-sm font-semibold text-white mb-1">Was this prediction correct?</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">Your feedback trains the AI model instantly.</p>
                <div className="flex gap-3">
                  <button onClick={() => submitFeedback(ip?1:0)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",color:"#4ade80"}}>
                    <ThumbsUp size={14}/> Correct
                  </button>
                  <button onClick={() => submitFeedback(ip?0:1)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171"}}>
                    <ThumbsDown size={14}/> Wrong
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {feedback==="confirmed"
                  ?<CheckCircle size={18} className="text-green-400 flex-shrink-0"/>
                  :<RefreshCw size={18} className="text-cyan-400 flex-shrink-0"/>}
                <div>
                  <p className="text-sm text-white font-medium">{feedback==="confirmed"?"Feedback recorded!":"Model corrected!"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{fbMsg}</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={downloadReport} disabled={repLoading}
            className="glass rounded-2xl border border-[var(--border)] p-5 flex items-center gap-4 hover:border-cyan-400/30 transition-all group disabled:opacity-50">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/8 border border-cyan-400/15 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-400/15 transition-colors">
              {repLoading?<RefreshCw size={18} className="text-cyan-400 animate-spin"/>:<FileText size={18} className="text-cyan-400"/>}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Download PDF Report</p>
              <p className="text-xs text-[var(--text-secondary)]">Professional threat analysis report</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
