// Server Component — no "use client" needed.
// Hover effects on social icons are handled via an injected <style> block
// so zero event handlers are passed as props.

import Link from "next/link";

// ── Injected CSS (keeps component a pure Server Component) ────────────────────
const footerStyles = `
  .lm-social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 9999px;
    border: 1px solid rgba(201, 168, 76, 0.35);
    color: #C9A84C;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  .lm-social-btn:hover {
    background-color: #C9A84C;
    color: #1B3A5C;
  }
  .lm-footer-link {
    color: #A8BDD1;
    font-size: 0.875rem;
    transition: color 0.15s ease;
  }
  .lm-footer-link:hover {
    color: #ffffff;
  }
  .lm-contact-link {
    color: inherit;
    transition: color 0.15s ease;
  }
  .lm-contact-link:hover {
    color: #ffffff;
  }
`;

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.08-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Watches", href: "/watches" },
  { label: "Undergarments", href: "/undergarments" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const customerServiceLinks = [
  { label: "FAQs", href: "/faqs" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Returns & Exchanges", href: "/returns" },
  { label: "Track Order", href: "/track-order" },
];

const socialLinks = [
  { href: "https://instagram.com/luxemarket", label: "Instagram", icon: <InstagramIcon /> },
  { href: "https://facebook.com/luxemarket", label: "Facebook", icon: <FacebookIcon /> },
  { href: "https://wa.me/923001234567", label: "WhatsApp", icon: <WhatsAppIcon /> },
];

const paymentBadges = ["Visa", "Mastercard", "JazzCash", "EasyPaisa", "COD"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{ backgroundColor: "#1B3A5C" }}
      className="text-white"
      aria-label="Site footer"
    >
      {/* Inject CSS — zero JS event handlers in this component */}
      <style dangerouslySetInnerHTML={{ __html: footerStyles }} />

      {/* Gold accent line */}
      <div
        className="w-full h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Col 1 · Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl leading-none select-none">⌚</span>
              <span
                className="text-xl font-semibold uppercase"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Garamond', Georgia, serif",
                  letterSpacing: "0.18em",
                  color: "#E8C97A",
                }}
              >
                Luxe Market
              </span>
            </Link>

            <p
              className="text-sm leading-relaxed mb-6 max-w-xs"
              style={{
                color: "#A8BDD1",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
              }}
            >
              Curated luxury at your fingertips — premium watches &amp; refined
              essentials delivered across Pakistan.
            </p>

            {/* Social icons — hover via CSS class, no JS handlers */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="lm-social-btn"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 · Quick Links */}
          <div>
            <h3
              className="text-xs font-semibold uppercase mb-5"
              style={{ color: "#E8C97A", letterSpacing: "0.2em" }}
            >
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="lm-footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 · Customer Service */}
          <div>
            <h3
              className="text-xs font-semibold uppercase mb-5"
              style={{ color: "#E8C97A", letterSpacing: "0.2em" }}
            >
              Customer Service
            </h3>
            <ul className="space-y-3">
              {customerServiceLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="lm-footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 · Contact Info */}
          <div>
            <h3
              className="text-xs font-semibold uppercase mb-5"
              style={{ color: "#E8C97A", letterSpacing: "0.2em" }}
            >
              Get In Touch
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }}>
                  <MapPinIcon />
                </span>
                <span className="text-sm leading-snug" style={{ color: "#A8BDD1" }}>
                  Liberty Market, Gulberg III
                  <br />
                  Lahore, Pakistan
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }}>
                  <PhoneIcon />
                </span>
                <span className="text-sm leading-snug" style={{ color: "#A8BDD1" }}>
                  <a
                    href="https://wa.me/923001234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lm-contact-link"
                  >
                    +92 300 123 4567
                  </a>
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }}>
                  <MailIcon />
                </span>
                <span className="text-sm leading-snug" style={{ color: "#A8BDD1" }}>
                  <a href="mailto:hello@luxemarket.pk" className="lm-contact-link">
                    hello@luxemarket.pk
                  </a>
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }}>
                  <ClockIcon />
                </span>
                <span className="text-sm leading-snug" style={{ color: "#A8BDD1" }}>
                  Mon – Sat: 10 am – 8 pm
                  <br />
                  Sun: 12 pm – 6 pm (PKT)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-center sm:text-left" style={{ color: "#6B8FAF" }}>
            © {currentYear} Luxe Market. All rights reserved. Made with ♥ in Pakistan.
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "#6B8FAF" }}
            >
              <ShieldCheckIcon />
              Secure Payments:
            </span>
            {paymentBadges.map((badge) => (
              <span
                key={badge}
                className="px-2 py-0.5 rounded font-medium"
                style={{
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#C9A84C",
                  fontSize: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}