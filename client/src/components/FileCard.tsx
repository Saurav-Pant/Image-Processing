import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileCardProps {
  file: File & { preview: string };
  onRemove: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-background rounded-md">
      <div className="flex items-center space-x-2">
        <img src={file.preview} alt={file.name} className="w-10 h-10 object-cover rounded" />
        <span className="text-sm font-medium">{file.name}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FileCard;