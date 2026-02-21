# Nutralyze

An AI-powered nutrition and calorie estimation web application that helps users track their food intake and maintain a healthy lifestyle.

## Features

- 🔍 AI-powered food recognition and nutrition analysis
- 📊 Personalized diet plans based on user preferences
- 📱 Real-time food logging with camera integration
- 💬 AI nutrition assistant powered by Google's Gemini
- 📈 Progress tracking and goal monitoring
- 🔐 Secure Google authentication
- 🎯 Daily goals and streak tracking

## Tech Stack

- React + Vite
- Material-UI
- Firebase (Authentication, Firestore, Storage)
- Google Gemini AI
- EfficientNet (Food Detection Model)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Google Cloud account with Gemini API access

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nutri-vision.git
   cd nutri-vision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Google sign-in
   - Create a Firestore database
   - Enable Storage

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values
   - Add your Gemini API key

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── auth/          # Authentication components
│   ├── chat/          # ChatBot components
│   └── layout/        # Layout components
├── pages/             # Page components
├── firebase.js        # Firebase configuration
├── theme.js           # Material-UI theme
└── main.jsx          # Application entry point
```

## Database Schema

The application uses Firebase Firestore with the following collections:

- `users`: User profiles and authentication data
- `userProfiles`: Detailed user information and preferences
- `mealLogs`: Food logging entries with images and nutrition data
- `dietPlans`: AI-generated personalized diet plans
- `chatMessages`: User-AI chat history

## AI Integration

### Food Detection

The application uses a pre-trained EfficientNet model for food detection. The model files should be placed in:

```
public/
└── models/
    ├── efficientnet.pth
    └── categories.txt
```

### Nutrition Analysis

The application uses Google's Gemini AI to:
- Generate personalized diet plans
- Provide nutrition advice
- Calculate nutritional values
- Offer meal suggestions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

This site is deployed in render using docker you can access this site at https://nutrivision-oc9q.onrender.com

## Real-time Research Project by the Team Sainz

- 🧠 Vineel Yerubandi — Team Lead & Database designer
   - Led the team and played a key role in training the AI model & in creating the Database design.
- 🤖 K. Sri Rishikesh Varma — AI Developer & Backend Developer
   - Developed the AI model and implemented its integration with the backend system.
- 🎨 Kota Shiva Tarak Reddy — UI Designer & AI Developer
   - Designed the user interface and actively participated in data gathering for training the AI model.
- 🔧 Solomon Heron — Backend Developer & Data Scientist
   - Handled the backend systems and collaborated in data collection, preprocessing, and labeling.
- 💻 Satyadeva — Frontend Developer & Tester
   - Built the frontend interface and conducted rigorous testing of the application to ensure quality.
 
###### Done by 2nd Year Students of KMIT
