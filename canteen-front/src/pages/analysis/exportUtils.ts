import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';
import logo from '../../assets/phibelalogo.png';
import { AnalysisOrderRow } from '../../api/analysis';

type OrderRow = AnalysisOrderRow;

export const handleExportPDF = (data: OrderRow[], selectedData?: OrderRow[], from?: Dayjs | null, to?: Dayjs | null, selectedStatus?: string) => {
    const exportData = selectedData || data;
    try {
        console.log("Starting PDF Export...");
        const doc = new jsPDF();

        // --- Header Section matching Print Layout ---
        const pageWidth = doc.internal.pageSize.width;
        const leftMargin = 14;
        const rightMargin = pageWidth - 14;
        const contentWidth = pageWidth - 28;

        // Main Container Box for Header
        doc.setLineWidth(0.5);
        doc.rect(leftMargin, 10, contentWidth, 30); // x, y, w, h

        // Vertical Lines for 3 columns (approx 25% | 50% | 25%)
        const col1Width = contentWidth * 0.25;
        const col2Width = contentWidth * 0.50;

        doc.line(leftMargin + col1Width, 10, leftMargin + col1Width, 40); // Line 1
        doc.line(leftMargin + col1Width + col2Width, 10, leftMargin + col1Width + col2Width, 40); // Line 2

        // Col 1: Logo
        try {
            // Assuming 'logo' from import is a valid URL/Path handled by vite
            const img = new Image();
            img.src = logo;
            doc.addImage(img, 'PNG', leftMargin + 2, 12, col1Width - 4, 26, undefined, 'FAST');
        } catch (e) {
            doc.setFontSize(10);
            doc.text("Logo", leftMargin + 10, 25);
        }

        // Col 2: Company Name & Report Form
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("PhiBela Industrial PLC", leftMargin + col1Width + (col2Width / 2), 20, { align: "center" });

        doc.line(leftMargin + col1Width, 25, leftMargin + col1Width + col2Width, 25); // Horizontal divider

        doc.setFontSize(12);
        doc.text("Orders Analysis Report", leftMargin + col1Width + (col2Width / 2), 33, { align: "center" });

        // Col 3: Metadata Table (Mini table inside rights column)
        // Rows: Doc No / Issue Date, Issue No / Page
        const col3Start = leftMargin + col1Width + col2Width;
        const col3Width = contentWidth * 0.25;

        doc.line(col3Start, 25, rightMargin, 25); // Horizontal Split
        doc.line(col3Start + (col3Width / 2), 10, col3Start + (col3Width / 2), 40); // Vertical Split in Col 3

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        // Quadrant 1
        doc.text("Doc. No.", col3Start + 2, 14);
        doc.text("PSD/OF/039", col3Start + 2, 22);

        // Quadrant 2
        doc.text("Issue Date", col3Start + (col3Width / 2) + 2, 14);
        doc.text("Oct. 2021", col3Start + (col3Width / 2) + 2, 22);

        // Quadrant 3
        doc.text("Issue No. 1", col3Start + 2, 34);

        // Quadrant 4
        doc.text("Page 1 of 1", col3Start + (col3Width / 2) + 2, 34);

        // --- Metadata Row (Date / Period) ---
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const dateStr = dayjs().format('DD/MM/YYYY');
        const periodStr = from && to ? `${from.format('DD/MM/YYYY')} - ${to.format('DD/MM/YYYY')}` : 'N/A';

        doc.text(`Date: ${dateStr}`, leftMargin, 46);
        if (from && to) {
            doc.text(`Period: ${periodStr}`, rightMargin, 46, { align: "right" });
        }

        // --- Data Table ---
        const tableData = exportData.map((row) => [
            dayjs(row.timestamp).format('DD/MM/YYYY HH:mm'),
            row.isGuest ? (row.guestName || 'Guest') : (row.customer?.name || 'Unknown'),
            row.isGuest ? 'Visitor' : (row.customer?.department || 'Unknown'),
            row.foodItem?.name || 'Unknown',
            row.operator?.username || 'N/A',
            row.price,
            row.subsidy,
            (row.price || 0) - (row.subsidy || 0)
        ]);

        autoTable(doc, {
            head: [['Date', 'Customer', 'Department', 'Item', 'Operator', 'Price', 'Subsidy', 'To Pay']],
            body: tableData,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
            columnStyles: {
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' }
            }
        });

        // --- Summary (Dynamic based on filter) ---
        const finalY = (doc as any).lastAutoTable?.finalY || 60;
        const statusLabel = selectedStatus ? selectedStatus.toUpperCase() : 'ALL STATUSES';

        const summaryTotalMeals = exportData.length;
        const summaryTotalAmount = exportData.reduce((acc, curr) => acc + (curr.price || 0), 0);
        const summaryTotalSubsidy = exportData.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`SUMMARY (${statusLabel})`, 14, finalY + 10);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Meals: ${summaryTotalMeals}`, 14, finalY + 16);
        doc.text(`Total Amount: ${summaryTotalAmount.toLocaleString()} ETB`, 14, finalY + 22);
        doc.text(`Total Subsidy: ${summaryTotalSubsidy.toLocaleString()} ETB`, 14, finalY + 28);
        doc.text(`Total To Pay: ${(summaryTotalAmount - summaryTotalSubsidy).toLocaleString()} ETB`, 14, finalY + 34);

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
        doc.setFontSize(8);
        doc.setFont("times", "bold");
        doc.text("PLEASE MAKE SURE THAT THIS IS THE CORRECT ISSUE BEFORE USE", pageWidth / 2, pageHeight - 10, { align: "center" });

        const pdfBlob = doc.output('blob');
        // Dynamic filename with date range
        let filename = `Orders_Analysis_${dayjs().format('YYYY-MM-DD')}`;
        if (from && to) {
            filename = `Orders_Analysis_${from.format('YYYY-MM-DD')}_to_${to.format('YYYY-MM-DD')}`;
        }
        console.log("Saving PDF file:", filename + '.pdf');
        saveAs(pdfBlob, filename + '.pdf');
    } catch (error) {
        console.error("PDF Export Error:", error);
        alert("Failed to export PDF. See console.");
    }
};

export const handleExportExcel = (data: OrderRow[], selectedData?: OrderRow[], from?: Dayjs | null, to?: Dayjs | null, selectedStatus?: string) => {
    const exportData = selectedData || data;
    try {
        console.log("Starting Excel (.xlsx) Export...");

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws_data: any[][] = [];

        // Header Rows
        ws_data.push(['PhiBela Industrial PLC - Orders Analysis Report']);
        ws_data.push([]); // Blank row

        // Data Headers
        ws_data.push(['Date', 'Customer', 'Department', 'Item', 'Operator', 'Price', 'Subsidy', 'To Pay']);

        // Data Rows
        exportData.forEach(row => {
            ws_data.push([
                dayjs(row.timestamp).format('DD/MM/YYYY HH:mm'),
                row.isGuest ? (row.guestName || 'Guest') : (row.customer?.name || 'Unknown'),
                row.isGuest ? 'Visitor' : (row.customer?.department || 'Unknown'),
                row.foodItem?.name || 'Unknown',
                row.operator?.username || 'N/A',
                row.price,
                row.subsidy,
                (row.price || 0) - (row.subsidy || 0)
            ]);
        });

        // Summary (Dynamic based on filter)
        const statusLabel = selectedStatus ? selectedStatus.toUpperCase() : 'ALL STATUSES';
        const totalMealsCalc = exportData.length;
        const totalAmountCalc = exportData.reduce((acc, curr) => acc + (curr.price || 0), 0);
        const totalSubsidyCalc = exportData.reduce((acc, curr) => acc + (curr.subsidy || 0), 0);

        ws_data.push([]);
        ws_data.push([`SUMMARY (${statusLabel})`]);
        ws_data.push(['Total Meals', totalMealsCalc]);
        ws_data.push(['Total Amount', `${totalAmountCalc} ETB`]);
        ws_data.push(['Total Subsidy', `${totalSubsidyCalc} ETB`]);
        ws_data.push(['Total To Pay', `${totalAmountCalc - totalSubsidyCalc} ETB`]);

        // Create worksheet from data
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Merge cells for header formatting
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push(
            { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title row (Updated to 8 cols)
        );

        // Set column widths
        ws['!cols'] = [
            { wch: 18 }, // Date
            { wch: 20 }, // Customer
            { wch: 15 }, // Department
            { wch: 20 }, // Item
            { wch: 15 }, // Operator
            { wch: 12 }, // Price
            { wch: 12 }, // Subsidy
            { wch: 12 }  // To Pay
        ];

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Orders Analysis');

        // Write to file - Dynamic filename with date range
        let filename = `Orders_Analysis_${dayjs().format('YYYY-MM-DD')}`;
        if (from && to) {
            filename = `Orders_Analysis_${from.format('YYYY-MM-DD')}_to_${to.format('YYYY-MM-DD')}`;
        }
        XLSX.writeFile(wb, filename + '.xlsx');
        console.log("Saved Excel file:", filename + '.xlsx');
    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("Failed to export Excel. See console.");
    }
};
