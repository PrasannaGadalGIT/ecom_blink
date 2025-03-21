import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { addItems } from "./cartAdd";

export interface CartSliceState {
    productName: string;
    price: number;
    description: string;
    quantity: number;
    userId: number;
    imageUrl: string;
}

interface CartState {
    items: CartSliceState[];
    loading: boolean;
    error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null
};

// Create an async thunk for adding items to cart
export const addToCartAsync = createAsyncThunk(
  'api/prisma/cart/add',
  async (cartDetail: CartSliceState, { dispatch }) => {
    try {
      const { userId, productName, imageUrl, description, price, quantity } = cartDetail;
      
      // Call your backend function
      const result = await addItems({ userId, productName, imageUrl, description, price, quantity });
      
      // Update Redux store
      dispatch(addToCart(cartDetail));
      
      return result;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }
);

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
      addToCart: (state, action: PayloadAction<CartSliceState>) => {
        const existingItem = state.items.find(item => item.productName === action.payload.productName);
  
        if (existingItem) {
          existingItem.quantity += action.payload.quantity;
        } else {
          state.items.push({ ...action.payload });
        }
      },
  
      removeFromCart: (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(item => item.productName !== action.payload);
      },

      increaseQuantity: (state, action: PayloadAction<string>) => {
        const item = state.items.find(item => item.productName === action.payload);
        if (item) {
          item.quantity += 1;
        }
      },

      decreaseQuantity: (state, action: PayloadAction<string>) => {
        const item = state.items.find(item => item.productName === action.payload);
        if (item && item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items = state.items.filter(item => item.productName !== action.payload);
        }
      },
  
      clearCart: (state) => {
        state.items = [];
      }
    },
    extraReducers: (builder) => {
      builder
        .addCase(addToCartAsync.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(addToCartAsync.fulfilled, (state) => {
          state.loading = false;
        })
        .addCase(addToCartAsync.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'Failed to add item to cart';
        });
    }
});

export const { addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
