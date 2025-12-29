"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ReportRenderer = ({ report }: { report: any }) => {
  if (!report) return null;

  // Handle structured JSON report
  if (typeof report === 'object') {
    return (
      <div className="structured-report">
        {report.findings && report.findings.length > 0 && (
          <div className="report-section">
            <h4 className="report-section-title"><span>🔍 Investigation Findings</span></h4>
            <div className="findings-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {report.findings.map((finding: string, i: number) => (
                <div key={i} className="glass-card" style={{ padding: '1rem', borderLeft: '3px solid var(--primary)', background: 'rgba(0, 210, 255, 0.03)' }}>
                  {finding}
                </div>
              ))}
            </div>
          </div>
        )}

        {report.suggested_next_steps && report.suggested_next_steps.length > 0 && (
          <div className="report-section" style={{ marginTop: '2rem' }}>
            <h4 className="report-section-title"><span>🚀 Suggested Next Steps</span></h4>
            <div className="steps-container">
              {report.suggested_next_steps.map((step: string, i: number) => (
                <div key={i} className="step-card">
                  <div className="step-num">{i + 1}</div>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.references && report.references.length > 0 && (
          <div className="report-section" style={{ marginTop: '2rem', opacity: 0.7 }}>
            <h4 className="report-section-title" style={{ fontSize: '1rem' }}><span>📚 References</span></h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem' }}>
              {report.references.map((ref: string, i: number) => (
                <li key={i} style={{ marginBottom: '0.4rem' }}>• {ref}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fallback for legacy string format (keep minimal cleanup)
  return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{report.replace(/\*\*/g, '')}</div>;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Simulated Threat Intel Feed
  const [threatIntel] = useState([
    { id: 1, type: 'CRITICAL', msg: 'New brute force pattern detected: 192.168.1.105' },
    { id: 2, type: 'INFO', msg: 'Blacklist updated: 4,200 known botnet nodes' },
    { id: 3, type: 'WARNING', msg: 'Anomalous traffic detected on Port 22' },
  ]);

  const [showDevConsole, setShowDevConsole] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [devLogs, setDevLogs] = useState<string[]>([]);

  const addDevLog = (msg: string) => {
    setDevLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const fetchHistory = async () => {
    addDevLog("Fetching investigation history...");
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reverse());
        addDevLog(`Successfully loaded ${data.length} history items.`);
      }
    } catch (e) {
      addDevLog("ERROR: History fetch failed.");
      console.error('History fetch failed', e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    addDevLog("Verifying session...");
    fetch('http://localhost:8000/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then(data => {
        setUser(data);
        addDevLog(`Session verified for user: ${data.username} (${data.role})`);
        fetchHistory();
      })
      .catch(() => {
        addDevLog("Session verification failed. Redirecting to login.");
        localStorage.removeItem('token');
        router.push('/login');
      });
  }, [router]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    addDevLog(`Initiating investigation for query: "${query}"`);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        addDevLog(`ERROR: Investigation failed - ${errorData.detail}`);
        throw new Error(errorData.detail || 'Failed to investigate');
      }
      const data = await response.json();
      setResults(data.report ? [data] : []);
      addDevLog(`Investigation complete. Classification: ${data.classification}`);
      fetchHistory(); // Refresh history after search
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setError(err.message || 'An unexpected error occurred during investigation.');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    addDevLog("Starting document ingestion process...");
    try {
      const response = await fetch('http://localhost:8000/ingest', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        addDevLog(`ERROR: Ingestion failed - ${errorData.detail}`);
        throw new Error(errorData.detail || 'Ingestion failed');
      }
      addDevLog("Ingestion successful. Vector store updated with new playbook data.");
      alert('Documents ingested successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    addDevLog("Terminating session...");
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) return <div style={{ background: 'var(--bg-color)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>INITIALIZING TERMINAL...</div>;

  return (
    <div className="dashboard-container" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', position: 'relative' }}>
      <aside className="sidebar" style={{ borderRight: '1px solid var(--border-color)', height: '100vh', padding: '2rem' }}>
        <h2 className="glow-text" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🛡️ S.I.I.</h2>

        {/* User Info Section */}
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', borderLeft: `3px solid ${user.role === 'admin' ? 'var(--primary)' : 'var(--success)'}` }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Operator</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.username}</div>
          <div style={{ fontSize: '0.7rem', color: user.role === 'admin' ? 'var(--primary)' : 'var(--success)', marginTop: '0.2rem' }}>
            [{user.role.toUpperCase()} LEVEL ACCESS]
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={() => { }}
            className="glass-card"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              background: 'rgba(0, 210, 255, 0.1)',
              borderColor: 'var(--primary)'
            }}
          >
            📊 Dashboard
          </button>

          <button
            onClick={handleIngest}
            className="glass-card"
            disabled={user.role !== 'admin'}
            style={{
              textAlign: 'left',
              cursor: user.role === 'admin' ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              opacity: user.role === 'admin' ? 1 : 0.5
            }}
          >
            🔄 Refresh Knowledge
          </button>

          <div style={{ margin: '1rem 0', height: '1px', background: 'var(--border-color)' }} />

          {/* Dev Tools Toggle Section */}
          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Dev Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={debugMode} onChange={(e) => setDebugMode(e.target.checked)} />
                Debug Mode
              </label>
              <button
                onClick={() => setShowDevConsole(!showDevConsole)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                {showDevConsole ? 'Hide' : 'Show'} System Console
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="glass-card"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              marginTop: '1rem',
              color: 'var(--error)'
            }}
          >
            🔑 Terminate Session
          </button>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <div className="glass-card pulse" style={{ fontSize: '0.85rem', color: 'var(--success)', borderLeft: '3px solid var(--success)' }}>
            System Status: Nominal
          </div>
        </div>
      </aside>

      <main className="main-content" style={{ padding: '3rem', overflowY: 'auto', height: '100vh', paddingBottom: showDevConsole ? '300px' : '3rem' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 className="glow-text" style={{ fontSize: '2.8rem', fontWeight: 700 }}>Secure Incident Investigator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Agentic RAG Cybersecurity Assistant</p>
        </header>

        {/* Trend Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="trend-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ACTIVE INVESTIGATIONS</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{results.length > 0 ? '1' : '0'}</span>
          </div>
          <div className="trend-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>KNOWLEDGE SEGMENTS</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>2,626</span>
          </div>
          <div className="trend-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>THREAT LEVEL</span>
            <span style={{ fontSize: '1.8rem', color: 'var(--error)', fontWeight: 700 }}>ELEVATED</span>
          </div>
        </div>

        <section className="glass-card" style={{ marginBottom: '3rem', padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.2rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query playbooks, logs, or threat intel... (e.g., 'Verify ransomware response')"
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '1.2rem',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
            <button onClick={handleSearch} className="btn-primary" style={{ minWidth: '150px' }} disabled={loading}>
              {loading ? 'Analyzing...' : '🔍 Investigate'}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: '1rem', color: 'var(--error)', padding: '0.8rem', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', border: '1px solid var(--error)', fontSize: '0.9rem' }}>
              ⚠️ {error}
            </div>
          )}
        </section>

        <section className="results-grid" style={{ display: 'grid', gap: '2rem' }}>
          {results.length > 0 ? (
            results.map((res, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '2.5rem', position: 'relative', borderTop: '2px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--primary)', fontSize: '1.4rem', letterSpacing: '0.05em' }}>
                    SHIELD ANALYSIS REPORT
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span className="glass-card" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0, 210, 255, 0.1)', borderColor: 'var(--primary)', borderRadius: '20px' }}>
                      {res.classification}
                    </span>
                  </div>
                </div>
                <div className="report-content" style={{ marginTop: '1.5rem' }}>
                  <ReportRenderer report={res.report} />
                </div>
                {res.sources && res.sources.length > 0 && (
                  <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Evidence Context</h4>
                    <div style={{ display: 'flex', gap: '1.2rem', flexDirection: 'column' }}>
                      {res.sources.map((src: any, sIdx: number) => (
                        <div key={sIdx} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid var(--primary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>SOURCE_{sIdx + 1} :: VERIFIED</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Confidence: High</span>
                          </div>
                          {debugMode && (
                            <pre style={{ margin: 0, padding: '0.8rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', overflowX: 'auto' }}>
                              {src}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            !loading && <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '6rem', fontSize: '1.2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              Waiting for investigation data... <br />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter a security query to begin automated retrieval and reasoning.</span>
            </div>
          )}
        </section>

        {/* System Console Panel */}
        {showDevConsole && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: '260px',
            right: '340px',
            height: '250px',
            background: '#0a0c10',
            borderTop: '2px solid var(--primary)',
            padding: '1.5rem',
            zIndex: 100,
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--primary)', margin: 0 }}>SYSTEM CONSOLE</h4>
              <button onClick={() => setDevLogs([])} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem' }}>CLEAR LOGS</button>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {devLogs.map((log, i) => <div key={i}>{log}</div>)}
              {devLogs.length === 0 && <div style={{ opacity: 0.5 }}>- NO ACTIVE LOGS -</div>}
            </div>
          </div>
        )}
      </main>

      {/* Situational Awareness Sidebar */}
      <aside style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid var(--border-color)', padding: '2rem', height: '100vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>THREAT INTELLIGENCE</h3>
        <div style={{ marginBottom: '3rem' }}>
          {threatIntel.map(intel => (
            <div key={intel.id} className="threat-ticker">
              <div style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: '0.2rem' }}>[{intel.type}]</div>
              {intel.msg}
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>RECENT INVESTIGATIONS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {history.length > 0 ? (
            history.map((item, idx) => (
              <div key={idx} className="glass-card history-item" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => { setResults([item]); addDevLog(`Loading historical investigation: ${item.query}`); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <span style={{ color: 'var(--primary)' }}>{item.classification}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.query}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Operator: {item.user}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>
              No recent logs found.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
