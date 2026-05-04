"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FlashSaleTimerProps {
  /**
   * ISO date string from backend
   * Example: "2026-05-05T23:59:59Z"
   */
  endTime?: string | null;

  /**
   * Backend flag:
   * product.is_flash_active OR global flash sale active
   */
  isActive?: boolean;

  /**
   * CTA link
   */
  href?: string;

  /**
   * Optional custom text
   */
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

function TimerBox({
  value,
  label,
}: TimerBoxProps) {
  const [animate, setAnimate] =
    useState(false);

  useEffect(() => {
    setAnimate(true);

    const t = setTimeout(() => {
      setAnimate(false);
    }, 250);

    return () => clearTimeout(t);
  }, [value]);

  return (
    <div
      className="flex min-w-[72px] flex-col items-center rounded-xl px-5 py-4 shadow-lg"
      style={{
        background: "#A03020",
      }}
    >
      <span
        className={`block text-4xl font-bold leading-none transition ${
          animate
            ? "scale-95 opacity-70"
            : "scale-100 opacity-100"
        }`}
        style={{
          color: "#ffffff",
          fontFamily:
            "'Georgia','Times New Roman',serif",
        }}
      >
        {value}
      </span>

      <span
        className="mt-2 text-[10px] uppercase tracking-[0.22em]"
        style={{
          color: "#FFB3A7",
          fontFamily:
            "'Georgia','Times New Roman',serif",
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
  href = "/products?flash_sale=true",
  title = "Flash Sale",
  subtitle = "Prices drop at midnight — grab yours before it's gone.",
}: FlashSaleTimerProps) {
  const endMs = useMemo(() => {
    if (!endTime) return null;

    const parsed =
      new Date(endTime).getTime();

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }, [endTime]);

  const [timeLeft, setTimeLeft] =
    useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!isActive || !endMs) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      setTimeLeft(
        calcTimeLeft(endMs)
      );
    };

    update();

    const id =
      window.setInterval(update, 1000);

    return () =>
      window.clearInterval(id);
  }, [endMs, isActive]);

  if (!isActive || !endMs) {
    return null;
  }

  const ended = timeLeft === null;

  const segments = ended
    ? []
    : [
        {
          value: pad(timeLeft.days),
          label: "Days",
        },
        {
          value: pad(timeLeft.hours),
          label: "Hours",
        },
        {
          value: pad(timeLeft.minutes),
          label: "Minutes",
        },
        {
          value: pad(timeLeft.seconds),
          label: "Seconds",
        },
      ];

  return (
    <section className="relative overflow-hidden bg-[#C0392B] px-4 py-14">
      {/* Texture */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_20%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Eyebrow */}
        <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#FFB3A7]">
          Limited Time Offer
        </p>

        {/* Title */}
        <h2
          className="mb-2 text-4xl font-bold md:text-5xl"
          style={{
            color: "#ffffff",
            fontFamily:
              "'Georgia','Times New Roman',serif",
          }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        <p className="mb-10 text-sm italic text-[#FFB3A7] md:text-base">
          {subtitle}
        </p>

        {/* Ended */}
        {ended ? (
          <div className="inline-block rounded-xl bg-[#A03020] px-8 py-6 shadow-xl">
            <p className="text-3xl font-bold text-white">
              Sale Ended
            </p>

            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#FFB3A7]">
              Thank you for shopping
            </p>
          </div>
        ) : (
          <>
            {/* Timer */}
            <div className="flex flex-wrap items-start justify-center gap-3 md:gap-6">
              {segments.map(
                (seg, i) => (
                  <Fragment
                    key={seg.label}
                  >
                    <TimerBox
                      value={
                        seg.value
                      }
                      label={
                        seg.label
                      }
                    />

                    {i <
                      segments.length -
                        1 && (
                      <span
                        aria-hidden
                        className="hidden self-center pb-5 text-4xl font-bold text-white/70 md:block"
                      >
                        :
                      </span>
                    )}
                  </Fragment>
                )
              )}
            </div>

            {/* CTA */}
            <div className="mt-10">
              <Link
                href={href}
                className="inline-block rounded-md bg-white px-8 py-3 text-sm font-semibold text-[#C0392B] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Shop the Sale →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}