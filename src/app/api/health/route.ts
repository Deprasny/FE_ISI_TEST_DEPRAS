import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      PORT: process.env.PORT || '3000'
    };

    return NextResponse.json(
      { 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env,
        runtime: {
          platform: process.platform,
          version: process.version
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
} 