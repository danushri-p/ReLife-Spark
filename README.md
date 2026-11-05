~# ReLife-Spark

> **Know before you pay.**

ReLife-Spark is an AI-powered smartphone repair decision platform that helps users determine whether repairing or replacing a damaged smartphone is the better option. By analyzing device information, damage images, repair quotations, and replacement costs, it provides transparent cost comparisons and intelligent recommendations.

---

## 1. Problem Statement

When electronic devices break, people often struggle to decide whether repairing or replacing them is the better option. Repair costs, technician quotations, replacement prices, and device conditions are difficult to compare because the information is scattered and not always transparent.

As a result, people may spend more than necessary on repairs or replacements, while repairable devices are unnecessarily discarded, contributing to electronic waste.

## 2. Proposed Solution

ReLife-Spark is an AI-powered platform that helps users make informed decisions about whether to repair or replace their smartphones.

Users can:

- Enter their device details.
- Upload photos of damaged smartphones.
- Upload repair quotations.
- Provide replacement prices.

The platform analyzes the submitted information, compares repair costs with reference prices, calculates a Repair Score, and provides an understandable recommendation.

It also uses **Google Gemini AI** and **Retrieval-Augmented Generation (RAG)** to provide explanations based on trusted repair guides and warranty documents.

> **⚠️ Important Notice:** ReLife-Spark is an informational tool. It does **not** guarantee unbiased decisions, diagnose hardware faults conclusively, or assess technician honesty based on price.

## 3. Project Requirements

### 3.1 Functional Requirements

#### 1. Device Information
- Enter smartphone brand and model.
- Enter device age and condition.
- Provide warranty status.
- Describe the device problem.

#### 2. Photo Diagnosis
- Upload an image of the damaged smartphone.
- Analyze visible damage using the Gemini API.
- Display possible issues and estimated severity.

#### 3. Repair Quote Analysis
- Upload repair quotations in PDF or image format.
- Extract parts, labour charges, and total cost.
- Compare extracted prices with reference repair prices.
- Display price comparison results.
- Suggest questions to ask the technician.

#### 4. Repair Score and Recommendation
- Calculate a Repair Score using JavaScript.
- Consider repair cost, replacement cost, device age, warranty, repairability, and device condition.
- Display one of three recommendations: `REPAIR`, `EITHER`, or `REPLACE`.
- Explain the recommendation.

#### 5. RAG-Based Knowledge Assistant
- Use repair manuals, warranty policies, and repair guides.
- Extract and divide documents into smaller chunks.
- Generate embeddings using the Gemini Embedding API.
- Store document chunks and embeddings in MongoDB Atlas.
- Retrieve relevant information using MongoDB Atlas Vector Search.
- Generate answers with document references.

#### 6. Environmental Impact
- Estimate potential e-waste avoided.
- Display estimated CO₂e impact where reliable data is available.
- Show potential cost differences between repair and replacement.

### 3.2 Non-Functional Requirements

- Simple and user-friendly interface.
- Responsive design.
- Secure API key management.
- Proper input validation.
- Support for PDF and image uploads.
- Reliable calculation results.
- Clear error handling.
- Display sources for RAG-based answers.

## 4. Repair Score Calculation

ReLife-Spark uses a weighted scoring system to evaluate whether repairing or replacing a smartphone is the better decision.

### 4.1 Scoring Factors

| Factor | Weight |
|---|---:|
| Repair cost compared to replacement cost | 35% |
| Device age | 25% |
| Warranty status | 15% |
| Repairability | 15% |
| Overall device condition | 10% |
| **Total** | **100%** |

### 4.2 Recommendation Criteria

| Repair Score | Recommendation |
|---|---|
| 60 or above | REPAIR |
| 40–59 | EITHER |
| Below 40 | REPLACE |

**Note:** The scoring system is implemented in JavaScript. Gemini AI is used for analysis and explanations, not numerical calculations.

