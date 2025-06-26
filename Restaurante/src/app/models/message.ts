import { User } from "./user"

export interface Message{
    mensaje:string,
    usuario:User
    idPedido:string,
    fecha: Date
}