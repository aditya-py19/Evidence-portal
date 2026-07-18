# Evidence Portal – AI Powered Digital Evidence Trust Platform

Enterprise-grade web application for Police Departments, Forensic Laboratories, and Courts to securely manage, verify, and track digital evidence using AI, Blockchain, and Digital Forensics.

![Evidence Portal](public/favicon.svg)

## Features

- **Secure Login** with MFA and role-based access (5 roles)
- **Dashboard** with 10 analytics cards and 4 interactive charts
- **Case Management** – create, search, filter, update, close cases
- **Evidence Management** – drag & drop upload with progress tracking
- **AI Verification** – deepfake, forgery, tampering, metadata analysis
- **Dynamic Trust Score** – 0-100 multi-factor scoring with breakdown
- **Chain of Custody** – interactive timeline with blockchain TX IDs
- **Evidence Passport** – digital identity with QR code
- **Geolocation Verification** – GPS match with trust score impact
- **Blockchain Module** – Hyperledger Fabric + IPFS integration
- **Court Verification Portal** – hash comparison and certificate download
- **Audit Logs** – table and timeline views
- **Notification Center** – real-time alerts
- **Access Control** – RBAC with approval workflows
- **User Management** – create, assign roles, deactivate
- **Security Settings** – password policy, MFA, encryption, AI config
- **User Profile** – officer details and activity timeline

## Tech Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS (dark theme, glassmorphism)
- Recharts (analytics charts)
- Framer Motion (animations)
- Lucide React (icons)
- React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd Projects/trustchain
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Login Credentials

| Field | Value |
|-------|-------|
| Username | `rajesh.kumar` |
| Password | `EvidencePortal@2026` |
| MFA Code | Any 6 digits (e.g. `123456`) |
| Role | Any role (Investigating Officer recommended) |

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/     # Sidebar, TopBar, AppLayout
│   └── ui/         # GlassCard, StatCard, TrustMeter, Modal, etc.
├── context/        # Auth & App state
├── data/           # Realistic mock data
├── lib/            # Utility functions
├── pages/          # 17 feature pages
└── types/          # TypeScript interfaces
```

## Design System

- **Theme**: Dark cybersecurity with glassmorphism
- **Colors**: Blue (#2563eb) and Cyan (#38bdf8) accents
- **Typography**: Inter (UI) + JetBrains Mono (code/hashes)
- **Components**: Glass cards, glow effects, smooth animations

## License

Built for Smart India Hackathon (SIH) and real-world government deployment.
