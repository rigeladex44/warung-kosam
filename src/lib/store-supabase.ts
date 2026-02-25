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

const isInMonth = (dateStr: string, year: number, month: number) => {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
};

// ─── Supabase Row → App Type Mappers ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProduct = (row: any): Product => ({
    id: row.id,
    name: row.name,
    sku: row.sku ?? '',
    category: row.category ?? '',
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    createdAt: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSale = (row: any, items: SaleItem[]): Sale => ({
    id: row.id,
    items,
    grossRevenue: Number(row.gross_revenue),
    cogs: Number(row.cogs),
    grossProfit: Number(row.gross_profit),
    cashReceived: Number(row.cash_received),
    change: Number(row.change_amount),
    createdAt: row.created_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSaleItem = (row: any): SaleItem => ({
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    costPrice: Number(row.cost_price),
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

    // Init
    initialize: () => Promise<void>;

    // Products
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
    updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => void;
    deleteProduct: (id: string) => void;
    deductStock: (productId: string, qty: number) => void;
    addStockToProduct: (productId: string, qty: number) => void;

    // Cart
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQty: (productId: string, qty: number) => void;
    clearCart: () => void;

    // Sales
    completeSale: (cashReceived: number) => Sale | null;

    // Stock Additions
    addStockAddition: (addition: Omit<StockAddition, 'id' | 'createdAt'>) => void;

    // Expenses
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
    deleteExpense: (id: string) => void;

    // Selectors
    getLowStockProducts: () => Product[];
    getTodaySales: () => Sale[];
    getTodayExpenses: () => Expense[];
    getMonthSales: (year: number, month: number) => Sale[];
    getMonthExpenses: (year: number, month: number) => Expense[];
    getCartTotal: () => number;
    getCartCOGS: () => number;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSupabaseStore = create<SupabaseStoreState>()((set, get) => ({
    products: [],
    sales: [],
    stockAdditions: [],
    expenses: [],
    cart: [],
    isLoading: false,
    isInitialized: false,

    // ─ Initialize: Load all data from Supabase ─
    initialize: async () => {
        if (!supabase) return;
        if (get().isInitialized) return;
        set({ isLoading: true });

        try {
            // Load products
            const { data: productsData } = await supabase.from('products').select('*').order('created_at');

            // Load sales + items
            const { data: salesData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
            const { data: itemsData } = await supabase.from('sale_items').select('*');

            // Load stock additions
            const { data: additionsData } = await supabase.from('stock_additions').select('*').order('created_at', { ascending: false });

            // Load expenses
            const { data: expensesData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });

            // Map sales with their items
            const sales: Sale[] = (salesData ?? []).map((row) => {
                const saleItems = (itemsData ?? [])
                    .filter((i) => i.sale_id === row.id)
                    .map(mapSaleItem);
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

            // ─ Realtime subscriptions for multi-device sync ─
            supabase
                .channel('store-sync')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                    get().initialize().catch(console.error);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
                    get().initialize().catch(console.error);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
                    get().initialize().catch(console.error);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_additions' }, () => {
                    get().initialize().catch(console.error);
                })
                .subscribe();

        } catch (err) {
            console.error('Supabase init error:', err);
            set({ isLoading: false });
        }
    },

    // ─ Products ─
    addProduct: (product) => {
        const newProduct: Product = { ...product, id: generateId(), createdAt: now() };
        // Optimistic update
        set((s) => ({ products: [...s.products, newProduct] }));
        // Sync to Supabase
        supabase?.from('products').insert({
            id: newProduct.id,
            name: newProduct.name,
            sku: newProduct.sku,
            category: newProduct.category,
            cost_price: newProduct.costPrice,
            selling_price: newProduct.sellingPrice,
            stock: newProduct.stock,
            low_stock_threshold: newProduct.lowStockThreshold,
            created_at: newProduct.createdAt,
        }).then(({ error }) => { if (error) console.error('addProduct error:', error); });
    },

    updateProduct: (id, updates) => {
        set((s) => ({
            products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
        if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
        if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;
        supabase?.from('products').update(dbUpdates).eq('id', id)
            .then(({ error }) => { if (error) console.error('updateProduct error:', error); });
    },

    deleteProduct: (id) => {
        set((s) => ({
            products: s.products.filter((p) => p.id !== id),
            cart: s.cart.filter((c) => c.product.id !== id),
        }));
        supabase?.from('products').delete().eq('id', id)
            .then(({ error }) => { if (error) console.error('deleteProduct error:', error); });
    },

    deductStock: (productId, qty) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        const newStock = Math.max(0, product.stock - qty);
        set((s) => ({
            products: s.products.map((p) => p.id === productId ? { ...p, stock: newStock } : p),
        }));
        supabase?.from('products').update({ stock: newStock }).eq('id', productId)
            .then(({ error }) => { if (error) console.error('deductStock error:', error); });
    },

    addStockToProduct: (productId, qty) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        const newStock = product.stock + qty;
        set((s) => ({
            products: s.products.map((p) => p.id === productId ? { ...p, stock: newStock } : p),
        }));
        supabase?.from('products').update({ stock: newStock }).eq('id', productId)
            .then(({ error }) => { if (error) console.error('addStockToProduct error:', error); });
    },

    // ─ Cart ─
    addToCart: (product) =>
        set((s) => {
            const existing = s.cart.find((c) => c.product.id === product.id);
            if (existing) {
                return { cart: s.cart.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c) };
            }
            return { cart: [...s.cart, { product, quantity: 1 }] };
        }),

    removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.product.id !== productId) })),

    updateCartQty: (productId, qty) =>
        set((s) => {
            if (qty <= 0) return { cart: s.cart.filter((c) => c.product.id !== productId) };
            return { cart: s.cart.map((c) => (c.product.id === productId ? { ...c, quantity: qty } : c)) };
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

        const saleId = generateId();
        const sale: Sale = {
            id: saleId,
            items,
            grossRevenue,
            cogs,
            grossProfit,
            cashReceived,
            change,
            createdAt: now(),
        };

        // Update stock optimistically
        const updatedProducts = products.map((p) => {
            const item = items.find((i) => i.productId === p.id);
            if (item) return { ...p, stock: Math.max(0, p.stock - item.quantity) };
            return p;
        });

        set((s) => ({ sales: [sale, ...s.sales], products: updatedProducts, cart: [] }));

        // Sync to Supabase in background
        (async () => {
            if (!supabase) return;
            // Insert sale
            const { error: saleErr } = await supabase.from('sales').insert({
                id: sale.id,
                gross_revenue: sale.grossRevenue,
                cogs: sale.cogs,
                gross_profit: sale.grossProfit,
                cash_received: sale.cashReceived,
                change_amount: sale.change,
                created_at: sale.createdAt,
            });
            if (saleErr) { console.error('completeSale insert error:', saleErr); return; }

            // Insert sale items
            await supabase.from('sale_items').insert(
                items.map((i) => ({
                    id: generateId(),
                    sale_id: sale.id,
                    product_id: i.productId,
                    product_name: i.productName,
                    quantity: i.quantity,
                    cost_price: i.costPrice,
                    selling_price: i.sellingPrice,
                    subtotal: i.subtotal,
                }))
            );

            // Update stock for each product
            await Promise.all(
                items.map((i) => {
                    const newStock = Math.max(0, (products.find((p) => p.id === i.productId)?.stock ?? 0) - i.quantity);
                    return supabase!.from('products').update({ stock: newStock }).eq('id', i.productId);
                })
            );
        })();

        return sale;
    },

    // ─ Stock Additions ─
    addStockAddition: (addition) => {
        const newAddition: StockAddition = { ...addition, id: generateId(), createdAt: now() };
        set((s) => ({
            stockAdditions: [newAddition, ...s.stockAdditions],
            products: s.products.map((p) =>
                p.id === addition.productId ? { ...p, stock: p.stock + addition.quantity } : p
            ),
        }));
        supabase?.from('stock_additions').insert({
            id: newAddition.id,
            product_id: newAddition.productId,
            product_name: newAddition.productName,
            quantity: newAddition.quantity,
            cost_per_unit: newAddition.costPerUnit,
            total_cost: newAddition.totalCost,
            created_at: newAddition.createdAt,
        }).then(({ error }) => { if (error) console.error('addStockAddition error:', error); });
        supabase?.from('products').update({ stock: (get().products.find((p) => p.id === addition.productId)?.stock ?? 0) + addition.quantity }).eq('id', addition.productId);
    },

    // ─ Expenses ─
    addExpense: (expense) => {
        const newExpense: Expense = { ...expense, id: generateId(), createdAt: now() };
        set((s) => ({ expenses: [newExpense, ...s.expenses] }));
        supabase?.from('expenses').insert({
            id: newExpense.id,
            description: newExpense.description,
            amount: newExpense.amount,
            category: newExpense.category,
            created_at: newExpense.createdAt,
        }).then(({ error }) => { if (error) console.error('addExpense error:', error); });
    },

    deleteExpense: (id) => {
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
        supabase?.from('expenses').delete().eq('id', id)
            .then(({ error }) => { if (error) console.error('deleteExpense error:', error); });
    },

    // ─ Selectors ─
    getLowStockProducts: () => get().products.filter((p) => p.stock <= p.lowStockThreshold),
    getTodaySales: () => get().sales.filter((s) => isToday(s.createdAt)),
    getTodayExpenses: () => get().expenses.filter((e) => isToday(e.createdAt)),
    getMonthSales: (year, month) => get().sales.filter((s) => isInMonth(s.createdAt, year, month)),
    getMonthExpenses: (year, month) => get().expenses.filter((e) => isInMonth(e.createdAt, year, month)),
    getCartTotal: () => get().cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity, 0),
    getCartCOGS: () => get().cart.reduce((sum, c) => sum + c.product.costPrice * c.quantity, 0),
}));
