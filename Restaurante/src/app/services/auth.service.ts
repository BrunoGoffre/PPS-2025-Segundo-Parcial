import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../models/user.model';
import { Profile } from '../models/profile.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null>;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Verificar si hay una sesión activa
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        this.currentUserSubject.next(session.user);
      }
    });

    // Suscribirse a cambios en la autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.currentUserSubject.next(session.user);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      console.log('[AUTH-SERVICE] Intentando login con email:', email);
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('[AUTH-SERVICE] Error de Supabase:', error);
        throw error;
      }

      console.log('[AUTH-SERVICE] Login exitoso:', data);
      return { success: true, user: data.user };
    } catch (error: any) {
      console.log('[AUTH-SERVICE] Error capturado:', error);
      return { success: false, message: error.message };
    }
  }

  async register(
    email: string, 
    password: string, 
    fullName: string,
    isAnonymous: boolean = false,
    rol: 'cliente' | 'supervisor' | 'dueño' | 'empleado' | 'anonimo' = 'cliente',
    userData: {
      apellido?: string,
      dni?: string,
      cuil?: string,
      photoFile?: File
    } = {}
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[AUTH] Iniciando registro de usuario...');
      
      // Si es un usuario anónimo, establecer el rol correspondiente
      if (isAnonymous) {
        rol = 'anonimo';
      }

      // 1. Registrar el usuario en la autenticación de Supabase
      console.log('[AUTH] Registrando usuario en auth...');
      const { data: { user }, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            rol: rol
          }
        }
      });

      if (error) {
        console.error('[AUTH] Error en auth.signUp:', error);
        throw error;
      }
      if (!user) throw new Error('No se pudo crear el usuario');
      console.log('[AUTH] Usuario registrado exitosamente en auth:', user.id);

      let photoId = null;

      // 2. Si hay una foto, subirla al bucket y registrarla en Profile_Photos
      if (userData.photoFile) {
        console.log('[AUTH] Procesando foto de perfil...');
        
        // Generar un nombre único para la foto
        const fileExt = userData.photoFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        // Subir la foto al bucket
        const { error: uploadError, data: uploadData } = await this.supabase.storage
          .from('profile-photos')
          .upload(fileName, userData.photoFile);
          
        if (uploadError) {
          console.error('[AUTH] Error al subir imagen:', uploadError);
          throw uploadError;
        }
        
        console.log('[AUTH] Archivo subido:', uploadData);
        
        // Obtener la URL pública de la foto - CORREGIDO
        const { data } = this.supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
          
        // Asegurar que tengamos una URL completa y válida
        const publicUrl = new URL(`/storage/v1/object/public/profile-photos/${fileName}`, environment.supabaseUrl).toString();
        console.log('[AUTH] URL pública generada:', publicUrl);
        
        // Registrar la foto en la tabla Profile_Photos
        console.log('[AUTH] Guardando referencia en Profile_Photos...');
        const { data: photoData, error: photoError } = await this.supabase
          .from('Profile_Photos')
          .insert({
            url: publicUrl,
            name: fileName
          })
          .select('id')
          .single();
          
        if (photoError) {
          console.error('[AUTH] Error al guardar referencia de foto:', photoError);
          throw photoError;
        }
        
        console.log('[AUTH] Referencia de foto guardada:', photoData);
        
        // Guardar el ID de la foto para usarlo en el usuario
        photoId = photoData.id;
      }

      // 3. Crear el perfil del usuario en la tabla Users
      console.log('[AUTH] Creando perfil de usuario en Users...');
      // Mapear el rol a role_Id (aquí deberías tener una lógica para obtener el ID correcto)
      const roleId = this.getRoleId(rol);
      
      const userData_db: {
        id: string;
        name: string;
        surname?: string;
        DNI?: string;
        CUIL?: string;
        photo_id: number | null;
        role_Id: number;
      } = {
        id: user.id,
        name: fullName.split(' ')[0], // Asumiendo que el nombre viene primero
        surname: userData.apellido || '',
        DNI: userData.dni || '',
        CUIL: userData.cuil || '',
        photo_id: photoId,
        role_Id: roleId
      };

      // Si es anónimo, solo guardamos los campos necesarios
      if (isAnonymous) {
        delete userData_db.surname;
        delete userData_db.DNI;
        delete userData_db.CUIL;
      }

      console.log('[AUTH] Insertando datos en Users:', userData_db);
      const { error: userError } = await this.supabase
        .from('Users')
        .insert(userData_db);

      if (userError) {
        console.error('[AUTH] Error al insertar en Users:', userError);
        throw userError;
      }

      console.log('[AUTH] Registro completado exitosamente');
      return { success: true };
    } catch (error: any) {
      console.error('Error en registro:', error);
      return { success: false, message: error.message };
    }
  }

  // Función para mapear roles a IDs (debes ajustar esto según tu esquema)
  private getRoleId(rol: string): number {
    const roleMap: Record<string, number> = {
      'cliente': 1,
      'supervisor': 2,
      'dueño': 3,
      'empleado': 4,
      'anonimo': 5
    };
    
    return roleMap[rol] || 1; // Por defecto, cliente
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('Users')
      .select('*, Profile_Photos(url)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  }

  async updateProfile(profile: Partial<Profile>): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await this.supabase
        .from('Users')
        .update(profile)
        .eq('id', this.currentUserValue?.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async uploadProfilePhoto(file: File): Promise<{ success: boolean; photoId?: number; message?: string }> {
    try {
      if (!this.currentUserValue) {
        throw new Error('Usuario no autenticado');
      }
      
      // Generar nombre de archivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUserValue.id}_${Date.now()}.${fileExt}`;
      
      console.log('[AUTH] Subiendo foto de perfil:', fileName);
      
      // Subir archivo al bucket
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('profile-photos')
        .upload(fileName, file);
        
      if (uploadError) {
        console.error('[AUTH] Error al subir imagen:', uploadError);
        throw uploadError;
      }
      
      console.log('[AUTH] Foto subida exitosamente:', uploadData);
      
      // Obtener URL pública
      const { data } = this.supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
      // Asegurar que tengamos una URL completa y válida
      const publicUrl = new URL(`/storage/v1/object/public/profile-photos/${fileName}`, environment.supabaseUrl).toString();
      console.log('[AUTH] URL pública generada:', publicUrl);
      
      // Guardar referencia en Profile_Photos
      const { data: photoData, error: photoError } = await this.supabase
        .from('Profile_Photos')
        .insert({
          url: publicUrl,
          name: fileName
        })
        .select('id')
        .single();
        
      if (photoError) {
        console.error('[AUTH] Error al guardar referencia de foto:', photoError);
        throw photoError;
      }
      
      console.log('[AUTH] Referencia de foto guardada:', photoData);
      
      // Actualizar el photo_id en Users
      const { error: updateError } = await this.supabase
        .from('Users')
        .update({ photo_id: photoData.id })
        .eq('id', this.currentUserValue.id);
        
      if (updateError) {
        console.error('[AUTH] Error al actualizar usuario con la foto:', updateError);
        throw updateError;
      }
      
      console.log('[AUTH] Usuario actualizado con la nueva foto');
      
      return { success: true, photoId: photoData.id };
    } catch (error: any) {
      console.error('[AUTH] Error completo en uploadProfilePhoto:', error);
      return { success: false, message: error.message };
    }
  }
} 