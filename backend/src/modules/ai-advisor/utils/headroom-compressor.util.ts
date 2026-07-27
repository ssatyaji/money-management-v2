import { Logger } from '@nestjs/common';

const logger = new Logger('HeadroomCompressor');

/**
 * Utility to compress financial context text using headroom-ai SDK
 * Falls back to raw context if headroom-ai is not available or encounters an error.
 */
export async function compressFinancialContext(rawContext: string): Promise<string> {
  if (!rawContext || rawContext.trim().length < 50) {
    return rawContext;
  }

  try {
    const headroom = await import('headroom-ai');
    if (headroom && typeof headroom.compress === 'function') {
      const messages = [{ role: 'user', content: rawContext }];
      const result = await headroom.compress(messages);
      
      if (result && Array.isArray(result.messages) && result.messages.length > 0) {
        const compressedContent = result.messages[0]?.content;
        if (typeof compressedContent === 'string' && compressedContent.length > 0) {
          return compressedContent;
        }
      }
    }
  } catch (error) {
    logger.warn(`Headroom compression skipped/failed, using raw context: ${error instanceof Error ? error.message : String(error)}`);
  }

  return rawContext;
}
