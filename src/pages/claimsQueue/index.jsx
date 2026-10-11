import { useMemo, useState } from "react";
import { FiArrowDown, FiArrowUpRight, FiDownload, FiSearch, FiSliders } from "react-icons/fi";
import { Link } from "react-router-dom";
import { downloadCsv, formatCompactDate, formatCurrency } from "../../utils/format";
import styles from "./styles.module.css";

const queueViews = [
  { key: "all", label: "All files" },
  { key: "active", label: "Active" },
  { key: "attention", label: "Needs attention" },
  { key: "closed", label: "Closed" },
];

const getRelativeUpdate = (date) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const ClaimsQueuePage = ({ claims, totals, showToast }) => {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [severityFilter, setSeverityFilter] = useState("All severities");
  const [sortBy, setSortBy] = useState("updated");

  const viewCounts = useMemo(
    () => ({
      all: claims.length,
      active: claims.filter((claim) => !["Paid", "Declined"].includes(claim.status)).length,
      attention: claims.filter((claim) => ["Missing documents", "Ready to review"].includes(claim.status)).length,
      closed: claims.filter((claim) => ["Paid", "Declined"].includes(claim.status)).length,
    }),
    [claims],
  );

  const visibleClaims = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = claims.filter((claim) => {
      const matchesView =
        activeView === "all"
        || (activeView === "active" && !["Paid", "Declined"].includes(claim.status))
        || (activeView === "attention" && ["Missing documents", "Ready to review"].includes(claim.status))
        || (activeView === "closed" && ["Paid", "Declined"].includes(claim.status));
      const matchesStatus = statusFilter === "All statuses" || claim.status === statusFilter;
      const matchesSeverity = severityFilter === "All severities" || claim.severity === severityFilter;
      const searchText = [claim.id, claim.claimant, claim.policy, claim.vehicle, claim.incident, claim.adjuster]
        .join(" ")
        .toLowerCase();
      return matchesView && matchesStatus && matchesSeverity && searchText.includes(normalizedSearch);
    });

    return filtered.sort((first, second) => {
      if (sortBy === "reserve") return second.reserve - first.reserve;
      if (sortBy === "oldest") return new Date(first.incidentDate) - new Date(second.incidentDate);
      return new Date(second.updatedAt) - new Date(first.updatedAt);
    });
  }, [activeView, claims, search, severityFilter, sortBy, statusFilter]);

  const exportQueue = () => {
    const columns = [
      { label: "Claim ID", key: "id" },
      { label: "Policyholder", key: "claimant" },
      { label: "Policy", key: "policy" },
      { label: "Incident", key: "incident" },
      { label: "Incident date", key: "incidentDate" },
      { label: "Adjuster", key: "adjuster" },
      { label: "Severity", key: "severity" },
      { label: "Status", key: "status" },
      { label: "Reserve", key: "reserve" },
    ];
    downloadCsv("proof-claims-queue.csv", visibleClaims, columns);
    showToast("Queue exported", `${visibleClaims.length} claim files downloaded as CSV.`);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveView("all");
    setStatusFilter("All statuses");
    setSeverityFilter("All severities");
    setSortBy("updated");
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.breadcrumb}>Claims <span>/</span> Queue</div>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.dateLine}>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p>
            <h1>Claims queue</h1>
            <p className={styles.intro}>Work the next file, clear the open items, and keep every decision moving.</p>
          </div>
          <button className={styles.exportButton} disabled={!visibleClaims.length} onClick={exportQueue} type="button">
            <FiDownload aria-hidden="true" /> Export queue
          </button>
        </div>

        <div aria-label="Claim workload summary" className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Open files</span>
            <strong>{totals.open}</strong>
            <span className={styles.summaryHint}>in progress</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Ready to review</span>
            <strong>{totals.ready}</strong>
            <span className={styles.summaryHint}>decision needed</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Missing documents</span>
            <strong>{totals.missing}</strong>
            <span className={styles.summaryHint}>follow-up needed</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Open reserve</span>
            <strong>{formatCurrency(totals.reserve)}</strong>
            <span className={styles.summaryHint}>across all files</span>
          </div>
        </div>

        <div className={styles.queuePanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>File docket</h2>
              <p>{visibleClaims.length} of {claims.length} claim files</p>
            </div>
            <div aria-label="Queue views" className={styles.viewTabs} role="group">
              {queueViews.map((view) => (
                <button
                  aria-pressed={activeView === view.key}
                  className={`${styles.viewTab} ${activeView === view.key ? styles.selected : ""}`}
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  type="button"
                >
                  {view.label}<span>{viewCounts[view.key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filters}>
            <label className={styles.searchBox}>
              <FiSearch aria-hidden="true" />
              <input aria-label="Search claims" onChange={(event) => setSearch(event.target.value)} placeholder="Claim, policyholder, or vehicle" value={search} />
            </label>
            <div className={styles.filterGroup}>
              <FiSliders aria-hidden="true" />
              <label>
                <span>Status</span>
                <select aria-label="Filter by status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                  <option>All statuses</option>
                  {["New", "Investigating", "Missing documents", "Ready to review", "Approved", "Declined", "Paid"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span>Severity</span>
                <select aria-label="Filter by severity" onChange={(event) => setSeverityFilter(event.target.value)} value={severityFilter}>
                  <option>All severities</option>
                  {["High", "Medium", "Low"].map((severity) => <option key={severity}>{severity}</option>)}
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select aria-label="Sort claims" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
                  <option value="updated">Recently updated</option>
                  <option value="oldest">Oldest incident</option>
                  <option value="reserve">Highest reserve</option>
                </select>
              </label>
            </div>
          </div>

          {visibleClaims.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Claim file</th>
                    <th scope="col">Incident</th>
                    <th scope="col">Adjuster</th>
                    <th scope="col">Reserve</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated</th>
                    <th scope="col"><span className={styles.srOnly}>Open file</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <Link className={styles.claimLink} to={`/claims/${claim.id}`}>
                          <span className={styles.claimId}>{claim.id}</span>
                          <strong>{claim.claimant}</strong>
                          <span>{claim.policy} · {claim.vehicle}</span>
                        </Link>
                      </td>
                      <td>
                        <span className={styles.cellStrong}>{claim.incident}</span>
                        <span className={styles.cellSub}>{formatCompactDate(claim.incidentDate)} · {claim.location}</span>
                      </td>
                      <td>{claim.adjuster}</td>
                      <td className={styles.money}>{formatCurrency(claim.reserve)}</td>
                      <td><span className={`${styles.severity} ${styles[claim.severity.toLowerCase()]}`}>{claim.severity}</span></td>
                      <td><span className={`${styles.status} ${styles[claim.status.toLowerCase().replaceAll(" ", "-")]}`}>{claim.status}</span></td>
                      <td className={styles.updated}>{getRelativeUpdate(claim.updatedAt)}</td>
                      <td>
                        <Link aria-label={`Open file ${claim.id}`} className={styles.openLink} to={`/claims/${claim.id}`}>
                          <FiArrowUpRight aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FiSearch aria-hidden="true" />
              <h3>No claim files found</h3>
              <p>Try a different search or clear the filters to see the full docket.</p>
              <button onClick={clearFilters} type="button">Clear filters</button>
            </div>
          )}

          <div className={styles.panelFooter}>
            <span><FiArrowDown aria-hidden="true" /> Reserve values are estimates until settlement approval.</span>
            <Link to="/reports">View claims report <FiArrowUpRight aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClaimsQueuePage;
