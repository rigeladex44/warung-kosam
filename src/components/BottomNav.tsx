'use client';

import { LayoutDashboard, ShoppingCart, Package, BarChart3 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export type TabName = 'dashboard' | 'pos' | 'inventory' | 'finance';

interface BottomNavProps {
    activeTab: TabName;
    onTabChange: (tab: TabName) => void;
}

const navItems = [
    { id: 'dashboard' as TabName, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos' as TabName, label: 'Kasir', icon: ShoppingCart },
    { id: 'inventory' as TabName, label: 'Stok', icon: Package },
    { id: 'finance' as TabName, label: 'Keuangan', icon: BarChart3 },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const cart = useStore((s) => s.cart);
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isPos = item.id === 'pos';

                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn('nav-item', isActive && 'active')}
                        aria-label={item.label}
                    >
                        <div className="nav-icon-wrapper relative">
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                            {isPos && cartCount > 0 && (
                                <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>
                            )}
                        </div>
                        <span className="nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
