import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword} from '@angular/fire/auth';
import { User as FirebaseUser, UserCredential} from 'firebase/auth';
import { getAuth, signOut } from 'firebase/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { PushNotificationsService } from '../services/push-notifications.service';
import { User } from '../models/user';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  currentUser$: Observable<FirebaseUser | null>;
  userActive: FirebaseUser | null = null; 
  private usuarioSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private auth: Auth, 
    private router: Router, 
    private firestore: Firestore, 
    private pushNotificationsService: PushNotificationsService,
    private supabaseService: SupabaseService
  ) {
    this.currentUser$ = authState(this.auth);
    // Suscribirse al estado de autenticación y actualizar `userActive`
    this.currentUser$.subscribe(user => {
      if(user){
        this.userActive = user;
        this.pushNotificationsService.init(this.userActive);
      }
      else
      {
        this.userActive = null;
      }
    });
  }

  async register({ email, password }: { email: string, password: string }): Promise<UserCredential | undefined> {
    return createUserWithEmailAndPassword(this.auth, email, password)
  }

  /**
   * Registra un nuevo usuario con imagen usando Supabase Storage
   * @param userData Datos del usuario
   * @param avatarFile Archivo de imagen del usuario
   * @param password Contraseña del usuario
   * @returns Promise con el resultado del registro
   */
  async registerWithAvatar(userData: Partial<User>, avatarFile: File, password: string): Promise<boolean> {
    try {
      // 1) Crear usuario con Firebase Auth
      const cred = await this.register({ email: userData.mail || '', password });
      const userId = cred?.user.uid;

      if (!userId) {
        return false;
      }

      // 2) Subir imagen a Supabase
      const avatarUrl = await this.supabaseService.uploadAvatar(avatarFile, userId);

      // 3) Armar el objeto completo
      const newUser: User = {
        id: userId,
        ...userData,
        imagen: avatarUrl ?? ''   // guardamos la URL en el campo `imagen`
      };

      // 4) Guardar en Firestore
      await setDoc(doc(this.firestore, 'usuarios', userId), newUser);
      
      return true;
    } catch (error) {
      console.error('Error al registrar usuario con avatar:', error);
      return false;
    }
  }

  login({ email, password }: { email: string, password: string }) {  
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    this.pushNotificationsService.deleteToken();
    const auth = getAuth();

    signOut(auth)
    .then(() => {
      this.router.navigate(['/login']);
    });
  }

  logoutSinRedireccion(){
    this.pushNotificationsService.deleteToken();
    const auth = getAuth();
    signOut(auth);
  }

   
  getCurrentUser(): Observable<FirebaseUser | null> {
    return this.currentUser$.pipe(
      map((user) => user || null)
    );
  }

  getUserEmail(): string | null {
    const currentUser = this.auth.currentUser;
    return currentUser ? currentUser.email : null;
  }

  getUserId(): string | null {
    return this.userActive ? this.userActive.uid : null;
  }

}