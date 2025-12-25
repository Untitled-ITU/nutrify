import { IconX } from "@tabler/icons-react";

export function FilterChip({
    label,
    onRemove,
    icon,
    color,
}: {
    label: string;
    onRemove: () => void;
    icon: React.ReactNode;
    color?: string;
}) {
    const isRed = color === "red";
    return (
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${isRed
            ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}>
            {icon}
            <span>{label}</span>
            <button onClick={onRemove} className="opacity-60 hover:opacity-100">
                <IconX size={14} />
            </button>
        </div>
    );
}
