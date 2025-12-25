"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Added for navigation
import { Button, Modal, Select, Loader, Stack, Text, ActionIcon, Group, useMantineTheme } from "@mantine/core";
import {
    Pencil,
    X,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Plus,
    ExternalLink,
    Trash, // Added icon
} from "lucide-react";

import {
    DndContext,
    PointerSensor,
    useDroppable,
    useDraggable,
    useSensors,
    useSensor,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Auth Imports
import { API_BASE_URL } from "@/lib/config";
import { authFetch, useAuth } from "@/app/providers/AuthProvider";

/** ---------- Types & Constants ---------- */
const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"] as const;
const ROW_HEIGHT = 130; 

type Recipe = { id: number; title: string; };

type Meal = {
    id: string;
    date: string;
    recipeName: string;
    recipeId: number;
    mealType: typeof MEAL_TYPES[number];
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** ---------- Helpers ---------- */
function startOfWeekMonday(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = x.getDay();
    const diff = (day + 6) % 7; 
    x.setDate(x.getDate() - diff);
    return x;
}

function toISODateLocal(d: Date) {
    return d.toISOString().split('T')[0];
}

const fmtMonthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/** --- Visual Card Component --- */
function MealCardContent({ meal, isOverlay, onEdit, onDelete, onView }: {
    meal: Meal; 
    isOverlay?: boolean;
    onEdit?: (meal: Meal) => void; 
    onDelete?: (id: string) => void;
    onView?: (recipeId: number) => void; // Added onView prop
}) {
    return (
        <div
            className={`
                h-full w-full rounded-xl p-4 bg-white border border-black/5 shadow-sm group flex flex-col justify-between
                ${isOverlay ? 'shadow-2xl border-[#896c6c]/30' : ''}
            `}
        >
            <div className="flex justify-between items-start">
                <span className="text-[8px] font-black text-[#896c6c] uppercase tracking-widest opacity-80">
                    {meal.mealType}
                </span>
                {!isOverlay && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* New View Details Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onView?.(meal.recipeId); }} 
                            className="p-1 hover:bg-black/5 rounded text-blue-500"
                            title="View Recipe"
                        >
                            <ExternalLink size={14} />
                        </button>
                        
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(meal); }} className="p-1 hover:bg-black/5 rounded text-gray-400">
                            <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(meal.id); }} className="p-1 hover:bg-red-50 rounded text-red-400">
                            <Trash size={14} />
                        </button>
                    </div>
                )}
            </div>
            <Text className="text-sm font-bold text-gray-800 leading-snug line-clamp-3">
                {meal.recipeName}
            </Text>
        </div>
    );
}

/** --- Draggable Wrapper --- */
function DraggableMeal({ meal, onEdit, onDelete, onView }: {
    meal: Meal; onEdit: (meal: Meal) => void; onDelete: (id: string) => void; onView: (id: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: meal.id,
        data: { type: "meal", meal },
    });

    const typeIndex = MEAL_TYPES.indexOf(meal.mealType);

    const style = {
        transform: CSS.Translate.toString(transform),
        top: typeIndex * ROW_HEIGHT + 10,
        height: ROW_HEIGHT - 20,
        zIndex: isDragging ? 100 : 10,
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            className="absolute left-2 right-2 cursor-grab active:cursor-grabbing"
        >
            <MealCardContent meal={meal} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        </div>
    );
}

/** --- Droppable Column --- */
function DateColumn({ dateId, meals, setDayRef, onEdit, onDelete, onView, previewType, totalHeight }: {
    dateId: string; meals: Meal[]; setDayRef: (id: string, el: HTMLDivElement | null) => void; onEdit: (meal: Meal) => void; onDelete: (id: string) => void; onView: (id: number) => void; previewType: string | null; totalHeight: number;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: dateId });

    return (
        <div
            ref={(el) => { setNodeRef(el); setDayRef(dateId, el); }}
            style={{ height: totalHeight }}
            className={`relative transition-colors duration-200 ${isOver ? 'bg-white/10' : 'bg-transparent'}
            [background-image:linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:100%_${ROW_HEIGHT}px] border-r border-black/5 last:border-r-0`}
        >
            {previewType && (
                <div
                    className="absolute left-2 right-2 bg-[#896c6c]/20 border-2 border-dashed border-[#896c6c] rounded-xl z-0"
                    style={{ top: MEAL_TYPES.indexOf(previewType as any) * ROW_HEIGHT + 10, height: ROW_HEIGHT - 20 }}
                />
            )}
            {meals.map((meal) => (
                <DraggableMeal key={meal.id} meal={meal} onEdit={onEdit} onDelete={onDelete} onView={onView} />
            ))}
        </div>
    );
}

