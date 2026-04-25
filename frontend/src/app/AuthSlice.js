

import {createSlice} from "@reduxjs/toolkit"

const initialState={
    user:null,
    token:null,
    IsAuthenticated:false

}

const AuthSlice=createSlice({
    name:'auth',
    initialState,
    reducers:{
        setAuth:(state,action)=>{
            const{user,token}=action.payload
            state.user=user
            state.token=token
            state.IsAuthenticated=true
        },
        setClear:(state)=>{
            state.user=null,
            state.token=null,
            state.IsAuthenticated=false
        }
    } 
})


export const {setAuth,setClear}=AuthSlice.actions

export const SelectedToken =(state)=>state.auth.token

export default AuthSlice.reducer