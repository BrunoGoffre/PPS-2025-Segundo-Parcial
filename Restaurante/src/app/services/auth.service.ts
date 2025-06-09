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

  async register(email: string, password: string, fullName?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      if (user) {
        // Crear el perfil del usuario
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
          });

        if (profileError) throw profileError;
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
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
      .from('profiles')
      .select('*')
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
        .from('profiles')
        .update(profile)
        .eq('id', this.currentUserValue?.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async updateAvatar(avatarUrl: string): Promise<{ success: boolean; message?: string }> {
    return this.updateProfile({ avatar_url: avatarUrl });
  }
} 