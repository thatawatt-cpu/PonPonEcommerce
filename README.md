This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

For LIFF auth, set these public env vars when connecting to the real LINE app and backend:

```bash
NEXT_PUBLIC_APP_ORIGIN=https://xxxx.ngrok-free.app
NEXT_PUBLIC_LIFF_ID=your_liff_id
PONPON_AUTH_BACKEND_URL=https://e1be-2405-9800-b662-4f07-e8f1-6753-d343-27dd.ngrok-free.app/api/auth/line-login
PONPON_AUTH_BACKEND_BASE_URL=https://e1be-2405-9800-b662-4f07-e8f1-6753-d343-27dd.ngrok-free.app
```

When you run the frontend through ngrok, set `NEXT_PUBLIC_APP_ORIGIN` to the ngrok URL. In local browser dev, the app can also fall back to `window.location.origin`.
Frontend calls `/api/auth/line-login`, and Next.js proxies that request to `PONPON_AUTH_BACKEND_URL` on the server side so you do not have to fight CORS in the browser.
Use `Authorization: Bearer <token>` for `/api/auth/me`; the frontend proxy forwards that bearer token to the backend `GET /api/auth/me` endpoint.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
