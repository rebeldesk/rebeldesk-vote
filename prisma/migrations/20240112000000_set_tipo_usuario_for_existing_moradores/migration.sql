-- Migration: Definir tipoUsuario para usuários moradores existentes
-- 
-- Esta migration corrige usuários moradores que não têm tipoUsuario definido,
-- definindo-os como 'proprietario' por padrão.

-- Definir tipoUsuario para usuários moradores existentes que não têm tipo definido
-- Por padrão, definimos como 'proprietario' (pode ser ajustado manualmente depois)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'tipo_usuario'
  ) THEN
    UPDATE users 
    SET tipo_usuario = 'proprietario'::tipo_usuario
    WHERE perfil = 'morador'::perfil_usuario 
    AND tipo_usuario IS NULL;
  END IF;
END $$;
