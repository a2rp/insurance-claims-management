const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const formatDate = (date) => {
  if (!date) return "Not set";
  return dateFormatter.format(new Date(`${date}T12:00:00`));
};

export const formatCompactDate = (date) => {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
};

export const getInitials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const toCsvValue = (value) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export const downloadCsv = (filename, rows, columns) => {
  const csv = [
    columns.map((column) => toCsvValue(column.label)).join(","),
    ...rows.map((row) =>
      columns.map((column) => toCsvValue(row[column.key])).join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
