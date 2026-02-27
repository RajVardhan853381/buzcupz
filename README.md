# BuzCupz - Premium Restaurant Revenue Operating System

BuzCupz is an enterprise-grade, monorepo-based restaurant management platform designed to streamline operations, enhance guest experiences, and maximize revenue for modern cafes and coffee shops.

## 🚀 Key Features

-   **Intelligent POS & Order Management**: Real-time order tracking, kitchen display system (KDS), and seamless payment integrations.
-   **Smart Inventory & Wastage**: Automated stock tracking, wastage logging, and supplier management with low-stock alerts.
-   **Advanced Reservations**: Interactive table mapping, real-time availability checks, and guest communication tools.
-   **Analytics & Insights**: Comprehensive dashboard with sales trends, best-seller analysis, and peak pattern recognition.
-   **Compliance & Security**: Built-in GDPR tools, data portability features, and enterprise-grade authentication.

## 🛠 Tech Stack

-   **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide.
-   **Backend**: NestJS (Node.js), Prisma ORM, PostgreSQL, Redis.
-   **Infrastructure**: Monorepo managed by Turbo, Docker, BullMQ for job processing.

## 🏁 Getting Started

### Prerequisites

-   Node.js >= 18.0.0
-   PostgreSQL & Redis
-   NPM or PNPM

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CAFEelevate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root and in `apps/api`.
   - Configure your database and auth secrets.

4. Initialize the database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Demo Credentials

- **Email**: admin@buzcupz.com
- **Password**: password123

## 📜 License

This project is proprietary and unlicensed. All rights reserved.

---
© 2026 BuzCupz Engineering
