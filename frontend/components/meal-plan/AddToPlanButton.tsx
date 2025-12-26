"use client";

import { useState } from "react";
import { Button, Modal, Select, Stack, Group, Text, useMantineTheme, ActionIcon, Tooltip } from "@mantine/core";
import { IconCalendarPlus, IconPlus } from "@tabler/icons-react"; // Match your table icon library
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

interface AddToPlanButtonProps {
    recipeId: number;
    recipeTitle?: string;
    variant?: "button" | "icon"; // Add this prop
}

export function AddToPlanButton({ recipeId, recipeTitle, variant = "button" }: AddToPlanButtonProps) {
    const theme = useMantineTheme();
    const [opened, setOpened] = useState(false);
    const [loading, setLoading] = useState(false);

    const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
    const [planType, setPlanType] = useState<string>("breakfast");

    const handleAddToPlan = async (e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent row click events
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/planning/meals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_date: planDate,
                    meal_type: planType,
                    recipe_id: recipeId,
                }),
            });

            if (res.ok) {
                setOpened(false);
                alert(`Added to meal plan!`);
            }
        } catch (err) {
            alert("Error adding to plan");
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            {variant === "button" ? (
                <Button
                    leftSection={<IconPlus size={20} />}
                    style={{ backgroundColor: '#896c6c' }}
                    onClick={() => setOpened(true)}
                    className="hover:opacity-90 transition-opacity shadow-md text-white border-none h-[42px]"
                >
                    Add to meal plan
                </Button>
            ) : (
                <ActionIcon
                    style={{ backgroundColor: theme.other.accentColor }}
                    onClick={(e) => { e.stopPropagation(); setOpened(true); }}
                    loading={loading}
                >
                    <IconCalendarPlus size={18} />
                </ActionIcon>
            )}

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={`Schedule: ${recipeTitle || 'Recipe'}`}
                centered
                radius="md"
            >
                <Stack>
                    <div className="space-y-1">
                        <Text size="sm" fw={500}>Date</Text>
                        <input
                            type="date"
                            value={planDate}
                            onChange={(e) => setPlanDate(e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm"
                        />
                    </div>
                    <Select
                        label="Meal Type"
                        data={['breakfast', 'lunch', 'snack', 'dinner']}
                        value={planType}
                        onChange={(v) => setPlanType(v || 'breakfast')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
                        <Button
                            style={{ backgroundColor: theme.other.accentColor }}
                            onClick={() => handleAddToPlan()}
                        >
                            Confirm
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
