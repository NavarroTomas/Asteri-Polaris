const optimizedPhotos = new Map([
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/b8b6092b-2a45-4357-b9db-c727f321aecc/profile-1790379637479.png', '/players/profile-1790379637479.webp'],
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/75b7de42-8e4a-4edd-9f55-a3e57414e114/profile-1790017174401.png', '/players/profile-1790017174401.webp'],
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/5560f868-19c4-46bf-bed4-eaf8bc3f4112/profile-1790017672757.png', '/players/profile-1790017672757.webp'],
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/bb8433af-5c2d-411c-a3c6-1cb2b718b086/profile-1790016897377.png', '/players/profile-1790016897377.webp'],
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/902c25f7-acd4-49c6-a803-4dc74fd1bef0/profile-1790017665272.png', '/players/profile-1790017665272.webp'],
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/102b2771-8630-4377-998b-bb62d730864f/profile-1790017326359.png', '/players/profile-1790017326359.webp'],
  ['https://ozhuzdsmmvfqgqpgvavj.supabase.co/storage/v1/object/public/player-images/7cd99796-051a-4bfd-8c14-510fa1bc129b/profile-1790308062423.png', '/players/profile-1790308062423.webp'],
])

// Exact source URLs keep newly uploaded photos visible without a stale fallback.
export function optimizedPlayerImage(url) {
  return optimizedPhotos.get(url) || url
}
