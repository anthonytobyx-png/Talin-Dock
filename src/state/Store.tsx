import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { reducer, type AppState, type Action } from "./model";
import { localSettings } from "./storage";
const repository = localSettings(() => window.localStorage);
const Context = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
  saved: boolean;
} | null>(null);
export function Store({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    repository.load(),
  );
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    setSaved(repository.save(state));
  }, [state]);
  const lastActivity = useRef(Date.now());
  useEffect(() => {
    const activity = () => {
      lastActivity.current = Date.now();
    };
    const check = () => {
      if (
        state.activeProfile !== "household" &&
        state.profiles[state.activeProfile].idleReturn &&
        Date.now() - lastActivity.current >= 600000
      ) {
        dispatch({ type: "profile", id: "household" });
        lastActivity.current = Date.now();
      }
    };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("scroll", activity, true);
    document.addEventListener("visibilitychange", check);
    const timer = setInterval(check, 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity, true);
      document.removeEventListener("visibilitychange", check);
    };
  }, [state.activeProfile, state.profiles]);
  return (
    <Context.Provider value={{ state, dispatch, saved }}>
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Store missing");
  return value;
}
