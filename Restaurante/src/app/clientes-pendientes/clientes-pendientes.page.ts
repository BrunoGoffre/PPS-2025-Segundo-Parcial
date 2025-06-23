import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButtons, IonFooter, IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Firestore, collection, query, where, updateDoc, doc, getDocs } from '@angular/fire/firestore';
import { Router, RouterLink } from '@angular/router';
import { EmailService } from '../services/email.service';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user';
import { from, Observable } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-clientes-pendientes',
  templateUrl: './clientes-pendientes.page.html',
  styleUrls: ['./clientes-pendientes.page.scss'],
  standalone: true,
  imports: [IonButtons, IonFooter,IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonIcon, RouterLink, IonSpinner]
})
export class ClientesPendientesPage {
  pendingUsers: any[] = [];
  usuario: User|null = null;
  loading:boolean = true;
  loading2:boolean = true;
	isPlayingSound = false;
	
  private mySubscription!: Subscription;

  constructor(private firestore: Firestore, private router:Router, private emailService: EmailService, private usuarioService:UsersService, private authService:AuthService) {}

  async ionViewWillEnter() {
    this.loading = true;
    this.loading2=true;

    if(this.usuario == null){
      this.mySubscription = this.authService.currentUser$.subscribe((user)=>{
        if(user){
          this.usuarioService.getUser(user.uid)
          .then((user)=>{
            this.usuario = user;
            this.loading2 = false;
          }) 
        }
      })
    }
    else{
      this.loading2=false;
    }

    this.cargarUsuariosPendientes().subscribe((usuariosPendientes)=>{
      this.pendingUsers = usuariosPendientes;
      this.loading = false;
    })
  }

  cargarUsuariosPendientes(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'usuarios');
    const q = query(usersCollection, where('estadoAprobacion', '==', 'pendiente'));

    return from(
      getDocs(q).then(querySnapshot =>
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      )
    );
  }

  // async cargarUsuariosPendientes() {
  //   const usersCollection = collection(this.firestore, 'usuarios');
  //   const q = query(usersCollection, where('estadoAprobacion', '==', 'pendiente'));
  //   const querySnapshot = await getDocs(q);

  //   this.pendingUsers = querySnapshot.docs.map(doc => ({
  //     id: doc.id,
  //     ...doc.data()
  //   }));
   
  // }

  async aprobarUsuario(userId: string, nombre: string, correo: string) {
    const userDocRef = doc(this.firestore, `usuarios/${userId}`);
    await updateDoc(userDocRef, { estadoAprobacion: 'aprobado' });
    console.log(`[ClientesPendientes] aprobamos: Usuario ${userId} aprobado`);
		console.log(`[ClientesPendientes] con nombre ${nombre} y correo ${correo}`);

    this.pendingUsers = this.pendingUsers.filter(user => user.id !== userId);

    this.enviarCorreo(true,nombre,correo);

  }

  async rechazarUsuario(userId: string, nombre: string, correo: string) {
    const userDocRef = doc(this.firestore, `usuarios/${userId}`);
    await updateDoc(userDocRef, { estadoAprobacion: 'rechazado' });
    console.log(`[ClientesPendientes] rechazamos: Usuario ${userId} rechazado`);
    this.pendingUsers = this.pendingUsers.filter(user => user.id !== userId);
    
    this.enviarCorreo(false,nombre,correo);
  }

  enviarCorreo(estado:boolean, nombre:string, mail:string) {
    this.emailService.enviarCorreo(estado, nombre, mail)
      .then((response) => {
        console.log(`[ClientesPendientes] correo enviado exitosamente: ${response.status}, ${response.text}`);
      })
      .catch((error) => {
        console.error(`[ClientesPendientes] error al enviar el correo: ${error}`);
				console.log(`[ClientesPendientes] con nombre ${nombre} y correo ${mail}`);
				console.log(`[ClientesPendientes] con estado ${error.message}`);
      });
  }

  goTo(path:string){
    this.router.navigate([path]);
  }

  logout():void{
    this.authService.logout();
    this.playSound('1');  
    this.usuario = null;
    this.loading = true;
  }

  ionViewWillLeave() {  
    if (this.mySubscription) {
      this.mySubscription.unsubscribe();
    }
  }

  /********************************* S O N I D O S *********************************/

  

  private sounds: { [key: string]: string } = {
    '1': 'disconected',
  };

  playSound(sound: string) {
    if (this.isPlayingSound) {
      return;
    }

		const audioFile = this.getAudioFile(sound);

		if (!audioFile) {
      return;
    }
    
		const audio = new Audio(audioFile);
    
		this.isPlayingSound = true;
    
		audio.play().then(() => {
      this.isPlayingSound = false;
    })
		.catch(() => {
      this.isPlayingSound = false;
    });

    audio.onended = () => {
      this.isPlayingSound = false;
    };
  }

  getAudioFile(sound: string) {
    const audioFile = this.sounds[sound];
    
		if (audioFile) {
        return `assets/sounds/${audioFile}.mp3`;
    }
    return '';
  }
}
