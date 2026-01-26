import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    Divider,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    MenuItem,
    TextField,
    Autocomplete
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Edit as EditIcon,
    Save as SaveIcon
} from '@mui/icons-material';

import { Customer } from '../api/customers';
import { FoodItem } from '../api/foodItems';

// Define a type that covers both Order and AnalysisOrderRow requirements
// We accept a shape that looks like an Order, but some fields might be optional if needed.
// unique properties to AnalysisOrderRow (like operator) are extra and okay.
interface OrderLike {
    _id: string;
    status: string;
    isGuest?: boolean;
    guestName?: string;
    customer?: {
        _id?: string;
        name: string;
        department: string;
    };
    foodItem?: {
        name: string;
    };
    workCode?: string;
    currency?: string;
    price: number;
    subsidy: number;
    notes?: string;
}

export interface OrderDetailsModalProps {
    open: boolean;
    order: OrderLike | null;
    onClose: () => void;
    // Actions are optional now to support read-only views (like Analysis)
    onApprove?: () => void;
    onReject?: () => void;
    onEnterEditMode?: () => void;
    isEditing?: boolean;
    editLoading?: boolean;
    customers?: Customer[];
    foodItems?: FoodItem[];
    editFormData?: any;
    setEditFormData?: (data: any) => void;
    onUpdateOrder?: () => void;
    onCancelEdit?: () => void;
    actionLoading?: boolean;
    readOnly?: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    open, order, onClose, onApprove, onReject, onEnterEditMode,
    isEditing = false, editLoading = false, customers = [], foodItems = [], editFormData,
    setEditFormData, onUpdateOrder, onCancelEdit, actionLoading = false, readOnly = false
}) => {
    if (!order) return null;

    const currency = order.currency || 'ETB';
    const workCode = order.workCode || 'N/A';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h6" fontWeight="bold">Order Details</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Alert
                        severity={order.status === 'approved' ? 'success' : order.status === 'pending' ? 'warning' : 'error'}
                        sx={{ borderRadius: 2, fontWeight: 'bold', py: 0.5 }}
                    >
                        Status: {order.status.toUpperCase()}
                    </Alert>
                </Box>

                <Grid container spacing={2}>
                    {isEditing && setEditFormData ? (
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
                            <Grid size={{ xs: 6 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Customer</Typography>
                                <Typography variant="body1" fontWeight="bold">{order.isGuest ? (order.guestName || 'Guest') : order.customer?.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{order.isGuest ? 'Visitor' : order.customer?.department}</Typography>
                            </Grid>

                            <Grid size={{ xs: 6 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Meal</Typography>
                                <Typography variant="body1" fontWeight="bold">{order.foodItem?.name || 'N/A'}</Typography>
                                <Typography variant="body2" color="text.secondary">Code: {workCode}</Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">Price:</Typography>
                                        <Typography variant="body2">{currency} {order.price.toFixed(2)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Subsidy:</Typography>
                                        <Typography variant="body2" color="success.main">-{currency} {order.subsidy.toFixed(2)}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" fontWeight="bold">To Pay:</Typography>
                                        <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                            {currency} {(order.price - order.subsidy).toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {order.notes && (
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Notes</Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: '#fffde7', p: 1, borderRadius: 1 }}>
                                        "{order.notes}"
                                    </Typography>
                                </Grid>
                            )}
                        </>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: 'background.default', gap: 1 }}>
                {isEditing ? (
                    <>
                        <Button variant="outlined" color="inherit" onClick={onCancelEdit} disabled={editLoading} size="small">Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={onUpdateOrder}
                            disabled={editLoading}
                            startIcon={editLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                            size="small"
                        >
                            Save
                        </Button>
                    </>
                ) : (
                    <>
                        {!readOnly && order.status === 'pending' && (
                            <>
                                {onEnterEditMode && (
                                    <Button variant="outlined" startIcon={<EditIcon />} onClick={onEnterEditMode} size="small">Edit</Button>
                                )}
                                {onApprove && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={onApprove}
                                        disabled={actionLoading}
                                        startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ApproveIcon />}
                                        size="small"
                                    >
                                        Approve
                                    </Button>
                                )}
                                {onReject && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={onReject}
                                        disabled={actionLoading}
                                        startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <RejectIcon />}
                                        size="small"
                                    >
                                        Reject
                                    </Button>
                                )}
                            </>
                        )}
                        <Button variant="text" color="inherit" onClick={onClose} size="small">Close</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default OrderDetailsModal;
