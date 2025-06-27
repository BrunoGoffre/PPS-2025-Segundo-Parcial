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
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#355ca1',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#355ca1',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: false,
      splashImmersive: false
    }
  },
  ios: {
    preferredContentMode: 'mobile',
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
