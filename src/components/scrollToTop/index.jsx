import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./styles.module.css";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth";
        window.scrollTo({
            top: 0,
            behavior,
        });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
