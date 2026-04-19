-- ===============================================================
-- ITERATION: 9.x support
-- PURPOSE: add storage bucket for user profile avatars
-- ===============================================================

-- ---------------------------------------------------------------
-- STORAGE: profile_avatars bucket
-- ---------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_avatars',
  'profile_avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile_avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile_avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------

-- DROP POLICY IF EXISTS "profile_avatars_delete_own" ON storage.objects;
-- DROP POLICY IF EXISTS "profile_avatars_insert_own" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'profile_avatars';
