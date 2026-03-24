import { supabase } from './supabase-client';
import { APP_CONFIG } from '@/lib/config'; // 👈 Import config ditambahkan

const IS_SUPABASE = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';
const FALLBACK_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN ?? '1234';
const DEFAULT_NAME = APP_CONFIG.storeName; // 👈 Default sekarang merujuk ke config
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
            .upsert({ key, value }, { onConflict: 'key' });
        if (error) { console.error('[saveSetting]', error.message); return false; }
        return true;
    } catch (e) { console.error('[saveSetting] catch', e); return false; }
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

/** Ambil nama toko — 100% dari APP_CONFIG (Mengabaikan cache lama) */
export async function fetchStoreName(): Promise<string> {
    // 👈 Langsung tembak ke config sesuai instruksi agent tadi siang
    return APP_CONFIG.storeName;
}

/** Simpan nama toko baru. */
export async function updateStoreName(name: string): Promise<boolean> {
    const trimmed = name.trim() || APP_CONFIG.storeName;
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