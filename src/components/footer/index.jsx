import {
  FiCodepen,
  FiCoffee,
  FiFacebook,
  FiGithub,
  FiGlobe,
  FiHeart,
  FiLinkedin,
  FiMail,
  FiYoutube,
} from "react-icons/fi";
import { Tooltip } from "react-tooltip";
import styles from "./styles.module.css";

const footerLinks = [
  { label: "Portfolio", detail: "ashishranjan.net", url: "https://www.ashishranjan.net", icon: FiGlobe },
  { label: "GitHub", detail: "github.com/a2rp", url: "https://github.com/a2rp", icon: FiGithub },
  { label: "CodePen", detail: "codepen.io/ash1198", url: "https://codepen.io/ash1198", icon: FiCodepen },
  { label: "LinkedIn", detail: "linkedin.com/in/aashishranjan", url: "https://www.linkedin.com/in/aashishranjan", icon: FiLinkedin },
  { label: "Facebook", detail: "facebook.com/theash.ashish", url: "https://www.facebook.com/theash.ashish/", icon: FiFacebook },
  { label: "YouTube", detail: "youtube.com/@ashishranjan-ashz", url: "https://www.youtube.com/@ashishranjan-ashz?sub_confirmation=1", icon: FiYoutube },
  { label: "Email", detail: "ash.ranjan09@gmail.com", url: "mailto:ash.ranjan09@gmail.com", icon: FiMail },
  { label: "Support", detail: "a2rp-donation-page.netlify.app", url: "https://a2rp-donation-page.netlify.app/", icon: FiHeart },
  { label: "Buy Me a Coffee", detail: "buymeacoffee.com/ashishranjan", url: "https://buymeacoffee.com/ashishranjan", icon: FiCoffee },
  { label: "Patreon", detail: "patreon.com/ashishranjan", url: "https://www.patreon.com/ashishranjan", icon: FiHeart },
  { label: "Repository", detail: "github.com/a2rp/insurance-claims-management", url: "https://github.com/a2rp/insurance-claims-management", icon: FiGithub },
];

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.identity}>
      <img alt="" src={`${import.meta.env.BASE_URL}logo.png`} />
      <p>
        © {new Date().getFullYear()} <a href="https://www.ashishranjan.net">Ashish Ranjan</a>.
        <span> Claim operations demo.</span>
      </p>
    </div>
    <div aria-label="Ashish Ranjan links" className={styles.links}>
      {footerLinks.map(({ label, detail, url, icon: Icon }) => (
        <a
          aria-label={`${label}: ${detail}`}
          data-tooltip-content={label}
          data-tooltip-id="proof-footer-tooltip"
          href={url}
          key={label}
          rel="noreferrer"
          target={url.startsWith("mailto:") ? undefined : "_blank"}
        >
          <Icon aria-hidden="true" />
        </a>
      ))}
    </div>
    <Tooltip
      className={styles.tooltip}
      id="proof-footer-tooltip"
      render={({ content }) => {
        const link = footerLinks.find((item) => item.label === content);
        return link ? (
          <span className={styles.tooltipContent}>
            <strong>{link.label}</strong>
            <span>{link.detail}</span>
          </span>
        ) : null;
      }}
    />
  </footer>
);

export default Footer;
