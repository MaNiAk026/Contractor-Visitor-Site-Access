"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ScanLine, Wifi, WifiOff, XCircle } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import type { GateDecision } from "@/lib/api/types";

/**
 * Renders the touch-oriented gate operator workflow.
 *
 * @returns A visually distinct gate decision and check-in/check-out interface.
 */
export default function GatePage() {
  const [token, setToken] = useState("qr_demo_7f4a91");
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const updateConnectivity = () => setIsOnline(navigator.onLine);

    updateConnectivity();
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    return () => {
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

  const scan = async () => {
    setDecision(null);
    setError(undefined);
    if (!isOnline) {
      setError("The browser is offline. Access verification is unavailable.");
      return;
    }
    setIsScanning(true);

    try {
      setDecision(await apiClient.evaluateGate(token));
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "The pass could not be verified.");
    } finally {
      setIsScanning(false);
    }
  };

  const recordEvent = async (eventType: "entry" | "exit") => {
    if (!decision || !isOnline) return;
    setError(undefined);
    setIsRecording(true);
    try {
      setDecision(await apiClient.recordGateEvent(decision, eventType));
    } catch (eventError) {
      setDecision(null);
      setError(eventError instanceof Error ? eventError.message : "The access event could not be recorded.");
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <main className="gate-page">
      <header className="gate-header">
        <Link className="gate-back" href="/dashboard">
          <ArrowLeft size={21} aria-hidden="true" /> Operations
        </Link>
        <div className="gate-site">
          <span className="online-dot" />
          Vlaardingen · Gate 2
        </div>
        <div className={`connection-status ${isOnline ? "" : "connection-offline"}`} role="status">
          {isOnline ? <Wifi size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
          {isOnline ? "Browser online" : "Offline — verification unavailable"}
        </div>
      </header>

      <section className="gate-main" aria-labelledby="gate-title">
        <div className="gate-scan-card">
          <p className="eyebrow">Gate verification</p>
          <h1 id="gate-title">Scan access pass</h1>
          <p className="muted">Scan a QR pass or enter its opaque fallback identifier.</p>

          <label className="gate-token-label" htmlFor="gate-token">
            Access pass
            <input
              id="gate-token"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setDecision(null);
                setError(undefined);
              }}
              placeholder="Scan or type pass reference"
              autoComplete="off"
            />
          </label>

          <button className="gate-scan-button" type="button" onClick={scan} disabled={isScanning || isRecording || !token || !isOnline}>
            <ScanLine size={28} aria-hidden="true" />
            {isScanning ? "Verifying pass…" : "Verify access"}
          </button>
          {error && <p className="gate-error" role="alert"><WifiOff size={18} /> {error}</p>}
          <p className="gate-help">Fallback lookup is available through an opaque token or authorized visit reference.</p>
        </div>

        {decision ? (
          <section className={`decision-card ${decision.decision === "grant" ? "decision-grant" : "decision-deny"}`} aria-live="polite">
            <div className="decision-heading">
              {decision.decision === "grant" ? <CheckCircle2 size={44} aria-hidden="true" /> : <XCircle size={44} aria-hidden="true" />}
              <div>
                <p className="eyebrow">Gate decision</p>
                <h2>{decision.decision === "grant" ? "Access granted" : "Access denied"}</h2>
              </div>
            </div>

            <div className="gate-person">
              <div className="avatar avatar-large">{decision.person.initials}</div>
              <div>
                <strong>{decision.person.name}</strong>
                <span>{decision.person.company} · {decision.person.population}</span>
              </div>
            </div>

            <dl className="gate-facts">
              <div><dt>Visit</dt><dd>{decision.visit.purpose}</dd></div>
              <div><dt>Pass status</dt><dd>{decision.tokenStatus}</dd></div>
              <div><dt>Identity check</dt><dd>{decision.identityStatus}</dd></div>
            </dl>

            <div className="gate-reasons">
              <strong>{decision.decision === "grant" ? "Verified checks" : "Decision reasons"}</strong>
              <ul>
                {decision.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>

            {decision.decision === "grant" && (
              <div className="gate-actions">
                <button className="button gate-entry" type="button" disabled={isRecording || !isOnline} onClick={() => recordEvent("entry")}>
                  {isRecording ? "Recording event…" : "Record entry"}
                </button>
                <button className="button button-secondary" type="button" disabled={isRecording || !isOnline} onClick={() => recordEvent("exit")}>
                  Record exit
                </button>
              </div>
            )}
            {decision.recordedEvent && <p className="event-recorded">✓ {decision.recordedEvent} recorded in the gate and audit logs.</p>}
          </section>
        ) : (
          <section className="gate-empty" aria-live="polite">
            <ScanLine size={34} aria-hidden="true" />
            <h2>Ready for the next arrival</h2>
            <p>Every decision is evaluated by the access service and recorded with its evidence trail.</p>
          </section>
        )}
      </section>
    </main>
  );
}
