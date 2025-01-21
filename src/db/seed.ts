import { migrationDb as db } from './index';
import { modalities, models } from './schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    // Create text modality
    const [textModality] = await db
      .insert(modalities)
      .values({
        id: uuidv4(),
        name: 'text2text',
        description: 'General text conversation modality',
        inputs: ['text'],
        outputs: ['text'],
        status: 'active',
        samplingWeights: {
          'model-1': 0.33,
          'model-2': 0.33,
          'model-3': 0.34,
        },
      })
      .returning();

    // Create three models
    await db.insert(models).values([
      {
        id: uuidv4(),
        publicName: 'GPT-4',
        modalityId: textModality.id,
        organization: 'OpenAI',
        adapter: 'openai',
        adapterModelName: 'gpt-4',
        visibility: 'public',
        status: 'active',
        metadata: {
          maxTokens: 8192,
          costPer1kTokens: 0.03,
        },
      },
      {
        id: uuidv4(),
        publicName: 'Claude 3 Opus',
        modalityId: textModality.id,
        organization: 'Anthropic',
        adapter: 'anthropic',
        adapterModelName: 'claude-3-opus',
        visibility: 'public',
        status: 'active',
        metadata: {
          maxTokens: 4096,
          costPer1kTokens: 0.015,
        },
      },
      {
        id: uuidv4(),
        publicName: 'Mixtral',
        modalityId: textModality.id,
        organization: 'Mistral',
        adapter: 'mistral',
        adapterModelName: 'mixtral-8x7b',
        visibility: 'public',
        status: 'active',
        metadata: {
          maxTokens: 32768,
          costPer1kTokens: 0.001,
        },
      },
    ]);

    console.log('✅ Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();