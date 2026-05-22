/* Onboarding — three steps: welcome → provider → key. Optional sample-widget step.
   Works on both desktop and iOS layouts; styles flex via .iphone .onb selectors. */

const PROVIDERS = [
  { id: "claude-code", name: "Claude Code", sub: "sonnet · local CLI",            bg: "#D97757", glyph: "CC", keyHint: null, isCli: true },
  { id: "groq",       name: "Groq",       sub: "llama-3.3-70b · low-latency",  bg: "#FF9F0A", glyph: "G",  keyHint: "gsk_•••" },
  { id: "openrouter", name: "OpenRouter", sub: "Any model · pay-per-use",      bg: "#5E5CE6", glyph: "OR", keyHint: "sk-or-•••" },
  { id: "openai",     name: "OpenAI",     sub: "gpt-4o · official",            bg: "#10A37F", glyph: "AI", keyHint: "sk-proj-•••" },
  { id: "ollama",     name: "Ollama",     sub: "Local · port 11434",           bg: "#30D158", glyph: "●",  keyHint: null },
];

function ProgressDots({ step, total }) {
  return (
    <div className="onb-progress">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`dot ${i === step ? "on" : i < step ? "done" : ""}`}></div>
      ))}
    </div>
  );
}

function StepWelcome({ onNext }) {
  return (
    <div className="onb">
      <ProgressDots step={0} total={3} />
      <div className="onb-mark"><Icon name="sparkles" size={32} color="white" /></div>
      <div className="onb-ttl">Hi.</div>
      <div className="onb-ttl">Let's pick a brain.</div>
      <div className="onb-sub" style={{ marginTop: 12 }}>
        gen-app builds you live widgets from a chat. First we need a model to chat with.
      </div>
      <div className="onb-actions">
        <Button variant="primary" size="lg" onClick={onNext} iconAfter="arrow-right">Get started</Button>
      </div>
    </div>
  );
}

function StepProvider({ value, onPick, onBack, onNext }) {
  return (
    <div className="onb">
      <ProgressDots step={1} total={3} />
      <div className="onb-step-meta">Step 1 of 2</div>
      <div className="onb-ttl" style={{ fontSize: 32 }}>Pick a provider.</div>
      <div className="onb-sub" style={{ marginTop: 8, marginBottom: 18 }}>
        Exactly one runs the chat at a time. You can switch later in Settings.
      </div>
      <div className="list" style={{ marginBottom: 14 }}>
        {PROVIDERS.map(p => (
          <ListRow
            key={p.id}
            icon={p.glyph}
            iconBg={p.bg}
            title={p.name}
            sub={p.sub}
            selected={value === p.id}
            onClick={() => onPick(p.id)}
          />
        ))}
      </div>
      <div className="onb-actions">
        <Button variant="secondary" size="lg" onClick={onBack}>Back</Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!value} iconAfter="arrow-right">Continue</Button>
      </div>
    </div>
  );
}

