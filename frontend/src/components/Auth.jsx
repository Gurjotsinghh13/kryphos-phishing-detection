import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Shield, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react"

// Direct backend URL for login (OAuth2 form-encoded — cannot use api.js interceptor)
const BACKEND = import.meta.env.VITE_API_URL || ""

function FloatingParticle({ style }) {
  return <div className="absolute rounded-full blur-xl pointer-events-none" style={style} />
}

export default function Auth() {
  const [mode, setMode]       = useState("login")
  const [form, setForm]       = useState({ email: "", password: "", full_name: "" })
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const nav = useNavigate()

  const submit = async () => {
    setError(""); setLoading(true)
    try {
      if (mode === "register") {
        await axios.post(`${BACKEND}/auth/register`, form)
        setMode("login"); setError("")
        return
      }
      // Login uses OAuth2 form-encoded spec
      const params = new URLSearchParams()
      params.append("username", form.email)
      params.append("password", form.password)
      const { data } = await axios.post(`${BACKEND}/auth/login`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      })
      localStorage.setItem("token", data.access_token)
      nav("/dashboard")
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong. Check if backend is running.")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticle style={{width:400,height:400,top:"-10%",left:"-10%",opacity:0.4,background:"rgba(34,211,238,0.06)"}} />
      <FloatingParticle style={{width:300,height:300,bottom:"5%",right:"-5%",opacity:0.3,background:"rgba(168,85,247,0.06)"}} />
      <FloatingParticle style={{width:200,height:200,top:"40%",left:"60%",opacity:0.2,background:"rgba(34,211,238,0.06)"}} />

      <div className="w-full max-w-md transition-all duration-700 opacity-100 translate-y-0">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
            style={{background:"linear-gradient(135deg,rgba(34,211,238,0.15),rgba(59,130,246,0.15))",border:"1px solid rgba(34,211,238,0.3)",boxShadow:"0 0 40px rgba(34,211,238,0.2)"}}>
            <Shield size={28} className="text-cyan-400" />
            <div className="absolute inset-0 rounded-2xl animate-spin-slow"
              style={{background:"conic-gradient(from 0deg,rgba(34,211,238,0.1),transparent,rgba(59,130,246,0.1),transparent)"}} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Kryphos <span className="grad-text">AI</span></h1>
          <p className="text-[var(--text-secondary)] text-sm">Advanced email threat detection platform</p>
        </div>

        {/* Card */}
        <div className="glass grad-border rounded-2xl p-7"
          style={{boxShadow:"0 25px 50px rgba(0,0,0,0.5),0 0 0 1px rgba(34,211,238,0.05)"}}>

          {/* Toggle */}
          <div className="flex bg-[var(--bg-base)] rounded-xl p-1 mb-6 border border-[var(--border)]">
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError("") }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${mode===m
                    ?"bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/20"
                    :"text-[var(--text-secondary)] hover:text-white"}`}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div className="relative group">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-cyan-400 transition-colors z-10" />
                <input placeholder="Full name" value={form.full_name}
                  className="input-cyber w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
            )}

            <div className="relative group">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-cyan-400 transition-colors z-10" />
              <input type="email" placeholder="Email address" value={form.email}
                className="input-cyber w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div className="relative group">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-cyan-400 transition-colors z-10" />
              <input type={showPass?"text":"password"} placeholder="Password" value={form.password}
                className="input-cyber w-full pl-10 pr-11 py-3 rounded-xl text-sm"
                onChange={e => setForm({...form, password: e.target.value})}
                onKeyDown={e => e.key === "Enter" && submit()} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-cyan-400 transition-colors">
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)"}}>
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button onClick={submit} disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                : <>{mode==="login"?"Sign in":"Create account"}<ArrowRight size={15}/></>}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-[var(--text-muted)] text-xs">
          <Shield size={11} />
          <span>Protected by AES-256 encryption & JWT authentication</span>
        </div>
      </div>
    </div>
  )
}
