export function isLineWebView(): boolean {
  if (typeof navigator === "undefined") return false;

  return /Line\//i.test(navigator.userAgent) || /LIFF/i.test(navigator.userAgent);
}
