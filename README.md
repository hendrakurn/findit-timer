This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create a local env file for the remote PINs:

```bash
cp .env.example .env.local
```

The app supports two countdown sessions:

- Display: `/` or `/display/main-stage`, remote: `/remote/main-stage`
- Display: `/display/pitch`, remote: `/remote/pitch`

Remote access is protected by the static PINs in `FINDIT_MAIN_STAGE_PIN` and `FINDIT_PITCH_PIN`.

For production on Vercel, configure persistent countdown storage. The app reads either Vercel KV-style env names:

```bash
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Or Upstash Redis env names:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If Vercel prefixes the storage env with the integration name, this project also accepts:

```bash
findit_KV_REST_API_URL=
findit_KV_REST_API_TOKEN=
```

Without persistent storage, production serverless instances cannot keep countdown state reliably.

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
