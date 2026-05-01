import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  login as loginRequest,
  register as registerRequest,
  setAuthTokenGetter,
  type AuthUser,
  type LoginBody,
  type RegisterBody,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * AuthProvider
 *
 * Owns:
 *   - the current JWT (persisted in localStorage under `fittrack.token`)
 *   - the current user (loaded from /auth/me on boot)
 *
 * Exposes login/register/logout helpers and wires `setAuthTokenGetter` so
 * every generated hook automatically sends the bearer token.
 *
 * Design notes:
 *   - We keep the token in a ref so the getter is stable across re-renders.
 *     `setAuthTokenGetter` is called once on mount; the getter reads the
 *     latest ref value at call time.
 *   - On boot we hydrate synchronously from localStorage, then verify with
 *     /auth/me in the background. A stale token silently logs the user out.
 *   - We clear the React Query cache on login/logout so data fetched under
 *     one identity never leaks into the next session.
 */

const TOKEN_STORAGE_KEY = "fittrack.token";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  /** true until the initial /auth/me probe finishes */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (body: LoginBody) => Promise<AuthUser>;
  register: (body: RegisterBody) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* best-effort persistence — ignore private-mode errors */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(
    () => readStoredToken() != null
  );

  // Ref mirror so the token getter captured by customFetch always sees the
  // current token without us needing to re-register it on every change.
  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

  // Wire the generated client's bearer plumbing exactly once.
  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    return () => setAuthTokenGetter(null);
  }, []);

  // Hydrate from /auth/me so the stored token is validated before we
  // consider the user "signed in". If /me 401s we clear the stale token.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    setIsBootstrapping(true);
    getMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        // Token is no longer valid — treat as logged out.
        writeStoredToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
    // We only want to re-bootstrap when the token itself changes; user
    // isn't in the deps because we set it from this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const applyAuth = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      writeStoredToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      // Fresh identity → purge anything fetched under the previous user.
      queryClient.clear();
    },
    [queryClient]
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (body) => {
      const res = await loginRequest(body);
      applyAuth(res.token, res.user);
      return res.user;
    },
    [applyAuth]
  );

  const register = useCallback<AuthContextValue["register"]>(
    async (body) => {
      const res = await registerRequest(body);
      applyAuth(res.token, res.user);
      return res.user;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, token, isBootstrapping, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
