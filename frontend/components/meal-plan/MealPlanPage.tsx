"use client";

import styles from "./MealPlanPage.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Button, Modal, Select, TextInput } from "@mantine/core";
import {
  ExternalLink,
  Pencil,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

type Meal = {
  id: string;
  date: string; // YYYY-MM-DD (local)
  recipeName: string;
  startMinutes: number; // 0..1439
  durationMinutes: number;
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

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

/** ---------- Date helpers (no libs) ---------- */
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Monday start-of-week
function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // Mon=0
  x.setDate(x.getDate() - diff);
  return x;
}

// local YYYY-MM-DD
function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const fmtMonthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fmtMonthDayYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatWeekRange(ws: Date) {
  const we = addDays(ws, 6);
  const sameYear = ws.getFullYear() === we.getFullYear();
  const sameMonth = sameYear && ws.getMonth() === we.getMonth();

  if (!sameYear) {
    return `${fmtMonthDayYear.format(ws)} – ${fmtMonthDayYear.format(we)}`;
  }
  if (sameMonth) {
    // "Jun 2 – 8, 2025"
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(ws);
    return `${month} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}`;
  }
  // "Jun 30 – Jul 6, 2025"
  return `${fmtMonthDay.format(ws)} – ${fmtMonthDay.format(we)}, ${ws.getFullYear()}`;
}

/** ✅ Limit: no earlier than June 2025 (we clamp to first full Monday-week in June 2025) */
const MIN_WEEK_START = startOfWeekMonday(new Date(2025, 5, 2)); // Jun 2, 2025 (Monday)

function clampWeekStart(ws: Date) {
  return ws.getTime() < MIN_WEEK_START.getTime() ? MIN_WEEK_START : ws;
}

/** --- Draggable Meal Card --- */
function DraggableMeal({
  meal,
  topPx,
  heightPx,
  onEdit,
  onDelete,
  zIndex,
}: {
  meal: Meal;
  topPx: number;
  heightPx: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

/** --- Droppable Date Column --- */
function DateColumn({
  dateId,
  meals,
  setDayRef,
  onEdit,
  onDelete,
  previewMinutes,
  dayHeightPx,
}: {
  dateId: string; // YYYY-MM-DD
  meals: Meal[];
  setDayRef: (dateId: string, el: HTMLDivElement | null) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  previewMinutes: number | null;
  dayHeightPx: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateId,
    data: { type: "date", dateId },
  });

  const combinedRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    setDayRef(dateId, el);
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

  // ✅ if a stack becomes single after delete, reset hover state
  useEffect(() => {
    if (hoverStart == null) return;
    const g = startGroups.find((x) => x.start === hoverStart);
    if (!g || g.items.length <= 1) setHoverStart(null);
  }, [hoverStart, startGroups]);

  const GAP = 8;
  const slotPx = SNAP_MINUTES * PX_PER_MIN;

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

          // collapsed: reserve max height (prevents later items overlapping),
          // BUT render only top card (no blur stacking).
          const wrapperHeight = isHovered ? expandedHeight : maxH;

          let offsets: number[] = [];
          if (isHovered && !expandUp) {
            let y = 0;
            offsets = heights.map((h) => {
              const out = y;
              y += h + GAP;
              return out;
            });
          } else if (isHovered && expandUp) {
            const anchorOffset = expandedHeight - firstH;
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
              key={`stack-${dateId}-${start}`}
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

  // week start (Monday)
  const [weekStart, setWeekStart] = useState<Date>(MIN_WEEK_START);

  // meals (global, across weeks)
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    setMounted(true);

    // initialize to "this week" but clamped to >= Jun 2025
    const ws = clampWeekStart(startOfWeekMonday(new Date()));
    setWeekStart(ws);

    // demo meals in current week (optional)
    setMeals([
      { id: "m1", date: toISODateLocal(ws), recipeName: "Recipe Name", startMinutes: 9 * 60, durationMinutes: DEFAULT_DURATION },
      { id: "m2", date: toISODateLocal(addDays(ws, 1)), recipeName: "Recipe Name", startMinutes: 8 * 60, durationMinutes: DEFAULT_DURATION },
      { id: "m3", date: toISODateLocal(addDays(ws, 1)), recipeName: "Recipe Name", startMinutes: 8 * 60, durationMinutes: DEFAULT_DURATION }, // stacked example
      { id: "m4", date: toISODateLocal(addDays(ws, 3)), recipeName: "Recipe Name", startMinutes: 10 * 60, durationMinutes: DEFAULT_DURATION },
      { id: "m5", date: toISODateLocal(addDays(ws, 4)), recipeName: "Recipe Name", startMinutes: 11 * 60, durationMinutes: DEFAULT_DURATION },
    ]);
  }, []);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekIds = useMemo(() => weekDates.map(toISODateLocal), [weekDates]);

  const weekOptions = useMemo(() => {
    return weekDates.map((d, i) => ({
      value: toISODateLocal(d),
      label: `${DAY_NAMES[i]} • ${fmtMonthDay.format(d)}`,
    }));
  }, [weekDates]);

  const mealsByDate = useMemo(() => {
    const map: Record<string, Meal[]> = Object.fromEntries(weekIds.map((id) => [id, []]));
    for (const m of meals) {
      if (map[m.date]) map[m.date].push(m);
    }
    for (const id of weekIds) map[id].sort((a, b) => a.startMinutes - b.startMinutes);
    return map;
  }, [meals, weekIds]);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const showToast = (msg: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  };

  const countMealsInSlot = (dateId: string, startMin: number, ignoreId?: string) => {
    const k = slotKey(startMin);
    let c = 0;
    for (const m of meals) {
      if (m.date !== dateId) continue;
      if (ignoreId && m.id === ignoreId) continue;
      if (slotKey(m.startMinutes) === k) c++;
    }
    return c;
  };

  const canPlaceInSlot = (dateId: string, startMin: number, ignoreId?: string) =>
    countMealsInSlot(dateId, startMin, ignoreId) < MAX_MEALS_PER_SLOT;

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // expand/collapse window
  const [expanded, setExpanded] = useState(false);

  // scroll refs
  const boardRef = useRef<HTMLDivElement | null>(null);
  const headerScrollRef = useRef<HTMLDivElement | null>(null);

  // day refs (by dateId)
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setDayRef = (dateId: string, el: HTMLDivElement | null) => {
    dayRefs.current[dateId] = el;
  };

  // drag state
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<{ width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<{ dateId: string; minutes: number } | null>(null);

  const activeMeal = activeMealId ? meals.find((m) => m.id === activeMealId) : null;

  const ignoreClickRef = useRef(false);

  function toggleExpanded(e: React.MouseEvent<HTMLDivElement>) {
    if (ignoreClickRef.current) return;
    const t = e.target as HTMLElement;
    if (t.closest("button,a,input,textarea,select,[data-no-expand]")) return;
    setExpanded((v) => !v);
  }

  // form state
  const [formRecipe, setFormRecipe] = useState("");
  const [formDate, setFormDate] = useState<string>(weekIds[0] ?? toISODateLocal(weekStart));
  const [formTime, setFormTime] = useState("14:00");

  useEffect(() => {
    // keep formDate valid when you switch weeks
    if (!weekIds.includes(formDate)) setFormDate(weekIds[0] ?? formDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekIds.join("|")]);

  function openAdd() {
    setFormRecipe("");
    setFormDate(weekIds[0] ?? toISODateLocal(weekStart));
    setFormTime("14:00");
    setAddOpen(true);
  }

  function openEdit(id: string) {
    const m = meals.find((x) => x.id === id);
    if (!m) return;
    setFormRecipe(m.recipeName);
    setFormDate(m.date);
    setFormTime(minutesToTime(m.startMinutes));
    setEditId(id);
  }

  function openDelete(id: string) {
    setDeleteId(id);
  }

  function submitAdd() {
    const start = snapMinutes(timeToMinutes(formTime), DEFAULT_DURATION);

    if (!canPlaceInSlot(formDate, start)) {
      showToast("Meal limit reached for time slot");
      return;
    }

    setMeals((prev) => [
      ...prev,
      {
        id: uid(),
        date: formDate,
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

    if (!canPlaceInSlot(formDate, clamped, editId)) {
      showToast("Meal limit reached for time slot");
      return;
    }

    setMeals((prev) =>
      prev.map((m) =>
        m.id === editId
          ? {
              ...m,
              recipeName: formRecipe.trim() || m.recipeName,
              date: formDate,
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

  // dnd sensors
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
    const overId = e.over?.id as string | undefined;
    if (!overId) return;

    const mealId = String(e.active.id);
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    const dayEl = dayRefs.current[overId];
    if (!dayEl) return;

    const dayRect = dayEl.getBoundingClientRect();
    const draggedRect = e.active.rect.current.translated ?? e.active.rect.current.initial;
    if (!draggedRect) return;

    const centerY = draggedRect.top + draggedRect.height / 2;
    const yWithinDay = centerY - dayRect.top;

    const rawMinutes = yWithinDay / PX_PER_MIN;
    const snapped = snapMinutes(rawMinutes, meal.durationMinutes);

    setPreview({ dateId: overId, minutes: snapped });
  }

  function handleDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over?.id as string | undefined;
    if (!overId) return;

    const meal = meals.find((m) => m.id === activeId);
    if (!meal) return;

    const dayEl = dayRefs.current[overId];
    if (!dayEl) return;

    const dayRect = dayEl.getBoundingClientRect();
    const draggedRect = e.active.rect.current.translated ?? e.active.rect.current.initial;
    if (!draggedRect) return;

    const centerY = draggedRect.top + draggedRect.height / 2;
    const yWithinDay = centerY - dayRect.top;

    const rawMinutes = yWithinDay / PX_PER_MIN;
    const newStart = snapMinutes(rawMinutes, meal.durationMinutes);

    if (!canPlaceInSlot(overId, newStart, activeId)) {
      showToast("Meal limit reached for time slot");
      return; // no state change -> snaps back
    }

    setMeals((prev) =>
      prev.map((m) => (m.id === activeId ? { ...m, date: overId, startMinutes: newStart } : m))
    );
  }

  // sizes
  const hourHeight = 60 * PX_PER_MIN;
  const dayHeightPx = 24 * 60 * PX_PER_MIN;

  function scrollToMinute(min: number) {
    const board = boardRef.current;
    if (!board) return;

    const maxScroll = Math.max(0, board.scrollHeight - board.clientHeight);
    const target = min * PX_PER_MIN - hourHeight; // keep it as “2nd hour line”
    board.scrollTop = clamp(target, 0, maxScroll);
  }

  function scrollToNowIfThisWeek() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = addDays(weekStart, 6);
    const inWeek =
      today.getTime() >= weekStart.getTime() && today.getTime() <= weekEnd.getTime();

    if (inWeek) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      scrollToMinute(nowMinutes);
    } else {
      scrollToMinute(8 * 60); // default: 08:00
    }
  }

  useEffect(() => {
    if (!mounted) return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToNowIfThisWeek()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, weekStart.getTime()]);

  // sync header horizontal scroll with board horizontal scroll
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

  // week navigation
  const canGoPrev = useMemo(() => {
    const prev = addDays(weekStart, -7);
    return prev.getTime() >= MIN_WEEK_START.getTime();
  }, [weekStart]);

  const goPrev = () => {
    if (!canGoPrev) return;
    setWeekStart((ws) => clampWeekStart(addDays(ws, -7)));
  };

  const goNext = () => setWeekStart((ws) => addDays(ws, 7));

  const goToday = () => setWeekStart(clampWeekStart(startOfWeekMonday(new Date())));

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

      {/* ✅ week navigation bar */}
      <div className={styles.weekBar}>
        <button
          className={`${styles.navBtn} ${!canGoPrev ? styles.navBtnDisabled : ""}`}
          onClick={goPrev}
          disabled={!canGoPrev}
          title="Previous week"
          type="button"
        >
          <ChevronLeft size={18} />
        </button>

        <button className={styles.todayBtn} onClick={goToday} type="button">
          Today
        </button>

        <div className={styles.weekRange}>
          {mounted ? formatWeekRange(weekStart) : "—"}
        </div>

        <button className={styles.navBtn} onClick={goNext} title="Next week" type="button">
          <ChevronRight size={18} />
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
          type="button"
        >
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {/* header (dates + day names) */}
        <div className={styles.calendarHeader}>
          <div ref={headerScrollRef} className={styles.headerScroller}>
            <div className={styles.headerGrid}>
              <div className={styles.stickyCorner} />
              {weekDates.map((d, i) => (
                <div
                  key={toISODateLocal(d)}
                  className={styles.stickyDay}
                >
                  <div className={styles.stickyDayName}>{DAY_NAMES[i]}</div>
                  <div className={styles.stickyDayDate}>{fmtMonthDay.format(d)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* body scroller */}
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
                  {/* Time axis */}
                  <div className={styles.timeCol}>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div key={h} className={styles.timeCell}>
                        {pad2(h)}:00
                      </div>
                    ))}
                  </div>

                  {/* Dates */}
                  {weekIds.map((dateId) => (
                    <DateColumn
                      key={dateId}
                      dateId={dateId}
                      meals={mealsByDate[dateId] ?? []}
                      setDayRef={setDayRef}
                      onEdit={openEdit}
                      onDelete={openDelete}
                      previewMinutes={preview?.dateId === dateId ? preview.minutes : null}
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
            // SSR-safe skeleton
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

                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={styles.dayCol}>
                    <div className={styles.dayBody} style={{ height: dayHeightPx }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Add Meal" centered>
        <div className={styles.modalBody}>
          <Autocomplete
            label="Recipe"
            placeholder="Search... (From saved)"
            data={MOCK_RECIPES}
            value={formRecipe}
            onChange={setFormRecipe}
          />
          <Select
            label="Date"
            data={weekOptions}
            value={formDate}
            onChange={(v) => setFormDate(v ?? formDate)}
          />
          <TextInput
            label="Time"
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

      {/* EDIT MODAL */}
      <Modal opened={!!editId} onClose={() => setEditId(null)} title="Edit Meal" centered>
        <div className={styles.modalBody}>
          <Autocomplete
            label="Recipe"
            placeholder="Current / Search"
            data={MOCK_RECIPES}
            value={formRecipe}
            onChange={setFormRecipe}
          />
          <Select
            label="Date"
            data={weekOptions}
            value={formDate}
            onChange={(v) => setFormDate(v ?? formDate)}
          />
          <TextInput
            label="Time"
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.currentTarget.value)}
          />
          <Button fullWidth mt="md" radius="md" style={{ backgroundColor: "#896c6c" }} onClick={submitEdit}>
            Save
          </Button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal opened={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Meal" centered>
        <div className={styles.modalBody}>
          <TextInput label="Recipe" value={deletingMeal?.recipeName ?? ""} readOnly />
          <TextInput
            label="Date/Time"
            value={
              deletingMeal
                ? `${minutesToTime(deletingMeal.startMinutes)} / ${deletingMeal.date}`
                : ""
            }
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
