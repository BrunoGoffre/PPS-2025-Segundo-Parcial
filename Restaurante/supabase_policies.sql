-- Políticas de seguridad para tablas y buckets en Supabase
-- URL del proyecto: https://tmqdotautozmpgozytsi.supabase.co

-- PERMISOS PARA LA TABLA USERS

-- 1. Política para permitir inserción pública en Users (para registro de clientes)
CREATE POLICY "Permitir registro público de clientes" 
ON "Users"
FOR INSERT 
TO public
WITH CHECK (role_Id = 1 OR role_Id = 9); -- 1=cliente, 9=anónimo

-- 2. Política para permitir que los usuarios autenticados vean a todos los usuarios
CREATE POLICY "Usuarios autenticados pueden ver usuarios" 
ON "Users"
FOR SELECT 
TO authenticated
USING (true);

-- 3. Política para permitir lectura pública (no autenticada) de usuarios
CREATE POLICY "Lectura pública de usuarios" 
ON "Users"
FOR SELECT 
TO public
USING (true);

-- PERMISOS PARA LA TABLA PROFILE_PHOTOS

-- 1. Política para permitir inserción pública en Profile_Photos (desde registro)
CREATE POLICY "Permitir inserción en Profile_Photos" 
ON "Profile_Photos"
FOR INSERT 
TO public
WITH CHECK (true);

-- 2. Política para permitir lectura pública de Profile_Photos
CREATE POLICY "Permitir lectura pública de Profile_Photos" 
ON "Profile_Photos"
FOR SELECT 
TO public
USING (true);

-- 3. Política para permitir que los usuarios autenticados actualicen fotos
CREATE POLICY "Permitir actualización de fotos" 
ON "Profile_Photos"
FOR UPDATE 
TO authenticated
USING (true);

-- CONFIGURACIÓN DEL BUCKET DE ALMACENAMIENTO

-- Configurar bucket 'profile-photos' como público
BEGIN;
  -- Asegurarse de que el bucket existe y es público
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-photos', 'profile-photos', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
  
  -- Política para permitir lectura pública de archivos
  CREATE POLICY "Acceso público de lectura" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (bucket_id = 'profile-photos');
  
  -- Política para permitir que el público suba archivos (necesario para registro)
  CREATE POLICY "Público puede subir archivos" 
  ON storage.objects 
  FOR INSERT 
  TO public
  WITH CHECK (bucket_id = 'profile-photos');
COMMIT;

-- VERIFICACIÓN DE POLÍTICAS ACTUALES

-- Verificar políticas existentes en la tabla Users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'Users';

-- Verificar políticas existentes en la tabla Profile_Photos
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'Profile_Photos';

-- Verificar políticas existentes para el bucket 'profile-photos'
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'objects' AND
  schemaname = 'storage'; 