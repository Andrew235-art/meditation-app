-- Function to delete all user data (for reset functionality)
CREATE OR REPLACE FUNCTION public.delete_all_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete user sessions
  DELETE FROM public.meditation_sessions WHERE user_id = user_uuid;
  
  -- Delete user goals
  DELETE FROM public.meditation_goals WHERE user_id = user_uuid;
  
  -- Delete user badges
  DELETE FROM public.user_badges WHERE user_id = user_uuid;
  
  -- Reset user settings to defaults
  UPDATE public.user_settings 
  SET 
    speech_rate = 0.8,
    voice_enabled = true,
    sound_enabled = true,
    selected_voice = null,
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
