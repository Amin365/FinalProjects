import { describe, it, expect } from "vitest";
import reducer, { setAuth, setClear } from "../app/AuthSlice";

const initialState = { user: null, token: null, IsAuthenticated: false };

describe("AuthSlice reducer", () => {
  it("returns the initial state for unknown actions", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("setAuth stores user, token and sets IsAuthenticated to true", () => {
    const user = { _id: "u1", username: "alice", email: "alice@test.com" };
    const token = "jwt-token-123";
    const nextState = reducer(initialState, setAuth({ user, token }));
    expect(nextState.user).toEqual(user);
    expect(nextState.token).toBe(token);
    expect(nextState.IsAuthenticated).toBe(true);
  });

  it("setClear resets the state to unauthenticated", () => {
    const loggedIn = {
      user: { _id: "u1", username: "alice" },
      token: "some-token",
      IsAuthenticated: true,
    };
    const nextState = reducer(loggedIn, setClear());
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.IsAuthenticated).toBe(false);
  });

  it("setAuth followed by setClear returns initial state", () => {
    let state = reducer(
      initialState,
      setAuth({ user: { _id: "u1" }, token: "tok" })
    );
    state = reducer(state, setClear());
    expect(state).toEqual(initialState);
  });
});

describe("AuthSlice action creators", () => {
  it("setAuth action has correct type", () => {
    const action = setAuth({ user: null, token: null });
    expect(action.type).toBe("auth/setAuth");
  });

  it("setClear action has correct type", () => {
    const action = setClear();
    expect(action.type).toBe("auth/setClear");
  });
});
