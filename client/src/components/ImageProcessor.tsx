"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useImage } from "./ImageContext";
import Image from "next/image";
import { UploadIcon, DownloadIcon } from "@radix-ui/react-icons";
import Dropzone, { FileRejection } from "react-dropzone";
import { cn, formatBytes } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import FileCard from "./FileCard";
import { motion } from "framer-motion";

type OperationType = "resize" | "filter" | "brightness";

interface Operation {
  type: OperationType;
  size?: [number, number];
  filter_type?: string;
  factor?: number;
}

interface FileWithPreview extends File {
  preview: string;
}

const ImageProcessor: React.FC = () => {
  const { selectedImage, setSelectedImage } = useImage();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const maxFileCount = 1;
  const maxSize = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const handleOperationChange = (
    type: OperationType,
    value: Partial<Operation> | null
  ) => {
    setOperations((prev) => {
      const newOperations = prev.filter((op) => op.type !== type);
      if (value) {
        newOperations.push({ type, ...value });
      }
      return newOperations;
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
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
      setSelectedImage(newFiles[0].preview);

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
    [files, maxFileCount, maxSize, setSelectedImage]
  );

  const onRemove = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.filter((_, i) => i !== index);
      if (newFiles.length > 0) {
        setSelectedImage(newFiles[0].preview);
      } else {
        setSelectedImage(null);
      }
      return newFiles;
    });
    setProcessedImageUrl(null);
  }, [setSelectedImage]);

  const pollForProcessedImage = useCallback(async (jobId: string) => {
    const maxAttempts = 30;
    const interval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`http://localhost:8000/job_status/${jobId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.status === 'finished') {
          setProcessedImageUrl(data.processed_url);
          toast.success('Image processing completed');
          return;
        } else if (data.status === 'failed') {
          toast.error('Image processing failed');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Error polling for job status:', error);
        toast.error('Error checking processing status');
        return;
      }
    }

    toast.error('Image processing timed out');
  }, []);

  useEffect(() => {
    if (processedImageUrl) {
      console.log('Processed Image URL:', processedImageUrl);
    }
  }, [processedImageUrl]);

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("No image selected");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("operations", JSON.stringify(operations));

      const response = await fetch(`http://localhost:8000/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log("Response from server:", result);
      if (!result.job_id) {
        throw new Error("Job ID is missing from the server response.");
      }
      setJobId(result.job_id);
      toast.success(`Processing request sent. Job ID: ${result.job_id}`);
      pollForProcessedImage(result.job_id);
    } catch (error: any) {
      console.error("Processing error:", error);
      toast.error(`Failed to process image: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownload = async () => {
    if (processedImageUrl) {
      try {
        const response = await fetch(processedImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'processed_image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading image:', error);
        toast.error('Failed to download image');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-r from-indigo-50 to-purple-50"
    >
      <div className="w-1/3 p-6 bg-white shadow-lg rounded-r-2xl">
        <h2 className="text-3xl font-bold mb-6 text-indigo-700 border-b pb-2">Image Processing</h2>
        <div className="space-y-6">
          <Dropzone
            onDrop={onDrop}
            maxSize={maxSize}
            maxFiles={maxFileCount}
            multiple={false}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                className={cn(
                  "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-indigo-300 px-5 py-2.5 text-center transition hover:bg-indigo-50",
                  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
                  isDragActive && "border-indigo-500 bg-indigo-100"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed border-indigo-400 p-3 bg-indigo-50">
                    <UploadIcon className="size-7 text-indigo-500" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-px">
                    <p className="font-medium text-indigo-700">
                      Drag 'n' drop files here, or click to select files
                    </p>
                    <p className="text-sm text-indigo-500">
                      You can upload up to {maxFileCount} file (max {formatBytes(maxSize)})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Dropzone>
          {files.length > 0 && (
            <ScrollArea className="h-fit w-full px-3 max-h-48">
              <div className="flex flex-col gap-4">
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
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md border border-indigo-100">
              <Label className="flex items-center space-x-2 text-indigo-700 font-semibold">
                <Checkbox
                  checked={operations.some(op => op.type === "resize")}
                  onCheckedChange={(checked) =>
                    handleOperationChange("resize", checked ? { size: [100, 100] } : null)
                  }
                />
                <span>Resize</span>
              </Label>
              {operations.some(op => op.type === "resize") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-2 mt-2"
                >
                  <Input
                    type="number"
                    placeholder="Width"
                    value={operations.find(op => op.type === "resize")?.size?.[0] || ""}
                    onChange={(e) =>
                      handleOperationChange("resize", {
                        size: [parseInt(e.target.value), operations.find(op => op.type === "resize")?.size?.[1] || 100],
                      })
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={operations.find(op => op.type === "resize")?.size?.[1] || ""}
                    onChange={(e) =>
                      handleOperationChange("resize", {
                        size: [operations.find(op => op.type === "resize")?.size?.[0] || 100, parseInt(e.target.value)],
                      })
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </motion.div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md border border-indigo-100">
              <Label className="flex items-center space-x-2 text-indigo-700 font-semibold">
                <Checkbox
                  checked={operations.some(op => op.type === "filter")}
                  onCheckedChange={(checked) =>
                    handleOperationChange("filter", checked ? { filter_type: "grayscale" } : null)
                  }
                />
                <span>Apply Filter</span>
              </Label>
              {operations.some(op => op.type === "filter") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-2 mt-2"
                >
                  <Select
                    onValueChange={(value) =>
                      handleOperationChange("filter", { filter_type: value })
                    }
                  >
                    <SelectTrigger className="w-full border-indigo-200 focus:border-indigo-500">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sharpen">Sharpen</SelectItem>
                      <SelectItem value="blur">Blur</SelectItem>
                      <SelectItem value="edge_enhance">Edge Enhance</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md border border-indigo-100">
              <Label className="flex items-center space-x-2 text-indigo-700 font-semibold">
                <Checkbox
                  checked={operations.some(op => op.type === "brightness")}
                  onCheckedChange={(checked) =>
                    handleOperationChange("brightness", checked ? { factor: 1.5 } : null)
                  }
                />
                <span>Adjust Brightness</span>
              </Label>
              {operations.some(op => op.type === "brightness") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-2 mt-2"
                >
                  <Input
                    type="number"
                    placeholder="Factor"
                    value={operations.find(op => op.type === "brightness")?.factor || ""}
                    onChange={(e) =>
                      handleOperationChange("brightness", {
                        factor: parseFloat(e.target.value),
                      })
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </motion.div>
              )}
            </div>
          </div>
          <Button
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Submit"}
          </Button>
        </div>
      </div>
      {selectedImage && (
        <div className="w-2/3 p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-[400px] my-8">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Original Image</h2>
            <div className="relative aspect-square overflow-hidden rounded-md">
              <Image
                src={selectedImage}
                alt="Original"
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
          {isLoading ? (
            <div className="w-full max-w-[400px]">
              <h2 className="text-2xl font-bold mb-4 text-indigo-700">Processing...</h2>
              <div className="flex justify-center items-center h-[400px] bg-white rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            </div>
          ) : processedImageUrl ? (
            <div className="w-full max-w-[400px]">
              <h2 className="text-2xl font-bold mb-4 text-indigo-700">Processed Image</h2>
              <div className="relative aspect-square overflow-hidden rounded-md">
                <Image
                  src={processedImageUrl}
                  alt="Processed"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
              <Button
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                onClick={handleDownload}
                disabled={!processedImageUrl}
              >
                Download Processed Image
              </Button>
            </div>
          ) :(
              <div className="flex justify-center items-center">
                <p>Loading....</p>
              </div>
            )
          }

        </div>
      )}
    </motion.div>
  );
};

export default ImageProcessor;