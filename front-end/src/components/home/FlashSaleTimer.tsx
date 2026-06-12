"use client";

import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FlashSaleTimerProps {
  endTime?: string | null;
  isActive?: boolean;
  href?: string;
  title?: string;
  subtitle?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function calcTimeLeft(endMs: number): TimeLeft | null {
  const diff = endMs - Date.now();
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
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 250);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div
      className="flex min-w-[72px] flex-col items-center rounded-sm px-5 py-4"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(201,168,76,0.3)",
        backdropFilter: "blur(4px)",
      }}
    >
      <span
        className={`block text-4xl font-bold leading-none transition-all duration-200 ${
          animate ? "scale-90 opacity-60" : "scale-100 opacity-100"
        }`}
        style={{
          color: "#F5F0E8",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        {value}
      </span>
      <span
        className="mt-2 text-[10px] uppercase tracking-[0.22em]"
        style={{
          color: "#C9A84C",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function FlashSaleTimer({
  endTime,
  isActive = true,
  href = "/sale",
  title = "Flash Sale",
  subtitle = "Prices drop at midnight — grab yours before it's gone.",
}: FlashSaleTimerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const endMs = useMemo(() => {
    if (!endTime) return null;
    const parsed = new Date(endTime).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [endTime]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!isActive || !endMs) {
      setTimeLeft(null);
      return;
    }
    const update = () => setTimeLeft(calcTimeLeft(endMs));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [endMs, isActive]);

  if (!isActive || !endMs) return null;

  const ended = timeLeft === null;

  const segments = ended
    ? []
    : [
        { value: pad(timeLeft.days), label: "Days" },
        { value: pad(timeLeft.hours), label: "Hours" },
        { value: pad(timeLeft.minutes), label: "Minutes" },
        { value: pad(timeLeft.seconds), label: "Seconds" },
      ];

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden px-4 py-16"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Gold top/bottom borders */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Eyebrow */}
        <p
          className="mb-3 text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}
        >
          Limited Time Offer
        </p>

        {/* Title */}
        <h2
          className="mb-2 text-4xl font-bold md:text-5xl"
          style={{
            color: "#F5F0E8",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          {title}
        </h2>

        {/* Gold underline */}
        <div
          className="mx-auto mt-3 mb-4 h-px w-16"
          style={{ backgroundColor: "#C9A84C" }}
        />

        {/* Subtitle */}
        <p
          className="mb-10 text-sm italic md:text-base"
          style={{ color: "#A8BDD1", fontFamily: "'DM Sans', sans-serif" }}
        >
          {subtitle}
        </p>

        {/* Ended */}
        {ended ? (
          <div
            className="inline-block rounded-sm px-8 py-6"
            style={{
              border: "1px solid rgba(201,168,76,0.3)",
              backgroundColor: "rgba(201,168,76,0.05)",
            }}
          >
            <p
              className="text-3xl font-bold"
              style={{ color: "#F5F0E8", fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Sale Ended
            </p>
            <p
              className="mt-2 text-xs uppercase tracking-[0.18em]"
              style={{ color: "#C9A84C" }}
            >
              Thank you for shopping
            </p>
          </div>
        ) : (
          <>
            {/* Timer */}
            <div className="flex flex-wrap items-start justify-center gap-3 md:gap-5">
              {segments.map((seg, i) => (
                <Fragment key={seg.label}>
                  <TimerBox value={seg.value} label={seg.label} />
                  {i < segments.length - 1 && (
                    <span
                      aria-hidden
                      className="hidden self-center pb-5 text-3xl font-bold md:block"
                      style={{ color: "#C9A84C" }}
                    >
                      :
                    </span>
                  )}
                </Fragment>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10">
              <Link
                href={href}
                className="inline-block rounded-sm px-10 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(201,168,76,0.4)]"
                style={{
                  backgroundColor: "#C9A84C",
                  color: "#0a0a0a",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                Shop the Sale →
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
}
