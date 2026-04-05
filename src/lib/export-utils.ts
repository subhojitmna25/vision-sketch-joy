import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportOptions {
  fileName: string;
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}

export function exportCSV({ fileName, headers, rows }: ExportOptions) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${fileName}.csv`);
}

export function exportExcel({ fileName, headers, rows }: ExportOptions) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Auto-size columns
  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, fileName);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `${fileName}.xlsx`);
}

export function exportPDF({ fileName, headers, rows, title }: ExportOptions) {
  const doc = new jsPDF();
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 28 : 14,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });
  doc.save(`${fileName}.pdf`);
}
