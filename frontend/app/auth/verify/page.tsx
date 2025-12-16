"use client";

import { redirect, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, Text, TextInput, Button, Title, Divider, useMantineTheme } from "@mantine/core";

import { Suspense } from "react";
import { API_BASE_URL } from "@/lib/config";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyPage />
        </Suspense>
    );
}

function VerifyPage() {
    const theme = useMantineTheme();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [code, setCode] = useState("");

    async function handleVerify(e: any) {
        e.preventDefault();

        const res = await fetch(API_BASE_URL + "/api/auth/verify-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.msg);
            return;
        }

        alert("Verification successful!");
        redirect("/user/profile");
    }

    return (
        <div className="flex w-full h-full items-center justify-center">
            <Card shadow="xl" padding="xl" radius="lg" className="w-[420px]">
                <form onSubmit={handleVerify}>
                    <Title order={2} ta="center" mb="md">
                        Verify Your Email
                    </Title>

                    <Text ta="center" c="dimmed" mb="sm">
                        A verification code was sent to:
                    </Text>

                    <Text ta="center" fw={600} mb="md">
                        {email}
                    </Text>

                    <Divider my="lg" />

                    <TextInput
                        label="Verification Code"
                        placeholder="Enter 6-digit code"
                        size="lg"
                        radius="lg"
                        value={code}
                        required
                        onChange={(e) => setCode(e.target.value)}
                        styles={{
                            label: { fontSize: 18 }
                        }}
                    />

                    <Button
                        fullWidth
                        mt="xl"
                        size="lg"
                        radius="lg"
                        type="submit"
                        style={{ backgroundColor: theme.other.primaryDark }}
                    >
                        Verify Account
                    </Button>
                </form>
            </Card>
        </div>
    );
}
