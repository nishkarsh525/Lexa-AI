import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileText, LoaderCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, extractApiErrorMessage } from "@/lib/api";

const UploadDocument = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const fileDetails = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
    };
  }, [selectedFile]);

  const chooseFile = (file: File | null) => {
    setError("");
    setStatusMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && !file.name.toLowerCase().endsWith(".docx")) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Select a contract file first.");
      return;
    }

    setIsUploading(true);
    setError("");
    setStatusMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post("/contracts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatusMessage("Contract uploaded and indexed successfully.");
      navigate(`/dashboard/documents?contractId=${response.data.id}`);
    } catch (error: unknown) {
      setError(extractApiErrorMessage(error, "Upload failed."));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Upload Document</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a contract for AI analysis</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileInput}
      />

      <motion.div
        className={`glass rounded-2xl p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          chooseFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Drag and drop your contract</h3>
        <p className="text-sm text-muted-foreground mb-6">Supports PDF and DOCX files up to 50MB</p>
        <Button variant="default" type="button">
          Browse Files
        </Button>
      </motion.div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/40">
          <h2 className="font-semibold">Ready To Upload</h2>
        </div>
        <div className="p-5 space-y-4">
          {fileDetails ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{fileDetails.name}</div>
                  <div className="text-xs text-muted-foreground">{fileDetails.size}</div>
                </div>
              </div>
              <Check className="w-5 h-5 text-primary" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Choose a file to begin indexing.</p>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {statusMessage ? <p className="text-sm text-primary">{statusMessage}</p> : null}

          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              "Analyze Contract"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
