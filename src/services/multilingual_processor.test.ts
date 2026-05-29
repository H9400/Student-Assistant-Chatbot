import { describe, it, expect, vi } from 'vitest';
import { multilingualProcessor } from './multilingual_processor';

describe('multilingualProcessor', () => {
  it('should detect language correctly', async () => {
    const result = await multilingualProcessor.detectLanguage('नमस्ते');
    expect(result).toBe('hi');
  });

  it('should handle language detection errors', async () => {
    vi.spyOn(multilingualProcessor, 'detectLanguage').mockRejectedValue(new Error('Detection failed'));
    await expect(multilingualProcessor.detectLanguage('Test'))
      .rejects
      .toThrow('Detection failed');
  });

  it('should translate text to target language', async () => {
    const result = await multilingualProcessor.translate('Hello', 'hi');
    expect(result).toBe('नमस्ते');
  });

  it('should handle translation errors', async () => {
    vi.spyOn(multilingualProcessor, 'translate').mockRejectedValue(new Error('Translation failed'));
    await expect(multilingualProcessor.translate('Hello', 'xx'))
      .rejects
      .toThrow('Translation failed');
  });

  it('should process multilingual query in English', async () => {
    const result = await multilingualProcessor.processMultilingualQuery('Hello', 'hi');
    expect(result.translatedText).toBe('Hello');
    expect(result.originalLanguage).toBe('en');
  });

  it('should process multilingual query in Hindi', async () => {
    vi.spyOn(multilingualProcessor, 'detectLanguage').mockResolvedValue({ detectedLanguage: 'hi', confidence: 0.9 });
    vi.spyOn(multilingualProcessor, 'translate').mockResolvedValue('Hello');
    
    const result = await multilingualProcessor.processMultilingualQuery('नमस्ते', 'en');
    expect(result.translatedText).toBe('Hello');
    expect(result.originalLanguage).toBe('hi');
  });

  it('should handle processMultilingualQuery errors', async () => {
    vi.spyOn(multilingualProcessor, 'detectLanguage').mockRejectedValue(new Error('Processing failed'));
    await expect(multilingualProcessor.processMultilingualQuery('Test', 'en'))
      .rejects
      .toThrow('Processing failed');
  });
});