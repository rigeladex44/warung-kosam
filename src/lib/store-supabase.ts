import { create } from 'zustand';
import { supabase } from './supabase-client';
import type { Product, CartItem, SaleItem, Sale, StockAddition, Expense } from './store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
const now = () => new Date().toISOString();

const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

// ─── Mappers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProduct = (row: any): Product => ({
    id: row.id,
    name: row.name,
    sku: row.sku ?? '',
    category: row.category ?? '',
    sellingPrice: Number(row.selling_price),
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    createdAt: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSale = (row: any, items: SaleItem[]): Sale => ({
    id: row.id,
    items,
    totalRevenue: Number(row.gross_revenue),
    cashReceived: Number(row.cash_received),
    change: Number(row.change_amount),
    paymentMethod: row.payment_method || 'Cash',
    staffName: row.staff_name || 'Kasir',
    createdAt: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSaleItem = (row: any): SaleItem => ({
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    sellingPrice: Number(row.selling_price),
    subtotal: Number(row.subtotal),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStockAddition = (row: any): StockAddition => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    costPerUnit: Number(row.cost_per_unit),
    totalCost: Number(row.total_cost),
    createdAt: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapExpense = (row: any): Expense => ({
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    category: row.category ?? 'Operasional',
    createdAt: row.created_at,
});

// ─── Store State ─────────────────────────────────────────────────────────────

interface SupabaseStoreState {
    products: Product[];
    sales: Sale[];
    stockAdditions: StockAddition[];
    expenses: Expense[];
    cart: CartItem[];
    isLoading: boolean;
    isInitialized: boolean;

    initialize: () => Promise<void>;
    
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

// ─── Store Implementation ────────────────────────────────────────────────────

export const useSupabaseStore = create<SupabaseStoreState>()((set, get) => ({
    products: [],
    sales: [],
    stockAdditions: [],
    expenses: [],
    cart: [],
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
        if (!supabase) return;
        if (get().isInitialized) return;
        set({ isLoading: true });

        try {
            const [
                { data: productsData },
                { data: salesData },
                { data: itemsData },
                { data: additionsData },
                { data: expensesData }
            ] = await Promise.all([
                supabase.from('products').select('*').order('created_at'),
                supabase.from('sales').select('*').order('created_at', { ascending: false }),
                supabase.from('sale_items').select('*'),
                supabase.from('stock_additions').select('*').order('created_at', { ascending: false }),
                supabase.from('expenses').select('*').order('created_at', { ascending: false })
            ]);

            const sales: Sale[] = (salesData ?? []).map((row) => {
                const saleItems = (itemsData ?? []).filter((i) => i.sale_id === row.id).map(mapSaleItem);
                return mapSale(row, saleItems);
            });

            set({
                products: (productsData ?? []).map(mapProduct),
                sales,
                stockAdditions: (additionsData ?? []).map(mapStockAddition),
                expenses: (expensesData ?? []).map(mapExpense),
                isLoading: false,
                isInitialized: true,
            });

            // Realtime setup
            supabase.channel('store-sync')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => get().initialize().catch(console.error))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => get().initialize().catch(console.error))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => get().initialize().catch(console.error))
                .subscribe();
        } catch (err) {
            console.error('Supabase init error:', err);
            set({ isLoading: false });
        }
    },

    addProduct: (product) => {
        const newProd = { ...product, id: generateId(), createdAt: now() };
        set(s => ({ products: [...s.products, newProd] }));
        supabase?.from('products').insert({
            id: newProd.id, name: newProd.name, sku: newProd.sku,
            category: newProd.category, selling_price: newProd.sellingPrice,
            stock: newProd.stock, low_stock_threshold: newProd.lowStockThreshold
        }).then(({ error }) => error && console.error('addProduct error:', error));
    },

    updateProduct: (id, updates) => {
        set(s => ({ products: s.products.map(p => p.id === id ? { ...p, ...updates } : p) }));
        supabase?.from('products').update({
            name: updates.name, sku: updates.sku, category: updates.category,
            selling_price: updates.sellingPrice, stock: updates.stock,
            low_stock_threshold: updates.lowStockThreshold
        }).eq('id', id).then(({ error }) => error && console.error('updateProduct error:', error));
    },

    deleteProduct: (id) => {
        set(s => ({ products: s.products.filter(p => p.id !== id), cart: s.cart.filter(c => c.product.id !== id) }));
        supabase?.from('products').delete().eq('id', id).then(({ error }) => error && console.error('deleteProduct error:', error));
    },

    deductStock: (productId, qty) => {
        const p = get().products.find(x => x.id === productId);
        if (!p) return;
        const newStock = Math.max(0, p.stock - qty);
        set(s => ({ products: s.products.map(x => x.id === productId ? { ...x, stock: newStock } : x) }));
        supabase?.from('products').update({ stock: newStock }).eq('id', productId);
    },

    addStockToProduct: (productId, qty) => {
        const p = get().products.find(x => x.id === productId);
        if (!p) return;
        const newStock = p.stock + qty;
        set(s => ({ products: s.products.map(x => x.id === productId ? { ...x, stock: newStock } : x) }));
        supabase?.from('products').update({ stock: newStock }).eq('id', productId);
    },

    addToCart: (product) => set(s => {
        const existing = s.cart.find(c => c.product.id === product.id);
        return { cart: existing ? s.cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c) : [...s.cart, { product, quantity: 1 }] };
    }),
    removeFromCart: (pId) => set(s => ({ cart: s.cart.filter(c => c.product.id !== pId) })),
    updateCartQty: (pId, qty) => set(s => ({ cart: qty <= 0 ? s.cart.filter(c => c.product.id !== pId) : s.cart.map(c => c.product.id === pId ? { ...c, quantity: qty } : c) })),
    clearCart: () => set({ cart: [] }),

    completeSale: (cash, method = 'Cash', staff = 'Kasir') => {
        const { cart } = get();
        if (cart.length === 0) return null;
        const revenue = cart.reduce((sum, c) => sum + (c.product.sellingPrice * c.quantity), 0);
        const sale: Sale = {
            id: generateId(),
            items: cart.map(c => ({ productId: c.product.id, productName: c.product.name, quantity: c.quantity, sellingPrice: c.product.sellingPrice, subtotal: c.product.sellingPrice * c.quantity })),
            totalRevenue: revenue, cashReceived: cash, change: cash - revenue, paymentMethod: method, staffName: staff, createdAt: now()
        };
        set(s => ({ sales: [sale, ...s.sales], cart: [] }));
        (async () => {
            if (!supabase) return;
            await supabase.from('sales').insert({
                id: sale.id, gross_revenue: sale.totalRevenue, cash_received: sale.cashReceived,
                change_amount: sale.change, payment_method: sale.paymentMethod, staff_name: sale.staffName, created_at: sale.createdAt
            });
            await supabase.from('sale_items').insert(sale.items.map(i => ({
                id: generateId(), sale_id: sale.id, product_id: i.productId, product_name: i.productName,
                quantity: i.quantity, selling_price: i.sellingPrice, subtotal: i.subtotal
            })));
        })();
        return sale;
    },

    cancelSale: (id) => {
        set(s => ({ sales: s.sales.filter(x => x.id !== id) }));
        supabase?.from('sales').delete().eq('id', id);
    },

    addStockAddition: (add) => {
        const newAdd = { ...add, id: generateId(), createdAt: now() };
        set(s => ({ stockAdditions: [newAdd, ...s.stockAdditions] }));
        supabase?.from('stock_additions').insert({
            id: newAdd.id, product_id: newAdd.productId, product_name: newAdd.productName,
            quantity: newAdd.quantity, cost_per_unit: newAdd.costPerUnit, total_cost: newAdd.totalCost
        });
    },

    addExpense: (exp) => {
        const newExp = { ...exp, id: generateId(), createdAt: now() };
        set(s => ({ expenses: [newExp, ...s.expenses] }));
        supabase?.from('expenses').insert({
            id: newExp.id, description: newExp.description, amount: newExp.amount, category: newExp.category
        });
    },

    deleteExpense: (id) => {
        set(s => ({ expenses: s.expenses.filter(x => x.id !== id) }));
        supabase?.from('expenses').delete().eq('id', id);
    },

    getTodaySales: () => get().sales.filter(s => isToday(s.createdAt)),
    getTodayExpenses: () => get().expenses.filter(e => isToday(e.createdAt)),
    getLowStockProducts: () => get().products.filter(p => p.stock <= p.lowStockThreshold),
    resetAllData: () => set({ products: [], sales: [], expenses: [], stockAdditions: [], cart: [] })
}));
