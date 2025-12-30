import Image from "next/image";
import answerBookTitle from "@/assets/images/answer-book.png";

export function AnswerHeader() {
  return (
    <header className="space-y-4 text-center text-[#fcebb8] px-4">
      <div className="flex justify-center">
        <Image
          src={answerBookTitle}
          alt="Answer Book"
          width={200}
          height={66}
          priority
          className="h-auto w-[180px] sm:w-[200px]"
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 text-xs text-[#FFED95] sm:text-sm md:flex-row">
        <GradientLine direction="left" />
        <div className="space-y-1 text-center">
          <p>One page of answers, a little starlight.</p>
          <p>For self-reflection and fun only — not professional advice.</p>
        </div>
        <GradientLine direction="right" />
      </div>
    </header>
  );
}

function GradientLine({ direction }: { direction: "left" | "right" }) {
  const gradientId =
    direction === "left" ? "answer-gradient-left" : "answer-gradient-right";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="106"
      height="5"
      viewBox="0 0 106 5"
      fill="none"
      className="hidden md:block"
    >
      <path
        d={
          direction === "left"
            ? "M100.669 0C101.432 1.24743 102.765 1.87279 103.904 2.18719V2.19082C105.051 2.49842 106 2.49818 106 2.49818C106 2.49818 105.051 2.49843 103.904 2.81281C102.765 3.12383 101.432 3.7458 100.669 5C100.3 3.87432 99.3671 3.23877 98.5905 2.88379C98.0852 3.10015 97.5865 3.44144 97.2576 3.97557C97.1626 3.6714 96.9931 3.42806 96.7999 3.23539C96.6948 3.13229 96.5799 3.042 96.4575 2.96467H0V2.02839H96.4644C96.5059 2.00167 96.5467 1.97372 96.5863 1.94388C96.8677 1.72416 97.1287 1.43003 97.2576 1.02443C97.5865 1.55517 98.0853 1.89663 98.5905 2.10961C99.3671 1.76139 100.3 1.12571 100.669 0Z"
            : "M5.33076 0C4.56775 1.24743 3.23502 1.87279 2.09561 2.18719V2.19082C0.949478 2.49842 -7.62939e-06 2.49818 -7.62939e-06 2.49818C-7.62939e-06 2.49818 0.949448 2.49843 2.09561 2.81281C3.23502 3.12383 4.56775 3.7458 5.33076 5C5.70037 3.87432 6.63295 3.23877 7.40948 2.88379C7.91476 3.10015 8.41348 3.44144 8.74242 3.97557C8.83737 3.6714 9.00685 3.42806 9.2001 3.23539C9.30521 3.13229 9.42014 3.042 9.54252 2.96467H106V2.02839H9.53557C9.49413 2.00167 9.45327 1.97372 9.4137 1.94388C9.13228 1.72416 8.87129 1.43003 8.74242 1.02443C8.41348 1.55517 7.91475 1.89663 7.40948 2.10961C6.63293 1.76139 5.70038 1.12571 5.33076 0Z"
        }
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="2.5"
          x2="106"
          y2="2.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor="#FFED95"
            stopOpacity={direction === "left" ? 0 : 1}
          />
          <stop
            offset="1"
            stopColor="#FFED95"
            stopOpacity={direction === "left" ? 1 : 0}
          />
        </linearGradient>
      </defs>
    </svg>
  );
}
