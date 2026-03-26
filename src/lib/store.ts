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

interface StoreState {
    products: Product[];
    sales: Sale[];
    stockAdditions: StockAddition[];
    expenses: Expense[];
    cart: CartItem[];

    // ─ Products ─
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    deductStock: (productId: string, qty: number) => void;
    addStockToProduct: (productId: string, qty: number) => void;

    // ─ Cart ─
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQty: (productId: string, qty: number) => void;
    clearCart: () => void;

    // ─ Complete Sale ─
    completeSale: (cashReceived: number, paymentMethod?: string, staffName?: string) => Sale | null;
    cancelSale: (id: string) => void;

    // ─ Stock Additions ─
    addStockAddition: (addition: Omit<StockAddition, 'id' | 'createdAt'>) => void;

    // ─ Expenses ─
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
    deleteExpense: (id: string) => void;

    // ─ Getters ─
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
    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
};

// ─── INITIAL DATA (Warkop Version) ──────────────────────────────────────────────

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

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            products: initialProducts,
            sales: [],
            stockAdditions: [],
            expenses: [],
            cart: [],

            // ─ Products ─
            addProduct: (product) =>
                set((s) => ({
                    products: [...s.products, { ...product, id: generateId(), createdAt: now() }],
                })),

            updateProduct: (id, updates) =>
                set((s) => ({
                    products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                })),

            deleteProduct: (id) =>
                set((s) => ({
                    products: s.products.filter((p) => p.id !== id),
                    cart: s.cart.filter((c) => c.product.id !== id),
                })),

            deductStock: (productId, qty) => {
                /* Nonaktif di versi Warkop (No Stock Tracking) */
            },

            addStockToProduct: (productId, qty) => {
                /* Nonaktif di versi Warkop */
            },

            // ─ Cart ─
            addToCart: (product) =>
                set((s) => {
                    const existing = s.cart.find((c) => c.product.id === product.id);
                    if (existing) {
                        return {
                            cart: s.cart.map((c) =>
                                c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
                            ),
                        };
                    }
                    return { cart: [...s.cart, { product, quantity: 1 }] };
                }),

            removeFromCart: (productId) =>
                set((s) => ({ cart: s.cart.filter((c) => c.product.id !== productId) })),

            updateCartQty: (productId, qty) =>
                set((s) => {
                    if (qty <= 0) return { cart: s.cart.filter((c) => c.product.id !== productId) };
                    return {
                        cart: s.cart.map((c) => (c.product.id === productId ? { ...c, quantity: qty } : c)),
                    };
                }),

            clearCart: () => set({ cart: [] }),

            // ─ Complete Sale ─
            completeSale: (cashReceived, paymentMethod = 'Cash', staffName = 'Kasir') => {
                const { cart } = get();
                if (cart.length === 0) return null;

                const items: SaleItem[] = cart.map((c) => ({
                    productId: c.product.id,
                    productName: c.product.name,
                    quantity: c.quantity,
                    sellingPrice: c.product.sellingPrice,
                    subtotal: c.product.sellingPrice * c.quantity,
                }));

                const totalRevenue = items.reduce((sum, i) => sum + i.subtotal, 0);
                const change = cashReceived - totalRevenue;

                const sale: Sale = {
                    id: generateId(),
                    items,
                    totalRevenue,
                    cashReceived,
                    change,
                    paymentMethod,
                    staffName,
                    createdAt: now(),
                };

                // NOTE: Stok tidak dipotong di versi Warkop agar tidak muncul "Stok Habis"
                set((s) => ({
                    sales: [...s.sales, sale],
                    cart: [],
                }));

                return sale;
            },

            cancelSale: (id) => {
                set((s) => ({
                    sales: s.sales.filter(s => s.id !== id),
                }));
            },

            // ─ Stock Additions ─
            addStockAddition: (addition) =>
                set((s) => ({
                    stockAdditions: [...s.stockAdditions, { ...addition, id: generateId(), createdAt: now() }],
                })),

            // ─ Expenses ─
            addExpense: (expense) =>
                set((s) => ({
                    expenses: [...s.expenses, { ...expense, id: generateId(), createdAt: now() }],
                })),

            deleteExpense: (id) =>
                set((s) => ({
                    expenses: s.expenses.filter((e) => e.id !== id),
                })),

            // ─ Getters ─
            getTodaySales: () => {
                const { sales } = get();
                return sales.filter((s) => isToday(s.createdAt));
            },

            getTodayExpenses: () => {
                const { expenses } = get();
                return expenses.filter((e) => isToday(e.createdAt));
            },

            getLowStockProducts: () => {
                // Selalu kosong di versi Warkop karena tidak pakai manajemen stok kaku
                return [];
            },

            resetAllData: () => set({ sales: [], expenses: [], stockAdditions: [], cart: [] }),
        }),
        {
            name: 'warunk-kosam-storage',
        }
    )
);
