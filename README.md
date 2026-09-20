# Guidance PT Dashboard

A web dashboard for personal trainers to manage clients, training plans, exercises, and workout progress.

The dashboard is part of the Guidance project and uses Next.js and Supabase. It includes authentication, Google OAuth, client management, training plans, exercise assignment, templates, progress statistics, localization, and theme support.

## Features

- Personal trainer authentication
- Google OAuth sign-in
- Client management
- Training plan creation and management
- Exercise assignment
- Training plan templates
- Workout and progress statistics
- English, Norwegian, and Spanish localization
- Light and dark theme support

## Tech Stack

- Next.js
- React
- TypeScript
- Supabase
- Supabase Auth
- Google OAuth
- CSS (Tailwind CSS)
- Vercel

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for the required variables.

Never commit `.env.local` or other files containing credentials.

## Project Structure

```text
src/
├── app/
│   ├── auth/
│   ├── clients/
│   ├── dashboard/
│   ├── plans/
│   ├── templates/
│   ├── login/
│   └── ...
└── lib/
    ├── auth.ts
    ├── supabase.ts
    ├── trainingStats.ts
    ├── LanguageProvider.tsx
    └── ThemeProvider.tsx
```

## Running Locally

```bash
npm install
npm run dev
```

The application requires a Supabase project and the environment variables described above. The Supabase database schema is not included in this repository.

## About

This repository is a public portfolio version of the Guidance PT Dashboard. Credentials, private configuration, and real user data are not included.
