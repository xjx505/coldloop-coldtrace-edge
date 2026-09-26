import type { ReactNode } from "react";

type IconName = "live" | "history" | "device" | "settings" | "back" | "close" | "temperature" | "humidity" | "air" | "link" | "warning" | "check" | "clock" | "arrow" | "refresh" | "info";

const paths: Record<IconName, ReactNode> = {
  live: <><path d="M3 12h4l2.2-6 4.1 12 2.2-6H21"/><path d="M4 4h16v16H4z" opacity=".18"/></>,
  history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  device: <><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.8-1 1.8-1.3-.5a7.8 7.8 0 0 1-1.7 1l-.2 1.4h-2.1l-.3-1.4a7.7 7.7 0 0 1-1.9 0l-.8 1.2-1.9-1 .5-1.4a7.8 7.8 0 0 1-1.1-1.6l-1.4-.1v-2.1l1.4-.3a7.7 7.7 0 0 1 0-1.9l-1.2-.8 1-1.9 1.4.5a7.8 7.8 0 0 1 1.6-1.1l.1-1.4h2.1l.3 1.4a7.7 7.7 0 0 1 1.9 0l.8-1.2 1.9 1-.5 1.4a7.8 7.8 0 0 1 1.1 1.6l1.4.1v2.1l-1.4.3a7.7 7.7 0 0 1-.1 2Z"/></>,
  back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  temperature: <><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 12V6"/></>,
  humidity: <><path d="M12 3.2S5.5 10.1 5.5 14a6.5 6.5 0 1 0 13 0c0-3.9-6.5-10.8-6.5-10.8Z"/><path d="M9 15a3 3 0 0 0 3 3"/></>,
  air: <><path d="M3 8h12a3 3 0 1 0-3-3"/><path d="M3 12h16a2 2 0 1 1-2 2"/><path d="M3 16h8a3 3 0 1 1-3 3"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></>,
  warning: <><path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4m0 3h.01"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 9a7 7 0 0 1 11.6-2L20 12M4 12l2.7 5a7 7 0 0 0 11.6-2"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
};

export function Icon({ name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
