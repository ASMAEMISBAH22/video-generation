'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, Video, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VideoGenerationDashboard() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
      } else {
        setError('Please upload an image file');
      }
    }
  };

  const handleGenerate = async () => {
    if (!image || !prompt.trim()) {
      setError('Please provide both an image and a prompt');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setError(null);
    setGeneratedVideo(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      setProgress(100);
      setGeneratedVideo(data.videoUrl);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Video Generation Dashboard</h1>
          <p className="text-slate-300">Transform your images into stunning videos using AI</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Upload an image and provide a prompt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-4">
                <Label htmlFor="image">Source Image</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <div className="relative aspect-video">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded-lg object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Upload className="h-8 w-8 mb-2" />
                      <p>Click to upload an image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-4">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe how you want to transform the image into a video..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-32"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !image || !prompt.trim()}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Video'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>Generated video and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generating && (
                <div className="space-y-4">
                  <Progress value={progress} />
                  <p className="text-center text-sm text-muted-foreground">
                    Generating video... {progress}%
                  </p>
                </div>
              )}

              {generatedVideo && (
                <div className="space-y-4">
                  <video
                    src={generatedVideo}
                    controls
                    className="w-full rounded-lg"
                    poster={imagePreview || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {analysis && (
                <div className="space-y-2">
                  <Label>AI Analysis</Label>
                  <p className="text-sm text-muted-foreground">{analysis}</p>
                </div>
              )}

              {!generating && !generatedVideo && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Video className="h-8 w-8 mb-2" />
                  <p>Generated video will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 