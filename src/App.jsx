import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import styles from "./App.module.css";
import Dialog from "./components/dialog";
import Footer from "./components/footer";
import Header from "./components/header";
import ScrollToTop from "./components/scrollToTop";
import Toast from "./components/toast";
import { seedClaims } from "./data/seed";
import { formatCompactDate, formatCurrency } from "./utils/format";

const getLocalDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const getEventTime = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

const App = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState(() =>
    seedClaims.map((claim) => ({
      ...claim,
      documents: claim.documents.map((document) => ({ ...document })),
      notes: claim.notes.map((note) => ({ ...note })),
      timeline: claim.timeline.map((event) => ({ ...event })),
    })),
  );
  const [notification, setNotification] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const showToast = useCallback((title, message = "", type = "success") => {
    setNotification({ id: Date.now(), title, message, type });
  }, []);

  useEffect(() => {
    if (!notification) return undefined;
    const timeout = window.setTimeout(() => setNotification(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  const updateClaim = useCallback(
    (claimId, changes, eventTitle = "Claim updated", feedback = "") => {
      const now = new Date();
      setClaims((current) =>
        current.map((claim) => {
          if (claim.id !== claimId) return claim;
          const patch = typeof changes === "function" ? changes(claim) : changes;
          const event = eventTitle
            ? {
                id: `event-${now.getTime()}`,
                date: formatCompactDate(getLocalDate()),
                time: getEventTime(),
                title: eventTitle,
                actor: "Claims team",
              }
            : null;
          return {
            ...claim,
            ...patch,
            updatedAt: now.toISOString(),
            timeline: event ? [event, ...claim.timeline] : claim.timeline,
          };
        }),
      );
      showToast("Claim updated", feedback || `${claimId} has been updated.`);
    },
    [showToast],
  );

  const createClaim = useCallback(
    (values) => {
      const nextNumber =
        Math.max(
          4000,
          ...claims.map((claim) => Number(claim.id.split("-").at(-1)) || 0),
        ) + 1;
      const now = new Date();
      const claimId = `CL-26-${String(nextNumber).padStart(4, "0")}`;
      const claim = {
        ...values,
        id: claimId,
        initials: values.initials,
        reportedDate: getLocalDate(),
        status: "New",
        paymentStatus: "Not started",
        updatedAt: now.toISOString(),
        vehiclePhoto: false,
        documents: [
          { id: "police", name: "Police report", required: true, received: false },
          { id: "photos", name: "Damage photos", required: true, received: false },
          { id: "estimate", name: "Repair estimate", required: true, received: false },
          { id: "statement", name: "Driver statement", required: true, received: false },
        ],
        notes: [],
        timeline: [
          {
            id: `event-${now.getTime()}`,
            date: formatCompactDate(getLocalDate()),
            time: getEventTime(),
            title: "Claim filed",
            actor: "Claims intake",
          },
        ],
      };
      setClaims((current) => [claim, ...current]);
      showToast("Claim filed", `${claimId} is now in the new claims queue.`);
      navigate(`/claims/${claimId}`);
    },
    [claims, navigate, showToast],
  );

  const addNote = useCallback(
    (claimId, text) => {
      const now = new Date();
      setClaims((current) =>
        current.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                updatedAt: now.toISOString(),
                notes: [
                  {
                    id: `note-${now.getTime()}`,
                    author: "Claims team",
                    date: formatCompactDate(getLocalDate()),
                    text,
                  },
                  ...claim.notes,
                ],
                timeline: [
                  {
                    id: `event-${now.getTime()}`,
                    date: formatCompactDate(getLocalDate()),
                    time: getEventTime(),
                    title: "Case note added",
                    actor: "Claims team",
                  },
                  ...claim.timeline,
                ],
              }
            : claim,
        ),
      );
      showToast("Note saved", `Added to claim ${claimId}.`);
    },
    [showToast],
  );

  const updateStatus = useCallback(
    (claim, status) => {
      if (claim.status === status) return;
      const paymentStatus =
        status === "Approved"
          ? "Ready to issue"
          : status === "Declined"
            ? "Not approved"
            : status === "Paid"
              ? "Issued"
              : claim.paymentStatus;
      updateClaim(
        claim.id,
        { status, paymentStatus },
        `Status changed to ${status}`,
        `${claim.id} moved to ${status.toLowerCase()}.`,
      );
    },
    [updateClaim],
  );

  const requestDecision = useCallback(
    (claim, status) => {
      const approving = status === "Approved";
      const settlement = Math.max(claim.estimate - claim.deductible, 0);
      setConfirmation({
        title: approving ? "Approve this settlement?" : "Decline this claim?",
        description: approving
          ? `Approve a ${formatCurrency(settlement)} settlement for ${claim.claimant} on ${claim.id}. This will place it in the payment queue.`
          : `Decline ${claim.id} for ${claim.claimant}. The claim will be marked declined in the case history.`,
        confirmLabel: approving ? "Approve settlement" : "Decline claim",
        danger: !approving,
        onConfirm: () => {
          updateClaim(
            claim.id,
            {
              status,
              paymentStatus: approving ? "Ready to issue" : "Not approved",
            },
            approving ? "Settlement approved" : "Claim declined",
            approving
              ? `${formatCurrency(settlement)} is ready for payment review.`
              : `${claim.id} was marked declined.`,
          );
          closeConfirmation();
        },
      });
    },
    [closeConfirmation, updateClaim],
  );

  const requestPaymentAction = useCallback(
    (claim, action) => {
      const issuing = action === "issue";
      const releasing = action === "release";
      const settlement = Math.max(claim.estimate - claim.deductible, 0);
      setConfirmation({
        title: issuing
          ? "Mark settlement as issued?"
          : releasing
            ? "Release this payment hold?"
            : "Place payment on hold?",
        description: issuing
          ? `Confirm that the ${formatCurrency(settlement)} settlement for ${claim.claimant} has been issued. This demo records the status only; no money moves.`
          : releasing
            ? `Return ${claim.id} for ${claim.claimant} to the ready-to-issue payment queue.`
            : `Pause payment processing for ${claim.id}. The claim stays approved and can be released later.`,
        confirmLabel: issuing
          ? "Mark as issued"
          : releasing
            ? "Release payment"
            : "Place on hold",
        danger: false,
        onConfirm: () => {
          const paymentStatus = issuing
            ? "Issued"
            : releasing
              ? "Ready to issue"
              : "On hold";
          const status = issuing ? "Paid" : claim.status;
          updateClaim(
            claim.id,
            { status, paymentStatus },
            issuing
              ? "Settlement marked as issued"
              : releasing
                ? "Payment hold released"
                : "Payment placed on hold",
            issuing
              ? `Recorded a ${formatCurrency(settlement)} payment for ${claim.claimant}.`
              : releasing
                ? `${claim.id} is ready to issue.`
                : `${claim.id} can be released from hold in the payment queue.`,
          );
          closeConfirmation();
        },
      });
    },
    [closeConfirmation, updateClaim],
  );

  const requestClaimRemoval = useCallback(
    (claim) => {
      setConfirmation({
        title: "Remove this claim file?",
        description: `Remove ${claim.id} for ${claim.claimant} from this demo workspace? Its notes, checklist, and payment record will also be removed.`,
        confirmLabel: "Remove claim",
        danger: true,
        onConfirm: () => {
          setClaims((current) => current.filter((item) => item.id !== claim.id));
          closeConfirmation();
          showToast("Claim removed", `${claim.id} was removed from this demo workspace.`, "info");
          navigate("/");
        },
      });
    },
    [closeConfirmation, navigate, showToast],
  );

  const totals = useMemo(
    () => ({
      open: claims.filter((claim) => !["Paid", "Declined"].includes(claim.status)).length,
      ready: claims.filter((claim) => claim.status === "Ready to review").length,
      missing: claims.filter((claim) => claim.status === "Missing documents").length,
      high: claims.filter((claim) => claim.severity === "High" && !["Paid", "Declined"].includes(claim.status)).length,
      reserve: claims.reduce((total, claim) => total + claim.reserve, 0),
    }),
    [claims],
  );

  const app = {
    claims,
    totals,
    showToast,
    createClaim,
    updateClaim,
    updateStatus,
    addNote,
    requestDecision,
    requestPaymentAction,
    requestClaimRemoval,
  };

  return (
    <div className={styles.app}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <Header onNewClaim={() => navigate("/new-claim")} />
      <main className={styles.main} id="main-content">
        <ScrollToTop />
        <AppRoutes app={app} />
      </main>
      <Footer />
      <Toast notification={notification} onDismiss={() => setNotification(null)} />
      <Dialog
        description={confirmation?.description}
        onClose={closeConfirmation}
        open={Boolean(confirmation)}
        size="narrow"
        title={confirmation?.title}
      >
        {confirmation && (
          <div className={styles.confirmation}>
            <div className={styles.confirmActions}>
              <button className={styles.cancelButton} data-dialog-cancel onClick={closeConfirmation} type="button">
                Cancel
              </button>
              <button
                className={`${styles.confirmButton} ${confirmation.danger ? styles.dangerButton : ""}`}
                onClick={confirmation.onConfirm}
                type="button"
              >
                {confirmation.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default App;
