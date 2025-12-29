import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HabitForm, { HabitFormValues } from "../components/HabitForm";
import Card from "../components/Card";
import { apiFetch } from "../lib/api";

export default function HabitNewPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: HabitFormValues) => {
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/habits", {
        method: "POST",
        body: JSON.stringify(values)
      });
      navigate(`/habits/${data.habit.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Create a new habit</h2>
        <p className="text-sm text-slate-500">Design a routine that fits your life.</p>
      </div>
      <Card>
        <HabitForm onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  );
}
