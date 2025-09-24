# 🏥 Mental Health Aftercare System

A comprehensive system for supporting patient recovery after discharge from mental health care through family engagement and continuous monitoring.

## 🌟 Overview

After discharge from mental health care, ongoing aftercare is crucial for recovery. This system sends regular feedback checklists to family members of discharged patients diagnosed with depression and similar conditions, providing actionable feedback to care providers and families.

## ✨ Key Features

### 📋 Checklist Delivery
- **Automated Daily Checklists**: Regular checklists sent to family members
- **Multi-channel Delivery**: Email and SMS notifications
- **Custom Scheduling**: Configurable delivery times and frequencies

### 👪 Family Member Portal
- **Easy Registration**: Simple sign-up process for family members
- **Secure Access**: Role-based authentication and authorization
- **Mobile-Friendly**: Responsive design for all devices
- **Progress Tracking**: View submission history and patient progress

### 👨‍⚕️ Provider Dashboard
- **Patient Management**: Complete CRUD operations for patients
- **Analytics & Reports**: Visual dashboards and trend analysis
- **Alert System**: Notifications for concerning patterns
- **Bulk Operations**: Manage multiple patients efficiently

### 📊 Monitoring Parameters
- **Sleep Quality**: "Did the patient sleep well?"
- **Outdoor Activity**: "Did the patient go for a walk?"
- **Medication Adherence**: "Is the patient taking medicines regularly?"
- **Mood Assessment**: Daily mood evaluation
- **Appetite Monitoring**: Eating habits and concerns
- **Social Interaction**: Engagement with family and friends
- **General Concerns**: Open-ended feedback and observations

### 🔔 Notification System
- **Smart Reminders**: Automated reminders for incomplete checklists
- **Escalation**: Multiple reminder attempts with increasing urgency
- **Customizable**: Personalized message templates
- **Multi-modal**: Email, SMS, and in-app notifications

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (handled by Docker)

### Option 1: Docker (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd mental-health-aftercare

# Start all services
docker-compose up -d

# Access the application
open http://localhost
```

### Option 2: Local Development
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start PostgreSQL
docker run -d --name postgres -e POSTGRES_DB=mental_health_aftercare -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -p 5432:5432 postgres:15

# Start backend
cd ../backend
npm run dev

# Start frontend
cd ../frontend
npm start
```

## 📁 Project Structure

```
mental-health-aftercare/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Authentication, validation
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API routes
│   │   └── utils/            # Helper functions
│   ├── tests/                # Backend tests
│   ├── package.json
│   └── server.js
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilities
│   ├── public/
│   └── package.json
├── database/                   # Database files
│   ├── migrations/           # Database migrations
│   ├── seeds/               # Sample data
│   └── init.sql             # Initial schema
├── docker-compose.yml         # Docker services configuration
├── .env.example              # Environment variables template
├── nginx/                     # Reverse proxy configuration
└── README.md
```

---

**Built with ❤️ for better mental health outcomes**