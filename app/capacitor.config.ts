import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.coldloop.monitor",
  appName: "ColdLoop",
  webDir: "dist",
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Looking for ColdLoop-01…",
        cancel: "Cancel",
        availableDevices: "Cold-chain sensor nodes",
        noDeviceFound: "No ColdLoop node found",
      },
    },
  },
};

export default config;
