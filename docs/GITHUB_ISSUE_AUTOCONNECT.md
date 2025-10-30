# [BUG] AutoConnect v1.3 doesn't sync with wagmi/RainbowKit state

## Description

When `UnicornAutoConnect` successfully connects via Thirdweb, wagmi hooks and RainbowKit don't recognize the connection. The wallet is connected at the Thirdweb level but wagmi's internal state is never updated.

## Expected Behavior

When AutoConnect successfully connects:
1. Thirdweb wallet connects ✅
2. wagmi hooks (`useAccount()`) return connected state ✅
3. RainbowKit shows connected wallet ✅

## Actual Behavior

1. Thirdweb wallet connects ✅
2. wagmi hooks (`useAccount()`) return **disconnected** ❌
3. RainbowKit still shows "Connect Wallet" button ❌

## Reproduction

```tsx
// _app.tsx
const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [
    unicornConnector({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
      factoryAddress: process.env.NEXT_PUBLIC_THIRDWEB_FACTORY_ADDRESS,
      defaultChain: 137,
    }),
  ],
  transports: { [polygon.id]: http() },
});

// In component
<WagmiProvider config={wagmiConfig}>
  <RainbowKitProvider>
    <UnicornAutoConnect debug={true} />
    {/* ... rest of app */}
  </RainbowKitProvider>
</WagmiProvider>
```

**Steps**:
1. Access app with URL: `?walletId=inApp&authCookie=...`
2. AutoConnect logs show success
3. Check wagmi: `const { isConnected } = useAccount()` returns `false`
4. RainbowKit still shows "Connect Wallet"

## Root Cause

The `UnicornAutoConnect` component connects the Thirdweb wallet but never updates wagmi's internal state. Standard wagmi methods can't be used because they try to reconnect an already-connected wallet:

- `connectAsync()` → `Error: Invalid param: undefined` (tries to reconnect)
- `reconnect()` → No effect (only checks previously connected connectors)
- `connector.connect()` → Same error (internally calls wallet.connect())

## Workaround

We had to manually update wagmi's state:

```typescript
// In wrapper component onConnect callback
const account = await provider.getAccount();
const chainId = account.chain?.id || config.chains[0].id;

const unicornConnector = config.connectors.find(c => c.id === 'unicorn');

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
```

## Proposed Fix

**Option 1** (Recommended): Automatic sync in `UnicornAutoConnect` component

Add wagmi state sync automatically when Thirdweb connection succeeds:

```javascript
// In UnicornAutoConnect.jsx
const IsolatedAutoConnect = ({ onConnect, ... }) => {
  return (
    <AutoConnect
      onConnect={async (connectedWallet) => {
        // Existing code...

        // NEW: Sync with wagmi automatically
        await syncWithWagmi(connectedWallet);

        // Then call user's callback
        if (onConnect) onConnect(connectedWallet);
      }}
    />
  );
};

async function syncWithWagmi(wallet) {
  if (typeof window !== 'undefined' && window.__WAGMI_CONFIG__) {
    const config = window.__WAGMI_CONFIG__;
    const account = await wallet.getAccount();
    const chainId = account?.chain?.id;

    const unicornConnector = config.connectors.find(c => c.id === 'unicorn');

    if (unicornConnector && account) {
      await config.setState((state) => ({
        ...state,
        connections: new Map(state.connections).set(unicornConnector.uid, {
          accounts: [account.address],
          chainId: chainId,
          connector: unicornConnector,
        }),
        current: unicornConnector.uid,
        status: 'connected',
      }));
    }
  }
}
```

**Option 2**: Export utility function for manual sync

```javascript
export async function syncAutoConnectWithWagmi(wallet, wagmiConfig) {
  // Implementation...
}
```

## Additional Issue

`provider.getAccount()` doesn't always include `chain.id`:

```javascript
const account = await provider.getAccount();
console.log(account.chain?.id); // undefined
```

This should be included in the account object.

## Environment

- Next.js 15.5.4
- React 19.1.0
- wagmi 2.18.0
- RainbowKit 2.2.8
- Thirdweb 5.109.1
- @unicorn.eth/autoconnect 1.3.0

## Impact

This breaks the "zero-code integration" promise of v1.3. Developers must implement complex workarounds involving wagmi internals, which defeats the purpose of AutoConnect.

## Related

See full integration report with code examples: [AUTOCONNECT_INTEGRATION_REPORT.md]
