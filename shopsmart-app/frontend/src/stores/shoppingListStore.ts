import { create } from 'zustand';
import { ShoppingList, ShoppingListItem, Product } from '@/shared/types';
import { shoppingListApi } from '../services/api';
import toast from 'react-hot-toast';

interface ShoppingListState {
  // Lists
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  isLoading: boolean;
  error: string | null;

  // List management actions
  fetchLists: () => Promise<void>;
  createList: (name: string, items?: Partial<ShoppingListItem>[]) => Promise<ShoppingList | null>;
  updateList: (listId: string, updates: Partial<ShoppingList>) => Promise<boolean>;
  deleteList: (listId: string) => Promise<boolean>;
  selectList: (listId: string) => Promise<void>;

  // Item management actions
  addItem: (listId: string, item: Partial<ShoppingListItem>) => Promise<boolean>;
  addItems: (listId: string, items: Partial<ShoppingListItem>[]) => Promise<boolean>;
  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => Promise<boolean>;
  removeItem: (listId: string, itemId: string) => Promise<boolean>;
  toggleItemCompleted: (listId: string, itemId: string) => Promise<boolean>;

  // Smart features
  addProductToList: (listId: string, product: Product, quantity?: number) => Promise<boolean>;
  assignStores: (listId: string, options?: { preferredStores?: string[], optimizeForPrice?: boolean }) => Promise<boolean>;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  // Initial state
  lists: [],
  currentList: null,
  isLoading: false,
  error: null,

  // Fetch all shopping lists
  fetchLists: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await shoppingListApi.getLists();

