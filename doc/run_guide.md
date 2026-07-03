# Step-by-Step Setup and Execution Guide

This document explains how to configure, seed, and run the **Pharmalink AI** application (both backend and frontend) on your local machine.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
- **Python (v3.8 or higher)**
- **Node.js (v16 or higher)** and `npm`
- *(Optional)* **Tesseract OCR**: Required only if you want to test the prescription image upload and optical scanning locally (see instructions below).

---

## 1. Database Configuration (MongoDB)

The project has been migrated to use **MongoDB Atlas** for database storage. 

1. Ensure your MongoDB Atlas cluster is active and accessible.
2. In the `backend/` directory, create or edit the file named `.env`.
3. Set your connection URI (replace the password placeholder with your actual database credentials):
   ```env
   MONGODB_URI=mongodb+srv://nandini:nandini@16@cluster0.aiyiciq.mongodb.net/
   ```
   *(Note: The database connector automatically handles special characters like `@` in your password, so you can write it exactly as it is.)*

---

## 2. Importing Data to MongoDB

We have created an automated database seeding tool that reads the base CSV records and seeds them directly into your MongoDB database.

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the backend Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the migration script to clean and import the data:
   ```bash
   python import_csv_to_mongo.py
   ```
4. This script will drop any old collections and import the following:
   - **Pharmacies**: 12 stores mapped in Mumbai
   - **Stock**: ~4,500 medicine stock lists
   - **Catalog**: 439 real Indian medicines categorized by active ingredients
   - **Sales Transactions**: ~12,900 yearly sales logs
   - **Users**: 13 accounts (1 administrator and 12 branch managers)

---

## 3. Starting the Backend API

1. In the `backend/` directory, start the FastAPI application using Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
2. Verify the backend is running by opening your browser to:
   - **API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Interactive Swagger UI where you can test all endpoints manually).
   - **Welcome Message**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 4. Starting the Frontend UI

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies (only required on first run):
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL shown in the terminal (typically **[http://localhost:5173](http://localhost:5173)**).

---

## 5. Demo Accounts & Testing Logins

Once the application is running, you can log into the secure analytics dashboard using these pre-seeded demo accounts:

| Username | Password | Role | Visibility Scope |
|---|---|---|---|
| `admin` | `admin123` | Head Office (Admin) | Network-wide data + Account management access |
| `ph001` to `ph012` | `pharma123` | Pharmacy Branch Manager | Scoped strictly to that branch's data |

---

## Optional: Installing Tesseract OCR (For Prescription Upload)

If you wish to test the prescription upload feature locally:
1. **Windows Installer**: Download the installer from the [UB Mannheim Tesseract Repository](https://github.com/UB-Mannheim/tesseract/wiki).
2. **Install**: Run the installer and note the install folder (typically `C:\Program Files\Tesseract-OCR`).
3. **Environment Variable**: Add `C:\Program Files\Tesseract-OCR` to your Windows `Path` variable.
4. **Restart**: Restart your terminal and run `tesseract --version` to confirm installation.
