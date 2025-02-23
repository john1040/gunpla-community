-- Create a debug function for profile creation that logs the process
CREATE OR REPLACE FUNCTION debug_create_profile(
    user_id UUID,
    user_display_name TEXT,
    user_avatar_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    inserted_row user_profiles;
BEGIN
    -- Log input parameters
    result := jsonb_build_object(
        'input_params', jsonb_build_object(
            'user_id', user_id,
            'display_name', user_display_name,
            'avatar_url', user_avatar_url
        )
    );

    -- Attempt insert
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (user_id, user_display_name, user_avatar_url)
    RETURNING * INTO inserted_row;

    -- Log success
    result := result || jsonb_build_object(
        'success', true,
        'inserted_row', row_to_json(inserted_row)::jsonb
    );

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Log failure
    result := result || jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'auth_uid', current_setting('request.jwt.claims', true)::jsonb->>'sub'
    );
    
    RETURN result;
END;
$$;