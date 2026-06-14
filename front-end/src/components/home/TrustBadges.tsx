"use client";

import { Fragment, useRef } from "react";
import { Truck, Shield, Package, RefreshCw } from "lucide-react";
import { motion, useInView } from "framer-motion";

const badges = [
  {
    icon: Truck,
    title: "Free Delivery",
    subtitle: "On orders over PKR 3,000",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    subtitle: "100% encrypted checkout",
  },
  {
    icon: Package,
    title: "Discreet Packaging",
    subtitle: "Your privacy matters",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    subtitle: "7-day hassle-free policy",
  },
];

export default function TrustBadges() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="relative px-4 py-12 bg-brand-dark-secondary">
      {/* Gold top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />
      {/* Gold bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />

      <div ref={ref} className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <Fragment key={badge.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col items-center text-center gap-3 px-4 py-6 group"
              >
                {/* Icon container */}
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-sm transition-all duration-300 group-hover:shadow-[0_0_16px_rgba(201,168,76,0.3)] border border-brand-gold/30"
                  style={{
                    backgroundColor: "rgba(201,168,76,0.05)",
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className="text-brand-gold"
                  />
                </div>

                <p
                  className="font-semibold text-sm tracking-wide text-brand-text-light"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {badge.title}
                </p>
                <p
                  className="text-xs leading-relaxed max-w-[120px] mx-auto text-brand-text-muted"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {badge.subtitle}
                </p>
              </motion.div>

              {/* Vertical divider between badges — desktop only */}
              {index < badges.length - 1 && (
                <div className="hidden md:block w-px self-stretch my-4 bg-brand-gold/15" />
              )}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
