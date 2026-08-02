# VoiceVault Med — Enterprise Hospital Management System

**Secure Records. Immutable History. Cryptographic Verification. Trusted Healthcare.**

> **Core Architectural Principle:** A medical record is never silently overwritten. Every correction creates a new cryptographically linked version, preserving the complete diagnostic history of the patient.

---

## 📋 Table of Contents
- [1. Executive Summary & Architecture](#1-executive-summary--architecture)
- [2. Primary Roles & Dashboards](#2-primary-roles--dashboards)
- [3. Key Features](#3-key-features)
- [4. Cryptographic SHA-256 Hash Chain](#4-cryptographic-sha-256-hash-chain)
- [5. Zero Trust Authorization Engine](#5-zero-trust-authorization-engine)
- [6. IPFS Voice Consultation Integration](#6-ipfs-voice-consultation-integration)
- [7. Tech Stack & Environment Setup](#7-tech-stack--environment-setup)
- [8. Database Schema & Prisma Models](#8-database-schema--prisma-models)
- [9. Testing & Verification](#9-testing--verification)

---

## 1. Executive Summary & Architecture

**VoiceVault Med** is a full-stack, enterprise-grade healthcare management application built with Next.js (App Router), TypeScript, PostgreSQL, Prisma, and Pinata IPFS.

### System Architecture
```
[User Browser] ──> [Next.js App Router & Middleware]
                       │
                       ├──> [JWT & Zero Trust Access Policies]
                       ├──> [SHA-256 Hash Chain Engine (MedicalRecordVersion)]
                       ├──> [IPFS Audio Pinning Engine (Pinata + Local Fallback)]
                       └──> [PostgreSQL DB via Prisma ORM]
```

---

## 2. Primary Roles & Dashboards

### 👑 ADMIN (System Administration & Review)
- Access Admin Dashboard (`/admin`).
- Review pending patient/doctor correction requests with approve/reject actions.
- Approving a correction generates a new immutable `MedicalRecordVersion` without mutating prior records.
- View user directory, audit chain logs, and system security state.

### 📋 STAFF (Front Desk & Queue Operations)
- Access Staff Dashboard (`/staff`).
- Register new patient accounts and assign doctors.
- Schedule patient appointments and manage daily queue numbers.
- Monitor active queues and audit events.

### 🩺 DOCTOR (Clinical Practitioner Workspace)
- Access Doctor Dashboard (`/doctor`).
- Access assigned patient list (enforced by Zero Trust).
- Author new medical records and record voice consultations directly from browser microphone.
- Stream IPFS audio recordings with SHA-256 integrity verification.
- Review upcoming appointments.

### 👤 PATIENT (Self-Service Health Portal)
- Access Patient Dashboard (`/patient`).
- Self-register or log into personal profile.
- View complete immutable medical history version timeline (Version 1 → Version 2).
- Listen to voice consultations pinned on IPFS.
- Request record corrections.
- Download/Print official PDF medical reports.

---

## 3. Key Features

- **Immutable Versioning**: Previous diagnostic records are preserved forever.
- **Cryptographic Proofs**: SHA-256 hash calculated over key-sorted canonical record version representations.
- **Zero Trust Security**: Route middleware and server-side authorization helpers enforce identity, role, and doctor-patient relationship checks.
- **Decentralized Voice Storage**: Browser audio recording pinned to IPFS (Pinata cloud with offline local fallback).
- **Printable PDF Reports**: HTML/PDF export engine with doctor signatures and hash verification badges.
- **Enterprise Medical Design System**: Clean light neutral palette (`#2563EB` Medical Blue, `#0F766E` Teal, `#F8FAFC` background, `#FFFFFF` cards, `#E2E8F0` borders).

---

## 4. Cryptographic SHA-256 Hash Chain

Every `MedicalRecordVersion` computes a SHA-256 hash over canonical fields:
```text
Version 1 (Genesis):
previousHash = null
currentHash = SHA256(canonical(Version 1))

Version 2 (Approved Correction):
previousHash = Version1.currentHash
currentHash = SHA256(canonical(Version 2))
```

---

## 5. Tech Stack & Environment Setup

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Database & ORM**: PostgreSQL & Prisma ORM 5
- **Authentication**: JWT signed with Jose, HTTP-only secure cookies
- **Storage**: IPFS via Pinata API + Local File Adapter
- **Testing**: Vitest test runner
- **Styling**: Tailwind CSS + Enterprise Neutral Medical Tokens

### Environment Variables (`.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voicevault_med?schema=public"
AUTH_SECRET="voicevault_med_secure_jwt_secret_key_32bytes_min_length_2026!"
PINATA_JWT="your_pinata_jwt_here"
NEXT_PUBLIC_PINATA_GATEWAY_URL="https://gateway.pinata.cloud/ipfs"
```

### Quickstart Commands
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed demo accounts and sample data
npm run db:seed

# Run unit test suite
npm test

# Run Next.js development server
npm run dev
```

---

## 6. Demo Accounts

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@voicevault.med` | `Password123!` |
| 📋 Staff | `staff@voicevault.med` | `Password123!` |
| 🩺 Doctor | `dr.smith@voicevault.med` | `Password123!` |
| 🩺 Doctor 2 | `dr.jones@voicevault.med` | `Password123!` |
| 👤 Patient | `john.doe@patient.med` | `Password123!` |
| 👤 Patient 2 | `jane.smith@patient.med` | `Password123!` |
