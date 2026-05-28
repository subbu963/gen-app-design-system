// Re-export the UMD React already on window, so esm.sh imports of `react`
// resolve to ONE React instance (the one that's actually rendering).
// Loaded via the importmap in index.html.
const R = window.React;
export default R;
export const {
  // Hooks
  useState, useEffect, useRef, useMemo, useCallback, useContext,
  useReducer, useLayoutEffect, useImperativeHandle, useTransition,
  useDeferredValue, useSyncExternalStore, useId, useDebugValue,
  useInsertionEffect,
  // Top-level API
  createElement, Fragment, forwardRef, memo, lazy,
  Children, Component, PureComponent, cloneElement, createRef,
  createContext, isValidElement, StrictMode, Suspense, Profiler,
  startTransition, version,
} = R;