## 5. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS |
| Programming Language | JavaScript (ES Modules) |
| Routing & State | React Router DOM |
| HTTP Client | Axios |
| UI Icons | Lucide React |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Security | Helmet, CORS, Express Validator |
| File Uploads | Multer (Images & PDFs) |
| AI Model | Google Gemini API (Gemini 1.5 Flash) |
| Embeddings | Gemini Embedding API (text-embedding-004) |
| RAG Retrieval | MongoDB Atlas Vector Search |
| API Testing | Postman |
| Version Control | Git + GitHub |
| Deployment | Vercel (Frontend), Render (Backend) |

## 6. Project Architecture & Folder Structure

```text
ReLife-Spark/
│
├── client/                     # Frontend (React + Vite + Tailwind CSS)
│   ├── public/
│   │   └── spark.svg           # Application favicon
│   ├── src/
│   │   ├── assets/             # Static assets & illustrations
│   │   ├── components/         # Reusable UI & Layout Components
│   │   │   ├── common/
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   └── ui/             # Card, Button, Alert
│   │   ├── pages/              # Home, Dashboard, DeviceDetails, RepairAnalysis, KnowledgeAssistant
│   │   ├── services/           # api.js, deviceService.js, healthService.js, uploadService.js
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # React context providers
│   │   ├── utils/              # Client formatters and helpers
│   │   ├── App.jsx             # Main Router configuration
│   │   ├── main.jsx            # React root entry point
│   │   └── index.css           # Tailwind CSS directives & global styling
│   ├── .env.example            # Frontend environment template
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                     # Backend (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/             # db.js (MongoDB Mongoose connection)
│   │   ├── controllers/        # health, device, diagnosis, quote, repair, assistant controllers
│   │   ├── models/             # Device.js Mongoose schema
│   │   ├── routes/             # Express API routes
│   │   ├── middleware/         # errorHandler.js, upload.js (Multer)
│   │   ├── services/           # geminiService.js (Google GenAI integration)
│   │   ├── utils/              # Deterministic calculation engine & helpers
│   │   ├── validators/         # deviceValidator.js (express-validator)
│   │   ├── app.js              # Express app setup, CORS, Helmet, routes
│   │   └── server.js           # Server listen & graceful shutdown
│   ├── uploads/                # Local staging for uploaded files (.gitkeep)
│   ├── .env.example            # Backend environment template
│   └── package.json
│
├── .gitignore
├── package.json                # Root orchestration with concurrently
└── README.md
```

## 7. API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, uptime, MongoDB state, and Gemini readiness |
| `POST` | `/api/devices` | Submit smartphone details and problem symptoms |
| `GET` | `/api/devices/:id` | Retrieve stored device details by ID |
| `POST` | `/api/diagnosis/upload` | Upload smartphone damage photos (Multer validation) |
| `POST` | `/api/quotes/upload` | Upload repair quotation documents (PDF / Image) |
| `POST` | `/api/repair/analyze` | Evaluate repair score and cost comparison |
| `POST` | `/api/assistant/chat` | Conversational RAG knowledge assistant |

## 8. Installation & Setup Guide

### 8.1 System Prerequisites
- Node.js (v18.0.0 or later, v20 LTS recommended)
- npm (v9+)
- MongoDB Atlas cluster connection string
- Google Gemini API key

### 8.2 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/ReLife-Spark.git
   cd ReLife-Spark
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

4. **Install client dependencies:**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   ```

### 8.3 Environment Configuration

**`server/.env`:**
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

**`client/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 9. Running the Application

### Option A: Run Both Frontend & Backend Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### Option B: Run Individually

**Start the Backend Server:**
```bash
npm run dev:server
# or
cd server && npm run dev
```

**Start the Frontend Client:**
```bash
npm run dev:client
# or
cd client && npm run dev
```

## 10. Expected Outcome & Project Vision

ReLife-Spark aims to make smartphone repair decisions more transparent, affordable, and sustainable.

By combining AI-powered analysis, cost comparison, and trusted repair knowledge, the platform empowers users to make informed decisions before spending money on repairs or replacements.

> **Repair smarter. Spend wisely. Reduce e-waste.**

https://re-life-spark.vercel.app/