/**
 * gen-app extension manifest — TypeScript schema
 * ----------------------------------------------
 * An extension is a folder with a `manifest.json` and one or more source
 * files. Two sandbox runtimes can host extension code:
 *
 *   • `runtime: 'worker'` (legacy default) — a folder of one or more JS
 *     files, bundled into a single ESM module by esbuild at install time
 *     and run in a hardened Web Worker inside the webview. The only
 *     third-party-code path that survives App Store rule 2.5.2, so it's
 *     the iOS-only path going forward.
 *
 *   • `runtime: 'deno'` — a long-lived `deno run` subprocess spawned via
 *     `tauri-plugin-shell`'s sidecar with explicit `--allow-*` flags.
 *     Reach the network through a per-extension HTTPS proxy that enforces
 *     `permissions.network`. File-based databases sit under the extension
 *     dir. Desktop only.
 *
 * See [ADR 0001 — Sandbox runtime for long-lived extensions](
 *   ../../docs/adrs/0001-extension-sandbox-runtime.md) and
 * `libs/extension-sdk/src/index.ts` for the runtime types.
 *
 * This file is the source of truth for the editor's autocomplete and the
 * runtime validator. Ship it alongside the binary.
 */

import type { JSONSchema7 as JsonSchema } from "json-schema";

// ─── Manifest ───────────────────────────────────────────────────────────────

export type ExtensionRuntime = "worker" | "deno";

export type Capability = "network" | "storage";

export type DatabaseKind = "sqlite" | "pglite" | "redka";

/** A port the deno-runtime extension wants the host to allocate. */
export interface PortDecl {
  name: string;
  /** Future-proofing — only 'http' is wired today. */
  protocol: "http";
}

/** Lifecycle knobs for `runtime: 'deno'` extensions. */
export interface ExtensionLifecycle {
  /**
   * Idle threshold in milliseconds before the host stops the subprocess.
   * `0` opts out (long-lived). Defaults to 5 minutes.
   */
  idleStopMs?: number;
  /** Enable file-watching → restart in dev mode. Off in production. */
  hotReload?: boolean;
}

/** Manifest declaration of a single provider. */
export interface ProviderManifest {
  name: string;
  description: string;
  /** JSON Schema for the provider's input — doubles as the LLM tool schema. */
  input: JsonSchema;
  /** Optional JSON Schema for the output. Documentation only. */
  output?: JsonSchema;
  /**
   * For `runtime: 'deno'`: HTTP route to call on the extension's loopback
   * server. Defaults to `POST /<name>` when omitted.
   */
  route?: string;
}

/**
 * A host-side React renderer a bundled extension can ship. Reachable from
 * any widget via `Custom`'s `component: "<extId>:<name>"`. User-authored
 * extensions cannot ship renderers (they run inside the sandbox worker
 * and can't reach the host React tree).
 */
export interface RendererManifest {
  /** Local name. The widget references this as `"<extId>:<name>"`. */
  name: string;
  /** One-line description shown to the LLM. Include the prop shape. */
  doc: string;
  /** Optional JSON Schema for the prop bag. Documentation only in V1. */
  propSchema?: JsonSchema;
}

/** Refresh cadence the host uses to call a widget's default binding. */
export type RefreshPolicy =
  | { kind: "interval"; ms: number }
  | { kind: "manual" };

/** Manifest declaration of a widget the extension ships. */
export interface WidgetManifest {
  name: string;
  description: string;
  /** Declarative spec template rendered by the host. */
  spec: WidgetSpec;
  /** Provider whose output feeds the widget's `state` when instantiated. */
  defaultBinding?: string;
  /** Default refresh cadence when this widget is created. */
  refresh?: RefreshPolicy;
}

/** The parsed contents of an extension's `manifest.json`. */
export interface ExtensionManifest {
  /** Lowercase-kebab-case id, unique per device. e.g. "open-meteo". */
  id: string;

  /** Human-readable name. Sentence case. e.g. "Open-Meteo". */
  name: string;

  /** Semver. Used for upgrade prompts when bundled extensions update. */
  version: `${number}.${number}.${number}`;

  /** Short description shown on the Extensions list. ≤ 80 chars. */
  description: string;

  /** Author display string. Pure cosmetic — does NOT affect trust. */
  author?: string;

  /**
   * Sandbox runtime. Defaults to `'worker'` for back-compat. Worker
   * extensions are iOS-safe; deno extensions are desktop-only.
   */
  runtime?: ExtensionRuntime;

  /** For `runtime: 'deno'`: relative path to the entry file. */
  entry?: string;

  /** Ports the host should allocate (values delivered via env). */
  ports?: PortDecl[];

  /** Curated file-based DBs the extension uses. Pure declaration. */
  databases?: DatabaseKind[];

  /** Capabilities the host must grant for providers to run. */
  capabilities: Capability[];

  /**
   * Capability allowlists, primarily for user-authored extensions.
   * Bundled extensions can rely on the coarser `capabilities` instead.
   */
  permissions?: {
    /** Hosts `ctx.fetch` may reach — exact host, `*.host`, or URL prefix. */
    network?: string[];
    /** Secret names this extension may read via `ctx.secrets`. */
    secrets?: string[];
  };

  /** Lifecycle knobs (deno runtime only). */
  lifecycle?: ExtensionLifecycle;

  /** Providers — named, schema-typed data functions the harness can call. */
  providers: ProviderManifest[];

  /** Widgets the extension ships. */
  widgets: WidgetManifest[];

  /**
   * Host-side React renderers this extension ships. Bundled extensions only.
   * Reachable from any widget via `Custom` with `component: "<extId>:<name>"`.
   */
  renderers?: RendererManifest[];
}

