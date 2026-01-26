import React from 'react';
import { Box, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import logo from '../../assets/phibelalogo.png';
import { AnalysisOrderRow } from '../../api/analysis';

type OrderRow = AnalysisOrderRow;

interface AnalysisPrintViewProps {
    from: Dayjs | null;
    to: Dayjs | null;
    selectedData: OrderRow[]; // Data to print
}

const AnalysisPrintView: React.FC<AnalysisPrintViewProps> = ({ from, to, selectedData }) => {
    return (
        <>
            <style>
                {`
                    @media print {
                        @page { margin: 20px; }
                        /* Hide Sidebar, Navbar, and non-print elements globally */
                        body { background: white; }
                        nav, aside, .MuiDrawer-root, .MuiAppBar-root, .no-print { display: none !important; }
                        
                        /* Ensure content takes full width */
                        #root, main, .MuiBox-root { width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                        
                        /* Show Print Content */
                        .print-content { display: block !important; }
                        .print-table { display: table !important; width: 100% !important; border-collapse: collapse !important; }
                        
                        /* Layout Adjustments */
                        .MuiDataGrid-root, .grid-container { display: none !important; }
                        .MuiDataGrid-footerContainer { display: none !important; }
                        .MuiTablePagination-root, .MuiDataGrid-toolbarContainer { display: none !important; }
                        .MuiDataGrid-virtualScroller { display: none !important; }

                        .print-table th, .print-table td {
                            border: 1px solid black !important;
                            padding: 4px 8px !important;
                            text-align: left !important;
                            font-size: 10pt !important;
                        }
                        .nowrap { white-space: nowrap !important; }
                        .print-table th {
                            background-color: #eee !important;
                            font-weight: bold !important;
                        }
                        .text-right { text-align: right !important; }
                        
                        .sticky-footer {
                            position: fixed !important;
                            bottom: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            width: 100% !important;
                            background: white !important;
                            z-index: 1000 !important;
                        }
                    }
                `}
            </style>

            {/* Report Header (Print Only) */}
            <Box className="print-content" sx={{ display: 'none', flexDirection: 'column', mb: 4 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', border: '2px solid black', fontFamily: 'serif' }}>
                    <tbody>
                        <tr>
                            {/* Logo Section */}
                            <td style={{ border: '1px solid black', width: '25%', padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <img src={logo} alt="Phibela Logo" style={{ maxWidth: '100%', height: '60px', objectFit: 'contain' }} />
                            </td>

                            {/* Center Section */}
                            <td style={{ border: '1px solid black', width: '50%', verticalAlign: 'middle' }}>
                                <div style={{ borderBottom: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                                    PhiBela Industrial PLC
                                </div>
                                <div style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                                    Report form
                                </div>
                            </td>

                            {/* Right Section */}
                            <td style={{ border: '1px solid black', width: '25%', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '2px 5px', width: '50%' }}>
                                                Doc. No.<br />PSD/OF/039
                                            </td>
                                            <td style={{ borderBottom: '1px solid black', padding: '2px 5px', width: '50%' }}>
                                                Issue Date<br />Oct. 2021
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ borderRight: '1px solid black', padding: '2px 5px' }}>
                                                Issue No. 1
                                            </td>
                                            <td style={{ padding: '2px 5px' }}>
                                                Page 1 of 1
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Dynamic Metadata */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', fontFamily: 'serif', fontSize: '14px' }}>
                    <Typography variant="body2">
                        <strong>Date:</strong> {dayjs().format('DD/MM/YYYY')}
                    </Typography>
                    {from && to && (
                        <Typography variant="body2">
                            <strong>Period:</strong> {from.format('DD/MM/YYYY')} - {to.format('DD/MM/YYYY')}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Hidden HTML Table for Printing (All Pages) */}
            <table className="print-table" style={{ display: 'none', width: '100%', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th className="nowrap">Date</th>
                        <th>Customer</th>
                        <th>Department</th>
                        <th>Item</th>
                        <th>Operator</th>
                        <th className="text-right">Price (ETB)</th>
                        <th className="text-right">Subsidy (ETB)</th>
                        <th className="text-right">To Pay (ETB)</th>
                        <th>Notes</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedData.map((row) => (
                        <tr key={row._id}>
                            <td className="nowrap">{dayjs(row.timestamp).format('DD/MM/YYYY HH:mm')}</td>
                            <td>{row.isGuest ? (row.guestName || 'Guest') : (row.customer?.name || 'Unknown')}</td>
                            <td>{row.isGuest ? 'Visitor' : (row.customer?.department || 'Unknown')}</td>
                            <td>{row.foodItem?.name || 'Unknown'}</td>
                            <td>{row.operator?.username || 'N/A'}</td>
                            <td className="text-right">{row.price}</td>
                            <td className="text-right">{row.subsidy}</td>
                            <td className="text-right">{(row.price || 0) - (row.subsidy || 0)}</td>
                            <td>{row.notes || '-'}</td>
                            <td>{row.status}</td>
                        </tr>
                    ))}
                    {/* Summary Row for Print */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#eee' }}>
                        <td colSpan={5} style={{ textAlign: 'right' }}>Totals:</td>
                        <td className="text-right">{selectedData.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}</td>
                        <td className="text-right">{selectedData.reduce((acc, curr) => acc + (curr.subsidy || 0), 0).toLocaleString()}</td>
                        <td className="text-right">{selectedData.reduce((acc, curr) => acc + ((curr.price || 0) - (curr.subsidy || 0)), 0).toLocaleString()}</td>
                        <td colSpan={2}></td>
                    </tr>
                </tbody>
            </table>
        </>
    );
};

export default AnalysisPrintView;
