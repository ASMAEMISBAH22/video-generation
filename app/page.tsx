"use client";

import { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, Video, Image as ImageIcon, Camera, Film, Play, Pause, FastForward } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';

// Helper function to generate deterministic random numbers
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return Number((x - Math.floor(x)).toFixed(3));
};

export default function Home() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  
  // Video generation states
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate consistent random values for animations
  const backgroundElements = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      width: 100 + seededRandom(i * 1) * 100,
      height: 100 + seededRandom(i * 2) * 100,
      left: seededRandom(i * 3) * 100,
      top: seededRandom(i * 4) * 100,
      rotate: seededRandom(i * 5) * 360,
      duration: 10 + seededRandom(i * 6) * 10,
      delay: seededRandom(i * 7) * 10
    }));
  }, []);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
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

  const handleVideoClick = () => {
    setShowVideoDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Dynamic Media Background */}
      <div className="absolute inset-0 opacity-20">
        {/* Floating Media Frames */}
        {backgroundElements.map((element, i) => (
          <div
            key={`frame-${i}`}
            className="absolute rounded-lg border-2 border-white/20 backdrop-blur-sm"
            style={{
              width: `${element.width}px`,
              height: `${element.height}px`,
              left: `${element.left}%`,
              top: `${element.top}%`,
              transform: `rotate(${element.rotate}deg)`,
              animation: `float ${element.duration}s infinite linear`,
              animationDelay: `-${element.delay}s`,
            }}
          >
            {i % 2 === 0 ? (
              <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/30" />
            ) : (
              <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/30" />
            )}
        </div>
        ))}

        {/* Animated Processing Lines */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={`line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                width: '100%',
                top: `${(i / 15) * 100}%`,
                animation: `processLine ${3 + seededRandom(i * 10) * 4}s infinite linear`,
                animationDelay: `-${seededRandom(i * 11) * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Media Control Icons */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`control-${i}`}
            className="absolute"
            style={{
              left: `${seededRandom(i * 12) * 100}%`,
              top: `${seededRandom(i * 13) * 100}%`,
              animation: `pulse ${2 + seededRandom(i * 14) * 2}s infinite ease-in-out`,
              animationDelay: `-${seededRandom(i * 15) * 2}s`,
            }}
          >
            {i % 3 === 0 ? (
              <Play className="w-6 h-6 text-white/20" />
            ) : i % 3 === 1 ? (
              <Pause className="w-6 h-6 text-white/20" />
            ) : (
              <FastForward className="w-6 h-6 text-white/20" />
            )}
          </div>
        ))}

        {/* Camera Shutter Animation */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`camera-${i}`}
            className="absolute"
            style={{
              left: `${seededRandom(i * 16) * 100}%`,
              top: `${seededRandom(i * 17) * 100}%`,
              animation: `shutterClick ${4 + seededRandom(i * 18) * 4}s infinite`,
              animationDelay: `-${seededRandom(i * 19) * 4}s`,
            }}
          >
            <Camera className="w-8 h-8 text-white/20" />
        </div>
        ))}

        {/* Processing Circles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full border border-white/10"
            style={{
              width: `${20 + seededRandom(i * 20) * 40}px`,
              height: `${20 + seededRandom(i * 21) * 40}px`,
              left: `${seededRandom(i * 22) * 100}%`,
              top: `${seededRandom(i * 23) * 100}%`,
              animation: `spin ${10 + seededRandom(i * 24) * 10}s infinite linear`,
            }}
          >
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-white/20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Add these styles to your globals.css */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -20px) rotate(5deg); }
          50% { transform: translate(0, -40px) rotate(0deg); }
          75% { transform: translate(-20px, -20px) rotate(-5deg); }
        }

        @keyframes processLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.2); }
        }

        @keyframes shutterClick {
          0%, 100% { opacity: 0.1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.3; transform: scale(1.1) rotate(180deg); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-purple-900/60" />
      
      {/* Static Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(139,92,246,0.15),transparent_50%)]" />
      
      {/* Animated Background Dots representing global connections */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${seededRandom(i * 25) * 100}%`,
              top: `${seededRandom(i * 26) * 100}%`,
              animationDelay: `${seededRandom(i * 27) * 5}s`,
              animationDuration: `${2 + seededRandom(i * 28) * 3}s`
            }}
          />
        ))}
        {[...Array(40)].map((_, i) => (
          <div
            key={`purple-${i}`}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
            style={{
              left: `${seededRandom(i * 29) * 100}%`,
              top: `${seededRandom(i * 30) * 100}%`,
              animationDelay: `${seededRandom(i * 31) * 4}s`,
              animationDuration: `${1.5 + seededRandom(i * 32) * 2.5}s`
            }}
          />
        ))}
        {[...Array(30)].map((_, i) => (
          <div
            key={`green-${i}`}
            className="absolute w-0.5 h-0.5 bg-green-400 rounded-full animate-pulse"
            style={{
              left: `${seededRandom(i * 33) * 100}%`,
              top: `${seededRandom(i * 34) * 100}%`,
              animationDelay: `${seededRandom(i * 35) * 6}s`,
              animationDuration: `${2.5 + seededRandom(i * 36) * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
            Pollo AI
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
            Unleash your creativity across cultures and continents with next-generation AI-powered content generation
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
            Connecting global perspectives through intelligent creation
          </p>
        </div>

        {/* Dashboard Buttons */}
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-4xl">
          {/* Image Generation Button */}
          <div 
            className="flex-1 group cursor-pointer"
            onMouseEnter={() => setHoveredButton('image')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div className={`
              relative p-8 rounded-2xl backdrop-blur-md bg-gradient-to-br from-blue-900/40 to-purple-900/40
              border border-blue-500/30 hover:border-blue-400/60 transition-all duration-500
              transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25
              ${hoveredButton === 'image' ? 'scale-105 shadow-2xl shadow-blue-500/25' : ''}
            `}>
              {/* Icon */}
              <div className="relative mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Content */}
              <div className="relative text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  Image Generation
                </h3>
                <h4 className="text-xl md:text-2xl font-semibold text-blue-300 mb-4">
                  Dashboard
                </h4>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Transform your ideas into stunning visuals that celebrate global diversity and cultural richness
                </p>
              </div>
            </div>
          </div>

          {/* Video Generation Button */}
          <div 
            className="flex-1 group cursor-pointer"
            onMouseEnter={() => setHoveredButton('video')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={handleVideoClick}
          >
            <div className={`
              relative p-8 rounded-2xl backdrop-blur-md bg-gradient-to-br from-purple-900/40 to-blue-900/40
              border border-purple-500/30 hover:border-purple-400/60 transition-all duration-500
              transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25
              ${hoveredButton === 'video' ? 'scale-105 shadow-2xl shadow-purple-500/25' : ''}
            `}>
              {/* Icon */}
              <div className="relative mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Video className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Content */}
              <div className="relative text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  Video Generation
                </h3>
                <h4 className="text-xl md:text-2xl font-semibold text-purple-300 mb-4">
                  Dashboard
                </h4>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Create dynamic video content that bridges cultures and tells stories from around the world
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            Powered by advanced AI technology • Celebrating global creativity and unity
          </p>
        </div>
      </div>

      {/* Video Generation Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl w-full">
          <DialogTitle>Video Generation</DialogTitle>
          <DialogDescription>Generate a video from your image using AI</DialogDescription>
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
        </DialogContent>
      </Dialog>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}