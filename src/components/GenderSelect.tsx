"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type GenderValue = "" | "F" | "M" | "O";

type GenderSelectProps = {
  label?: React.ReactNode;
  required?: boolean;
  value: GenderValue;
  onChange: (next: GenderValue) => void;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

function useClickOutside(
  refs: React.RefObject<HTMLElement>[],
  onOutside: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      for (const r of refs) {
        if (r.current && r.current.contains(target)) return;
      }
      onOutside();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [enabled, onOutside, refs]);
}

export const GenderSelect: React.FC<GenderSelectProps> = ({
  label,
  required,
  value,
  onChange,
  error,
  placeholder = "Select one",
  disabled,
}) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      [
        { value: "F" as const, label: "Female" },
        { value: "M" as const, label: "Male" },
        { value: "O" as const, label: "Prefer not to say" },
      ] as const,
    []
  );

  const valueLabel = options.find((o) => o.value === value)?.label ?? "";

  useClickOutside(
    [triggerRef as any, popRef as any],
    () => setOpen(false),
    open
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const inputClass = [
    "mt-3 w-full rounded-[6px] border px-3 py-2 text-sm",
    "text-[#fff6d8] bg-[#31251C] focus:outline-none",
    error
      ? "border-red-500 focus:border-red-300"
      : "border-[#4a2f1f]/70 focus:border-[#FFED95]",
    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
    "flex items-center justify-between gap-3",
  ].join(" ");

  const panelClass = [
    "absolute z-[99999] mt-2 w-full min-w-[220px] rounded-[10px] border",
    "border-[#4a2f1f]/70 bg-[#241a14] shadow-xl",
    "p-2 text-[#fff6d8]",
  ].join(" ");

  return (
    <div className="relative ">
      {label ? <p className="text-xs text-[#FFED95]">{label}</p> : null}

      <button
        type="button"
        ref={triggerRef}
        className={inputClass}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={value ? "text-[#fff6d8]" : "text-[#FFFFFF66]"}>
          {value ? valueLabel : placeholder}
        </span>
        <span className="text-[#FFFFFF66] select-none">▾</span>
      </button>

      {open ? (
        <div ref={popRef} className={panelClass}>
          <div role="listbox" className="flex flex-col gap-1">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={[
                    "w-full text-left px-3 py-2 rounded-md text-sm transition",
                    active
                      ? "bg-[#FFED95] text-[#241a14] font-semibold"
                      : "hover:bg-[#31251C] hover:text-[#FFED95]",
                  ].join(" ")}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-2 pt-2">
            <button
              type="button"
              className="text-[12px] text-[#FFFFFF99] hover:text-[#FFED95] transition"
              onClick={() => onChange("")}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-[12px] text-[#FFFFFF99] hover:text-[#FFED95] transition"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
