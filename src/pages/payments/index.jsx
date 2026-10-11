import { useMemo, useState } from "react";
import { FiArrowUpRight, FiCheckCircle, FiDownload, FiPauseCircle, FiPlayCircle, FiSearch, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";
import { downloadCsv, formatCurrency, formatDate } from "../../utils/format";
import styles from "./styles.module.css";

const paymentViews = [
  { key: "ready", label: "Ready to issue" },
  { key: "hold", label: "On hold" },
  { key: "issued", label: "Issued" },
  { key: "all", label: "All records" },
];

const getSettlement = (claim) => Math.max(claim.estimate - claim.deductible, 0);

const PaymentsPage = ({ claims, requestPaymentAction, showToast }) => {
  const [activeView, setActiveView] = useState("ready");
  const [search, setSearch] = useState("");

  const paymentClaims = useMemo(
    () => claims.filter((claim) => ["Approved", "Paid"].includes(claim.status)),
    [claims],
  );

  const counts = useMemo(
    () => ({
      ready: paymentClaims.filter((claim) => claim.paymentStatus === "Ready to issue").length,
      hold: paymentClaims.filter((claim) => claim.paymentStatus === "On hold").length,
      issued: paymentClaims.filter((claim) => claim.paymentStatus === "Issued").length,
      all: paymentClaims.length,
    }),
    [paymentClaims],
  );

  const totals = useMemo(
    () => ({
      ready: paymentClaims.filter((claim) => claim.paymentStatus === "Ready to issue").reduce((sum, claim) => sum + getSettlement(claim), 0),
      hold: paymentClaims.filter((claim) => claim.paymentStatus === "On hold").reduce((sum, claim) => sum + getSettlement(claim), 0),
      issued: paymentClaims.filter((claim) => claim.paymentStatus === "Issued").reduce((sum, claim) => sum + getSettlement(claim), 0),
    }),
    [paymentClaims],
  );

  const visibleClaims = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return paymentClaims
      .filter((claim) => {
        const matchesView = activeView === "all"
          || (activeView === "ready" && claim.paymentStatus === "Ready to issue")
          || (activeView === "hold" && claim.paymentStatus === "On hold")
          || (activeView === "issued" && claim.paymentStatus === "Issued");
        const matchesSearch = [claim.id, claim.claimant, claim.policy, claim.adjuster]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
        return matchesView && matchesSearch;
      })
      .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));
  }, [activeView, paymentClaims, search]);

  const exportPayments = () => {
    downloadCsv("proof-payment-register.csv", visibleClaims.map((claim) => ({
      ...claim,
      amount: getSettlement(claim),
    })), [
      { label: "Claim ID", key: "id" },
      { label: "Policyholder", key: "claimant" },
      { label: "Policy", key: "policy" },
      { label: "Adjuster", key: "adjuster" },
      { label: "Estimated settlement", key: "amount" },
      { label: "Payment status", key: "paymentStatus" },
    ]);
    showToast("Payment register exported", `${visibleClaims.length} payment records downloaded as CSV.`);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveView("all");
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.breadcrumb}>Operations <span>/</span> Payments</div>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.context}>Settlement register</p>
            <h1>Payment desk</h1>
            <p className={styles.intro}>Review approved settlements and record payment status for each claim.</p>
          </div>
          <button className={styles.exportButton} disabled={!visibleClaims.length} onClick={exportPayments} type="button">
            <FiDownload aria-hidden="true" /> Export register
          </button>
        </div>

        <div className={styles.balanceStrip}>
          <div className={styles.balanceIntro}>
            <span className={styles.balanceIcon}><FiSend aria-hidden="true" /></span>
            <div><span>PAYMENT WORKLIST</span><strong>{counts.ready + counts.hold} settlements</strong></div>
          </div>
          <div className={styles.balanceMetric}><span>Ready to issue</span><strong>{formatCurrency(totals.ready)}</strong><small>{counts.ready} {counts.ready === 1 ? "record" : "records"}</small></div>
          <div className={styles.balanceMetric}><span>On hold</span><strong>{formatCurrency(totals.hold)}</strong><small>{counts.hold} {counts.hold === 1 ? "record" : "records"}</small></div>
          <div className={styles.balanceMetric}><span>Issued</span><strong>{formatCurrency(totals.issued)}</strong><small>{counts.issued} {counts.issued === 1 ? "record" : "records"}</small></div>
        </div>

        <section className={styles.ledger}>
          <div className={styles.ledgerHeading}>
            <div><h2>Settlement ledger</h2><p>{visibleClaims.length} payment {visibleClaims.length === 1 ? "record" : "records"}</p></div>
            <label className={styles.search}>
              <FiSearch aria-hidden="true" />
              <input aria-label="Search payments" onChange={(event) => setSearch(event.target.value)} placeholder="Search claimant or claim ID" value={search} />
            </label>
          </div>
          <div className={styles.filters} role="group" aria-label="Payment status filters">
            {paymentViews.map((view) => (
              <button aria-pressed={activeView === view.key} className={`${styles.filterButton} ${activeView === view.key ? styles.active : ""}`} key={view.key} onClick={() => setActiveView(view.key)} type="button">
                {view.label}<span>{counts[view.key]}</span>
              </button>
            ))}
          </div>

          {visibleClaims.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th scope="col">Claim</th><th scope="col">Settlement</th><th scope="col">Approved on</th><th scope="col">Payment status</th><th scope="col">Action</th></tr></thead>
                <tbody>
                  {visibleClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <Link className={styles.claimLink} to={`/claims/${claim.id}`}>
                          <span>{claim.id}</span><strong>{claim.claimant}</strong><small>{claim.policy} · {claim.adjuster}</small>
                        </Link>
                      </td>
                      <td className={styles.amount}>{formatCurrency(getSettlement(claim))}</td>
                      <td className={styles.date}>{formatDate(claim.updatedAt.slice(0, 10))}</td>
                      <td><span className={`${styles.paymentStatus} ${styles[claim.paymentStatus.toLowerCase().replaceAll(" ", "-")]}`}>
                        {claim.paymentStatus === "Issued" ? <FiCheckCircle aria-hidden="true" /> : claim.paymentStatus === "On hold" ? <FiPauseCircle aria-hidden="true" /> : <FiSend aria-hidden="true" />}
                        {claim.paymentStatus}
                      </span></td>
                      <td>
                        <div className={styles.rowActions}>
                          {claim.paymentStatus === "Ready to issue" && <>
                            <button className={styles.holdButton} onClick={() => requestPaymentAction(claim, "hold")} type="button"><FiPauseCircle aria-hidden="true" /> Hold</button>
                            <button className={styles.issueButton} onClick={() => requestPaymentAction(claim, "issue")} type="button"><FiSend aria-hidden="true" /> Issue</button>
                          </>}
                          {claim.paymentStatus === "On hold" && <button className={styles.releaseButton} onClick={() => requestPaymentAction(claim, "release")} type="button"><FiPlayCircle aria-hidden="true" /> Release hold</button>}
                          {claim.paymentStatus === "Issued" && <span className={styles.completed}><FiCheckCircle aria-hidden="true" /> Recorded</span>}
                          <Link aria-label={`Open ${claim.id}`} className={styles.openLink} to={`/claims/${claim.id}`}><FiArrowUpRight aria-hidden="true" /></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FiSearch aria-hidden="true" />
              <h3>No payment records found</h3>
              <p>Approved claims appear here. Try another search or view all payment records.</p>
              <button onClick={clearFilters} type="button">View all records</button>
            </div>
          )}

          <div className={styles.disclaimer}><FiCheckCircle aria-hidden="true" /><span>Payment actions update this demo register only. No funds are sent or bank details stored.</span></div>
        </section>
      </div>
    </section>
  );
};

export default PaymentsPage;
