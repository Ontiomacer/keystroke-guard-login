
# Behavioral Fraud Detection for Mobile & Internet Banking

A sophisticated full-stack authentication system that prevents impersonated banking registrations using keystroke dynamics and machine learning.

## 🚀 Features

- **Behavioral Authentication**: Keystroke dynamics analysis using OneClassSVM
- **OTP Fallback System**: Secure email-based verification for high-risk attempts
- **Real-time Risk Scoring**: ML-powered fraud detection
- **Beautiful Dashboard**: Risk analytics and login history visualization
- **Glassmorphism UI**: Modern dark theme with smooth animations

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- React Router for navigation

### Backend (Setup Required)
- FastAPI for REST API
- OneClassSVM for behavioral modeling
- SMTP for email delivery
- Joblib for model persistence

## 🎯 Getting Started

### Frontend Setup (Current)
The frontend is already configured and running. It includes:
- Login with keystroke capture
- OTP verification interface  
- Security dashboard with analytics
- Responsive glassmorphism design

### Backend Setup (Required)

Create a `backend/` directory and implement the following structure:

```
backend/
├── main.py              # FastAPI application
├── utils/
│   ├── email.py         # Email and OTP utilities
│   └── model.py         # ML model functions
├── models/              # Trained models per user
├── .env                 # Environment variables
├── otp_audit.log        # Security logs
├── requirements.txt     # Python dependencies
└── train_model.py       # Model training script
```

#### Backend Dependencies
```bash
pip install fastapi uvicorn scikit-learn joblib python-dotenv python-multipart
```

#### Environment Variables (.env)
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### FastAPI Endpoints

**POST /analyze**
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "typing_data": [
    {"key": "a", "timestamp": 1642000000000, "delay": 150},
    {"key": "b", "timestamp": 1642000000150, "delay": 120}
  ]
}
```

Response:
```json
{
  "success": true,
  "needs_otp": false,
  "risk_score": 0.123,
  "message": "Low risk authentication"
}
```

**POST /verify-otp**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

## 🔐 Security Features

- **Keystroke Dynamics**: Captures timing patterns between keystrokes
- **ML Risk Scoring**: OneClassSVM model analyzes behavioral patterns
- **OTP Fallback**: 6-digit codes with 5-minute expiry
- **Audit Logging**: All authentication attempts are logged
- **Rate Limiting**: Prevents brute force attacks

## 🎨 UI Features

- **Glassmorphism Design**: Semi-transparent cards with backdrop blur
- **Dark Theme**: Sophisticated slate color palette
- **Smooth Animations**: Framer Motion transitions
- **Responsive Layout**: Mobile-first design approach
- **Real-time Feedback**: Live typing analysis and risk indicators

## 📊 Dashboard Analytics

- Login success rates
- Authentication method distribution
- Risk score trends over time
- Recent activity timeline
- Security alerts and notifications

## 🚨 Risk Assessment

- **Low Risk (< 0.3)**: Direct behavioral authentication
- **Medium Risk (0.3-0.6)**: Additional verification required
- **High Risk (> 0.6)**: OTP fallback mandatory

## 🔧 Development

The frontend includes comprehensive error handling, loading states, and user feedback. The typing capture component records keystroke dynamics with precision timing for behavioral analysis.

Key components:
- `TypingCapture`: Records keystroke patterns
- `AuthCard`: Glassmorphism authentication container
- `RiskGraph`: Risk visualization with Recharts
- `Dashboard`: Security analytics interface

## 📱 Mobile Support

Fully responsive design optimized for mobile banking applications with touch-friendly interfaces and adaptive layouts.

## 🛡️ Production Considerations

- Implement rate limiting on authentication endpoints
- Use secure session management
- Enable HTTPS in production
- Regular model retraining with new behavioral data
- Comprehensive audit logging
- Backup and recovery procedures

---

**Note**: This implementation provides the complete frontend interface. The backend FastAPI server needs to be implemented separately following the API specifications above.
