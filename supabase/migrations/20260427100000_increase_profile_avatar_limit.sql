-- ===============================================================
-- PURPOSE: increase profile avatar upload limit for phone photos
-- ===============================================================

UPDATE storage.buckets
SET file_size_limit = 15728640
WHERE id = 'profile_avatars';

-- ---------------------------------------------------------------
-- DOWN
-- ---------------------------------------------------------------

-- UPDATE storage.buckets
-- SET file_size_limit = 5242880
-- WHERE id = 'profile_avatars';
