import { useMemo, useState } from "react";
import { FiActivity, FiAlertCircle, FiCheckCircle, FiDownload, FiFileText, FiShield } from "react-icons/fi";
import { downloadCsv, formatCurrency } from "../../utils/format";
import { claimStatuses } from "../../data/seed";
import styles from "./styles.module.css";

const periods = [
  { id: "all", label: "All time" },
  { id: "30-days", label: "Last 30 days" },
  { id: "year", label: "This year" },
];

const statusTone = (status) => status.toLowerCase().replaceAll(" ", "-");

const ReportsPage = ({ claims, showToast }) => {
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("All statuses");

  const periodClaims = useMemo(() => {
    if (period === "all") return claims;
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    if (period === "30-days") startDate.setDate(today.getDate() - 29);
    return claims.filter((claim) => {
      const reported = new Date(claim.reportedDate + "T00:00:00");
      return reported >= startDate && reported <= today;
    });
  }, [claims, period]);

  const visibleClaims = useMemo(
    () => status === "All statuses" ? periodClaims : periodClaims.filter((claim) => claim.status === status),
    [periodClaims, status],
  );

  const metrics = useMemo(() => {
    const openClaims = visibleClaims.filter((claim) => !["Paid", "Declined"].includes(claim.status));
    const completedClaims = visibleClaims.filter((claim) => ["Paid", "Declined"].includes(claim.status));
    const settlements = visibleClaims.filter((claim) => ["Approved", "Paid"].includes(claim.status));
    return {
      open: openClaims.length,
      completed: completedClaims.length,
      reserve: openClaims.reduce((total, claim) => total + claim.reserve, 0),
      settlements: settlements.reduce((total, claim) => total + Math.max(claim.estimate - claim.deductible, 0), 0),
      high: openClaims.filter((claim) => claim.severity === "High").length,
    };
  }, [visibleClaims]);

  const statusRows = useMemo(
    () => claimStatuses.map((name) => ({
      name,
      count: visibleClaims.filter((claim) => claim.status === name).length,
    })),
    [visibleClaims],
  );

  const adjusterRows = useMemo(() => {
    const grouped = visibleClaims.reduce((result, claim) => {
      result[claim.adjuster] = (result[claim.adjuster] || 0) + 1;
      return result;
    }, {});
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));
  }, [visibleClaims]);

  const maxStatusCount = Math.max(1, ...statusRows.map((row) => row.count));
  const maxAdjusterCount = Math.max(1, ...adjusterRows.map((row) => row.count));

  const exportReport = () => {
    downloadCsv("proof-claims-report.csv", visibleClaims, [
      { label: "Claim ID", key: "id" },
      { label: "Claimant", key: "claimant" },
      { label: "Policy", key: "policy" },
      { label: "Reported", key: "reportedDate" },
      { label: "Status", key: "status" },
      { label: "Severity", key: "severity" },
      { label: "Adjuster", key: "adjuster" },
      { label: "Reserve", key: "reserve" },
      { label: "Estimate", key: "estimate" },
    ]);
    showToast("Claims report exported", visibleClaims.length + " claim records downloaded as CSV.");
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.topline}>
          <div className={styles.breadcrumb}>Operations <span>/</span> Reports</div>
          <span className={styles.periodNote}><FiActivity aria-hidden="true" /> Based on current demo claim records</span>
        </div>

        <div className={styles.headingRow}>
          <div>
            <h1>Claims report</h1>
            <p>See open exposure, claim outcomes, and adjuster workload in one place.</p>
          </div>
          <button className={styles.exportButton} disabled={!visibleClaims.length} onClick={exportReport} type="button">
            <FiDownload aria-hidden="true" /> Export report
          </button>
        </div>

        <div className={styles.reportControls}>
          <label>
            <span>Reported during</span>
            <select onChange={(event) => setPeriod(event.target.value)} value={period}>
              {periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Claim status</span>
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option>All statuses</option>
              {claimStatuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <span className={styles.recordCount}>{visibleClaims.length} {visibleClaims.length === 1 ? "claim" : "claims"} included</span>
        </div>

        {visibleClaims.length ? (
          <>
            <div className={styles.metrics}>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><FiFileText aria-hidden="true" /></span>
                <div><span>Open claims</span><strong>{metrics.open}</strong><small>Still in review or processing</small></div>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><FiShield aria-hidden="true" /></span>
                <div><span>Open reserve</span><strong>{formatCurrency(metrics.reserve)}</strong><small>Across included claim files</small></div>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><FiCheckCircle aria-hidden="true" /></span>
                <div><span>Settlement value</span><strong>{formatCurrency(metrics.settlements)}</strong><small>Approved and issued estimates</small></div>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricIcon}><FiAlertCircle aria-hidden="true" /></span>
                <div><span>High severity</span><strong>{metrics.high}</strong><small>Open claims needing attention</small></div>
              </article>
            </div>

            <div className={styles.reportGrid}>
              <section className={styles.reportPanel}>
                <div className={styles.panelHeading}>
                  <div><h2>Claims by status</h2><p>Current distribution of included claims</p></div>
                  <span className={styles.panelTotal}>{visibleClaims.length} total</span>
                </div>
                <div className={styles.statusChart}>
                  {statusRows.map((row) => (
                    <button
                      aria-label={"Filter report to " + row.name + ", " + row.count + (row.count === 1 ? " claim" : " claims")}
                      className={styles.statusRow}
                      key={row.name}
                      onClick={() => setStatus(row.name)}
                      type="button"
                    >
                      <span className={styles.statusName}><i className={styles[statusTone(row.name)]} />{row.name}</span>
                      <span className={styles.barTrack}><span className={styles.bar} style={{ width: (row.count / maxStatusCount * 100) + "%" }} /></span>
                      <strong>{row.count}</strong>
                    </button>
                  ))}
                </div>
                {status !== "All statuses" && <button className={styles.resetFilter} onClick={() => setStatus("All statuses")} type="button">Clear status filter</button>}
              </section>

              <section className={styles.reportPanel}>
                <div className={styles.panelHeading}>
                  <div><h2>Adjuster workload</h2><p>Claims assigned to each adjuster</p></div>
                  <span className={styles.panelTotal}>{adjusterRows.length} adjusters</span>
                </div>
                {adjusterRows.length ? (
                  <div className={styles.adjusterList}>
                    {adjusterRows.map((row, index) => (
                      <div className={styles.adjusterRow} key={row.name}>
                        <span className={styles.adjusterRank}>{String(index + 1).padStart(2, "0")}</span>
                        <span className={styles.adjusterName}>{row.name}</span>
                        <span className={styles.adjusterTrack}><span style={{ width: (row.count / maxAdjusterCount * 100) + "%" }} /></span>
                        <strong>{row.count}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className={styles.panelEmpty}>No adjuster assignments in this view.</p>}
                <div className={styles.panelFootnote}>Counts reflect the selected period and status filter.</div>
              </section>
            </div>

            <section className={styles.outcomeStrip}>
              <div><strong>{metrics.completed}</strong><span>closed claims</span></div>
              <p>Closed includes paid and declined files. Settlement values are estimates from claim records, not accounting entries.</p>
            </section>
          </>
        ) : (
          <div className={styles.emptyState}>
            <FiFileText aria-hidden="true" />
            <h2>No claims in this report</h2>
            <p>Choose a different period or status to see available claim activity.</p>
            <button onClick={() => { setPeriod("all"); setStatus("All statuses"); }} type="button">Reset report filters</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReportsPage;
