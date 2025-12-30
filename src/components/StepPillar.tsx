import Image from "next/image";
import type { StaticImageData } from "next/image";
import letterA from "@/assets/images/A.png";
import letterB from "@/assets/images/B.png";
import letterC from "@/assets/images/C.png";
import letterD from "@/assets/images/D.png";
import arrowDown from "@/assets/images/arrow-down.png";
import completeBadge from "@/assets/images/complete.png";

type StepState = "complete" | "current" | "upcoming";

type StepPillarProps = {
  letter: string;
  description: string;
  stepNumber: string;
  background: StaticImageData;
  state?: StepState;
};

export function StepPillar({
  letter,
  description,
  stepNumber,
  background,
  state = "upcoming",
}: StepPillarProps) {
  const letterImages: Record<string, StaticImageData> = {
    A: letterA,
    B: letterB,
    C: letterC,
    D: letterD,
  };

  const letterAsset = letterImages[letter.toUpperCase()] ?? letterA;

  const aspectWidth = background.width ?? 138;
  const aspectHeight = background.height ?? 500;

  const baseWidth = background.width ?? 138;

  return (
    <div
      className="relative isolate flex flex-col items-center justify-between px-4 py-6 text-center text-[#fbe8c1]"
      style={{
        backgroundImage: `url(${background.src})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        aspectRatio: `${aspectWidth} / ${aspectHeight}`,
        width: `min(32vw, ${baseWidth}px)`,
        minWidth: "110px",
        maxWidth: `${baseWidth}px`,
      }}
    >
      {/* {state === "complete" && (
        <div className="pointer-events-none absolute inset-0  bg-black/40 z-0" />
      )} */}
      <div className="relative z-10 flex h-full w-full flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center">
          <Image src={arrowDown} alt="" width={62} height={62} />
        </div>
        <div className=" w-[64px] h-[96px] text-4xl font-semibold tracking-wide text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]">
          <Image
            src={letterAsset}
            alt={letter}
            width={64}
            height={96}
            priority
          />
        </div>

        <div
          className="h-[180px] text-center text-[16px] font-bold leading-tight text-[#B1B1B1] sm:text-[18px] md:h-[204px] md:text-[20px]"
          style={{
            textShadow: "0 0 4px rgba(255,255,255,0.43)",
            marginBottom: state === "complete" ? "22px" : "72px",
          }}
        >
          {description
            .split(/\s+/)
            .filter(Boolean)
            .map((word, index) => (
              <span key={`${word}-${index}`} className="block mt-3">
                {word}
              </span>
            ))}
        </div>

        {state === "complete" && (
          <Image
            src={completeBadge}
            alt="Complete"
            width={105}
            height={78}
            className="absolute left-1/2 translate-x-[-50%] bottom-0"
          />
        )}
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[20px] font-bold text-white">
        {stepNumber}
      </div>
    </div>
  );
}
