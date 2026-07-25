import { pgTable, text, timestamp, uuid, boolean, pgEnum, integer, unique, numeric, AnyPgColumn } from 'drizzle-orm/pg-core';

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
});

export const callEdges = pgTable('call_edge', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  callerFunctionId: uuid('caller_function_id').references(() => functions.id).notNull(),
  calleeFunctionId: uuid('callee_function_id').references(() => functions.id).notNull(),
  callCount: integer('call_count').default(1).notNull(),
});
