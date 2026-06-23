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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">{title}</h1>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <RangeSelect current={range} />
        {exportRows && (
          <ExportButton rows={exportRows} filename={exportName || "export.csv"} />
        )}
        <AddWidgetModal />
      </div>
    </div>
  );
}
