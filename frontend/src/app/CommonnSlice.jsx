import { createSlice } from "@reduxjs/toolkit";
import { moderator } from "./role/moderator";

const initialState = {
    permissions: {
        ...moderator,
    },
};

const CommonnSlice = createSlice({
    name: "common",
    initialState,
    reducers: {},
});

export const selectPermissions = (state) => state.common.permissions;
export default CommonnSlice.reducer;
