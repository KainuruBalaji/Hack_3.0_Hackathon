"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const SAMPLE_INCIDENTS = [
  {
    title: "502 Bad Gateway \u2014 Nginx Upstream Timeout",
    symptoms: "Alert: 502 Bad Gateway spike on public-facing API.",
    log: '2026-09-21 14:32:11 [error] 1234#0: *5678 upstream timed out (110: Connection timed out) while reading response header from upstream, client: 192.168.1.5, server: api.company.com, request: "GET /v1/users HTTP/1.1", upstream: "http://10.0.0.2:8080/v1/users"',
  },
  {
    title: "OOMKilled \u2014 Pod Restarts",
    symptoms: "Alert: Pod restarts in 'image-processor' deployment.",
    log: "Reason: OOMKilled. Exit Code: 137. Last State: Terminated.",
  },
  {
    title: "Redis Connection Timeout",
    symptoms: "Alert: Redis connection timeouts affecting the caching layer.",
    log: "redis.exceptions.TimeoutError: Timeout reading from socket. (ConnectTimeout)",
  },
];

type MemoryStats = {
  total_memories: number;
  memories: string[];
  mental_models: string[];
  learning_stage: string;
  learning_progress: number;
  hindsight_connected: boolean | null;
};

type IncidentHistoryItem = { content: string };

