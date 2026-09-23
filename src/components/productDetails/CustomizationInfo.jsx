import { CheckCircle2, XCircle } from 'lucide-react';

// Server Component — two static rows, no interactivity, no client JS.
function Row({ available, label, note }) {
  return (
    <div className="flex items-start gap-2.5">
      {available ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
      ) : (
        <XCircle size={18} className="mt-0.5 shrink-0 text-text-muted/50" />
      )}
      <div>
        <p className={`text-sm font-medium ${available ? 'text-text' : 'text-text-muted'}`}>
          {label}
        </p>
        {available && note && <p className="text-xs text-text-muted">{note}</p>}
      </div>
    </div>
  );
}

export default function CustomizationInfo({ font, patch }) {
  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-border bg-white p-4">
      <Row
        available={Boolean(font)}
        label="Custom name & number"
        note="Add your name on the back for +150৳ at checkout."
      />
      <Row available={Boolean(patch)} label="Official patch" note="See patch options below." />
    </div>
  );
}