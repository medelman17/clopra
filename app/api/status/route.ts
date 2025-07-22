import { NextResponse } from 'next/server';
import { getAIConfig, isProviderAvailable } from '@/lib/ai/config';

export async function GET() {
  const config = getAIConfig();
  
  return NextResponse.json({
    status: 'ok',
    ai: {
      currentProvider: config.provider,
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel,
      availableProviders: {
        openai: isProviderAvailable('openai'),
        anthropic: isProviderAvailable('anthropic'),
      },
    },
    environment: process.env.NODE_ENV,
  });
}