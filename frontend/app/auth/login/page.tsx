"use client"

import { useAuth } from "@/app/providers/AuthProvider";
import { Button, Divider, Input, Switch, TextInput, useMantineTheme } from "@mantine/core";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const theme = useMantineTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "true",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            alert("Invalid credentials");
            return;
        }

        const data = await res.json();

        const token = data.access_token;
        console.log(token);
        login(token);

        // redirect to dashboard or home
        redirect("/", RedirectType.replace);
    }

    return (
        <div className="flex flex-col w-full items-center justify-center">
            <form className="w-md" onSubmit={handleSubmit}>
                <h2 className="text-4xl text-center">
                    Login
                </h2>
                <Divider my="xl" color="dark" />
                <div className="flex flex-col gap-8 w-full">
                    <TextInput size="lg" radius="lg" label="E-Mail" type="email" placeholder="Input component" styles={
                        {
                            label: {
                                fontSize: 24,
                            }
                        }
                    }
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextInput size="lg" radius="lg" label="Password" type="password" placeholder="Input component" styles={
                        {
                            label: {
                                fontSize: 24,
                            }
                        }
                    }
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        fullWidth
                        radius="lg"
                        type='submit'
                        style={{ backgroundColor: theme.other.primaryDark }}
                        className='text-2xl h-4' fz="h3" size='xl'>Login</Button>
                    <Link className="text-center" href="/auth/signup">Don’t have an account? Sign up</Link>
                </div>
            </form>
        </div>
    )
}
