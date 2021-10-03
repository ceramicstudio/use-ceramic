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

The library provides a low-effort way to use Ceramic in a dApp.

Before use, please wrap an appropriate part of the application in `CeramicProvider` tag. Here is an example `_app.tsx` from Next.js:

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

### Read-only mode

For read-only operations, set `network` prop to a Ceramic network of choose. Supported values are:

```typescript
Networks.MAINNET; // for mainnet
Networks.TESTNET_CLAY; // for testnet
Networks.DEV_UNSTABLE; // for dev-unstable network
```

This would set an appropriate public gateway endpoint for CeramicClient. Also, this would select an appropriate 3id-connect.

### Read and write mode

For write operations, you have to provide an explicit `endpoint` property, in addition to `network`.
Also, for DID construction, we have to provide a function that returns an appropriate `AuthProvider`:

```typescript jsx
async function connect() {
  await window.ethereum.enable(); // For MetaMask only
  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();
  return new EthereumAuthProvider(provider, accounts[0]);
}

<CeramicProvider
  network={Networks.MAINNET}
  endpoint={"https://read-write-endpoint.ceramic.com"}
  connect={connect}
>
  ...
</CeramicProvider>;
```

Alternatively, `CeramicProvider` accepts a fully configured `CeramicService` instance as a prop.
This might be useful when a component containing `CeramicProvider` gets re-rendered and we
need to maintain the same instance of `CeramicService`, like in Next.js.

Then, include `useCeramic` hook in your component.

```typescript jsx
function SignInWithCeramic() {
  const ceramic = useCeramic();
  const [did, setDid] = useState("");
  const [progress, setProgress] = useState(false);

  const handleLogin = async () => {
    setProgress(true);
    try {
      await ceramic.authenticate();
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
  authenticate(authProvider?: AuthProvider); // Sets up a Ceramic DID using the authProvider; authenticates a user
  // ^^ If passed, `authProvider` parameter is used. If not, we try to acquire it from `connect` argument of `CeramicService`.
  client: CeramicApi; // Instance of Ceramic
  did: DID; // Get DID of the user. Throws an error if not authenticated yet
  isAuthenticated: boolean; // Indicate if the user is authenticated
  isAuthenticated$: Observable<boolean>; // To subscribe for authentication updates
  idx: IDX; // Get instance of IDX
}
```

With these methods, you can interact fully with the user's data on Ceramic. You do not have to worry about set up of 3id-connect urls, resolvers and so on.

## Example

There is an example app built on Next.js that uses `use-ceramic`: [ceramic-starter](https://github.com/ceramicstudio/ceramic-starter).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/) or [Apache-2.0](https://choosealicense.com/licenses/apache-2.0/)
