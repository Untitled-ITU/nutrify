"use client";

import { useMemo } from "react";
import {
    Select,
    NumberInput,
    ActionIcon,
    Group,
    Stack,
    Button,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import ingredientsJson from "@/ingredients.json";

export type IngredientRow = {
    ingredient_id?: number;
    name: string | null;
    quantity: number | null;
    unit: string | null;
};

type Props = {
    value: IngredientRow[];
    onChange: (value: IngredientRow[]) => void;
};

const INGREDIENT_UNITS = ingredientsJson as Record<string, string[]>;

export function IngredientEditor({ value, onChange }: Props) {
    const ingredientOptions = useMemo(
        () => Object.keys(INGREDIENT_UNITS).sort(),
        []
    );

    function updateRow(index: number, patch: Partial<IngredientRow>) {
        const next = [...value];
        next[index] = { ...next[index], ...patch };

        // reset unit ONLY when ingredient changes
        if (patch.name !== undefined) {
            next[index].unit = null;
        }

        onChange(next);
    }

    function addRow() {
        onChange([
            ...value,
            { name: null, quantity: null, unit: null },
        ]);
    }

    function removeRow(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    return (
        <Stack gap="xs">
            {value.map((row, index) => {
                const unitOptions =
                    row.name && INGREDIENT_UNITS[row.name]
                        ? INGREDIENT_UNITS[row.name]
                        : [];

                return (
                    <Group key={index} align="end">
                        <Select
                            searchable
                            placeholder="Ingredient"
                            data={ingredientOptions}
                            value={row.name}
                            onChange={(name) =>
                                updateRow(index, { name: name || null })
                            }
                            flex={2}
                        />

                        <NumberInput
                            placeholder="Qty"
                            min={0}
                            value={row.quantity ?? ""}
                            onChange={(value) =>
                                updateRow(index, {
                                    quantity:
                                        typeof value === "number"
                                            ? value
                                            : null,
                                })
                            }
                            flex={1}
                        />

                        <Select
                            placeholder="Unit"
                            data={unitOptions}
                            value={row.unit}
                            onChange={(unit) =>
                                updateRow(index, { unit: unit || null })
                            }
                            disabled={!row.name}
                            flex={1}
                        />

                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeRow(index)}
                        >
                            <IconTrash size={18} />
                        </ActionIcon>
                    </Group>
                );
            })}

            <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={addRow}
            >
                Add ingredient
            </Button>
        </Stack>
    );
}
