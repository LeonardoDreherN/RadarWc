"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MatchDateTime({ isoDate }: { isoDate: string }) {
  const date = new Date(isoDate);
  return <span>{format(date, "dd 'de' MMMM · HH'h'mm", { locale: ptBR })}</span>;
}
