"use client";

import { useState } from "react";
import { Button, Divider, Switch, TextInput, useMantineTheme } from "@mantine/core";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function SignupPage() {
    const theme = useMantineTheme();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChef, setIsChef] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const role = isChef ? "chef" : "consumer";

        const res = await fetch(API_BASE_URL + "/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
                username: email.split("@")[0], // or add a username input
                role,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.msg || "Registration failed");
            return;
        }

        // registration success → go to verification page
        redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
    }

    return (
        <div className="flex flex-col w-full items-center justify-center">
            <form className="w-md" onSubmit={handleSubmit}>
                <h2 className="text-4xl text-center">Sign Up</h2>

                <Divider my="xl" color="dark" />

                <div className="flex flex-col gap-8 w-full">
                    <TextInput
                        size="lg"
                        radius="lg"
                        label="E-Mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        styles={{ label: { fontSize: 24 } }}
                    />

                    <TextInput
                        size="lg"
                        radius="lg"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        styles={{ label: { fontSize: 24 } }}
                    />

                    <TextInput
                        size="lg"
                        radius="lg"
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        styles={{ label: { fontSize: 24 } }}
                    />

                    <div className="w-full">
                        <div className="text-2xl font-medium mb-3">User Type</div>

                        <div className="flex flex-row w-full items-center justify-center gap-8">
                            <div className="w-24 text-right">Consumer</div>

                            <Switch
                                size="xl"
                                checked={isChef}
                                onChange={(e) => setIsChef(e.currentTarget.checked)}
                            />

                            <div className="w-24 text-left">Chef</div>
                        </div>
                    </div>

                    <Button
                        fullWidth
                        radius="lg"
                        type="submit"
                        style={{ backgroundColor: theme.other.primaryDark }}
                        className="text-2xl h-4"
                        fz="h3"
                        size="xl"
                    >
                        Create Account
                    </Button>

                    <Link className="text-center" href="/auth/login">
                        Already have an account? Log in
                    </Link>
                </div>
            </form>
        </div>
    );
}