      if (response.success && response.data) {
        set({
          lists: response.data,
          isLoading: false
        });
      } else {
        throw new Error(response.error || 'Failed to fetch shopping lists');
      }
    } catch (error: any) {
      console.error('Error fetching shopping lists:', error);
      set({
        error: error.message || 'Failed to fetch shopping lists',
        isLoading: false
      });
    }
  },

  // Create a new shopping list
  createList: async (name: string, items: Partial<ShoppingListItem>[] = []) => {
    set({ isLoading: true, error: null });

    try {
      const response = await shoppingListApi.createList({ name, items });

      if (response.success && response.data) {
        const newList = response.data;
        
        set(state => ({
          lists: [newList, ...state.lists],
          isLoading: false
        }));

        toast.success('Shopping list created successfully');
        return newList;
      } else {
        throw new Error(response.error || 'Failed to create shopping list');
      }
    } catch (error: any) {
      console.error('Error creating shopping list:', error);
      const errorMessage = error.message || 'Failed to create shopping list';
      
      set({
        error: errorMessage,
        isLoading: false
      });

      toast.error(errorMessage);
      return null;
    }
  },

  // Update shopping list
  updateList: async (listId: string, updates: Partial<ShoppingList>) => {
    try {
      const response = await shoppingListApi.updateList(listId, updates);

      if (response.success && response.data) {
        set(state => ({
          lists: state.lists.map(list => 
            list.id === listId ? { ...list, ...response.data } : list
          ),
          currentList: state.currentList?.id === listId 
            ? { ...state.currentList, ...response.data }
            : state.currentList
        }));

        toast.success('Shopping list updated');
        return true;
      } else {
        throw new Error(response.error || 'Failed to update shopping list');
      }
    } catch (error: any) {
      console.error('Error updating shopping list:', error);
      toast.error(error.message || 'Failed to update shopping list');
      return false;
    }
  },

  // Delete shopping list
  deleteList: async (listId: string) => {
    try {
      const response = await shoppingListApi.deleteList(listId);

      if (response.success) {
        set(state => ({
          lists: state.lists.filter(list => list.id !== listId),
          currentList: state.currentList?.id === listId ? null : state.currentList
        }));

        toast.success('Shopping list deleted');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete shopping list');
      }
    } catch (error: any) {
      console.error('Error deleting shopping list:', error);
      toast.error(error.message || 'Failed to delete shopping list');
      return false;
    }
  },

  // Select and load a specific shopping list
  selectList: async (listId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await shoppingListApi.getList(listId);

      if (response.success && response.data) {
        set({
          currentList: response.data,
          isLoading: false
        });
      } else {
        throw new Error(response.error || 'Failed to load shopping list');
      }
    } catch (error: any) {
      console.error('Error loading shopping list:', error);
      set({
        error: error.message || 'Failed to load shopping list',
        isLoading: false
      });
    }
  },

  // Add single item to shopping list
  addItem: async (listId: string, item: Partial<ShoppingListItem>) => {
    try {
      const response = await shoppingListApi.addItems(listId, [item]);

      if (response.success && response.data) {
        const addedItems = response.data;
        
        // Update the current list if it's the one being modified
        if (get().currentList?.id === listId) {
          set(state => ({
            currentList: state.currentList ? {
              ...state.currentList,
              items: [...state.currentList.items, ...addedItems]
            } : null
          }));
        }

        // Update the list in the lists array
        set(state => ({
          lists: state.lists.map(list => 
            list.id === listId 
              ? { ...list, itemCount: (list.itemCount || 0) + addedItems.length }
              : list
          )
        }));

        toast.success('Item added to shopping list');
        return true;
      } else {
        throw new Error(response.error || 'Failed to add item');
      }
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(error.message || 'Failed to add item');
      return false;
    }
  },

  // Add multiple items to shopping list
  addItems: async (listId: string, items: Partial<ShoppingListItem>[]) => {
    try {
      const response = await shoppingListApi.addItems(listId, items);

      if (response.success && response.data) {
        const addedItems = response.data;
        
        // Update the current list if it's the one being modified
        if (get().currentList?.id === listId) {
          set(state => ({
            currentList: state.currentList ? {
              ...state.currentList,
              items: [...state.currentList.items, ...addedItems]
            } : null
          }));
        }

        // Update the list in the lists array
        set(state => ({
          lists: state.lists.map(list => 
            list.id === listId 
              ? { ...list, itemCount: (list.itemCount || 0) + addedItems.length }
              : list
          )
        }));

        toast.success(`${addedItems.length} items added to shopping list`);
        return true;
      } else {
        throw new Error(response.error || 'Failed to add items');
      }
    } catch (error: any) {
      console.error('Error adding items:', error);
      toast.error(error.message || 'Failed to add items');
      return false;
    }
  },

  // Update shopping list item
  updateItem: async (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => {
    try {
      const response = await shoppingListApi.updateItem(listId, itemId, updates);

      if (response.success && response.data) {
        const updatedItem = response.data;
        
        // Update the current list if it's the one being modified
        if (get().currentList?.id === listId) {
          set(state => ({
            currentList: state.currentList ? {
              ...state.currentList,
              items: state.currentList.items.map(item => 
                item.id === itemId ? updatedItem : item
              )
            } : null
          }));
        }

        return true;
      } else {
        throw new Error(response.error || 'Failed to update item');
      }
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
      return false;
    }
  },

  // Remove item from shopping list
  removeItem: async (listId: string, itemId: string) => {
    try {
      const response = await shoppingListApi.removeItem(listId, itemId);

      if (response.success) {
        // Update the current list if it's the one being modified
        if (get().currentList?.id === listId) {
          set(state => ({
            currentList: state.currentList ? {
              ...state.currentList,
              items: state.currentList.items.filter(item => item.id !== itemId)
            } : null
          }));
        }

        // Update the list in the lists array
        set(state => ({
          lists: state.lists.map(list => 
            list.id === listId 
              ? { ...list, itemCount: Math.max(0, (list.itemCount || 1) - 1) }
              : list
          )
        }));

        toast.success('Item removed from shopping list');
        return true;
      } else {
        throw new Error(response.error || 'Failed to remove item');
      }
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error(error.message || 'Failed to remove item');
      return false;
    }
  },

  // Toggle item completion status
  toggleItemCompleted: async (listId: string, itemId: string) => {
    const currentList = get().currentList;
    if (!currentList || currentList.id !== listId) return false;

    const item = currentList.items.find(item => item.id === itemId);
    if (!item) return false;

    return get().updateItem(listId, itemId, { completed: !item.completed });
  },

  // Add a product to shopping list
  addProductToList: async (listId: string, product: Product, quantity: number = 1) => {
    const item: Partial<ShoppingListItem> = {
      productId: product.id,
      quantity,
      priority: 'medium'
    };

    return get().addItem(listId, item);
  },

  // Assign items to optimal stores
  assignStores: async (listId: string, options: { preferredStores?: string[], optimizeForPrice?: boolean } = {}) => {
    try {
      const response = await shoppingListApi.assignStores(listId, {
        preferredStores: options.preferredStores,
        optimizeForPrice: options.optimizeForPrice ?? true
      });

      if (response.success && response.data) {
        // Refresh the current list to show store assignments
        if (get().currentList?.id === listId) {
          await get().selectList(listId);
        }

        toast.success('Items assigned to optimal stores');
        return true;
      } else {
        throw new Error(response.error || 'Failed to assign stores');
      }
    } catch (error: any) {
      console.error('Error assigning stores:', error);
      toast.error(error.message || 'Failed to assign stores');
      return false;
    }
  },

  // Utility actions
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading })
}));