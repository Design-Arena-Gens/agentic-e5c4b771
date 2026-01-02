import { NextResponse } from "next/server";
import { synthesizeTheory, type SourceMeta } from "@/lib/theoryBuilder";

const textFromPdf = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfModule = await import("pdf-parse");
  const parser =
    "default" in pdfModule
      ? (pdfModule.default as (data: Buffer) => Promise<{ text: string }>)
      : (pdfModule as unknown as (data: Buffer) => Promise<{ text: string }>);
  const { text } = await parser(buffer);
  return text.replace(/\s+/g, " ").trim();
};

const textFromAudio = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { parseBuffer } = await import("music-metadata");

  const metadata = await parseBuffer(buffer, {
    mimeType: file.type,
    size: buffer.length,
  });

  const duration = metadata.format.duration
    ? metadata.format.duration.toFixed(2)
    : undefined;
  const bitrate = metadata.format.bitrate
    ? (metadata.format.bitrate / 1000).toFixed(1)
    : undefined;
  const sampleRate = metadata.format.sampleRate
    ? `${metadata.format.sampleRate} Hz`
    : undefined;

  const description: string[] = [];
  if (duration) {
    description.push(`duração aproximada ${duration}s`);
  }
  if (sampleRate) {
    description.push(`taxa de amostragem ${sampleRate}`);
  }
  if (bitrate) {
    description.push(`bitrate ${bitrate} kbps`);
  }

  const base =
    "Transcrição analítica baseada em metadados do arquivo de áudio carregado.";
  const metrics =
    description.length > 0
      ? ` O sinal apresenta ${description.join(", ")}.`
      : " Parâmetros técnicos não fornecidos pelo arquivo.";

  return `${base}${metrics} A narrativa sugere investigar correlações fenomenológicas a partir do sinal capturado.`;
};

export async function POST(req: Request) {
  const formData = await req.formData();
  const medium = formData.get("medium");

  if (!medium || typeof medium !== "string") {
    return NextResponse.json(
      { error: "Formato de entrada não informado." },
      { status: 400 },
    );
  }

  let content = "";
  let sourceMeta: SourceMeta = {
    medium: medium as SourceMeta["medium"],
    length: 0,
  };

  try {
    if (medium === "text") {
      const raw = formData.get("text");
      if (!raw || typeof raw !== "string") {
        return NextResponse.json(
          { error: "Texto não fornecido." },
          { status: 400 },
        );
      }
      content = raw;
      sourceMeta = {
        medium: "text",
        length: raw.length,
      };
    } else if (medium === "pdf") {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Arquivo PDF não encontrado." },
          { status: 400 },
        );
      }
      content = await textFromPdf(file);
      sourceMeta = {
        medium: "pdf",
        length: content.length,
        contextTag: file.name,
      };
    } else if (medium === "audio") {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Arquivo de áudio não encontrado." },
          { status: 400 },
        );
      }
      content = await textFromAudio(file);
      sourceMeta = {
        medium: "audio",
        length: content.length,
        contextTag: file.name,
        additionalNotes: ["Transcrição sintética gerada via metadados."],
      };
    } else {
      return NextResponse.json(
        { error: "Tipo de entrada não suportado." },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Nenhum conteúdo pôde ser extraído." },
        { status: 422 },
      );
    }

    const theory = synthesizeTheory(content, sourceMeta);

    return NextResponse.json({
      content,
      theory,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Falha ao processar a entrada. Verifique o arquivo ou tente novamente.",
      },
      { status: 500 },
    );
  }
}
