import React from 'react';
import { Button } from './button';

interface DropzoneProps {
  accept?: string;
  onDrop: (files: File[]) => void;
  file: File | null;
}

const Dropzone: React.FC<DropzoneProps> = ({ accept = 'application/pdf', onDrop, file }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(f => f.type === accept);
      onDrop(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === accept);
    onDrop(files);
  };

  return (
    <div
      className="border-2 border-dashed border-muted rounded-md p-6 text-center cursor-pointer bg-muted/30 hover:bg-muted/50 transition"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      {file ? (
        <div className="text-sm font-medium">Selected file: {file.name}</div>
      ) : (
        <div className="text-muted-foreground">Drag and drop a PDF file here, or click to select</div>
      )}
    </div>
  );
};

export default Dropzone; 