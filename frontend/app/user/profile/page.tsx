"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@mantine/core";
import { redirect, RedirectType, useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    // If not logged in → redirect to login
    if (!user) {

        redirect("/auth/login", RedirectType.replace);
    }

    return (
        <div className="flex flex-col items-center mt-20 gap-6">
            <h2 className="text-4xl font-bold">Profile Placeholder</h2>
        </div>
    );
}
 