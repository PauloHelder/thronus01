CREATE OR REPLACE FUNCTION link_church_branch(
  branch_slug text,
  category text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  var_branch_id uuid;
  var_current_church_id uuid;
  var_current_role text;
BEGIN
  -- 1. Obter ID da igreja e Role do usuário atual
  SELECT church_id, role INTO var_current_church_id, var_current_role
  FROM public.users
  WHERE id = auth.uid();

  -- Validação de permissão
  IF var_current_role NOT IN ('admin', 'pastor', 'super_admin') THEN
     RETURN json_build_object('success', false, 'message', 'Permissão negada.');
  END IF;

  -- 2. Encontrar a igreja filha pelo slug
  SELECT id INTO var_branch_id FROM public.churches WHERE slug = branch_slug;

  IF var_branch_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Igreja não encontrada com este código.');
  END IF;

  IF var_branch_id = var_current_church_id THEN
    RETURN json_build_object('success', false, 'message', 'Você não pode vincular sua própria igreja como filial de si mesma.');
  END IF;

  -- 3. Atualizar a filial
  -- Preserva settings existentes, apenas atualiza parent_id e categoria no settings
  UPDATE public.churches
  SET parent_id = var_current_church_id,
      settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb), 
        '{categoria}', 
        to_jsonb(category)
      )
  WHERE id = var_branch_id;

  RETURN json_build_object('success', true, 'message', 'Filial vinculada com sucesso!');
END;
$$;
