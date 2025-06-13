import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthResponse } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.supabase.auth.getUser().then(response => response.data.user).catch(() => null) as any
    );
    this.currentUser = this.currentUserSubject.asObservable();

    // Actualizar el usuario cuando cambie el estado de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user || null);
    });
  }

  // Métodos de autenticación
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async signUp(email: string, password: string, metadata?: { name?: string }): Promise<AuthResponse> {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  }

  

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  // Métodos para trabajar con tablas
  async getItems<T>(tableName: string, queryOptions?: {
    columns?: string,
    filter?: {column: string, value: any}[],
    limit?: number,
    offset?: number,
    orderBy?: {column: string, ascending?: boolean}
  }): Promise<T[]> {
    let query = this.supabase
      .from(tableName)
      .select(queryOptions?.columns || '*');
    
    // Aplicar filtros si existen
    if (queryOptions?.filter) {
      queryOptions.filter.forEach(filter => {
        query = query.eq(filter.column, filter.value);
      });
    }

    // Aplicar límite si existe
    if (queryOptions?.limit) {
      query = query.limit(queryOptions.limit);
    }

    // Aplicar offset si existe
    if (queryOptions?.offset) {
      query = query.range(queryOptions.offset, queryOptions.offset + (queryOptions.limit || 10) - 1);
    }

    // Aplicar orden si existe
    if (queryOptions?.orderBy) {
      query = query.order(queryOptions.orderBy.column, { 
        ascending: queryOptions.orderBy.ascending ?? true 
      });
    }

    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data as T[];
  }

  async createItem<T>(tableName: string, item: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(tableName)
      .insert(item)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as T;
  }

  async updateItem<T>(tableName: string, id: number | string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as T;
  }

  async deleteItem(tableName: string, id: number | string): Promise<void> {
    const { error } = await this.supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
  }

  // Métodos para storage
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;

    const { error } = await this.supabase
      .storage
      .from(bucket)
      .upload(fileName, file);
    
    if (error) {
      throw error;
    }

    const { data } = this.supabase
      .storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await this.supabase
      .storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
  }
} 