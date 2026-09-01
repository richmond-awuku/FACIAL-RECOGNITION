/*
# Track student biometric reference updates

## Overview
Adds a timestamp to the existing students table so the student settings screen
can show when the primary biometric reference was last updated.

## Modified Tables
- `students.face_reference_updated_at` (timestamptz, nullable) — last successful
  biometric reference capture.

## Security
No new table or policy is introduced. Existing students RLS policies continue to
protect the column using the same shared institutional access model.

## Important Notes
1. The existing `face_enrolled` flag remains unchanged and continues to represent
   whether a student has a verified face profile.
2. This is additive only and does not remove or change existing student data.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'face_reference_updated_at'
  ) THEN
    ALTER TABLE students ADD COLUMN face_reference_updated_at timestamptz;
  END IF;
END $$;
