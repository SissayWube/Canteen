import React from 'react';
import { Box, TextField, MenuItem, Button, Autocomplete, Grid, ButtonGroup } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import CalendarToday from '@mui/icons-material/CalendarToday';
import EventNote from '@mui/icons-material/EventNote';
import DateRange from '@mui/icons-material/DateRange';
import dayjs from 'dayjs';
import { Customer } from '../api/customers';

interface OrderFiltersProps {
    fromDate: Dayjs | null;
    setFromDate: (date: Dayjs | null) => void;
    toDate: Dayjs | null;
    setToDate: (date: Dayjs | null) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    selectedDepartment: string;
    setSelectedDepartment: (dept: string) => void;
    selectedCustomerId: string;
    setSelectedCustomerId: (id: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    customers: Customer[];
    departments: string[];
    onClear: () => void;
    showQuickRanges?: boolean;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    selectedStatus,
    setSelectedStatus,
    selectedDepartment,
    setSelectedDepartment,
    selectedCustomerId,
    setSelectedCustomerId,
    searchTerm,
    setSearchTerm,
    customers,
    departments,
    onClear,
    showQuickRanges = false
}) => {

    const setQuickRange = (range: 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth') => {
        const today = dayjs();
        switch (range) {
            case 'today':
                setFromDate(today);
                setToDate(today);
                break;
            case 'yesterday':
                setFromDate(today.subtract(1, 'day'));
                setToDate(today.subtract(1, 'day'));
                break;
            case 'last7days':
                setFromDate(today.subtract(6, 'day'));
                setToDate(today);
                break;
            case 'thisMonth':
                setFromDate(today.startOf('month'));
                setToDate(today.endOf('month'));
                break;
            case 'lastMonth':
                setFromDate(today.subtract(1, 'month').startOf('month'));
                setToDate(today.subtract(1, 'month').endOf('month'));
                break;
        }
    };

    return (
        <Box>
            {showQuickRanges && (
                <Box sx={{ mb: 2 }}>
                    <ButtonGroup variant="outlined" size="small">
                        <Button startIcon={<CalendarToday />} onClick={() => setQuickRange('today')}>Today</Button>
                        <Button onClick={() => setQuickRange('yesterday')}>Yesterday</Button>
                        <Button startIcon={<EventNote />} onClick={() => setQuickRange('last7days')}>Last 7 Days</Button>
                        <Button startIcon={<DateRange />} onClick={() => setQuickRange('thisMonth')}>This Month</Button>
                        <Button onClick={() => setQuickRange('lastMonth')}>Last Month</Button>
                    </ButtonGroup>
                </Box>
            )}

            <Grid container spacing={1.5} alignItems="center">
                <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                    <TextField
                        fullWidth
                        label="Search Name"
                        placeholder="Employee/Guest..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3, md: 1.5 }}>
                    <DatePicker
                        label="From"
                        value={fromDate}
                        onChange={(newValue) => setFromDate(newValue)}
                        maxDate={toDate || undefined}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3, md: 1.5 }}>
                    <DatePicker
                        label="To"
                        value={toDate}
                        onChange={(newValue) => setToDate(newValue)}
                        minDate={fromDate || undefined}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3, md: 1.5 }}>
                    <TextField
                        select
                        fullWidth
                        label="Status"
                        value={selectedStatus || 'all'}
                        onChange={(e) => setSelectedStatus(e.target.value === 'all' ? '' : e.target.value)}
                        size="small"
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => `${option.name} (${option.deviceId})`}
                        value={customers.find(c => c._id === selectedCustomerId) || null}
                        onChange={(_, newValue) => setSelectedCustomerId(newValue?._id || '')}
                        renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
                    <TextField
                        select
                        fullWidth
                        label="Department"
                        value={selectedDepartment || 'All Departments'}
                        onChange={(e) => setSelectedDepartment(e.target.value === 'All Departments' ? '' : e.target.value)}
                        size="small"
                    >
                        <MenuItem value="All Departments">All Departments</MenuItem>
                        <MenuItem value="Visitor">Visitor (Guests)</MenuItem>
                        {departments.map(dep => (
                            <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }} sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setQuickRange('today')}
                        size="small"
                        sx={{ display: showQuickRanges ? 'none' : 'block' }} // Hide if quick ranges shown above
                    >
                        Today
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onClear}
                        size="small"
                    >
                        Reset
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OrderFilters;
