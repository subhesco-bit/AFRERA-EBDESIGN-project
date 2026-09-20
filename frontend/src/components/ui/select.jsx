import React, { createContext, useContext, useState } from 'react';

const SelectContext = createContext(null);

/**
 * Hybrid: most callers use the shadcn/Radix-style compound pattern
 * (value/onValueChange + SelectTrigger/SelectContent/SelectItem children -
 * ~13 pages), a few use it as a plain native <select> with onChange and
 * <option> children (~3 pages). onValueChange presence discriminates the
 * two - every real caller in this codebase uses exactly one or the other,
 * never both.
 */
function Select({ value, onValueChange, defaultValue, children, disabled, ...rest }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');

  if (onValueChange === undefined) {
    return (
      <select value={value} disabled={disabled} {...rest}>
        {children}
      </select>
    );
  }

  const currentValue = value !== undefined ? value : internalValue;
  const handleSelect = v => {
    onValueChange(v);
    if (value === undefined) setInternalValue(v);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: currentValue, onSelect: handleSelect, open, setOpen, disabled }}>
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({ children, className = '', ...props }) {
  const ctx = useContext(SelectContext);
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`}
      onClick={() => ctx?.setOpen(!ctx.open)}
      disabled={ctx?.disabled}
      {...props}
    >
      {children}
    </button>
  );
}

function SelectValue({ placeholder = '' }) {
  const ctx = useContext(SelectContext);
  return <span>{ctx?.value || placeholder}</span>;
}

function SelectContent({ children, className = '' }) {
  const ctx = useContext(SelectContext);
  if (!ctx?.open) return null;
  return (
    <div className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-background shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function SelectItem({ value, children, className = '' }) {
  const ctx = useContext(SelectContext);
  const selected = ctx?.value === value;
  return (
    <div
      role="option"
      tabIndex={0}
      aria-selected={selected}
      className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${selected ? 'bg-accent' : ''} ${className}`}
      onClick={() => ctx?.onSelect(value)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ctx?.onSelect(value);
        }
      }}
    >
      {children}
    </div>
  );
}

export default Select;
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Select as NativeSelect };
