"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { toast } from "sonner";

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  async function handleSubscribe() {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      toast.success("You're subscribed! 🎉");
      setEmail("");
    } catch {
      toast.error("Something went wrong, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-24 px-4 text-center overflow-hidden bg-brand-dark"
    >
      {/* Radial gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Gold top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto">
        <p
          className="text-xs uppercase tracking-[0.3em] mb-3 text-brand-gold font-['DM_Sans']"
        >
          Stay in the Loop
        </p>

        <h2
          className="font-bold text-4xl md:text-5xl text-brand-text-light font-['Playfair_Display']"
        >
          Get Exclusive Offers
        </h2>

        {/* Gold divider */}
        <div
          className="mx-auto mt-4 mb-4 h-px w-16 bg-brand-gold"
        />

        <p
          className="text-sm leading-relaxed mb-10 text-brand-text-muted font-['DM_Sans']"
        >
          Early access to new arrivals, member-only discounts, and style notes
          delivered quietly to your inbox.
        </p>

        <div className="flex max-w-md mx-auto gap-0 rounded-sm overflow-hidden border border-brand-gold/30">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
            placeholder="your@email.com"
            className="flex-1 px-5 py-3.5 text-sm outline-none bg-brand-dark-secondary text-brand-text-light font-['DM_Sans']"
          />
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-7 py-3.5 font-medium text-sm transition-all duration-200 disabled:opacity-70 flex items-center gap-2 hover:shadow-[0_0_16px_rgba(201,168,76,0.4)] bg-brand-gold text-brand-dark font-['DM_Sans'] tracking-wider"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Subscribing…
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </div>
      </div>
    </motion.section>
  );
}

export default NewsletterSection;
