import { useState } from "react";
import Button from "./Button";
import Input from "./Input";

export interface HabitFormValues {
  name: string;
  type: "build" | "quit";
  scheduleType: "daily" | "weekly_days" | "times_per_week" | "interval" | "range";
  targetType: "binary" | "quantitative" | "timed";
  targetUnit?: string;
  targetMin?: number;
  targetMax?: number;
  targetStep?: number;
  difficulty: number;
  notes?: string;
}

interface HabitFormProps {
  initialValues?: HabitFormValues;
  onSubmit: (values: HabitFormValues) => void;
  submitting?: boolean;
}

export default function HabitForm({ initialValues, onSubmit, submitting }: HabitFormProps) {
  const [values, setValues] = useState<HabitFormValues>(
    initialValues ?? {
      name: "",
      type: "build",
      scheduleType: "daily",
      targetType: "binary",
      targetUnit: "",
      targetMin: 1,
      targetMax: 1,
      targetStep: 1,
      difficulty: 3,
      notes: ""
    }
  );

  const handleChange = (field: keyof HabitFormValues, value: string | number) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <Input
        label="Habit name"
        value={values.name}
        onChange={(event) => handleChange("name", event.target.value)}
        required
      />
      <label className="block text-sm">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Type</span>
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={values.type}
          onChange={(event) => handleChange("type", event.target.value)}
        >
          <option value="build">Build</option>
          <option value="quit">Quit</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Schedule</span>
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={values.scheduleType}
          onChange={(event) => handleChange("scheduleType", event.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly_days">Specific days of week</option>
          <option value="times_per_week">X times per week</option>
          <option value="interval">Interval</option>
          <option value="range">Date range</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Target type</span>
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={values.targetType}
          onChange={(event) => handleChange("targetType", event.target.value)}
        >
          <option value="binary">Binary</option>
          <option value="quantitative">Quantitative</option>
          <option value="timed">Timed</option>
        </select>
      </label>
      {values.targetType !== "binary" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Unit"
            value={values.targetUnit}
            onChange={(event) => handleChange("targetUnit", event.target.value)}
          />
          <Input
            label="Min"
            type="number"
            value={values.targetMin}
            onChange={(event) => handleChange("targetMin", Number(event.target.value))}
          />
          <Input
            label="Max"
            type="number"
            value={values.targetMax}
            onChange={(event) => handleChange("targetMax", Number(event.target.value))}
          />
          <Input
            label="Step"
            type="number"
            value={values.targetStep}
            onChange={(event) => handleChange("targetStep", Number(event.target.value))}
          />
        </div>
      )}
      <Input
        label="Difficulty (1-5)"
        type="number"
        min={1}
        max={5}
        value={values.difficulty}
        onChange={(event) => handleChange("difficulty", Number(event.target.value))}
      />
      <label className="block text-sm">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes</span>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          rows={4}
          value={values.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
        />
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save habit"}
      </Button>
    </form>
  );
}
