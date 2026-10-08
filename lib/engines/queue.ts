interface Queue {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

const queues = new Map<string, Queue>();

/** One FIFO queue per name, running a single job at a time. */
export function getQueue(name: string): Queue {
  let queue = queues.get(name);
  if (!queue) {
    let tail: Promise<unknown> = Promise.resolve();
    queue = {
      run<T>(fn: () => Promise<T>): Promise<T> {
        const result = tail.then(fn);
        tail = result.catch(() => undefined);
        return result;
      },
    };
    queues.set(name, queue);
  }
  return queue;
}
