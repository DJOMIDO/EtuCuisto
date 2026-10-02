const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatEur(value: number) {
  return EUR.format(value);
}
