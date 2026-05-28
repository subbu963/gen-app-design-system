// React 18's new JSX transform. Modules built by bundlers/transpilers expect
// `react/jsx-runtime` to expose `jsx`, `jsxs`, `jsxDEV`, `Fragment`. The
// classic UMD React on window doesn't export these directly — we synthesize
// them by routing through React.createElement, which honours `props.children`.
import React from "react";

export const Fragment = React.Fragment;

export function jsx(type, props, key) {
  const config = key !== undefined ? { ...props, key } : props;
  return React.createElement(type, config);
}

// `jsxs` is the static-children variant of `jsx`; same shape, same impl here.
export const jsxs  = jsx;
export const jsxDEV = jsx;
