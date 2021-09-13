# useCeramic

Single React hook for everything Ceramic in a dApp.

## Installation

Use your favorite package manager to add the library:

```shell
npm install use-ceramic # for npm
pnpm add use-ceramic # for pnpm
yarn add use-ceramic # for yarn
```

## Usage

The library provides a low-effort way to use Ceramic in a dApp. For an Ethereum dApp, we also include here support
for Web3Modal.

Before usage, please wrap an appropriate
part of the application in `CeramicProvider` tag. Here is an example `_app.tsx` from Next.js:

```typescript jsx
import type { AppProps } from "next/app";
import { CeramicProvider, Networks } from "use-ceramic";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CeramicProvider network={Networks.MAINNET}>
      <Component {...pageProps} />
    </CeramicProvider>
  );
}
export default MyApp;
```

For read-only operations, set `network` prop to a Ceramic network of choose. Supported values are:

```typescript
Networks.MAINNET; // for mainnet
Networks.TESTNET_CLAY; // for testnet
Networks.DEV_UNSTABLE; // for dev-unstable network
```

This would set an appropriate public gateway endpoint for CeramicClient. Also, this would select an appropriate 3id-connect.

For write operations, you would need to provide an explicit `endpoint` property, in addition to `network`:

```typescript jsx
<CeramicProvider
  network={Networks.MAINNET}
  endpoint={"https://read-write-endpoint.ceramic.com"}
>
  ...
</CeramicProvider>
```

Then, include `useCeramic` hook in your component.

```typescript jsx
function SignInWithCeramic() {
  const ceramic = useCeramic();
  const [did, setDid] = useState("");
  const [progress, setProgress] = useState(false);

  const handleLogin = async () => {
    setProgress(true);
    try {
      const authProvider = await ceramic.connect();
      await ceramic.authenticate(authProvider);
      setDid(ceramic.did.id);
    } catch (e) {
      console.error(e);
    } finally {
      setProgress(false);
    }
  };

  const renderButton = () => {
    if (progress) {
      return (
        <>
          <button disabled={true}>Connecting...</button>
        </>
      );
    } else {
      return (
        <>
          <button onClick={handleLogin}>Sign In</button>
        </>
      );
    }
  };

  if (did) {
    return (
      <>
        <p>
          Your DID: <code>{did}</code>
        </p>
      </>
    );
  } else {
    return renderButton();
  }
}
```

The hook returns an entity with the following interface:

```typescript
import type { AuthProvider, EthereumAuthProvider } from "@3id/connect";
import type { DID } from "dids";
import type { IDX } from "@ceramicstudio/idx";
import type { CeramicApi } from "@ceramicnetwork/common";

interface CeramicService {
  connect(): Promise<EthereumAuthProvider>; // Acquires a web3 provider via Web3Modal, returns an instance of EtereumAuthProvide
  authenticate(authProvider: AuthProvider); // Sets up a Ceramic DID using the authProvider; authenticates a user
  client: CeramicApi; // Instance of Ceramic
  did: DID; // Get DID of the user. Throws an error if not authenticated yet
  isAuthenticated: boolean; // Indicate if the user is authenticated
  isAuthenticated$: Observable<boolean>; // To subscribe for authentication updates
  idx: IDX; // Get instance of IDX
}
```

With these methods, you can interact fully with the user's data on Ceramic. You do not have to worry about set up of 3id-connect urls, resolvers and so on.

For an Ethereum dApp here we include Web3Modal, that is configured for MetaMask (i.e. embedded web3 provider) and WalletConnect,
which together cover the majority of Ethereum wallets. It is automatically used when `connect()` method is invoked.

For other blockchains, one can manually configure AuthProvider, i.e. not relying on `connect()`, and pass it to `authenticate()` method.

## Example

There is an example app built on Next.js that uses `use-ceramic`: [ceramic-starter](https://github.com/ceramicstudio/ceramic-starter).

## Possible enhancements

- [ ] `useIDX` hook for querying IDX records instead of `ceramic.idx.get`,
- [x] `isAuthenticated$` as `Observable` to tell if a user is authenticated

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/) or [Apache-2.0](https://choosealicense.com/licenses/apache-2.0/)
