/* eslint-disable no-undef */
/* eslint-env serviceworker */

// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCzL5FjaYD2jgYCB_USv_K8qtVGHqQEya0",
    authDomain: "push-notify-53b8c.firebaseapp.com",
    projectId: "push-notify-53b8c",
    storageBucket: "push-notify-53b8c.appspot.com",
    messagingSenderId: "625713043083",
    appId: "1:625713043083:web:6c00bbd6b0846d34f2268e"
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
