import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import styles from "./styles.module.css";

const toastIcons = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
  warning: FiAlertCircle,
};

const Toast = ({ notification, onDismiss }) => {
  if (!notification) return null;
  const Icon = toastIcons[notification.type] || FiInfo;

  return (
    <div
      className={`${styles.toast} ${styles[notification.type] || styles.info}`}
      role={notification.type === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className={styles.icon} />
      <div className={styles.copy}>
        <strong>{notification.title}</strong>
        {notification.message && <p>{notification.message}</p>}
      </div>
      <button aria-label="Dismiss notification" className={styles.close} onClick={onDismiss} type="button">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
};

export default Toast;
