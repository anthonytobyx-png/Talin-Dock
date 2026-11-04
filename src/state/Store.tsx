import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
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
