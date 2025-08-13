import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Amplify } from "aws-amplify";
import { onMessageListener, requestForToken } from "./firebase";
import outputs from '../amplify_outputs.json';
import { registerSW } from 'virtual:pwa-register';

Amplify.configure(outputs);

registerSW({
  onNeedRefresh() {
    console.log("🔄 New version available.");
  },
  onOfflineReady() {
    console.log("✅ App is offline ready.");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ width: "100%" }}>
      <App />
    </div>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Firebase SW registered:', registration);
      requestForToken();
    })
    .catch((err) => console.error('❌ Firebase SW registration failed:', err));
}



// Foreground FCM handling
onMessageListener()
  .then((payload) => {
    console.log('🔔 Foreground message received:', payload);
  })
  .catch((err) => {
    console.error('⚠️ Error listening to foreground messages:', err);
  });
