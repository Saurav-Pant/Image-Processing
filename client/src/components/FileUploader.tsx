"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { UploadIcon } from "@radix-ui/react-icons";
import Dropzone, { FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import FileCard from "./FileCard";

interface FileWithPreview extends File {
  preview: string;
}

interface FileUploaderProps {
  maxFileCount?: number;
  maxSize?: number;
  onValueChange?: (files: FileWithPreview[]) => void;
}

export function FileUploader({
  maxFileCount = 1,
  maxSize = 8 * 1024 * 1024,
  onValueChange,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (files.length + acceptedFiles.length > maxFileCount) {
        toast.error(`Cannot upload more than ${maxFileCount} files`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      onValueChange?.([...files, ...newFiles]);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          if (errors[0]?.code === "file-too-large") {
            toast.error(`File ${file.name} is too large. Max size is ${formatBytes(maxSize)}`);
          } else {
            toast.error(`File ${file.name} was rejected`);
          }
        });
      }
    },
    [files, maxFileCount, maxSize, onValueChange]
  );

  const onRemove = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.filter((_, i) => i !== index);
      onValueChange?.(newFiles);
      return newFiles;
    });
  }, [onValueChange]);

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <Dropzone
        onDrop={onDrop}
        maxSize={maxSize}
        maxFiles={maxFileCount}
        multiple={maxFileCount > 1}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isDragActive && "border-muted-foreground/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
              <div className="rounded-full border border-dashed p-3">
                <UploadIcon className="size-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-px">
                <p className="font-medium text-muted-foreground">
                  Drag 'n' drop files here, or click to select files
                </p>
                <p className="text-sm text-muted-foreground/70">
                  You can upload up to {maxFileCount} files (max {formatBytes(maxSize)} each)
                </p>
              </div>
            </div>
          </div>
        )}
      </Dropzone>
      {files.length > 0 && (
        <ScrollArea className="h-fit w-full px-3">
          <div className="flex max-h-48 flex-col gap-4">
            {files.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onRemove={() => onRemove(index)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
