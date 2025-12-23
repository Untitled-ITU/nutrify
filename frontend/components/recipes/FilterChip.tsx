import { IconX } from "@tabler/icons-react";

export function FilterChip({
    label,
    onRemove,
    icon,
}: {
    label: string;
    onRemove: () => void;
    icon: any;
}) {
    return (
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 transition">
            {icon}
            <span>{label}</span>
            <button onClick={onRemove} className="opacity-60 hover:opacity-100">
                <IconX size={14} />
            </button>
        </div>
    );
}
