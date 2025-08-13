/* eslint-disable no-undef */
/* eslint-env serviceworker */

// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDHccvEes3cl5ju4z_mQzjpXLBDqonfqkw",
  authDomain: "fb-facereko-notify.firebaseapp.com",
  projectId: "fb-facereko-notify",
  storageBucket: "fb-facereko-notify.firebasestorage.app",
  messagingSenderId: "899924612948",
  appId: "1:899924612948:web:55c6a9fb4945f37b56dac1",
  measurementId: "G-5WQ42Q2XCQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
