export type AuthStatus = "anonymous" | "authenticated";
export type AuthProviderName = "line" | null;

export type ViewerAuthState = {
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  authProvider: AuthProviderName;
  viewerId: string | null;
  displayName: string | null;
  avatar: string | null;
};

type PersistedViewerAuthState = {
  version: number;
  viewer: ViewerAuthState;
};

export const viewerAuthStorageKey = "tarot-mobile-v1.viewer";
const viewerAuthVersion = 1;

export const anonymousViewerState: ViewerAuthState = {
  authStatus: "anonymous",
  isAuthenticated: false,
  authProvider: null,
  viewerId: null,
  displayName: null,
  avatar: null,
};

const lineDisplayNames = [
  "Mira Lin",
  "Noa Chen",
  "Iris Wu",
  "Rin Tsai",
  "Ayla Hsu",
] as const;

function createViewerId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `viewer-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function buildMockLineDisplayName() {
  const index = Date.now() % lineDisplayNames.length;

  return lineDisplayNames[index];
}

export function createMockLineViewer(): ViewerAuthState {
  return {
    authStatus: "authenticated",
    isAuthenticated: true,
    authProvider: "line",
    viewerId: createViewerId(),
    displayName: buildMockLineDisplayName(),
    avatar: null,
  };
}

export function readViewerAuthState() {
  if (typeof window === "undefined") {
    return anonymousViewerState;
  }

  const raw = window.localStorage.getItem(viewerAuthStorageKey);

  if (!raw) {
    return anonymousViewerState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedViewerAuthState>;
    const viewer = parsed.viewer;

    if (!viewer || typeof viewer !== "object") {
      return anonymousViewerState;
    }

    if (viewer.authStatus !== "authenticated") {
      return anonymousViewerState;
    }

    return {
      authStatus: "authenticated",
      isAuthenticated: true,
      authProvider: viewer.authProvider === "line" ? "line" : "line",
      viewerId: typeof viewer.viewerId === "string" ? viewer.viewerId : createViewerId(),
      displayName:
        typeof viewer.displayName === "string" && viewer.displayName
          ? viewer.displayName
          : buildMockLineDisplayName(),
      avatar: typeof viewer.avatar === "string" ? viewer.avatar : null,
    } satisfies ViewerAuthState;
  } catch {
    window.localStorage.removeItem(viewerAuthStorageKey);

    return anonymousViewerState;
  }
}

export function writeViewerAuthState(viewer: ViewerAuthState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    viewerAuthStorageKey,
    JSON.stringify({
      version: viewerAuthVersion,
      viewer,
    } satisfies PersistedViewerAuthState),
  );
}

export function clearViewerAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(viewerAuthStorageKey);
}

export function getViewerInitials(displayName: string | null) {
  if (!displayName) {
    return "AN";
  }

  return displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}
