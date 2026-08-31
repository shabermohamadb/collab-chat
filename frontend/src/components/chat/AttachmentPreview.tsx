import React, { useState } from 'react';
import { Attachment } from '../../types/index.ts';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';

interface AttachmentPreviewProps {
  attachment: Attachment;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isImage = attachment.fileType.startsWith('image/');
  const fullUrl = attachment.fileUrl;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-2">
      {isImage ? (
        <>
          <div
            onClick={() => setLightboxOpen(true)}
            className="group relative max-w-sm rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer shadow-sm"
          >
            <img
              src={fullUrl}
              alt={attachment.fileName}
              className="max-h-64 w-auto object-cover rounded-md transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="p-2 rounded-full bg-zinc-900/80 text-zinc-100 hover:text-white transition-colors">
                <Eye size={18} />
              </span>
              <a
                href={fullUrl}
                download={attachment.fileName}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full bg-zinc-900/80 text-zinc-100 hover:text-white transition-colors"
                title="Download image"
              >
                <Download size={18} />
              </a>
            </div>
          </div>

          {/* Lightbox */}
          {lightboxOpen && (
            <div
              onClick={() => setLightboxOpen(false)}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
            >
              <img
                src={fullUrl}
                alt={attachment.fileName}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 max-w-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-zinc-200 truncate">{attachment.fileName}</p>
              <p className="text-[10px] text-zinc-500">{formatFileSize(attachment.fileSize)}</p>
            </div>
          </div>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.fileName}
            className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
            title="Download file"
          >
            <Download size={16} />
          </a>
        </div>
      )}
    </div>
  );
};
