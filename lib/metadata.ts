export interface ListingMetadata {
  pitch?: {
    hook?: string;         // 140 char value prop
    secret_sauce?: string; // AI moat description
    mau?: number;          // monthly active users
    mrr?: number;          // MRR in dollars
  };
  due_diligence?: {
    tech_stack?: {
      foundation?: string[];     // AI models: GPT-4o, Claude, Llama…
      infrastructure?: string[]; // Next.js, Supabase, Pinecone…
    };
    monthly_burn?: number;          // API + hosting cost $/mo
    maintenance_level?: 'low' | 'medium' | 'high';
    assets_included?: {
      domain?: boolean;
      github?: boolean;
      social_media?: boolean;
      customer_database?: boolean;
      documentation?: boolean;
    };
  };
}

export function pitchStrength(secretSauce: string): number {
  if (!secretSauce.trim()) return 0;
  let score = 10;

  // Length score (up to 40 pts)
  score += Math.min(40, Math.floor(secretSauce.length / 8));

  const lower = secretSauce.toLowerCase();

  // Specific AI model mentions
  if (/gpt-4|gpt4|claude|llama|mistral|gemini|palm|bert|whisper|dall-e|stable.diffusion/i.test(lower)) score += 10;

  // Fine-tuning / custom training
  if (/fine.tun|rlhf|lora|qlora|train|dataset|embeddings?|vector|rag|retrieval/i.test(lower)) score += 15;

  // Moat / uniqueness language
  if (/proprietary|unique|exclusive|moat|differenti|patent|custom.data|private.data/i.test(lower)) score += 10;

  // Infrastructure / pipeline
  if (/pipeline|workflow|agent|orchestrat|langchain|llamaindex|pinecone|weaviate|chroma/i.test(lower)) score += 8;

  // Specific metrics or claims
  if (/\d+[kKmM%]|\d+ (users?|customers?|accuracy|requests?)/.test(lower)) score += 7;

  return Math.min(100, score);
}

export function strengthLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Strong moat', color: 'var(--green)', bg: 'var(--green-light)' };
  if (score >= 55) return { label: 'Getting there', color: 'var(--blue)', bg: 'var(--blue-light)' };
  if (score >= 25) return { label: 'Needs more detail', color: 'var(--amber)', bg: 'var(--amber-light)' };
  return { label: 'Too vague', color: 'var(--red)', bg: 'var(--red-light)' };
}
