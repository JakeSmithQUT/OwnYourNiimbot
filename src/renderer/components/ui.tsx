import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal(props: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; icon?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}>
      <div className={`modal${props.wide ? ' wide' : ''}`} role="dialog" aria-modal="true">
        <header>
          {props.icon}
          <h2>{props.title}</h2>
          <button className="btn ghost icon" onClick={props.onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="body">{props.children}</div>
        {props.footer && <footer>{props.footer}</footer>}
      </div>
    </div>
  );
}

export function Field(props: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
      {props.hint && <small className="muted">{props.hint}</small>}
    </div>
  );
}

/** Number input that keeps the text while the user types and commits on blur or Enter. */
export function NumberInput(props: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  disabled?: boolean;
}) {
  const fmt = (v: number) => (Number.isFinite(v) ? String(Number(v.toFixed(props.decimals ?? 1))) : '');
  const [text, setText] = useState(fmt(props.value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt(props.value));
  }, [props.value, focused]);

  const commit = () => {
    let v = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(v)) {
      setText(fmt(props.value));
      return;
    }
    if (props.min !== undefined) v = Math.max(props.min, v);
    if (props.max !== undefined) v = Math.min(props.max, v);
    props.onChange(v);
    setText(fmt(v));
  };

  return (
    <div className="unit-input">
      <input
        type="number"
        value={text}
        step={props.step ?? 0.1}
        min={props.min}
        max={props.max}
        disabled={props.disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onChange={(e) => {
          setText(e.target.value);
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v) && (props.min === undefined || v >= props.min) && (props.max === undefined || v <= props.max)) {
            props.onChange(v);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          e.stopPropagation();
        }}
      />
      {props.unit && <span>{props.unit}</span>}
    </div>
  );
}

export function Segmented<T extends string>(props: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {props.options.map((o) => (
        <button key={o.value} className={o.value === props.value ? 'on' : ''} title={o.title} onClick={() => props.onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Check(props: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <span>{props.children}</span>
    </label>
  );
}

/** Text input that does not pass key presses to the editor shortcuts. */
export function TextInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const common = {
    value: props.value,
    placeholder: props.placeholder,
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };
  return props.multiline ? (
    <textarea {...common} onChange={(e) => props.onChange(e.target.value)} />
  ) : (
    <input type="text" {...common} onChange={(e) => props.onChange(e.target.value)} />
  );
}
