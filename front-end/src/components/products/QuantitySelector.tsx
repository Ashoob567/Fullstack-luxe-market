'use client';

interface QuantitySelectorProps {
  quantity: number;
  maxQty: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function QuantitySelector({ quantity, maxQty, onIncrease, onDecrease }: QuantitySelectorProps) {
  return (
    <div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: '0.85rem',
          color: '#5C4A32',
          marginBottom: '8px',
        }}
      >
        Quantity
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1.5px solid #E8E0D5',
          borderRadius: '10px',
          width: 'fit-content',
          padding: '4px',
        }}
      >
        <button
          onClick={onDecrease}
          disabled={quantity <= 1}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'transparent',
            color: '#3D2F1F',
            border: 'none',
            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
            opacity: quantity <= 1 ? 0.3 : 1,
            fontWeight: 600,
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (quantity > 1) (e.currentTarget as HTMLButtonElement).style.background = '#F0EBE3';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          aria-label="Decrease quantity"
        >
          −
        </button>

        <span
          style={{
            minWidth: '40px',
            textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            color: '#3D2F1F',
          }}
        >
          {quantity}
        </span>

        <button
          onClick={onIncrease}
          disabled={quantity >= maxQty}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'transparent',
            color: '#3D2F1F',
            border: 'none',
            cursor: quantity >= maxQty ? 'not-allowed' : 'pointer',
            opacity: quantity >= maxQty ? 0.3 : 1,
            fontWeight: 600,
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (quantity < maxQty) (e.currentTarget as HTMLButtonElement).style.background = '#F0EBE3';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
