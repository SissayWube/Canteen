import React, { useEffect, useState } from 'react';
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
    IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi, Order } from '../api/orders';
import { io, Socket } from 'socket.io-client';
import {
    Print as PrintIcon,
    Close as CloseIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

    const refreshData = () => setFetchTrigger(prev => prev + 1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const orders = await ordersApi.getAll();
                setRecentOrders(orders.slice(0, 10)); // Show more since we have full width
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        fetchData();

        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket: Socket = io(backendUrl, {
            transports: ['websocket', 'polling'],
        });

        socket.on('newPendingOrder', (data: any) => {
            refreshData();
            if (data?.orderId) {
                setHighlightOrderId(data.orderId);
                setTimeout(() => setHighlightOrderId(null), 3000);
            }
        });
        socket.on('orderApproved', () => refreshData());
        socket.on('orderRejected', (data: any) => {
            refreshData();
            if (selectedOrder?._id === data.orderId) {
                setSelectedOrder(null);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchTrigger, selectedOrder?._id]);

    const handleApprove = async () => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await ordersApi.approve(selectedOrder._id);
            refreshData();
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
            refreshData();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to reject order:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Box>
            <style>
                {`
                    @keyframes pulse-highlight {
                        0% { background-color: rgba(25, 118, 210, 0.15); }
                        30% { background-color: rgba(25, 118, 210, 0.1); }
                        100% { background-color: transparent; }
                    }
                    .new-order-row {
                        animation: pulse-highlight 4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        border-left: 4px solid #1976d2 !important;
                    }
                `}
            </style>
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

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Recent Orders </Typography>
                        </Box>
                        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Employee</TableCell>
                                        <TableCell>Department</TableCell>
                                        <TableCell>Meal</TableCell>
                                        <TableCell>Meal Code</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                        <TableCell align="right">Subsidy</TableCell>
                                        <TableCell>Time</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentOrders
                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map((tx) => (
                                            <TableRow
                                                key={tx._id}
                                                hover
                                                onClick={() => setSelectedOrder(tx)}
                                                sx={{ cursor: 'pointer' }}
                                                className={highlightOrderId === tx._id ? 'new-order-row' : ''}
                                            >
                                                <TableCell>
                                                    <Typography variant="subtitle2" fontWeight="bold">{tx.employee.name}</Typography>
                                                </TableCell>
                                                <TableCell>{tx.employee.department}</TableCell>
                                                <TableCell>{tx.foodItem?.name || 'Unknown'}</TableCell>
                                                <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, borderRadius: 1, display: 'inline-block' }}>{tx.workCode}</Typography></TableCell>
                                                <TableCell align="right">{tx.currency} {tx.price.toFixed(2)}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{tx.subsidy > 0 ? `-${tx.currency} ${tx.subsidy.toFixed(2)}` : '-'}</TableCell>
                                                <TableCell>{new Date(tx.timestamp).toLocaleTimeString()}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={tx.status?.toUpperCase()}
                                                        color={tx.status === 'approved' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                                                        size="small"
                                                        sx={{ fontWeight: 'bold', minWidth: 80 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Employee Details</Typography>
                                    <Typography variant="h6" sx={{ mt: 0.5 }}>{selectedOrder.employee.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{selectedOrder.employee.department}</Typography>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>Meal Information</Typography>
                                    <Typography variant="h6" sx={{ mt: 0.5 }}>{selectedOrder.foodItem?.name || 'N/A'}</Typography>
                                    <Typography variant="body2" color="text.secondary">Code: {selectedOrder.workCode}</Typography>
                                    {/* <Typography variant="body2" color="text.secondary">Type: {selectedOrder.type?.toUpperCase() || 'MANUAL'}</Typography> */}
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

                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Order System ID: {selectedOrder._id}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Timestamp: {new Date(selectedOrder.timestamp).toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, bgcolor: 'background.default', gap: 1 }}>
                            {selectedOrder.status === 'pending' && (
                                <>
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
                        Are you sure you want to reject this order for <strong>{selectedOrder?.employee?.name}</strong>?
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
