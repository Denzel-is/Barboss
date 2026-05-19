function trim(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getSupabaseProjectUrl() {
  return trim(process.env.SUPABASE_URL) || trim(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** Ключи для клиента / UI (publishable тоже подходит). */
export function getSupabasePublicKey() {
  return (
    trim(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    trim(process.env.SUPABASE_ANON_KEY)
  );
}

/**
 * Секретный ключ для серверной загрузки в Storage.
 * sb_publishable_* — только для клиента, upload с сервера не работает.
 * Подходит: sb_secret_* (новый), service_role или anon JWT eyJ... (legacy).
 */
export function getSupabaseServerKey() {
  const secretKey =
    trim(process.env.SUPABASE_SECRET_KEY) ||
    trim(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    trim(process.env.SUPABASE_S3_SECRET_KEY);

  if (secretKey.startsWith("sb_secret_") || secretKey.startsWith("eyJ")) {
    return secretKey;
  }

  const anon = trim(process.env.SUPABASE_ANON_KEY) || trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (anon.startsWith("eyJ")) {
    return anon;
  }

  return "";
}

export function usesNewSupabaseSecretKeyFormat(key: string) {
  return key.startsWith("sb_secret_") || key.startsWith("sb_publishable_");
}

export function isSupabaseStorageConfigured() {
  return Boolean(getSupabaseProjectUrl() && getSupabaseServerKey());
}

export function hasSupabasePublishableOnly() {
  const publicKey = getSupabasePublicKey();
  return Boolean(getSupabaseProjectUrl() && publicKey.startsWith("sb_publishable_") && !getSupabaseServerKey());
}

export function getSupabaseBucket() {
  return trim(process.env.SUPABASE_STORAGE_BUCKET) || trim(process.env.STORAGE_BUCKET) || "barboss";
}
