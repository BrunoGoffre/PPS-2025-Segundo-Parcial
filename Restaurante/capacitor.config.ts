import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'io.ionic.restaurante',
  appName: 'Restaurante',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Ionic,
      resizeOnFullScreen: true,
    },
    BarcodeScannerMlkit: {
      cameraPermissionText: "Se necesita permiso de cámara para escanear códigos",
      googleBarcodeScannerModuleInstallTitle: "Instalación de módulo de escaneo",
      googleBarcodeScannerModuleInstallMessage: "Se necesita instalar el módulo de escaneo de códigos de barras de Google"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  ios: {
    preferredContentMode: 'mobile',
    contentInset: 'automatic'
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
