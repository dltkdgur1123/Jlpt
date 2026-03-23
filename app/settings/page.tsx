import { AppShell } from "../../components/app-shell";
import { StudySettingsPanel } from "../../components/study-settings-panel";

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="page-section">
        <StudySettingsPanel />
      </section>
    </AppShell>
  );
}
