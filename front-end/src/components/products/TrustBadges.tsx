import { RotateCcw, ShieldCheck, Package } from 'lucide-react';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: '#8B6F47', display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: '0.8rem',
          color: '#5C4A32',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function TrustBadges() {
  return (
    <div
      style={{
        borderTop: '1px solid #E8E0D5',
        paddingTop: '20px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <TrustBadge icon={<RotateCcw size={20} />} label="Free Returns" />
      <TrustBadge icon={<ShieldCheck size={20} />} label="Secure Payment" />
      <TrustBadge icon={<Package size={20} />} label="Discreet Packaging" />
    </div>
  );
}
