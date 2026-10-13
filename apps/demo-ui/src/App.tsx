import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type Failure = 'none' | 'billing' | 'provisioning';

// Lo que emite activation-api por WebSocket en cada cambio
interface TimelineMessage {
  activationId: string;
  customerId: string;
  eventType: string;
  at: string;
  status: string;
}

const isFinal = (status: string) => status === 'ACTIVE' || status === 'FAILED';

// Color de cada evento en la timeline
function eventClass(eventType: string): string {
  if (eventType.includes('Failed')) return 'bad';
  if (eventType.includes('Cancelled')) return 'warn';
  return 'ok';
}

export default function App() {
  const [customerId, setCustomerId] = useState('C-1234');
  const [planId, setPlanId] = useState('FLOW-FULL');
  const [failure, setFailure] = useState<Failure>('none');
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<TimelineMessage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Una sola conexión WebSocket mientras la página está abierta
  useEffect(() => {
    const socket = io(API_URL);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('activation.update', (m: TimelineMessage) => {
      setEvents((prev) =>
        prev.some(
          (e) => e.activationId === m.activationId && e.eventType === m.eventType && e.at === m.at,
        )
          ? prev
          : [...prev, m],
      );
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_URL}/activations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, planId, simulateFailure: failure }),
      });
      if (!res.ok) throw new Error(`La API respondió ${res.status}`);
      const data: { activationId: string } = await res.json();
      setSelected(data.activationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  // Lista de activaciones vistas, la más nueva primero. Una vez ACTIVE o FAILED, el estado no cambia.
  const activations = useMemo(() => {
    const map = new Map<string, { id: string; customerId: string; status: string }>();
    for (const ev of events) {
      const cur = map.get(ev.activationId);
      if (!cur || !isFinal(cur.status)) {
        map.set(ev.activationId, { id: ev.activationId, customerId: ev.customerId, status: ev.status });
      }
    }
    return [...map.values()].reverse();
  }, [events]);

  const current = selected ?? activations[0]?.id ?? null;

  const timeline = useMemo(
    () =>
      events
        .filter((ev) => ev.activationId === current)
        .sort((a, b) => a.at.localeCompare(b.at)),
    [events, current],
  );

  return (
    <main>
      <header>
        <h1>Activación de servicios con Kafka</h1>
        <span className={connected ? 'dot on' : 'dot off'}>
          {connected ? 'Conectado' : 'Sin conexión'}
        </span>
      </header>

      <section className="card">
        <h2>Contratar plan</h2>
        <form onSubmit={onSubmit}>
          <label>
            Cliente
            <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
          </label>
          <label>
            Plan
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="FLOW-FULL">FLOW-FULL</option>
              <option value="FLOW-BASIC">FLOW-BASIC</option>
            </select>
          </label>
          <label>
            Forzar fallo en
            <select value={failure} onChange={(e) => setFailure(e.target.value as Failure)}>
              <option value="none">Ninguno</option>
              <option value="billing">Billing</option>
              <option value="provisioning">Provisioning</option>
            </select>
          </label>
          <button type="submit">Contratar</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      {activations.length > 0 && (
        <section className="card">
          <h2>Activaciones</h2>
          <div className="chips">
            {activations.map((a) => (
              <button
                key={a.id}
                className={`chip ${a.status} ${a.id === current ? 'selected' : ''}`}
                onClick={() => setSelected(a.id)}
              >
                {a.id} · {a.customerId} · {a.status}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Timeline {current && <small>{current}</small>}</h2>
        {timeline.length === 0 ? (
          <p className="muted">Contratá un plan para ver los eventos en vivo.</p>
        ) : (
          <ol className="timeline">
            {timeline.map((ev) => (
              <li key={`${ev.eventType}-${ev.at}`} className={eventClass(ev.eventType)}>
                <time>{new Date(ev.at).toLocaleTimeString('es-AR')}</time>
                <span>{ev.eventType}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
