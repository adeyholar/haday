-- Classmates who already have accounts stay signed in after verification
-- is required. New sign-ups remain emailVerified = false until they open
-- the confirmation mail.
update "user"
set "emailVerified" = true
where "emailVerified" = false;
