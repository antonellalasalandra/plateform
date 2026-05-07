export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ channel: "tenant:demo-tenant:restaurant:demo-restaurant" })}\n\n`
        )
      );

      const timer = setInterval(() => {
        controller.enqueue(
          encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`)
        );
      }, 15_000);

      return () => clearInterval(timer);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
