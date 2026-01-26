import React, { useMemo } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar, GridFooter, GridRowSelectionModel } from '@mui/x-data-grid';
import { Comment as CommentIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { AnalysisOrderRow } from '../../api/analysis';
import TableSkeleton from '../../components/TableSkeleton';

// Using AnalysisOrderRow from api/analysis.ts
type OrderRow = AnalysisOrderRow;

interface AnalysisTableProps {
    data: OrderRow[];
    isLoading: boolean;
    totalMeals: number;
    totalAmount: number;
    totalSubsidy: number;
    onRowClick: (row: OrderRow) => void;
    selectedRows: GridRowSelectionModel;
    setSelectedRows: (newSelection: GridRowSelectionModel) => void;
}

function CustomFooter(props: any) {
    const { totalMeals, totalAmount, totalSubsidy, ...other } = props;
    return (
        <Box>
            <Box sx={{
                display: 'flex',
                borderTop: '1px solid #e0e0e0',
                p: '8px 0',
                fontWeight: 'bold',
                bgcolor: '#f5f5f5',
                alignItems: 'center'
            }}>
                <Box className="no-print" sx={{ width: 50 }} /> {/* Checkbox column offset */}
                <Box sx={{ flex: 1.5, pl: 2 }}>Totals</Box> {/* Date column */}
                <Box sx={{ flex: 1.5 }} /> {/* Customer column */}
                <Box sx={{ flex: 1.5 }} /> {/* Department column */}
                <Box sx={{ flex: 1.5, textAlign: 'right', pr: 2 }}>{totalMeals}  Meals</Box> {/* Item column */}
                <Box sx={{ flex: 1.2 }} /> {/* Operator column */}
                <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>{(totalAmount || 0).toLocaleString()} ETB</Box> {/* Price column */}
                <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>{(totalSubsidy || 0).toLocaleString()} ETB</Box> {/* Subsidy column */}
                <Box sx={{ flex: 1, textAlign: 'right', pr: 2, color: 'primary.main', fontWeight: '900' }}>{((totalAmount - totalSubsidy) || 0).toLocaleString()} ETB</Box> {/* To Pay column */}
                <Box className="no-print" sx={{ flex: 0.8 }} /> {/* Notes column */}
                <Box className="no-print" sx={{ flex: 1 }} /> {/* Status column */}
            </Box>
            <GridFooter {...other} />
        </Box>
    );
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({
    data,
    isLoading,
    totalMeals,
    totalAmount,
    totalSubsidy,
    onRowClick,
    selectedRows,
    setSelectedRows
}) => {
    // Memoize columns for performance
    const analysisColumns: GridColDef<OrderRow>[] = useMemo(() => [
        {
            field: 'timestamp',
            headerName: 'Date',
            flex: 1.5,
            valueFormatter: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
        },
        {
            field: 'customer.name',
            headerName: 'Customer',
            flex: 1.5,
            valueGetter: (_: any, row: OrderRow) => row.isGuest ? (row.guestName || 'Guest') : (row.customer?.name || 'Unknown'),
        },
        {
            field: 'customer.department',
            headerName: 'Department',
            flex: 1.5,
            valueGetter: (_: any, row: OrderRow) => row.isGuest ? 'Visitor' : (row.customer?.department || 'Unknown'),
        },
        {
            field: 'foodItem.name',
            headerName: 'Item',
            flex: 1.5,
            valueGetter: (_: any, row: OrderRow) => row.foodItem?.name || 'Unknown',
        },
        {
            field: 'operator.username',
            headerName: 'Operator',
            flex: 1.2,
            valueGetter: (_: any, row: OrderRow) => row.operator?.username || 'N/A',
        },
        {
            field: 'price',
            headerName: 'Price (ETB)',
            type: 'number',
            flex: 1,
            align: 'right',
            headerAlign: 'right',
        },
        {
            field: 'subsidy',
            headerName: 'Subsidy (ETB)',
            type: 'number',
            flex: 1,
            align: 'right',
            headerAlign: 'right',
        },
        {
            field: 'toPay',
            headerName: 'To Pay (ETB)',
            type: 'number',
            flex: 1,
            align: 'right',
            headerAlign: 'right',
            valueGetter: (_: any, row: OrderRow) => (row.price || 0) - (row.subsidy || 0),
        },
        {
            field: 'notes',
            headerName: 'Notes',
            flex: 0.8,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                if (!params.row.notes) return null;
                return (
                    <Tooltip title={params.row.notes} arrow placement="left">
                        <CommentIcon color="action" fontSize="small" />
                    </Tooltip>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => {
                const status = (params.row.status || 'approved').toLowerCase();
                let color: 'success' | 'warning' | 'error' = 'success';
                if (status === 'pending') color = 'warning';
                else if (status === 'rejected') color = 'error';
                return <Chip label={status.toUpperCase()} color={color} size="small" variant="outlined" />;
            },
        },
    ], []);

    if (isLoading) {
        return <TableSkeleton rows={10} />;
    }

    return (
        <Box className="grid-container" sx={{ height: 600, width: '100%' }}>
            <DataGrid
                rows={data}
                density="compact"
                autoHeight={false}
                sx={{
                    '@media print': { height: 'auto', '& .MuiDataGrid-virtualScroller': { overflow: 'visible' } },
                    '& .MuiDataGrid-footerContainer': { borderTop: 'none' } // Clean up double border with CustomFooter
                }}
                columns={analysisColumns}
                getRowId={(row) => row._id}
                onRowClick={(params) => onRowClick(params.row)}
                checkboxSelection
                onRowSelectionModelChange={(newSelection) => {
                    setSelectedRows(newSelection);
                }}
                rowSelectionModel={selectedRows}
                disableRowSelectionOnClick
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 25, page: 0 },
                    },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                slots={{
                    toolbar: GridToolbar,
                    footer: CustomFooter
                }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                    },
                    footer: {
                        totalMeals,
                        totalAmount,
                        totalSubsidy
                    } as any
                }}
            />
        </Box>
    );
};

export default AnalysisTable;
