export const ETAPAS_JORNADA = [
  { numero: 1, nome: "Contato", descricao: "Primeiro contato comercial" },
  { numero: 2, nome: "Ficha Cadastral", descricao: "Cadastro completo via WhatsApp" },
  { numero: 3, nome: "Acesso ao Portal", descricao: "Login e senha liberados" },
  { numero: 4, nome: "Treinamento Comercial", descricao: "Call de capacitação comercial" },
  { numero: 5, nome: "Primeira Venda", descricao: "Primeira instalação vendida" },
  { numero: 6, nome: "Curso Técnico Zelo", descricao: "Curso de instalação e manutenção na fábrica" },
] as const;

export type Etapa = typeof ETAPAS_JORNADA[number];
export const TOTAL_ETAPAS = ETAPAS_JORNADA.length;

export function etapaValida(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= TOTAL_ETAPAS;
}
