"use client";

import { createContext, useContext, useState, useEffect } from "react";

type User = {
    token: string;
} | null;

interface AuthContextType {
    user: User;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);

    // Restore login state from localStorage (runs once)
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            setUser({ token });
        }
    }, []);

    function login(token: string) {
        localStorage.setItem("access_token", token);
        setUser({ token }); // 👈 TRIGGERS RE-RENDER
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
