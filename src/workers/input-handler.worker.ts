const CHUNK_SIZE = 100;

const processInput = (value: string) => {
  // Process in chunks for better performance
  let result = '';
  
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    const chunk = value.slice(i, i + CHUNK_SIZE);
    result += processChunk(chunk);
  }

  return result;
}

const processChunk = (chunk: string) => {
  // Optimize chunk processing
  return chunk
    .normalize('NFKC') // Normalize unicode
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase();
}

// Add throttling to prevent too many messages
let lastProcessTime = 0;
const THROTTLE_MS = 16; // ~60fps

self.addEventListener('message', (e) => {
  if (e.data.type === 'process') {
    const now = Date.now();
    if (now - lastProcessTime >= THROTTLE_MS) {
      const result = processInput(e.data.value);
      self.postMessage({ 
        type: 'processComplete', 
        result,
        timeTaken: Date.now() - now
      });
      lastProcessTime = now;
    }
  }
});

export {};
