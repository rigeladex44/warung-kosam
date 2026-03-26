import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── DATA MODELS ────────────────────────────────────────────────────────────
// Fokus Warung Kopi: Tanpa HPP/COGS dan Tanpa Manajemen Stok yang kaku.

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    sellingPrice: number;
    stock: number;
    lowStockThreshold: number;
    image?: string; // 🖼️ Opsional, simpan path gambar dari /public/katalog/
    createdAt: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    subtotal: number;
}

export interface Sale {
    id: string;
    items: SaleItem[];
    totalRevenue: number;
    cashReceived: number;
    change: number;
    paymentMethod?: string;
    staffName?: string;
    createdAt: string;
}

export interface StockAddition {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
    createdAt: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    createdAt: string;
}

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface StoreState {
    products: Product[];
    sales: Sale[];
    stockAdditions: StockAddition[];
    expenses: Expense[];
    cart: CartItem[];
    isLoading?: boolean;
    isInitialized?: boolean;

    // Actions
    initialize?: () => Promise<void>;
    
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    deductStock: (productId: string, qty: number) => void;
    addStockToProduct: (productId: string, qty: number) => void;

    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQty: (productId: string, qty: number) => void;
    clearCart: () => void;

    completeSale: (cashReceived: number, paymentMethod?: string, staffName?: string) => Sale | null;
    cancelSale: (id: string) => void;

    addStockAddition: (addition: Omit<StockAddition, 'id' | 'createdAt'>) => void;

    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
    deleteExpense: (id: string) => void;

    getTodaySales: () => Sale[];
    getTodayExpenses: () => Expense[];
    getLowStockProducts: () => Product[];
    resetAllData: () => void;
}

// ─── UTILS ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substring(2, 9);
const now = () => new Date().toISOString();
const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};

const initialProducts: Product[] = [
    { id: 'p1', name: 'Kopi Hitam', sku: 'KH-01', category: 'Kopi & Minuman', sellingPrice: 5000, stock: 999, lowStockThreshold: 0, image: '/katalog/kopi-hitam.jpg', createdAt: new Date().toISOString() },
    { id: 'p2', name: 'Kopi Susu Es', sku: 'KS-02', category: 'Kopi & Minuman', sellingPrice: 8000, stock: 999, lowStockThreshold: 0, image: '/katalog/kopi-susu.jpg', createdAt: new Date().toISOString() },
    { id: 'p3', name: 'Es Teh Manis', sku: 'ET-03', category: 'Kopi & Minuman', sellingPrice: 5000, stock: 999, lowStockThreshold: 0, image: '/katalog/esteh.jpg', createdAt: new Date().toISOString() },
    { id: 'p4', name: 'Indomie Goreng', sku: 'IG-04', category: 'Makanan', sellingPrice: 8000, stock: 999, lowStockThreshold: 0, image: '/katalog/indomie-goreng.jpg', createdAt: new Date().toISOString() },
    { id: 'p5', name: 'Indomie Kuah', sku: 'IK-05', category: 'Makanan', sellingPrice: 8000, stock: 999, lowStockThreshold: 0, image: '/katalog/indomie-kuah.jpg', createdAt: new Date().toISOString() },
    { id: 'p6', name: 'Roti Bakar Coklat', sku: 'RB-06', category: 'Makanan', sellingPrice: 12000, stock: 999, lowStockThreshold: 0, image: '/katalog/roti-bakar.jpg', createdAt: new Date().toISOString() },
    { id: 'p7', name: 'Pisang Goreng (5pcs)', sku: 'PG-07', category: 'Makanan', sellingPrice: 10000, stock: 999, lowStockThreshold: 0, image: '/katalog/pisang-goreng.jpg', createdAt: new Date().toISOString() },
    { id: 'p8', name: 'Air Mineral Botol', sku: 'AM-08', category: 'Kopi & Minuman', sellingPrice: 4000, stock: 999, lowStockThreshold: 0, image: '/katalog/mineral.jpg', createdAt: new Date().toISOString() },
];

// ─── STORES ──────────────────────────────────────────────────────────────────

// 1. LOCAL STORE (Zustand Persist)
const useLocalStore = create<StoreState>()(
    persist(
        (set, get) => ({
            products: initialProducts,
            sales: [],
            stockAdditions: [],
            expenses: [],
            cart: [],
            isLoading: false,
            isInitialized: true,
            initialize: async () => {}, // No-op for local

            addProduct: (p) => set((s) => ({ products: [...s.products, { ...p, id: generateId(), createdAt: now() }] })),
            updateProduct: (id, updates) => set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
            deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id), cart: s.cart.filter((c) => c.product.id !== id) })),
            deductStock: (productId, qty) => {}, 
            addStockToProduct: (productId, qty) => {},
            addToCart: (product) => set((s) => {
                const existing = s.cart.find((c) => c.product.id === product.id);
                return { cart: existing ? s.cart.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c) : [...s.cart, { product, quantity: 1 }] };
            }),
            removeFromCart: (pId) => set((s) => ({ cart: s.cart.filter((c) => c.product.id !== pId) })),
            updateCartQty: (pId, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter((c) => c.product.id !== pId) : s.cart.map((c) => (c.product.id === pId ? { ...c, quantity: qty } : c)) })),
            clearCart: () => set({ cart: [] }),
            completeSale: (cash, method = 'Cash', staff = 'Kasir') => {
                const { cart } = get();
                if (cart.length === 0) return null;
                const sale: Sale = { id: generateId(), items: cart.map(c => ({...c.product, productId: c.product.id, productName: c.product.name, subtotal: c.product.sellingPrice * c.quantity, quantity: c.quantity})), totalRevenue: cart.reduce((sum, c) => sum + (c.product.sellingPrice * c.quantity), 0), cashReceived: cash, change: cash - cart.reduce((sum, c) => sum + (c.product.sellingPrice * c.quantity), 0), paymentMethod: method, staffName: staff, createdAt: now() };
                set((s) => ({ sales: [...s.sales, sale], cart: [] }));
                return sale;
            },
            cancelSale: (id) => set((s) => ({ sales: s.sales.filter(s => s.id !== id) })),
            addStockAddition: (add) => set((s) => ({ stockAdditions: [...s.stockAdditions, { ...add, id: generateId(), createdAt: now() }] })),
            addExpense: (e) => set((s) => ({ expenses: [...s.expenses, { ...e, id: generateId(), createdAt: now() }] })),
            deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
            getTodaySales: () => get().sales.filter((s) => isToday(s.createdAt)),
            getTodayExpenses: () => get().expenses.filter((e) => isToday(e.createdAt)),
            getLowStockProducts: () => [],
            resetAllData: () => set({ sales: [], expenses: [], stockAdditions: [], cart: [] }),
        }),
        { name: 'warunk-kosam-storage' }
    )
);

// 2. EXPORT SELECTOR
import { useSupabaseStore } from './store-supabase';

const isSupabase = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';

/**
 * Hook utama untuk akses data aplikasi (Otomatis deteksi mode: Local vs Supabase)
 * Typecasted ke typeof useLocalStore agar komponen tetap dapet type-safety yang konsisten.
 */
export const useStore: typeof useLocalStore = (isSupabase ? useSupabaseStore : useLocalStore) as any;
