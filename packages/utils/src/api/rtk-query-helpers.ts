export function createOptimisticUpdate<TArg, TResult>(config: {
  queryFn: (arg: TArg) => Promise<TResult>;
  onOptimistic: (arg: TArg) => TResult;
  onError?: (error: unknown, arg: TArg) => void;
}) {
  const { queryFn, onOptimistic, onError } = config;

  if (typeof queryFn !== 'function') {
    throw new Error('queryFn must be a function');
  }

  return {
    async query(arg: TArg) {
      try {
        const result = await queryFn(arg);
        return { data: result };
      } catch (error) {
        onError?.(error, arg);
        return { error };
      }
    },
    onOptimistic,
  };
}

export function createPaginatedEndpointBuilder(builder: any, config: {
  query: (params: Record<string, unknown>) => { url: string; params?: Record<string, unknown> };
  providesTags?: string[];
}) {
  return builder.query({
    query: config.query,
    providesTags: config.providesTags ?? [],
    serializeQueryArgs: ({ queryArgs }: { queryArgs: Record<string, unknown> }) => {
      return JSON.stringify(queryArgs);
    },
    merge: (currentCache: any, newItems: any) => {
      if (currentCache?.data) {
        currentCache.data.push(...(newItems?.data ?? []));
      }
    },
    forceRefetch: ({ currentArg, previousArg }: { currentArg: any; previousArg: any }) => {
      return JSON.stringify(currentArg) !== JSON.stringify(previousArg);
    },
  });
}

export function createWebSocketEndpointConfig(config: {
  url: string;
  onMessage: (data: unknown) => void;
  onError?: (error: unknown) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}) {
  const { url, onMessage, onError, reconnect = true, reconnectInterval = 3000 } = config;

  if (!url?.trim()) {
    throw new Error('WebSocket URL is required');
  }

  // SSR guard
  if (typeof WebSocket === 'undefined') {
    return {
      connect: () => {},
      disconnect: () => {},
      send: () => {},
    };
  }

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    ws = new WebSocket(url);
    ws.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage(event.data);
      }
    };
    ws.onerror = (event) => onError?.(event);
    ws.onclose = () => {
      if (reconnect) {
        reconnectTimer = setTimeout(connect, reconnectInterval);
      }
    };
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
  }

  function send(data: unknown) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  return { connect, disconnect, send };
}