export default function Home() {
  const [errorLog, setErrorLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [recalled, setRecalled] = useState(false);
  const [symptoms, setSymptoms] = useState('Production API Error Spike');

  const [rootCause, setRootCause] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const [memoryStats, setMemoryStats] = useState<MemoryStats>({ total_memories: 0, memories: [], mental_models: [], learning_stage: 'Novice', learning_progress: 0, hindsight_connected: null });
  const [incidentHistory, setIncidentHistory] = useState<IncidentHistoryItem[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResult, setCompareResult] = useState<{without_memory: string, with_memory: string} | null>(null);

  const fetchMemoryStats = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/memory/stats');
      if (!res.ok) throw new Error('Could not load Hindsight memory status.');
      const data = await res.json();
      setMemoryStats(data);
    } catch (e) {
      console.error(e);
      setMemoryStats((current) => ({ ...current, hindsight_connected: false }));
    }
  };

  const fetchIncidentHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/incident/history');
      if (!res.ok) throw new Error('Could not load incident history.');
      const data = await res.json();
      setIncidentHistory(data.incidents || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      await Promise.all([fetchMemoryStats(), fetchIncidentHistory()]);
    };
    void loadDashboard();
  }, []);

  const analyzeIncident = async () => {
    setLoading(true);
    setDiagnosis('');
    setRecalled(false);
    setResolveSuccess(false);
    setResolveError('');
    setCompareMode(false);
    setCompareResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/incident/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error_log: errorLog }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Incident analysis failed. Check the backend and API connections.');
      }
      setDiagnosis(data.diagnosis);
      setRecalled(data.past_incidents_recalled);
    } catch (error) {
      console.error(error);
      setDiagnosis(error instanceof Error ? error.message : 'Failed to connect to the backend agent.');
    }
    setLoading(false);
  };

  const handleCompare = async () => {
    setLoading(true);
    setCompareMode(true);
    try {
      const res = await fetch('http://localhost:8000/api/incident/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error_log: errorLog }),
      });
      const data = await res.json();
      setCompareResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const resolveIncident = async () => {
    setResolveError('');
    try {
      const res = await fetch('http://localhost:8000/api/incident/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptoms,
          error_log: errorLog,
          root_cause: rootCause,
          resolution: resolution
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update memory.');
      }
      setResolveSuccess(true);
      setRootCause('');
      setResolution('');
      fetchMemoryStats();
      fetchIncidentHistory();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setResolveError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Hindsight DevOps Agent
            </h1>
            <p className="text-slate-400 mt-2">Memory-powered incident response.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-slate-400">Agent Online</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-xl">
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                New Incident Intake
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Short Symptoms / Title</label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Paste Error Log or Stack Trace</label>
                  <textarea
                    value={errorLog}
                    onChange={(e) => setErrorLog(e.target.value)}
                    className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    placeholder="e.g. 2026-09-21 14:32:11 [error] 1234#0: *5678 upstream timed out..."
                  ></textarea>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-slate-500 self-center">Try a sample:</span>
                  {SAMPLE_INCIDENTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setErrorLog(sample.log);
                        setSymptoms(sample.symptoms);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-slate-700
                                 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400
                                 transition-all bg-slate-900/50"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={analyzeIncident}
                    disabled={loading || !errorLog}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/20"
                  >
                    {loading ? 'Analyzing with Hindsight Memory...' : 'Analyze Incident'}
                  </button>
                  <button onClick={handleCompare} disabled={loading || !errorLog}
                    className="bg-purple-600/80 hover:bg-purple-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20">
                    \u26a1 Compare
                  </button>
                </div>
              </div>
            </div>

            {compareMode && compareResult && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-5">
                  <h3 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Without Memory (Generic)
                  </h3>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-400">
                    <ReactMarkdown>{compareResult.without_memory}</ReactMarkdown>
                  </div>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5">
                  <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> With Hindsight Memory
                  </h3>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    <ReactMarkdown>{compareResult.with_memory}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Response Panel */}
            {(loading || diagnosis) && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-xl mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Agent Diagnosis
                </h2>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 animate-pulse">Recalling past incidents and consulting LLM...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="prose prose-invert max-w-none text-slate-300">
                      <ReactMarkdown>{diagnosis}</ReactMarkdown>
                    </div>
                    <div className="border-t border-slate-800 pt-6 mt-6">
                      {resolveSuccess ? (
                        <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-lg mb-4 border border-emerald-500/50">
                          ✅ Memory Updated! Hindsight has learned from this incident.
                        </div>
                      ) : null}
                      {resolveError ? (
                        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-4 border border-red-500/50">
                          ⚠️ Failed to update memory: {resolveError}
                        </div>
                      ) : null}
                      <p className="text-sm text-slate-400 mb-4">Did this resolution fix the problem?</p>
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">What was the root cause?</label>
                          <input
                            type="text"
                            value={rootCause}
                            onChange={(e) => setRootCause(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">What was the resolution?</label>
                          <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-emerald-500/50"
                          ></textarea>
                        </div>
                      </div>
                      <button
                        onClick={resolveIncident}
                        disabled={!rootCause || !resolution}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Yes, Mark Resolved (Train Agent)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side Panel: Hindsight Memory Dashboard */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
              {/* Background gradient blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Memory State
              </h3>

              <div className="flex-1 space-y-4 z-10">
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Learning Curve</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-cyan-400">
                      {memoryStats.learning_stage || 'Novice'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {memoryStats.learning_progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${memoryStats.learning_progress || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {memoryStats.total_memories} incidents learned \u00b7
                    {memoryStats.mental_models?.length || 0} mental models formed
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {memoryStats.hindsight_connected === null
                      ? 'Checking Hindsight connection...'
                      : memoryStats.hindsight_connected
                        ? 'Hindsight Connected'
                        : 'Hindsight Unavailable'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border transition-all duration-500 ${recalled ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/50'}`}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Past Incidents Recalled</p>
                  <p className={`text-sm font-medium ${recalled ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {recalled ? 'Active Memory Match Found' : 'Waiting for context...'}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Mental Models (Bank: devops-incidents)</p>
                  <p className="text-sm text-slate-300 mb-4">{memoryStats.total_memories} incidents in memory</p>
                  <div className="space-y-2">
                    {memoryStats.mental_models.length > 0 ? (
                      memoryStats.mental_models.map((model, idx) => (
                        <div key={idx} className="text-xs bg-slate-800/50 text-slate-300 p-2 rounded">
                          {model}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">
                        No mental models yet. Resolve a few incidents and Hindsight will
                        automatically form patterns about your infrastructure.
                      </div>
                    )}
                  </div>
                  {memoryStats.memories.length > 0 && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Memories</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {memoryStats.memories.map((mem, idx) => (
                          <div key={idx} className="text-xs bg-slate-900 text-slate-400 p-2 rounded border border-slate-800/50 truncate">
                            {mem.substring(0, 100)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-purple-400 mt-4 italic">Agent learns automatically upon resolution.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Incident History Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm shadow-xl mt-8">
          <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            📜 Incident History — Agent Learning Timeline
          </h2>
          {incidentHistory.length === 0 ? (
            <p className="text-slate-400 text-sm">No incidents resolved yet. The agent is waiting to learn.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {incidentHistory.map((incident, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                  <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                    {incident.content.substring(0, 200)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
