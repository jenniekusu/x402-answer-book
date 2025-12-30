"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Profile, saveProfile } from "@/lib/clientState";
import boxFrame from "@/assets/images/box.png";
import bBg from "@/assets/images/b-bg.png";
import cBg from "@/assets/images/c-bg.png";
import dBg from "@/assets/images/d-bg.png";
import closeIcon from "@/assets/images/close.png";
import {
  DatePicker,
  GenderSelect,
  TimeSelect,
  AnswerHeader,
  StepPillar,
  NextButton,
} from "@/components";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<Profile>({
    name: "",
    birthDate: "",
    birthTime: "",
    gender: "",
    birthPlace: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  function handleChange(field: keyof Profile, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setShowErrors(true);

    if (
      !form.name.trim() ||
      !form.birthDate ||
      !form.birthTime ||
      !form.gender ||
      !form.birthPlace.trim()
    ) {
      setError(
        "Please fill out name, gender, birth date, birth time, and birthplace."
      );
      return;
    }

    saveProfile(form);
    router.push("/ask");
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-16 text-[#fcebb8]">
      <div className="pointer-events-none absolute inset-0 backdrop-blur-2xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center space-y-10 px-2">
        <Link
          href="/"
          className="absolute right-2 -top-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full transition sm:h-12 sm:w-12 sm:right-0 sm:-top-2"
          aria-label="Close"
        >
          <Image src={closeIcon} alt="" width={48} height={48} />
        </Link>
        <AnswerHeader />

        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-stretch">
          <div className="flex w-full justify-center">
            <div
              className="h-auto w-full max-w-[480px] rounded-3xl p-6 text-[#fef3cf] sm:p-8"
              style={{
                backgroundImage: `url(${boxFrame.src})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="">
                <p className="text-[18px] font-semibold text-[#FFED95]">
                  Fill in your info.
                </p>
                <p className="text-[12px] text-[#fff] mt-[6px] opacity-60">
                  Your info is only used in this chat and won't be stored long
                  term. We only keep your sign and results on our server up to
                  24 hours to prevent repeats.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-4 space-y-5"
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2  ">
                  <div className="flex flex-col">
                    <label className="text-xs text-[#FFED95]">
                      Name<span className="text-[#F00]">*</span>
                    </label>
                    <input
                      className={`mt-3 rounded-[6px] border px-3 py-2 text-sm text-[#fff6d8] placeholder:text-[#FFFFFF66] bg-[#31251C] focus:outline-none ${
                        showErrors && !form.name.trim()
                          ? "border-red-500 focus:border-red-400"
                          : "border-[#4a2f1f]/70 focus:border-[#FFED95]"
                      }`}
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="You can use a nickname."
                    />
                  </div>

                  <GenderSelect
                    label={
                      <>
                        Gender<span className="text-[#F00]">*</span>
                      </>
                    }
                    required
                    value={form.gender as any} // 如果 Profile.gender 是 string，建议改成 union；先这样也能跑
                    onChange={(v) => handleChange("gender", v)}
                    error={showErrors && !form.gender}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DatePicker
                    label={
                      <>
                        Date of birth<span className="text-[#F00]">*</span>
                      </>
                    }
                    required
                    value={form.birthDate}
                    onChange={(v) => handleChange("birthDate", v)}
                    error={showErrors && !form.birthDate}
                  />

                  <TimeSelect
                    label={
                      <>
                        Time of birth<span className="text-[#F00]">*</span>
                      </>
                    }
                    required
                    value={form.birthTime ?? ""}
                    onChange={(v) => handleChange("birthTime", v)}
                    error={showErrors && !form.birthTime}
                    stepMinutes={5}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-[#FFED95]">
                    Place of birth (City + Country)
                    <span className="text-[#F00]">*</span>
                  </label>
                  <input
                    className={`mt-3 rounded-[6px] border px-3 py-2 text-sm text-[#fff6d8] bg-[#31251C] placeholder:text-[#FFFFFF66] focus:outline-none ${
                      showErrors && !form.birthPlace.trim()
                        ? "border-red-500 focus:border-red-300"
                        : "border-[#4a2f1f]/70 focus:border-[#FFFFFF66]"
                    }`}
                    value={form.birthPlace}
                    onChange={(e) => handleChange("birthPlace", e.target.value)}
                    placeholder="For example: London, UK"
                    required
                  />
                </div>

                {error ? (
                  <p className="text-xs text-[#f7b9a0]">{error}</p>
                ) : null}

                <NextButton type="submit" containerClassName="pt-4" />
              </form>
            </div>
          </div>

          <div className="flex w-full flex-row gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:justify-center lg:gap-4 lg:overflow-visible lg:pb-0">
            <StepPillar
              letter="B"
              description="Now, tell us your question."
              stepNumber="2"
              background={bBg}
              state="upcoming"
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
    </section>
  );
}
