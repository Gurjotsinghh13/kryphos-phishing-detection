import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import Auth from "./components/Auth";
import Analyzer from "./components/Analyzer";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import { Shield, LayoutDashboard, Search, Clock, LogOut, Activity } from "lucide-react";

function NavItem({ to, icon: Icon, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
        ${
          active
            ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
            : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent"
        }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

function Layout({ children }) {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-800 flex flex-col p-4 gap-1 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-3 mb-4">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-1.5">
            <Shield size={16} className="text-blue-400" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm">PhishGuard</span>
            <span className="block text-xs text-gray-500 leading-none">AI v2.0</span>
          </div>
        </div>

        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/analyze" icon={Search} label="Analyze Email" />
        <NavItem to="/history" icon={Clock} label="History" />

        {/* Model status indicator */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-green-400" />
            <span className="text-xs text-gray-400">Model active</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">Learning from feedback</p>
        </div>

        <div className="mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                       text-gray-500 hover:text-red-400 hover:bg-gray-800 w-full transition-all"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analyze"
          element={
            <PrivateRoute>
              <Layout>
                <Analyzer />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <Layout>
                <History />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
