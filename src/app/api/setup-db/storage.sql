-- Create storage bucket for profile images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Service Role Can Upload Images" on storage.objects;
drop policy if exists "Service Role Can Update Images" on storage.objects;
drop policy if exists "Service Role Can Delete Images" on storage.objects;

-- Set up storage policy to allow public access to profile images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'profile-images' );

-- Set up storage policy to allow service role to upload profile images
create policy "Service Role Can Upload Images"
  on storage.objects for insert
  with check ( bucket_id = 'profile-images' );

-- Set up storage policy to allow service role to update profile images
create policy "Service Role Can Update Images"
  on storage.objects for update
  using ( bucket_id = 'profile-images' )
  with check ( bucket_id = 'profile-images' );

-- Set up storage policy to allow service role to delete profile images
create policy "Service Role Can Delete Images"
  on storage.objects for delete
  using ( bucket_id = 'profile-images' );
