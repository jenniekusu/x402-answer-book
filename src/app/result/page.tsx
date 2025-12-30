"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { exact, encodePayment } from "x402/schemes";
import type { PaymentRequirements } from "x402/types";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import html2canvas from "html2canvas";

import { consultApi } from "@/app/api";
import { AnswerHeader } from "@/components/AnswerHeader";
import { NextButton } from "@/components/NextButton";
import { StepPillar } from "@/components/StepPillar";
import {
  AnswerResult,
  Profile,
  QuestionPayload,
  loadProfile,
  loadQuestion,
  saveResult,
} from "@/lib/clientState";

import aBg from "@/assets/images/a-bg.png";
import bBg from "@/assets/images/b-bg.png";
import cBg from "@/assets/images/c-bg.png";
import dBg from "@/assets/images/d-bg.png";
import boxFrame from "@/assets/images/box.png";
import buttonBg from "@/assets/images/button.png";
import book from "@/assets/images/book.png";
import closeIcon from "@/assets/images/close.png";
import qrCodeImage from "@/assets/images/qrcode.png";

type Status = "idle" | "flipping" | "paying" | "loading" | "done" | "error";
type PaymentOption = PaymentRequirements & {
  maxTimeoutSeconds?: number;
  chainId?: number | string;
};
type ExactWalletClient = Parameters<typeof exact.evm.createPayment>[0];

const DEFAULT_TIMEOUT_SECONDS = 60 * 15;
const SHARE_API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  ""
);

function mapNetworkToChainId(network?: string | null) {
  if (!network) return undefined;
  switch (network) {
    case "base":
      return base.id;
    case "base-sepolia":
      return baseSepolia.id;
    default:
      return undefined;
  }
}

const CONSULT_CATEGORY_MAP: Record<
  NonNullable<QuestionPayload["category"]>,
  "love" | "career" | "health" | "wealth" | "general"
> = {
  love: "love",
  career: "career",
  health: "health",
  money: "wealth",
  relationships: "general",
  random: "general",
};

function normalizeConsultCategory(category: QuestionPayload["category"]) {
  if (!category) return undefined;
  return CONSULT_CATEGORY_MAP[category] ?? undefined;
}

function buildConsultPayload(profile: Profile, question: QuestionPayload) {
  const payload: Record<string, unknown> = {
    input: {
      profile: {
        name: profile.name,
        birthDate: profile.birthDate,
        ...(profile.birthTime ? { birthTime: profile.birthTime } : {}),
        ...(profile.gender === "M" || profile.gender === "F"
          ? { gender: profile.gender }
          : {}),
        ...(profile.birthPlace ? { birthPlace: profile.birthPlace } : {}),
      },
      question: question.question,
    },
  };

  const normalizedCategory = normalizeConsultCategory(question.category);
  if (normalizedCategory) {
    (payload.input as Record<string, unknown>).category = normalizedCategory;
  }

  return payload;
}

function toAnswerResult(data: unknown): AnswerResult {
  const output =
    (data as { output?: Record<string, unknown> })?.output ??
    (data as Record<string, unknown>);

  if (!output || typeof output !== "object") {
    throw new Error("Consult API returned an unexpected payload.");
  }

  return {
    answer:
      (output.answer as string | undefined) ??
      "The oracle is silent today. Try again soon.",
    astroHint: (output.astroHint as string | null | undefined) ?? null,
    cost: (output.cost as string | undefined) ?? "0",
    txRef: (output.txRef as string | null | undefined) ?? null,
    sunSign: (output.sunSign as string | undefined) ?? "Unknown",
    disclaimer: (output.disclaimer as string | undefined) ?? "--",
  };
}

