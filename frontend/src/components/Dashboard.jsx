import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import api from "../api"
import { ShieldAlert, ShieldCheck, Mail, MessageSquare, RefreshCw, TrendingUp, Activity, ArrowUpRight } from "lucide-react"

function StatCard({ icon: Icon, label, value, color, loading }) {
  const C = {
    cyan:   { bg:"rgba(34,211,238,0.08)",  border:"rgba(34,211,238,0.2)",  text:"#22d3ee", glow:"rgba(34,211,238,0.15)"  },
    red:    { bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.2)", text:"#f87171", glow:"rgba(248,113,113,0.15)" },
    green:  { bg:"rgba(74,222,128,0.08)",  border:"rgba(74,222,128,0.2)",  text:"#4ade80", glow:"rgba(74,222,128,0.15)"  },
    purple: { bg:"rgba(168,85,247,0.08)",  border:"rgba(168,85,247,0.2)",  text:"#a855f7", glow:"rgba(168,85,247,0.15)"  },
  }[color]
  return (
    <div className="glass-hover rounded-2xl p-5 relative overflow-hidden"
      style={{background:C.bg,border:`1px solid ${C.border}`}}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{background:C.glow,transform:"translate(30%,-30%)"}} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{background:C.bg,border:`1px solid ${C.border}`}}>
        <Icon size={18} style={{color:C.text}} />
      </div>
      {loading
        ? <><div className="skeleton h-8 w-16 mb-2"/><div className="skeleton h-3 w-24"/></>
        : <><p className="text-3xl font-bold text-white mb-1">{value??0}</p>
            <p className="text-xs" style={{color:"var(--text-secondary)"}}>{label}</p></>}
    </div>
  )
}

function RiskGauge({ phishing, total }) {
  const pct = total ? Math.round((phishing/total)*100) : 0
  const r = 54, circ = Math.PI*r
  const offset = circ - (pct/100)*circ
  const color = pct>=60?"#f87171":pct>=30?"#fbbf24":"#4ade80"
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-20">
        <svg width="144" height="80" viewBox="0 0 144 80">
          <path d="M 12 72 A 60 60 0 0 1 132 72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
          <path d="M 12 72 A 60 60 0 0 1 132 72" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)",filter:`drop-shadow(0 0 6px ${color})`}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-bold text-white">{pct}%</span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-1">Phishing rate</p>
    </div>
  )
}

const Tip = ({ active, payload }) => active && payload?.length
  ? <div className="glass rounded-xl px-3 py-2 border border-[var(--border)]">
      <p className="text-xs text-[var(--text-secondary)]">{payload[0]?.payload?.name}</p>
      <p className="text-sm font-semibold text-white">{payload[0]?.value}</p>
    </div>
  : null

