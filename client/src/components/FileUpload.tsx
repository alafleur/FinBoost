
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File, Image, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileSize: number) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUpload({ 
  onFileUploaded, 
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  maxSize = 10,
  className = ""
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size
      if (selectedFile.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `File size must be less than ${maxSize}MB`,
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setUploaded(false);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('proofFile', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      if (response.ok) {
        const data = await response.json();
        setUploadProgress(100);
        setUploaded(true);
        
        toast({
          title: "File uploaded successfully! ✅",
          description: `${file.name} has been uploaded.`,
        });

        onFileUploaded(data.fileUrl, data.fileName, data.fileSize);
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploaded(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8 text-gray-400" />;
    
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Label>Upload Proof Document</Label>
          
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">Images, PDF, Word documents up to {maxSize}MB</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {getFileIcon()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploading && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                </div>
              )}

              {uploaded && (
                <div className="mt-3 flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-1" />
                  <span className="text-sm">Upload complete</span>
                </div>
              )}

              {!uploaded && !uploading && (
                <Button
                  onClick={uploadFile}
                  className="w-full mt-3"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
