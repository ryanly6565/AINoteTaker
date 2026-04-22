"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {useAuth} from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        // Check if user is authenticated
        if (!user.isLoggedIn) {
            router.push('/login');
        }
    }, [router]);

    // Show loading or nothing while checking authentication
    if (!user.isLoggedIn) {
        return null;
    }

    return children;
}