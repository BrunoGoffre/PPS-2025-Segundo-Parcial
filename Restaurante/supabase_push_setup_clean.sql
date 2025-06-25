-- Script limpio para configurar push notifications en Supabase
-- Solo incluye lo esencial sin referencias a tablas de usuarios

-- 1. Crear tabla para almacenar tokens de push notifications
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'android',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar tokens duplicados por usuario
  UNIQUE(user_id, token)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para user_push_tokens
-- Los usuarios solo pueden ver/editar sus propios tokens
CREATE POLICY "Users can manage their own push tokens" 
ON user_push_tokens
FOR ALL 
USING (auth.uid() = user_id);

-- Política para que el service role pueda leer todos los tokens (para envío de notificaciones)
CREATE POLICY "Service role can read all tokens" 
ON user_push_tokens
FOR SELECT 
USING (auth.role() = 'service_role');

-- 4. Función para limpiar tokens antiguos/inválidos
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  -- Eliminar tokens más antiguos de 30 días
  DELETE FROM user_push_tokens 
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Tokens antiguos eliminados';
END;
$$ LANGUAGE plpgsql;

-- 5. Función trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar timestamp automáticamente
CREATE TRIGGER trigger_update_push_token_timestamp
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();

-- 7. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON user_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_updated_at ON user_push_tokens(updated_at);

-- 8. Comentarios para documentación
COMMENT ON TABLE user_push_tokens IS 'Almacena tokens de push notifications de los usuarios';
COMMENT ON FUNCTION cleanup_old_push_tokens() IS 'Limpia tokens de push notifications antiguos';
COMMENT ON FUNCTION update_push_token_timestamp() IS 'Actualiza automáticamente el timestamp de modificación';

-- 9. Ejemplo de uso para limpiar tokens antiguos (ejecutar manualmente cuando sea necesario)
-- SELECT cleanup_old_push_tokens();

-- 10. Consulta de ejemplo para ver tokens activos
-- SELECT user_id, token, platform, updated_at
-- FROM user_push_tokens
-- WHERE updated_at > NOW() - INTERVAL '7 days'
-- ORDER BY updated_at DESC;