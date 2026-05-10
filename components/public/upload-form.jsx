'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Loader as Loader2, Upload, Video, X } from 'lucide-react';

import {
  ACCEPTED_MIME_TYPES,
  getMaxFileSizeBytes,
  isVideoMimeType,
  MAX_IMAGE_UPLOADS_PER_BATCH,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_UPLOADS_PER_BATCH,
} from '@/lib/constants';
import { formatBytes } from '@/lib/format';

function buildPreviewItem(file) {
  return {
    file,
    id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    type: file.type.startsWith('image/') ? 'image' : 'video',
    duration: null,
  };
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Nao foi possivel validar a duracao de ${file.name}.`));
    };
    video.src = url;
  });
}

export function UploadForm() {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const filesRef = useRef([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, []);

  const addFiles = useCallback(async (incomingFiles) => {
    const selectedFiles = Array.from(incomingFiles || []);
    const nextFiles = [];
    let imageCount = filesRef.current.filter((item) => item.type === 'image').length;
    let videoCount = filesRef.current.filter((item) => item.type === 'video').length;
    let nextError = '';

    for (const file of selectedFiles) {
      let validatedDuration = null;

      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        nextError = `${file.name} possui um formato nao suportado.`;
        continue;
      }

      const maxFileSize = getMaxFileSizeBytes(file.type);
      if (file.size > maxFileSize) {
        nextError = `${file.name} excede o limite de ${Math.round(maxFileSize / (1024 * 1024))} MB.`;
        continue;
      }

      if (isVideoMimeType(file.type)) {
        if (videoCount >= MAX_VIDEO_UPLOADS_PER_BATCH) {
          nextError = `Envie no maximo ${MAX_VIDEO_UPLOADS_PER_BATCH} videos por vez.`;
          continue;
        }

        try {
          validatedDuration = await getVideoDuration(file);
          if (validatedDuration > MAX_VIDEO_DURATION_SECONDS) {
            nextError = `${file.name} excede o limite de 2 minutos.`;
            continue;
          }
        } catch (error) {
          nextError = error instanceof Error ? error.message : `Nao foi possivel validar ${file.name}.`;
          continue;
        }

        videoCount += 1;
      } else {
        if (imageCount >= MAX_IMAGE_UPLOADS_PER_BATCH) {
          nextError = `Envie no maximo ${MAX_IMAGE_UPLOADS_PER_BATCH} fotos por vez.`;
          continue;
        }

        imageCount += 1;
      }

      const previewItem = buildPreviewItem(file);
      if (isVideoMimeType(file.type)) {
        previewItem.duration = validatedDuration;
      }

      nextFiles.push(previewItem);
    }

    setErrorMessage(nextError);

    if (nextFiles.length > 0) {
      setFiles((current) => [...current, ...nextFiles]);
    }
  }, []);

  const removeFile = (fileId) => {
    setFiles((current) => {
      const next = current.filter((item) => item.id !== fileId);
      const removedItem = current.find((item) => item.id === fileId);
      if (removedItem?.preview) {
        URL.revokeObjectURL(removedItem.preview);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (files.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('message', message.trim());
    files.forEach((item) => {
      formData.append('files', item.file);
      formData.append('fileDurations', item.type === 'video' && item.duration != null ? String(item.duration) : '');
    });

    setUploading(true);
    setUploadState(null);
    setErrorMessage('');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Ocorreu um erro no envio.');
      }

      files.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
      setFiles([]);
      setName('');
      setMessage('');
      setUploadState('success');
    } catch (error) {
      setUploadState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro no envio.');
    } finally {
      setUploading(false);
    }
  };

  if (uploadState === 'success') {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-burgundy-100 bg-white p-8 text-center shadow-lg animate-slide-up sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/50" />
        <CheckCircle className="relative z-10 mx-auto mb-4 text-green-500" size={56} strokeWidth={1.5} />
        <h2 className="relative z-10 mb-3 font-playfair text-2xl text-burgundy-800">Enviado com sucesso!</h2>
        <p className="relative z-10 mb-8 font-lato text-muted-foreground">
          Obrigado por compartilhar este momento conosco.
        </p>
        <button
          type="button"
          onClick={() => setUploadState(null)}
          className="relative z-10 rounded-full bg-burgundy-800 px-8 py-3 font-lato text-sm text-white transition-all hover:bg-burgundy-700 hover:shadow-lg"
        >
          Enviar mais fotos
        </button>
      </section>
    );
  }

  return (
    <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h2 className="mb-6 text-center font-playfair text-2xl text-burgundy-800 sm:mb-8 md:text-3xl">
        Compartilhe Seu Momento
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(Array.from(event.dataTransfer.files));
          }}
          onClick={() => inputRef.current?.click()}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-10 ${dragOver
            ? 'scale-[1.02] border-burgundy-500 bg-burgundy-50'
            : 'border-burgundy-200 bg-white hover:border-burgundy-400 hover:bg-burgundy-50'
            }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-burgundy-50/30 opacity-0 transition-opacity group-hover:opacity-100" />
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_MIME_TYPES.join(',')}
            className="hidden"
            onChange={(event) => addFiles(Array.from(event.target.files || []))}
          />
          <Upload className="relative z-10 mx-auto mb-3 text-burgundy-400 transition-transform group-hover:scale-110" size={40} strokeWidth={1.5} />
          <p className="relative z-10 mb-1 font-playfair text-base text-burgundy-700 sm:text-lg">
            Clique ou arraste seus arquivos aqui
          </p>
          <p className="relative z-10 mx-auto max-w-xs font-lato text-xs text-muted-foreground sm:max-w-none sm:text-sm">
            Ate 10 fotos de 15 MB ou 3 videos de ate 2 minutos e 60 MB cada
          </p>
        </div>

        {files.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 animate-slide-up sm:grid-cols-3 sm:gap-4">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-burgundy-300 hover:shadow-lg"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-burgundy-400">
                    <Video size={32} strokeWidth={1.5} />
                    <span className="w-full truncate px-2 text-center font-lato text-xs">
                      {item.file.name}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile(item.id);
                  }}
                  className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 opacity-100 transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X size={14} className="text-burgundy-800" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="truncate font-lato text-xs text-white">{formatBytes(item.file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="relative space-y-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-burgundy-400/0 via-burgundy-400/5 to-burgundy-400/0 opacity-0 transition-opacity hover:opacity-100" />
          <h3 className="relative z-10 font-playfair text-lg text-burgundy-800">Seu recado (opcional)</h3>
          <div className="relative z-10">
            <label className="mb-1.5 block font-lato text-sm text-burgundy-700">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Como voce prefere ser chamado?"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 font-lato text-sm text-burgundy-900 transition-all placeholder:text-muted-foreground hover:border-burgundy-300 focus:outline-none focus:ring-2 focus:ring-burgundy-300"
            />
          </div>
          <div className="relative z-10">
            <label className="mb-1.5 block font-lato text-sm text-burgundy-700">Mensagem para os noivos</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Deixe um recado especial..."
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 font-lato text-sm text-burgundy-900 transition-all placeholder:text-muted-foreground hover:border-burgundy-300 focus:outline-none focus:ring-2 focus:ring-burgundy-300"
            />
          </div>
        </div>

        {uploadState === 'error' ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 animate-slide-up">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p className="font-lato text-sm">{errorMessage}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-burgundy-800 px-4 py-3.5 font-lato text-sm font-semibold text-white shadow-md transition-all hover:glow-button hover:bg-burgundy-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload size={18} />
              Enviar {files.length > 0 ? `${files.length} arquivo${files.length > 1 ? 's' : ''}` : 'arquivos'}
            </>
          )}
        </button>

        <p className="text-center font-lato text-xs text-muted-foreground">
          Ao enviar, voce concorda em compartilhar estas memorias com os noivos.
        </p>
      </form>
    </section>
  );
}
