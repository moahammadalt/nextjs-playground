import { pgTable, text, timestamp, uuid, json, primaryKey, pgPolicy } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { authUsers } from 'drizzle-orm/supabase';

// 1. User Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => authUsers.id)
    .unique(),
  username: text('username'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
  feedback: many(feedback),
}));

// 2. Modality Table
export const modalities = pgTable('modalities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'), // 'text2image', 'image-chat', etc.
  description: text('description'),
  inputs: json('inputs').notNull().$type<Array<'text' | 'image'>>().default([]),
  outputs: json('outputs').notNull().$type<Array<'text' | 'image'>>().default([]),
  status: text('status').notNull().default('active'), // 'active' | 'deprecated'
  samplingWeights: json('sampling_weights').notNull(), // dictionary of modelId -> weight
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const modalitiesRelations = relations(modalities, ({ many }) => ({
  models: many(models),
}));

// 3. Model Table
export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicName: text('public_name').notNull(),
  modalityId: uuid('modality_id')
    .notNull()
    .references(() => modalities.id),
  organization: text('organization').notNull(),
  adapter: text('adapter').notNull(),
  adapterModelName: text('adapter_model_name').notNull(),
  visibility: text('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  status: text('status', { enum: ['active', 'deprecated'] })
    .notNull()
    .default('active'),
  metadata: json('metadata'), // optional metadata like cost, max tokens, etc
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const modelsRelations = relations(models, ({ one, many }) => ({
  modality: one(modalities, {
    fields: [models.modalityId], // FK in models table
    references: [modalities.id], // PK referred to in modalities table
  }),
  conversations: many(conversationModels),
  messages: many(messages),
}));

// 4. Conversation Table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    conversationMode: text('conversation_mode', { enum: ['side-by-side', 'battle', 'chat'] }).notNull(),
    lastMessageId: uuid('last_message_id'), // Optional reference to last message
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    policies: [
      pgPolicy('users_select_own_conversations', {
        for: 'select',
        using: sql`EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = ${table.userId} 
          AND users.user_id = auth.uid()::uuid
        )`,
      }),
      pgPolicy('users_insert_own_conversations', {
        for: 'insert',
        using: sql`EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = ${table.userId} 
          AND users.user_id = auth.uid()::uuid
        )`,
        withCheck: sql`EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = ${table.userId} 
          AND users.user_id = auth.uid()::uuid
        )`,
      }),
      pgPolicy('users_delete_own_conversations', {
        for: 'delete',
        using: sql`EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = ${table.userId} 
          AND users.user_id = auth.uid()::uuid
        )`,
      }),
      pgPolicy('users_update_own_conversations', {
        for: 'update',
        using: sql`EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = ${table.userId} 
          AND users.user_id = auth.uid()::uuid
        )`,
        withCheck: sql`EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = ${table.userId} 
          AND users.user_id = auth.uid()::uuid
        )`,
      }),
    ],
  })
).enableRLS();

// Junction table for conversations and models (many-to-many)
export const conversationModels = pgTable(
  'conversation_models',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id),
    modelId: uuid('model_id')
      .notNull()
      .references(() => models.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.modelId] }),
  })
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  models: many(conversationModels),
  messages: many(messages),
  lastMessage: one(messages, {
    fields: [conversations.lastMessageId],
    references: [messages.id],
  }),
}));

// 5. Message Table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id),
  senderId: uuid('sender_id').notNull(), // Can be either userId or modelId
  senderType: text('sender_type', { enum: ['user', 'model'] }).notNull(),
  parentMessageId: uuid('parent_message_id'),
  mediaType: text('media_type', { enum: ['text', 'image'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
  }),
  feedback: many(feedback),
}));

// 6. Feedback Table
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  feedbackType: text('feedback_type', { enum: ['pointwise', 'pairwise', 'n_way'] }).notNull(),
  // For pointwise feedback
  messageId: uuid('message_id').references(() => messages.id),
  pointwiseValue: text('pointwise_value', { enum: ['upvote', 'downvote'] }),
  // For pairwise feedback
  messageAId: uuid('message_a_id').references(() => messages.id),
  messageBId: uuid('message_b_id').references(() => messages.id),
  pairwiseValue: text('pairwise_value', { enum: ['model_a', 'model_b', 'tie', 'both_bad'] }),
  // For n-way feedback
  winningMessageId: uuid('winning_message_id').references(() => messages.id),
  // Common fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [feedback.messageId],
    references: [messages.id],
  }),
}));
