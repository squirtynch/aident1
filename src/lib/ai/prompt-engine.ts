// Prompt Engine - Manages AI prompts and templates

import type { ProductAnalysis, AITextType } from '../contracts';

export interface PromptContext {
  product?: ProductAnalysis;
  project?: {
    name: string;
    description?: string;
  };
  style?: string;
  environment?: string;
  modelReference?: string;
  designReference?: string;
  userRequest?: string;
  outputRequirements?: {
    aspectRatio?: string;
    resolution?: string;
    format?: string;
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

class PromptEngine {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    // Product Photo templates
    this.registerTemplate({
      id: 'product_photo',
      name: 'Product Photo',
      template: `Create a professional product photo of {{product_name}}.

Product Details:
- Category: {{category}}
- Colors: {{colors}}
- Materials: {{materials}}
- Key Features: {{features}}

Style: {{style}}
Composition: {{composition}}
Background: {{background}}

Requirements:
- High quality, professional lighting
- Product should be the main focus
- Clean, appealing presentation
{{output_requirements}}`,
      variables: ['product_name', 'category', 'colors', 'materials', 'features', 'style', 'composition', 'background', 'output_requirements'],
    });

    // AI Text templates
    this.registerTemplate({
      id: 'product_name',
      name: 'Product Name',
      template: `Generate a compelling product name for:

Product Details:
{{product_details}}

Requirements:
- Memorable and unique
- Easy to pronounce
- Relevant to the product category
- Maximum 3 words

Return ONLY the product name, nothing else.`,
      variables: ['product_details'],
    });

    this.registerTemplate({
      id: 'short_description',
      name: 'Short Description',
      template: `Write a short, compelling product description (2-3 sentences):

Product: {{product_name}}
Category: {{category}}
Key Features: {{features}}
Target Audience: {{target_audience}}

Requirements:
- Concise and engaging
- Highlight main benefits
- Use active voice
- Maximum 50 words`,
      variables: ['product_name', 'category', 'features', 'target_audience'],
    });

    this.registerTemplate({
      id: 'long_description',
      name: 'Long Description',
      template: `Write a detailed product description:

Product: {{product_name}}
Category: {{category}}
Materials: {{materials}}
Features: {{features}}
Benefits: {{benefits}}

Requirements:
- 3-4 paragraphs
- Engaging and informative
- Highlight unique selling points
- Include technical details where relevant
- Use persuasive language`,
      variables: ['product_name', 'category', 'materials', 'features', 'benefits'],
    });

    this.registerTemplate({
      id: 'bullets',
      name: 'Bullet Points',
      template: `Create 5-7 compelling bullet points for:

Product: {{product_name}}
Features: {{features}}
Benefits: {{benefits}}

Requirements:
- Start each with a strong verb or benefit
- Be specific and concrete
- Focus on customer value
- Maximum 15 words per bullet
- No periods at the end`,
      variables: ['product_name', 'features', 'benefits'],
    });

    this.registerTemplate({
      id: 'seo',
      name: 'SEO Content',
      template: `Generate SEO-optimized content for:

Product: {{product_name}}
Category: {{category}}
Features: {{features}}

Provide:
1. SEO Title (60 characters max)
2. Meta Description (155 characters max)
3. 5 relevant keywords
4. 3 long-tail keyword phrases

Format as JSON.`,
      variables: ['product_name', 'category', 'features'],
    });

    this.registerTemplate({
      id: 'ad_copy',
      name: 'Ad Copy',
      template: `Write advertising copy for:

Product: {{product_name}}
Key Benefit: {{key_benefit}}
Target Audience: {{target_audience}}
Tone: {{tone}}

Provide:
1. Headline (8 words max)
2. Subheadline (15 words max)
3. Call to action (5 words max)
4. Body copy (50 words max)`,
      variables: ['product_name', 'key_benefit', 'target_audience', 'tone'],
    });

    this.registerTemplate({
      id: 'social',
      name: 'Social Media Post',
      template: `Create a social media post for:

Product: {{product_name}}
Key Feature: {{key_feature}}
Platform: {{platform}}
Tone: {{tone}}

Requirements:
- Engaging hook in first line
- Include relevant emojis
- Add 3-5 hashtags
- Include call to action
- {{platform}}-specific best practices`,
      variables: ['product_name', 'key_feature', 'platform', 'tone'],
    });
  }

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  render(templateId: string, context: PromptContext & Record<string, any>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let rendered = template.template;

    // Replace variables
    for (const variable of template.variables) {
      const value = context[variable];
      const replacement = this.formatValue(value);
      rendered = rendered.replace(new RegExp(`{{${variable}}}`, 'g'), replacement);
    }

    return rendered;
  }

  private formatValue(value: any): string {
    if (value === undefined || value === null) {
      return 'Not specified';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  buildProductAnalysisPrompt(imageDescription?: string): string {
    return `Analyze this product image and provide structured information.

${imageDescription ? `Image description: ${imageDescription}\n\n` : ''}Please provide:
1. Category (e.g., Electronics, Clothing, Home & Garden)
2. Product name (descriptive name)
3. Colors (list of dominant colors)
4. Materials (detected or inferred materials)
5. Features (visible features and characteristics)
6. Visual characteristics (style, design elements)
7. Detected text (any text visible in the image)
8. Constraints (any special handling or display requirements)
9. Confidence (0.0 to 1.0)

Respond in JSON format with these exact keys:
{
  "category": "string",
  "productName": "string",
  "colors": ["string"],
  "materials": ["string"],
  "features": ["string"],
  "visualCharacteristics": ["string"],
  "detectedText": ["string"],
  "constraints": ["string"],
  "confidence": number
}`;
  }

  buildAITextPrompt(type: AITextType, context: PromptContext): string {
    const templateId = type.toLowerCase();
    const template = this.templates.get(templateId);
    
    if (template) {
      return this.render(templateId, {
        ...context,
        product_name: context.product?.productName || 'Product',
        category: context.product?.category || 'General',
        colors: context.product?.colors || [],
        materials: context.product?.materials || [],
        features: context.product?.features || [],
        benefits: context.product?.features || [],
        product_details: this.formatProductDetails(context.product),
      });
    }

    // Fallback generic prompt
    return `Generate ${type.replace('_', ' ').toLowerCase()} for:

Product: ${context.product?.productName || 'Product'}
Category: ${context.product?.category || 'General'}
Features: ${context.product?.features?.join(', ') || 'Not specified'}

${context.userRequest || ''}`;
  }

  private formatProductDetails(product?: ProductAnalysis): string {
    if (!product) return 'No product details available';
    
    return `Name: ${product.productName}
Category: ${product.category}
Colors: ${product.colors.join(', ')}
Materials: ${product.materials.join(', ')}
Features: ${product.features.join(', ')}`;
  }
}

export const promptEngine = new PromptEngine();
