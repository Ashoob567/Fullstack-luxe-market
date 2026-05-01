import { Truck, Shield, Package, RefreshCw } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Free Delivery",
    subtitle: "On orders over PKR 2,000",
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
  return (
    <section className="bg-[#F5F3EF] border-y border-[#E2D9CC] py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <>
              <div
                key={badge.title}
                className="flex flex-col items-center text-center gap-2"
              >
                <Icon
                  size={32}
                  className="text-[#1B3A5C]"
                  strokeWidth={1.5}
                />
                <p className="font-medium text-sm text-[#2C2416]">
                  {badge.title}
                </p>
                <p className="text-xs text-[#9A8870] max-w-[120px] mx-auto leading-relaxed">
                  {badge.subtitle}
                </p>
              </div>

              {/* Vertical divider between badges — desktop only */}
              {index < badges.length - 1 && (
                <div className="hidden md:block w-px bg-[#D8CFC0] self-stretch" />
              )}
            </>
          );
        })}
      </div>
    </section>
  );
}