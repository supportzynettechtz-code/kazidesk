/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileName?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileType = '',
  fileName = 'Nyaraka'
}) => {
  if (!isOpen) return null;

  const isPdf = fileType.includes('pdf') || fileUrl.includes('.pdf') || fileUrl.startsWith('data:application/pdf');
  const isImage = fileType.includes('image') || fileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp)/i.test(fileUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold truncate max-w-md">{title}</h3>
              <span className="text-[11px] text-slate-400 block truncate">{fileName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pakua (Download)</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="p-4 flex-1 overflow-auto bg-slate-950/50 flex items-center justify-center min-h-[350px]">
          {isImage ? (
            <img
              src={fileUrl}
              alt={title}
              className="max-h-[70vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-md"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={title}
              className="w-full h-[70vh] rounded-lg border border-slate-800 bg-white"
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">
                Onyesho la moja kwa moja halipatikani kwa aina hii ya faili.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Fungua Kwenye Kichupo Kipya (Open in New Tab)</span>
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
