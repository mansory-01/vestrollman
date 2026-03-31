import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "./slice/modalSlice";

/**
 * Configures and returns the Redux store.
 * 
 * @returns The configured Redux store.
 */
export const Store = () => {
  return configureStore({
    reducer: {
      modal: modalReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["modal.modalProps"],
          ignoredActions: [
            "modal/openModal",
            "modal/closeModal",
            "modal/resetModal",
          ],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof Store>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
