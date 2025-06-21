import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword} from '@angular/fire/auth';
import { User as FirebaseUser, UserCredential} from 'firebase/auth';
import { getAuth, signOut } from 'firebase/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Firestore } from '@angular/fire/firestore';
import { PushNotificationsService } from '../services/push-notifications.service';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  currentUser$: Observable<FirebaseUser | null>;
  userActive: FirebaseUser | null = null; 
  private usuarioSubject = new BehaviorSubject<User | null>(null);

  constructor(private auth: Auth, private router: Router, private firestore: Firestore, private pushNotificationsService:PushNotificationsService) {
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