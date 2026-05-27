import { useState } from "react";
import axios from "axios";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Link,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

const api = (path, method = "post", data) =>
  axios({
    method,
    url: "/api" + path,
    data,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

export default function Analyzer() {
  const [form, setForm] = useState({ subject: "", body: "", urls: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [fbMsg, setFbMsg] = useState("");
  const [showUrls, setShowUrls] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const analyze = async () => {
    if (!form.subject && !form.body) return;
    setLoading(true);
    setResult(null);
    setFeedback(null);
    setFbMsg("");
    try {
      const { data } = await api("/analyze", "post", {
        subject: form.subject,
        body: form.body,
        urls: form.urls.split("\n").filter(Boolean),
      });
      setResult(data);
    } catch (e) {
      alert(e.response?.data?.detail || "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (trueLabel) => {
    if (!result?.scan_id) return;
    try {
      const { data } = await api("/feedback", "post", {
        scan_id: result.scan_id,
        true_label: trueLabel,
      });
      const predicted = result.prediction === "phishing" ? 1 : 0;
      setFeedback(trueLabel === predicted ? "confirmed" : "corrected");
      setFbMsg(data.message);
    } catch (e) {
      setFbMsg("Could not submit feedback.");
    }
  };

  const downloadReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios({
        method: "post",
        url: "/api/report/pdf",
        data: {
          subject: form.subject,
          body: form.body,
          urls: form.urls.split("\n").filter(Boolean),
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "phishguard_report.pdf";
      a.click();
    } catch (e) {
      alert("Could not generate report.");
    } finally {
      setReportLoading(false);
    }
  };

  const riskStyle = {
    high: {
      border: "border-red-500/50",
      text: "text-red-400",
      bg: "bg-red-900/10",
      bar: "bg-red-500",
      icon: AlertTriangle,
    },
    medium: {
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      bg: "bg-yellow-900/10",
      bar: "bg-yellow-500",
      icon: AlertTriangle,
    },
    low: {
      border: "border-green-500/50",
      text: "text-green-400",
      bg: "bg-green-900/10",
      bar: "bg-green-500",
      icon: CheckCircle,
    },
  };

  const rs = result ? riskStyle[result.risk_level] : null;
  const RiskIcon = rs?.icon;

  const inp =
    "w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 " +
    "text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800 " +
    "outline-none text-sm resize-none transition-all";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-2">
          <Shield size={18} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Email Analyzer</h1>
          <p className="text-xs text-gray-500">
            Paste email content below to detect phishing threats
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
        <input
          placeholder="Email subject..."
          value={form.subject}
          className={inp}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          rows={8}
          placeholder="Paste the full email body here..."
          value={form.body}
          className={inp}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        {/* URL toggle */}
        <button
          onClick={() => setShowUrls(!showUrls)}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Link size={13} />
          Add URLs to analyze
          {showUrls ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showUrls && (
          <textarea
            rows={3}
            placeholder="Paste URLs — one per line..."
            value={form.urls}
            className={inp}
            onChange={(e) => setForm({ ...form, urls: e.target.value })}
          />
        )}

        <button
          onClick={analyze}
          disabled={loading || (!form.subject && !form.body)}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white
                     py-3 rounded-xl font-medium transition-all disabled:opacity-40
                     flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield size={15} />
              Analyze Email
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-5">
          {/* Verdict banner */}
          <div className={`border rounded-xl p-4 ${rs.border} ${rs.bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RiskIcon size={22} className={rs.text} />
                <span className={`text-xl font-bold capitalize ${rs.text}`}>
                  {result.prediction}
                </span>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${rs.text}`}>
                  {result.confidence}%
                </p>
                <p className="text-xs text-gray-500">confidence</p>
              </div>
            </div>

            {/* Risk bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Risk score</span>
                <span>{result.risk_score}/100</span>
              </div>
              <div className="bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${rs.bar}`}
                  style={{ width: result.risk_score + "%" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
              <span>
                Risk:{" "}
                <span className={`font-medium ${rs.text}`}>
                  {result.risk_level.toUpperCase()}
                </span>
              </span>
              <span>•</span>
              <span>
                Model:{" "}
                <span className="font-mono text-gray-400">{result.model_source}</span>
              </span>
            </div>
          </div>

          {/* Flagged keywords */}
          {result.flagged_keywords?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Flagged keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {result.flagged_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="bg-red-900/20 text-red-400 border border-red-800/50
                               px-2.5 py-1 rounded-lg text-xs font-mono"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious URLs */}
          {result.suspicious_urls?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                Suspicious URLs
              </p>
              <div className="space-y-2">
                {result.suspicious_urls.map((u, i) => (
                  <div
                    key={i}
                    className="bg-red-900/10 border border-red-900/40 rounded-xl p-3"
                  >
                    <p className="text-red-400 text-xs font-mono truncate">{u.url}</p>
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-600">
                      <span>Score: {u.score}</span>
                      <span>HTTPS: {u.features.is_https ? "✓" : "✗"}</span>
                      <span>IP: {u.features.is_ip_address ? "yes" : "no"}</span>
                      <span>
                        Shortener: {u.features.is_shortener ? "yes" : "no"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback section */}
          {!feedback ? (
            <div className="border border-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-200 font-medium mb-1">
                Was this prediction correct?
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Your feedback trains the model instantly via online learning.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    submitFeedback(result.prediction === "phishing" ? 1 : 0)
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                             bg-green-900/20 border border-green-700/50 text-green-400
                             rounded-xl text-sm hover:bg-green-900/40 transition-all"
                >
                  <ThumbsUp size={14} /> Yes, correct
                </button>
                <button
                  onClick={() =>
                    submitFeedback(result.prediction === "phishing" ? 0 : 1)
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                             bg-red-900/20 border border-red-700/50 text-red-400
                             rounded-xl text-sm hover:bg-red-900/40 transition-all"
                >
                  <ThumbsDown size={14} /> No, it's wrong
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-xl p-4 flex items-start gap-3 ${
                feedback === "confirmed"
                  ? "bg-green-900/20 border border-green-800/50"
                  : "bg-blue-900/20 border border-blue-800/50"
              }`}
            >
              {feedback === "confirmed" ? (
                <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <RefreshCw size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-gray-300">{fbMsg}</p>
            </div>
          )}

          {/* Download report */}
          <button
            onClick={downloadReport}
            disabled={reportLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5
                       border border-gray-700 text-gray-400 hover:text-gray-200
                       hover:border-gray-600 rounded-xl text-sm transition-all
                       disabled:opacity-50"
          >
            {reportLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
}
