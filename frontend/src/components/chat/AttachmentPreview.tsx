import React, { useState } from 'react';
import { Attachment } from '../../types/index.ts';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';

interface AttachmentPreviewProps {
  attachment: Attachment;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isImage = attachment.fileType.startsWith('image/');
  const fullUrl = attachment.fileUrl.startsWith('http')
    ? attachment.fileUrl
    : `http://localhost:5000${attachment.fileUrl}`;

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
              className="max-h-60 w-auto object-cover group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <span className="p-1.5 rounded-full bg-zinc-900/80 text-white">
                <Eye size={16} />
              </span>
            </div>
          </div>

          {/* Lightbox Modal */}
          {lightboxOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightboxOpen(false)}
            >
              <img
                src={fullUrl}
                alt={attachment.fileName}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}
        </>
      ) : (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.fileName}
          className="flex items-center gap-3 p-2.5 max-w-xs rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors group"
        >
          <div className="p-2 rounded-md bg-zinc-900 text-teal-400">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-teal-400 transition-colors">
              {attachment.fileName}
            </div>
            <div className="text-[10px] text-zinc-400">{formatFileSize(attachment.fileSize)}</div>
          </div>
          <Download size={15} className="text-zinc-500 group-hover:text-zinc-300" />
        </a>
      )}
    </div>
  );
};
