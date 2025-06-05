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
    }
  }
};

export default config;
