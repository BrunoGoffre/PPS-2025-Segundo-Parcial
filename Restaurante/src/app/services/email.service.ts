import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';

@Injectable({
  providedIn: 'root'
})

export class EmailService {

  private serviceID = 'bonapettit_mail'; 
  private templateID = 'template_gvkhf72'; 
  private userID = 'G83Jd_QboNyEAn6wj'; 

  enviarCorreo(aceptacion: boolean, nombre: string, correo: string): Promise<EmailJSResponseStatus> {
    console.log(`[ClientesPendientes] enviando correo: ${aceptacion}, ${nombre}, ${correo}`);

   const asunto = aceptacion ? 'Aceptado' : 'Rechazado'; 
   const mensaje = aceptacion
      ? `<h1>¡Hola, ${nombre}!</h1><p>Nos alegra informarte que tu registro en <strong>Bon Appétit Restaurante</strong> ha sido <strong>aceptado</strong>.</p><p>Gracias por ser parte.<br>¡Te esperamos pronto!</p>`
      : `<h1>Hola, ${nombre}</h1><p>Lamentablemente, tu registro en <strong>Bon Appétit Restaurante</strong> ha sido <strong>rechazado</strong>.</p><p>Si tienes alguna duda, contactanos.</p>`;

    const templateParams = {
      correo,
      mensaje,
      asunto
    };

    return emailjs.send(this.serviceID, this.templateID, templateParams, this.userID);
  }
 
}