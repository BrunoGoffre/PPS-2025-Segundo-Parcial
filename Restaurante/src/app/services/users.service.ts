import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { Observable } from 'rxjs';
import { Firestore, collectionData, where, getDocs, getDoc, collection, query, doc, setDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private firestore:Firestore, private authService:AuthService) {}

  createUser(user: User) {
    const docRef = doc(this.firestore, 'usuarios', `${user.id}`);
    return setDoc(docRef, user);
  }

  getUsers(): Observable<User[]> {
    const colRef = collection(this.firestore, 'usuarios');
    const usersQuery = query(
      colRef,
      where('profile', 'in', ['cliente', 'empleado'])
    );
    return collectionData(usersQuery, { idField: 'id' }) as Observable<User[]>;
  }

  getUsersByProfile(profile: string): Observable<User[]> {
    const colRef = collection(this.firestore, 'usuarios');
    const clientesQuery = query(colRef, where('profile', '==', 'cliente'));
    return collectionData(clientesQuery, { idField: 'id' }) as Observable<User[]>;
  }

  async checkUserApprovalStatus(email: string): Promise<string> {
    const usersCollection = collection(this.firestore, 'usuarios');
    const q = query(usersCollection, where('mail', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();

      if(userData['profile'] == 'cliente' && userData['type'] == 'registrado'){
        const estadoDeAprobacion = userData['estadoAprobacion'];
  
        if (estadoDeAprobacion === 'pendiente')
        {
          return 'Tu cuenta está pendiente de aprobación.\n Por favor, espera a que el administrador revise tu solicitud. Te notificaremos en cuanto esté activa.';
        } else if (estadoDeAprobacion === 'rechazado')
        {
          return 'Tu solicitud de registro ha sido rechazada.\nSi tienes dudas, por favor, contactáctanos para más información.';
        }
        // Si el estado es 'aprobado', retorna vacío
        return '';
      } else
      {
        return '';
      }
    }
    return 'No se encontraron datos del usuario.';
  }

  async getUser(uid: string): Promise<User | null> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as User;
    } else {
      return null;
    }
  }

  async getUserFullName(): Promise<{ nombre: string; apellido: string } | null> {
    const userEmail = this.authService.getUserEmail();

    if (userEmail) {
      try {
        const usersCollection = collection(this.firestore, 'usuarios');
        const q = query(usersCollection, where('mail', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          return {
            nombre: userData['nombre'] || 'Anónimo',
            apellido: userData['apellido'] || ''
          };
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  getUsersByIds(userIds: string[]): Observable<User[]> {
    const usersRef = collection(this.firestore, 'usuarios');
    const usersQuery = query(usersRef, where('id', 'in', userIds));
    return collectionData(usersQuery, { idField: 'id' }) as Observable<User[]>;
  }
}
