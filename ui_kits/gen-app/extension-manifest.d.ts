/**
 * gen-app extension manifest — TypeScript schema
 * ----------------------------------------------
 * Extensions are user-authored JS modules that pull data from external sources
 * (HTTP APIs, OS-bridged services, local files) and emit widget payloads.
 *
 * Each extension lives as a single `.js` file in the project's extensions
 * directory and exports two named bindings:
 *
 *   export const manifest: ExtensionManifest;
 *   export async function run(ctx: ExtensionContext): Promise<void>;
 *
 * The host (gen-app) loads the module in a sandboxed worker. Extensions can
 * only reach the outside world through `ctx`, never through `globalThis`.
 *
 * This file is the source of truth for both the editor's autocomplete /
 * type-checking and the runtime validator. Ship it alongside the binary.
 */

// ─── Manifest ───────────────────────────────────────────────────────────────

export interface ExtensionManifest {
  /**
   * Lowercase-kebab-case id, unique per device. Becomes the filename
   * (`{id}.js`) and the prefix users address from chat (`@open-meteo …`).
   */
  id: string;

  /** Human-readable name. Sentence case. e.g. "Open-Meteo". */
  name: string;

  /** Short description shown on the Extensions list. ≤ 60 chars. */
  description?: string;

  /** Semver. Used for upgrade prompts when bundled extensions update. */
  version: `${number}.${number}.${number}`;

  /**
   * Author display string. e.g. "gen-app team" or "Your Name <you@host>".
   * Pure cosmetic — does NOT affect trust.
   */
  author?: string;

  /**
   * Refresh interval in seconds. The host calls `run` on this cadence
   * while at least one widget that uses the extension is mounted.
   *   - `0`   → run only on widget mount or explicit user action
   *   - `n>0` → run every `n` seconds (clamped to ≥ 5 in production)
   */
  refresh: number;

  /**
   * Network allowlist. Only requests whose URL host matches one of these
   * patterns will be permitted by `ctx.fetch`. Use `["*"]` to allow any.
   *
   *   "api.open-meteo.com"              — exact host
   *   "*.googleapis.com"                — wildcard subdomain
   *   "https://example.com/api/v1/*"    — URL prefix
   */
  permissions?: {
    network?: string[];
    /** If true, extension may read+write a small JSON blob via `ctx.storage`. */
    storage?: boolean;
    /** Names of secrets this extension may READ from the keychain. */
    secrets?: string[];
  };

  /**
   * Declares the widget kinds this extension can serve. The model uses
   * this to pick the right extension when creating a widget.
   */
  provides?: Array<{
    kind: string;             // matches Widget.kind, e.g. "weather"
    /** Markdown describing what props the widget accepts. */
    propsDoc?: string;
  }>;
}

// ─── Runtime context passed to `run` ────────────────────────────────────────

export interface ExtensionContext {
  /** Always present. The widget instance the extension was triggered for. */
  widget: {
    /** Stable widget id (matches the canvas widget). */
    id: string;
    /** User-edited @symbol. Falls back to `manifest.id`. */
    symbol: string;
    /** Anything the model emitted into the widget spec. */
    props: Record<string, unknown>;
  };

  /**
   * Read-only view of secrets this extension is allowed to read.
   * Anything NOT listed in `manifest.permissions.secrets` is `undefined`.
   * Constants (non-secret plaintext) flow through here too.
   */
  secrets: Readonly<Record<string, string | undefined>>;

  /**
   * Sandboxed fetch. Same shape as `window.fetch`. Throws if the URL host
   * doesn't match `manifest.permissions.network`.
   */
  fetch: typeof fetch;

  /**
   * Persist a small JSON blob (≤ 100 KB) keyed under this extension.
   * Only available if `manifest.permissions.storage === true`.
   */
  storage?: {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
  };

  /**
   * Push a widget payload back to the host. The host renders it and updates
   * the widget on the canvas. Calling `emit` multiple times in one `run`
   * is allowed — the last call wins.
   */
  emit(payload: WidgetPayload): void;

  /** Structured logging. Shows up in Settings → Logs. */
  log(level: "info" | "warn" | "error", message: string, data?: unknown): void;

  /**
   * AbortSignal that fires if the user removes the widget or the host
   * cancels the run. Long-running fetches should pass `{ signal }`.
   */
  signal: AbortSignal;
}

// ─── Widget payload ──────────────────────────────────────────────────────────

export type WidgetStatus = "live" | "stale" | "pending" | "error";

export interface WidgetPayload {
  /** Drives the status pill rendered in the widget header. */
  status: WidgetStatus;
  /** Human-readable error message when `status === "error"`. */
  message?: string;
  /** Arbitrary kind-specific data. The widget's renderer destructures from here. */
  [key: string]: unknown;
}

// ─── Example: a minimal stub the model can scaffold from ────────────────────

/* eslint-disable @typescript-eslint/no-unused-vars */
const example_manifest: ExtensionManifest = {
  id: "open-meteo",
  name: "Open-Meteo",
  description: "Weather forecasts · 16-day",
  version: "1.2.0",
  author: "gen-app team",
  refresh: 60,
  permissions: {
    network: ["api.open-meteo.com"],
    storage: false,
    secrets: ["UNIT"],
  },
  provides: [
    { kind: "weather", propsDoc: "{ lat: number, lon: number }" },
  ],
};

async function example_run(ctx: ExtensionContext) {
  const { lat = 40.6782, lon = -73.9442 } = (ctx.widget.props as { lat?: number; lon?: number });
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m");
  url.searchParams.set("temperature_unit", ctx.secrets.UNIT ?? "fahrenheit");
  const res = await ctx.fetch(url, { signal: ctx.signal });
  if (!res.ok) {
    ctx.log("error", `HTTP ${res.status}`);
    ctx.emit({ status: "error", message: `HTTP ${res.status}` });
    return;
  }
  const data = await res.json();
  ctx.emit({ status: "live", temp: Math.round(data.current.temperature_2m) });
}
