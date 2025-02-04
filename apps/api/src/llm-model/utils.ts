const textEncoder = new TextEncoder();

export async function streamToController(
  controller: ReadableStreamDefaultController,
  dataFetcher:
    | AsyncGenerator<Uint8Array | string, void, unknown>
    | AsyncIterable<Uint8Array | string>,
) {
  try {
    for await (const chunk of dataFetcher) {
      if (typeof chunk === "string") {
        controller.enqueue(textEncoder.encode(chunk));
      } else {
        controller.enqueue(chunk);
      }
      controller.enqueue(textEncoder.encode("\n"));
    }
    controller.close();
  } catch (err) {
    console.error("Error during streaming:", err);
    controller.error(err);
  }
}
