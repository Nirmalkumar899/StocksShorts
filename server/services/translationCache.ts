import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "missing_key_from_vercel_dashboard" });

interface TranslatedContent {
  titleHi: string;
  contentHi: string;
  translatedAt: Date;
}

class TranslationCache {
  private cache: Map<number, TranslatedContent> = new Map();
  private isTranslating: boolean = false;
  private translationQueue: number[] = [];

  async translateArticle(id: number, title: string, content: string): Promise<TranslatedContent | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, skipping translation');
      return null;
    }

    try {
      const prompt = `Translate this stock market article to Hindi. Keep financial terms, company names, stock symbols, numbers and percentages in English/digits.

Title: ${title}
Content: ${content}

Return in exact format:
TITLE: [Hindi translation]
CONTENT: [Hindi translation]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 800
      });

      const translatedText = response.choices[0].message.content || '';

      const titleMatch = translatedText.match(/TITLE:\s*(.+?)(?=\n|CONTENT:|$)/s);
      const contentMatch = translatedText.match(/CONTENT:\s*(.+)/s);

      const translatedContent: TranslatedContent = {
        titleHi: titleMatch?.[1]?.trim() || title,
        contentHi: contentMatch?.[1]?.trim() || content,
        translatedAt: new Date()
      };

      this.cache.set(id, translatedContent);
      return translatedContent;
    } catch (error) {
      console.error(`❌ Translation failed for article ${id}:`, error);
      return null;
    }
  }

  async translateBatch(articles: Array<{ id: number; title: string; content: string }>): Promise<void> {
    if (this.isTranslating || !process.env.OPENAI_API_KEY) {
      return;
    }

    const untranslated = articles.filter(a => !this.cache.has(a.id));
    if (untranslated.length === 0) {
      console.log('✅ All articles already translated');
      return;
    }

    this.isTranslating = true;
    console.log(`🌐 Starting background translation for ${untranslated.length} articles...`);

    try {
      const batchSize = 3;
      for (let i = 0; i < Math.min(untranslated.length, 30); i += batchSize) {
        const batch = untranslated.slice(i, i + batchSize);
        await Promise.all(
          batch.map(article => this.translateArticle(article.id, article.title, article.content))
        );

        if (i + batchSize < untranslated.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      console.log(`✅ Background translation complete: ${this.cache.size} articles cached`);
    } catch (error) {
      console.error('❌ Batch translation error:', error);
    } finally {
      this.isTranslating = false;
    }
  }

  getTranslation(id: number): TranslatedContent | null {
    return this.cache.get(id) || null;
  }

  hasTranslation(id: number): boolean {
    return this.cache.has(id);
  }

  getAllTranslations(): Map<number, TranslatedContent> {
    return this.cache;
  }

  getCacheStats() {
    return {
      translatedCount: this.cache.size,
      isTranslating: this.isTranslating
    };
  }
}

export const translationCache = new TranslationCache();
