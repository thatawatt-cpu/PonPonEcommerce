"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openExternalWindow } from "@/lib/liff";
import { LINE_OA_URL } from "@/lib/constants";

/** Opens the (mock) LINE OA chat in an external window. */
export function ContactLineButton() {
  return (
    <Button
      variant="secondary"
      fullWidth
      onClick={() => openExternalWindow(LINE_OA_URL)}
    >
      <MessageCircle className="h-5 w-5" />
      สอบถามร้านผ่าน LINE
    </Button>
  );
}
