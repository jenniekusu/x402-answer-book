"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type DatePickerProps = {
  label?: React.ReactNode;
  required?: boolean;
  value: string; // "YYYY-MM-DD"
  onChange: (next: string) => void;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 101 }, (_, idx) => CURRENT_YEAR - idx).sort(
  (a, b) => a - b
);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function parseISODate(value: string): Date | null {
  // expects YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  // validate round-trip
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d)
    return null;
  return dt;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
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

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  required,
  value,
  onChange,
  error,
  placeholder = "Select date",
  disabled,
}) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => parseISODate(value), [value]);

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    return selected ? startOfMonth(selected) : startOfMonth(new Date());
  });

  // keep calendar view in sync when external value changes
  useEffect(() => {
    if (selected) setViewMonth(startOfMonth(selected));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const grid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const firstDow = first.getDay(); // 0..6
    const dim = daysInMonth(viewMonth);

    // 6 rows * 7 columns
    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    // leading days from prev month
    const prevMonth = addMonths(viewMonth, -1);
    const prevDim = daysInMonth(prevMonth);
    for (let i = firstDow - 1; i >= 0; i--) {
      const day = prevDim - i;
      cells.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
        inMonth: false,
      });
    }
    // current month
    for (let day = 1; day <= dim; day++) {
      cells.push({
        date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day),
        inMonth: true,
      });
    }
    // trailing days to fill 42
    const nextMonth = addMonths(viewMonth, 1);
    while (cells.length < 42) {
      const day = cells.length - (firstDow + dim) + 1; // 1-based
      cells.push({
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day),
        inMonth: false,
      });
    }
    return cells;
  }, [viewMonth]);

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
    "absolute z-[99999] mt-2 w-[320px] rounded-[10px] border",
    "border-[#4a2f1f]/70 bg-[#241a14] shadow-xl",
    "p-3 text-[#fff6d8]",
  ].join(" ");

  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();

  const handleYearSelect = (nextYear: number) => {
    setViewMonth(new Date(nextYear, m, 1));
  };

  const handleMonthSelect = (nextMonth: number) => {
    setViewMonth(new Date(y, nextMonth, 1));
  };

  return (
    <div className="relative">
      {label ? <p className="text-xs text-[#FFED95]">{label}</p> : null}

      <button
        type="button"
        ref={triggerRef}
        className={inputClass}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={value ? "text-[#fff6d8]" : "text-[#FFFFFF66]"}>
          {selected ? value : placeholder}
        </span>

        {/* caret */}
        <span className="text-[#FFFFFF66] select-none">▾</span>
      </button>

      {open ? (
        <div
          ref={popRef}
          className={panelClass}
          role="dialog"
          aria-label="Date picker"
        >
          {/* header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-md border border-[#4a2f1f]/70 hover:border-[#FFED95] hover:bg-[#31251C] transition"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                aria-label="Previous month"
              >
                ‹
              </button>

              <div className="text-sm font-semibold text-[#FFED95]">
                {MONTHS_EN[m]} {y}
              </div>

              <button
                type="button"
                className="h-8 w-8 rounded-md border border-[#4a2f1f]/70 hover:border-[#FFED95] hover:bg-[#31251C] transition"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="flex w-full gap-2">
              <select
                className="flex-1 rounded-md border border-[#4a2f1f]/70 bg-[#31251C] px-2 py-1 text-sm text-[#fff6d8] focus:border-[#FFED95] focus:outline-none"
                value={m}
                onChange={(e) => handleMonthSelect(Number(e.target.value))}
              >
                {MONTHS_EN.map((monthLabel, idx) => (
                  <option key={monthLabel} value={idx}>
                    {monthLabel}
                  </option>
                ))}
              </select>

              <select
                className="flex-1 rounded-md border border-[#4a2f1f]/70 bg-[#31251C] px-2 py-1 text-sm text-[#fff6d8] focus:border-[#FFED95] focus:outline-none"
                value={y}
                onChange={(e) => handleYearSelect(Number(e.target.value))}
              >
                {YEARS.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* weekdays */}
          <div className="mt-3 grid grid-cols-7 gap-1 text-[11px] text-[#FFFFFF99]">
            {WEEKDAYS_EN.map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* days */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map(({ date, inMonth }, idx) => {
              const iso = toISODate(date);
              const isSelected = value === iso;
              const isToday = toISODate(new Date()) === iso;

              const cls = [
                "h-9 rounded-md text-sm",
                "transition select-none",
                inMonth ? "text-[#fff6d8]" : "text-[#FFFFFF66]",
                isSelected
                  ? "bg-[#FFED95] text-[#241a14] font-semibold"
                  : "hover:bg-[#31251C] hover:text-[#FFED95]",
                isToday && !isSelected ? "border border-[#FFED95]/40" : "",
              ].join(" ");

              return (
                <button
                  key={`${iso}-${idx}`}
                  type="button"
                  className={cls}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* footer */}
          <div className="mt-3 flex items-center justify-between">
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
