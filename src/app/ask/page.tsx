"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AnswerHeader } from "@/components/AnswerHeader";
import { NextButton } from "@/components/NextButton";
import { StepPillar } from "@/components/StepPillar";
import { loadProfile, saveQuestion } from "@/lib/clientState";
import boxFrame from "@/assets/images/box.png";
import aBg from "@/assets/images/a-bg.png";
import cBg from "@/assets/images/c-bg.png";
import dBg from "@/assets/images/d-bg.png";
import closeIcon from "@/assets/images/close.png";

export default function AskPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.replace("/setup");
    }
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError("Please take a moment to articulate your question clearly and jot it down here.");
      return;
    }
    if (question.length > 200) {
      setError("Please keep the question within 200 characters.");
      return;
    }

    saveQuestion({ question, category: "random" });
    router.push("/result");
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-16 text-[#fcebb8] ">
      <div className="pointer-events-none absolute inset-0 backdrop-blur-2xl" />
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center space-y-10 px-2 ">
        <Link
          href="/"
          className="absolute right-2 top-2 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full transition sm:right-0 sm:top-0 sm:h-12 sm:w-12"
          aria-label="Close"
        >
          <Image src={closeIcon} alt="" width={48} height={48} />
        </Link>
        <AnswerHeader />

        <div className="flex w-full items-center justify-center ">
          <div className="flex flex-col items-center  gap-8 lg:flex-row lg:items-stretch w-full lg:w-auto ">
            <div className="hidden justify-center lg:flex">
              <StepPillar
                letter="A"
                description="Fill in your info."
                stepNumber="1"
                background={aBg}
                state="complete"
              />
            </div>

            <div
              className="h-auto w-full max-w-[480px] rounded-3xl p-6 sm:p-8"
              style={{
                backgroundImage: `url(${boxFrame.src})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            >
              <div className="">
                <p className="text-[18px] font-black text-[#FFED95]">
                  Now, ask your question.
                </p>
                <p className="text-[12px] text-white opacity-60 mt-2">
                  You can describe a specific situation, or just write a
                  keyword. What matters is being honest with yourself and
                  thinking: "I want to know...?"
                </p>
                <p className="text-[14px]  text-[#FFED95] mt-6">
                  Your question (up to 200 characters)
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-3 ">
                <div>
                  <textarea
                    className="min-h-[228px] rounded-[6px]  w-full resize-none  bg-[#292929] p-3 text-sm text-[#fff6d8] placeholder:text-white/40  focus:outline-none"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={200}
                    placeholder="Please enter…"
                  />
                </div>

                {/* {error ? (
                  <p className="text-xs text-[#f7b9a0]">{error}</p>
                ) : null} */}

                <NextButton type="submit" />
              </form>
            </div>

            <div className="hidden flex-wrap justify-center gap-4 lg:flex">
              <StepPillar
                letter="C"
                description="Open this round's book of answers."
                stepNumber="3"
                background={cBg}
              />
              <StepPillar
                letter="D"
                description="Open this round's book of answers."
                stepNumber="4"
                background={dBg}
              />
            </div>

            <div className="flex w-full gap-4 overflow-x-auto pb-2 lg:hidden">
              <StepPillar
                letter="A"
                description="Fill in your info."
                stepNumber="1"
                background={aBg}
                state="complete"
              />
              <StepPillar
                letter="C"
                description="Open this round's book of answers."
                stepNumber="3"
                background={cBg}
              />
              <StepPillar
                letter="D"
                description="Open this round's book of answers."
                stepNumber="4"
                background={dBg}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
