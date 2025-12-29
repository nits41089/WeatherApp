import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HabitForm, { HabitFormValues } from "../components/HabitForm";
import Card from "../components/Card";
import { apiFetch } from "../lib/api";

export default function HabitEditPage() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<HabitFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!habitId) return;
    apiFetch(`/api/habits/${habitId}`).then((data) => {
      const habit = data.habit;
      setInitialValues({
        name: habit.name,
        type: habit.type,
        scheduleType: habit.scheduleType,
        targetType: habit.targetType,
        targetUnit: habit.targetUnit ?? "",
        targetMin: habit.targetMin ?? 1,
        targetMax: habit.targetMax ?? 1,
        targetStep: habit.targetStep ?? 1,
        difficulty: habit.difficulty,
        notes: habit.notes ?? ""
      });
    });
  }, [habitId]);

  const handleSubmit = async (values: HabitFormValues) => {
    if (!habitId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/habits/${habitId}`, {
        method: "PUT",
        body: JSON.stringify(values)
      });
      navigate(`/habits/${habitId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialValues) {
    return <p className="text-sm text-slate-500">Loading habit...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Edit habit</h2>
        <p className="text-sm text-slate-500">Refine your plan and keep moving forward.</p>
      </div>
      <Card>
        <HabitForm initialValues={initialValues} onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  );
}
