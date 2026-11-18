export type HideState = {
  all: boolean;
  rows: string[];
  cells: string[];
  shown: string[];
};

export const OPEN_HIDE: HideState = { all: false, rows: [], cells: [], shown: [] };

function without(list: string[], value: string): string[] {
  return list.filter((item) => item !== value);
}

export function isHidden(state: HideState, cellId: string, row: string): boolean {
  if (state.shown.includes(cellId)) return false;
  if (state.all || state.rows.includes(row) || state.cells.includes(cellId)) return true;
  return false;
}

export function tapCell(state: HideState, cellId: string, row: string): HideState {
  if (isHidden(state, cellId, row)) {
    return {
      ...state,
      cells: without(state.cells, cellId),
      shown: state.shown.includes(cellId) ? state.shown : [...state.shown, cellId],
    };
  }
  return {
    ...state,
    shown: without(state.shown, cellId),
    cells: state.cells.includes(cellId) ? state.cells : [...state.cells, cellId],
  };
}

export function tapRow(state: HideState, row: string, cellIds: string[]): HideState {
  const hidden = cellIds.length > 0 && cellIds.every((id) => isHidden(state, id, row));
  if (hidden) {
    const drop = new Set(cellIds);
    return {
      ...state,
      all: false,
      rows: without(state.rows, row),
      cells: state.cells.filter((id) => !drop.has(id)),
      shown: [...new Set([...state.shown.filter((id) => !drop.has(id)), ...cellIds])],
    };
  }
  return {
    ...state,
    rows: state.rows.includes(row) ? state.rows : [...state.rows, row],
    cells: state.cells.filter((id) => !cellIds.includes(id)),
    shown: state.shown.filter((id) => !cellIds.includes(id)),
  };
}

export function toggleHideAll(state: HideState): HideState {
  if (state.all && state.shown.length === 0 && state.rows.length === 0 && state.cells.length === 0) {
    return OPEN_HIDE;
  }
  if (state.all) return OPEN_HIDE;
  return { all: true, rows: [], cells: [], shown: [] };
}
