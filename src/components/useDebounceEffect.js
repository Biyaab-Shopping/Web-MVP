import { useEffect } from "react";

export function useDebounceEffect(fn, waitTime, deps) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn.apply(undefined, deps);
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
    // Custom hook: caller supplies the dependency array via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
