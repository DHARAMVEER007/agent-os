import type { RuntimeStatus } from "../../lib/tauri/runtime";

interface RuntimeStatusCardProps {
  isChecking: boolean;
  onRefresh: () => Promise<void>;
  status: RuntimeStatus;
}

const statusLabels: Record<keyof RuntimeStatus, string> = {
  application: "Application",
  native_shell: "Native shell",
  background_service: "Background service",
};

export function RuntimeStatusCard({
  isChecking,
  onRefresh,
  status,
}: RuntimeStatusCardProps) {
  return (
    <section className="runtime-card" aria-labelledby="runtime-title">
      <div className="runtime-card__heading">
        <div>
          <p className="eyebrow">System boundary</p>
          <h3 id="runtime-title">Runtime status</h3>
        </div>
        <button
          className="secondary-button"
          disabled={isChecking}
          onClick={() => void onRefresh()}
          type="button"
        >
          {isChecking ? "Checking…" : "Check runtime"}
        </button>
      </div>

      <dl className="runtime-list">
        {(Object.keys(status) as Array<keyof RuntimeStatus>).map((key) => (
          <div key={key}>
            <dt>{statusLabels[key]}</dt>
            <dd>{status[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
