import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Automatically go back. If there's no history, fallback to dashboard.
        navigate(-1);

        // Safety fallback: if the navigation didn't change the page after a short delay
        // (e.g., if there was no history), go to the dashboard.
        const timeout = setTimeout(() => {
            navigate('/', { replace: true });
        }, 100);

        return () => clearTimeout(timeout);
    }, [navigate]);

    return null; // Don't show anything
};

export default NotFound;