export default function ResultPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const chainId = useChainId();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shareCardRef = useRef<HTMLDivElement>(null);

  const shareCaptureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = loadProfile();
    const q = loadQuestion();
    if (!p || !q) {
      router.replace("/setup");
      return;
    }
    setProfile(p);
    setQuestion(q);
  }, [router]);

  async function handleFlip() {
    if (!profile || !question) return;

    if (!walletClient || !isConnected) {
      setError("Please connect your wallet before opening the answer book.");
      setStatus("error");
      return;
    }

    setStatus("flipping");
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const payload = buildConsultPayload(profile, question);

    try {
      setStatus("loading");
      const initialResponse = await consultApi(payload);
      const { status, data } = initialResponse;

      if (status >= 200 && status < 300 && data?.output) {
        const parsed = toAnswerResult(data);
        setResult(parsed);
        saveResult(parsed);
        setStatus("done");
        return;
      }

      const paymentOptions: PaymentOption[] = Array.isArray(data?.accepts)
        ? (data.accepts as PaymentOption[])
        : [];
      const paymentRequest =
        paymentOptions.find((option) => option.scheme === "exact") ||
        paymentOptions[0];

      setStatus("paying");

      const explicitChainId =
        typeof paymentRequest.chainId === "number"
          ? paymentRequest.chainId
          : Number(paymentRequest.chainId);

      const targetChainId =
        (Number.isFinite(explicitChainId) ? explicitChainId : undefined) ||
        mapNetworkToChainId(paymentRequest.network) ||
        chainId ||
        baseSepolia.id;

      if (
        typeof targetChainId === "number" &&
        walletClient.chain?.id !== targetChainId
      ) {
        if (!switchChainAsync) {
          throw new Error(
            "Please switch your wallet to the required network to continue."
          );
        }
        await switchChainAsync({ chainId: targetChainId });
      }

      const normalizedRequirement: PaymentRequirements = {
        ...paymentRequest,
        maxTimeoutSeconds:
          typeof paymentRequest.maxTimeoutSeconds === "number" &&
          paymentRequest.maxTimeoutSeconds > 0
            ? paymentRequest.maxTimeoutSeconds
            : DEFAULT_TIMEOUT_SECONDS,
      };

      const viemWalletClient = walletClient as unknown as ExactWalletClient;

      const paymentPayload = await exact.evm.createPayment(
        viemWalletClient,
        data?.x402Version ?? 1,
        normalizedRequirement
      );
      const paymentHeader = encodePayment(paymentPayload);

      setStatus("loading");
      const confirmation = await consultApi(payload, {
        headers: { "X-PAYMENT": paymentHeader },
      });

      if (
        confirmation.status < 200 ||
        confirmation.status >= 300 ||
        !confirmation.data?.output
      ) {
        const message =
          confirmation.data?.error ??
          "Unable to open the answer book right now. Please try again later or check your network/wallet status.";
        throw new Error(message);
      }

      const parsed = toAnswerResult(confirmation.data);
      setResult(parsed);
      saveResult(parsed);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during the request. Please check your network and try again."
      );
      setStatus("error");
    }
  }

  const disabled =
    status === "flipping" || status === "loading" || status === "paying";
  const hasResult = Boolean(result);

  const leftPillars = hasResult
    ? [
        {
          letter: "A",
          description: "Fill in your info.",
          stepNumber: "1",
          background: aBg,
          state: "complete" as const,
        },
        {
          letter: "B",
          description: "Now, tell us your question.",
          stepNumber: "2",
          background: bBg,
          state: "complete" as const,
        },
        {
          letter: "C",
          description: "Open this round's book of answers.",
          stepNumber: "3",
          background: cBg,
          state: "complete" as const,
        },
      ]
    : [
        {
          letter: "A",
          description: "Fill in your info.",
          stepNumber: "1",
          background: aBg,
          state: "complete" as const,
        },
        {
          letter: "B",
          description: "Now, tell us your question.",
          stepNumber: "2",
          background: bBg,
          state: "complete" as const,
        },
      ];

  const rightPillars = hasResult
    ? []
    : [
        {
          letter: "D",
          description: "Open this round's book of answers.",
          stepNumber: "4",
          background: dBg,
          state: "current" as const,
        },
      ];
  const mobilePillars = [...leftPillars, ...rightPillars];
  const captureShareCanvas = async () => {
    if (!shareCaptureRef.current) {
      throw new Error("Nothing to capture yet. Please try again.");
    }
    return html2canvas(shareCaptureRef.current, {
      useCORS: true,
      scale: 1.5,
      backgroundColor: "#000000",
    });
  };

  const canvasToBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (file) => {
          if (file) resolve(file);
          else reject(new Error("Failed to capture screenshot. Please retry."));
        },
        "image/jpeg",
        0.82
      );
    });

  const handleSaveAnswer = async () => {
    if (isSaving) return;
    if (!result) {
      window.alert("Open the answer book before saving.");
      return;
    }
    try {
      setIsSaving(true);
      const canvas = await captureShareCanvas();
      const dataUrl = canvas.toDataURL("image/png", 0.95);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `answer-book-${Date.now().toString(36)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("saveAnswer error", err);
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to save the answer image right now."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const shareToX = async () => {
    const TWITTER_SHARE_HOST = "https://twitter.com/share";

    const PUBLIC_SITE_ORIGIN = "https://www.answerbook.app";

    if (isSharing) return;
    if (!result) {
      window.alert("Open the answer book before sharing to X.");
      return;
    }
    if (!SHARE_API_BASE) {
      window.alert("Share API base URL is not configured.");
      return;
    }

    try {
      setIsSharing(true);

      const canvas = await captureShareCanvas();
      const blob = await canvasToBlob(canvas);

      const formData = new FormData();
      formData.append(
        "image",
        blob,
        `answer-book-${Date.now().toString(36)}.jpg`
      );

      const uploadResponse = await fetch(`${SHARE_API_BASE}/upload-image`, {
        method: "POST",
        body: formData,
      });

      let uploadJson: { success?: boolean; url?: string; error?: string };
      try {
        uploadJson = await uploadResponse.json();
      } catch {
        throw new Error("Image upload failed. Please try again later.");
      }

      if (!uploadResponse.ok || !uploadJson?.success) {
        throw new Error(
          uploadJson?.error ??
            `Image upload failed (HTTP ${uploadResponse.status}).`
        );
      }

      const imageUrl = uploadJson.url;
      if (typeof imageUrl !== "string") {
        throw new Error("Upload API did not return an image URL.");
      }

      const metaArr = [
        "twitter:url",
        `${PUBLIC_SITE_ORIGIN}/`,
        "twitter:site",
        PUBLIC_SITE_ORIGIN,
        "twitter:title",
        "Answer Book",
        "twitter:description",
        "",
        "twitter:card",
        "summary_large_image",
        "twitter:image",
        imageUrl,

        "og:title",
        "Answer Book",
        "og:description",
        "",
        "og:image",
        imageUrl,
        "og:url",
        `${PUBLIC_SITE_ORIGIN}/`,
      ];

      const metaParams = encodeURIComponent(
        encodeURIComponent(metaArr.join(","))
      );
      const tweetText = "I just got guidance from the Answer Book";

      const sharePageUrl = `${PUBLIC_SITE_ORIGIN}/share?image=${encodeURIComponent(
        imageUrl
      )}`;

      const longUrl = `${TWITTER_SHARE_HOST}?text=${encodeURIComponent(
        tweetText
      )}&url=${encodeURIComponent(sharePageUrl)}`;

      window.open(longUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("shareToX error", err);
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to share the answer right now."
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center  overflow-hidden px-4 py-16 text-[#fcebb8] ">
      <div
        className="fixed left-[-99999px] top-0 z-[-1] opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <ShareCard
          ref={shareCaptureRef}
          question={question?.question ?? ""}
          answer={result?.answer ?? ""}
          fee={result?.cost ?? ""}
          network="Base Sepolia"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 backdrop-blur-2xl" />

      <div className="relative z-10 w-full max-w-6xl space-y-10">
        <Link
          href="/"
          className="absolute right-0 -top-2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full transition"
          aria-label="Close"
        >
          <Image src={closeIcon} alt="" width={56} height={56} />
        </Link>

        <AnswerHeader />

        <div className="flex w-full flex-col items-stretch gap-8 lg:flex-row lg:items-stretch lg:justify-center">
          <div className="hidden w-full flex-wrap justify-center gap-4 lg:flex lg:w-auto">
            {leftPillars.map((pillar) => (
              <StepPillar key={pillar.letter} {...pillar} />
            ))}
          </div>

          <div
            ref={shareCardRef}
            className="flex w-full flex-col rounded-3xl p-6 sm:p-8 min-h-[420px] lg:w-[474px] lg:h-[512px]"
            style={{
              backgroundImage: `url(${boxFrame.src})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            {hasResult && result ? (
              <div className="flex h-full flex-col">
                <div className="flex-1">
                  <p className="text-[18px] font-bold uppercase text-[#FFED95]">
                    Answer
                  </p>
                  <div className="mt-1.5 max-h-[240px] flex-1 overflow-y-auto text-[#FFED95] opacity-60 sm:max-h-[306px]">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {result.answer}
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-4 border-[#FFE45C] border-t-1 pt-2">
                  <div className="text-white flex flex-wrap items-center justify-between gap-4">
                    <div className="text-[12px]">
                      <p>Fee: {result.cost} USDC</p>
                      <p>Network: Base Sepolia</p>
                      {result.txRef ? (
                        <p className="truncate">Payment ref: {result.txRef}</p>
                      ) : null}
                    </div>

                    <Image
                      src={qrCodeImage}
                      alt="Answer Book QR"
                      width={60}
                      height={60}
                      className="mix-blend-screen"
                    />
                  </div>

                  <div
                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                    data-html2canvas-ignore="true"
                  >
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="cursor-pointer inline-flex h-12 items-center justify-center font-semibold text-white"
                      style={{
                        backgroundImage: `url(${buttonBg.src})`,
                        backgroundSize: "100% 100%",
                      }}
                    >
                      Back to Home
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAnswer}
                      disabled={isSaving}
                      className={`cursor-pointer inline-flex h-12 items-center justify-center font-semibold text-white ${
                        isSaving ? "opacity-70" : ""
                      }`}
                      style={{
                        backgroundImage: `url(${buttonBg.src})`,
                        backgroundSize: "100% 100%",
                      }}
                    >
                      {isSaving ? "Saving..." : "Save Answer"}
                    </button>

                    <button
                      type="button"
                      onClick={shareToX}
                      disabled={isSharing}
                      className={`cursor-pointer inline-flex h-12 items-center justify-center font-semibold text-white ${
                        isSharing ? "opacity-70" : ""
                      }`}
                      style={{
                        backgroundImage: `url(${buttonBg.src})`,
                        backgroundSize: "100% 100%",
                      }}
                    >
                      {isSharing ? "Sharing..." : "Share to X"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div>
                  <p className="text-[18px] font-black text-[#FFED95]">
                    Open the answer book this time
                  </p>
                  <p className="text-[12px] text-white/50 mt-[6px]">
                    When you're ready, take a deep breath and then click the
                    button below. Whatever you draw, treat it as the starting
                    point of a conversation, not the end.
                  </p>
                  <p className="mt-4 text-[#FFED95] text-[14px]">
                    Open the answer book
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="h-[264px] w-[264px]">
                    <Image src={book} alt="" sizes="264px" />
                  </div>
                </div>

                <NextButton
                  type="button"
                  onClick={handleFlip}
                  disabled={disabled}
                  className={disabled ? "opacity-70" : ""}
                  containerClassName="justify-center"
                />
              </div>
            )}
          </div>

          {mobilePillars.length ? (
            <div className="flex w-full gap-4 overflow-x-auto pb-2 lg:hidden">
              {mobilePillars.map((pillar) => (
                <StepPillar key={`mobile-${pillar.letter}`} {...pillar} />
              ))}
            </div>
          ) : null}

          {rightPillars.length ? (
            <div className="hidden flex-wrap justify-center gap-4 w-full lg:flex lg:w-auto">
              {rightPillars.map((pillar) => (
                <StepPillar key={pillar.letter} {...pillar} />
              ))}
            </div>
          ) : null}
        </div>

        {status === "loading" ||
        status === "paying" ||
        status === "flipping" ? (
          <p className="mt-6 text-center text-xs text-[#f8deb0]">
            {status === "paying"
              ? "Waiting for payment confirmation… Please finish the signature or transaction in your wallet."
              : "The universe is flipping the pages. Please wait a few seconds."}
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#f7b9a0]/40 bg-[#39130d]/60 px-4 py-3 text-center text-xs text-[#f7b9a0]">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}

type ShareCardProps = {
  question: string;
  answer: string;
  fee?: string;
  network?: string;
};

const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(
  ({ question, answer, fee = "", network = "" }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1200,
          height: 628,
          backgroundColor: "#000000",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundColor: "#111111",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            padding: 64,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#FFED95",
            }}
          >
            Answer Book
          </div>

          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#FFED95" }}>
              Question
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 28,
                lineHeight: 1.25,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              {question}
            </div>
          </div>

          <div style={{ marginTop: 40, flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#FFED95" }}>
              Answer
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 26,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {answer}
            </div>
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 18,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <div style={{ display: "flex", gap: 32 }}>
              {fee ? <div>Fee: {fee} USDC</div> : null}
              {network ? <div>Network: {network}</div> : null}
            </div>
            <div
              style={{
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
              }}
            >
              <img
                src={qrCodeImage.src}
                alt="Answer Book QR"
                style={{
                  width: 70,
                  height: 70,
                  mixBlendMode: "screen",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
ShareCard.displayName = "ShareCard";
