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
    Divider,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TablePagination,
    MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi, Order, OrderFilters } from '../api/orders';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '../contexts/SocketContext';
import {
    Print as PrintIcon,
    Close as CloseIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    FilterList as FilterIcon,
    Comment as CommentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Tooltip from '@mui/material/Tooltip';
import dayjs, { Dayjs } from 'dayjs';
import { HighlightedTableRow } from '../components/HighlightedTableRow';
import { customersApi, Customer } from '../api/customers';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { Autocomplete, TextField } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
    const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
    const [page, setPage] = useState(0);

    const [rowsPerPage, setRowsPerPage] = useState(10);

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
            setSelectedOrder(null); // Close modal
        } catch (error) {
            console.error('Failed to update order', error);
        } finally {
            setEditLoading(false);
        }
    };

    // Build filters
    const filters: OrderFilters = {
        page: page + 1,
        limit: rowsPerPage,
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
        if (eventData?.orderId) {
            setHighlightOrderId(eventData.orderId);
            setTimeout(() => setHighlightOrderId(null), 3000);
        }
    });

    useSocketEvent('orderApproved', () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    useSocketEvent('orderRejected', (eventData: any) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
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
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to approve order:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOrder) return;
        setConfirmRejectOpen(true);
    };

    const handleRejectConfirm = async () => {
        setConfirmRejectOpen(false);
        setActionLoading(true);
        try {
            await ordersApi.reject(selectedOrder!._id);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to reject order:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Dashboard</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Welcome back, {user?.fullName || user?.username}!
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => navigate('/manual-issue')}>
                    Manual Order
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <DatePicker
                            label="From Date"
                            value={fromDate}
                            onChange={(newValue) => setFromDate(newValue)}
                            maxDate={toDate || undefined}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <DatePicker
                            label="To Date"
                            value={toDate}
                            onChange={(newValue) => setToDate(newValue)}
                            minDate={fromDate || undefined}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setFromDate(dayjs());
                                setToDate(dayjs());
                            }}
                            startIcon={<FilterIcon />}
                        >
                            Today
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setFromDate(null);
                                setToDate(null);
                                setPage(0);
                            }}
                        >
                            Reset All
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Orders ({orders.length})</Typography>
                        </Box>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : isError ? (
                            <Alert severity="error" sx={{ m: 2 }}>Failed to load orders</Alert>
                        ) : (
                            <>
                                <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Customer</TableCell>
                                                <TableCell>Department</TableCell>
                                                <TableCell>Meal</TableCell>
                                                <TableCell>Meal Code</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Subsidy</TableCell>
                                                <TableCell align="center">Notes</TableCell>
                                                <TableCell>Date & Time</TableCell>
                                                <TableCell align="center">Status</TableCell>
                                                <TableCell align="center">Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orders
                                                .map((tx) => (
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
                                                            {tx.isGuest ? 'Visitor' : (tx.customer?.department || 'Unknown')}
                                                        </TableCell>
                                                        <TableCell>{tx.foodItem?.name || 'Unknown'}</TableCell>
                                                        <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, borderRadius: 1, display: 'inline-block' }}>{tx.workCode}</Typography></TableCell>
                                                        <TableCell align="right">{tx.currency} {tx.price.toFixed(2)}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{tx.subsidy > 0 ? `-${tx.currency} ${tx.subsidy.toFixed(2)}` : '-'}</TableCell>
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
                                                                variant="outlined"
                                                                sx={{ fontWeight: 'bold', minWidth: 80 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {tx.status === 'pending' && (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedOrder(tx);
                                                                    }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </TableCell>
                                                    </HighlightedTableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
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
            <Dialog
                open={Boolean(selectedOrder)}
                onClose={() => setSelectedOrder(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, overflow: 'hidden' }
                }}
            >
                {selectedOrder && (
                    <>
                        <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }}>
                            <Typography variant="h6" fontWeight="bold">Order Details</Typography>
                            <IconButton onClick={() => setSelectedOrder(null)} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent dividers sx={{ p: 4 }}>
                            <Box sx={{ mb: 4 }}>
                                <Alert
                                    severity={selectedOrder.status === 'approved' ? 'success' : selectedOrder.status === 'pending' ? 'warning' : 'error'}
                                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                                >
                                    Current Status: {selectedOrder.status.toUpperCase()}
                                </Alert>
                            </Box>

                            <Grid container spacing={4}>
                                {isEditing ? (
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                select
                                                label="Order Type"
                                                value={editFormData.isGuest ? 'guest' : 'employee'}
                                                onChange={(e) => setEditFormData({ ...editFormData, isGuest: e.target.value === 'guest' })}
                                                fullWidth
                                                size="small"
                                                sx={{ mb: 2 }}
                                            >
                                                <MenuItem value="employee">Employee</MenuItem>
                                                <MenuItem value="guest">Guest</MenuItem>
                                            </TextField>

                                            {editFormData.isGuest ? (
                                                <TextField
                                                    label="Guest Name"
                                                    value={editFormData.guestName}
                                                    onChange={(e) => setEditFormData({ ...editFormData, guestName: e.target.value })}
                                                    fullWidth
                                                    size="small"
                                                    required
                                                />
                                            ) : (
                                                <Autocomplete
                                                    options={customers}
                                                    getOptionLabel={(option) => `${option.name} (${option.department})`}
                                                    value={customers.find(c => c._id === editFormData.customerId) || null}
                                                    onChange={(_, newValue) => setEditFormData({ ...editFormData, customerId: newValue?._id || '' })}
                                                    renderInput={(params) => <TextField {...params} label="Customer" fullWidth size="small" />}
                                                />
                                            )}
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Autocomplete
                                                options={foodItems}
                                                getOptionLabel={(option) => `${option.name} (${option.price} ETB)`}
                                                value={foodItems.find(f => f.code === editFormData.foodItemCode) || null}
                                                onChange={(_, newValue) => setEditFormData({ ...editFormData, foodItemCode: newValue?.code || '' })}
                                                renderInput={(params) => <TextField {...params} label="Food Item" fullWidth size="small" />}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                label="Notes"
                                                value={editFormData.notes}
                                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                                fullWidth
                                                multiline
                                                rows={2}
                                                size="small"
                                            />
                                        </Grid>
                                    </>
                                ) : (
                                    <>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Customer Details</Typography>
                                            <Typography variant="h6" sx={{ mt: 0.5 }}>{selectedOrder.isGuest ? (selectedOrder.guestName || 'Guest') : selectedOrder.customer.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{selectedOrder.isGuest ? 'Guest' : selectedOrder.customer.department}</Typography>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Meal Information</Typography>
                                            <Typography variant="h6" sx={{ mt: 0.5 }}>{selectedOrder.foodItem?.name || 'N/A'}</Typography>
                                            <Typography variant="body2" color="text.secondary">Code: {selectedOrder.workCode}</Typography>
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Cost Breakdown</Typography>
                                            <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2">Meal Price:</Typography>
                                                    <Typography variant="body2">{selectedOrder.currency} {selectedOrder.price.toFixed(2)}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2">Applied Subsidy:</Typography>
                                                    <Typography variant="body2" color="success.main">-{selectedOrder.currency} {selectedOrder.subsidy.toFixed(2)}</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">Balance to Pay:</Typography>
                                                    <Typography variant="subtitle1" fontWeight="900" color="primary.main">
                                                        {selectedOrder.currency} {(selectedOrder.price - selectedOrder.subsidy).toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {selectedOrder.notes && (
                                            <Grid size={{ xs: 12 }}>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Notes</Typography>
                                                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                        "{selectedOrder.notes}"
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        )}
                                    </>
                                )}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Timestamp: {new Date(selectedOrder.timestamp).toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, bgcolor: 'background.default', gap: 1 }}>
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        onClick={() => setIsEditing(false)}
                                        disabled={editLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleUpdateOrder}
                                        disabled={editLoading}
                                        startIcon={editLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {selectedOrder.status === 'pending' && (
                                        <>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                onClick={handleEnterEditMode}
                                                startIcon={<EditIcon />}
                                                sx={{ borderRadius: 2, mr: 'auto' }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={handleApprove}
                                                disabled={actionLoading}
                                                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <ApproveIcon />}
                                                sx={{ borderRadius: 2, px: 3 }}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <RejectIcon />}
                                                sx={{ borderRadius: 2, px: 3 }}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="text" color="inherit" onClick={() => setSelectedOrder(null)} sx={{ borderRadius: 2 }}>
                                        Close
                                    </Button>
                                </>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Reject Confirmation Dialog */}
            <Dialog
                open={confirmRejectOpen}
                onClose={() => setConfirmRejectOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Reject Order?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to reject this order for <strong>{selectedOrder?.customer?.name}</strong>?
                        This action cannot be undone.
                    </Typography>
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
                        autoFocus
                    >
                        Yes, Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard;
