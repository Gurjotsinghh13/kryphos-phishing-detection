import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import {
  Brain,
  ShieldAlert,
  ShieldCheck,
  Mail,
  MessageSquare,
  RefreshCw,
  Info,
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [retraining, setRetraining] = useState(false);

  const fetchData = () => {
    axios
      .get("/api/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((r) => setData(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const manualRetrain = async () => {
    setRetraining(true);
    try {
      await axios.post(
        "/api/admin/retrain",
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setTimeout(() => setRetraining(false), 3000);
    } catch (e) {
      setRetraining(false);
    }
  };

  if (!data)
    return (
      <div className="p-6 flex items-center gap-2 text-gray-500 text-sm">
        <RefreshCw size={14} className="animate-spin" /> Loading dashboard...
      </div>
    );

  const pieData = [
    { name: "Phishing", value: data.phishing || 0, color: "#ef4444" },
    { name: "Legitimate", value: data.legitimate || 0, color: "#22c55e" },
  ];

  const stats = [
    {
      icon: Mail,
      label: "Total scanned",
      value: data.total,
      color: "text-blue-400",
      bg: "bg-blue-900/10 border-blue-800/30",
    },
    {
      icon: ShieldAlert,
      label: "Phishing detected",
      value: data.phishing,
      color: "text-red-400",
      bg: "bg-red-900/10 border-red-800/30",
    },
    {
      icon: ShieldCheck,
      label: "Legitimate",
      value: data.legitimate,
      color: "text-green-400",
      bg: "bg-green-900/10 border-green-800/30",
    },
    {
      icon: MessageSquare,
      label: "Feedback given",
      value: data.feedback_submitted,
      color: "text-purple-400",
      bg: "bg-purple-900/10 border-purple-800/30",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-blue-400" />
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-green-900/20 text-green-400 border border-green-800/40 px-3 py-1 rounded-full">
            Model online
          </span>
          <button
            onClick={manualRetrain}
            disabled={retraining}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200
                       border border-gray-700 hover:border-gray-600 px-3 py-1 rounded-full
                       transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={retraining ? "animate-spin" : ""} />
            {retraining ? "Retraining..." : "Force retrain"}
          </button>
          <button
            onClick={fetchData}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`border rounded-2xl p-4 ${s.bg}`}
          >
            <s.icon size={16} className={`${s.color} mb-2`} />
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className={`text-3xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pie chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-300 text-sm font-medium mb-4">
            Detection breakdown
          </p>
          {data.total === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
              No scans yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    color: "#e5e7eb",
                    fontSize: 12,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent scans */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-300 text-sm font-medium mb-4">Recent scans</p>
          {data.recent?.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
              No scans yet
            </div>
          ) : (
            <div className="space-y-2">
              {(data.recent || []).map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2
                             border-b border-gray-800 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-300 text-xs truncate max-w-[160px]">
                      {s.subject || "No subject"}
                    </p>
                    {s.confirmed_label !== null &&
                      s.confirmed_label !== undefined && (
                        <p className="text-gray-600 text-xs">
                          confirmed:{" "}
                          {s.confirmed_label === 1 ? "phishing" : "legit"}
                        </p>
                      )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-600">
                      {s.confidence}%
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg ${
                        s.prediction === "phishing"
                          ? "bg-red-900/30 text-red-400"
                          : "bg-green-900/30 text-green-400"
                      }`}
                    >
                      {s.prediction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How it learns */}
      <div className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info size={15} className="text-blue-400" />
          <p className="text-blue-300 text-sm font-medium">
            How the model learns from you
          </p>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">
          Every time you click <span className="text-green-400">"Yes, correct"</span> or{" "}
          <span className="text-red-400">"No, it's wrong"</span> after an analysis, your
          feedback is immediately fed into the online SGDClassifier via{" "}
          <span className="font-mono text-gray-300">partial_fit()</span>. Every 10
          feedback submissions trigger a full batch retrain. The base Random Forest model
          blends with the online model at a 65/35 ratio — so predictions improve the more
          you use it.
        </p>
      </div>
    </div>
  );
}
