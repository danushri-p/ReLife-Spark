# ReLife-Spark

> **Know before you pay.**

ReLife-Spark is an AI-powered smartphone repair decision platform that helps users determine whether repairing or replacing a damaged smartphone is the better option. By analyzing device information, damage images, repair quotations, and replacement costs, it provides transparent cost comparisons and intelligent recommendations.

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
| Programming Language | JavaScript |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| AI Model | Google Gemini API |
| Embeddings | Gemini Embedding API |
| RAG | MongoDB Atlas Vector Search |
| API Testing | Postman |
| Version Control | Git + GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## 6. System Requirements

Before running the project, ensure the following are available:

- Node.js and npm
- MongoDB Atlas account
- Google Gemini API key
- Git and GitHub
- Code editor such as Visual Studio Code

## 7. Expected Outcome

ReLife-Spark aims to provide a platform where users can:

- Understand possible smartphone damage.
- Analyze and compare repair quotations.
- Compare repair and replacement costs.
- Receive an understandable repair recommendation.
- Access repair and warranty information through AI.
- Understand the potential financial and environmental impact of their decision.

## 8. Project Vision

ReLife-Spark aims to make smartphone repair decisions more transparent, affordable, and sustainable.

By combining AI-powered analysis, cost comparison, and trusted repair knowledge, the platform empowers users to make informed decisions before spending money on repairs or replacements.

> **Repair smarter. Spend wisely. Reduce e-waste.**