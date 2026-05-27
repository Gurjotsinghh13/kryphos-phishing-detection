// frontend/src/components/Analyzer.jsx

import { useState } from "react";
import api from "../api";

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

export default function Analyzer() {

  const [form, setForm] = useState({
    subject: "",
    body: "",
    urls: "",
  });

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

      const { data } = await api.post(

        "/api/analyze",

        {
          subject: form.subject,
          body: form.body,
          urls: form.urls
            .split("\n")
            .filter(Boolean),
        },

        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setResult(data);

    } catch (e) {

      alert(
        e.response?.data?.detail ||
        "Analysis failed. Is backend running?"
      );

    } finally {

      setLoading(false);
    }
  };

  const submitFeedback = async (trueLabel) => {

    if (!result?.scan_id) return;

    try {

      const { data } = await api.post(

        "/api/feedback",

        {
          scan_id: result.scan_id,
          true_label: trueLabel,
        },

        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const predicted =
        result.prediction === "phishing"
          ? 1
          : 0;

      setFeedback(
        trueLabel === predicted
          ? "confirmed"
          : "corrected"
      );

      setFbMsg(data.message);

    } catch {

      setFbMsg(
        "Could not submit feedback."
      );
    }
  };

  const downloadReport = async () => {

    setReportLoading(true);

    try {

      const response = await api.post(

        "/api/report/pdf",

        {
          subject: form.subject,
          body: form.body,
          urls: form.urls
            .split("\n")
            .filter(Boolean),
        },

        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },

          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const a = document.createElement("a");

      a.href = url;

      a.download = "kryphos_report.pdf";

      a.click();

    } catch {

      alert(
        "Could not generate report."
      );

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

  const rs = result
    ? riskStyle[result.risk_level]
    : null;

  const RiskIcon = rs?.icon;

  const inp =
    "w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 " +
    "text-gray-100 placeholder-gray-500 focus:border-blue-500 " +
    "focus:bg-gray-800 outline-none text-sm resize-none transition-all";

  return (

    <div className="max-w-2xl mx-auto p-6 space-y-5">

      {/* Header */}

      <div className="flex items-center gap-3 mb-2">

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-2">

          <Shield
            size={18}
            className="text-blue-400"
          />

        </div>

        <div>

          <h1 className="text-lg font-semibold text-white">
            Email Analyzer
          </h1>

          <p className="text-xs text-gray-500">
            Paste email content below to detect phishing threats
          </p>

        </div>

      </div>

      {/* Form */}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">

        <input
          placeholder="Email subject..."
          value={form.subject}
          className={inp}
          onChange={(e) =>
            setForm({
              ...form,
              subject: e.target.value,
            })
          }
        />

        <textarea
          rows={8}
          placeholder="Paste the full email body here..."
          value={form.body}
          className={inp}
          onChange={(e) =>
            setForm({
              ...form,
              body: e.target.value,
            })
          }
        />

        <button
          onClick={() =>
            setShowUrls(!showUrls)
          }
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >

          <Link size={13} />

          Add URLs to analyze

          {showUrls
            ? <ChevronUp size={13} />
            : <ChevronDown size={13} />
          }

        </button>

        {showUrls && (

          <textarea
            rows={3}
            placeholder="Paste URLs — one per line..."
            value={form.urls}
            className={inp}
            onChange={(e) =>
              setForm({
                ...form,
                urls: e.target.value,
              })
            }
          />
        )}

        <button
          onClick={analyze}
          disabled={
            loading ||
            (!form.subject && !form.body)
          }
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99]
                     text-white py-3 rounded-xl font-medium transition-all
                     disabled:opacity-40 flex items-center justify-center
                     gap-2 text-sm"
        >

          {loading ? (

            <>
              <RefreshCw
                size={15}
                className="animate-spin"
              />

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

    </div>
  );
}