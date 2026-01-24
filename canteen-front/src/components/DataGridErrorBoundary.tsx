import React, { Component, ReactNode } from 'react';
import { Alert, AlertTitle, Box, Button, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * DataGrid-specific error boundary with user-friendly fallback UI
 * Wraps DataGrid components to prevent entire page crashes on grid errors
 */
class DataGridErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('DataGrid Error:', error);
            console.error('Error Info:', errorInfo);
        }

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // In production, you might want to log to an error tracking service
        // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <Paper
                    sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'error.main',
                        backgroundColor: 'error.light',
                        opacity: 0.9,
                    }}
                >
                    <Alert
                        severity="error"
                        icon={<ErrorOutlineIcon fontSize="large" />}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={this.handleReset}
                            >
                                Retry
                            </Button>
                        }
                    >
                        <AlertTitle>Failed to Load Data Table</AlertTitle>
                        <Box sx={{ mt: 1 }}>
                            {this.state.error && (
                                <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                    {this.state.error.message}
                                </Box>
                            )}
                        </Box>
                        {import.meta.env.DEV && this.state.errorInfo && (
                            <Box sx={{ mt: 2, fontSize: '0.75rem', opacity: 0.8 }}>
                                <details>
                                    <summary style={{ cursor: 'pointer' }}>Stack Trace (Dev Only)</summary>
                                    <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            </Box>
                        )}
                    </Alert>
                </Paper>
            );
        }

        return this.props.children;
    }
}

export default DataGridErrorBoundary;
