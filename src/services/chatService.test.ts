import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatService } from './chatService';

// Mock the fetch API
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ response: 'Test response' }),
    })
  );
});

describe('chatService', () => {
  it('should generate a response for a message', async () => {
    const response = await chatService.generateResponse('Hello');
    expect(response.content).toBe('Test response');
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        timestamp: expect.any(String)
      }),
    });
  });

  it('should handle API errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      })
    );

    await expect(chatService.generateResponse('Hello'))
      .rejects
      .toThrow('Failed to get response from server');
  });
});