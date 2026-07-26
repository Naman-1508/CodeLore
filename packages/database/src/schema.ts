import { pgTable, text, timestamp, uuid, boolean, pgEnum, integer, unique, numeric, AnyPgColumn, vector } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'member', 'viewer']);
export const aiProviderStatusEnum = pgEnum('ai_provider_status', ['active', 'quota_exceeded', 'disabled', 'error']);
export const indexingStatusEnum = pgEnum('indexing_status', ['pending', 'cloning', 'parsing', 'analyzing', 'ready', 'error']);

export const workspaces = pgTable('workspace', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  aiLayerEnabled: boolean('ai_layer_enabled').default(false).notNull(),
  aiProviderConfigId: uuid('ai_provider_config_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  authProvider: text('auth_provider').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable('membership', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: roleEnum('role').notNull(),
});

export const aiProviderConfigs = pgTable('ai_provider_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  provider: text('provider').notNull(),
  encryptedCredentials: text('encrypted_credentials'), 
  monthlyTokenCap: integer('monthly_token_cap'),
  status: aiProviderStatusEnum('status').notNull(),
});

export const repositories = pgTable('repository', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  name: text('name').notNull(),
  remoteUrl: text('remote_url').notNull(),
  defaultBranch: text('default_branch'),
  primaryLanguage: text('primary_language'),
  locTotal: integer('loc_total').default(0),
  indexingStatus: indexingStatusEnum('indexing_status').default('pending').notNull(),
  lastIndexedCommitSha: text('last_indexed_commit_sha'),
  lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqWorkspaceUrl: unique().on(t.workspaceId, t.remoteUrl),
}));

export const files = pgTable('file', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  path: text('path').notNull(),
  language: text('language').notNull(),
  loc: integer('loc').default(0),
  complexityScore: numeric('complexity_score').default('0'),
  testCoveragePct: numeric('test_coverage_pct'),
  isTestFile: boolean('is_test_file').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqRepoPath: unique().on(t.repositoryId, t.path),
}));

export const classes = pgTable('class', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => files.id).notNull(),
  name: text('name').notNull(),
  parentClassId: uuid('parent_class_id').references((): AnyPgColumn => classes.id),
});

export const functions = pgTable('function', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => files.id).notNull(),
  classId: uuid('class_id').references(() => classes.id),
  name: text('name').notNull(),
  signature: text('signature').notNull(),
  startLine: integer('start_line').notNull(),
  endLine: integer('end_line').notNull(),
  complexityScore: numeric('complexity_score').default('0'),
  isEntryPoint: boolean('is_entry_point').default(false).notNull(),
  docstring: text('docstring'),
  embedding: vector('embedding', { dimensions: 1536 }),
});

export const callEdges = pgTable('call_edge', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  callerFunctionId: uuid('caller_function_id').references(() => functions.id).notNull(),
  calleeFunctionId: uuid('callee_function_id').references(() => functions.id).notNull(),
  callCount: integer('call_count').default(1).notNull(),
});

export const dependencyTypeEnum = pgEnum('dependency_type', ['runtime', 'dev', 'internal']);

export const dependencies = pgTable('dependency', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  sourceModule: text('source_module').notNull(),
  targetModule: text('target_module').notNull(),
  dependencyType: dependencyTypeEnum('dependency_type').notNull(),
  isCircular: boolean('is_circular').default(false).notNull(),
  couplingStrength: numeric('coupling_strength').default('0'),
}, (t) => ({
  unqSourceTarget: unique().on(t.repositoryId, t.sourceModule, t.targetModule),
}));

export const gitCommits = pgTable('git_commit', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  sha: text('sha').notNull(),
  authorEmail: text('author_email').notNull(),
  authorName: text('author_name').notNull(),
  committedAt: timestamp('committed_at', { withTimezone: true }).notNull(),
  message: text('message').notNull(),
  additions: integer('additions').default(0).notNull(),
  deletions: integer('deletions').default(0).notNull(),
}, (t) => ({
  unqRepoSha: unique().on(t.repositoryId, t.sha),
}));

export const changeTypeEnum = pgEnum('change_type', ['added', 'modified', 'deleted', 'renamed']);

export const commitFileChanges = pgTable('commit_file_change', {
  id: uuid('id').primaryKey().defaultRandom(),
  gitCommitId: uuid('git_commit_id').references(() => gitCommits.id).notNull(),
  fileId: uuid('file_id').references(() => files.id).notNull(),
  changeType: changeTypeEnum('change_type').notNull(),
  linesAdded: integer('lines_added').default(0).notNull(),
  linesRemoved: integer('lines_removed').default(0).notNull(),
});

export const healthSnapshots = pgTable('health_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  score: integer('score').notNull(), // 0-100
  metricsJson: text('metrics_json').notNull(), // JSON string for detailed metrics
});

export const codeStories = pgTable('code_story', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  entryFunctionId: uuid('entry_function_id').references(() => functions.id).notNull(),
});

export const codeStorySteps = pgTable('code_story_step', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeStoryId: uuid('code_story_id').references(() => codeStories.id).notNull(),
  order: integer('order').notNull(),
  functionId: uuid('function_id').references(() => functions.id).notNull(),
  narration: text('narration').notNull(), // AI or deterministic narration
});

export const backgroundJobs = pgTable('background_job', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(), // e.g. 'generate_docstring'
  payload: text('payload').notNull(), // JSON string
  status: text('status').default('pending').notNull(), // pending, processing, completed, failed
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chatSessions = pgTable('chat_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_message', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => chatSessions.id).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  factChipsJson: text('fact_chips_json'), // JSON string of referenced files/functions
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiNarrations = pgTable('ai_narration', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: text('target_type').notNull(), // 'code_story_step', 'architect_finding'
  targetId: uuid('target_id').notNull(),
  narrationText: text('narration_text').notNull(),
  fallbackUsed: boolean('fallback_used').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const architectureSnapshots = pgTable('architecture_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  commitHash: text('commit_hash').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  moduleMapJson: text('module_map_json').notNull(),
});

export const guidedTours = pgTable('guided_tour', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const guidedTourSteps = pgTable('guided_tour_step', {
  id: uuid('id').primaryKey().defaultRandom(),
  tourId: uuid('tour_id').references(() => guidedTours.id).notNull(),
  codeStoryId: uuid('code_story_id').references(() => codeStories.id).notNull(),
  order: integer('order').notNull(),
});

export const executionFlows = pgTable('execution_flow', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  traceId: text('trace_id').notNull(),
  flowDataJson: text('flow_data_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const codeStoriesRelations = relations(codeStories, ({ many }) => ({
  steps: many(codeStorySteps),
}));

export const codeStoryStepsRelations = relations(codeStorySteps, ({ one }) => ({
  codeStory: one(codeStories, {
    fields: [codeStorySteps.codeStoryId],
    references: [codeStories.id],
  }),
  function: one(functions, {
    fields: [codeStorySteps.functionId],
    references: [functions.id],
  }),
}));

export const functionsRelations = relations(functions, ({ one }) => ({
  file: one(files, {
    fields: [functions.fileId],
    references: [files.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  repository: one(repositories, {
    fields: [files.repositoryId],
    references: [repositories.id],
  }),
}));
