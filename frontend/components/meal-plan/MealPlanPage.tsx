"use client";

import styles from "./MealPlanPage.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Button, Modal, Select, TextInput } from "@mantine/core";
import { ExternalLink, Pencil, X, Maximize2, Minimize2 } from "lucide-react";

import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

type Meal = {
  id: string;
  day: Day;
  recipeName: string;
  startMinutes: number; // 0..1439
  durationMinutes: number;
};

const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const PX_PER_MIN = 1.4;
const SNAP_MINUTES = 30;
const DEFAULT_DURATION = 60;

const MAX_MEALS_PER_SLOT = 5;

const MOCK_RECIPES = [
  "Chicken Salad",
  "Omelette",
  "Pasta",
  "Steak Bowl",
  "Yogurt + Granola",
  "Soup",
  "Tuna Sandwich",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function minutesToTime(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}
function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return clamp(h * 60 + m, 0, 24 * 60 - 1);
}
function snapMinutes(m: number, duration: number) {
  const floored = Math.floor(m / SNAP_MINUTES) * SNAP_MINUTES;
  return clamp(floored, 0, 24 * 60 - duration);
}
function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m_${Math.random().toString(16).slice(2)}`;
}
function slotKey(minutes: number) {
  return Math.floor(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/** --- Draggable Meal Card --- */
function DraggableMeal({
  meal,
  topPx,
  heightPx,
  onEdit,
  onDelete,
  styleOverrides,
  disablePointerEvents,
  zIndex,
}: {
  meal: Meal;
  topPx: number;
  heightPx: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  styleOverrides?: React.CSSProperties;
  disablePointerEvents?: boolean;
  zIndex?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: meal.id,
    data: { type: "meal" },
  });

  const style: React.CSSProperties = {
    top: topPx,
    height: heightPx,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0 : 1,
    zIndex,
    pointerEvents: disablePointerEvents ? "none" : "auto",
    ...styleOverrides,
  };

  return (
    <div
      ref={setNodeRef}
      className={styles.mealCard}
      style={style}
      {...attributes}
      {...listeners}
      data-no-expand
    >
      <div className={styles.mealTop}>
        <div className={styles.mealLeft}>
          <div className={styles.mealName}>{meal.recipeName}</div>
          <div className={styles.mealTime}>{minutesToTime(meal.startMinutes)}</div>
        </div>

        <button
          className={styles.iconBtn}
          title="Open recipe"
          onClick={(e) => {
            e.stopPropagation();
            console.log("open recipe");
          }}
          data-no-expand
        >
          <ExternalLink size={16} />
        </button>
      </div>

      <div className={styles.mealActions}>
        <button
          className={styles.iconBtn}
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(meal.id);
          }}
          data-no-expand
        >
          <Pencil size={16} />
        </button>
        <button
          className={styles.iconBtn}
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(meal.id);
          }}
          data-no-expand
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** --- Droppable Day Column --- */
function DayColumn({
  day,
  meals,
  setDayRef,
  onEdit,
  onDelete,
  previewMinutes,
  dayHeightPx,
}: {
  day: Day;
  meals: Meal[];
  setDayRef: (day: Day, el: HTMLDivElement | null) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  previewMinutes: number | null;
  dayHeightPx: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day,
    data: { type: "day", day },
  });

  const combinedRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    setDayRef(day, el);
  };

  const [hoverStart, setHoverStart] = useState<number | null>(null);

  const startGroups = useMemo(() => {
    const map = new Map<number, Meal[]>();
    for (const m of meals) {
      const k = m.startMinutes; // exact-time stack
      const arr = map.get(k) ?? [];
      arr.push(m);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([start, items]) => ({ start, items }));
  }, [meals]);

  // ✅ IMPORTANT: if a stack becomes non-stack (e.g. you delete one),
  // clear the stale hover state so layout doesn't glitch.
  useEffect(() => {
    if (hoverStart == null) return;
    const g = startGroups.find((x) => x.start === hoverStart);
    if (!g || g.items.length <= 1) setHoverStart(null);
  }, [hoverStart, startGroups]);

  const GAP = 8;

  return (
    <div className={styles.dayCol}>
      <div
        ref={combinedRef}
        className={`${styles.dayBody} ${isOver ? styles.dayBodyOver : ""}`}
        style={{ height: dayHeightPx }}
        data-no-expand
      >
        {previewMinutes != null && (
          <div className={styles.dropLine} style={{ top: previewMinutes * PX_PER_MIN }} />
        )}

        {startGroups.map(({ start, items }) => {
          const baseTop = start * PX_PER_MIN;

          const slotPx = SNAP_MINUTES * PX_PER_MIN;
          const heights = items.map((m) => Math.max(slotPx, m.durationMinutes * PX_PER_MIN));
          const firstH = heights[0];
          const maxH = Math.max(...heights);

          if (items.length === 1) {
            const meal = items[0];
            return (
              <DraggableMeal
                key={meal.id}
                meal={meal}
                topPx={baseTop}
                heightPx={Math.max(slotPx, meal.durationMinutes * PX_PER_MIN)}
                onEdit={onEdit}
                onDelete={onDelete}
                zIndex={5}
              />
            );
          }

          const isHovered = hoverStart === start;

          const expandedHeight =
            heights.reduce((sum, h) => sum + h, 0) + (items.length - 1) * GAP;

          const wouldOverflowBottom = baseTop + expandedHeight > dayHeightPx - 8;
          const expandUp = isHovered && wouldOverflowBottom;

          const wrapperTop = expandUp ? baseTop - (expandedHeight - firstH) : baseTop;

          // ✅ COLLAPSED: only the top card is shown (no blur stacking)
          const wrapperHeight = isHovered ? expandedHeight : maxH;

          // offsets inside wrapper when expanded
          let offsets: number[] = [];
          if (isHovered && !expandUp) {
            let y = 0;
            offsets = heights.map((h) => {
              const out = y;
              y += h + GAP;
              return out;
            });
          } else if (isHovered && expandUp) {
            const anchorOffset = expandedHeight - firstH; // first card sits here
            offsets = heights.map((h, i) => {
              if (i === 0) return anchorOffset;
              const above =
                heights.slice(1, i + 1).reduce((s, hh) => s + hh, 0) + i * GAP;
              return anchorOffset - above;
            });
          }

          const topMeal = items[0];

          return (
            <div
              key={`stack-${day}-${start}`}
              className={styles.stackGroup}
              style={{
                top: wrapperTop,
                height: wrapperHeight,
                zIndex: isHovered ? 60 : 8,
              }}
              onMouseEnter={() => setHoverStart(start)}
              onMouseLeave={() => setHoverStart(null)}
              data-no-expand
            >
              {!isHovered && (
                <div className={styles.stackCount} title={`${items.length} meals`}>
                  +{items.length - 1}
                </div>
              )}

              {!isHovered ? (
                // ✅ only ONE card when collapsed
                <DraggableMeal
                  key={topMeal.id}
                  meal={topMeal}
                  topPx={0}
                  heightPx={heights[0]}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  zIndex={10}
                />
              ) : (
                // ✅ expanded: show all cards in a clean vertical list
                items.map((meal, i) => (
                  <DraggableMeal
                    key={meal.id}
                    meal={meal}
                    topPx={offsets[i]}
                    heightPx={heights[i]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    zIndex={70 + i}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MealPlanPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [meals, setMeals] = useState<Meal[]>([
    { id: "m1", day: "Monday", recipeName: "Recipe Name", startMinutes: 9 * 60, durationMinutes: DEFAULT_DURATION },
    { id: "m2", day: "Tuesday", recipeName: "Recipe Name", startMinutes: 8 * 60, durationMinutes: DEFAULT_DURATION },
    { id: "m3", day: "Tuesday", recipeName: "Recipe Name", startMinutes: 13 * 60 + 30, durationMinutes: DEFAULT_DURATION },
    { id: "m4", day: "Thursday", recipeName: "Recipe Name", startMinutes: 10 * 60, durationMinutes: DEFAULT_DURATION },
    { id: "m5", day: "Friday", recipeName: "Recipe Name", startMinutes: 11 * 60, durationMinutes: DEFAULT_DURATION },
    { id: "m6", day: "Saturday", recipeName: "Recipe Name", startMinutes: 10 * 60, durationMinutes: DEFAULT_DURATION },
    { id: "m7", day: "Sunday", recipeName: "Recipe Name", startMinutes: 10 * 60, durationMinutes: DEFAULT_DURATION },
  ]);

  const mealsByDay = useMemo(() => {
    const map: Record<Day, Meal[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };
    for (const m of meals) map[m.day].push(m);
    for (const d of DAYS) map[d].sort((a, b) => a.startMinutes - b.startMinutes);
    return map;
  }, [meals]);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const showToast = (msg: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  };

  const countMealsInSlot = (day: Day, startMin: number, ignoreId?: string) => {
    const k = slotKey(startMin);
    let c = 0;
    for (const m of meals) {
      if (m.day !== day) continue;
      if (ignoreId && m.id === ignoreId) continue;
      if (slotKey(m.startMinutes) === k) c++;
    }
    return c;
  };
  const canPlaceInSlot = (day: Day, startMin: number, ignoreId?: string) =>
    countMealsInSlot(day, startMin, ignoreId) < MAX_MEALS_PER_SLOT;

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const headerScrollRef = useRef<HTMLDivElement | null>(null);

  const dayRefs = useRef<Record<Day, HTMLDivElement | null>>({
    Monday: null,
    Tuesday: null,
    Wednesday: null,
    Thursday: null,
    Friday: null,
    Saturday: null,
    Sunday: null,
  });

  const setDayRef = (day: Day, el: HTMLDivElement | null) => {
    dayRefs.current[day] = el;
  };

  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<{ width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<{ day: Day; minutes: number } | null>(null);

  const activeMeal = activeMealId ? meals.find((m) => m.id === activeMealId) : null;

  const ignoreClickRef = useRef(false);

  function toggleExpanded(e: React.MouseEvent<HTMLDivElement>) {
    if (ignoreClickRef.current) return;
    const t = e.target as HTMLElement;
    if (t.closest("button,a,input,textarea,select,[data-no-expand]")) return;
    setExpanded((v) => !v);
  }

  const [formRecipe, setFormRecipe] = useState("");
  const [formDay, setFormDay] = useState<Day>("Monday");
  const [formTime, setFormTime] = useState("14:00");

  function openAdd() {
    setFormRecipe("");
    setFormDay("Monday");
    setFormTime("14:00");
    setAddOpen(true);
  }

  function openEdit(id: string) {
    const m = meals.find((x) => x.id === id);
    if (!m) return;
    setFormRecipe(m.recipeName);
    setFormDay(m.day);
    setFormTime(minutesToTime(m.startMinutes));
    setEditId(id);
  }

  function openDelete(id: string) {
    setDeleteId(id);
  }

  function submitAdd() {
    const start = snapMinutes(timeToMinutes(formTime), DEFAULT_DURATION);

    if (!canPlaceInSlot(formDay, start)) {
      showToast("Meal limit reached for time slot");
      return;
    }

    setMeals((prev) => [
      ...prev,
      {
        id: uid(),
        day: formDay,
        recipeName: formRecipe.trim() || "Recipe Name",
        startMinutes: start,
        durationMinutes: DEFAULT_DURATION,
      },
    ]);
    setAddOpen(false);
  }

  function submitEdit() {
    if (!editId) return;
    const current = meals.find((m) => m.id === editId);
    if (!current) return;

    const raw = timeToMinutes(formTime);
    const clamped = clamp(raw, 0, 24 * 60 - current.durationMinutes);

    if (!canPlaceInSlot(formDay, clamped, editId)) {
      showToast("Meal limit reached for time slot");
      return;
    }

    setMeals((prev) =>
      prev.map((m) =>
        m.id === editId
          ? {
              ...m,
              recipeName: formRecipe.trim() || m.recipeName,
              day: formDay,
              startMinutes: clamped,
            }
          : m
      )
    );

    setEditId(null);
  }

  function submitDelete() {
    if (!deleteId) return;
    setMeals((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(e: any) {
    ignoreClickRef.current = true;
    setActiveMealId(String(e.active.id));
    const r = e.active.rect.current.initial;
    setActiveSize({ width: r?.width ?? 260, height: r?.height ?? 90 });
  }

  function clearDrag() {
    setActiveMealId(null);
    setActiveSize(null);
    setPreview(null);
    setTimeout(() => {
      ignoreClickRef.current = false;
    }, 200);
  }

  function handleDragMove(e: any) {
    const overDay = e.over?.id as Day | undefined;
    if (!overDay) return;

    const mealId = String(e.active.id);
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    const dayEl = dayRefs.current[overDay];
    if (!dayEl) return;

    const dayRect = dayEl.getBoundingClientRect();
    const draggedRect = e.active.rect.current.translated ?? e.active.rect.current.initial;
    if (!draggedRect) return;

    const centerY = draggedRect.top + draggedRect.height / 2;
    const yWithinDay = centerY - dayRect.top;

    const rawMinutes = yWithinDay / PX_PER_MIN;
    const snapped = snapMinutes(rawMinutes, meal.durationMinutes);

    setPreview({ day: overDay, minutes: snapped });
  }

  function handleDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overDay = e.over?.id as Day | undefined;
    if (!overDay) return;

    const meal = meals.find((m) => m.id === activeId);
    if (!meal) return;

    const dayEl = dayRefs.current[overDay];
    if (!dayEl) return;

    const dayRect = dayEl.getBoundingClientRect();
    const draggedRect = e.active.rect.current.translated ?? e.active.rect.current.initial;
    if (!draggedRect) return;

    const centerY = draggedRect.top + draggedRect.height / 2;
    const yWithinDay = centerY - dayRect.top;

    const rawMinutes = yWithinDay / PX_PER_MIN;
    const newStart = snapMinutes(rawMinutes, meal.durationMinutes);

    if (!canPlaceInSlot(overDay, newStart, activeId)) {
      showToast("Meal limit reached for time slot");
      return; // no state change -> snaps back
    }

    setMeals((prev) =>
      prev.map((m) => (m.id === activeId ? { ...m, day: overDay, startMinutes: newStart } : m))
    );
  }

  const hourHeight = 60 * PX_PER_MIN;
  const dayHeightPx = 24 * 60 * PX_PER_MIN;

  function scrollToNow() {
    const board = boardRef.current;
    if (!board) return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const maxScroll = Math.max(0, board.scrollHeight - board.clientHeight);

    if (nowMinutes <= 0) {
      board.scrollTop = 0;
      return;
    }
    if (nowMinutes >= 24 * 60 - 5 * 60) {
      board.scrollTop = maxScroll;
      return;
    }

    const target = nowMinutes * PX_PER_MIN - hourHeight;
    board.scrollTop = clamp(target, 0, maxScroll);
  }

  useEffect(() => {
    if (!mounted) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToNow());
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const board = boardRef.current;
    const header = headerScrollRef.current;
    if (!board || !header) return;

    let syncing = false;

    const syncHeader = () => {
      if (syncing) return;
      syncing = true;
      header.scrollLeft = board.scrollLeft;
      syncing = false;
    };

    const syncBoard = () => {
      if (syncing) return;
      syncing = true;
      board.scrollLeft = header.scrollLeft;
      syncing = false;
    };

    board.addEventListener("scroll", syncHeader, { passive: true });
    header.addEventListener("scroll", syncBoard, { passive: true });

    header.scrollLeft = board.scrollLeft;

    return () => {
      board.removeEventListener("scroll", syncHeader);
      header.removeEventListener("scroll", syncBoard);
    };
  }, [mounted]);

  const deletingMeal = deleteId ? meals.find((m) => m.id === deleteId) : null;

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>My Meal Plan</h1>
          <p className={styles.subtitle}>
            Notes about the meal plan. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s...
          </p>
        </div>

        <button className={styles.addBtn} onClick={openAdd}>
          Add Meal
        </button>
      </div>

      <div
        className={`${styles.calendarViewport} ${expanded ? styles.expanded : ""}`}
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
      >
        <button
          className={styles.expandToggle}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-label={expanded ? "Collapse calendar" : "Expand calendar"}
          title={expanded ? "Collapse" : "Expand"}
          data-no-expand
        >
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {!expanded && <div className={styles.expandLabel}></div>}

        <div className={styles.calendarHeader}>
          <div ref={headerScrollRef} className={styles.headerScroller}>
            <div className={styles.headerGrid}>
              <div className={styles.stickyCorner} />
              {DAYS.map((d) => (
                <div key={d} className={styles.stickyDay}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div ref={boardRef} className={styles.board}>
          {mounted ? (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={(e) => {
                handleDragEnd(e);
                clearDrag();
              }}
              onDragCancel={clearDrag}
            >
              <div className={styles.boardInner}>
                <div
                  className={styles.scheduleGrid}
                  style={
                    {
                      ["--hour-height" as any]: `${hourHeight}px`,
                      ["--day-height" as any]: `${dayHeightPx}px`,
                      ["--slot-height" as any]: `${SNAP_MINUTES * PX_PER_MIN}px`,
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.timeCol}>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div key={h} className={styles.timeCell}>
                        {pad2(h)}:00
                      </div>
                    ))}
                  </div>

                  {DAYS.map((day) => (
                    <DayColumn
                      key={day}
                      day={day}
                      meals={mealsByDay[day]}
                      setDayRef={setDayRef}
                      onEdit={openEdit}
                      onDelete={openDelete}
                      previewMinutes={preview?.day === day ? preview.minutes : null}
                      dayHeightPx={dayHeightPx}
                    />
                  ))}
                </div>
              </div>

              <DragOverlay>
                {activeMeal && activeSize ? (
                  <div
                    className={styles.mealCardOverlay}
                    style={{ width: activeSize.width, height: activeSize.height }}
                  >
                    <div className={styles.mealTop}>
                      <div className={styles.mealLeft}>
                        <div className={styles.mealName}>{activeMeal.recipeName}</div>
                        <div className={styles.mealTime}>
                          {minutesToTime(preview?.minutes ?? activeMeal.startMinutes)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className={styles.boardInner}>
              <div
                className={styles.scheduleGrid}
                style={
                  {
                    ["--hour-height" as any]: `${hourHeight}px`,
                    ["--day-height" as any]: `${dayHeightPx}px`,
                    ["--slot-height" as any]: `${SNAP_MINUTES * PX_PER_MIN}px`,
                  } as React.CSSProperties
                }
              >
                <div className={styles.timeCol}>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className={styles.timeCell}>
                      {pad2(h)}:00
                    </div>
                  ))}
                </div>

                {DAYS.map((day) => (
                  <div key={day} className={styles.dayCol}>
                    <div className={styles.dayBody} style={{ height: dayHeightPx }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Meal" centered>
        <div className={styles.modalBody}>
          <Autocomplete
            label="Recipe"
            placeholder="Search... (From saved)"
            data={MOCK_RECIPES}
            value={formRecipe}
            onChange={setFormRecipe}
          />
          <Select label="Day" data={DAYS} value={formDay} onChange={(v) => setFormDay((v as Day) ?? "Monday")} />
          <TextInput
            label="Date/Time"
            type="time"
            step={1800}
            value={formTime}
            onChange={(e) => setFormTime(e.currentTarget.value)}
          />
          <Button fullWidth mt="md" radius="md" style={{ backgroundColor: "#896c6c" }} onClick={submitAdd}>
            Add
          </Button>
        </div>
      </Modal>

      <Modal opened={!!editId} onClose={() => setEditId(null)} title="Edit Meal" centered>
        <div className={styles.modalBody}>
          <Autocomplete
            label="Recipe"
            placeholder="Current / Search"
            data={MOCK_RECIPES}
            value={formRecipe}
            onChange={setFormRecipe}
          />
          <Select label="Day" data={DAYS} value={formDay} onChange={(v) => setFormDay((v as Day) ?? "Monday")} />
          <TextInput label="Date/Time" type="time" value={formTime} onChange={(e) => setFormTime(e.currentTarget.value)} />
          <Button fullWidth mt="md" radius="md" style={{ backgroundColor: "#896c6c" }} onClick={submitEdit}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal opened={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Meal" centered>
        <div className={styles.modalBody}>
          <TextInput label="Recipe" value={deletingMeal?.recipeName ?? ""} readOnly />
          <TextInput
            label="Date/Time"
            value={deletingMeal ? `${minutesToTime(deletingMeal.startMinutes)} / ${deletingMeal.day}` : ""}
            readOnly
          />
          <Button fullWidth mt="md" radius="md" color="red" onClick={submitDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
