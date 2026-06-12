import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom"
import Auth from "./components/Auth"
import Dashboard from "./components/Dashboard"
import Analyzer from "./components/Analyzer"
import History from "./components/History"
import { Shield, LayoutDashboard, Search, Clock, LogOut, Activity, ChevronLeft, ChevronRight, Bell, Menu, X } from "lucide-react"

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/analyze",   icon: Search,          label: "Analyzer"  },
    { to: "/history",   icon: Clock,           label: "History"   },
  ]
  const logout = () => { localStorage.removeItem("token"); window.location.href = "/login" }

  const Content = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[var(--border)] ${collapsed?"justify-center":""}`}>
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center"
            style={{boxShadow:"0 0 20px rgba(34,211,238,0.4)"}}>
            <Shield size={16} className="text-gray-950" />
          </div>
          <div className="status-dot absolute -bottom-0.5 -right-0.5 border border-[var(--bg-surface)]" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-white tracking-wide">PhishGuard</p>
            <p className="text-[10px] text-cyan-400/70 tracking-widest uppercase">AI Security</p>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="ml-auto text-[var(--text-secondary)] hover:text-cyan-400 transition-colors">
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <NavLink key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden
                ${active ? "nav-active" : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"}
                ${collapsed ? "justify-center" : ""}`}>
              {active && <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/8 to-transparent pointer-events-none" />}
              <Icon size={17} className={active ? "text-cyan-400" : "group-hover:text-white transition-colors"} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[var(--border)] pointer-events-none z-50">
                  {label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className={`px-2 py-3 border-t border-[var(--border)] space-y-1 ${collapsed?"items-center flex flex-col":""}`}>
        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-cyan-400 hover:bg-cyan-400/8 transition-all w-full flex justify-center">
            <ChevronRight size={16} />
          </button>
        )}
        <button onClick={logout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/8 transition-all w-full ${collapsed?"justify-center":""}`}>
          <LogOut size={16} />
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className={`hidden md:flex flex-col glass border-r border-[var(--border)] h-screen sticky top-0 transition-all duration-300 flex-shrink-0 ${collapsed?"w-16":"w-56"}`}>
        <Content />
      </aside>
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 glass rounded-lg text-cyan-400 border border-[var(--border)]">
        <Menu size={18} />
      </button>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 glass border-r border-[var(--border)] h-full">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-white">
              <X size={18} />
            </button>
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const titles = { "/dashboard":"Dashboard", "/analyze":"Email Analyzer", "/history":"Scan History" }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)] grid-bg">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] glass flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-white">{titles[location.pathname]}</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">PhishGuard AI Security Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full">
              <div className="status-dot" />
              <span className="text-green-400 text-xs font-medium">Model active</span>
            </div>
            <button className="w-8 h-8 glass rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-cyan-400 transition-colors border border-[var(--border)]">
              <Bell size={15} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={<Auth />} />
        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/analyze"   element={<PrivateRoute><Layout><Analyzer /></Layout></PrivateRoute>} />
        <Route path="/history"   element={<PrivateRoute><Layout><History /></Layout></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
