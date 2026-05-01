"use client";

import { useEffect, useRef, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function calcTimeLeft(endTime: number): TimeLeft | null {
  const diff = endTime - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface TimerBoxProps {
  value: string;
  label: string;
}

function TimerBox({ value, label }: TimerBoxProps) {
  const prevValue = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 300);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className="flex flex-col items-center"
      style={{
        background: "#A03020",
        borderRadius: "12px",
        padding: "16px 20px",
        minWidth: "72px",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.07)",
        transition: "transform 0.15s",
      }}
    >
      <span
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontWeight: 700,
          fontSize: "clamp(2.5rem, 5vw, 3rem)",
          color: "#ffffff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          display: "block",
          transition: "opacity 0.15s, transform 0.15s",
          opacity: flip ? 0.3 : 1,
          transform: flip ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#FFB3A7",
          marginTop: "8px",
          fontFamily: "'Georgia', serif",
          fontWeight: 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function FlashSaleTimer() {
  const endTimeRef = useRef<number>(Date.now() + 24 * 60 * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(endTimeRef.current)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(endTimeRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const ended = timeLeft === null;

  const segments = ended
    ? []
    : [
        { value: pad(timeLeft!.days), label: "Days" },
        { value: pad(timeLeft!.hours), label: "Hours" },
        { value: pad(timeLeft!.minutes), label: "Minutes" },
        { value: pad(timeLeft!.seconds), label: "Seconds" },
      ];

  return (
    <section
      style={{
        background: "#C0392B",
        width: "100%",
        padding: "56px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      {/* Decorative diagonal stripe — top-left corner */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "180px",
          height: "180px",
          background:
            "repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 10px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "768px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#FFB3A7",
            marginBottom: "12px",
            fontFamily: "'Georgia', serif",
          }}
        >
          Limited Time Offer
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: "clamp(2.25rem, 6vw, 3rem)",
            color: "#ffffff",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Flash Sale
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "14px",
            color: "#FFB3A7",
            marginBottom: "40px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}
        >
          Prices drop at midnight — grab yours before it&apos;s gone.
        </p>

        {/* Timer row or ended state */}
        {ended ? (
          <div
            style={{
              background: "#A03020",
              borderRadius: "12px",
              padding: "24px 32px",
              display: "inline-block",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            }}
          >
            <span
              style={{
                fontFamily: "'Georgia', serif",
                fontWeight: 700,
                fontSize: "2rem",
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              Sale Ended
            </span>
            <p
              style={{
                fontSize: "12px",
                color: "#FFB3A7",
                marginTop: "6px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Thank you for shopping with us
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: "clamp(12px, 3vw, 32px)",
              flexWrap: "wrap",
            }}
          >
            {segments.map((seg, i) => (
              <>
                <TimerBox key={seg.label} value={seg.value} label={seg.label} />
                {i < segments.length - 1 && (
                  <span
                    key={`sep-${i}`}
                    aria-hidden
                    style={{
                      color: "#ffffff",
                      fontSize: "2rem",
                      fontWeight: 700,
                      alignSelf: "center",
                      marginBottom: "18px",
                      opacity: 0.7,
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1,
                    }}
                  >
                    :
                  </span>
                )}
              </>
            ))}
          </div>
        )}

        {/* CTA */}
        {!ended && (
          <div style={{ marginTop: "40px" }}>
            <a
              href="#"
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#C0392B",
                fontWeight: 600,
                fontSize: "14px",
                padding: "14px 32px",
                borderRadius: "6px",
                textDecoration: "none",
                letterSpacing: "0.03em",
                fontFamily: "'Georgia', serif",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 6px 20px rgba(0,0,0,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 2px 12px rgba(0,0,0,0.15)";
              }}
            >
              Shop the Sale →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}