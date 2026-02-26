import { supabase } from './supabase-client';

const IS_SUPABASE = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';
const FALLBACK_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN ?? '1234';
const DEFAULT_NAME = 'Toko Mbak Atria';
const LS_NAME_KEY = 'toko-store-name';
const LS_PIN_KEY = 'toko-access-pin';

// ─── Cache ────────────────────────────────────────────────────────────────────
let _cachedPin: string | null = null;
let _cachedName: string | null = null;

// ──────────────────────────────────────────────────────────────────────────────
// Helper: fetch one settings value from Supabase
async function fetchSetting(key: string): Promise<string | null> {
    if (!supabase) return null;
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();
        return data?.value ?? null;
    } catch { return null; }
}

async function saveSetting(key: string, value: string): Promise<boolean> {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('settings')
            .upsert({ key, value });
        return !error;
    } catch { return false; }
}

// ──────────────────────────────────────────────────────────────────────────────
// PIN
// ──────────────────────────────────────────────────────────────────────────────

/** Ambil PIN — dari Supabase (supabase mode) atau localStorage/env. */
export async function fetchPin(): Promise<string> {
    if (_cachedPin !== null) return _cachedPin;
    if (IS_SUPABASE) {
        _cachedPin = (await fetchSetting('access_pin')) ?? FALLBACK_PIN;
    } else {
        if (typeof window !== 'undefined') {
            _cachedPin = localStorage.getItem(LS_PIN_KEY) ?? FALLBACK_PIN;
        } else {
            _cachedPin = FALLBACK_PIN;
        }
    }
    return _cachedPin;
}

/** Simpan PIN baru — Supabase atau localStorage. */
export async function updatePin(newPin: string): Promise<boolean> {
    if (IS_SUPABASE) {
        const ok = await saveSetting('access_pin', newPin);
        if (ok) _cachedPin = newPin;
        return ok;
    } else {
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_PIN_KEY, newPin);
        }
        _cachedPin = newPin;
        return true;
    }
}

export function clearPinCache() { _cachedPin = null; }

// ──────────────────────────────────────────────────────────────────────────────
// Store Name
// ──────────────────────────────────────────────────────────────────────────────

/** Ambil nama toko — Supabase atau localStorage. */
export async function fetchStoreName(): Promise<string> {
    if (_cachedName !== null) return _cachedName;
    if (IS_SUPABASE) {
        _cachedName = (await fetchSetting('store_name')) ?? DEFAULT_NAME;
    } else {
        // localStorage hanya di client
        if (typeof window !== 'undefined') {
            _cachedName = localStorage.getItem(LS_NAME_KEY) ?? DEFAULT_NAME;
        } else {
            _cachedName = DEFAULT_NAME;
        }
    }
    return _cachedName;
}

/** Simpan nama toko baru. */
export async function updateStoreName(name: string): Promise<boolean> {
    const trimmed = name.trim() || DEFAULT_NAME;
    if (IS_SUPABASE) {
        const ok = await saveSetting('store_name', trimmed);
        if (ok) _cachedName = trimmed;
        return ok;
    } else {
        if (typeof window !== 'undefined') {
            localStorage.setItem(LS_NAME_KEY, trimmed);
        }
        _cachedName = trimmed;
        return true;
    }
}

export function clearNameCache() { _cachedName = null; }
