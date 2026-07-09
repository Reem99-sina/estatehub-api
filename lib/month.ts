const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonthlyChart(
  data: {
    _id: { year: number; month: number };
    [key: string]: any;
  }[],
  valueKey: string
) {
  return data.map((item) => ({
    month: `${MONTHS[item._id.month - 1]} ${item._id.year}`,
    [valueKey]: item[valueKey],
  }));
}