# 🏙️ CiviQ — Your Voice, Your City

**CiviQ** is a real-time civic engagement platform that connects **citizens** with **local authorities** to report and resolve community issues faster and more transparently.

Users can report problems like potholes, waterlogging, or broken streetlights with text, images, or voice — while municipal admins manage, respond, and update statuses instantly from a dedicated dashboard.

---

## 🎯 Purpose

To build a transparent, AI-powered civic communication system that empowers citizens and streamlines municipal response — replacing outdated complaint systems with accountability and speed.

---

## ⚡ Key Features

### 👤 User Side
- **Multi-Factor Authentication** using **Email or Twilio SMS OTP**
- **Report Issues** with photos, videos, or voice recordings
- **Real-Time Notifications** on report status or admin messages
- **My Reports Dashboard** showing all submissions with live status
- **AI-Generated Badges** for resolved reports and community impact

### 🛠️ Admin Side
- **Secure Admin Dashboard** with all user reports
- **Status Management**: Submitted → In Progress → Resolved
- **AI Smart Replies** (powered by Gemini 2.5 Flash)
- **Direct Messaging** to individual users
- **Broadcast Messages** to all users
- **In-Page Media Viewer** (view photos, play audio directly)
- **AI Duplicate Detection** using text similarity + geolocation

---

## 🧠 Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React (Vite), Tailwind CSS, React Router | Fast, modern UI |
| **Backend** | Node.js / Express | REST API and server logic |
| **Database & Auth** | Supabase (Postgres + Auth) | Secure storage & authentication |
| **OTP** | Twilio Verify API | SMS-based OTP login |
| **AI** | Gemini 2.5 Flash (Google AI), Hugging Face | Smart replies & badge generation |
| **Search** | Elasticsearch | Duplicate and priority detection |
| **Realtime** | Supabase Broadcast | Live notifications and updates |
| **Hosting** | Vercel (Frontend), Render (Backend) | Deployment and scaling |

---

## ⚙️ Environment Setup & Server Start

Create a `.env` file in your **backend** directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_sid
 
# Start Backend
cd backend
npm install
npm run dev

# Start Frontend
cd frontend
npm install
npm run dev

# Visit the app
http://localhost:5173

