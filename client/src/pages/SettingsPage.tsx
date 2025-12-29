import { useEffect, useState } from "react";
import Card from "../components/Card";
import Input from "../components/Input";
import Toggle from "../components/Toggle";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [weekStart, setWeekStart] = useState(user?.weekStart ?? 1);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [enableOpenAI, setEnableOpenAI] = useState(false);

  useEffect(() => {
    apiFetch("/api/settings")
      .then((data) => {
        setTimezone(data.settings.timezone);
        setWeekStart(data.settings.weekStart);
        setPrivacyMode(data.settings.privacyMode);
        setEnableOpenAI(data.settings.enableOpenAI);
      })
      .catch(() => null);
  }, []);

  const handleSave = async () => {
    const data = await apiFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ timezone, weekStart, privacyMode, enableOpenAI })
    });
    setUser(data.user);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-slate-500">Manage your preferences and privacy.</p>
      </div>
      <Card>
        <div className="space-y-4">
          <Input label="Timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          <Input
            label="Week starts on (0=Sun, 1=Mon)"
            type="number"
            value={weekStart}
            onChange={(event) => setWeekStart(Number(event.target.value))}
          />
          <Toggle label="Dark mode" checked={darkMode} onChange={setDarkMode} />
          <Toggle label="Privacy mode (never send data externally)" checked={privacyMode} onChange={setPrivacyMode} />
          <Toggle label="Enable OpenAI coach" checked={enableOpenAI} onChange={setEnableOpenAI} />
          <Button onClick={handleSave}>Save settings</Button>
        </div>
      </Card>
    </div>
  );
}
