# Modified Files for AutoConnect Team

These are the files we had to modify to get AutoConnect v1.3 working with wagmi/RainbowKit.

## 1. Wrapper Component (Application-Side Workaround)

**File**: `src/components/UnicornAutoConnectWrapper.tsx`

**What it does**:
- Wraps `UnicornAutoConnect` component
- Listens for `onConnect` callback
- Extracts account from Thirdweb provider
- Resolves chain ID (from account or config)
- Stores in global state for connector
- **Manually updates wagmi state** via `config.setState()`

**Key Code**:
```typescript
const handleConnect = async (provider: any) => {
  // Get account from Thirdweb
  const account = await provider.getAccount();
  const chainId = account.chain?.id || config.chains[0].id;

  // Store for connector to access
  window.__THIRDWEB_CONNECTED_WALLET__ = provider;
  window.__THIRDWEB_ACCOUNT__ = { ...account, chain: { id: chainId } };

  // Find unicorn connector
  const unicornConnector = config.connectors.find(c => c.id === 'unicorn');

  // Manually update wagmi state (this should be done by AutoConnect!)
  await config.setState((state) => {
    const newConnections = new Map(state.connections);
    newConnections.set(unicornConnector.uid, {
      accounts: [account.address],
      chainId: chainId,
      connector: unicornConnector,
    });

    return {
      ...state,
      connections: newConnections,
      current: unicornConnector.uid,
      status: 'connected',
    };
  });
};
```

**Full file location**: `src/components/UnicornAutoConnectWrapper.tsx`

---

## 2. Connector Modifications (Package-Side Support)

**File**: `node_modules/@unicorn.eth/autoconnect/src/connectors/unicornConnector.js`

**What was modified**:
All connector methods now check global state first before trying to access the wallet instance.

### Modified Methods:

#### `setup()`
```javascript
async setup() {
  this.client = createThirdwebClient({ clientId });

  // Check for already-connected wallet from AutoConnect
  if (typeof window !== 'undefined' && window.__THIRDWEB_CONNECTED_WALLET__) {
    this.wallet = window.__THIRDWEB_CONNECTED_WALLET__;
  } else {
    // Create new wallet instance
    this.wallet = inAppWallet({ /* ... */ });
  }
}
```

#### `connect()`
```javascript
async connect({ chainId } = {}) {
  // Check global state first
  if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
    const account = window.__THIRDWEB_ACCOUNT__;
    return {
      account: account.address,
      chain: { id: account.chain?.id || targetChain.id, unsupported: false },
    };
  }

  // Otherwise try to connect (for manual connections)
  // ... rest of connect logic
}
```

#### `isAuthorized()`
```javascript
async isAuthorized() {
  // Check global state for AutoConnect
  if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
    return true;
  }

  // Otherwise check wallet instance
  const account = await this.wallet.getAccount();
  return !!account?.address;
}
```

#### `getAccount()`
```javascript
async getAccount() {
  // Check global state first
  if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
    return window.__THIRDWEB_ACCOUNT__.address;
  }

  // Otherwise get from wallet
  const account = await this.wallet.getAccount();
  return account?.address;
}
```

#### `getChainId()`
```javascript
async getChainId() {
  // Check global state first
  if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
    return window.__THIRDWEB_ACCOUNT__.chain?.id || defaultChain;
  }

  // Otherwise get from wallet
  const account = await this.wallet.getAccount();
  return account?.chain?.id || defaultChain;
}
```

**Full file location**: `node_modules/@unicorn.eth/autoconnect/src/connectors/unicornConnector.js`

---

## What the AutoConnect Package Should Do

Instead of requiring developers to:
1. Create a wrapper component
2. Manually extract account info
3. Store in global state
4. Manually update wagmi state

**The `UnicornAutoConnect` component should do all of this automatically.**

### Proposed Implementation:

```javascript
// In node_modules/@unicorn.eth/autoconnect/src/components/UnicornAutoConnect.jsx

const IsolatedAutoConnect = ({
  onConnect,
  onError,
  clientId,
  factoryAddress,
  defaultChain,
  // NEW: Accept wagmi config
  wagmiConfig,
}) => {
  // ... existing setup ...

  return (
    <AutoConnect
      onConnect={async (connectedWallet) => {
        // ... existing code to store in window.__UNICORN_WALLET_STATE__ ...

        // NEW: Automatically sync with wagmi
        if (wagmiConfig) {
          try {
            const account = await connectedWallet.getAccount?.();
            const chainId = account?.chain?.id || defaultChain;

            // Store for connector
            window.__THIRDWEB_CONNECTED_WALLET__ = connectedWallet;
            window.__THIRDWEB_ACCOUNT__ = {
              ...account,
              chain: { ...account.chain, id: chainId }
            };

            // Find unicorn connector
            const unicornConnector = wagmiConfig.connectors.find(
              c => c.id === 'unicorn'
            );

            if (unicornConnector && account) {
              // Update wagmi state
              await wagmiConfig.setState((state) => {
                const newConnections = new Map(state.connections);
                newConnections.set(unicornConnector.uid, {
                  accounts: [account.address],
                  chainId: chainId,
                  connector: unicornConnector,
                });

                return {
                  ...state,
                  connections: newConnections,
                  current: unicornConnector.uid,
                  status: 'connected',
                };
              });

              console.log('✅ Automatically synced with wagmi');
            }
          } catch (error) {
            console.error('Failed to sync with wagmi:', error);
          }
        }

        // Call user's callback
        if (onConnect) {
          onConnect(connectedWallet);
        }
      }}
    />
  );
};
```

### Usage Would Become:

```typescript
import { useConfig } from 'wagmi';

function App() {
  const wagmiConfig = useConfig();

  return (
    <UnicornAutoConnect
      debug={true}
      wagmiConfig={wagmiConfig} // Pass wagmi config
      onConnect={(wallet) => {
        console.log('Connected!'); // No manual sync needed!
      }}
    />
  );
}
```

---

## Summary for AutoConnect Team

**Current State**: ❌ Requires complex workaround with manual wagmi state management

**Desired State**: ✅ Zero-code integration - AutoConnect handles wagmi sync automatically

**Files to Review**:
1. `src/components/UnicornAutoConnect.jsx` - Add automatic wagmi sync
2. `src/connectors/unicornConnector.js` - Already supports global state pattern
3. Update documentation with wagmi integration details

**Benefits**:
- True zero-code integration
- Matches v1.3 design goals
- Works with RainbowKit out of the box
- Developers don't need to understand wagmi internals
