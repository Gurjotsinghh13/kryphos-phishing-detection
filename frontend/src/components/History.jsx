import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, RefreshCw, ShieldAlert, ShieldCheck, Search } from "lucide-react";

export default function History() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | phishing | legitimate

  const fetchHistory = () => {
    setLoading(true);
    axios
      .get("/api/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((r) => setScans(r.data))
      .catch(() => setScans([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered =
    filter === "all" ? scans : scans.filter((s) => s.prediction === filter);

  const riskColor = {
    high: "text-red-400 bg-red-900/20 border-red-800/40",
    medium: "text-yellow-400 bg-yellow-900/20 border-yellow-800/40",
    low: "text-green-400 bg-green-900/20 border-green-800/40",
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-blue-400" />
          <h1 className="text-lg font-semibold text-white">Scan History</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {scans.length} total
          </span>
        </div>
        <button
          onClick={fetchHistory}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {["all", "phishing", "legitimate"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${
              filter === f
                ? "bg-gray-700 text-white border-gray-600"
                : "text-gray-500 border-gray-700 hover:text-gray-300"
            }`}
          >
            {f === "phishing" && (
              <ShieldAlert size={11} className="inline mr-1 mb-0.5" />
            )}
            {f === "legitimate" && (
              <ShieldCheck size={11} className="inline mr-1 mb-0.5" />
            )}
            {f}
            {f !== "all" && (
              <span className="ml-1.5 text-gray-500">
                ({scans.filter((s) => s.prediction === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-8">
          <RefreshCw size={14} className="animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No scans found</p>
          <p className="text-gray-600 text-xs mt-1">
            Analyze an email to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4
                         hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-200 text-sm font-medium truncate">
                    {s.subject || "No subject"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg border ${
                      s.prediction === "phishing"
                        ? "bg-red-900/30 text-red-400 border-red-800/40"
                        : "bg-green-900/30 text-green-400 border-green-800/40"
                    }`}
                  >
                    {s.prediction}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg border ${
                      riskColor[s.risk_level] || riskColor.low
                    }`}
                  >
                    {s.risk_level} risk
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                  Confidence:{" "}
                  <span className="text-gray-300">{s.confidence}%</span>
                </span>
                <span className="text-xs text-gray-500">
                  Score:{" "}
                  <span className="text-gray-300">{s.risk_score}/100</span>
                </span>
                {s.confirmed_label !== null &&
                  s.confirmed_label !== undefined && (
                    <span className="text-xs text-gray-500">
                      Confirmed:{" "}
                      <span
                        className={
                          s.confirmed_label === 1
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {s.confirmed_label === 1 ? "phishing" : "legitimate"}
                      </span>
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