// ─── Runtime context — worker variant ───────────────────────────────────────

/**
 * Context passed to each provider in a `runtime: 'worker'` extension.
 * The worker has no DOM and no Tauri — outside access goes through
 * `ctx` only.
 */
export interface WorkerProviderContext {
  /**
   * Capability-gated HTTP. Requires the `network` capability; the request
   * is proxied through the Rust host (centralised policy, no CORS).
   */
  fetch(
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ): Promise<{ status: number; ok: boolean; body: string }>;

  /** Capability-gated key/value storage, scoped to this extension. */
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
  };

  /**
   * Secrets this extension may read — only the names declared in
   * `manifest.permissions.secrets` and permitted by their scope. An
   * undeclared / scope-blocked name reads back as `undefined`.
   */
  secrets: Readonly<Record<string, string | undefined>>;

  /** Structured logging surfaced in Settings → Logs. */
  log(...args: unknown[]): void;

  /** Aborted if the host cancels the call. */
  signal: AbortSignal;
}

/** A worker-runtime provider: a named, schema-typed data function. */
export type WorkerProviderFn = (
  input: Record<string, unknown>,
  ctx: WorkerProviderContext,
) => Promise<unknown> | unknown;

// ─── Runtime context — deno variant ─────────────────────────────────────────

/**
 * Context built by `startExtension` for a `runtime: 'deno'` subprocess.
 * Read from env (`PORT`, `EXTENSION_ID`, `DATA_DIR`, `SECRET_<NAME>`),
 * wired to SIGTERM, and surfaced as a typed object for ergonomic authoring.
 */
export interface DenoExtensionContext {
  /** Stable extension id (matches `manifest.id`). */
  readonly extensionId: string;
  /** Host-assigned loopback port. Bind exactly here. */
  readonly port: number;
  /** Per-extension data directory — the only writable path. */
  readonly dir: string;
  /** Manifest-declared secret values; keys are `permissions.secrets` names. */
  readonly secrets: Readonly<Record<string, string>>;
  /** Aborted on SIGTERM (idle-stop / app-quit / uninstall). */
  readonly signal: AbortSignal;
  /** Same as global `fetch`; outbound is gated by the host's proxy. */
  readonly fetch: typeof fetch;
  /** Structured log to the host's event_log. */
  log(level: "info" | "warn" | "error", message: string, data?: unknown): void;
  /** Path helpers for curated file-based DB engines. */
  readonly databases: {
    path(name: string, kind: DatabaseKind): string;
  };
}

export type DenoExtensionHandler = (
  ctx: DenoExtensionContext,
) => Promise<void> | void;

// ─── Widget spec (declarative tree the harness renders) ────────────────────

/**
 * The widget tree shipped in a `WidgetManifest.spec`. The model never
 * regenerates the spec on a data refresh — bindings into `state` carry
 * the new values into the existing tree.
 */
export interface WidgetSpec {
  title: string;
  state: Record<string, unknown>;
  root: WidgetNode;
  /** Optional model-authored script for declarative interactivity. */
  script?: string;
}

export interface WidgetNode {
  /** Matches a key in `WIDGET_COMPONENTS` (e.g. "Stack", "Stat", "Card"). */
  type: string;
  id?: string;
  props?: Record<string, unknown>;
  children?: WidgetNode[];
  /** Map a prop name to a dotted path into the widget's `state`. */
  bindings?: Record<string, string>;
  /** Wire UI events to named handlers in `spec.script`. */
  events?: Record<string, string>;
  /** Two-way bind an input to a `state` path. */
  model?: string;
}

// ─── Examples ───────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-unused-vars */

/** Example: a worker-runtime user extension (folder of one or more .js files; bundled into the sandbox worker at install time). */
const example_worker_manifest: ExtensionManifest = {
  id: "rss",
  name: "RSS",
  version: "0.3.0",
  description: "Subscribe + summarise feeds.",
  runtime: "worker",
  capabilities: ["network", "storage"],
  permissions: {
    network: ["*"],
    secrets: [],
  },
  providers: [
    {
      name: "fetchFeed",
      description: "Fetch an Atom/RSS feed and return its parsed items.",
      input: {
        type: "object",
        properties: { url: { type: "string", description: "Feed URL." } },
        required: ["url"],
      },
    },
  ],
  widgets: [],
};

/** Example: a deno-runtime bundled extension. */
const example_deno_manifest: ExtensionManifest = {
  id: "weather",
  name: "Weather",
  version: "2.1.0",
  description:
    "Current conditions and an hourly outlook for any city, via Open-Meteo.",
  runtime: "deno",
  entry: "index.ts",
  ports: [{ name: "http", protocol: "http" }],
  databases: [],
  capabilities: ["network"],
  permissions: {
    network: ["geocoding-api.open-meteo.com", "api.open-meteo.com"],
    secrets: [],
  },
  lifecycle: { idleStopMs: 5 * 60_000 },
  providers: [
    {
      name: "getForecast",
      description: "Current conditions + hourly outlook for a city.",
      input: {
        type: "object",
        properties: { city: { type: "string" } },
        required: ["city"],
      },
    },
  ],
  widgets: [],
};

/** Example: a deno-runtime extension entry file using the SDK. */
async function example_deno_entry(
  startExtension: (handler: DenoExtensionHandler) => Promise<void>,
) {
  await startExtension(async (ctx) => {
    const server = (globalThis as { Deno?: { serve: Function } }).Deno!.serve(
      { port: ctx.port, hostname: "127.0.0.1", signal: ctx.signal },
      (_req: Request) =>
        Response.json({ ok: true, extensionId: ctx.extensionId }),
    );
    await server.finished;
  });
}
