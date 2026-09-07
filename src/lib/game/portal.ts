type PokiSDK = {
  init?: () => Promise<unknown>;
  gameLoadingFinished?: () => void;
  gameplayStart?: () => void;
  gameplayStop?: () => void;
  commercialBreak?: (pauseFn?: () => void) => Promise<unknown>;
  rewardedBreak?: (pauseFn?: () => void) => Promise<boolean>;
};

type CrazyAdCallbacks = {
  adFinished?: () => void;
  adError?: () => void;
  adStarted?: () => void;
};

type CrazySDK = {
  init?: () => Promise<unknown>;
  game?: {
    gameplayStart?: () => void;
    gameplayStop?: () => void;
    happytime?: () => void;
  };
  ad?: {
    requestAd?: (type: "midgame" | "rewarded", cbs?: CrazyAdCallbacks) => void;
  };
};

type PortalWindow = Window & {
  PokiSDK?: PokiSDK;
  CrazyGames?: { SDK?: CrazySDK };
};

const MOCK_REWARD_MS = 1100;

let inGameplay = false;
let inBreak = false;
let loadingSent = false;

function win(): PortalWindow | null {
  return typeof window === "undefined" ? null : (window as PortalWindow);
}

function poki(): PokiSDK | undefined {
  return win()?.PokiSDK;
}

function crazy(): CrazySDK | undefined {
  return win()?.CrazyGames?.SDK;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function portalHasSdk() {
  return Boolean(poki() || crazy());
}

export function initPortal() {
  const p = poki();
  if (p?.init) {
    void p.init().catch(() => undefined).then(() => {
      markLoaded();
    });
    return;
  }
  if (crazy()?.init) {
    void crazy()!
      .init!()
      .catch(() => undefined)
      .then(() => markLoaded());
    return;
  }
  markLoaded();
}

export function markLoaded() {
  if (loadingSent) return;
  loadingSent = true;
  poki()?.gameLoadingFinished?.();
}

export function gameplayStart() {
  if (inGameplay || inBreak) return;
  inGameplay = true;
  poki()?.gameplayStart?.();
  crazy()?.game?.gameplayStart?.();
}

export function gameplayStop() {
  if (!inGameplay) return;
  inGameplay = false;
  poki()?.gameplayStop?.();
  crazy()?.game?.gameplayStop?.();
}

export function happyTime() {
  crazy()?.game?.happytime?.();
}

export async function commercialBreak(): Promise<void> {
  if (inBreak) return;
  inBreak = true;
  gameplayStop();
  try {
    const p = poki();
    if (p?.commercialBreak) {
      await p.commercialBreak();
      return;
    }
    const ad = crazy()?.ad;
    if (ad?.requestAd) {
      await crazyAd(ad, "midgame");
    }
  } catch {
    // play through if the break fails
  } finally {
    inBreak = false;
  }
}

export async function rewardedBreak(): Promise<boolean> {
  if (inBreak) return false;
  inBreak = true;
  gameplayStop();
  try {
    const p = poki();
    if (p?.rewardedBreak) {
      return Boolean(await p.rewardedBreak());
    }
    const ad = crazy()?.ad;
    if (ad?.requestAd) {
      return crazyAd(ad, "rewarded");
    }
    await sleep(MOCK_REWARD_MS);
    return true;
  } catch {
    return false;
  } finally {
    inBreak = false;
  }
}

function crazyAd(ad: NonNullable<CrazySDK["ad"]>, type: "midgame" | "rewarded"): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    try {
      ad.requestAd?.(type, {
        adFinished: () => done(true),
        adError: () => done(type === "midgame"),
        adStarted: () => undefined,
      });
    } catch {
      done(type === "midgame");
    }
  });
}
