import { RangeSelect } from "./RangeSelect";
import { ExportButton } from "./ExportButton";
import { AddWidgetModal } from "./AddWidgetModal";

// Her admin sayfasının üst başlığı: başlık+açıklama (sol),
// tarih dropdown + export + widget ekle (sağ).
export function AdminHeader({
  title,
  description,
  range,
  exportRows,
  exportName,
}: {
  title: string;
  description: string;
  range: string;
  exportRows?: Record<string, unknown>[];
  exportName?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text">{title}</h1>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <RangeSelect current={range} className="w-full sm:w-auto" />
        <div className="flex gap-2">
          {exportRows && (
            <ExportButton
              rows={exportRows}
              filename={exportName || "export.csv"}
              className="flex-1 sm:flex-initial"
            />
          )}
          <AddWidgetModal className="flex-1 sm:flex-initial" />
        </div>
      </div>
    </div>
  );
}
