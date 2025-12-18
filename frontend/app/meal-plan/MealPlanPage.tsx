"use client";

import styles from "./MealPlanPage.module.css";
import { ExternalLink, Pencil, X } from "lucide-react";

type Meal = {
  id: string;
  day: string;
  name: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MOCK_MEALS: Meal[] = [
  { id: "m1", day: "Monday", name: "Recipe Name" },
  { id: "m2", day: "Tuesday", name: "Recipe Name" },
  { id: "m3", day: "Tuesday", name: "Recipe Name" },
  { id: "m4", day: "Thursday", name: "Recipe Name" },
  { id: "m5", day: "Friday", name: "Recipe Name" },
  { id: "m6", day: "Saturday", name: "Recipe Name" },
  { id: "m7", day: "Sunday", name: "Recipe Name" },
];

function groupByDay(meals: Meal[]) {
  const map: Record<string, Meal[]> = {};
  for (const d of DAYS) map[d] = [];
  for (const m of meals) map[m.day]?.push(m);
  return map;
}

export default function MealPlanPage() {
  const mealsByDay = groupByDay(MOCK_MEALS);

  return (
    <main className={styles.main}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>My Meal Plan</h1>
          <p className={styles.subtitle}>
            Notes about the meal plan. Lorem Ipsum has been the industry’s standard dummy text ever since the 1500s...
          </p>
        </div>

        <button className={styles.addBtn}>Add Meal</button>
      </div>

      <section className={styles.board}>
        <div className={styles.daysGrid}>
          {DAYS.map((day) => (
            <div key={day} className={styles.dayCol}>
              <div className={styles.dayHeader}>{day}</div>

              <div className={styles.dayBody}>
                {mealsByDay[day].map((meal) => (
                  <div key={meal.id} className={styles.mealCard}>
                    <div className={styles.mealTop}>
                      <span className={styles.mealName}>{meal.name}</span>
                      <button className={styles.iconBtn} title="Open recipe">
                        <ExternalLink size={16} />
                      </button>
                    </div>

                    <div className={styles.mealActions}>
                      <button className={styles.iconBtn} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button className={styles.iconBtn} title="Delete">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
