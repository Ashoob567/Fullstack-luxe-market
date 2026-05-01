"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner"; 

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
 
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
    <section className="bg-[#2C2416] py-20 px-4 text-center">
      <p className="text-xs uppercase tracking-widest text-[#B5A98A] mb-3">Stay in the Loop</p>
 
      <h2
        className="font-bold text-4xl text-[#F5F0E8]"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Get Exclusive Offers
      </h2>
 
      <p className="text-sm text-[#B5A98A] mt-2 mb-10 max-w-sm mx-auto leading-relaxed">
        Early access to new arrivals, member-only discounts, and style notes delivered quietly to
        your inbox.
      </p>
 
      <div className="flex max-w-md mx-auto gap-0">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
          placeholder="your@email.com"
          className="flex-1 bg-[#F5F0E8] text-[#2C2416] px-5 py-3.5 rounded-l-md border-0 outline-none placeholder-[#9A8870] text-sm"
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="bg-[#1B3A5C] text-white px-7 py-3.5 rounded-r-md font-medium text-sm hover:bg-[#15304E] transition-colors duration-200 disabled:opacity-70 flex items-center gap-2"
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
    </section>
  );
}

 export default NewsletterSection