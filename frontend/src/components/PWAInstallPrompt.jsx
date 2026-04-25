import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // ❌ Already installed or dismissed → don't show
    if (
      localStorage.getItem("pwa-installed") === "true" ||
      localStorage.getItem("pwa-install-dismissed") === "true" ||
      isAppInstalled()
    ) {
      return;
    }

    const handler = (e) => {
      e.preventDefault(); // stop browser default popup
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    } else {
      localStorage.setItem("pwa-install-dismissed", "true");
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.container}>
      <span style={styles.text}>Install JJU Reading Club</span>

      <button onClick={installApp} style={styles.installBtn}>
        Install
      </button>

      <button onClick={dismiss} style={styles.closeBtn}>
        ✕
      </button>
    </div>
  );
}

function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: 16,
    right: 16, // 👈 corner position (change to left if needed)
    background: "#0f172a",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    zIndex: 9999,
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  text: {
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  installBtn: {
    background: "#fff",
    color: "#0f172a",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  closeBtn: {
    background: "transparent",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
};
