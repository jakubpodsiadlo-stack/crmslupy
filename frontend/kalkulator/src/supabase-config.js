function firstEnv(...keys) {
    for (const key of keys) {
        const v = import.meta.env[key];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

export const SUPABASE_URL = firstEnv(
    'VITE_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL'
);

export const SUPABASE_ANON_KEY = firstEnv(
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
);
