"use client";

import { API_BASE_URL } from "@/lib/config";
import { createContext, useContext, useState, useEffect } from "react";

type User = {
    id: number;
    email: string;
    username: string;
    role: string;
    token: string;
} | null;

interface AuthContextType {
    user: User;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);

    async function loadProfile(token: string) {
        try {
            const res = await authFetch(API_BASE_URL + "/api/auth/profile");

            if (!res.ok) throw new Error("Unauthorized");

            const profile = await res.json();

            setUser({
                ...profile,
                token,
            });
        } catch {
            localStorage.removeItem("access_token");
            setUser(null);
        }
    }

    // Restore login state from localStorage (runs once)
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token)
            return;

        loadProfile(token);
    }, []);

    async function login(token: string) {
        localStorage.setItem("access_token", token);
        await loadProfile(token);
    }

    function logout() {
        localStorage.removeItem("access_token");
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export async function authFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
) {
    const token = localStorage.getItem("access_token");

    const headers = new Headers(init.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(input, {
        ...init,
        headers,
    });

    if (res.status === 401) {
        // localStorage.removeItem("access_token");
        window.location.href = "/auth/login";
    }

    return res;
}
