# Facial Recognition Frontend

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install
```

## Development Server

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production build

Build the client-rendered SPA for production. This generates static files for Vercel to serve:

```bash
npm run build
```

The generated site is in `.vercel/output/static`.

Locally preview the production build:

```bash
npm run preview
```

## Deploy to Vercel

1. Import this project (or its containing repository) into Vercel. Set the **Root Directory** to
   `FACIAL-RECOGNITION` if the app is inside a larger repository.
2. Use `npm run build` as the Build Command. Nuxt generates a static SPA, so Vercel serves the app
   without invoking the serverless rendering function that was returning HTTP 500.
3. Add `NUXT_PUBLIC_BACKEND_URL` in the Vercel project's Environment Variables for Production and
   Preview, with the value `https://facialattendance.duckdns.org`.
4. Redeploy after changing the environment variable. The URL is included in the frontend at build
   time.

The backend must allow the deployed Vercel domain in its CORS configuration for API requests to
work.
