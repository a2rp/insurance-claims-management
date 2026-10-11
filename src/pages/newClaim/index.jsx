import { useState } from "react";
import { FiArrowLeft, FiCheck, FiInfo, FiShield } from "react-icons/fi";
import { Link } from "react-router-dom";
import { formatCurrency, getInitials } from "../../utils/format";
import styles from "./styles.module.css";

const initialValues = {
  claimant: "",
  policy: "",
  vehicle: "",
  incident: "Rear-end collision",
  incidentDate: "",
  location: "",
  adjuster: "Casey Morgan",
  severity: "Medium",
  estimate: "",
  reserve: "",
  deductible: "500",
};

const NewClaimPage = ({ createClaim, showToast }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    ["claimant", "policy", "vehicle", "location", "incidentDate"].forEach((field) => {
      if (!values[field].trim()) nextErrors[field] = "This field is required.";
    });
    if (values.incidentDate && values.incidentDate > new Date().toISOString().slice(0, 10)) {
      nextErrors.incidentDate = "The incident date cannot be in the future.";
    }
    if (!Number(values.estimate) || Number(values.estimate) < 1) {
      nextErrors.estimate = "Enter an estimated loss greater than zero.";
    }
    if (values.reserve !== "" && Number(values.reserve) < 0) {
      nextErrors.reserve = "Reserve cannot be negative.";
    }
    if (values.deductible !== "" && Number(values.deductible) < 0) {
      nextErrors.deductible = "Deductible cannot be negative.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      showToast("Review the claim details", "Correct the highlighted fields before filing.", "error");
      return;
    }
    const estimate = Number(values.estimate);
    createClaim({
      claimant: values.claimant.trim(),
      initials: getInitials(values.claimant),
      policy: values.policy.trim().toUpperCase(),
      vehicle: values.vehicle.trim(),
      incident: values.incident,
      incidentDate: values.incidentDate,
      location: values.location.trim(),
      adjuster: values.adjuster,
      severity: values.severity,
      estimate,
      reserve: values.reserve === "" ? estimate : Number(values.reserve),
      deductible: Number(values.deductible || 0),
    });
  };

  const estimate = Number(values.estimate) || 0;
  const deductible = Number(values.deductible) || 0;

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <Link className={styles.backLink} to="/">
          <FiArrowLeft aria-hidden="true" /> Back to claims
        </Link>
        <div className={styles.heading}>
          <p>Claims <span>/</span> New file</p>
          <h1>Start a claim file</h1>
          <div>Capture the incident details and an initial estimate. You can update the file as evidence arrives.</div>
        </div>

        <div className={styles.layout}>
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <section className={styles.formSection}>
              <div className={styles.sectionHead}>
                <span className={styles.step}>1</span>
                <div>
                  <h2>Policyholder and vehicle</h2>
                  <p>Identify the person and covered vehicle.</p>
                </div>
              </div>
              <div className={styles.fields}>
                <label className={styles.field}>
                  <span>Policyholder <b>*</b></span>
                  <input autoComplete="name" aria-invalid={Boolean(errors.claimant)} name="claimant" onChange={updateField} placeholder="e.g. Maya Thompson" value={values.claimant} />
                  {errors.claimant && <small>{errors.claimant}</small>}
                </label>
                <label className={styles.field}>
                  <span>Policy number <b>*</b></span>
                  <input aria-invalid={Boolean(errors.policy)} name="policy" onChange={updateField} placeholder="e.g. AUTO-88421" value={values.policy} />
                  {errors.policy && <small>{errors.policy}</small>}
                </label>
                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Vehicle <b>*</b></span>
                  <input aria-invalid={Boolean(errors.vehicle)} name="vehicle" onChange={updateField} placeholder="Year, make, and model" value={values.vehicle} />
                  {errors.vehicle && <small>{errors.vehicle}</small>}
                </label>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHead}>
                <span className={styles.step}>2</span>
                <div>
                  <h2>Incident details</h2>
                  <p>Record what happened and where.</p>
                </div>
              </div>
              <div className={styles.fields}>
                <label className={styles.field}>
                  <span>Incident type</span>
                  <select name="incident" onChange={updateField} value={values.incident}>
                    {["Rear-end collision", "Side impact", "Hail damage", "Windshield damage", "Theft or vandalism", "Single vehicle collision", "Other"].map((incident) => <option key={incident}>{incident}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Incident date <b>*</b></span>
                  <input aria-invalid={Boolean(errors.incidentDate)} max={new Date().toISOString().slice(0, 10)} name="incidentDate" onChange={updateField} type="date" value={values.incidentDate} />
                  {errors.incidentDate && <small>{errors.incidentDate}</small>}
                </label>
                <label className={styles.field}>
                  <span>Location <b>*</b></span>
                  <input aria-invalid={Boolean(errors.location)} name="location" onChange={updateField} placeholder="City, state" value={values.location} />
                  {errors.location && <small>{errors.location}</small>}
                </label>
                <label className={styles.field}>
                  <span>Severity</span>
                  <select name="severity" onChange={updateField} value={values.severity}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </label>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionHead}>
                <span className={styles.step}>3</span>
                <div>
                  <h2>Initial estimate</h2>
                  <p>These values are planning estimates until a decision is made.</p>
                </div>
              </div>
              <div className={styles.fields}>
                <label className={styles.field}>
                  <span>Estimated loss <b>*</b></span>
                  <div className={styles.moneyInput}><span>$</span><input aria-invalid={Boolean(errors.estimate)} min="1" name="estimate" onChange={updateField} placeholder="0" type="number" value={values.estimate} /></div>
                  {errors.estimate && <small>{errors.estimate}</small>}
                </label>
                <label className={styles.field}>
                  <span>Reserve amount</span>
                  <div className={styles.moneyInput}><span>$</span><input aria-invalid={Boolean(errors.reserve)} min="0" name="reserve" onChange={updateField} placeholder="Uses estimate" type="number" value={values.reserve} /></div>
                  {errors.reserve && <small>{errors.reserve}</small>}
                </label>
                <label className={styles.field}>
                  <span>Deductible</span>
                  <div className={styles.moneyInput}><span>$</span><input aria-invalid={Boolean(errors.deductible)} min="0" name="deductible" onChange={updateField} type="number" value={values.deductible} /></div>
                  {errors.deductible && <small>{errors.deductible}</small>}
                </label>
                <label className={styles.field}>
                  <span>Assigned adjuster</span>
                  <select name="adjuster" onChange={updateField} value={values.adjuster}>
                    {["Casey Morgan", "Jordan Lee", "Morgan Ellis", "Taylor Reed"].map((adjuster) => <option key={adjuster}>{adjuster}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <div className={styles.formActions}>
              <Link className={styles.cancelButton} to="/">Cancel</Link>
              <button className={styles.submitButton} type="submit"><FiCheck aria-hidden="true" /> File claim</button>
            </div>
          </form>

          <aside className={styles.preview}>
            <div className={styles.previewTitle}><FiShield aria-hidden="true" /><span>FILE PREVIEW</span></div>
            <div className={styles.previewProfile}>
              <span>{values.claimant ? getInitials(values.claimant) : "--"}</span>
              <div><strong>{values.claimant || "Policyholder name"}</strong><small>{values.policy || "Policy number"}</small></div>
            </div>
            <div className={styles.previewVehicle}><span>VEHICLE</span><strong>{values.vehicle || "Vehicle details"}</strong></div>
            <div className={styles.estimateBox}>
              <div><span>Estimated loss</span><strong>{formatCurrency(estimate)}</strong></div>
              <div><span>Less deductible</span><strong>- {formatCurrency(deductible)}</strong></div>
              <div className={styles.netLine}><span>Potential settlement</span><strong>{formatCurrency(Math.max(estimate - deductible, 0))}</strong></div>
            </div>
            <p className={styles.infoNote}><FiInfo aria-hidden="true" /> This is a planning view. Filing records the case locally and does not contact a carrier.</p>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default NewClaimPage;
