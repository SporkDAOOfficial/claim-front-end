# AutoConnect v1.3 Integration Report for SporkDAO

## Summary

Successfully integrated AutoConnect v1.3 into SporkDAO distribution app, but discovered a critical wagmi state synchronization issue that requires a workaround.

## The Problem

**AutoConnect connects via Thirdweb but wagmi/RainbowKit don't recognize the connection.**

### What Happens:
1. ✅ User accesses URL with `?walletId=inApp&authCookie=...`
2. ✅ `UnicornAutoConnect` component detects parameters
3. ✅ Thirdweb `AutoConnect` successfully connects wallet
4. ✅ `onConnect` callback fires with connected wallet
5. ❌ **wagmi hooks (`useAccount()`, etc.) return disconnected state**
6. ❌ **RainbowKit `ConnectButton` still shows "Connect Wallet"**

### Root Cause:
The `UnicornAutoConnect` component connects the Thirdweb wallet but **never updates wagmi's internal state**. The connector is configured in wagmi, but wagmi doesn't know about the connection.

### Why Standard Approaches Failed:

**Attempt 1: `connectAsync()`**
```typescript
await connectAsync({ connector: unicornConnector });
```
❌ **Result**: `Error: Invalid param: undefined`
- Tries to call `wallet.connect()` on an already-connected wallet
- Thirdweb doesn't allow reconnecting

**Attempt 2: `reconnect()`**
```typescript
await reconnect();
```
❌ **Result**: No connectors found
- `reconnect()` only checks previously connected connectors
- Doesn't discover new connections

**Attempt 3: `connector.connect()`**
```typescript
await unicornConnector.connect({ chainId });
```
❌ **Result**: Same `Error: Invalid param: undefined`
- Still tries to reconnect the Thirdweb wallet internally

## The Workaround Solution

We had to **manually update wagmi's internal state** without calling any connector methods:

```typescript
// Extract account from Thirdweb provider
const account = await provider.getAccount();
const chainId = account.chain?.id || config.chains[0].id;

// Store in global state for connector to access
window.__THIRDWEB_CONNECTED_WALLET__ = provider;
window.__THIRDWEB_ACCOUNT__ = { ...account, chain: { ...account.chain, id: chainId } };

// Find unicorn connector
const unicornConnector = config.connectors.find(c => c.id === 'unicorn');

// Directly set wagmi state WITHOUT calling connector.connect()
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

## Files Modified

### Application Files (Workaround Implementation)

**`src/components/UnicornAutoConnectWrapper.tsx`**
- Wraps `UnicornAutoConnect` component
- Listens for `onConnect` callback
- Extracts account info from Thirdweb provider
- Stores wallet/account in global state
- Manually updates wagmi state via `config.setState()`

### Package Files (To Support Workaround)

**`node_modules/@unicorn.eth/autoconnect/src/connectors/unicornConnector.js`**

Modified all methods to check global state first:

```javascript
// setup()
if (typeof window !== 'undefined' && window.__THIRDWEB_CONNECTED_WALLET__) {
  this.wallet = window.__THIRDWEB_CONNECTED_WALLET__;
}

// connect()
if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
  const account = window.__THIRDWEB_ACCOUNT__;
  return {
    account: account.address,
    chain: { id: account.chain?.id, unsupported: false },
  };
}

// isAuthorized()
if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
  return true;
}

// getAccount()
if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
  return window.__THIRDWEB_ACCOUNT__.address;
}

// getChainId()
if (typeof window !== 'undefined' && window.__THIRDWEB_ACCOUNT__) {
  return window.__THIRDWEB_ACCOUNT__.chain?.id;
}
```

## What Should Be Fixed in AutoConnect Package

### Option 1: Automatic State Sync in UnicornAutoConnect Component

The `UnicornAutoConnect` component should automatically sync with wagmi after Thirdweb connects:

```javascript
// In UnicornAutoConnect.jsx onConnect handler
onConnect={async (connectedWallet) => {
  // ... existing code ...

  // NEW: Sync with wagmi automatically
  if (typeof window !== 'undefined' && window.__WAGMI_CONFIG__) {
    const account = connectedWallet.getAccount();
    const chainId = account?.chain?.id;

    const unicornConnector = window.__WAGMI_CONFIG__.connectors.find(
      c => c.id === 'unicorn'
    );

    if (unicornConnector && account) {
      await window.__WAGMI_CONFIG__.setState((state) => {
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
    }
  }

  // Call user's callback
  if (onConnect) onConnect(connectedWallet);
}}
```

### Option 2: Export wagmiSync Utility Function

Provide a utility that developers can call:

```javascript
// Export from package
export async function syncAutoConnectWithWagmi(wallet, wagmiConfig) {
  const account = await wallet.getAccount();
  const chainId = account?.chain?.id;

  const unicornConnector = wagmiConfig.connectors.find(c => c.id === 'unicorn');

  if (!unicornConnector || !account) {
    throw new Error('Cannot sync: missing connector or account');
  }

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
}

// Developer usage
<UnicornAutoConnect
  onConnect={async (wallet) => {
    await syncAutoConnectWithWagmi(wallet, wagmiConfig);
  }}
/>
```

### Option 3: Enhanced Connector Integration

Make the connector handle the already-connected state properly so wagmi's built-in methods work:

```javascript
// In unicornConnector.js - store state when AutoConnect succeeds
let autoConnectState = null;

export function setAutoConnectState(wallet, account, chainId) {
  autoConnectState = { wallet, account, chainId };
}

// Then in connect()
async connect({ chainId } = {}) {
  if (autoConnectState) {
    // Use the auto-connected state
    const result = {
      account: autoConnectState.account.address,
      chain: { id: autoConnectState.chainId, unsupported: false },
    };
    autoConnectState = null; // Clear after use
    return result;
  }

  // ... rest of connect logic
}
```

## Recommended Solution

**Option 1** is the best approach because:
1. ✅ Zero-code integration - developers don't need workarounds
2. ✅ Automatic - happens in the component
3. ✅ Maintains the v1.3 design goal of seamless integration
4. ✅ Users don't need to understand wagmi internals

## Additional Issues Found

### Chain ID Missing from Account

The Thirdweb account object returned by `provider.getAccount()` doesn't always include `chain.id`:

```javascript
const account = await provider.getAccount();
console.log(account.chain?.id); // undefined
```

**Workaround**: We resolve from wagmi config:
```javascript
const chainId = account.chain?.id || config.chains[0].id;
```

**Fix Needed**: Ensure `getAccount()` always returns the chain info.

## Testing Results

After implementing the workaround:
- ✅ AutoConnect triggers on URL parameters
- ✅ Thirdweb connection succeeds
- ✅ wagmi hooks return connected state
- ✅ RainbowKit shows connected address
- ✅ All wagmi hooks work correctly

## Files to Review

1. **UnicornAutoConnect.jsx** - Add automatic wagmi state sync
2. **unicornConnector.js** - Ensure proper handling of connected state
3. **Documentation** - Update to explain wagmi integration

## Environment

- **Next.js**: 15.5.4
- **React**: 19.1.0
- **wagmi**: 2.18.0
- **RainbowKit**: 2.2.8
- **Thirdweb**: 5.109.1
- **@unicorn.eth/autoconnect**: 1.3.0

## Contact

- Developer: Russell (@cryptowampum)
- Repository: Sporkdao-Distributions
- Branch: russell

---

**Note**: The workaround works but requires modifying node_modules files, which isn't sustainable. The fix should be implemented in the AutoConnect package itself for true zero-code integration.
