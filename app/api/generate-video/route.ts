import { NextResponse } from 'next/server';
import Runway from '@runwayml/sdk';

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

    // Use the official SDK to create an image-to-video task with Gen-4 Turbo and wait for completion
    const task = await runway.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage: base64Image,
        promptText: promptText,
        duration: 5,
        ratio: '1280:720',
      })
      .waitForTaskOutput();

    console.log('Video generation completed!');
    console.log('Task result:', task);

    // Extract the video URL from the completed task
    const videoUrl = task.output && task.output.length > 0 
      ? task.output[0] 
      : null;

    if (!videoUrl) {
      throw new Error('No video URL found in completed task');
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      videoUrl: videoUrl,
      message: 'Video generated successfully with Gen-4 Turbo!',
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
      console.log('Direct API succeeded, but polling not implemented for fallback');

      return NextResponse.json({
        success: true,
        taskId: data.id,
        message: 'Gen-4 Turbo video generation started via direct API. Please check back later.',
        model: 'gen4_turbo',
        fallback: true,
        note: 'Polling not available with fallback method'
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
