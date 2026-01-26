import React from 'react';
import { Box, TextField, MenuItem, Button, ButtonGroup, Autocomplete, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CalendarToday, EventNote, DateRange } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { Customer } from '../../api/customers';
import { FoodItem } from '../../api/foodItems';

export interface AnalysisFiltersProps {
    from: Dayjs | null;
    setFrom: (newValue: Dayjs | null) => void;
    to: Dayjs | null;
    setTo: (newValue: Dayjs | null) => void;
    customers: Customer[];
    selectedCustomer: Customer | null;
    setSelectedCustomer: (newValue: Customer | null) => void;
    departments: string[];
    selectedDepartment: string;
    setSelectedDepartment: (value: string) => void;
    foodItems: FoodItem[];
    selectedFoodItem: FoodItem | null;
    setSelectedFoodItem: (newValue: FoodItem | null) => void;
    selectedStatus: string;
    setSelectedStatus: (value: string) => void;
    onClearFilters: () => void;
}

const AnalysisFilters: React.FC<AnalysisFiltersProps> = ({
    from, setFrom,
    to, setTo,
    customers, selectedCustomer, setSelectedCustomer,
    departments, selectedDepartment, setSelectedDepartment,
    foodItems, selectedFoodItem, setSelectedFoodItem,
    selectedStatus, setSelectedStatus,
    onClearFilters
}) => {

    const setQuickRange = (range: 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth') => {
        switch (range) {
            case 'today':
                setFrom(dayjs());
                setTo(dayjs());
                break;
            case 'yesterday':
                setFrom(dayjs().subtract(1, 'day'));
                setTo(dayjs().subtract(1, 'day'));
                break;
            case 'last7days':
                setFrom(dayjs().subtract(6, 'days'));
                setTo(dayjs());
                break;
            case 'thisMonth':
                setFrom(dayjs().startOf('month'));
                setTo(dayjs().endOf('month'));
                break;
            case 'lastMonth':
                setFrom(dayjs().subtract(1, 'month').startOf('month'));
                setTo(dayjs().subtract(1, 'month').endOf('month'));
                break;
        }
    };

    return (
        <Box>
            {/* Quick Date Range Buttons */}
            <Box className="no-print" sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>Quick Ranges:</Typography>
                <ButtonGroup variant="outlined" size="small">
                    <Button startIcon={<CalendarToday />} onClick={() => setQuickRange('today')}>Today</Button>
                    <Button onClick={() => setQuickRange('yesterday')}>Yesterday</Button>
                    <Button startIcon={<EventNote />} onClick={() => setQuickRange('last7days')}>Last 7 Days</Button>
                    <Button startIcon={<DateRange />} onClick={() => setQuickRange('thisMonth')}>This Month</Button>
                    <Button onClick={() => setQuickRange('lastMonth')}>Last Month</Button>
                </ButtonGroup>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }} className="no-print">
                <Grid size={{ xs: 12, sm: 3 }}>
                    <DatePicker
                        label="From"
                        value={from}
                        onChange={(newValue) => setFrom(newValue)}
                        maxDate={to || undefined}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <DatePicker
                        label="To"
                        value={to}
                        onChange={(newValue) => setTo(newValue)}
                        minDate={from || undefined}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                        options={customers}
                        getOptionLabel={(option) => option.name}
                        value={selectedCustomer}
                        onChange={(_, newValue) => setSelectedCustomer(newValue)}
                        renderInput={(params) => <TextField {...params} label="Customer" fullWidth size="small" />}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Autocomplete
                        options={foodItems}
                        getOptionLabel={(option) => `${option.name} (${option.code})`}
                        value={selectedFoodItem}
                        onChange={(_, newValue) => setSelectedFoodItem(newValue)}
                        renderInput={(params) => <TextField {...params} label="Food Item" fullWidth size="small" />}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        select
                        label="Status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        select
                        label="Department"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="All Departments">All Departments</MenuItem>
                        <MenuItem value="Visitor">Visitor (Guests)</MenuItem>
                        {departments.map(dep => (
                            <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                        ))}
                    </TextField>

                </Grid>
                <Button
                    variant="outlined"
                    onClick={onClearFilters}
                    size="small"
                    sx={{ ml: 2 }}
                >
                    Clear Filters
                </Button>

            </Grid>
        </Box>
    );
};

export default AnalysisFilters;
