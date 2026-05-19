interface ExportPanelProps {
  disabled: boolean;
  onExportCsv: () => void;
}

const ExportPanel = ({ disabled, onExportCsv }: ExportPanelProps) => (
  <section className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neon-blue mb-1">
        Export Terminal
      </h2>
      <p className="text-xs text-slate-500">
        CSV export (frontend only). PDF via pdf.service.ts — deferred.
      </p>
    </div>
    <button
      type="button"
      onClick={onExportCsv}
      disabled={disabled}
      className="px-8 py-3 rounded-xl font-bold border border-neon-blue/40 text-neon-blue
        shadow-[0_0_16px_rgba(0,212,255,0.2)] hover:bg-neon-blue/10 hover:shadow-[0_0_24px_rgba(0,212,255,0.35)]
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      DOWNLOAD REPORT
    </button>
  </section>
);

export default ExportPanel;
