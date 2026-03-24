/**
 * bluetooth-print.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Bluetooth Thermal Printer support via Web Bluetooth API
 *
 * Supports most common 58mm/80mm ESC/POS Bluetooth thermal printers
 * (e.g. PT-200, MTP-II, RPP02, Gprinter, Goojprt, etc.)
 *
 * FALLBACK: If Bluetooth is unavailable, falls back to window.print()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Sale } from './store';

// ── Web Bluetooth type declarations ─────────────────────────────────────────
// Web Bluetooth API is not yet in standard TypeScript lib — declare manually

interface BluetoothCharacteristicProperties {
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    read: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
    properties: BluetoothCharacteristicProperties;
    writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice {
    name?: string;
    gatt: BluetoothRemoteGATTServer;
}

interface BluetoothRequestDeviceFilter {
    services?: string[];
    namePrefix?: string;
    name?: string;
}

interface BluetoothRequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: string[];
    acceptAllDevices?: boolean;
}

interface Bluetooth {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}

// Extend navigator with bluetooth
declare global {
    interface Navigator {
        bluetooth?: Bluetooth;
    }
}

// ESC/POS commands
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
    INIT: [ESC, 0x40],
    ALIGN_CENTER: [ESC, 0x61, 0x01],
    ALIGN_LEFT: [ESC, 0x61, 0x00],
    BOLD_ON: [ESC, 0x45, 0x01],
    BOLD_OFF: [ESC, 0x45, 0x00],
    DOUBLE_HGT: [ESC, 0x21, 0x11],
    NORMAL: [ESC, 0x21, 0x00],
    LF: [0x0a],
    CUT: [GS, 0x56, 0x42, 0x00],
};

// Common BT printer service UUIDs to try
const BT_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    '0000ffe0-0000-1000-8000-00805f9b34fb',
];
const BT_CHARS = [
    '00002af1-0000-1000-8000-00805f9b34fb',
    '00002ae1-0000-1000-8000-00805f9b34fb',
    '0000ff02-0000-1000-8000-00805f9b34fb',
    '0000ff01-0000-1000-8000-00805f9b34fb',
    '49535343-8841-43f4-a8d4-ecbe34729bb3',
    '0000ffe1-0000-1000-8000-00805f9b34fb',
];

function textToBytes(text: string): number[] {
    return Array.from(new TextEncoder().encode(text));
}

function formatRp(num: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num);
}

function buildReceipt(sale: Sale): Uint8Array {
    const bytes: number[] = [];
    const add = (...chunks: number[][]) => chunks.forEach((c) => bytes.push(...c));
    const line = (text: string) => add(textToBytes(text + '\n'));
    const line32 = (left: string, right: string) => {
        const spaces = Math.max(1, 32 - left.length - right.length);
        line(left + ' '.repeat(spaces) + right);
    };
    const divider = () => line('--------------------------------');

    add(CMD.INIT, CMD.ALIGN_CENTER, CMD.DOUBLE_HGT);
    line('WARUNK KOSAM');
    add(CMD.NORMAL);
    line('Toko Kebutuhan Sehari-hari');
    divider();

    add(CMD.ALIGN_LEFT);
    const datetime = new Date(sale.createdAt).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    line(`No: ${sale.id.slice(-8).toUpperCase()}`);
    line(`Waktu: ${datetime}`);
    line(`Bayar: ${sale.paymentMethod}`);
    divider();

    for (const item of sale.items) {
        add(CMD.BOLD_ON);
        line(item.productName);
        add(CMD.BOLD_OFF);
        line32(`  ${item.quantity}x ${formatRp(item.sellingPrice)}`, formatRp(item.subtotal));
    }

    divider();
    line32('Subtotal', formatRp(sale.totalRevenue));
    divider();
    add(CMD.BOLD_ON);
    line32('TOTAL', formatRp(sale.totalRevenue));
    add(CMD.BOLD_OFF);
    line32('Tunai', formatRp(sale.cashReceived));
    line32('Kembali', formatRp(sale.change));
    divider();

    add(CMD.ALIGN_CENTER);
    line('Terima kasih sudah berbelanja!');
    add(CMD.LF, CMD.LF, CMD.LF, CMD.CUT);

    return new Uint8Array(bytes);
}

async function sendChunked(char: BluetoothRemoteGATTCharacteristic, data: Uint8Array) {
    const CHUNK = 512;
    for (let i = 0; i < data.length; i += CHUNK) {
        await char.writeValue(data.slice(i, i + CHUNK));
        await new Promise((r) => setTimeout(r, 50));
    }
}

async function findWritableChar(
    server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
    for (const svcUuid of BT_SERVICES) {
        try {
            const svc = await server.getPrimaryService(svcUuid);
            for (const charUuid of BT_CHARS) {
                try {
                    const ch = await svc.getCharacteristic(charUuid);
                    if (ch.properties.write || ch.properties.writeWithoutResponse) return ch;
                } catch { /* skip */ }
            }
            const chars = await svc.getCharacteristics();
            for (const ch of chars) {
                if (ch.properties.write || ch.properties.writeWithoutResponse) return ch;
            }
        } catch { /* skip */ }
    }
    return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function printReceiptBluetooth(sale: Sale): Promise<void> {
    if (!navigator.bluetooth) {
        printReceiptFallback(sale);
        return;
    }

    let device: BluetoothDevice;
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [BT_SERVICES[0]] },
                { services: [BT_SERVICES[1]] },
                { namePrefix: 'Printer' }, { namePrefix: 'printer' },
                { namePrefix: 'RPP' }, { namePrefix: 'MTP' },
                { namePrefix: 'PT-' }, { namePrefix: 'GP-' },
            ],
            optionalServices: BT_SERVICES,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('cancel')) throw new Error('Pemilihan printer dibatalkan');
        printReceiptFallback(sale);
        return;
    }

    const server = await device.gatt.connect();
    const characteristic = await findWritableChar(server);

    if (!characteristic) {
        device.gatt.disconnect();
        throw new Error('Printer tidak dikenali. Pastikan printer Bluetooth ESC/POS aktif.');
    }

    const receipt = buildReceipt(sale);
    await sendChunked(characteristic, receipt);
    device.gatt.disconnect();
}

