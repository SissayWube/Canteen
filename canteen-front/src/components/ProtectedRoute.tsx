import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
    const auth = useContext(AuthContext);

    if (auth?.loading) {
        return <div>Loading...</div>; // Spinner later
    }

    return auth?.user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;