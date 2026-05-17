import { createSlice } from "@reduxjs/toolkit";
import { moderator } from "./role/moderator";

const initialState = {
    permissions: {
        ...moderator,
    },
      desktopLauncher: true,
};

const CommonnSlice = createSlice({
    name: "common",
    initialState,
    reducers: {
        setDesktopLauncher: (state, action) => {
            state.desktopLauncher = Boolean(action.payload);
        },
        toggleDesktopLauncher: (state) => {
            state.desktopLauncher = !state.desktopLauncher;
        },
    },
});

export const selectPermissions = (state) => state.common.permissions;
export const selectDesktopLauncher = (state) => state.common.desktopLauncher;
export const { setDesktopLauncher, toggleDesktopLauncher } = CommonnSlice.actions;
export default CommonnSlice.reducer;
