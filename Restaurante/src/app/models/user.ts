export interface User{
    id?: string;
    nombre?:string;
    apellido?:string;
    dni?:string;
    mail?:string;
    imagen?:string;
    perfil?:string; // cliente, supervisor, duenio, 
    tipo?:string; // maitre, mozo, cocinero, bartender
    estadoAprobacion?:string; // pendiente, aprobado, rechazado
    encuestaCompletada?:boolean;
}