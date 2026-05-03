export type Revenda = {
  id: string;
  nome_empresa: string;
  nome_responsavel: string | null;
  cidade: string | null;
  estado: string | null;
  vendedor_nome: string | null;
  vendedor_whatsapp: string | null;
  ativa: boolean;
  user_id: string | null;
  created_at: string;
};

export type StatusVideo = "pendente" | "aprovado" | "pago";

export type VideoInstalacao = {
  id: string;
  revenda_id: string;
  arquivo_path: string;
  nome_arquivo: string;
  status: StatusVideo;
  observacao: string | null;
  created_at: string;
  revenda?: Pick<Revenda, "nome_empresa">;
};

export type Admin = {
  id: string;
  email: string;
  nome: string | null;
  created_at: string;
};

export function emailDaRevenda(nomeEmpresa: string) {
  return `${nomeEmpresa.toLowerCase().trim()}@revenda.zelo.local`;
}
