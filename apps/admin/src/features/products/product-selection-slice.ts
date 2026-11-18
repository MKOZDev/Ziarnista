import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { sessionEnded, sessionExpired } from '@/store/session-slice';

/** id → product name; names are kept so the dialog can list products from other pages too */
export type ProductSelection = Readonly<Record<string, string>>;

type ProductSelectionState = {
  /** selectionScope() of the list the products were chosen on */
  scope: string;
  items: ProductSelection;
};

const EMPTY: ProductSelection = {};

const initialState: ProductSelectionState = { scope: '', items: EMPTY };

/**
 * In Redux, not in the page's useState: the selection must outlive page changes and a visit to
 * a product's edit page. A selection belongs to one list (filters, search, sort); see the scope.
 */
export const productSelectionSlice = createSlice({
  name: 'productSelection',
  initialState,
  reducers: {
    productSelectionChanged(_state, action: PayloadAction<ProductSelectionState>) {
      return action.payload;
    },
    productSelectionCleared(state, action: PayloadAction<{ scope: string }>) {
      state.scope = action.payload.scope;
      state.items = EMPTY;
    },
    /** After a bulk action: products it succeeded for; the failed ones stay selected */
    productsDeselected(state, action: PayloadAction<readonly string[]>) {
      for (const id of action.payload) {
        delete state.items[id];
      }
    },
  },
  // Product ids of one admin are none of the next one's business
  extraReducers: (builder) => {
    builder.addCase(sessionEnded, () => initialState).addCase(sessionExpired, () => initialState);
  },
  selectors: {
    selectSelectionScope: (state) => state.scope,
    /** Empty for a list other than the one the products were chosen on */
    selectProductSelection: (state, scope: string) => (state.scope === scope ? state.items : EMPTY),
  },
});

export const { productSelectionChanged, productSelectionCleared, productsDeselected } =
  productSelectionSlice.actions;
export const { selectSelectionScope, selectProductSelection } = productSelectionSlice.selectors;