function StepKey({ provider, onBack, onNext }) {
  const [key, setKey] = React.useState("");
  const p = PROVIDERS.find(x => x.id === provider);
  const isLocal = provider === "ollama";
  const isCli = provider === "claude-code";
  return (
    <div className="onb">
      <ProgressDots step={2} total={3} />
      <div className="onb-step-meta">Step 2 of 2</div>
      <div className="onb-ttl" style={{ fontSize: 32 }}>
        {isCli ? "Hook up Claude Code." : isLocal ? "Connect Ollama." : `Bring a ${p.name} key.`}
      </div>
      <div className="onb-sub" style={{ marginTop: 8, marginBottom: 18 }}>
        {isCli
          ? <>Make sure <code className="code">claude</code> is installed and you're logged in. We'll talk to it through the CLI — no API key needed.</>
          : isLocal
            ? "Make sure Ollama is running locally. We'll talk to it on port 11434."
            : <>We'll keep it in your <strong style={{ color: "var(--fg1)" }}>OS keychain</strong>. Never leaves this device.</>}
      </div>

      {isCli && (
        <div className="list" style={{ marginBottom: 14 }}>
          <div className="list-row">
            <div className="row-ic" style={{ background: "var(--bg-card-elevated)" }}>
              <Icon name="terminal" size={14} color="var(--color-green)" />
            </div>
            <div className="row-body">
              <div className="row-title" style={{ fontFamily: "var(--font-mono)" }}>claude</div>
              <div className="row-sub">v1.2.4 · authenticated as <span style={{ color: "var(--fg1)" }}>you@anthropic</span></div>
            </div>
            <div className="row-right" style={{ color: "var(--color-green)" }}>●</div>
          </div>
        </div>
      )}

      {!isLocal && !isCli && (
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field-label">API key</label>
          <input
            className="field-input"
            placeholder={p.keyHint}
            value={key}
            autoFocus
            onChange={e => setKey(e.target.value)}
          />
          <div style={{ fontSize: 11, color: "var(--fg3)", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="key" size={11} color="var(--fg3)" />
            Stored in OS keychain
          </div>
        </div>
      )}

      {isLocal && (
        <div className="list" style={{ marginBottom: 14 }}>
          <div className="list-row">
            <div className="row-ic" style={{ background: "var(--color-green)" }}>●</div>
            <div className="row-body">
              <div className="row-title">localhost:11434</div>
              <div className="row-sub">Connected · llama3.2:3b ready</div>
            </div>
            <div className="row-right" style={{ color: "var(--color-green)" }}>●</div>
          </div>
        </div>
      )}

      <div className="onb-actions">
        <Button variant="secondary" size="lg" onClick={onBack}>Back</Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!isLocal && !isCli && !key} iconAfter="check">Done</Button>
      </div>
    </div>
  );
}

function StepSample({ onPick, onSkip }) {
  const samples = [
    { id: "weather",  label: "Weather in Brooklyn",  hint: "@weather",  emoji: "☀" },
    { id: "stock",    label: "AAPL stock chart",     hint: "@market",   emoji: "▲" },
    { id: "calendar", label: "Today's agenda",       hint: "@today",    emoji: "📅" },
  ];
  return (
    <div className="onb">
      <ProgressDots step={3} total={4} />
      <div className="onb-step-meta">Step 3 of 3</div>
      <div className="onb-ttl" style={{ fontSize: 32 }}>Try a sample.</div>
      <div className="onb-sub" style={{ marginTop: 8, marginBottom: 18 }}>
        Pick one to see how it works. You can ask for anything later — these are just stretches.
      </div>
      <div className="list" style={{ marginBottom: 14 }}>
        {samples.map(s => (
          <ListRow
            key={s.id}
            icon={s.emoji}
            iconBg="var(--bg-card-elevated)"
            title={s.label}
            sub={`Will tag it ${s.hint}`}
            onClick={() => onPick(s.id)}
          />
        ))}
      </div>
      <div className="onb-actions">
        <Button variant="clear" size="lg" onClick={onSkip}>Skip — take me to the canvas</Button>
      </div>
    </div>
  );
}

function Onboarding({ onFinish }) {
  const [step, setStep] = React.useState(0);
  const [provider, setProvider] = React.useState(null);

  if (step === 0) return <StepWelcome onNext={() => setStep(1)} />;
  if (step === 1) return <StepProvider value={provider} onPick={setProvider} onBack={() => setStep(0)} onNext={() => setStep(2)} />;
  if (step === 2) return <StepKey provider={provider} onBack={() => setStep(1)} onNext={() => setStep(3)} />;
  if (step === 3) return <StepSample
    onPick={(sampleId) => onFinish?.({ provider, sample: sampleId })}
    onSkip={() => onFinish?.({ provider, sample: null })}
  />;
  return null;
}

Object.assign(window, { Onboarding, PROVIDERS, StepSample });
