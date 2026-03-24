import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── DATA MODELS ────────────────────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    sellingPrice: number;
    stock: number;
    lowStockThreshold: number;
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

// ─── STORE STATE ─────────────────────────────────────────────────────────────

interface StoreState {
    // Data
    products: Product[];
    sales: Sale[];
    stockAdditions: StockAddition[];
    expenses: Expense[];
    cart: CartItem[];

    // ─ Products ─
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
    updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => void;
    deleteProduct: (id: string) => void;
    deductStock: (productId: string, qty: number) => void;
    addStockToProduct: (productId: string, qty: number) => void;

    // ─ Cart ─
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQty: (productId: string, qty: number) => void;
    clearCart: () => void;

    // ─ Sales ─
    completeSale: (cashReceived: number) => Sale | null;

    // ─ Stock Additions ─
    addStockAddition: (addition: Omit<StockAddition, 'id' | 'createdAt'>) => void;

    // ─ Expenses ─
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
    deleteExpense: (id: string) => void;

    // ─ Selectors ─
    getLowStockProducts: () => Product[];
    getTodaySales: () => Sale[];
    getTodayExpenses: () => Expense[];
    getMonthSales: (year: number, month: number) => Sale[];
    getMonthExpenses: (year: number, month: number) => Expense[];
    getCartTotal: () => number;
    getCartCOGS: () => number;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const now = () => new Date().toISOString();

const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

const isInMonth = (dateStr: string, year: number, month: number) => {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────

const initialProducts: Product[] = [
    { id: 'p1', name: 'Gas LPG 3 Kg', sku: 'LPG-3', category: 'Gas', sellingPrice: 18000, stock: 30, lowStockThreshold: 10, createdAt: new Date().toISOString() },
    { id: 'p2', name: 'Brightgas 5 Kg', sku: 'BG-5', category: 'Gas', sellingPrice: 75000, stock: 20, lowStockThreshold: 5, createdAt: new Date().toISOString() },
    { id: 'p3', name: 'Brightgas 12.5 Kg', sku: 'BG-125', category: 'Gas', sellingPrice: 170000, stock: 10, lowStockThreshold: 3, createdAt: new Date().toISOString() },
    { id: 'p4', name: 'Cleo Botol', sku: 'CL-BOT', category: 'Air Minum', sellingPrice: 4000, stock: 50, lowStockThreshold: 12, createdAt: new Date().toISOString() },
    { id: 'p5', name: 'Cleo Galon Mini', sku: 'CL-GLN', category: 'Air Minum', sellingPrice: 11000, stock: 25, lowStockThreshold: 8, createdAt: new Date().toISOString() },
    { id: 'p6', name: 'Cleo Isi Ulang', sku: 'CL-ISI', category: 'Air Minum', sellingPrice: 5000, stock: 40, lowStockThreshold: 10, createdAt: new Date().toISOString() },
    { id: 'p7', name: 'Cleo Gelas Mini', sku: 'CL-GLS', category: 'Air Minum', sellingPrice: 24000, stock: 35, lowStockThreshold: 10, createdAt: new Date().toISOString() },
    { id: 'p8', name: 'Aqua Gelas Mini', sku: 'AQ-GLS', category: 'Air Minum', sellingPrice: 25000, stock: 30, lowStockThreshold: 10, createdAt: new Date().toISOString() },
];

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────

const useLocalStore = create<StoreState>()(
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

            deductStock: (productId, qty) =>
                set((s) => ({
                    products: s.products.map((p) =>
                        p.id === productId ? { ...p, stock: Math.max(0, p.stock - qty) } : p
                    ),
                })),

            addStockToProduct: (productId, qty) =>
                set((s) => ({
                    products: s.products.map((p) =>
                        p.id === productId ? { ...p, stock: p.stock + qty } : p
                    ),
                })),

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
            completeSale: (cashReceived) => {
                const { cart, products } = get();
                if (cart.length === 0) return null;

                const items: SaleItem[] = cart.map((c) => ({
                    productId: c.product.id,
                    productName: c.product.name,
                    quantity: c.quantity,
                    costPrice: c.product.costPrice,
                    sellingPrice: c.product.sellingPrice,
                    subtotal: c.product.sellingPrice * c.quantity,
                }));

                const grossRevenue = items.reduce((sum, i) => sum + i.subtotal, 0);
                const cogs = items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
                const grossProfit = grossRevenue - cogs;
                const change = cashReceived - grossRevenue;

                const sale: Sale = {
                    id: generateId(),
                    items,
                    grossRevenue,
                    cogs,
                    grossProfit,
                    cashReceived,
                    change,
                    createdAt: now(),
                };

                // Deduct stock for each item
                const updatedProducts = products.map((p) => {
                    const item = items.find((i) => i.productId === p.id);
                    if (item) return { ...p, stock: Math.max(0, p.stock - item.quantity) };
                    return p;
                });

                set((s) => ({
                    sales: [...s.sales, sale],
                    products: updatedProducts,
                    cart: [],
                }));

                return sale;
            },

            // ─ Stock Additions ─
            addStockAddition: (addition) =>
                set((s) => {
                    const newAddition: StockAddition = { ...addition, id: generateId(), createdAt: now() };
                    const updatedProducts = s.products.map((p) =>
                        p.id === addition.productId ? { ...p, stock: p.stock + addition.quantity } : p
                    );
                    return {
                        stockAdditions: [...s.stockAdditions, newAddition],
                        products: updatedProducts,
                    };
                }),

            // ─ Expenses ─
            addExpense: (expense) =>
                set((s) => ({
                    expenses: [...s.expenses, { ...expense, id: generateId(), createdAt: now() }],
                })),

            deleteExpense: (id) =>
                set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

            // ─ Selectors ─
            getLowStockProducts: () => {
                const { products } = get();
                return products.filter((p) => p.stock <= p.lowStockThreshold);
            },

            getTodaySales: () => {
                const { sales } = get();
                return sales.filter((s) => isToday(s.createdAt));
            },

            getTodayExpenses: () => {
                const { expenses } = get();
                return expenses.filter((e) => isToday(e.createdAt));
            },

            getMonthSales: (year, month) => {
                const { sales } = get();
                return sales.filter((s) => isInMonth(s.createdAt, year, month));
            },

            getMonthExpenses: (year, month) => {
                const { expenses } = get();
                return expenses.filter((e) => isInMonth(e.createdAt, year, month));
            },

            getCartTotal: () => {
                const { cart } = get();
                return cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity, 0);
            },

            getCartCOGS: () => {
                const { cart } = get();
                return cart.reduce((sum, c) => sum + c.product.costPrice * c.quantity, 0);
            },
        }),
        {
            name: 'toko-mini-storage',
            partialize: (state) => ({
                products: state.products,
                sales: state.sales,
                stockAdditions: state.stockAdditions,
                expenses: state.expenses,
            }),
        }
    )
);

// ─── Conditional Store Export ──────────────────────────────────────────────
// Komponen import { useStore } dari sini — tidak perlu tahu mode yang aktif.
import { useSupabaseStore } from './store-supabase';
const _isSupabase = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useStore: typeof useSupabaseStore = _isSupabase ? useSupabaseStore : (useLocalStore as any);
