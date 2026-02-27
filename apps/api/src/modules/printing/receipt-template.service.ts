
import { Injectable } from '@nestjs/common';
import { Order, OrderItem, Restaurant, Modifier, OrderItemModifier } from '@prisma/client';

// Simple interface for Order with relations, since Prisma types are just the model
interface OrderWithDetails extends Order {
    restaurant: Restaurant;
    items: (OrderItem & {
        modifiers: OrderItemModifier[];
    })[];
    table?: { number: string };
    customer?: { firstName: string; lastName: string };
}

@Injectable()
export class ReceiptTemplateService {

    formatCustomerReceipt(order: OrderWithDetails): string {
        const { restaurant, items } = order;

        // Using a simple ESC/POS like format or just text for now
        // In a real app, we might construct a JSON command list or XML

        let content = '';

        // Header
        content += this.centerText(restaurant.name) + '\n';
        content += this.centerText(restaurant.address) + '\n';
        content += this.centerText(`${restaurant.city}, ${restaurant.state}`) + '\n';
        if (restaurant.phone) content += this.centerText(restaurant.phone) + '\n';

        content += '\n';
        content += `Order: #${order.orderNumber}\n`;
        content += `Date:  ${new Date(order.createdAt).toLocaleString()}\n`;
        if (order.table) content += `Table: ${order.table.number}\n`;

        content += this.drawLine() + '\n';

        // Items
        for (const item of items) {
            const total = Number(item.totalPrice).toFixed(2);
            content += this.formatLineItem(item.quantity, item.itemName || 'Item', total);

            // Modifiers
            if (item.modifiers && item.modifiers.length > 0) {
                for (const mod of item.modifiers) {
                    content += `   + ${mod.modifierName} (${Number(mod.unitPrice).toFixed(2)})\n`;
                }
            }
        }

        content += this.drawLine() + '\n';

        // Totals
        const subtotal = Number(order.subtotal).toFixed(2);
        const tax = Number(order.taxAmount).toFixed(2);
        const total = Number(order.total).toFixed(2);

        content += this.formatTwoColumns('Subtotal:', subtotal);
        content += this.formatTwoColumns('Tax:', tax);
        if (Number(order.discountAmount) > 0) {
            content += this.formatTwoColumns('Discount:', `-${Number(order.discountAmount).toFixed(2)}`);
        }
        if (Number(order.tipAmount) > 0) {
            content += this.formatTwoColumns('Tip:', Number(order.tipAmount).toFixed(2));
        }
        content += '\n';
        content += this.formatTwoColumns('TOTAL:', total, true);

        content += '\n';
        content += this.centerText('Thank you for dining with us!') + '\n';
        content += this.centerText('Please come again.') + '\n';

        return content;
    }

    formatKitchenTicket(order: OrderWithDetails): string {
        let content = '';

        content += `KITCHEN TICKET #${order.orderNumber.slice(-4)}\n`;
        content += `Time: ${new Date().toLocaleTimeString()}\n`;
        content += `Type: ${order.type}\n`;
        if (order.table) content += `Table: ${order.table.number}\n`;
        if (order.kitchenNotes) content += `NOTE: ${order.kitchenNotes}\n`;

        content += this.drawLine('=') + '\n';

        for (const item of order.items) {
            content += `${item.quantity} x ${item.itemName}\n`;
            if (item.modifiers && item.modifiers.length > 0) {
                for (const mod of item.modifiers) {
                    content += `   [ ] ${mod.modifierName}\n`;
                }
            }
            if (item.specialInstructions) {
                content += `   NOTE: ${item.specialInstructions}\n`;
            }
            content += '\n';
        }

        return content;
    }

    // Helpers
    private centerText(text: string, width = 48): string {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    }

    private drawLine(char = '-', width = 48): string {
        return char.repeat(width);
    }

    private formatLineItem(qty: number, name: string, price: string, width = 48): string {
        const qtyStr = `${qty}x`;
        const priceStr = price;
        // Format: 2x Burger                10.00
        // If name is too long, wrap it? For simplicity, truncate logic here or let it overflow

        const availableWidthForName = width - qtyStr.length - priceStr.length - 2; // 2 spaces
        let truncatedName = name;
        if (name.length > availableWidthForName) {
            truncatedName = name.substring(0, availableWidthForName);
        }

        // Calc spaces
        const spaceLength = width - qtyStr.length - truncatedName.length - priceStr.length;
        return `${qtyStr} ${truncatedName}${' '.repeat(Math.max(1, spaceLength))}${priceStr}\n`;
    }

    private formatTwoColumns(left: string, right: string, bold = false, width = 48): string {
        const spaceLength = width - left.length - right.length;
        const line = `${left}${' '.repeat(Math.max(1, spaceLength))}${right}\n`;
        return bold ? `\x1b[1m${line}\x1b[0m` : line; // ANSI bold if printer supports, or just marker
    }
}
