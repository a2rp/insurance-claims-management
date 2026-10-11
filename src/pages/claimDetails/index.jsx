import { useState } from "react";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInfo,
  FiMapPin,
  FiShield,
  FiTrash2,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { formatCurrency, formatDate } from "../../utils/format";
import styles from "./styles.module.css";

const workStatuses = ["New", "Investigating", "Missing documents", "Ready to review"];

const ClaimDetailsPage = ({ claims, updateClaim, addNote, requestDecision, requestClaimRemoval, showToast }) => {
  const { claimId } = useParams();
  const claim = claims.find((item) => item.id === claimId);
  const [note, setNote] = useState("");
  const [reserveDrafts, setReserveDrafts] = useState({});
  const [reserveErrors, setReserveErrors] = useState({});

  if (!claim) {
    return (
      <section className={styles.page}>
        <div className={styles.content}>
          <div className={styles.missingFile}>
            <FiFileText aria-hidden="true" />
            <h1>Claim file unavailable</h1>
            <p>This file may have been removed or its claim ID may be incorrect.</p>
            <Link className={styles.backLink} to="/"><FiArrowLeft aria-hidden="true" /> Back to claims queue</Link>
          </div>
        </div>
      </section>
    );
  }

  const reserveValue = reserveDrafts[claim.id] ?? String(claim.reserve);
  const reserveError = reserveErrors[claim.id] ?? "";

  const requiredDocuments = claim.documents.filter((document) => document.required);
  const completeDocuments = requiredDocuments.filter((document) => document.received).length;
  const missingDocuments = requiredDocuments.filter((document) => !document.received);
  const allRequiredReceived = completeDocuments === requiredDocuments.length;
  const finalStatus = ["Approved", "Declined", "Paid"].includes(claim.status);
  const settlement = Math.max(claim.estimate - claim.deductible, 0);

  const updateDocument = (documentId, received) => {
    const document = claim.documents.find((item) => item.id === documentId);
    updateClaim(
      claim.id,
      (current) => ({
        documents: current.documents.map((item) =>
          item.id === documentId ? { ...item, received } : item,
        ),
      }),
      received ? `${document.name} marked received` : `${document.name} marked missing`,
      received ? `${document.name} is recorded in the checklist.` : `${document.name} was returned to the checklist.`,
    );
  };

  const saveNote = (event) => {
    event.preventDefault();
    if (!note.trim()) {
      showToast("Add a note first", "Enter a case note before saving.", "error");
      return;
    }
    addNote(claim.id, note.trim());
    setNote("");
  };

  const saveReserve = () => {
    const amount = Number(reserveValue);
    if (!Number.isFinite(amount) || amount < 0) {
      setReserveErrors((current) => ({ ...current, [claim.id]: "Enter a reserve of zero or more." }));
      return;
    }
    setReserveErrors((current) => ({ ...current, [claim.id]: "" }));
    if (amount === claim.reserve) {
      showToast("Reserve unchanged", "The saved reserve already matches this amount.", "info");
      return;
    }
    updateClaim(claim.id, { reserve: amount }, "Reserve revised", `Reserve updated to ${formatCurrency(amount)}.`);
  };

  const flagMissingDocuments = () => {
    const list = missingDocuments.map((document) => document.name).join(", ");
    updateClaim(
      claim.id,
      { status: "Missing documents" },
      "Document follow-up flagged",
      `Follow-up noted for ${list}. This demo does not send an external message.`,
    );
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.topLine}>
          <Link className={styles.backLink} to="/">
            <FiArrowLeft aria-hidden="true" /> Claims queue
          </Link>
          <div className={styles.topBadges}>
            <span className={`${styles.severity} ${styles[claim.severity.toLowerCase()]}`}>{claim.severity} severity</span>
            <span className={styles.fileNumber}>FILE {claim.id}</span>
          </div>
        </div>

        <div className={styles.titleBlock}>
          <div>
            <p>Claim file <span>/</span> {claim.id}</p>
            <h1>{claim.claimant}</h1>
            <div className={styles.titleMeta}>
              <span>{claim.incident}</span><span>{claim.vehicle}</span><span>{claim.policy}</span>
            </div>
          </div>
          <button className={styles.removeButton} onClick={() => requestClaimRemoval(claim)} type="button">
            <FiTrash2 aria-hidden="true" /> Remove file
          </button>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.incidentStrip}>
              <div className={styles.personMark}>{claim.initials}</div>
              <div className={styles.incidentSummary}>
                <span>INCIDENT</span>
                <strong>{claim.incident}</strong>
              </div>
              <div className={styles.incidentDatum}><FiCalendar aria-hidden="true" /><span>{formatDate(claim.incidentDate)}</span></div>
              <div className={styles.incidentDatum}><FiMapPin aria-hidden="true" /><span>{claim.location}</span></div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeading}>
                <div><FiFileText aria-hidden="true" /><h2>Evidence checklist</h2></div>
                <span className={styles.progress}>{completeDocuments} of {requiredDocuments.length} required</span>
              </div>
              <p className={styles.sectionIntro}>Mark each item when it has been reviewed. This checklist does not upload or store documents.</p>
              <div className={styles.documents}>
                {claim.documents.map((document) => (
                  <label className={`${styles.document} ${document.received ? styles.received : ""}`} key={document.id}>
                    <input checked={document.received} onChange={(event) => updateDocument(document.id, event.target.checked)} type="checkbox" />
                    <span className={styles.checkMark}>{document.received && <FiCheck aria-hidden="true" />}</span>
                    <span className={styles.documentName}>{document.name}{document.required && <small>Required</small>}</span>
                    <span className={styles.documentStatus}>{document.received ? "Received" : "Needed"}</span>
                  </label>
                ))}
              </div>
              {missingDocuments.length > 0 && (
                <div className={styles.missingNotice}>
                  <FiInfo aria-hidden="true" />
                  <span>{missingDocuments.length} required {missingDocuments.length === 1 ? "item is" : "items are"} still missing.</span>
                  <button onClick={flagMissingDocuments} type="button">Flag for follow-up</button>
                </div>
              )}
            </section>

            {claim.vehiclePhoto && (
              <section className={styles.photoCard}>
                <img alt="Illustrative close-up of collision damage on a red vehicle" src={`${import.meta.env.BASE_URL}vehicle-damage.jpg`} />
                <div>
                  <span>REFERENCE IMAGE</span>
                  <strong>Collision damage review</strong>
                  <p>This stock photo is illustrative only and is not evidence for this sample claim.</p>
                </div>
              </section>
            )}

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeading}>
                <div><FiShield aria-hidden="true" /><h2>Case notes</h2></div>
                <span className={styles.progress}>{claim.notes.length} {claim.notes.length === 1 ? "note" : "notes"}</span>
              </div>
              <form className={styles.noteForm} onSubmit={saveNote}>
                <label className={styles.srOnly} htmlFor="case-note">Add a case note</label>
                <textarea id="case-note" maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Record a short review note for the next adjuster..." value={note} />
                <div>
                  <span>{note.length}/500 characters</span>
                  <button disabled={!note.trim()} type="submit">Add note</button>
                </div>
              </form>
              <div className={styles.notes}>
                {claim.notes.length ? claim.notes.map((item) => (
                  <article className={styles.note} key={item.id}>
                    <div className={styles.noteMeta}><strong>{item.author}</strong><span>{item.date}</span></div>
                    <p>{item.text}</p>
                  </article>
                )) : <p className={styles.noNotes}>No notes yet. Add the first case note above.</p>}
              </div>
            </section>

            <section className={styles.timelineCard}>
              <div className={styles.sectionHeading}>
                <div><FiClock aria-hidden="true" /><h2>File history</h2></div>
                <span className={styles.progress}>Newest first</span>
              </div>
              <ol className={styles.timeline}>
                {claim.timeline.map((event) => (
                  <li key={event.id}>
                    <span className={styles.timelineDot}><FiCheckCircle aria-hidden="true" /></span>
                    <div><strong>{event.title}</strong><p>{event.actor}</p></div>
                    <time>{event.date} · {event.time}</time>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.workflowCard}>
              <div className={styles.workflowTop}>
                <span>FILE STATUS</span>
                <span className={`${styles.status} ${styles[claim.status.toLowerCase().replaceAll(" ", "-")]}`}>{claim.status}</span>
              </div>
              <label className={styles.statusLabel}>
                <span>Work stage</span>
                <select
                  aria-label="Update work stage"
                  disabled={finalStatus}
                  onChange={(event) => updateClaim(claim.id, { status: event.target.value }, `Status changed to ${event.target.value}`, `${claim.id} moved to ${event.target.value.toLowerCase()}.`)}
                  value={claim.status}
                >
                  {finalStatus && <option value={claim.status}>{claim.status}</option>}
                  {workStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <div className={styles.stageSteps}>
                {workStatuses.map((status, index) => (
                  <span className={claim.status === status ? styles.currentStep : ""} key={status}>
                    <i>{index + 1}</i>{status}
                  </span>
                ))}
              </div>
              <div className={styles.decisionBlock}>
                <button className={styles.approveButton} disabled={!allRequiredReceived || finalStatus} onClick={() => requestDecision(claim, "Approved")} type="button">
                  <FiCheck aria-hidden="true" /> Approve settlement
                </button>
                {!allRequiredReceived && !finalStatus && <p className={styles.approvalHint}>Complete required documents to approve.</p>}
                <button className={styles.declineButton} disabled={finalStatus} onClick={() => requestDecision(claim, "Declined")} type="button">Decline claim</button>
              </div>
              {(claim.status === "Approved" || claim.status === "Paid") && (
                <Link className={styles.paymentLink} to="/payments">Payment status: {claim.paymentStatus} <FiArrowUpRight aria-hidden="true" /></Link>
              )}
            </section>

            <section className={styles.amountCard}>
              <div className={styles.amountHeading}><h2>Settlement view</h2><span>ESTIMATE</span></div>
              <div className={styles.amountRow}><span>Repair estimate</span><strong>{formatCurrency(claim.estimate)}</strong></div>
              <div className={styles.amountRow}><span>Policy deductible</span><strong>- {formatCurrency(claim.deductible)}</strong></div>
              <div className={`${styles.amountRow} ${styles.settlement}`}><span>Potential settlement</span><strong>{formatCurrency(settlement)}</strong></div>
              <label className={styles.reserveField}>
                <span>Claim reserve</span>
                <div><span>$</span><input aria-label="Claim reserve" min="0" onChange={(event) => { setReserveDrafts((current) => ({ ...current, [claim.id]: event.target.value })); setReserveErrors((current) => ({ ...current, [claim.id]: "" })); }} type="number" value={reserveValue} /></div>
              </label>
              {reserveError && <p className={styles.reserveError}>{reserveError}</p>}
              <button className={styles.reserveButton} onClick={saveReserve} type="button">Save reserve</button>
            </section>

            <section className={styles.adjusterCard}>
              <h2>Assigned adjuster</h2>
              <div className={styles.adjusterMark}>{claim.adjuster.split(" ").map((part) => part[0]).join("")}</div>
              <strong>{claim.adjuster}</strong>
              <label>
                <span>Reassign file</span>
                <select
                  aria-label="Reassign adjuster"
                  onChange={(event) => updateClaim(claim.id, { adjuster: event.target.value }, `Assigned to ${event.target.value}`, `${claim.id} is now assigned to ${event.target.value}.`)}
                  value={claim.adjuster}
                >
                  {["Casey Morgan", "Jordan Lee", "Morgan Ellis", "Taylor Reed"].map((adjuster) => <option key={adjuster}>{adjuster}</option>)}
                </select>
              </label>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ClaimDetailsPage;
