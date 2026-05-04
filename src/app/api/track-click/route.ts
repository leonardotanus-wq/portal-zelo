import { NextResponse, type NextRequest } from "next/server";
import { getRevendaLogada } from "@/lib/auth";
import { trackEvento } from "@/lib/tracking";

export async function POST(request: NextRequest) {
  let body: { detalhe?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, erro: "json invalido" }, { status: 400 });
  }

  const detalhe = typeof body.detalhe === "string" ? body.detalhe.slice(0, 80) : undefined;
  if (!detalhe) {
    return NextResponse.json({ ok: false, erro: "detalhe obrigatorio" }, { status: 400 });
  }

  const revenda = await getRevendaLogada();
  if (!revenda) {
    return NextResponse.json({ ok: false, erro: "nao autenticado" }, { status: 401 });
  }

  await trackEvento(revenda, "click_botao", detalhe);
  return NextResponse.json({ ok: true });
}
