import { useStore } from "../state/Store";
import {
  homeLayoutRoom,
  widgetNames,
  type Widget,
  type WidgetSize,
} from "../state/model";
import { Panel } from "./primitives";
export function DashboardSettings() {
  const { state, dispatch } = useStore();
  const widgets = state.household.layouts[homeLayoutRoom].filter(
    (w) => w !== "quick",
  );
  const save = (next: Widget[]) =>
    dispatch({ type: "layout", room: homeLayoutRoom, widgets: next });
  function move(index: number, offset: number) {
    const next = [...widgets];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    save(next);
  }
  return (
    <Panel title="Dashboard layout" className="editor">
      <p>
        One shared Home layout for all profiles. Choose, arrange and resize its
        widgets here.
      </p>
      <div className="widget-options">
        {(Object.keys(widgetNames) as Widget[])
          .filter((w) => w !== "quick")
          .map((widget) => (
            <label key={widget}>
              <input
                type="checkbox"
                checked={widgets.includes(widget)}
                onChange={() =>
                  save(
                    widgets.includes(widget)
                      ? widgets.filter((w) => w !== widget)
                      : [...widgets, widget],
                  )
                }
              />
              {widgetNames[widget]}
            </label>
          ))}
      </div>
      <div className="layout-editor">
        {widgets.map((widget, index) => (
          <div className="layout-row" key={widget}>
            <strong>{widgetNames[widget]}</strong>
            <div className="button-row">
              <button
                aria-label={`Move ${widgetNames[widget]} earlier`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Move ${widgetNames[widget]} later`}
                disabled={index === widgets.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <label className="size-label">
                Size
                <select
                  aria-label={`${widgetNames[widget]} widget size`}
                  value={
                    state.household.sizes[homeLayoutRoom][widget] || "small"
                  }
                  onChange={(event) =>
                    dispatch({
                      type: "size",
                      room: homeLayoutRoom,
                      widget,
                      size: event.target.value as WidgetSize,
                    })
                  }
                >
                  <option value="small">Small</option>
                  <option value="wide">Wide</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
