"use client";

import { useMemo, useState } from "react";
import type { TheorySynthesis } from "@/lib/theoryBuilder";

type Medium = "text" | "pdf" | "audio";

type UiState = {
  isProcessing: boolean;
  error: string | null;
  theory: TheorySynthesis | null;
  extractedContent: string;
};

const mediumLabels: Record<Medium, string> = {
  text: "Texto",
  pdf: "PDF",
  audio: "Áudio",
};

const theoryToMarkdown = (theory: TheorySynthesis) => {
  const lines: string[] = [];
  lines.push(`# Núcleo Teórico`);
  lines.push(theory.coreThesis);
  lines.push("");
  lines.push("## Fenômenos Principais");
  lines.push(...theory.phenomena.map((item) => `- ${item}`));
  lines.push("");
  lines.push("## Fórmulas Derivadas");
  theory.derivedFormulas.forEach((formula) => {
    lines.push(`### ${formula.title}`);
    lines.push(`- Expressão: ${formula.expression}`);
    lines.push(`- Explicação: ${formula.explanation}`);
  });
  lines.push("");
  lines.push("## Modelos de Sistema");
  theory.systemModels.forEach((model) => {
    lines.push(`- **${model.name}**: ${model.governingEquation}`);
    lines.push(`  - Foco: ${model.focus}`);
  });
  lines.push("");
  lines.push("## Parâmetros");
  theory.parameterTable.forEach((item) => {
    lines.push(`- ${item.label}: ${item.description}`);
  });

  return lines.join("\n");
};

