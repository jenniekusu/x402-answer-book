"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type TimeSelectProps = {
  label?: React.ReactNode;
  required?: boolean;
  value: string; // "HH:mm"
  onChange: (next: string) => void;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
  stepMinutes?: number; // default 5
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildTimes(stepMinutes: number) {
  const out: string[] = [];
  const step = Math.max(1, Math.min(60, Math.floor(stepMinutes)));
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += step) {
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return out;
}

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

export const TimeSelect: React.FC<TimeSelectProps> = ({
  label,
  required,
  value,
  onChange,
  error,
  placeholder = "Select time",
  disabled,
  stepMinutes = 5,
}) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const times = useMemo(() => buildTimes(stepMinutes), [stepMinutes]);

  useClickOutside(
    [triggerRef as any, popRef as any],
    () => setOpen(false),
    open
  );

  useEffect(() => {
    if (!open) return;

    // scroll active item into view
    const idx = value ? times.indexOf(value) : -1;
    if (idx >= 0 && listRef.current) {
      const el = listRef.current.querySelector<HTMLElement>(
        `[data-idx="${idx}"]`
      );
      el?.scrollIntoView({ block: "center" });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, value, times]);

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
    "absolute z-[99999] mt-2 w-[220px] rounded-[10px] border",
    "border-[#4a2f1f]/70 bg-[#241a14] shadow-xl",
    "p-2 text-[#fff6d8]",
  ].join(" ");

  return (
    <div className="relative">
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
          {value || placeholder}
        </span>
        <span className="text-[#FFFFFF66] select-none">▾</span>
      </button>

      {open ? (
        <div ref={popRef} className={panelClass}>
          <div
            ref={listRef}
            role="listbox"
            className="max-h-[240px] overflow-y-auto hide-scrollbar"
          >
            {times.map((t, idx) => {
              const active = t === value;
              return (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-idx={idx}
                  className={[
                    "w-full text-left px-3 py-2 rounded-md text-sm transition",
                    active
                      ? "bg-[#FFED95] text-[#241a14] font-semibold"
                      : "hover:bg-[#31251C] hover:text-[#FFED95]",
                  ].join(" ")}
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                >
                  {t}
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
