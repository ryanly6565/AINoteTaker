'use client'

import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import { useRouter } from 'next/navigation';

type UserData = {
    userId?: number;
    username?: string;
    isLoggedIn: boolean;
}

export interface AuthContext {
    user: UserData
    login: (identifier: string, password?: string) => Promise<string>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData>({ isLoggedIn: false });
    const router = useRouter();

    const fetchStatus = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/status");
            if (!response.ok) {
                return;
            }

            // Decode user data
            const data = await response.json();
            setUser(data);
            if (data.isLoggedIn) {
                await router.push("/");
            } else {
                await router.push("/login");
            }
        } catch (e) {
            console.error(e);
            return "Something went wrong"
        }
    }

    // On first load, check if user has valid session
    useEffect(() => {
        fetchStatus();
    }, []);

    const login = async (identifier?: string, password?: string): Promise<string> => {
        // Verify all fields provided
        if (!identifier) {
            return "Please enter your username or email.."
        } else if (!password) {
            return "Please enter your password"
        }

        try {
            const response = await fetch("/api/auth/login", {
                method: "post",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: identifier,
                    password: password
                })
            });

            // If error, display error message
            if (!response.ok) {
                const data = await response.json();
                const message = data.message;
                return message;
            }

            // Login success, set userData and redirect to index page
            const data: UserData = await response.json();
            setUser(data);
            await router.push("/");

        } catch (e) {
            console.error(e);
            return "Unable to login"
        }
        return ""
    }

    const logout = async () => {
        try {
            const response = await fetch("/api/auth/logout");
            setUser({ isLoggedIn: false });
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}