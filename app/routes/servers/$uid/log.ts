import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/log';

// TODO Clean (see index.tsx)
export async function loader({ params: { uid }, request }: Route.LoaderArgs) {
  await requireAuth(request);
  const server = getOrCreateServer(uid);
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`event: init\ndata: ${JSON.stringify(server.history)}\n\n`));
      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
        } catch {}
      }, 25000);

      const off = server.onLine((line) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: append\ndata: ${JSON.stringify(line)}\n\n`));
        } catch {}
      });

      const abort = () => {
        if (closed) return;
        closed = true;
        off();
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener('abort', abort);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
