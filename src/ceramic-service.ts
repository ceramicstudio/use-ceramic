import { CeramicApi, Networks } from "@ceramicnetwork/common";
import CeramicClient from "@ceramicnetwork/http-client";
import { IDX } from "@ceramicstudio/idx";
import { DID } from "dids";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import {
  EthereumAuthProvider,
  ThreeIdConnect,
  AuthProvider,
} from "@3id/connect";
import KeyDidResolver from "key-did-resolver";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import NanoETH from "nanoeth/metamask";
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

  constructor(private readonly network: AllowedNetwork, endpoint?: string) {
    const effectiveEndpoint = endpoint || ceramicEndpoint(network);
    this.client = new CeramicClient(effectiveEndpoint);
    this.idx = new IDX({ ceramic: this.client });
    this._isAuthenticated$ = new BehaviorSubject(false);
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

  async connect() {
    const providerOptions = {
      injected: {
        package: null,
      },
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "b407db983da44def8a68e3fdb6bea776",
        },
      },
    };

    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: false, // optional
      providerOptions, // required
    });
    const provider = await web3Modal.connect();
    const eth = new NanoETH(provider);
    const accounts = await eth.accounts();
    return new EthereumAuthProvider(provider, accounts[0]);
  }

  async authenticate(authProvider: AuthProvider): Promise<DID> {
    const threeIdConnect = new ThreeIdConnect(this.network);
    await threeIdConnect.connect(authProvider);
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
