# Project Manager Mobile App

React Native (Expo) app for your Project Manager backend.

## Prerequisites
- Node 18+
- Expo Go app on your phone, or Android Studio/iOS Simulator
- Backend running locally at http://localhost:5000

Note: On Android emulator, the backend URL is `http://10.0.2.2:5000` (already configured in `app.json > extra.apiBaseUrl`).

## Quick Start

1. Start your backend server:
   ```bash
   cd ../server
   npm start
   ```

2. Start the mobile app:
   ```bash
   cd mobile
   npm start
   ```

3. Scan the QR code with Expo Go app on your phone, or press `a` for Android emulator.

## Scripts
- `npm start` – start Expo dev server
- `npm run android` – start app on Android
- `npm run ios` – start app on iOS (macOS required)
- `npm run web` – start web build

## Structure
```
mobile/
  src/
    api/          # axios client and endpoint helpers
    context/      # Auth context
    navigation/   # Navigation stacks/tabs
    screens/      # Screens: Login, Dashboard, Projects, etc
    components/   # Reusable UI components
    utils/        # config
```

## Features
- **Authentication**: Login/Register with JWT token persistence
- **Dashboard**: Overview of projects, clients, time entries
- **Projects**: List, search, and view project details
- **Time Entries**: Track and view time entries
- **Clients**: Manage client information
- **Profile**: User profile and logout

## Environment
Update `app.json` extra.apiBaseUrl if your backend URL differs.

## Auth
- Use Register once to create a manager (email/password)
- Then Login; token is stored in SecureStore
