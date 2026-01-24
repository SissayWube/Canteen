import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
                    <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                        <Typography variant="h4" color="error" gutterBottom>
                            Oops! Something went wrong.
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            The application encountered an unexpected error.
                        </Typography>
                        {this.state.error && (
                            <Box component="pre" sx={{ textAlign: 'left', bgcolor: '#eee', p: 2, borderRadius: 1, overflowX: 'auto', fontSize: '0.8rem', mb: 2 }}>
                                {this.state.error.message}
                            </Box>
                        )}
                        <Button variant="contained" color="primary" onClick={this.handleReload}>
                            Reload Application
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
