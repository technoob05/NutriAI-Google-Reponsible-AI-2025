const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
  if (event.data.type === 'processInput') {
    const { value } = event.data;
    // Immediately post back the value for instant UI update
    ctx.postMessage({
      type: 'localUpdate',
      value: value
    });
  }
});
