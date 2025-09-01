"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { EyeIcon, TrashBinIcon, FileIcon } from "@/icons";
import Button from "@/components/ui/button/Button";

interface FileUploadProps {
  fileTypes?: string[];
  fileSize?: number; // in MB
  required?: boolean;
  bucket: string;
  onFileUpload: (fileUrl: string) => void;
  onFileDelete?: () => void;
  className?: string;
  label?: string;
  currentFileUrl?: string;
}

export default function FileUpload({
  fileTypes = ["image/*", "application/pdf"],
  fileSize = 5,
  required = false,
  bucket,
  onFileUpload,
  onFileDelete,
  className = "",
  label = "Upload File",
  currentFileUrl,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(currentFileUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (fileTypes.length > 0 && !fileTypes.some(type => {
      if (type === "image/*") return file.type.startsWith("image/");
      if (type === "application/pdf") return file.type === "application/pdf";
      return file.type === type;
    })) {
      setError(`Invalid file type. Allowed types: ${fileTypes.join(", ")}`);
      return;
    }

    // Validate file size
    if (fileSize && file.size > fileSize * 1024 * 1024) {
      setError(`File size must be less than ${fileSize}MB`);
      return;
    }

    setError(null);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;
      setUploadedFileUrl(fileUrl);
      onFileUpload(fileUrl);

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async () => {
    if (!uploadedFileUrl) return;

    try {
      // Extract filename from URL
      const fileName = uploadedFileUrl.split('/').pop();
      if (!fileName) return;

      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      setUploadedFileUrl(null);
      setPreviewUrl(null);
      setShowPreview(false);
      onFileDelete?.();

    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file. Please try again.");
    }
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  const isImage = uploadedFileUrl && (
    uploadedFileUrl.includes('.jpg') || 
    uploadedFileUrl.includes('.jpeg') || 
    uploadedFileUrl.includes('.png') || 
    uploadedFileUrl.includes('.gif') ||
    uploadedFileUrl.includes('.webp')
  );

  const isPdf = uploadedFileUrl && uploadedFileUrl.includes('.pdf');

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={fileTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        required={required && !uploadedFileUrl}
      />

      {/* Upload Button */}
      {!uploadedFileUrl && (
        <Button
          onClick={openFileInput}
          disabled={isUploading}
          className="w-full"
          size="sm"
        >
          <FileIcon className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Choose File"}
        </Button>
      )}

      {/* File Info and Actions */}
      {uploadedFileUrl && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {isImage ? (
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">IMG</span>
                  </div>
                ) : isPdf ? (
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 text-sm font-medium">PDF</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">FILE</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {uploadedFileUrl.split('/').pop()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  File uploaded successfully
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Preview Button */}
              {(isImage || isPdf) && (
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  size="sm"
                  variant="outline"
                >
                  <EyeIcon className="w-4 h-4" />
                </Button>
              )}
              
              {/* Delete Button */}
              <Button
                onClick={deleteFile}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <TrashBinIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {isImage && previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded-lg shadow-sm"
                  />
                </div>
              )}
              {isPdf && (
                <div className="flex justify-center">
                  <iframe
                    src={uploadedFileUrl}
                    className="w-full h-64 border border-gray-300 dark:border-gray-600 rounded-lg"
                    title="PDF Preview"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* File Type and Size Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Allowed types: {fileTypes.join(", ")}</p>
        <p>Max size: {fileSize}MB</p>
      </div>
    </div>
  );
} 