"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Aref_Ruqaa, Tajawal } from "next/font/google";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const SITE_URL = "https://sagel-app.vercel.app/";
const SOCHIAL_URL = "https://sultaaan11.github.io/My-SochiaaL/";
const SUGGEST_PHONE_DISPLAY = "01280717634";
const SUGGEST_PHONE_WA = "201280717634";

const shareMessage = `جرّب موقع سجل لجداول الفرقة الأولى:\n${SITE_URL}`;
const SHARE_WA_URL = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

const suggestMessage = "عندي اقتراح لتطوير الويب سايت\nهو : ";
const SUGGEST_WA_URL = `https://wa.me/${SUGGEST_PHONE_WA}?text=${encodeURIComponent(
  suggestMessage
)}`;

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return { copied, copy };
}

export default function ShareClient() {
  const mainCopy = useCopy(SITE_URL);
  const urlCopy = useCopy(SITE_URL);

  return (
    <div dir="rtl" className={`sh-page ${tajawal.className}`}>
      <style>{`
        .sh-page {
          --sh-bg: #0a0e1a;
          --sh-card: #121a30;
          --sh-card-2: #16203a;
          --sh-border: rgba(255, 255, 255, 0.08);
          --sh-text: #eef2ff;
          --sh-muted: #9aa5c4;
          --sh-accent: #7c5cff;
          --sh-accent-2: #35e0c2;
          --sh-gold: #e2c98a;
          --sh-radius: 18px;
          --sh-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          min-height: 100dvh;
          width: 100%;
          max-width: 100%;
          overflow-x: clip;
          background:
            radial-gradient(60rem 30rem at 85% -10%, rgba(124, 92, 255, 0.14), transparent 60%),
            radial-gradient(50rem 28rem at 0% 110%, rgba(53, 224, 194, 0.10), transparent 60%),
            var(--sh-bg);
          color: var(--sh-text);
          line-height: 1.7;
        }
        .sh-page *, .sh-page *::before, .sh-page *::after {
          box-sizing: border-box;
        }
        .sh-wrap {
          width: min(1080px, 100% - 2rem);
          margin-inline: auto;
          min-width: 0;
        }
        .sh-header {
          padding: 1rem 0;
          border-bottom: 1px solid var(--sh-border);
          background: rgba(10, 14, 26, 0.72);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .sh-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .sh-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 800;
          font-size: 1.25rem;
          text-decoration: none;
          color: var(--sh-text);
        }
        .sh-logo-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--sh-accent), var(--sh-accent-2));
          box-shadow: 0 0 14px rgba(124, 92, 255, 0.6);
          flex: 0 0 auto;
        }
        .sh-links {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .sh-links a {
          text-decoration: none;
          color: var(--sh-muted);
          padding: 0.45rem 0.85rem;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 500;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .sh-links a:hover {
          color: var(--sh-text);
          background: rgba(255, 255, 255, 0.06);
        }
        .sh-links a.is-active {
          color: var(--sh-text);
          background: rgba(124, 92, 255, 0.18);
        }
        .sh-hero {
          text-align: center;
          padding: clamp(2.2rem, 6vw, 4rem) 0 clamp(1.4rem, 4vw, 2.4rem);
        }
        .sh-hero h1 {
          margin: 0 0 0.6rem;
          font-size: clamp(2rem, 6vw, 3rem);
          font-weight: 800;
          background: linear-gradient(120deg, #ffffff 30%, var(--sh-accent-2));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        .sh-hero p {
          margin: 0 auto;
          max-width: 34rem;
          color: var(--sh-muted);
          font-size: clamp(0.98rem, 2.5vw, 1.12rem);
        }
        .sh-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: 1fr;
          padding-bottom: clamp(2rem, 5vw, 3.5rem);
        }
        @media (min-width: 760px) {
          .sh-grid {
            grid-template-columns: 1.15fr 0.85fr;
            align-items: stretch;
          }
          .sh-card--qr {
            grid-row: span 2;
          }
        }
        .sh-card {
          background: linear-gradient(160deg, var(--sh-card-2), var(--sh-card));
          border: 1px solid var(--sh-border);
          border-radius: var(--sh-radius);
          box-shadow: var(--sh-shadow);
          padding: clamp(1.2rem, 3.5vw, 1.8rem);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .sh-card:hover {
          transform: translateY(-3px);
          border-color: rgba(124, 92, 255, 0.35);
        }
        .sh-card h2 {
          margin: 0;
          font-size: clamp(1.1rem, 3vw, 1.35rem);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .sh-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          background: rgba(124, 92, 255, 0.15);
          color: var(--sh-accent-2);
        }
        .sh-desc {
          margin: 0;
          color: var(--sh-muted);
          font-size: 0.95rem;
        }
        .sh-qr-stage {
          margin: auto;
          background: #ffffff;
          padding: clamp(0.9rem, 3vw, 1.25rem);
          border-radius: 22px;
          box-shadow: 0 0 0 1px var(--sh-border), 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 34px rgba(124, 92, 255, 0.18);
          line-height: 0;
          max-width: 100%;
        }
        .sh-qr-svg {
          width: min(240px, 62vw);
          height: auto;
          display: block;
          border-radius: 8px;
        }
        .sh-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.25rem;
        }
        .sh-btn {
          --btn-bg: linear-gradient(135deg, var(--sh-accent), #5a3fd6);
          appearance: none;
          border: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.6rem;
          border-radius: 14px;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          background: var(--btn-bg);
          box-shadow: 0 8px 22px rgba(124, 92, 255, 0.35);
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          text-decoration: none;
          min-width: 0;
        }
        .sh-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-2px);
        }
        .sh-btn:active {
          transform: translateY(0) scale(0.98);
        }
        .sh-btn--ghost {
          --btn-bg: transparent;
          background: rgba(53, 224, 194, 0.1);
          color: var(--sh-accent-2);
          border: 1px solid rgba(53, 224, 194, 0.35);
          box-shadow: none;
        }
        .sh-btn--ghost:hover {
          background: rgba(53, 224, 194, 0.18);
        }
        .sh-btn.is-copied {
          --btn-bg: linear-gradient(135deg, #159a6c, #0f7a54);
          box-shadow: 0 8px 22px rgba(21, 154, 108, 0.4);
        }
        .sh-link-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(0, 0, 0, 0.28);
          border: 1px dashed rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          padding: 0.55rem 0.6rem 0.55rem 0.9rem;
          min-width: 0;
        }
        .sh-url {
          direction: ltr;
          unicode-bidi: embed;
          flex: 1 1 auto;
          min-width: 0;
          color: var(--sh-accent-2);
          font-weight: 600;
          font-size: clamp(0.8rem, 2.6vw, 0.95rem);
          text-decoration: none;
          overflow-wrap: anywhere;
          word-break: break-all;
        }
        .sh-url:hover {
          text-decoration: underline;
        }
        .sh-icon-btn {
          flex: 0 0 auto;
          appearance: none;
          cursor: pointer;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(124, 92, 255, 0.14);
          color: var(--sh-text);
          border: 1px solid rgba(124, 92, 255, 0.3);
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .sh-icon-btn:hover {
          background: rgba(124, 92, 255, 0.28);
          transform: translateY(-2px);
        }
        .sh-icon-btn.is-copied {
          background: rgba(21, 154, 108, 0.25);
          border-color: rgba(21, 154, 108, 0.5);
          color: #7be3bb;
        }
        .sh-number {
          direction: ltr;
          text-align: center;
          font-size: clamp(1.6rem, 6vw, 2.2rem);
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--sh-text);
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--sh-border);
          border-radius: 14px;
          padding: 0.7rem 0.5rem;
          font-variant-numeric: tabular-nums;
        }
        .sh-number a {
          color: inherit;
          text-decoration: none;
        }
        .sh-number small {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--sh-muted);
          letter-spacing: 0;
          margin-top: 0.15rem;
        }
        .sh-footer {
          border-top: 1px solid var(--sh-border);
          padding: 1.6rem 0 2.2rem;
          text-align: center;
        }
        .sh-sochial-wrap {
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
        }
        .sh-sochial-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 1.2rem;
          border-radius: 999px;
          text-decoration: none;
          font-size: clamp(1.05rem, 3.6vw, 1.28rem);
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--sh-accent-2);
          background: rgba(53, 224, 194, 0.08);
          border: 1px solid rgba(53, 224, 194, 0.32);
          animation: sh-sochial-glow 3.2s ease-in-out infinite;
          transition: transform 0.2s ease, color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .sh-sochial-link:hover {
          color: #ffffff;
          background: rgba(53, 224, 194, 0.16);
          border-color: rgba(53, 224, 194, 0.72);
          transform: translateY(-2px);
        }
        @keyframes sh-sochial-glow {
          0%, 100% {
            box-shadow: 0 0 14px rgba(53, 224, 194, 0.15), 0 0 6px rgba(124, 92, 255, 0.12);
            text-shadow: 0 0 10px rgba(53, 224, 194, 0.25);
          }
          50% {
            box-shadow: 0 0 24px rgba(53, 224, 194, 0.35), 0 0 12px rgba(124, 92, 255, 0.24);
            text-shadow: 0 0 16px rgba(53, 224, 194, 0.55);
          }
        }
        .sh-signature {
          display: inline-block;
          font-size: clamp(1.15rem, 4vw, 1.5rem);
          font-weight: 700;
          color: var(--sh-gold);
          text-shadow: 0 0 18px rgba(226, 201, 138, 0.25);
          animation: sh-float 4.5s ease-in-out infinite;
          will-change: transform;
          user-select: none;
          pointer-events: none;
        }
        @keyframes sh-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sh-signature, .sh-sochial-link {
            animation: none;
          }
          .sh-card, .sh-btn, .sh-icon-btn, .sh-sochial-link {
            transition: none;
          }
        }
      `}</style>

      <header className="sh-header">
        <div className="sh-wrap sh-nav">
          <Link href="/" className="sh-logo">
            <span className="sh-logo-dot" />
            <span>سجل</span>
          </Link>
          <nav className="sh-links" aria-label="التنقل الرئيسي">
            <Link href="/">الرئيسية</Link>
            <Link href="/share" className="is-active">
              شارك
            </Link>
          </nav>
        </div>
      </header>

      <main className="sh-wrap">
        <section className="sh-hero">
          <h1>شارك</h1>
          <p>
            ساعد زمايلك يوصلوا لجداولهم أسرع  ابعت لهم رابط سجل بضغطة واحدة، أو خليهم يمسحوا الـ QR من على شاشتك مباشرة.
          </p>
        </section>

        <section className="sh-grid">
          <article className="sh-card sh-card--qr">
            <h2>
              <span className="sh-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1" />
                </svg>
              </span>
              <span>امسح وافتح سريع</span>
            </h2>
            <p className="sh-desc">وجّه كاميرا التليفون على الكود وهيفتح الموقع على طول.</p>

            <div className="sh-qr-stage" aria-label="QR Code لرابط سجل">
              <QRCodeSVG
                value={SITE_URL}
                size={240}
                level="M"
                bgColor="#ffffff"
                fgColor="#0b1020"
                className="sh-qr-svg"
                role="img"
                aria-label="QR Code لرابط سجل"
              />
            </div>

            <div className="sh-actions">
              <button
                type="button"
                onClick={mainCopy.copy}
                className={`sh-btn ${mainCopy.copied ? "is-copied" : ""}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                <span>{mainCopy.copied ? "تم النسخ " : "نسخ الرابط"}</span>
              </button>

              <a
                href={SHARE_WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sh-btn sh-btn--ghost"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.7-1.3 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1a16 16 0 0 1-1.6-.6c-2.8-1.2-4.7-4.1-4.8-4.3-.1-.2-1.2-1.5-1.2-2.9s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.3 1.1 2.3 1.5 2.6 1.6.3.2.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.2Z" />
                </svg>
                <span>مشاركة واتساب</span>
              </a>
            </div>
          </article>

          <article className="sh-card">
            <h2>
              <span className="sh-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                  <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                </svg>
              </span>
              <span>رابط الموقع</span>
            </h2>
            <p className="sh-desc">اضغط على الرابط لفتحه في تبويب جديد، أو انسخه بزرار النسخ.</p>

            <div className="sh-link-row">
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sh-url"
              >
                {SITE_URL}
              </a>
              <button
                type="button"
                onClick={urlCopy.copy}
                aria-label="نسخ الرابط"
                title={urlCopy.copied ? "تم النسخ " : "نسخ الرابط"}
                className={`sh-icon-btn ${urlCopy.copied ? "is-copied" : ""}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
            </div>
          </article>

          <article className="sh-card">
            <h2>
              <span className="sh-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span>عندك اقتراح؟</span>
            </h2>
            <p className="sh-desc">محتاجين رأيك عشان نطوّر سجل  ابعت اقتراحك على الرقم ده:</p>

            <div className="sh-number">
              <a href={`tel:${SUGGEST_PHONE_DISPLAY}`}>{SUGGEST_PHONE_DISPLAY}</a>
              <small>متاح على واتساب</small>
            </div>

            <div className="sh-actions">
              <a
                href={SUGGEST_WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sh-btn"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z" />
                </svg>
                <span>إرسال اقتراح</span>
              </a>
            </div>
          </article>
        </section>
      </main>

      <footer className="sh-footer">
        <div className="sh-wrap">
          <div className="sh-sochial-wrap">
            <a
              href={SOCHIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="sh-sochial-link"
            >
              Sochial
            </a>
          </div>
          <span dir="ltr" className={`sh-signature ${arefRuqaa.className}`}>
            DeV SulTaaN
          </span>
        </div>
      </footer>
    </div>
  );
}
