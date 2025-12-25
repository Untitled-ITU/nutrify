"use client";

import { redirect, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, Text, TextInput, Button, Title, Divider, useMantineTheme, Group, SimpleGrid, PasswordInput } from "@mantine/core";

import { Suspense } from "react";
import { API_BASE_URL } from "@/lib/config";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { forgotPassword, resetPassword } from "@/lib/chef";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordPage />
        </Suspense>
    );
}

function ResetPasswordPage() {
    const theme = useMantineTheme();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [resetBusy, setResetBusy] = useState(false);
    const [sendCodeBusy, setSendCodeBusy] = useState(false);

    const resetForm = useForm({
        initialValues: {
            code: "",
            new_password: "",
            confirm_password: "",
        },
        validate: {
            code: (v) => (v.trim().length !== 6 ? "Code must be exactly 6 characters" : null),
            new_password: (v) => (v.trim().length < 6 ? "Password must be at least 6 characters" : null),
            confirm_password: (v, values) => (v !== values.new_password ? "Passwords do not match" : null),
        },
    });

    async function onResetPassword() {
        if (!email) return;
        const valid = resetForm.validate();
        if (valid.hasErrors) return;

        try {
            const res = await resetPassword({
                email: email,
                code: resetForm.values.code.trim(),
                new_password: resetForm.values.new_password,
            });

            notifications.show({
                title: "Password updated",
                message: res.msg ?? "Your password was updated successfully.",
                color: "green",
                icon: <IconCheck size={18} />,
            });

            resetForm.reset();
        } catch {
            notifications.show({
                title: "Reset failed",
                message: "Could not reset password. Check your code and try again.",
                color: "red",
                icon: <IconX size={18} />,
            });
        }
    }
    async function onSendResetCode() {
        if (!email) return;
        try {
            setSendCodeBusy(true);
            const res = await forgotPassword({ email: email });
            notifications.show({
                title: "Reset code sent",
                message: res.msg ?? "Check your email for the 6-digit code.",
                color: "green",
                icon: <IconCheck size={18} />,
            });
        } catch {
            notifications.show({
                title: "Failed to send code",
                message: "Could not send reset code. Please try again.",
                color: "red",
                icon: <IconX size={18} />,
            });
        } finally {
            setSendCodeBusy(false);
        }
    }

    return (
        <div className="flex w-full h-full items-center justify-center">
            <Card withBorder radius="md" shadow="md" p="lg">
                <Group justify="space-between" align="center" wrap="wrap">
                    <div>
                        <Title order={4}>Reset Password</Title>
                        <Text c="dimmed" size="sm" mt={4}>
                            Send a reset code to your email, then enter it below.
                        </Text>
                    </div>

                    <Button
                        loading={sendCodeBusy}
                        onClick={onSendResetCode}
                        variant="outline"
                        color={theme.other.accentColor}
                    >
                        Send Reset Code
                    </Button>
                </Group>

                <TextInput mt="md" type="email" label="Email" onChange={(e) => setEmail(e.target.value)} />

                <TextInput
                    mt="md"
                    label="6-digit code"
                    placeholder="123456"
                    maxLength={6}
                    {...resetForm.getInputProps("code")}
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
                    <PasswordInput
                        label="New password"
                        placeholder="New password"
                        {...resetForm.getInputProps("new_password")}
                    />
                    <PasswordInput
                        label="Confirm password"
                        placeholder="Confirm password"
                        {...resetForm.getInputProps("confirm_password")}
                    />
                </SimpleGrid>

                <Group justify="flex-end" mt="md">
                    <Button loading={resetBusy} onClick={onResetPassword} color={theme.other.accentColor}>
                        Reset Password
                    </Button>
                </Group>
            </Card>
        </div>
    );
}
