import { useEffect } from "react";

export function useCompanyEffect(
  companyId: number | null,
  fn: (companyId: number) => void | Promise<void>
) {
  useEffect(() => {
    if (!companyId) return;
    fn(companyId);
  }, [companyId]);
}