// ── Fallback: browser print ───────────────────────────────────────────────────

function formatRpInner(num: number): string { return formatRp(num); }

function printReceiptFallback(sale: Sale): void {
    const datetime = new Date(sale.createdAt).toLocaleString('id-ID');
    const itemsHtml = sale.items.map((item) => `
        <tr>
            <td>${item.productName}</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:right">${formatRpInner(item.sellingPrice)}</td>
            <td style="text-align:right">${formatRpInner(item.subtotal)}</td>
        </tr>`).join('');

    const html = `<html><head><title>Struk</title>
    <style>body{font-family:monospace;font-size:12px;width:58mm;margin:0;padding:4px}
    h2{text-align:center;margin:0 0 4px;font-size:16px}
    p{text-align:center;margin:0}
    table{width:100%;border-collapse:collapse;margin:8px 0}
    th,td{padding:2px 4px}th{border-bottom:1px dashed #000}
    .total{font-weight:bold;border-top:1px dashed #000}
    .footer{text-align:center;margin-top:8px}</style></head>
    <body><h2>WARUNK KOSAM</h2>
    <p>Toko Kebutuhan Sehari-hari</p>
    <p style="font-size:10px;margin-top:4px">${datetime}</p>
    <p style="font-size:10px;margin-top:2px">Metode Bayar: ${sale.paymentMethod}</p>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Hrg</th><th>Total</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
    <tr class="total"><td colspan="3">TOTAL</td><td style="text-align:right">${formatRpInner(sale.totalRevenue)}</td></tr>
    <tr><td colspan="3">Tunai</td><td style="text-align:right">${formatRpInner(sale.cashReceived)}</td></tr>
    <tr><td colspan="3">Kembali</td><td style="text-align:right">${formatRpInner(sale.change)}</td></tr>
    </tfoot></table>
    <div class="footer">Terima kasih!</div></body></html>`;

    const win = window.open('', '_blank', 'width=320,height=600');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
}
