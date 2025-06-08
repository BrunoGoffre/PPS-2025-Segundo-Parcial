import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root',
})
export class ToolsService {
  constructor() {}

  async ReadQr(): Promise<string | null> {
    try {
      const result = await BarcodeScanner.scan();
      return result.barcodes.length > 0 ? result.barcodes[0].rawValue : null;
    } catch (err) {
      return null;
    }
  }

  async VibrateError() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }
}
