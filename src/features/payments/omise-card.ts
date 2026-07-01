"use client";

const OMISE_JS_URL = "https://cdn.omise.co/omise.js";

export interface OmiseCardInput {
  name: string;
  number: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
}

interface OmiseTokenResponse {
  id?: string;
  object?: string;
  message?: string;
}

interface OmiseClient {
  setPublicKey(publicKey: string): void;
  createToken(
    type: "card",
    data: Record<string, string>,
    callback: (statusCode: number, response: OmiseTokenResponse) => void
  ): void;
}

declare global {
  interface Window {
    Omise?: OmiseClient;
  }
}

let omiseScriptPromise: Promise<OmiseClient> | null = null;

function loadOmiseJs(): Promise<OmiseClient> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Omise.js can only run in the browser."));
  }

  if (window.Omise) {
    return Promise.resolve(window.Omise);
  }

  if (!omiseScriptPromise) {
    omiseScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${OMISE_JS_URL}"]`
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.Omise) resolve(window.Omise);
          else reject(new Error("Omise.js did not initialize."));
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("Unable to load Omise.js."));
        });
        return;
      }

      const script = document.createElement("script");
      script.src = OMISE_JS_URL;
      script.async = true;
      script.onload = () => {
        if (window.Omise) resolve(window.Omise);
        else reject(new Error("Omise.js did not initialize."));
      };
      script.onerror = () => reject(new Error("Unable to load Omise.js."));
      document.head.appendChild(script);
    });
  }

  return omiseScriptPromise;
}

export async function tokenizeCard(input: OmiseCardInput): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY?.trim();

  if (!publicKey) {
    throw new Error("Missing NEXT_PUBLIC_OMISE_PUBLIC_KEY.");
  }

  const omise = await loadOmiseJs();
  omise.setPublicKey(publicKey);

  return new Promise((resolve, reject) => {
    omise.createToken(
      "card",
      {
        name: input.name,
        number: input.number.replace(/\s+/g, ""),
        expiration_month: input.expirationMonth,
        expiration_year: input.expirationYear,
        security_code: input.securityCode,
      },
      (statusCode, response) => {
        if (statusCode === 200 && response.id) {
          resolve(response.id);
          return;
        }

        reject(new Error(response.message ?? "Card tokenization failed."));
      }
    );
  });
}
