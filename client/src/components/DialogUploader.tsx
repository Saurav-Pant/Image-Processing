"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUploader } from "@/components/FileUploader";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useImage } from "./ImageContext";

interface FileWithPreview extends File {
  preview: string;
}

export function DialogUploaderDemo() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const router = useRouter();
  const { setSelectedImage } = useImage();

  const handleFileChange = (selectedFiles: FileWithPreview[]) => {
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
    }
  };

  const handleApplyProcessing = () => {
    if (files.length > 0) {
      setSelectedImage(files[0].preview);
      router.push("/Dashboard");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-black text-white font-semibold">
          Upload file {files.length > 0 && `(${files.length})`}
          {files.length > 0 && (
            <Image
              src={files[0].preview}
              width={24}
              height={24}
              alt="Upload files"
            />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Drag and drop your files here or click to browse.
          </DialogDescription>
        </DialogHeader>
        <FileUploader
          maxFileCount={1}
          maxSize={8 * 1024 * 1024}
          onValueChange={handleFileChange}
        />
        <Button onClick={handleApplyProcessing} disabled={files.length === 0}>
          Apply Processing
        </Button>
      </DialogContent>
    </Dialog>
  );
}
