import { IconX } from "@tabler/icons-react";

export function FilterChip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-3 bg-[#E7C6BC] px-2 py-1 rounded-md whitespace-nowrap">
            {label}
            <button onClick={onRemove}>
                <IconX size={18} />
            </button>
        </div>
    );
}
