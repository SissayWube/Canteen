import path from 'path';
import { fileURLToPath } from 'url';
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PrintTicketData {
    companyName: string;
    customerName: string;
    customerId: string;
    department?: string;
    mealName: string;
    mealCode?: string;
    price?: number;
    subsidy?: number;
    currency?: string;
    timestamp: Date;
    orderId: string;
    operatorName?: string;
}

/**
 * Prints a right-aligned label: value pair.
 * Example: "Base Price:        120 ETB"
 */
function printLabelValue(printer: ThermalPrinter, label: string, value: string, width: number) {
    const gap = width - label.length - value.length;
    const spaces = gap > 0 ? ' '.repeat(gap) : ' ';
    printer.println(`${label}${spaces}${value}`);
}

export const printTicket = async (data: PrintTicketData): Promise<boolean> => {
    try {
        const printerType = (process.env.PRINTER_TYPE?.toLowerCase() === 'star')
            ? PrinterTypes.STAR
            : PrinterTypes.EPSON;

        if (!process.env.PRINTER_INTERFACE) {
            console.error('Print failed: PRINTER_INTERFACE is not defined in environment variables');
            return false;
        }

        const width = Number(process.env.PRINTER_WIDTH) || 48;

        const printer = new ThermalPrinter({
            type: printerType,
            interface: process.env.PRINTER_INTERFACE,
            characterSet: CharacterSet.PC852_LATIN2,
            removeSpecialCharacters: false,
            lineCharacter: '-',
            breakLine: BreakLine.WORD,
            width,
        });

        // Bypassing connection check for USB/UNC paths as it can be unreliable
        const isTCP = process.env.PRINTER_INTERFACE.startsWith('tcp://');
        if (isTCP) {
            const isConnected = await printer.isPrinterConnected();
            if (!isConnected) {
                console.error(`Printer not connected or unreachable at: ${process.env.PRINTER_INTERFACE}`);
                return false;
            }
        } else {
            console.log(`Bypassing connection check for non-TCP interface: ${process.env.PRINTER_INTERFACE}`);
        }

        const sep = '-'.repeat(width);
        const currency = data.currency || 'ETB';

        // ===== HEADER =====
        printer.alignCenter();

        // Print company logo
        const logoPath = path.join(__dirname, '..', 'assets', 'phibelalogo.png');
        try {
            await printer.printImage(logoPath);
        } catch (err) {
            console.warn('Logo print failed, skipping:', err);
        }
        printer.bold(true);
        printer.println(`${data.companyName || 'Phibela Industrial PLC'} - RECEIPT`);
        printer.bold(false);
        printer.println(data.timestamp.toLocaleString());
        printer.println(sep);

        // ===== CUSTOMER DETAILS =====
        printer.alignLeft();
        printer.bold(true);
        printer.println('CUSTOMER DETAILS');
        printer.bold(false);
        printer.println(data.customerName);
        // ID and DEPT on one line
        const idDept = data.department
            ? `ID: ${data.customerId}    DEPT: ${data.department}`
            : `ID: ${data.customerId}`;
        printer.println(idDept);
        printer.println(sep);

        // ===== MEAL INFORMATION =====
        printer.bold(true);
        printer.println('MEAL INFORMATION');
        printer.bold(false);
        // Meal name with Qty and price on next line
        printer.println(data.mealName);
        if (data.price !== undefined) {
            printLabelValue(printer, 'Qty: 1', `${data.price} ${currency}`, width);
            printLabelValue(printer, 'Company Share:', `${data.subsidy || 0} ${currency}`, width);
            printLabelValue(printer, 'Employee Share:', `${(data.price || 0) - (data.subsidy || 0)} ${currency}`, width);
        }
        // if (data.price !== undefined) {
        //     const total = (data.price || 0) - (data.subsidy || 0);
        //     printer.bold(true);
        //     printLabelValue(printer, 'TOTAL:', `${total} ${currency}`, width);
        //     printer.bold(false);
        // }
        printer.println(sep);

        // ===== FOOTER =====
        printer.alignCenter();
        if (data.operatorName) {
            printer.println(`OPERATOR: ${data.operatorName.toUpperCase()}`);
        }

        printer.cut();

        await printer.execute();
        console.log('Ticket printed successfully');
        return true;
    } catch (error: any) {
        console.error('Print failed:', error.message || error);
        return false;
    }
};