export default function MealPlanPage() {
    const theme = useMantineTheme();
    const { user } = useAuth();
    const router = useRouter(); // Initialize router
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState<Date>(startOfWeekMonday(new Date()));
    const [meals, setMeals] = useState<Meal[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [toast, setToast] = useState<string | null>(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editMeal, setEditMeal] = useState<Meal | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeDragMeal, setActiveDragMeal] = useState<Meal | null>(null);

    const [formRecipeId, setFormRecipeId] = useState<string | null>(null);
    const [formDate, setFormDate] = useState("");
    const [formType, setFormType] = useState<string>("breakfast");

    const totalHeight = ROW_HEIGHT * MEAL_TYPES.length;

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    }), [weekStart]);

    const weekIds = useMemo(() => weekDates.map(toISODateLocal), [weekDates]);
    const recipeSelectData = useMemo(() => recipes.map(r => ({ value: r.id.toString(), label: r.title })), [recipes]);

    const fetchRecipes = useCallback(async () => {
        try {
            const res = await authFetch(`${API_BASE_URL}/api/recipes`);
            const data = await res.json();
            setRecipes(data.recipes || []);
        } catch (err) { console.error(err); }
    }, []);

    const fetchWeek = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/planning/weekly?start_date=${toISODateLocal(weekStart)}`);
            const data = await res.json();
            const flattened: Meal[] = [];
            data.days.forEach((day: any) => {
                Object.entries(day.meals).forEach(([type, meal]: [string, any]) => {
                    if (meal?.recipe) {
                        flattened.push({
                            id: meal.id.toString(),
                            date: day.date,
                            recipeName: meal.recipe.title,
                            recipeId: meal.recipe.id,
                            mealType: type as any,
                        });
                    }
                });
            });
            setMeals(flattened);
        } catch (err) { showToast("Error loading schedule"); } finally { setLoading(false); }
    }, [weekStart, user]);

    useEffect(() => {
        setMounted(true);
        fetchWeek();
        fetchRecipes();
    }, [fetchWeek, fetchRecipes]);

    async function handleAddMeal() {
        if (!formRecipeId) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/planning/meals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan_date: formDate, meal_type: formType, recipe_id: parseInt(formRecipeId) }),
            });
            if (res.ok) { showToast("Meal added!"); setAddOpen(false); fetchWeek(); }
        } catch (err) { showToast("Failed to add meal"); }
    }

    async function handleUpdateMeal(mealId: string, newDate: string, newType: string, recipeId?: number) {
        try {
            const res = await authFetch(`${API_BASE_URL}/api/planning/meals/${mealId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan_date: newDate, meal_type: newType, recipe_id: recipeId }),
            });
            if (res.ok) { fetchWeek(); setEditMeal(null); showToast("Plan updated"); }
        } catch (err) { showToast("Move failed"); }
    }

    async function handleDeleteMeal() {
        if (!deleteId) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/planning/meals/${deleteId}`, { method: "DELETE" });
            if (res.ok) { setDeleteId(null); fetchWeek(); showToast("Meal removed"); }
        } catch (err) { showToast("Delete failed"); }
    }

    async function handleClearWeek() {
        if (!confirm("Clear this entire week?")) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/planning/clear-week?start_date=${toISODateLocal(weekStart)}`, { method: "DELETE" });
            if (res.ok) { fetchWeek(); showToast("Week cleared"); }
        } catch (err) { showToast("Error clearing week"); }
    }

    const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
    const [preview, setPreview] = useState<{ dateId: string; type: string } | null>(null);

    return (
        <div className="w-full px-4">
            {toast && (
                <div className="fixed top-5 right-5 z-[9999] bg-[#896c6c] text-white px-5 py-2 rounded-xl shadow-xl font-bold">
                    {toast}
                </div>
            )}

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Weekly Menu</h1>
                    <p className="text-gray-500 mt-1">Organize your kitchen by meal type.</p>
                </div>
                <div className="flex gap-3 mt-4">
                    <Button variant="subtle" color="red" leftSection={<Trash2 size={16} />} onClick={handleClearWeek}>
                        Clear Week
                    </Button>
                    <button
                        onClick={() => { setFormRecipeId(null); setFormDate(weekIds[0]); setAddOpen(true); }}
                        className="bg-[#896c6c] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
                    >
                        <Plus size={18}/> Add Meal
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex bg-white/50 backdrop-blur p-1 rounded-xl border border-black/5 shadow-sm">
                    <button onClick={() => setWeekStart(d => { const ns = new Date(d); ns.setDate(ns.getDate() - 7); return ns; })} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={() => setWeekStart(startOfWeekMonday(new Date()))} className="px-4 font-black text-xs uppercase tracking-widest">Today</button>
                    <button onClick={() => setWeekStart(d => { const ns = new Date(d); ns.setDate(ns.getDate() + 7); return ns; })} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronRight size={20} /></button>
                </div>
                <div className="font-bold text-gray-700 bg-white/80 px-4 py-2 rounded-xl border border-black/5 shadow-sm text-sm">
                    {mounted && `${toISODateLocal(weekDates[0])} — ${toISODateLocal(weekDates[6])}`}
                </div>
                {loading && <Loader size="xs" color="#896c6c" />}
            </div>

            <div className="relative rounded-[2rem] bg-[#ddb1a8] border border-[#d2a69e] shadow-2xl overflow-hidden">
                <div className="bg-[#ddb1a8]/60 backdrop-blur-xl h-20 border-b border-[#d2a69e] flex items-center">
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 w-full">
                        <div />
                        {weekDates.map((d, i) => (
                            <div key={i} className="text-center">
                                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[#3b2f2f] opacity-50 mb-1">{DAY_NAMES[i]}</div>
                                <div className="text-sm font-black text-gray-900 leading-none">{fmtMonthDay.format(d)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0">
                    <div className="flex flex-col bg-black/5">
                        {MEAL_TYPES.map((type) => (
                            <div key={type} style={{ height: ROW_HEIGHT }} className="flex items-center justify-end pr-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#3b2f2f] opacity-40">
                                    {type}
                                </span>
                            </div>
                        ))}
                    </div>

                    {mounted && (
                        <DndContext
                            sensors={sensors}
                            onDragStart={(e) => {
                                const meal = meals.find(m => m.id === e.active.id);
                                if (meal) setActiveDragMeal(meal);
                            }}
                            onDragMove={(e) => {
                                const overId = e.over?.id as string;
                                if (!overId || !dayRefs.current[overId]) return;
                                const rect = dayRefs.current[overId]!.getBoundingClientRect();
                                const y = (e.active.rect.current.translated?.top || 0) - rect.top;
                                const index = Math.min(MEAL_TYPES.length - 1, Math.max(0, Math.floor(y / ROW_HEIGHT)));
                                setPreview({ dateId: overId, type: MEAL_TYPES[index] });
                            }}
                            onDragEnd={(e) => {
                                if (e.over && preview) handleUpdateMeal(e.active.id as string, e.over.id as string, preview.type);
                                setPreview(null);
                                setActiveDragMeal(null);
                            }}
                            onDragCancel={() => {
                                setPreview(null);
                                setActiveDragMeal(null);
                            }}
                        >
                            {weekIds.map((dateId) => (
                                <DateColumn
                                    key={dateId}
                                    dateId={dateId}
                                    meals={meals.filter(m => m.date === dateId)}
                                    setDayRef={(id, el) => { dayRefs.current[id] = el; }}
                                    onEdit={(m) => { setEditMeal(m); setFormRecipeId(m.recipeId.toString()); setFormDate(m.date); setFormType(m.mealType); }}
                                    onDelete={(id) => setDeleteId(id)}
                                    onView={(recipeId) => router.push(`/recipes/details/${recipeId}`)} // Navigation logic
                                    previewType={preview?.dateId === dateId ? preview.type : null}
                                    totalHeight={totalHeight}
                                />
                            ))}

                            <DragOverlay dropAnimation={{
                                sideEffects: defaultDropAnimationSideEffects({
                                    styles: { active: { opacity: '0' } },
                                }),
                            }}>
                                {activeDragMeal ? (
                                    <div style={{ width: 180, height: ROW_HEIGHT - 20 }}>
                                        <MealCardContent meal={activeDragMeal} isOverlay />
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Modals remain the same */}
            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Schedule Meal" centered radius="md" padding="xl">
                <Stack>
                    <Select label="Choose Recipe" placeholder="Search recipes..." searchable data={recipeSelectData} value={formRecipeId} onChange={setFormRecipeId} />
                    <Group grow>
                        <Select label="Select Day" data={weekIds.map((id, i) => ({ value: id, label: DAY_NAMES[i] }))} value={formDate} onChange={(v) => setFormDate(v || "")} />
                        <Select label="Meal Type" data={MEAL_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))} value={formType} onChange={(v) => setFormType(v || "breakfast")} />
                    </Group>
                    <Button fullWidth size="md" className="bg-[#896c6c]" disabled={!formRecipeId} onClick={handleAddMeal}>Add to Plan</Button>
                </Stack>
            </Modal>

            <Modal opened={!!editMeal} onClose={() => setEditMeal(null)} title="Update Meal Plan" centered radius="md" padding="xl">
                <Stack>
                    <Select label="Change Recipe" searchable data={recipeSelectData} value={formRecipeId} onChange={setFormRecipeId} />
                    <Group grow>
                        <Select label="Move to Day" data={weekIds.map((id, i) => ({ value: id, label: DAY_NAMES[i] }))} value={formDate} onChange={(v) => setFormDate(v || "")} />
                        <Select label="Change Type" data={MEAL_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))} value={formType} onChange={(v) => setFormType(v || "breakfast")} />
                    </Group>
                    <Button fullWidth size="md" style={{ backgroundColor: theme.other.accentColor }} onClick={() => editMeal && handleUpdateMeal(editMeal.id, formDate, formType, parseInt(formRecipeId!))}>Save Changes</Button>
                    <Button variant="subtle" color="red" leftSection={<Trash2 size={16} />} onClick={() => { setDeleteId(editMeal?.id || null); setEditMeal(null); }}>Remove from Calendar</Button>
                </Stack>
            </Modal>

            <Modal opened={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Removal" centered radius="md">
                <Text size="sm" mb="xl">Are you sure you want to remove this entry from your weekly calendar?</Text>
                <Group grow>
                    <Button variant="default" onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button style={{ backgroundColor: theme.other.accentColor }} onClick={handleDeleteMeal}>Remove</Button>
                </Group>
            </Modal>
        </div>
    );
}
