// Re-export the UMD ReactDOM already on window. Pairs with react-shim.mjs.
const RD = window.ReactDOM;
export default RD;
export const {
  findDOMNode, flushSync, unmountComponentAtNode, createPortal, render,
  hydrate, unstable_batchedUpdates, version,
  createRoot, hydrateRoot,
} = RD;