export default function Dashboard() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [retraining, setRetraining] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get("/dashboard").then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [])

  const manualRetrain = async () => {
    setRetraining(true)
    try { await api.post("/admin/retrain") } catch(e) {}
    setTimeout(() => setRetraining(false), 3000)
  }

  const pieData = [
    { name:"Phishing",  value:data?.phishing||0,  color:"#f87171" },
    { name:"Legitimate",value:data?.legitimate||0, color:"#4ade80" },
  ]
  const sparkData = (data?.recent||[]).slice().reverse().map((s,i) => ({
    name:`#${i+1}`, value:s.risk_score||0
  }))

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Mail}          label="Total scanned"     value={data?.total}              color="cyan"   loading={loading}/>
        <StatCard icon={ShieldAlert}   label="Phishing detected" value={data?.phishing}           color="red"    loading={loading}/>
        <StatCard icon={ShieldCheck}   label="Legitimate"        value={data?.legitimate}         color="green"  loading={loading}/>
        <StatCard icon={MessageSquare} label="Feedback given"    value={data?.feedback_submitted} color="purple" loading={loading}/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-[var(--border)] glass-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Detection breakdown</h3>
            <Activity size={15} className="text-[var(--text-secondary)]"/>
          </div>
          {loading ? <div className="skeleton h-48 rounded-xl"/> : data?.total===0
            ? <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)]">
                <p className="text-sm">No scans yet</p>
              </div>
            : <div className="flex flex-col items-center gap-3">
                <RiskGauge phishing={data?.phishing||0} total={data?.total||1}/>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3}>
                      {pieData.map(e => <Cell key={e.name} fill={e.color} style={{filter:`drop-shadow(0 0 6px ${e.color}40)`}}/>)}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-xs">
                  {pieData.map(e => (
                    <div key={e.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{background:e.color,boxShadow:`0 0 6px ${e.color}`}}/>
                      <span className="text-[var(--text-secondary)]">{e.name}</span>
                      <span className="text-white font-medium">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>

        <div className="glass rounded-2xl p-5 border border-[var(--border)] glass-hover lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Risk score trend</h3>
            <TrendingUp size={15} className="text-cyan-400"/>
          </div>
          {loading ? <div className="skeleton h-48 rounded-xl"/> : sparkData.length===0
            ? <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)]">
                <TrendingUp size={28} className="mb-2 opacity-20"/>
                <p className="text-sm">No data yet</p>
              </div>
            : <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={sparkData} margin={{top:5,right:5,bottom:0,left:-20}}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="name" tick={{fill:"var(--text-secondary)",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--text-secondary)",fontSize:10}} axisLine={false} tickLine={false} domain={[0,100]}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#g)"
                    dot={{fill:"#22d3ee",r:3,strokeWidth:0}} activeDot={{r:5,fill:"#22d3ee"}}/>
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Recent scans */}
      <div className="glass rounded-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-white">Recent scans</h3>
          <div className="flex items-center gap-2">
            <button onClick={manualRetrain} disabled={retraining}
              className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-cyan-400 transition-colors border border-[var(--border)] hover:border-cyan-400/30 px-3 py-1.5 rounded-lg disabled:opacity-50">
              <RefreshCw size={12} className={retraining?"animate-spin text-cyan-400":""}/>
              {retraining?"Retraining...":"Force retrain"}
            </button>
            <button onClick={fetch} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-cyan-400 transition-colors">
              <RefreshCw size={13} className={loading?"animate-spin":""}/>
            </button>
          </div>
        </div>

        {loading
          ? <div className="p-5 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
          : !data?.recent?.length
            ? <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                <Mail size={32} className="mb-2 opacity-20"/>
                <p className="text-sm">No scans yet</p>
              </div>
            : <div className="divide-y divide-[var(--border)]">
                {data.recent.map((s,i) => {
                  const ip = s.prediction==="phishing"
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ip?"bg-red-400/10":"bg-green-400/10"}`}>
                        {ip?<ShieldAlert size={15} className="text-red-400"/>:<ShieldCheck size={15} className="text-green-400"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate max-w-xs">{s.subject||"No subject"}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{new Date(s.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{width:`${s.risk_score||0}%`,background:ip?"linear-gradient(90deg,#f87171,#fb923c)":"linear-gradient(90deg,#4ade80,#22d3ee)"}}/>
                          </div>
                          <span className="text-xs text-[var(--text-secondary)] mono w-8">{s.risk_score||0}</span>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${ip?"tag-phishing":"tag-legit"}`}>{s.prediction}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{s.confidence}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
        }
      </div>

      {/* Model info */}
      <div className="rounded-2xl p-4 border" style={{background:"rgba(34,211,238,0.04)",borderColor:"rgba(34,211,238,0.15)"}}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity size={15} className="text-cyan-400"/>
          </div>
          <div>
            <p className="text-sm font-medium text-cyan-300 mb-1">Adaptive learning active</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Every feedback triggers <span className="mono text-cyan-400">partial_fit()</span> on the online SGDClassifier.
              Every 10 feedbacks trigger a full batch retrain. Base Random Forest blends with online model at 65/35 ratio.
              Total feedback: <span className="text-white font-medium">{data?.feedback_submitted||0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
