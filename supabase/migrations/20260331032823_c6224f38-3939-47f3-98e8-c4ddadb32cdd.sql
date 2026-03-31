
-- Function to list all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, full_name text, email text, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.full_name,
    au.email::text,
    ur.role::text,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to set a user's role (admin only)
CREATE OR REPLACE FUNCTION public.admin_set_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- If new_role is null or empty, remove the role
  IF new_role IS NULL OR new_role = '' THEN
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    RETURN;
  END IF;

  -- Upsert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::app_role)
  ON CONFLICT (user_id, role)
  DO NOTHING;

  -- Remove any other roles for this user (one role per user)
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role != new_role::app_role;
END;
$$;
