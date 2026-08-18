/**
 * Web Push & Browser Desktop Notification Helper
 * Triggers native system notifications even when the user is tabbed away or offline.
 */

export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showSystemNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          (reg as any).showNotification(title, {
            icon: "/teamflow-logo.png",
            badge: "/teamflow-logo.png",
            vibrate: [200, 100, 200],
            ...options,
          });
        });
      } else {
        new Notification(title, {
          icon: "/teamflow-logo.png",
          ...options,
        });
      }
    } catch (e) {
      console.warn("Desktop notification trigger failed:", e);
    }
  }
}
