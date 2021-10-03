import { CeramicApi, Networks } from "@ceramicnetwork/common";
import CeramicClient from "@ceramicnetwork/http-client";
import { IDX } from "@ceramicstudio/idx";
import { DID } from "dids";
import { ThreeIdConnect, AuthProvider } from "@3id/connect";
import KeyDidResolver from "key-did-resolver";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { BehaviorSubject, Observable } from "rxjs";

export type AllowedNetwork =
  | Networks.MAINNET
  | Networks.TESTNET_CLAY
  | Networks.DEV_UNSTABLE;

export class NotAllowedNetworkError extends Error {
  constructor(network: never) {
    super(`Network ${network} is not supported`);
  }
}

function ceramicEndpoint(network: AllowedNetwork): string {
  switch (network) {
    case Networks.MAINNET:
      return "https://gateway.ceramic.network";
    case Networks.TESTNET_CLAY:
      return "https://gateway-clay.ceramic.network";
    case Networks.DEV_UNSTABLE:
      return "https://gateway-dev.ceramic.network";
    default:
      throw new NotAllowedNetworkError(network);
  }
}

export class CeramicService {
  readonly client: CeramicApi;
  readonly idx: IDX;
  private readonly _isAuthenticated$: BehaviorSubject<boolean>;
  private readonly connect: () => Promise<AuthProvider> | undefined;

  constructor(
    private readonly network: AllowedNetwork,
    endpoint?: string,
    connect?: () => Promise<AuthProvider>
  ) {
    const effectiveEndpoint = endpoint || ceramicEndpoint(network);
    this.client = new CeramicClient(effectiveEndpoint);
    this.idx = new IDX({ ceramic: this.client });
    this._isAuthenticated$ = new BehaviorSubject(false);
    this.connect = connect;
  }

  get isAuthenticated$(): Observable<boolean> {
    return this._isAuthenticated$.asObservable();
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  get did(): DID {
    if (this.client.did) {
      return this.client.did;
    } else {
      throw new Error(`Not authenticated`);
    }
  }

  async authenticate(authProvider?: AuthProvider): Promise<DID> {
    const provider = authProvider || (await this.connect());
    const threeIdConnect = new ThreeIdConnect(this.network);
    await threeIdConnect.connect(provider);
    const didProvider = threeIdConnect.getDidProvider();
    const did = new DID({
      provider: didProvider,
      resolver: {
        ...KeyDidResolver.getResolver(),
        ...ThreeIdResolver.getResolver(this.client),
      },
    });
    await did.authenticate();
    this.client.did = did;
    this._isAuthenticated$.next(true);
    return did;
  }
}
