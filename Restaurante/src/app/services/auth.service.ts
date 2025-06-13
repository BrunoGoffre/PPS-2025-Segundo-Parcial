import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  createClient,
  SupabaseClient,
  User as SupabaseUser,
} from '@supabase/supabase-js';
import { User } from '../models/user.model';
import { Profile } from '../models/profile.model';
import { environment } from '../../environments/environment';
import { UserModel } from '../models/userModel.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null>;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    this.currentUser = this.currentUserSubject.asObservable();

    // Verificar si hay una sesión activa
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        this.getProfile(session.user.id).then((user) => {
          this.currentUserSubject.next(user as User);
        })
      }
    });

    // Suscribirse a cambios en la autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.getProfile(session.user.id).then((user) => {
          this.currentUserSubject.next(user as User);
        })
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; user?: UserModel }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('[AUTH-SERVICE] Error de Supabase:', error);
        throw error;
      }
      console.log('[AUTH-SERVICE] Login exitoso:', data);
      let userReturn: any;
      await this.getProfile(data.user.id).then((user) => {
          userReturn = user;
      })
      return { success: true, user: userReturn };

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
    rol:
      | 'cliente'
      | 'supervisor'
      | 'dueño'
      | 'empleado'
      | 'anonimo' = 'cliente',
    userData: {
      apellido?: string;
      dni?: string;
      cuil?: string;
      photoFile?: File;
      approved?: boolean;
    } = {}
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[AUTH] Iniciando registro de usuario...');

      // Si es un usuario anónimo, establecer el rol correspondiente
      if (isAnonymous) {
        rol = 'anonimo';
      }

      // Validar que el DNI no exista si se proporciona
      if (userData.dni && userData.dni.trim() !== '') {
        console.log('[AUTH] Verificando unicidad de DNI:', userData.dni);
        const { data: existingUser, error: dniCheckError } = await this.supabase
          .from('Users')
          .select('id')
          .eq('DNI', userData.dni.trim())
          .single();

        if (dniCheckError && dniCheckError.code !== 'PGRST116') {
          // PGRST116 = No rows found, que es lo que queremos
          console.error('[AUTH] Error verificando DNI:', dniCheckError);
          throw new Error('Error verificando DNI en la base de datos');
        }

        if (existingUser) {
          console.log('[AUTH] DNI ya existe en la base de datos');
          throw new Error('El DNI ya está registrado en el sistema');
        }

        console.log('[AUTH] DNI verificado como único');
      }

      // 1. Registrar el usuario en la autenticación de Supabase
      console.log('[AUTH] Registrando usuario en auth...');
      const {
        data: { user },
        error,
      } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            rol: rol,
          },
        },
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
        console.log('[AUTH] Procesando foto de perfil...', {
          fileName: userData.photoFile.name,
          fileSize: userData.photoFile.size,
          fileType: userData.photoFile.type
        });

        try {
          // Generar un nombre único para la foto
          const fileExt = userData.photoFile.name.split('.').pop() || 'jpg';
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          
          console.log('[AUTH] Nombre de archivo generado:', fileName);

          // Verificar que el archivo es válido
          if (userData.photoFile.size === 0) {
            throw new Error('El archivo de imagen está vacío');
          }

          if (userData.photoFile.size > 5 * 1024 * 1024) { // 5MB
            throw new Error('El archivo es demasiado grande (máximo 5MB)');
          }

          // Subir la foto al bucket
          console.log('[AUTH] Iniciando upload al storage...');
          const { error: uploadError, data: uploadData } =
            await this.supabase.storage
              .from('profile-photos')
              .upload(fileName, userData.photoFile, {
                cacheControl: '3600',
                upsert: false
              });

          if (uploadError) {
            console.error('[AUTH] Error al subir imagen:', uploadError);
            throw new Error(`Error al subir imagen: ${uploadError.message}`);
          }

          console.log('[AUTH] Archivo subido exitosamente:', uploadData);

          // Obtener la URL pública de la foto
          const { data: urlData } = this.supabase.storage
            .from('profile-photos')
            .getPublicUrl(fileName);

          if (!urlData?.publicUrl) {
            throw new Error('No se pudo generar la URL pública');
          }

          const publicUrl = urlData.publicUrl;
          console.log('[AUTH] URL pública generada:', publicUrl);

          // Registrar la foto en la tabla Profile_Photos
          console.log('[AUTH] Guardando referencia en Profile_Photos...');
          const { data: photoData, error: photoError } = await this.supabase
            .from('Profile_Photos')
            .insert({
              url: publicUrl,
              name: fileName,
            })
            .select('id')
            .single();

          if (photoError) {
            console.error('[AUTH] Error al guardar referencia de foto:', photoError);
            throw new Error(`Error al guardar referencia: ${photoError.message}`);
          }

          console.log('[AUTH] Referencia de foto guardada exitosamente:', photoData);

          // Guardar el ID de la foto para usarlo en el usuario
          photoId = photoData.id;

        } catch (photoProcessingError) {
          console.error('[AUTH] Error en procesamiento de foto:', photoProcessingError);
          throw new Error(`Error procesando foto: ${photoProcessingError}`);
        }
      }

      // 3. Crear el perfil del usuario en la tabla Users
      console.log('[AUTH] Creando perfil de usuario en Users...');
      // Mapear el rol a role_Id (aquí deberías tener una lógica para obtener el ID correcto)
      const roleId = this.getRoleId(rol);

      // Construir objeto de datos condicionalmente para evitar conflictos de DNI
      const userData_db: {
        id: string;
        name: string;
        surname?: string;
        DNI?: string;
        CUIL?: string;
        photo_id: number | null;
        role_Id: number;
        approved?: boolean | null;
      } = {
        id: user.id,
        name: fullName.split(' ')[0], // Asumiendo que el nombre viene primero
        photo_id: photoId,
        role_Id: roleId,
      };

      // Solo agregar campos adicionales si NO es anónimo
      if (!isAnonymous) {
        userData_db.surname = userData.apellido || '';
        userData_db.DNI = userData.dni || '';
        userData_db.CUIL = userData.cuil || '';
      }

      // Lógica de aprobación según rol:
      // - Clientes y anónimos: requieren aprobación manual (approved = null)
      // - Otros roles: se aprueban automáticamente (approved = true)
      if (rol === 'cliente' || rol === 'anonimo') {
        // Los clientes y anónimos quedan pendientes de aprobación
        userData_db.approved = null;
      } else {
        // Administradores y empleados se aprueban automáticamente
        userData_db.approved = true;
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
      dueño: 1,
      supervisor: 2,
      cliente: 3,
      empleado: 5, // Por defecto empleado será mozo (pero puede ser cambiado)
      empleadoCocinero: 4,
      empleadoMozo: 5,
      empleadoBartender: 6,
      empleadoMaître: 10,
      anonimo: 9,
    };

    return roleMap[rol] || 3; // Por defecto, cliente
  }

  // Función para mapear IDs de vuelta a roles
  private getRoleName(roleId: number): string {
    const idToRoleMap: Record<number, string> = {
      1: 'dueño',
      2: 'supervisor',
      3: 'cliente',
      4: 'empleadoCocinero',
      5: 'empleado', // Simplificado como "empleado" genérico
      6: 'empleadoBartender',
      9: 'anonimo',
      10: 'empleadoMaître',
    };

    return idToRoleMap[roleId] || 'cliente';
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('Users')
      .select('*, Profile_Photos(url)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Agregar el campo 'rol' basado en role_Id para compatibilidad
    const userWithRole = {
      ...data,
      rol: this.getRoleName(data.role_Id)
    };

    console.log('[AUTH] Usuario con rol mapeado:', userWithRole);
    return userWithRole as User;
  }

  async updateProfile(
    profile: Partial<Profile>
  ): Promise<{ success: boolean; message?: string }> {
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

  async uploadProfilePhoto(
    file: File
  ): Promise<{ success: boolean; photoId?: number; message?: string }> {
    try {
      if (!this.currentUserValue) {
        throw new Error('Usuario no autenticado');
      }

      // Generar nombre de archivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUserValue.id}_${Date.now()}.${fileExt}`;

      console.log('[AUTH] Subiendo foto de perfil:', fileName);

      // Subir archivo al bucket
      const { data: uploadData, error: uploadError } =
        await this.supabase.storage
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
      const publicUrl = new URL(
        `/storage/v1/object/public/profile-photos/${fileName}`,
        environment.supabaseUrl
      ).toString();
      console.log('[AUTH] URL pública generada:', publicUrl);

      // Guardar referencia en Profile_Photos
      const { data: photoData, error: photoError } = await this.supabase
        .from('Profile_Photos')
        .insert({
          url: publicUrl,
          name: fileName,
        })
        .select('id')
        .single();

      if (photoError) {
        console.error(
          '[AUTH] Error al guardar referencia de foto:',
          photoError
        );
        throw photoError;
      }

      console.log('[AUTH] Referencia de foto guardada:', photoData);

      // Actualizar el photo_id en Users
      const { error: updateError } = await this.supabase
        .from('Users')
        .update({ photo_id: photoData.id })
        .eq('id', this.currentUserValue.id);

      if (updateError) {
        console.error(
          '[AUTH] Error al actualizar usuario con la foto:',
          updateError
        );
        throw updateError;
      }

      console.log('[AUTH] Usuario actualizado con la nueva foto');

      return { success: true, photoId: photoData.id };
    } catch (error: any) {
      console.error('[AUTH] Error completo en uploadProfilePhoto:', error);
      return { success: false, message: error.message };
    }
  }

  // Método para obtener usuarios pendientes de aprobación (clientes y anónimos)
  async getPendingRegisteredClients(): Promise<{
    data: User[] | null;
    error: any;
  }> {
    try {
      const clienteRoleId = this.getRoleId('cliente');
      const anonimoRoleId = this.getRoleId('anonimo');
      
      const { data, error } = await this.supabase
        .from('Users')
        .select('*, Profile_Photos(url)')
        .in('role_Id', [clienteRoleId, anonimoRoleId]) // Incluir clientes y anónimos
        .is('approved', null); // Filtrar por usuarios con 'approved' en null

      if (error) {
        console.error('Error fetching pending registered users:', error);
        return { data: null, error };
      }
      
      return { data: data as User[], error: null };
    } catch (error) {
      console.error('Error in getPendingRegisteredClients:', error);
      return { data: null, error };
    }
  }

  // Nuevo método para actualizar el estado de aprobación de un cliente
  async updateClientApprovalStatus(
    userId: string,
    status: boolean
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('Users')
        .update({ approved: status })
        .eq('id', userId);

      if (error) {
        console.error('Error updating client approval status:', error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateClientApprovalStatus:', error);
      return { data: null, error };
    }
  }

  // Exponer métodos de admin si es necesario y con cautela
  public get adminAuth() {
    return this.supabase.auth.admin;
  }

  // Exponer cliente de Supabase para acceso directo cuando sea necesario
  public get supabaseClient() {
    return this.supabase;
  }

  // Método robusto para obtener el usuario actual con fallback
  async getCurrentUserRobust(): Promise<User | null> {
    console.log('[AUTH] Obteniendo usuario de forma robusta...');
    
    // Primero intentar con currentUserValue
    let user = this.currentUserValue;
    console.log('[AUTH] currentUserValue:', user);
    
    if (!user) {
      console.log('[AUTH] currentUserValue es null, intentando con sesión...');
      
      try {
        // Obtener el usuario autenticado de Supabase
        const { data: { user: authUser } } = await this.supabase.auth.getUser();
        console.log('[AUTH] Usuario de auth:', authUser);
        
        if (authUser) {
          // Obtener el perfil completo
          user = await this.getProfile(authUser.id);
          console.log('[AUTH] Perfil obtenido:', user);
          
          // Actualizar el currentUserSubject para futuras consultas
          if (user) {
            this.currentUserSubject.next(user);
          }
        }
      } catch (error) {
        console.error('[AUTH] Error obteniendo usuario:', error);
        return null;
      }
    }
    
    console.log('[AUTH] Usuario final obtenido:', user);
    return user;
  }
}
