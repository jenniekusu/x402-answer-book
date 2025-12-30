import type { ButtonHTMLAttributes, ReactNode } from "react";
import buttonBg from "@/assets/images/button.png";

type NextButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  containerClassName?: string;
};

export function NextButton({
  children = "Next",
  className = "",
  containerClassName = "",
  ...props
}: NextButtonProps) {
  return (
    <div className={`mt-4 flex w-full justify-center ${containerClassName}`}>
      <button
        {...props}
        className={`cursor-pointer inline-flex h-[48px] w-full max-w-[220px] items-center justify-center rounded-md px-6 text-lg font-bold sm:h-[52px] sm:text-[24px] ${className}`}
        style={{
          backgroundImage: `url(${buttonBg.src})`,
          backgroundSize: "100% 100%",
        }}
      >
        {children}
      </button>
    </div>
  );
}
