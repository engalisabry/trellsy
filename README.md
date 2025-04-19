# Trellsy ![Project Screenshot](public/logo.svg)

> A modern, collaborative project management tool inspired by Trello. Built with
> Next.js, TypeScript, Tailwind CSS, and Supabase.

---

[![Next.js](https://img.shields.io/badge/Next.js-15-blue?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-blue?logo=tailwindcss)](https://tailwindcss.com/)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

Trellsy is a powerful, extensible, and user-friendly project management tool
designed to help teams organize tasks, collaborate, and achieve their goals
efficiently. Inspired by Trello, Trellsy offers boards, lists, cards, user
authentication, and real-time collaboration features.

## Features

- Kanban-style boards, lists, and cards
- User authentication (Supabase)
- Organization and team management
- Responsive and modern UI
- Drag-and-drop functionality
- Real-time updates (React Query, Zustand)
- Theming (dark/light mode)
- Secure data handling (encryption utilities)

## Tech Stack

- **Framework:** Next.js 15, React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS, tw-animate-css
- **UI Components:** Radix UI, Lucide React
- **State Management:** Zustand, React Query
- **Backend:** Supabase (auth & database)
- **Utilities:** Axios, clsx, class-variance-authority
- **Tooling:** ESLint, Prettier, TypeScript

## Project Structure

```
├── app/                # Application routes and pages
│   ├── (marketing)/    # Marketing/public pages
│   ├── (platform)/     # Core platform pages (boards, lists, etc.)
│   └── protected/      # Protected/authenticated routes
├── components/         # Reusable UI components
│   └── ui/             # Shared UI primitives
├── config/             # Project configuration
├── contexts/           # React context providers (state, auth)
├── hooks/              # Custom React hooks
├── lib/                # Utilities (API, encryption, supabase)
├── public/             # Static assets (logo, fonts, images)
├── styles/             # Global styles (if any)
├── types.ts            # Global TypeScript types
├── .env.local          # Environment variables
├── package.json        # Project metadata and scripts
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm, npm, or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trellsy.git
   cd trellsy
   ```
2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```
3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local` and fill in required values
     (Supabase credentials, etc).

### Running Locally

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Sign up or log in.
- Create or join an organization.
- Create boards, lists, and cards.
- Drag and drop cards between lists.
- Switch themes using the theme toggle.

## Available Scripts

- `dev` — Start development server
- `build` — Build for production
- `start` — Start production server
- `lint` — Run ESLint
- `format` — Format codebase with Prettier
- `format:check` — Check formatting
- `format:fix` — Fix formatting in app/

## Contributing

Contributions are welcome! Please open issues or submit pull requests for
improvements and bug fixes.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and open a PR

## License

This project is licensed under the MIT License.

---

> _Trellsy — Inspired by Trello. Built for modern teams._
