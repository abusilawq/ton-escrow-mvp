/// <reference types="vite/client" />

// Declare Telegram WebApp global
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: any;
  MainButton: any;
  HapticFeedback: any;
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  showPopup: (params: any, callback?: (id: string) => void) => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  sendData: (data: string) => void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TON_NETWORK: string;
  readonly VITE_CONTRACT_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
