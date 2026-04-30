"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registrarVideoEnviado } from "./actions";

const TAMANHO_MAX_BYTES = 100 * 1024 * 1024;

type Props = { revendaId: string };

export function UploadVideoForm({ revendaId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [enviando, setEnviando] = useState(false);

  function escolher(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um arquivo de vídeo.");
      return;
    }
    if (file.size > TAMANHO_MAX_BYTES) {
      toast.error("Arquivo muito grande. Limite de 100 MB.");
      return;
    }
    setArquivo(file);
  }

  async function enviar() {
    if (!arquivo) return;
    setEnviando(true);
    setProgresso(5);

    try {
      const supabase = createClient();
      const path = `${revendaId}/${Date.now()}-${arquivo.name.replace(
        /\s+/g,
        "_",
      )}`;

      setProgresso(15);
      const { error: upErr } = await supabase.storage
        .from("videos-instalacao")
        .upload(path, arquivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: arquivo.type || "video/mp4",
        });

      if (upErr) {
        toast.error(`Falha no upload: ${upErr.message}`);
        setEnviando(false);
        setProgresso(0);
        return;
      }

      setProgresso(80);

      const res = await registrarVideoEnviado({
        arquivoPath: path,
        nomeArquivo: arquivo.name,
      });

      if (!res.ok) {
        toast.error(res.erro);
        setEnviando(false);
        setProgresso(0);
        return;
      }

      setProgresso(100);
      toast.success("Vídeo enviado! Seu vendedor vai validar em breve.");
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado no envio.");
    } finally {
      setEnviando(false);
      setTimeout(() => setProgresso(0), 800);
    }
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="video-input"
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white p-8 text-center transition ${
          enviando
            ? "border-zinc-300 opacity-60"
            : "border-zinc-300 hover:border-zelo-yellow hover:bg-zelo-yellow/5"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zelo-yellow/30 text-zelo-dark">
          <Camera className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-bold text-zelo-dark">
            {arquivo ? arquivo.name : "Toque para escolher um vídeo"}
          </p>
          <p className="text-xs text-zinc-500">Tamanho máximo: 100 MB</p>
        </div>
        <input
          ref={inputRef}
          id="video-input"
          type="file"
          accept="video/*"
          className="hidden"
          disabled={enviando}
          onChange={(e) => escolher(e.target.files?.[0])}
        />
      </label>

      {progresso > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-zelo-yellow transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={!arquivo || enviando}
        className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-zelo-yellow text-base font-extrabold text-zelo-dark shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
        {enviando ? "Enviando…" : "Enviar vídeo"}
      </button>
    </div>
  );
}
