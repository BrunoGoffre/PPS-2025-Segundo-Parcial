-- Script para corregir las URLs de fotos de perfil que podrían estar incorrectas
-- URL del proyecto Supabase: https://tmqdotautozmpgozytsi.supabase.co

-- Primero, verificar cuáles son las URLs que necesitan corrección
SELECT id, name, url
FROM "Profile_Photos"
WHERE url NOT LIKE '%tmqdotautozmpgozytsi.supabase.co%';

-- Actualizar las URLs incorrectas
-- Esto reconstruye la URL correcta basada en el nombre del archivo
UPDATE "Profile_Photos"
SET url = CONCAT('https://tmqdotautozmpgozytsi.supabase.co', '/storage/v1/object/public/profile-photos/', name)
WHERE url NOT LIKE '%tmqdotautozmpgozytsi.supabase.co%';

-- Verificar que las URLs se hayan actualizado correctamente
SELECT id, name, url
FROM "Profile_Photos"; 