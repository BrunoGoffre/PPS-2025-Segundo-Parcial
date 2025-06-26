import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({ projectId: "pps-bonappetit", appId: "1:209035081342:web:bc432a2d8002edf5ef4a2f", storageBucket: "pps-bonappetit.firebasestorage.app", apiKey: "AIzaSyAJA-lRQPUVorGD3lmTlbBCJfyuD5qRSyY", authDomain: "pps-bonappetit.firebaseapp.com", messagingSenderId: "209035081342" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
  ]
}; 