import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword} from '@angular/fire/auth';
import { User, UserCredential} from 'firebase/auth';
import { getAuth, signOut } from 'firebase/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import { NotificationsPushService } from '../SERVICIOS/notifications-push.service';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  currentUser$: Observable<User | null>;
  userActive: User | null = null; 
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);

  constructor(private auth: Auth, private router: Router, private firestore: Firestore, private notificationsPushService:NotificationsPushService) {
    this.currentUser$ = authState(this.auth);
    // Suscribirse al estado de autenticación y actualizar `userActive`
    this.currentUser$.subscribe(user => {
      if(user){
        this.userActive = user;
        this.notificationsPushService.init(this.userActive);
      }
      else
      {
        this.userActive = null;
      }
    });
  }

  async register({ email, password }: any): Promise<UserCredential | undefined> {
    return createUserWithEmailAndPassword(this.auth, email, password)
  }

  login({ email, password }: any) {  
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    this.notificationsPushService.deleteToken();
    const auth = getAuth();

    signOut(auth)
    .then(() => {
      this.router.navigate(['/login']);
    });
  }

  logoutSinRedireccion(){
    this.notificationsPushService.deleteToken();
    const auth = getAuth();
    signOut(auth);
  }

   
  getCurrentUser(): Observable<User | null> {
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