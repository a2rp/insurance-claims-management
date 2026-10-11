import styles from "./styles.module.css";

const Loading = () => (
    <div aria-label="Loading" className={styles.loadingState} role="status">
        <span aria-hidden="true" className={styles.spinner} />
    </div>
);

export default Loading;
