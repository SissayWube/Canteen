import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

interface PrintTicketData {
    companyName: string;
    employeeName: string;
    employeeId: string;
    mealName: string;
    timestamp: Date;
    orderId: string;
    operatorName?: string;
}

export const printTicket = async (data: PrintTicketData): Promise<boolean> => {
    try {
        // Determine printer type from env, fallback to EPSON (most common for E-POS)
        const printerType = (process.env.PRINTER_TYPE?.toLowerCase() === 'star')
            ? PrinterTypes.STAR
            : PrinterTypes.EPSON;

        const printer = new ThermalPrinter({
            type: printerType,
            interface: process.env.PRINTER_INTERFACE!,
            characterSet: CharacterSet.PC852_LATIN2,
            removeSpecialCharacters: false,
            lineCharacter: '-',
            breakLine: BreakLine.WORD,
            width: Number(process.env.PRINTER_WIDTH) || 48,
        });

        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            console.error('Printer not connected or unreachable');
            return false;
        }

        // Header - large text
        printer.alignCenter();
        printer.bold(true);
        printer.setTextSize(2, 2);   // Double height & width
        printer.println(data.companyName || 'Canteen System');
        printer.setTextSize(1, 1);   // Reset to normal
        printer.bold(false);
        printer.println('------------------------------');

        // Body
        printer.alignLeft();
        printer.println(`Employee: ${data.employeeName}`);
        printer.println(`ID:       ${data.employeeId}`);
        printer.println(`Meal:     ${data.mealName}`);
        printer.println(`Time:     ${data.timestamp.toLocaleString()}`);
        printer.println(`Ticket ID: ${data.orderId}`);
        if (data.operatorName) {
            printer.println(`Operator: ${data.operatorName}`);
        }

        printer.println('------------------------------');
        printer.alignCenter();
        printer.println('Thank you!');
        printer.newLine();
        printer.newLine();

        printer.cut();
        printer.beep();

        await printer.execute();
        console.log('Ticket printed successfully');
        return true;
    } catch (error: any) {
        console.error('Print failed:', error.message || error);
        return false;
    }
};