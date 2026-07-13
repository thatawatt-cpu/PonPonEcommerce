"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock3,
  ClipboardList,
  Download,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { formatBaht } from "@/lib/format";
import {
  clearStoredPromptPayCharge,
  createPromptPayPayment,
  fetchPaymentStatus,
  getStoredPromptPayCharge,
  satangToBaht,
  storePromptPayCharge,
} from "@/features/payments/payment-api";

const FALLBACK_QR_CODE_URL = "/images/payments/promptpay-qr.png";

function getDisplayQrCodeUrl(url: string) {
  if (!url || url.startsWith("/")) return url;
  return `/api/payments/qr-image?url=${encodeURIComponent(url)}`;
}

function buildSuccessPath(input: {
  orderId: string;
  orderNo: string;
  points: string;
  spend: number;
}) {
  const params = new URLSearchParams({
    orderId: input.orderId,
    orderNo: input.orderNo,
    points: input.points,
    spend: String(input.spend),
  });

  return `/order/success?${params.toString()}`;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function formatPaymentDeadline(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(date);
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
  const year = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);

  return `${time}, ${day} ${month} ${year}`;
}

function getRemainingMs(value: string) {
  const expiresAt = new Date(value).getTime();
  if (!Number.isFinite(expiresAt)) return 0;
  return Math.max(expiresAt - Date.now(), 0);
}

function getDownloadFileName(orderId: string) {
  const safeOrderId = orderId.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `ponpon-promptpay-${safeOrderId}.png`;
}

function buildPaymentExpiredPath(input: { orderId: string; orderNo: string }) {
  const params = new URLSearchParams({
    orderId: input.orderId,
    orderNo: input.orderNo,
  });

  return `/payment/expired?${params.toString()}`;
}

function imageBlobToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || 336;
      canvas.height = image.naturalHeight || 336;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas is not available"));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(objectUrl);
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error("QR image conversion failed"));
        }
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("QR image could not be loaded"));
    };

    image.src = objectUrl;
  });
}

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    orderNo?: string;
    amount?: string;
    points?: string;
    chargeId?: string;
    qrCodeUrl?: string;
    expiresAt?: string;
    paymentExpiresAt?: string;
  }>;
}) {
  const {
    orderId,
    orderNo = "ORD001",
    amount,
    points = "0",
    chargeId,
    qrCodeUrl,
    expiresAt,
    paymentExpiresAt: orderPaymentExpiresAtParam,
  } = use(searchParams);
  const router = useRouter();

  const initialPayAmount = amount ? Number(amount) : 0;
  const paymentOrderId = orderId ?? orderNo;
  const storedPromptPayCharge = !chargeId && paymentOrderId
    ? getStoredPromptPayCharge({ orderId: paymentOrderId })
    : null;
  const [payAmount, setPayAmount] = useState(
    storedPromptPayCharge?.amount ?? initialPayAmount
  );
  const successPath = buildSuccessPath({
    orderId: paymentOrderId,
    orderNo,
    points,
    spend: payAmount,
  });

  const [paymentChargeId, setPaymentChargeId] = useState(
    chargeId ?? storedPromptPayCharge?.chargeId ?? ""
  );
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(
    qrCodeUrl ?? storedPromptPayCharge?.qrCodeUrl ?? FALLBACK_QR_CODE_URL
  );
  const [qrImageError, setQrImageError] = useState(false);
  const [paymentExpiresAt, setPaymentExpiresAt] = useState(
    expiresAt ?? storedPromptPayCharge?.expiresAt ?? ""
  );
  const [orderPaymentExpiresAt, setOrderPaymentExpiresAt] = useState(
    orderPaymentExpiresAtParam ?? storedPromptPayCharge?.paymentExpiresAt ?? ""
  );
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [orderPaymentRemainingMs, setOrderPaymentRemainingMs] = useState(
    orderPaymentExpiresAtParam ?? storedPromptPayCharge?.paymentExpiresAt
      ? getRemainingMs(
          orderPaymentExpiresAtParam ?? storedPromptPayCharge?.paymentExpiresAt ?? ""
        )
      : 0
  );
  const [creatingQr, setCreatingQr] = useState(false);
  const [preparingQrDownload, setPreparingQrDownload] = useState(false);
  const [qrDownloadHref, setQrDownloadHref] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [storedChargeReady, setStoredChargeReady] = useState(Boolean(chargeId));
  const autoCreateStartedRef = useRef(false);

  const isExpired = paymentExpiresAt && remainingMs !== null ? remainingMs <= 0 : false;
  const expiresLabel = paymentExpiresAt
    ? remainingMs === null
      ? "—"
      : isExpired
        ? "หมดอายุแล้ว"
        : formatRemaining(remainingMs)
    : "รอสร้าง QR";
  const orderPaymentExpired = orderPaymentExpiresAt
    ? orderPaymentRemainingMs <= 0
    : false;
  const formattedPayAmount = formatBaht(payAmount);
  const canDownloadQrCode = Boolean(qrDownloadHref) && !isExpired;
  const paymentDeadlineLabel = formatPaymentDeadline(
    orderPaymentExpiresAt || paymentExpiresAt
  );
  const orderDetailHref = `/orders/${encodeURIComponent(paymentOrderId)}`;

  const createQrCharge = useCallback(async () => {
    if (creatingQr || !paymentOrderId) return;

    if (orderPaymentExpiresAt && getRemainingMs(orderPaymentExpiresAt) <= 0) {
      clearStoredPromptPayCharge(paymentOrderId);
      router.replace(buildPaymentExpiredPath({ orderId: paymentOrderId, orderNo }));
      return;
    }

    setCreatingQr(true);
    setPaymentError(null);

    try {
      const payment = await createPromptPayPayment({
        orderId: paymentOrderId,
      });
      const nextPayAmount = satangToBaht(payment.amount);

      setPayAmount(nextPayAmount);
      setPaymentChargeId(payment.chargeId);
      setPaymentQrCodeUrl(payment.qrCodeUrl);
      setQrImageError(false);
      setPaymentExpiresAt(payment.expiresAt);
      storePromptPayCharge({
        orderId: paymentOrderId,
        orderNo,
        amount: nextPayAmount,
        chargeId: payment.chargeId,
        qrCodeUrl: payment.qrCodeUrl,
        expiresAt: payment.expiresAt,
        paymentExpiresAt: orderPaymentExpiresAt || undefined,
        createdAt: new Date().toISOString(),
      });

      const nextParams = new URLSearchParams({
        orderId: paymentOrderId,
        orderNo,
        amount: String(nextPayAmount),
        points,
        chargeId: payment.chargeId,
        qrCodeUrl: payment.qrCodeUrl,
        expiresAt: payment.expiresAt,
        ...(orderPaymentExpiresAt ? { paymentExpiresAt: orderPaymentExpiresAt } : {}),
      });
      window.history.replaceState(null, "", `/payment?${nextParams.toString()}`);
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "สร้าง QR ไม่สำเร็จ"
      );
    } finally {
      setCreatingQr(false);
    }
  }, [creatingQr, orderNo, orderPaymentExpiresAt, paymentOrderId, points, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (chargeId || !paymentOrderId) {
        setStoredChargeReady(true);
        return;
      }

      const storedCharge = getStoredPromptPayCharge({ orderId: paymentOrderId });

      if (storedCharge) {
        setPayAmount(storedCharge.amount);
        setPaymentChargeId(storedCharge.chargeId);
        setPaymentQrCodeUrl(storedCharge.qrCodeUrl);
        setQrImageError(false);
        setPaymentExpiresAt(storedCharge.expiresAt);
        setOrderPaymentExpiresAt(storedCharge.paymentExpiresAt ?? "");
      }

      setStoredChargeReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [chargeId, paymentOrderId]);

  useEffect(() => {
    if (
      !storedChargeReady ||
      orderPaymentExpired ||
      paymentChargeId ||
      !paymentOrderId ||
      autoCreateStartedRef.current
    ) {
      return;
    }

    autoCreateStartedRef.current = true;
    createQrCharge();
  }, [
    createQrCharge,
    orderPaymentExpired,
    paymentChargeId,
    paymentOrderId,
    storedChargeReady,
  ]);

  useEffect(() => {
    if (!paymentExpiresAt) return;

    const updateRemaining = () => {
      setRemainingMs(getRemainingMs(paymentExpiresAt));
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);

    return () => window.clearInterval(timer);
  }, [paymentExpiresAt]);

  useEffect(() => {
    if (!orderPaymentExpiresAt) return;

    const updateRemaining = () => {
      setOrderPaymentRemainingMs(getRemainingMs(orderPaymentExpiresAt));
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);

    return () => window.clearInterval(timer);
  }, [orderPaymentExpiresAt]);

  useEffect(() => {
    if (!orderPaymentExpiresAt || orderPaymentRemainingMs > 0) return;

    clearStoredPromptPayCharge(paymentOrderId);
    router.replace(buildPaymentExpiredPath({ orderId: paymentOrderId, orderNo }));
  }, [
    orderNo,
    orderPaymentExpiresAt,
    orderPaymentRemainingMs,
    paymentOrderId,
    router,
  ]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    const timer = window.setTimeout(async () => {
      setQrDownloadHref("");

      if (!paymentQrCodeUrl || qrImageError || isExpired) {
        return;
      }

      setPreparingQrDownload(true);

      try {
        const response = await fetch(getDisplayQrCodeUrl(paymentQrCodeUrl), {
          cache: "no-store",
        });
        const contentType = response.headers.get("content-type") ?? "";

        if (!response.ok || !contentType.startsWith("image/")) {
          throw new Error("QR image response is not an image");
        }

        const sourceBlob = await response.blob();
        const pngBlob =
          sourceBlob.type === "image/png"
            ? sourceBlob
            : await imageBlobToPng(sourceBlob);

        objectUrl = URL.createObjectURL(
          new Blob([pngBlob], { type: "image/png" })
        );

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setQrDownloadHref(objectUrl);
      } catch {
        if (!cancelled) {
          setQrDownloadHref("");
        }
      } finally {
        if (!cancelled) {
          setPreparingQrDownload(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isExpired, paymentQrCodeUrl, qrImageError]);

  useEffect(() => {
    if (!paymentChargeId || isExpired || orderPaymentExpired) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const status = await fetchPaymentStatus(paymentChargeId);

        if (cancelled) return;

        if (status.paid || status.status === "successful") {
          clearStoredPromptPayCharge(paymentOrderId);
          router.refresh();
          router.push(successPath);
          return;
        }

        if (status.status === "failed" || status.status === "expired") {
          clearStoredPromptPayCharge(paymentOrderId);
          setPaymentError(status.failureMessage ?? "ชำระเงินไม่สำเร็จ");
        }
      } catch {
        if (!cancelled) {
          setPaymentError("ยังตรวจสอบสถานะไม่ได้ ระบบจะลองใหม่อีกครั้ง");
        }
      }
    };

    poll();
    const timer = window.setInterval(poll, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    isExpired,
    orderPaymentExpired,
    paymentChargeId,
    paymentOrderId,
    router,
    successPath,
  ]);

  const handleRefreshQr = () => {
    if (creatingQr || orderPaymentExpired) return;
    setQrImageError(false);
    createQrCharge();
  };

  return (
    <>
      <AppHeader
        title="ชำระเงินด้วย PromptPay"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <main className="h-[calc(100dvh-3.5rem)] overflow-hidden bg-[linear-gradient(180deg,#fffdfd_0%,#fff7f7_55%,#fff2f2_100%)] md:h-auto md:min-h-[calc(100dvh-3.5rem)] md:overflow-visible">
        <PageContainer
          withBottomNav={false}
          className="flex h-full flex-col gap-2.5 overflow-hidden px-3 pt-2.5 pb-3 md:h-auto md:min-h-full md:max-w-5xl md:overflow-visible md:gap-4 md:px-8 md:py-6 xl:max-w-6xl [@media(max-width:430px)_and_(max-height:860px)]:gap-2 [@media(max-width:430px)_and_(max-height:860px)]:pb-2 [@media(max-height:700px)]:gap-1.5 [@media(max-height:700px)]:pb-1.5 [@media(max-height:700px)]:pt-1.5 [@media(min-width:768px)_and_(max-width:900px)]:gap-2 [@media(min-width:768px)_and_(max-width:900px)]:px-6 [@media(min-width:768px)_and_(max-width:900px)]:py-4"
        >
          <Card className="flex min-h-0 max-h-[calc(100dvh-12rem)] shrink-0 flex-col overflow-hidden rounded-[1.35rem] border border-brand/10 bg-white/95 p-2 shadow-[0_18px_50px_rgba(65,25,25,0.10)] ring-0 md:max-h-none md:w-full md:rounded-[1.75rem] md:p-4 [@media(max-height:700px)]:max-h-[calc(100dvh-7rem)] [@media(max-height:700px)]:p-1.5 [@media(min-width:768px)_and_(max-width:900px)]:p-3">
            <section className="px-2 py-1.5 md:px-3 md:py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex min-w-0 items-center gap-2 text-brand">
                  <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/12 md:h-7 md:w-7">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand md:h-3.5 md:w-3.5" />
                  </span>
                  <p className="truncate text-base font-extrabold md:text-xl [@media(max-width:430px)_and_(max-height:860px)]:text-sm">รอชำระเงิน</p>
                </div>
                <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-brand/20 bg-white px-2.5 text-xs font-extrabold text-brand shadow-[0_8px_20px_rgba(237,23,28,0.08)] md:h-10 md:px-3 md:text-sm [@media(max-width:430px)_and_(max-height:860px)]:h-7 [@media(max-width:430px)_and_(max-height:860px)]:text-[11px]">
                  <Clock3 className="h-4 w-4 md:h-5 md:w-5 [@media(max-width:430px)_and_(max-height:860px)]:h-3.5 [@media(max-width:430px)_and_(max-height:860px)]:w-3.5" />
                  {isExpired ? expiresLabel : `เหลือ ${expiresLabel}`}
                </span>
              </div>

              <div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-[2.35rem] font-extrabold leading-none tracking-normal text-black md:text-[3rem] [@media(max-width:430px)_and_(max-height:860px)]:text-[2.15rem] [@media(max-height:700px)]:text-[2.1rem] [@media(min-width:768px)_and_(max-width:900px)]:text-[2.5rem]">
                    {formattedPayAmount}
                  </p>
                  <p className="max-w-[55%] truncate pb-0.5 text-right text-xs font-bold text-ink-soft md:text-sm">
                    คำสั่งซื้อ {orderNo}
                  </p>
                </div>
                {paymentDeadlineLabel && (
                  <p className="mt-2 truncate text-xs font-semibold text-ink-soft md:mt-4 md:whitespace-normal md:text-base [@media(max-width:430px)_and_(max-height:860px)]:mt-1 [@media(max-width:430px)_and_(max-height:860px)]:text-[11px] [@media(min-width:768px)_and_(max-width:900px)]:mt-2 [@media(min-width:768px)_and_(max-width:900px)]:text-sm">
                    รหัสนี้ใช้ได้ถึง {paymentDeadlineLabel}
                  </p>
                )}
              </div>
            </section>

            <section className="mt-2 flex min-h-0 flex-none flex-col overflow-hidden rounded-[1.1rem] border border-black/[0.06] bg-white md:mt-3 md:rounded-[1.35rem] [@media(max-width:430px)_and_(max-height:860px)]:mt-1.5 [@media(max-height:700px)]:mt-1 [@media(min-width:768px)_and_(max-width:900px)]:mt-2">
              <div className="border-b border-black/[0.06] bg-white px-4 py-3 text-ink md:px-6 md:py-4 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5 [@media(max-width:430px)_and_(max-height:860px)]:py-2 [@media(max-height:700px)]:py-2 [@media(min-width:768px)_and_(max-width:900px)]:px-5 [@media(min-width:768px)_and_(max-width:900px)]:py-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand md:h-12 md:w-12 md:rounded-2xl [@media(max-width:430px)_and_(max-height:860px)]:h-9 [@media(max-width:430px)_and_(max-height:860px)]:w-9 [@media(max-height:700px)]:h-9 [@media(max-height:700px)]:w-9 [@media(min-width:768px)_and_(max-width:900px)]:h-11 [@media(min-width:768px)_and_(max-width:900px)]:w-11">
                    <QrCode className="h-6 w-6 md:h-9 md:w-9 [@media(max-width:430px)_and_(max-height:860px)]:h-5 [@media(max-width:430px)_and_(max-height:860px)]:w-5 [@media(max-height:700px)]:h-5 [@media(max-height:700px)]:w-5 [@media(min-width:768px)_and_(max-width:900px)]:h-7 [@media(min-width:768px)_and_(max-width:900px)]:w-7" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-extrabold leading-tight text-ink md:text-2xl [@media(max-width:430px)_and_(max-height:860px)]:text-base [@media(max-height:700px)]:text-base [@media(min-width:768px)_and_(max-width:900px)]:text-xl">
                      QR PromptPay
                    </h1>
                    <p className="text-sm font-semibold text-ink-soft md:text-base [@media(max-width:430px)_and_(max-height:860px)]:text-xs [@media(max-height:700px)]:text-xs">
                      สแกนจ่ายด้วยพร้อมเพย์
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 shrink flex-col items-center rounded-t-[1.1rem] bg-white px-2 pb-3 pt-3 md:px-5 md:pb-5 md:pt-5 [@media(max-width:430px)_and_(max-height:860px)]:pb-2.5 [@media(max-width:430px)_and_(max-height:860px)]:pt-2.5 [@media(max-height:700px)]:pb-2 [@media(max-height:700px)]:pt-2 [@media(min-width:768px)_and_(max-width:900px)]:pb-4 [@media(min-width:768px)_and_(max-width:900px)]:pt-4">
                <div className="relative mx-auto aspect-square w-[min(48vw,22dvh,11rem)] max-w-full [@media(max-width:430px)_and_(max-height:860px)]:w-[min(46vw,21dvh,10.5rem)] [@media(max-height:700px)]:w-[min(40vw,18dvh,8.5rem)] md:w-[min(44vw,29dvh,18rem)] [@media(min-width:768px)_and_(max-width:900px)]:w-[min(44vw,24dvh,15rem)]">
                  <div
                    className={
                      isExpired
                        ? "h-full w-full overflow-hidden rounded-[1.1rem] bg-white p-1 opacity-25 shadow-[0_8px_26px_rgba(65,25,25,0.12)] ring-1 ring-black/[0.04]"
                        : "h-full w-full overflow-hidden rounded-[1.1rem] bg-white p-1 shadow-[0_8px_26px_rgba(65,25,25,0.12)] ring-1 ring-black/[0.04]"
                    }
                  >
                  <Image
                    src={getDisplayQrCodeUrl(paymentQrCodeUrl)}
                    width={336}
                    height={336}
                    alt="QR พร้อมเพย์สำหรับชำระเงิน"
                    className="h-full w-full object-contain"
                    unoptimized
                    priority
                    onError={() => {
                      setQrImageError(true);
                      setPaymentError(
                        "โหลดรูป QR ไม่สำเร็จ กรุณากดสร้าง QR ใหม่หรือลองอีกครั้ง"
                      );
                    }}
                  />
                  </div>

                {(isExpired || creatingQr || qrImageError) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.1rem] bg-white/92 px-5 text-center">
                    {creatingQr ? (
                      <Loader2 className="h-10 w-10 animate-spin text-brand" />
                    ) : (
                      <Clock3 className="h-10 w-10 text-brand" />
                    )}
                    <p className="mt-3 text-base font-extrabold text-ink">
                      {creatingQr
                        ? "กำลังสร้าง QR"
                        : qrImageError
                          ? "โหลด QR ไม่สำเร็จ"
                          : "QR หมดอายุแล้ว"}
                    </p>
                    {!creatingQr && (
                      <button
                        type="button"
                        onClick={handleRefreshQr}
                        disabled={orderPaymentExpired}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-white transition active:scale-95 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        สร้าง QR ใหม่
                      </button>
                    )}
                  </div>
                )}
              </div>

              {canDownloadQrCode ? (
                <a
                  href={qrDownloadHref}
                  download={getDownloadFileName(paymentOrderId)}
                  className="mt-3 inline-flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-full border border-brand bg-white px-5 text-sm font-extrabold text-brand transition active:scale-[0.98] hover:bg-brand-soft [@media(max-height:700px)]:mt-2 [@media(max-width:430px)_and_(max-height:860px)]:mt-2 [@media(min-width:768px)_and_(max-width:900px)]:max-w-xs"
                >
                  <Download className="h-5 w-5" />
                  บันทึกรหัส QR
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-3 inline-flex h-11 w-full max-w-sm cursor-not-allowed items-center justify-center gap-2 rounded-full border border-brand/30 bg-white px-5 text-sm font-extrabold text-brand opacity-45 [@media(max-height:700px)]:mt-2 [@media(max-width:430px)_and_(max-height:860px)]:mt-2 [@media(min-width:768px)_and_(max-width:900px)]:max-w-xs"
                >
                  {preparingQrDownload ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  {preparingQrDownload ? "เตรียม QR..." : "บันทึกรหัส QR"}
                </button>
              )}
              </div>
            </section>
          </Card>

          {paymentError && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-600">
              {paymentError}
            </p>
          )}

          <section className="relative overflow-hidden rounded-2xl border border-brand/10 bg-white px-3 py-2 shadow-[0_10px_26px_rgba(65,25,25,0.08)] [@media(max-height:700px)]:hidden md:w-full md:rounded-[1.35rem] md:px-5 md:py-3 [@media(min-width:768px)_and_(max-width:900px)]:py-2.5">
            <div className="flex items-center gap-2 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand md:h-8 md:w-8">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
              </span>
              <p className="line-clamp-2 min-w-0 w-full text-[10px] font-semibold leading-snug text-ink md:block md:overflow-visible md:text-xs md:leading-relaxed md:[-webkit-box-orient:initial] md:[-webkit-line-clamp:unset]">
                หลังชำระเงิน ระบบจะตรวจสอบให้อัตโนมัติ คุณสามารถกลับมาดู QR เดิมได้จากหน้าคำสั่งซื้อจนกว่ารหัสจะหมดอายุ
              </p>
              <Image
                src="/images/payments/ponpon-payment-bag.png"
                width={180}
                height={180}
                alt="ถุงช้อปปิ้ง PonPon"
                className="hidden h-16 w-16 shrink-0 object-contain md:block"
                priority
              />
            </div>
          </section>

          <div className="pt-0 md:w-full">
            <Link
              href={orderDetailHref}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-brand bg-white text-base font-extrabold text-brand transition active:scale-[0.98] hover:bg-brand-soft md:h-14 md:text-lg [@media(min-width:768px)_and_(max-width:900px)]:h-12 [@media(min-width:768px)_and_(max-width:900px)]:text-base"
            >
              <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />
              ดูคำสั่งซื้อ
            </Link>
          </div>
        </PageContainer>
      </main>
    </>
  );
}
