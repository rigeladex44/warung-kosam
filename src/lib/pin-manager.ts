import { supabase } from './supabase-client';

// ─── Cache PIN lokal (agar tidak fetch tiap ketukan tombol) ──────────────────
let _cachedPin: string | null = null;

const FALLBACK_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN ?? '1234';
const IS_SUPABASE = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';

/** Ambil PIN dari Supabase (atau fallback ke env var). Hasil di-cache. */
export async function fetchPin(): Promise<string> {
    if (_cachedPin !== null) return _cachedPin;
    if (!IS_SUPABASE || !supabase) {
        _cachedPin = FALLBACK_PIN;
        return _cachedPin;
    }
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'access_pin')
            .single();
        _cachedPin = data?.value ?? FALLBACK_PIN;
    } catch {
        _cachedPin = FALLBACK_PIN;
    }
    return _cachedPin as string;
}

/** Simpan PIN baru ke Supabase dan update cache. */
export async function updatePin(newPin: string): Promise<boolean> {
    if (!IS_SUPABASE || !supabase) return false;
    try {
        const { error } = await supabase
            .from('settings')
            .upsert({ key: 'access_pin', value: newPin });
        if (error) return false;
        _cachedPin = newPin; // Update cache langsung
        return true;
    } catch {
        return false;
    }
}

/** Reset cache PIN (berguna setelah update dari luar). */
export function clearPinCache() {
    _cachedPin = null;
}
