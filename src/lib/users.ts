// ─── MULTI-USER SYSTEM ──────────────────────────────────────────────────────
// Setiap karyawan punya nama + PIN masing-masing
// Data tersimpan di localStorage (mode lokal) atau Supabase settings (mode cloud)

import { APP_CONFIG } from '@/lib/config';

export interface AppUser {
    id: string;
    name: string;
    role: 'owner' | 'karyawan';
    pin: string; // 4-6 digit
    color?: string; // avatar color
    createdAt: string;
}

const LS_USERS_KEY = 'toko-users-v1';

const DEFAULT_USERS: AppUser[] = [
    {
        id: 'owner',
        name: APP_CONFIG.ownerName,
        role: 'owner',
        pin: '1234',
        color: '#f59e0b',
        createdAt: new Date().toISOString(),
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadUsers(): AppUser[] {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    try {
        const raw = localStorage.getItem(LS_USERS_KEY);
        if (!raw) return DEFAULT_USERS;
        const parsed = JSON.parse(raw) as AppUser[];
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_USERS;
        
        // Force apply APP_CONFIG setting on top of any cached values for the owner
        const ownerIndex = parsed.findIndex((u) => u.id === 'owner');
        if (ownerIndex !== -1) {
            parsed[ownerIndex].name = APP_CONFIG.ownerName;
        }
        return parsed;
    } catch {
        return DEFAULT_USERS;
    }
}

function saveUsers(users: AppUser[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getUsers(): AppUser[] {
    return loadUsers();
}

export function getUserById(id: string): AppUser | null {
    return loadUsers().find((u) => u.id === id) ?? null;
}

/** Cek apakah PIN cocok dengan user tertentu */
export function verifyUserPin(userId: string, pin: string): boolean {
    const user = getUserById(userId);
    return user?.pin === pin;
}

/** Cari user berdasarkan PIN (login pilih user + ketik PIN) */
export function findUserByPin(pin: string): AppUser | null {
    return loadUsers().find((u) => u.pin === pin) ?? null;
}

export function addUser(user: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
    const users = loadUsers();
    const newUser: AppUser = {
        ...user,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<AppUser, 'id' | 'createdAt'>>): boolean {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return true;
}

export function deleteUser(id: string): boolean {
    if (id === 'owner') return false; // owner tidak bisa dihapus
    const users = loadUsers().filter((u) => u.id !== id);
    saveUsers(users);
    return true;
}

// ── Session ───────────────────────────────────────────────────────────────────
const SESSION_USER_KEY = 'toko_active_user_id';

export function setActiveUser(userId: string) {
    if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_USER_KEY, userId);
}

export function getActiveUser(): AppUser | null {
    if (typeof window === 'undefined') return null;
    const id = sessionStorage.getItem(SESSION_USER_KEY);
    if (!id) return null;
    return getUserById(id);
}

export function clearActiveUser() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_USER_KEY);
}

// ── Avatar colors ─────────────────────────────────────────────────────────────
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];

export function getAvatarColor(userId: string): string {
    const user = getUserById(userId);
    if (user?.color) return user.color;
    const idx = userId.charCodeAt(0) % COLORS.length;
    return COLORS[idx];
}
