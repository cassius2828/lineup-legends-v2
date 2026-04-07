import { useParams } from "next/navigation";

export function useRouteId(paramName = "id"): string {
  const params = useParams();
  const value = params[paramName];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}
