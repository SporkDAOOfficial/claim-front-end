// components/UnicornAutoConnectWrapper.tsx
import { useEffect, useRef } from 'react';
import { useAccount, useConfig } from 'wagmi';
import { UnicornAutoConnect } from '@unicorn.eth/autoconnect';

/**
 * Wrapper for UnicornAutoConnect component
 *
 * This component bridges the gap between Thirdweb's AutoConnect and wagmi:
 * 1. Thirdweb AutoConnect connects the wallet via URL parameters
 * 2. We detect the successful connection via onConnect callback
 * 3. We store the connection in global state
 * 4. We manually trigger the unicorn connector's connect() method
 * 5. This updates wagmi's internal state
 */
export function UnicornAutoConnectWrapper() {
  const { isConnected, address, connector } = useAccount();
  const config = useConfig();
  const hasTriedSync = useRef(false);

  const handleConnect = async (provider: any) => {
    console.log('[UnicornAutoConnectWrapper] ✅ Thirdweb AutoConnect successful!');
    console.log('[UnicornAutoConnectWrapper] Provider:', provider);
    console.log('[UnicornAutoConnectWrapper] Wagmi isConnected before sync:', isConnected);

    // Extract account info from the provider
    let account;
    let chainId;

    try {
      account = await provider.getAccount?.();
      console.log('[UnicornAutoConnectWrapper] Account from provider:', account);

      if (account) {
        // Get chain ID from account or from URL/config
        chainId = account.chain?.id;

        // If no chain ID from account, try to get from wagmi config
        if (!chainId) {
          const configChains = config.chains;
          chainId = configChains && configChains.length > 0 ? configChains[0].id : 137; // Default to Polygon
          console.log('[UnicornAutoConnectWrapper] No chain in account, using default:', chainId);
        }

        console.log('[UnicornAutoConnectWrapper] Address:', account.address);
        console.log('[UnicornAutoConnectWrapper] Chain ID:', chainId);
      }
    } catch (error) {
      console.error('[UnicornAutoConnectWrapper] Failed to get account from provider:', error);
      return;
    }

    if (!account?.address) {
      console.error('[UnicornAutoConnectWrapper] ❌ No address found in provider');
      return;
    }

    // Store the connected wallet globally so the connector can access it
    if (typeof window !== 'undefined') {
      (window as any).__THIRDWEB_CONNECTED_WALLET__ = provider;
      // Store account with the resolved chain ID
      (window as any).__THIRDWEB_ACCOUNT__ = {
        ...account,
        chain: {
          ...account.chain,
          id: chainId, // Use the resolved chain ID
        }
      };
      console.log('[UnicornAutoConnectWrapper] Stored wallet and account in global state with chain ID:', chainId);
    }

    // Wait a bit for the wallet state to stabilize
    await new Promise(resolve => setTimeout(resolve, 200));

    // Now sync with wagmi if we haven't already
    if (!hasTriedSync.current && !isConnected) {
      hasTriedSync.current = true;

      try {
        console.log('[UnicornAutoConnectWrapper] Finding unicorn connector...');
        console.log('[UnicornAutoConnectWrapper] Available connectors:', config.connectors.map(c => ({ id: c.id, name: c.name })));

        // Find the unicorn connector
        const unicornConnector = config.connectors.find(c => c.id === 'unicorn');

        if (!unicornConnector) {
          console.error('[UnicornAutoConnectWrapper] ❌ Unicorn connector not found!');
          return;
        }

        console.log('[UnicornAutoConnectWrapper] Found unicorn connector');
        console.log('[UnicornAutoConnectWrapper] Directly setting wagmi state without calling connect()...');

        // DON'T call connector.connect() - it will try to reconnect the wallet
        // Instead, directly set wagmi's internal state with the account we already have

        const connectionInfo = {
          accounts: [account.address as `0x${string}`],
          chainId: chainId,
          connector: unicornConnector,
        };

        console.log('[UnicornAutoConnectWrapper] Connection info:', connectionInfo);

        // Update wagmi's internal state
        await config.setState((state) => {
          const newConnections = new Map(state.connections);
          newConnections.set(unicornConnector.uid, connectionInfo);

          return {
            ...state,
            connections: newConnections,
            current: unicornConnector.uid,
            status: 'connected',
          };
        });

        console.log('[UnicornAutoConnectWrapper] ✅ wagmi state updated directly');

        // Wait for React to propagate the state
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log('[UnicornAutoConnectWrapper] ✅ State sync complete');
        console.log('[UnicornAutoConnectWrapper] Final isConnected should be true now');
      } catch (error) {
        console.error('[UnicornAutoConnectWrapper] ❌ Failed to sync with wagmi:', error);
        console.error('[UnicornAutoConnectWrapper] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    } else {
      console.log('[UnicornAutoConnectWrapper] Skipping wagmi sync (already connected or tried)');
    }
  };

  const handleError = (error: Error) => {
    console.error('[UnicornAutoConnectWrapper] ❌ Unicorn AutoConnect failed:', error);
    console.error('[UnicornAutoConnectWrapper] Error details:', {
      message: error.message,
      name: error.name,
    });
  };

  // Monitor wagmi connection state
  useEffect(() => {
    console.log('[UnicornAutoConnectWrapper] Wagmi state:', {
      isConnected,
      address,
      connector: connector?.id,
      connectorName: connector?.name,
    });
  }, [isConnected, address, connector]);

  return (
    <UnicornAutoConnect
      debug={true}
      onConnect={handleConnect}
      onError={handleError}
    />
  );
}