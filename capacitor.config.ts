import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.giftapp.gift',
  appName: 'GIFT',
  webDir: 'out',
  server: {
    // Point to the live Vercel URL so we get server-side features
    url: 'https://gift-app-lyart.vercel.app',
    cleartext: false,
  },
};

export default config;
