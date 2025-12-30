"use client";

import Image from "next/image";
import Link from "next/link";
import logoBg from "@/assets/images/logo.png";
import titleLeft from "@/assets/images/title-left.png";
import titleRight from "@/assets/images/title-right.png";
import titleGraphic from "@/assets/images/title1.png";
import startImg from "@/assets/images/start.png";

export default function Home() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 text-[#F8ECC2]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(248,236,194,0.35),_transparent_60%)] opacity-60" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 px-2 text-center drop-shadow-[0_12px_35px_rgba(0,0,0,0.8)]">
        <div className="relative flex w-full flex-col items-center">
          <Image
            src={logoBg}
            alt=""
            width={526}
            height={526}
            priority
            className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-auto w-[320px] -translate-x-1/2 opacity-65 sm:-top-32 sm:w-[420px]"
          />

          <Image
            src={titleGraphic}
            alt="Today the universe wants to tell you one thing"
            width={980}
            height={180}
            priority
            className="w-full max-w-[320px] -mt-3 sm:max-w-[640px]"
          />
        </div>

        <div
          className="w-full max-w-[566px] rounded-sm p-3 text-left text-sm font-normal leading-relaxed text-white backdrop-blur-[5px] sm:text-base "
          style={{
            background:
              "linear-gradient(90deg, rgba(255, 228, 92, 0.00) 0%, rgba(255, 228, 92, 0.10) 100%)",
          }}
        >
          <div className="mb-2.5 flex justify-center text-lg text-[#FFED95] sm:text-[20px]">
            <p>How it works:</p>
          </div>
          <p>1. Fill in your basic info</p>
          <p>2. Think of the question you care about most right now</p>
          <p className="whitespace-normal ">
            3. Pay 0.0001 USDC on Base Sepolia via x402 to open your answer book
          </p>

          <a
            className="mt-2.5 flex justify-center text-base text-[#FFED95] underline sm:text-[18px]"
            href="https://faucet.circle.com/"
            target="_blank"
          >
            Claim your testnet USDC on Base Sepolia
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-[#F2D38C] sm:mt-20 sm:flex-row">
          <div className="hidden flex-1 flex-row items-center sm:flex">
            <div className="bg-[#FFED95] h-[1px] w-[335px] mr-[-4px]" />
            <Image src={startImg} alt="" width={17} height={13} />
          </div>

          <Link
            href="/setup"
            className="font-hangyaku text-4xl font-normal leading-[120%] text-center text-white transition hover:text-[#FFEAA2] sm:text-[50px]"
          >
            Start
          </Link>
          <div className="hidden flex-1 flex-row items-center sm:flex">
            <Image src={startImg} alt="" width={17} height={13} />
            <div className="bg-[#FFED95] h-[1px] w-[335px] ml-[-4px]"></div>
          </div>
        </div>

        <p className="mt-6 max-w-[520px] text-center text-xs font-inter leading-[140%] text-white opacity-60 sm:text-[12px]">
          For self-reflection and fun only — not professional advice
        </p>
      </div>
    </section>
  );
}
