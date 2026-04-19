
-- Set search_path on all SECURITY-relevant functions to prevent hijacking
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conv_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  UPDATE conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_hot_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  score INTEGER := 0;
  content_lower TEXT := LOWER(NEW.content);
BEGIN
  IF content_lower ~* '(budget|modal|lebih dari|di atas|rp|jut[ae]|miliar)' THEN
    score := score + 30;
  END IF;
  IF content_lower ~* '(beli|invest|sedia[n]|mau|tertarik|booking|reserve)' THEN
    score := score + 25;
  END IF;
  IF content_lower ~* '(segera|urgent|secepat|bulan ini|minggu ini|asap)' THEN
    score := score + 20;
  END IF;
  IF content_lower ~* '(bali|ubud|seminyak|canggu|jimbaran|denpasar)' THEN
    score := score + 15;
  END IF;
  IF content_lower ~* '(villa|apartemen|tanah|komersial)' THEN
    score := score + 10;
  END IF;
  score := LEAST(score, 100);
  UPDATE leads SET hot_score = GREATEST(hot_score, score)
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::BIGINT, 1),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;
