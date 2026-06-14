import { RotateCcw, ShieldCheck, Package } from 'lucide-react';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex text-[#8B6F47]">{icon}</span>
      <span className="font-['DM_Sans',sans-serif] font-medium text-[0.8rem] text-[#5C4A32]">
        {label}
      </span>
    </div>
  );
}

export function TrustBadges() {
  return (
    <div className="border-t border-[#E8E0D5] pt-5 flex gap-4 flex-wrap">
      <TrustBadge icon={<RotateCcw size={20} />} label="Free Returns" />
      <TrustBadge icon={<ShieldCheck size={20} />} label="Secure Payment" />
      <TrustBadge icon={<Package size={20} />} label="Discreet Packaging" />
    </div>
  );
}
