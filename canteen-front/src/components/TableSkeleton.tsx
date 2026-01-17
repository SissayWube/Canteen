import React from 'react';
import { Box, Skeleton, Paper } from '@mui/material';

interface TableSkeletonProps {
    rows?: number;
    height?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, height = 52 }) => {
    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            {/* Header Skeleton */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Skeleton variant="rectangular" width={100} height={32} />
                <Skeleton variant="rectangular" width={150} height={32} />
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton variant="rectangular" width={120} height={32} />
            </Box>

            {/* Rows Skeleton */}
            <Box sx={{ p: 0 }}>
                {Array.from(new Array(rows)).map((_, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderBottom: index < rows - 1 ? '1px solid #f0f0f0' : 'none',
                            height: height
                        }}
                    >
                        <Skeleton variant="text" width="15%" sx={{ mr: 2 }} />
                        <Skeleton variant="text" width="20%" sx={{ mr: 2 }} />
                        <Skeleton variant="text" width="15%" sx={{ mr: 2 }} />
                        <Skeleton variant="text" width="10%" sx={{ mr: 2 }} />
                        <Skeleton variant="text" width="20%" sx={{ flexGrow: 1 }} />
                    </Box>
                ))}
            </Box>

            {/* Footer/Pagination Skeleton */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e0e0e0' }}>
                <Skeleton variant="text" width={200} height={24} />
            </Box>
        </Paper>
    );
};

export default TableSkeleton;
