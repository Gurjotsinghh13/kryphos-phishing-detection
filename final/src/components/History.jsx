import { useEffect, useState } from "react"
import api from "../api"
import { Clock, RefreshCw, ShieldAlert, ShieldCheck, Search, Filter, X } from "lucide-react"

export default function History() {
  const [scans, setScans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const fetchHistory = () => {
    setLoading(true)
    api.get("/history").then(r => setScans(r.data)).catch(() => setScans([]))
    .finally(() => setLoading(false))
  }
  useEffect(() => { fetchHistory() }, [])

  const filtered = scans
    .filter(s => filter==="all"||s.prediction===filter)
    .filter(s => !search||s.subject?.toLowerCase().includes(search.toLowerCase()))

  const rs = {
    high:   { color:"#f87171", bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.2)" },
    medium: { color:"#fbbf24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.2)"  },
    low:    { color:"#4ade80", bg:"rgba(74,222,128,0.08)",  border:"rgba(74,222,128,0.2)"  },
  }

  const phishCount = scans.filter(s=>s.prediction==="phishing").length
  const legitCount = scans.filter(s=>s.prediction==="legitimate").length

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Total scans",       value:scans.length, color:"#22d3ee"},
          {label:"Phishing detected", value:phishCount,   color:"#f87171"},
          {label:"Legitimate emails", value:legitCount,   color:"#4ade80"},
        ].map(s => (
          <div key={s.label} className="glass rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{background:`${s.color}10`,border:`1px solid ${s.color}25`}}>
              <span className="text-sm font-bold" style={{color:s.color}}>{s.value}</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass rounded-2xl border border-[var(--border)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by subject..."
              className="input-cyber w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"/>
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
                <X size={13}/>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {["all","phishing","legitimate"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all
                  ${filter===f
                    ? f==="phishing"   ? "bg-red-400/15 text-red-400 border border-red-400/25"
                    : f==="legitimate" ? "bg-green-400/15 text-green-400 border border-green-400/25"
                    : "bg-cyan-400/15 text-cyan-400 border border-cyan-400/25"
                    : "text-[var(--text-secondary)] border border-[var(--border)] hover:text-white"}`}>
                {f==="phishing"   && <ShieldAlert size={12}/>}
                {f==="legitimate" && <ShieldCheck size={12}/>}
                {f==="all"        && <Filter size={12}/>}
                {f}
                {f!=="all" && <span className="opacity-60">({f==="phishing"?phishCount:legitCount})</span>}
              </button>
            ))}
            <button onClick={fetchHistory}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-400/30 transition-all">
              <RefreshCw size={14} className={loading?"animate-spin":""}/>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Subject</div>
          <div className="col-span-2">Verdict</div>
          <div className="col-span-2">Risk</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-1 hidden sm:block">Date</div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-[var(--text-secondary)]">
            <Clock size={36} className="mb-3 opacity-15"/>
            <p className="text-sm">{search?"No results found":"No scans yet"}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {search?"Try a different search term":"Analyze an email to see it here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((s,i) => {
              const ip = s.prediction==="phishing"
              const r  = rs[s.risk_level]||rs.low
              return (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.018] transition-colors group">
                  <div className="col-span-1 text-xs text-[var(--text-muted)] mono">{i+1}</div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                      {s.subject||"No subject"}
                    </p>
                    {s.confirmed_label!==null&&s.confirmed_label!==undefined && (
                      <p className="text-xs mt-0.5" style={{color:s.confirmed_label===1?"#f87171":"#4ade80"}}>
                        ✓ {s.confirmed_label===1?"phishing":"legitimate"}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium ${ip?"tag-phishing":"tag-legit"}`}>
                      {ip?<ShieldAlert size={11}/>:<ShieldCheck size={11}/>}
                      {s.prediction}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs px-2 py-0.5 rounded-lg capitalize"
                      style={{color:r.color,background:r.bg,border:`1px solid ${r.border}`}}>
                      {s.risk_level}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{width:`${s.risk_score||0}%`,background:ip?"linear-gradient(90deg,#f87171,#fb923c)":"linear-gradient(90deg,#4ade80,#22d3ee)"}}/>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] mono w-6 text-right">{s.risk_score||0}</span>
                  </div>
                  <div className="col-span-1 hidden sm:block text-xs text-[var(--text-muted)]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length>0 && (
          <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              Showing <span className="text-white">{filtered.length}</span> of <span className="text-white">{scans.length}</span> scans
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
