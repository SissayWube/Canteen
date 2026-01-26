import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
    TablePagination,
    Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi, Order, OrderFilters as OrderFiltersType } from '../api/orders';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '../contexts/SocketContext';
import {
    Print as PrintIcon,
    Close as CloseIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    FilterList as FilterIcon,
    Comment as CommentIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import dayjs, { Dayjs } from 'dayjs';
import { HighlightedTableRow } from '../components/HighlightedTableRow';
import OrderFilters from '../components/OrderFilters';
import { customersApi, Customer } from '../api/customers';
import { foodItemsApi, FoodItem } from '../api/foodItems';

import TableSkeleton from '../components/TableSkeleton';
import OrderDetailsModal from '../components/OrderDetailsModal';



const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });
    const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
    const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
    const [page, setPage] = useState(0);

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['orderStats'],
        queryFn: () => ordersApi.getStats(),
        refetchInterval: 30000,
    });

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [editFormData, setEditFormData] = useState({
        customerId: '',
        foodItemCode: '',
        isGuest: false,
        guestName: '',
        notes: ''
    });

    // Reset edit state when modal closes or changes
    React.useEffect(() => {
        if (selectedOrder) {
            setEditFormData({
                customerId: selectedOrder.customer?._id || '',
                foodItemCode: selectedOrder.workCode || '',
                isGuest: selectedOrder.isGuest || false,
                guestName: selectedOrder.guestName || '',
                notes: selectedOrder.notes || ''
            });
        }
        setIsEditing(false);
    }, [selectedOrder]);

    const handleEnterEditMode = async () => {
        setEditLoading(true);
        try {
            const [custRes, foodRes] = await Promise.all([
                customersApi.getAll({ limit: 1000 }),
                foodItemsApi.getAll({ limit: 1000 })
            ]);
            setCustomers(custRes.customers);
            setFoodItems(foodRes.foodItems.filter(f => f.isActive));
            setIsEditing(true);
        } catch (error) {
            console.error('Failed to load edit data', error);
            setSnackbar({ open: true, message: 'Failed to load data for editing.', severity: 'error' });
        } finally {
            setEditLoading(false);
        }
    };

    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;
        setEditLoading(true);
        try {
            await ordersApi.update(selectedOrder._id, {
                customerId: editFormData.isGuest ? '' : editFormData.customerId,
                foodItemCode: editFormData.foodItemCode,
                isGuest: editFormData.isGuest,
                guestName: editFormData.isGuest ? editFormData.guestName : '',
                notes: editFormData.notes
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setSnackbar({ open: true, message: 'Order updated successfully!', severity: 'success' });
            setSelectedOrder(null); // Close modal
        } catch (error: any) {
            console.error('Failed to update order', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to update order.',
                severity: 'error'
            });
        } finally {
            setEditLoading(false);
        }
    };

    const [filterCustomers, setFilterCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [departments, setDepartments] = useState<string[]>([]);

    // Fetch customers and departments for filter on mount
    React.useEffect(() => {
        customersApi.getAll({ limit: 1000 }).then(res => {
            setFilterCustomers(res.customers);
            const depts = Array.from(new Set(res.customers.map(c => c.department).filter(Boolean)));
            setDepartments(depts.sort());
        }).catch(err => console.error('Failed to load customers for filter', err));
    }, []);

    // Build filters
    const filters: OrderFiltersType = {
        page: page + 1,
        limit: rowsPerPage,
        customerId: selectedCustomerId || undefined,
        department: selectedDepartment || undefined,
        status: (selectedStatus as any) || undefined,
        search: debouncedSearch || undefined
    };
    if (fromDate) filters.from = fromDate.format('YYYY-MM-DD');
    if (toDate) filters.to = toDate.format('YYYY-MM-DD');

    // Fetch orders with React Query
    const { data, isLoading, isError } = useQuery({
        queryKey: ['orders', filters],
        queryFn: () => ordersApi.getAll(filters),
    });

    const orders = data?.orders ?? [];
    const totalOrders = data?.pagination.total ?? 0;

    // Real-time updates using Socket.io
    useSocketEvent('newPendingOrder', (eventData: any) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orderStats'] });
        if (eventData?.orderId) {
            setHighlightOrderId(eventData.orderId);
            setTimeout(() => setHighlightOrderId(null), 3000);
        }
    });

    useSocketEvent('orderApproved', () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    });

    useSocketEvent('orderRejected', (eventData: any) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orderStats'] });
        if (selectedOrder?._id === eventData.orderId) {
            setSelectedOrder(null);
        }
    });

    const handleApprove = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await ordersApi.approve(selectedOrder._id);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orderStats'] });
            setSnackbar({ open: true, message: 'Order approved successfully!', severity: 'success' });
            setSelectedOrder(null);
            setConfirmApproveOpen(false);
        } catch (error: any) {
            console.error('Failed to approve order:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to approve order.',
                severity: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = (e?: React.MouseEvent, tx?: Order) => {
        if (e) e.stopPropagation();
        if (tx) {
            setSelectedOrder(tx);
        }
        setConfirmRejectOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await ordersApi.reject(selectedOrder._id);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orderStats'] });
            setSnackbar({ open: true, message: 'Order rejected successfully!', severity: 'success' });
            setSelectedOrder(null);
            setConfirmRejectOpen(false);
        } catch (error: any) {
            console.error('Failed to reject order:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to reject order.',
                severity: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {user?.fullName || user?.username}!
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => navigate('/manual-issue')}>
                    Manual Order
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {[
                    { label: "Today's Orders", value: stats?.total || 0, color: '#1976d2', icon: <FilterIcon fontSize="small" /> },
                    { label: "Approved Today", value: stats?.approved || 0, color: '#2e7d32', icon: <ApproveIcon fontSize="small" /> },
                    { label: "Pending Today", value: stats?.pending || 0, color: '#ed6c02', icon: <CircularProgress size={16} color="inherit" /> },
                    { label: "Rejected Today", value: stats?.rejected || 0, color: '#d32f2f', icon: <RejectIcon fontSize="small" /> },
                ].map((card, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper sx={{
                            p: 1.5,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            borderLeft: `4px solid ${card.color}`,
                            transition: 'transform 0.1s',
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}>
                            <Box sx={{
                                bgcolor: `${card.color}15`,
                                color: card.color,
                                p: 1,
                                borderRadius: 1.5,
                                display: 'flex'
                            }}>
                                {card.icon}
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    {card.label}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: '800', lineHeight: 1.2 }}>
                                    {card.value}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 1.5, mb: 2 }}>
                <OrderFilters
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={(status) => {
                        setSelectedStatus(status);
                        setPage(0);
                    }}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={(dept) => {
                        setSelectedDepartment(dept);
                        setPage(0);
                    }}
                    selectedCustomerId={selectedCustomerId}
                    setSelectedCustomerId={(id) => {
                        setSelectedCustomerId(id);
                        setPage(0);
                    }}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    customers={filterCustomers}
                    departments={departments}
                    onClear={() => {
                        setFromDate(dayjs());
                        setToDate(dayjs());
                        setSelectedCustomerId('');
                        setSelectedDepartment('');
                        setSelectedStatus('');
                        setSearchTerm('');
                        setPage(0);
                    }}
                    showQuickRanges={true}
                />
            </Paper>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Recent Activity ({totalOrders})</Typography>
                        </Box>
                        {isLoading ? (
                            <TableSkeleton rows={10} />
                        ) : isError ? (
                            <Alert severity="error" sx={{ m: 2 }}>Failed to load orders</Alert>
                        ) : (
                            <>
                                <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Customer</TableCell>
                                                <TableCell>Department</TableCell>
                                                <TableCell>Meal</TableCell>
                                                <TableCell>Meal Code</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Subsidy</TableCell>
                                                <TableCell align="right">To Pay</TableCell>
                                                <TableCell align="center">Notes</TableCell>
                                                <TableCell>Date & Time</TableCell>
                                                <TableCell align="center">Status</TableCell>
                                                <TableCell align="center">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orders.map((tx) => (
                                                <HighlightedTableRow
                                                    key={tx._id}
                                                    hover
                                                    onClick={() => setSelectedOrder(tx)}
                                                    sx={{ cursor: 'pointer' }}
                                                    className={highlightOrderId === tx._id ? 'new-order' : ''}
                                                >
                                                    <TableCell>
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {tx.isGuest ? (tx.guestName || 'Guest') : (tx.customer?.name || 'Unknown')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {tx.isGuest ? (
                                                            <Chip label="Visitor" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' }} />
                                                        ) : (tx.customer?.department || 'Unknown')}
                                                    </TableCell>
                                                    <TableCell>{tx.foodItem?.name || 'Unknown'}</TableCell>
                                                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, borderRadius: 1, display: 'inline-block' }}>{tx.workCode}</Typography></TableCell>
                                                    <TableCell align="right">{tx.currency} {tx.price.toFixed(2)}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{tx.subsidy > 0 ? `-${tx.currency} ${tx.subsidy.toFixed(2)}` : '-'}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                        {tx.currency} {(tx.price - tx.subsidy).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {tx.notes && (
                                                            <Tooltip title={tx.notes} arrow placement="top">
                                                                <CommentIcon color="action" fontSize="small" />
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{dayjs(tx.timestamp).format('DD/MM/YYYY HH:mm')}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={tx.status?.toUpperCase()}
                                                            color={tx.status === 'approved' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                                                            size="small"
                                                            variant="filled"
                                                            sx={{ fontWeight: 'bold', minWidth: 85, color: 'white' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                            {tx.status === 'pending' ? (
                                                                <>
                                                                    <Tooltip title="Approve">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="success"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedOrder(tx);
                                                                                setConfirmApproveOpen(true);
                                                                            }}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <ApproveIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Reject">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={(e) => handleReject(e, tx)}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <RejectIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Edit">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(tx); }}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            <EditIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </>
                                                            ) : (
                                                                <IconButton size="small" disabled>
                                                                    <CloseIcon fontSize="small" sx={{ opacity: 0.3 }} />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </HighlightedTableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    component="div"
                                    count={totalOrders}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={(event) => {
                                        setRowsPerPage(parseInt(event.target.value, 10));
                                        setPage(0);
                                    }}
                                />
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Order Details Modal */}
            <OrderDetailsModal
                open={!!selectedOrder && !confirmRejectOpen && !confirmApproveOpen && !actionLoading}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onApprove={() => setConfirmApproveOpen(true)}
                onReject={() => handleReject()}
                onEnterEditMode={handleEnterEditMode}
                isEditing={isEditing}
                editLoading={editLoading}
                customers={customers}
                foodItems={foodItems}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                onUpdateOrder={handleUpdateOrder}
                onCancelEdit={() => setIsEditing(false)}
                actionLoading={actionLoading}
            />

            {/* Confirmation Dialogs */}
            <Dialog
                open={confirmApproveOpen}
                onClose={() => setConfirmApproveOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Approval</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to approve this order for <strong>{selectedOrder?.isGuest ? selectedOrder?.guestName : selectedOrder?.customer?.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={() => setConfirmApproveOpen(false)}
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApprove}
                        variant="contained"
                        color="success"
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <ApproveIcon />}
                        sx={{ borderRadius: 2, px: 3 }}
                        autoFocus
                    >
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmRejectOpen}
                onClose={() => setConfirmRejectOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Reject Order?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to reject this order for <strong>{selectedOrder?.customer?.name}</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={() => setConfirmRejectOpen(false)}
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleRejectConfirm}
                        sx={{ borderRadius: 2, px: 3 }}
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <RejectIcon />}
                        autoFocus
                    >
                        Yes, Reject
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Dashboard;
