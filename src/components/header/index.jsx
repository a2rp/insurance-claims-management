import { useEffect, useRef, useState } from "react";
import { FiBarChart2, FiCreditCard, FiFileText, FiGithub, FiMenu, FiPlus, FiShield, FiX } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";
import styles from "./styles.module.css";

const navigation = [
  { to: "/", label: "Claims", icon: FiFileText, end: true },
  { to: "/payments", label: "Payments", icon: FiCreditCard },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
];

const Header = ({ onNewClaim }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScroll = useRef(0);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll < 48 || currentScroll < lastScroll.current) {
        setVisible(true);
      } else if (currentScroll > lastScroll.current + 4 && !menuOpen) {
        setVisible(false);
      }
      lastScroll.current = currentScroll;
    };

    const handleKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const handleOutsideClick = (event) => {
      if (menuOpen && !headerRef.current?.contains(event.target)) setMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`${styles.header} ${!visible && !menuOpen ? styles.hidden : ""}`} ref={headerRef}>
      <div className={styles.inner}>
        <Link aria-label="Proof claims home" className={styles.brand} onClick={closeMenu} to="/">
          <span aria-hidden="true" className={styles.brandMark}>
            <FiShield />
          </span>
          <span className={styles.brandName}>proof<span>.</span></span>
          <span className={styles.brandDivider} />
          <span className={styles.brandLabel}>CLAIMS OPERATIONS</span>
        </Link>

        <nav aria-label="Main navigation" className={`${styles.nav} ${menuOpen ? styles.open : ""}`} id="proof-navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
              end={end}
              onClick={closeMenu}
              to={to}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          <button className={styles.mobileCreate} onClick={() => { closeMenu(); onNewClaim?.(); }} type="button">
            <FiPlus aria-hidden="true" /> New claim
          </button>
        </nav>

        <div className={styles.actions}>
          <a
            aria-label="Repository"
            className={styles.repository}
            href="https://github.com/a2rp/insurance-claims-management"
            rel="noreferrer"
            target="_blank"
          >
            <FiGithub aria-hidden="true" /> <span>Repository</span>
          </a>
          <button className={styles.createButton} onClick={onNewClaim} type="button">
            <FiPlus aria-hidden="true" /> <span>New claim</span>
          </button>
          <button
            aria-expanded={menuOpen}
            aria-controls="proof-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className={styles.menuButton}
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
