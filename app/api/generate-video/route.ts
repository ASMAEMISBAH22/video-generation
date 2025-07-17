import { NextResponse } from 'next/server';
import Runway from '@runwayml/sdk';

// In-memory store for tracking video generation tasks
let videoTasks: { [key: string]: any } = {};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const promptText = formData.get('prompt') as string | null;

    if (!imageFile || !promptText) {
      return NextResponse.json({ error: 'Image and prompt are required.' }, { status: 400 });
    }
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 });
    }

    // Convert image directly to base64 without saving to disk
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error('RUNWAY_API_KEY is not configured.');
    
    console.log('Using API key:', apiKey ? 'Yes' : 'No');

    // Initialize Runway SDK
    const runway = new Runway({
      apiKey: apiKey,
    });

    console.log('Creating video generation task with Gen-4 Turbo...');

    // Use the official SDK to create an image-to-video task with Gen-4 Turbo
    const task = await runway.imageToVideo.create({
      model: 'gen4_turbo',
      promptImage: base64Image,
      promptText: promptText,
      duration: 5,
      ratio: '1280:720',
    });

    console.log('Task created successfully:', task.id);

    // Store task info for polling
    videoTasks[task.id] = {
      id: task.id,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      taskId: task.id,
      status: 'pending',
      message: 'Gen-4 Turbo video generation started successfully.',
      model: 'gen4_turbo'
    });

  } catch (error) {
    console.error('Runway SDK error:', error);
    
    // If the SDK approach fails, let's try the raw API approach as fallback
    try {
      const formData = await request.formData();
      const imageFile = formData.get('image') as File | null;
      const promptText = formData.get('prompt') as string | null;
      
      const buffer = Buffer.from(await imageFile!.arrayBuffer());
      const base64Image = `data:${imageFile!.type};base64,${buffer.toString('base64')}`;
      const apiKey = process.env.RUNWAY_API_KEY;

      console.log('SDK failed, trying direct API with Gen-4 Turbo...');
      
      // Try direct API call with Gen-4 Turbo according to docs
      const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify({
          model: 'gen4_turbo',
          promptImage: base64Image,
          promptText: promptText,
          duration: 5,
          ratio: '1280:720',
          watermark: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct API also failed:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Direct API succeeded:', data);

      // Store task info for polling
      videoTasks[data.id] = {
        id: data.id,
        status: data.status || 'pending',
        progress: 0,
        createdAt: new Date(),
      };

      return NextResponse.json({
        success: true,
        taskId: data.id,
        status: data.status,
        message: 'Gen-4 Turbo video generation started via direct API.',
        model: 'gen4_turbo',
        fallback: true
      });

    } catch (fallbackError) {
      console.error('Both SDK and direct API failed:', fallbackError);
      return NextResponse.json(
        { 
          error: `Failed to generate video with Gen-4 Turbo. SDK Error: ${error instanceof Error ? error.message : 'Unknown'}. API Error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`,
          model: 'gen4_turbo'
        },
        { status: 500 }
      );
    }
  }
}

// GET endpoint to check task status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RUNWAY_API_KEY is not configured' }, { status: 500 });
    }

    // Initialize Runway SDK
    const runway = new Runway({
      apiKey: apiKey,
    });

    // Use direct API call to check status
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct API status check failed:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Direct API status check succeeded:', data);

    // Update our local task store
    if (videoTasks[taskId]) {
      videoTasks[taskId].status = data.status;
      videoTasks[taskId].progress = data.status === 'SUCCEEDED' ? 100 : 
                                    data.status === 'FAILED' ? 0 : 50;
      if (data.status === 'SUCCEEDED' && data.output) {
        videoTasks[taskId].videoUrl = data.output;
      }
      if (data.status === 'FAILED' && data.error) {
        videoTasks[taskId].error = data.error;
      }
    }

    return NextResponse.json({
      taskId: taskId,
      status: data.status.toLowerCase(),
      progress: data.status === 'SUCCEEDED' ? 100 : 
               data.status === 'FAILED' ? 0 : 50,
      videoUrl: data.status === 'SUCCEEDED' ? data.output : null,
      error: data.status === 'FAILED' ? data.error : null,
    });

  } catch (error) {
    console.error('Error checking task status:', error);
    return NextResponse.json(
      { error: 'Failed to check task status' },
      { status: 500 }
    );
  }
}