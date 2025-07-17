# AI Video Generation Dashboard

A modern web application that transforms static images into dynamic videos using AI-powered video generation with Runway ML's Gen-4 Turbo model.

![Video Generation Success](https://raw.githubusercontent.com/yourusername/ai-video-generator/main/demo-image.png)

## ✨ Features

- **Image-to-Video Generation**: Transform static images into dynamic 5-second videos
- **AI-Powered**: Uses Runway ML's Gen-4 Turbo model for high-quality video generation
- **Real-time Progress Tracking**: Live progress updates during video generation
- **Modern UI**: Beautiful, responsive interface with real-time status updates
- **Asynchronous Processing**: Non-blocking video generation with automatic polling
- **Error Handling**: Comprehensive error handling and user feedback
- **Multiple Entry Points**: Main dashboard and popup dialog interfaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Runway ML API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-video-generator.git
   cd ai-video-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Runway ML API key:
   ```env
   RUNWAY_API_KEY=your_runway_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 How to Use

1. **Upload an Image**: Click to upload or drag & drop an image file
2. **Add a Prompt**: Describe how you want the image to be animated
3. **Generate Video**: Click "Generate Video" and wait for processing
4. **Watch Progress**: Monitor real-time progress updates
5. **View Result**: Your generated video will automatically appear when ready

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **API**: Runway ML Gen-4 Turbo
- **Video Processing**: Asynchronous with status polling

## 📁 Project Structure

```
project/
├── app/
│   ├── api/
│   │   └── generate-video/
│   │       └── route.ts          # Video generation API endpoint
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard page
│   └── page.tsx                  # Home page with popup dialog
├── components/
│   └── ui/                       # Reusable UI components
├── public/                       # Static assets
└── README.md
```

## 🔧 API Endpoints

### POST `/api/generate-video`
Starts video generation from an image and prompt.

**Request:**
- `image`: Image file (FormData)
- `prompt`: Text description (string)

**Response:**
```json
{
  "success": true,
  "taskId": "task-uuid",
  "status": "pending",
  "message": "Video generation started successfully"
}
```

### GET `/api/generate-video?taskId={id}`
Checks the status of a video generation task.

**Response:**
```json
{
  "taskId": "task-uuid",
  "status": "succeeded",
  "progress": 100,
  "videoUrl": "https://...",
  "error": null
}
```

## 🎨 Supported Features

- **Image Formats**: JPEG, PNG, WebP
- **Video Output**: MP4, 5-second duration
- **Aspect Ratios**: 
  - Landscape: 1280:720, 1584:672, 1104:832
  - Portrait: 720:1280, 832:1104  
  - Square: 960:960
- **Max Image Size**: 16MB
- **Processing Time**: 30 seconds to 5 minutes

## 🔍 Status Codes

- `pending`: Video generation queued
- `processing`: Video being generated
- `succeeded`/`completed`: Video ready
- `failed`: Generation failed

## ⚠️ Error Handling

The application includes comprehensive error handling for:
- Invalid file types
- Missing API keys
- Network timeouts
- Generation failures
- API rate limiting

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard:
   - `RUNWAY_API_KEY`: Your Runway ML API key
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RUNWAY_API_KEY` | Your Runway ML API key | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Runway ML](https://runwayml.com/) for the Gen-4 Turbo model
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/ai-video-generator/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about the error and steps to reproduce

---

**Made with ❤️ and AI** - Transform your images into videos with the power of AI! 