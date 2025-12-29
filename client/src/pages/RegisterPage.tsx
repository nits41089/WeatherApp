import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { apiFetch } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-semibold">Start building habits</h1>
          <p className="text-sm text-slate-500">Create your Habit Atlas profile.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <Button className="w-full" type="submit">
            Create account
          </Button>
        </form>
        <p className="text-sm text-slate-500">
          Already have an account? <Link className="text-brand-500" to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
