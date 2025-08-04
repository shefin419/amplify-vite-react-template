let wakeLock: WakeLockSentinel | null = null;

export const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log("Screen Wake Lock is active");

      wakeLock.addEventListener('release', () => {
        console.log("Wake Lock was released");
      });
    } else {
      console.warn("Screen Wake Lock API not supported.");
    }
  } catch (err) {
    console.error("Failed to request Wake Lock:", err);
  }
};

export const releaseWakeLock = async () => {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
  }
};
