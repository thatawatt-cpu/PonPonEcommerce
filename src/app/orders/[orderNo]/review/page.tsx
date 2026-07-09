"use client";

import OrderTrackingPage from "../page";

export default function OrderReviewPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  return <OrderTrackingPage params={params} forceReview />;
}
