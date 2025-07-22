import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { LanguageModel, EmbeddingModel } from 'ai';

export type AIProvider = 'openai' | 'anthropic';
export type ModelType = 'chat' | 'embedding';

interface AIConfig {
  provider: AIProvider;
  chatModel: string;
  embeddingModel: string;
}

// Get configuration from environment variables with defaults
const getConfig = (): AIConfig => {
  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;
  
  return {
    provider,
    chatModel: process.env.AI_CHAT_MODEL || (provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4-turbo'),
    embeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
  };
};

const config = getConfig();

/**
 * Get the chat model based on current configuration
 */
export function getChatModel(): LanguageModel {
  switch (config.provider) {
    case 'anthropic':
      return anthropic(config.chatModel);
    case 'openai':
    default:
      return openai(config.chatModel);
  }
}

/**
 * Get the embedding model based on current configuration
 * Note: Currently only OpenAI provides embeddings, but this allows for future expansion
 */
export function getEmbeddingModel(): EmbeddingModel<string> {
  // For now, always use OpenAI for embeddings as Anthropic doesn't provide embedding models
  return openai.embedding(config.embeddingModel || 'text-embedding-3-small');
}

/**
 * Get current AI configuration
 */
export function getAIConfig(): AIConfig {
  return config;
}

/**
 * Check if a specific provider is available (has API key)
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  switch (provider) {
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}