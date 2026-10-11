import { FiArrowLeft, FiFileText } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import styles from "./styles.module.css";

const NotFoundPage = () => {
  const location = useLocation();

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <span className={styles.icon}><FiFileText aria-hidden="true" /></span>
        <p className={styles.code}>404 · FILE NOT FOUND</p>
        <h1>This page is outside the claim file.</h1>
        <p className={styles.message}>
          We could not find a Proof page at <code>{location.pathname}</code>. The address may have changed, or the page may no longer exist.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} to="/"><FiArrowLeft aria-hidden="true" /> Return to claims</Link>
          <Link className={styles.secondaryLink} to="/payments">Open payment desk</Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