const downloadTheory = (theory: TheorySynthesis) => {
  const blob = new Blob([theoryToMarkdown(theory)], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sintese-teorica.md";
  link.click();
  URL.revokeObjectURL(url);
};

export default function Home() {
  const [medium, setMedium] = useState<Medium>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UiState>({
    isProcessing: false,
    error: null,
    theory: null,
    extractedContent: "",
  });

  const handleFileChange = (inputFileList: FileList | null) => {
    if (!inputFileList || inputFileList.length === 0) {
      setFile(null);
      return;
    }
    setFile(inputFileList[0]);
  };

  const isPrimaryDisabled = useMemo(() => {
    if (state.isProcessing) return true;
    if (medium === "text") return text.trim().length === 0;
    return !file;
  }, [state.isProcessing, medium, text, file]);

  const handleSubmit = async () => {
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      const formData = new FormData();
      formData.append("medium", medium);
      if (medium === "text") {
        formData.append("text", text);
      } else if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/synth", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "Falha inesperada.");
      }

      const payload = (await response.json()) as {
        content: string;
        theory: TheorySynthesis;
      };

      setState({
        isProcessing: false,
        error: null,
        theory: payload.theory,
        extractedContent: payload.content,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido.";

      setState({
        isProcessing: false,
        error: message,
        theory: null,
        extractedContent: "",
      });
    }
  };

  const resetInputs = () => {
    setText("");
    setFile(null);
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  };

  return (
    <main className="flex min-h-screen flex-col gap-10 px-4 py-10 sm:px-8 lg:px-16">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900/60 px-6 py-14 shadow-2xl ring-1 ring-white/10 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-cyan-500/10 px-4 py-1 text-sm font-medium text-cyan-200 ring-1 ring-cyan-500/30">
            Sintetizador Teórico Autônomo
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-snug tracking-tight text-slate-50 sm:text-5xl">
            Transforme ideias e reflexões em teorias guiadas por fórmulas
            matemáticas.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Carregue insights em texto, PDF ou áudio e receba um arcabouço
            matemático estruturado com variáveis, equações e propostas de
            experimentação científica.
          </p>
          <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Motor heurístico focado em física aplicada
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Processamento multimodal (texto, PDF, metadados de áudio)
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Exportação pronta para documentação
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">
              Escolha o tipo de entrada
            </h2>
            <p className="text-sm text-slate-400">
              O sintetizador ajusta os modelos de extração de acordo com o
              formato carregado.
            </p>
          </div>

          <div className="flex gap-3">
            {(["text", "pdf", "audio"] as Medium[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMedium(option);
                  setFile(null);
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  medium === option
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100 shadow-cyan-500/20"
                    : "border-white/10 bg-slate-800/60 text-slate-300 hover:border-white/20 hover:text-slate-50"
                }`}
              >
                {mediumLabels[option]}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
            <h3 className="text-base font-medium text-slate-100">
              Diretrizes do analisador
            </h3>
            <ul className="mt-2 space-y-1 text-slate-400">
              <li>1. Normalização e limpeza semântica do conteúdo base.</li>
              <li>
                2. Detecção de conceitos dominantes para gerar variáveis
                simbólicas.
              </li>
              <li>
                3. Construção de fórmulas físicas e matemáticas para descrevê-lo.
              </li>
              <li>4. Proposta de experimentos para validar a teoria.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl">
          {medium === "text" && (
            <label className="flex h-full flex-col gap-3">
              <span className="text-sm font-semibold text-slate-200">
                Cole ou escreva suas ideias
              </span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Descreva o fenômeno, hipótese ou reflexão a ser transformada em teoria..."
                className="h-48 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/30"
              />
            </label>
          )}

          {medium !== "text" && (
            <label className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-400/60 bg-cyan-500/10 p-8 text-center text-sm text-cyan-100">
              <input
                type="file"
                accept={medium === "pdf" ? ".pdf,application/pdf" : "audio/*"}
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files)}
              />
              <span className="rounded-full border border-cyan-400/50 px-4 py-1 text-xs uppercase tracking-wide">
                {mediumLabels[medium]}
              </span>
              <p className="max-w-sm text-base font-medium text-cyan-50">
                Arraste e solte ou navegue para selecionar um arquivo.
              </p>
              {file ? (
                <span className="text-xs text-cyan-200">{file.name}</span>
              ) : (
                <span className="text-xs text-cyan-200/70">
                  Suporte até 20 MB. O áudio é analisado via metadados técnicos.
                </span>
              )}
            </label>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPrimaryDisabled}
              className="flex-1 rounded-xl bg-cyan-400/90 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {state.isProcessing ? "Processando..." : "Gerar Fórmulas"}
            </button>
            <button
              type="button"
              onClick={resetInputs}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-slate-50"
            >
              Limpar
            </button>
          </div>

          {state.error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {state.error}
            </div>
          )}
        </div>
      </section>

      {state.theory && (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,400px)_1fr]">
          <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-lg">
            <header>
              <h2 className="text-xl font-semibold text-slate-100">
                Núcleo Teórico
              </h2>
              <p className="text-sm text-slate-400">
                Síntese original gerada a partir do conteúdo fornecido.
              </p>
            </header>

            <article className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
              <p>{state.theory.coreThesis}</p>
            </article>

            <div className="flex flex-wrap gap-3">
              <MetricBadge
                label="Complexidade"
                value={(state.theory.complexityScore * 100).toFixed(0) + "%"}
              />
              <MetricBadge
                label="Coerência"
                value={(state.theory.coherence * 100).toFixed(0) + "%"}
              />
              <MetricBadge
                label="Mídia"
                value={mediumLabels[state.theory.signalProfile.medium]}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
              <h3 className="mb-2 text-sm font-semibold text-slate-100">
                Conteúdo interpretado
              </h3>
              <p className="whitespace-pre-line">{state.extractedContent}</p>
            </div>

            <button
              type="button"
              onClick={() => state.theory && downloadTheory(state.theory)}
              className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Exportar síntese (.md)
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-100">
                Variáveis e fenômenos principais
              </h3>
              <ul className="mt-3 grid gap-3 text-sm text-slate-300 lg:grid-cols-2">
                {state.theory.phenomena.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-100">
                Fórmulas derivadas
              </h3>
              <div className="mt-3 grid gap-4">
                {state.theory.derivedFormulas.map((formula) => (
                  <article
                    key={formula.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <h4 className="text-base font-semibold text-slate-100">
                      {formula.title}
                    </h4>
                    <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900/80 p-3 font-mono text-sm text-cyan-100">
                      {formula.expression}
                    </pre>
                    <p className="mt-3 text-sm text-slate-300">
                      {formula.explanation}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-100">
                Modelos de sistema
              </h3>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {state.theory.systemModels.map((model) => (
                  <div
                    key={model.name}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300"
                  >
                    <p className="text-base font-semibold text-slate-100">
                      {model.name}
                    </p>
                    <p className="mt-2 font-mono text-cyan-100">
                      {model.governingEquation}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{model.focus}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Etapas de inferência
                  </h3>
                  <ol className="mt-3 space-y-3 text-sm text-slate-300">
                    {state.theory.inferenceSteps.map((step, index) => (
                      <li key={step} className="flex gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-200">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Experimentos sugeridos
                  </h3>
                  <ul className="mt-3 space-y-3 text-sm text-slate-300">
                    {state.theory.recommendedExperiments.map((experiment) => (
                      <li
                        key={experiment}
                        className="rounded-2xl border border-emerald-400/10 bg-emerald-500/10 px-4 py-3 text-emerald-100"
                      >
                        {experiment}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-100">
                Parâmetros resumidos
              </h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {state.theory.parameterTable.map((parameter) => (
                  <div
                    key={parameter.label}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300"
                  >
                    <p className="font-semibold text-slate-100">
                      {parameter.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {parameter.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

type MetricBadgeProps = {
  label: string;
  value: string;
};

const MetricBadge = ({ label, value }: MetricBadgeProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
    <span className="text-xs uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span className="text-sm font-semibold text-slate-100">{value}</span>
  </div>
);
