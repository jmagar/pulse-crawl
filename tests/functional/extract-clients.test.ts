import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
  AnthropicExtractClient,
  OpenAIExtractClient,
  OpenAICompatibleExtractClient,
  ExtractClientFactory,
} from '../../shared/processing/extraction/index.js';
import type { LLMConfig } from '../../shared/processing/extraction/types.js';

// Mock the SDK modules with proper factory functions
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

// Import mocked modules after mocking them
const { default: Anthropic } = await import('@anthropic-ai/sdk');
const { default: OpenAI } = await import('openai');

// Type the mocked SDK instances
type AnthropicInstance = {
  messages: {
    create: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };
};

type OpenAIInstance = {
  chat: {
    completions: {
      create: MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    };
  };
};

type AnthropicConstructor = MockedFunction<(config: { apiKey: string }) => AnthropicInstance>;
type OpenAIConstructor = MockedFunction<
  (config: { apiKey: string; baseURL?: string }) => OpenAIInstance
>;

const MockedAnthropic = Anthropic as unknown as AnthropicConstructor;
const MockedOpenAI = OpenAI as unknown as OpenAIConstructor;

describe('Extract Clients', () => {
  const mockContent = '<html><body><h1>Test Article</h1><p>This is test content.</p></body></html>';
  const mockQuery = 'Extract the article title';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AnthropicExtractClient', () => {
    it('should extract content successfully', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test Article' }],
      });

      MockedAnthropic.mockReturnValue({
        messages: { create: mockCreate },
      } as AnthropicInstance);

      const config: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-api-key',
      };

      const client = new AnthropicExtractClient(config);
      const result = await client.extract(mockContent, mockQuery);

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test Article');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0,
        system: expect.stringContaining('expert at extracting'),
        messages: [
          {
            role: 'user',
            content: expect.stringContaining(mockContent),
          },
        ],
      });
    });

    it('should handle extraction errors', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

      MockedAnthropic.mockReturnValue({
        messages: { create: mockCreate },
      } as AnthropicInstance);

      const config: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-api-key',
      };

      const client = new AnthropicExtractClient(config);
      const result = await client.extract(mockContent, mockQuery);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Anthropic extraction failed: API Error');
    });

    it('should use custom model if provided', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test Article' }],
      });

      MockedAnthropic.mockReturnValue({
        messages: { create: mockCreate },
      } as AnthropicInstance);

      const config: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
      };

      const client = new AnthropicExtractClient(config);
      await client.extract(mockContent, mockQuery);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
        })
      );
    });
  });

  describe('OpenAIExtractClient', () => {
    it('should extract content successfully', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Test Article' } }],
      });

      MockedOpenAI.mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as OpenAIInstance);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-api-key',
      };

      const client = new OpenAIExtractClient(config);
      const result = await client.extract(mockContent, mockQuery);

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test Article');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        max_tokens: 4096,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('expert at extracting'),
          },
          {
            role: 'user',
            content: expect.stringContaining(mockContent),
          },
        ],
      });
    });

    it('should handle empty response', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      MockedOpenAI.mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as OpenAIInstance);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-api-key',
      };

      const client = new OpenAIExtractClient(config);
      const result = await client.extract(mockContent, mockQuery);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No content extracted from OpenAI response');
    });
  });

  describe('OpenAICompatibleExtractClient', () => {
    it('should extract content successfully with custom base URL', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Test Article' } }],
      });

      MockedOpenAI.mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as OpenAIInstance);

      const config: LLMConfig = {
        provider: 'openai-compatible',
        apiKey: 'test-api-key',
        model: 'llama-3-70b',
        apiBaseUrl: 'https://api.together.xyz/v1',
      };

      const client = new OpenAICompatibleExtractClient(config);
      const result = await client.extract(mockContent, mockQuery);

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test Article');
      expect(MockedOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: 'https://api.together.xyz/v1',
      });
    });

    it('should require base URL', () => {
      const config: LLMConfig = {
        provider: 'openai-compatible',
        apiKey: 'test-api-key',
        model: 'llama-3-70b',
      };

      expect(() => new OpenAICompatibleExtractClient(config)).toThrow(
        'API base URL is required for OpenAI-compatible provider'
      );
    });

    it('should require model name', () => {
      const config: LLMConfig = {
        provider: 'openai-compatible',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://api.together.xyz/v1',
      };

      expect(() => new OpenAICompatibleExtractClient(config)).toThrow(
        'Model name is required for OpenAI-compatible provider'
      );
    });
  });

  describe('ExtractClientFactory', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    it('should create client from environment variables', () => {
      process.env.LLM_PROVIDER = 'anthropic';
      process.env.LLM_API_KEY = 'test-key';
      process.env.LLM_MODEL = 'claude-3-opus-20240229';

      MockedAnthropic.mockReturnValue({
        messages: { create: vi.fn() },
      } as AnthropicInstance);

      const client = ExtractClientFactory.createFromEnv();
      expect(client).toBeInstanceOf(AnthropicExtractClient);
    });

    it('should return null if no environment config', () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_API_KEY;

      const client = ExtractClientFactory.createFromEnv();
      expect(client).toBeNull();
    });

    it('should check availability correctly', () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_API_KEY;
      expect(ExtractClientFactory.isAvailable()).toBe(false);

      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      expect(ExtractClientFactory.isAvailable()).toBe(true);
    });

    it('should create correct client type based on provider', () => {
      MockedAnthropic.mockReturnValue({
        messages: { create: vi.fn() },
      } as AnthropicInstance);

      MockedOpenAI.mockReturnValue({
        chat: { completions: { create: vi.fn() } },
      } as OpenAIInstance);

      const anthropicConfig: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-key',
      };
      expect(ExtractClientFactory.create(anthropicConfig)).toBeInstanceOf(AnthropicExtractClient);

      const openaiConfig: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };
      expect(ExtractClientFactory.create(openaiConfig)).toBeInstanceOf(OpenAIExtractClient);

      const compatibleConfig: LLMConfig = {
        provider: 'openai-compatible',
        apiKey: 'test-key',
        model: 'test-model',
        apiBaseUrl: 'https://api.test.com',
      };
      expect(ExtractClientFactory.create(compatibleConfig)).toBeInstanceOf(
        OpenAICompatibleExtractClient
      );
    });
  });
});
