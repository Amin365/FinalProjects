import api from "@/app/api/apislice";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Call this after login with token
export async function enableNotifications(token) {
  if (!("serviceWorker" in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY. Add the VAPID public key to the frontend environment.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const reg = await navigator.serviceWorker.ready;
  const activeRegistration = reg || registration;

  // Check existing subscription
  let sub = await activeRegistration.pushManager.getSubscription();
  if (!sub) {
    sub = await activeRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }

  await api.post("/push/subscribe", sub, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
