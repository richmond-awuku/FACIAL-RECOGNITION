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

Build the server-rendered app for production:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```

## Deploy to Vercel

1. Import this project (or its containing repository) into Vercel. Set the **Root Directory** to
   `FACIAL-RECOGNITION` if the app is inside a larger repository.
2. Use `npm run build` as the Build Command. The Vercel Nitro preset packages the Nuxt SSR app as a
   serverless function.
3. Add `NUXT_PUBLIC_BACKEND_URL` in the Vercel project's Environment Variables for Production and
   Preview, with the value `https://facialattendance.duckdns.org`.
4. Redeploy after changing the environment variable. Nuxt uses it as the public backend API URL.

The backend must allow the deployed Vercel domain in its CORS configuration for API requests to
work.
