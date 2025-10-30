// components/UnicornAutoConnectWrapper.tsx
import { useEffect, useRef } from 'react';
import { useAccount, useConfig, useConnect } from 'wagmi';
// Do not import/render UnicornAutoConnect to avoid internal config.getState calls

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
  const { connectAsync } = useConnect();
  const hasTriedSync = useRef(false);

  const handleConnect = async () => {
    // If already connected, or connected to a non-unicorn wallet, skip
    if (isConnected) {
      console.log('[UnicornAutoConnectWrapper] Already connected, skipping');
      return;
    }
    if (connector?.id && connector.id !== 'unicorn') {
      console.log('[UnicornAutoConnectWrapper] Different connector active, skipping');
      return;
    }
    // Guard: wait until wagmi config/connectors are ready
    if (!config || !Array.isArray((config as any).connectors) || (config as any).connectors.length === 0) {
      console.warn('[UnicornAutoConnectWrapper] wagmi config/connectors not ready yet; skipping autoconnect sync');
      return;
    }
    // Now sync with wagmi if we haven't already
    if (!hasTriedSync.current && !isConnected) {
      hasTriedSync.current = true;

      try {
        console.log('[UnicornAutoConnectWrapper] Finding unicorn connector...');
        console.log('[UnicornAutoConnectWrapper] Available connectors:', config.connectors.map(c => ({ id: c.id, name: c.name })));

        // Find the unicorn connector and connect via wagmi to update state
        const unicorn = config.connectors.find(c => c.id === 'unicorn');

        if (!unicorn) {
          console.error('[UnicornAutoConnectWrapper] ❌ Unicorn connector not found!');
          return;
        }

        console.log('[UnicornAutoConnectWrapper] Connecting via wagmi.connectAsync to unicorn...');
        await connectAsync({ connector: unicorn });

        console.log('[UnicornAutoConnectWrapper] ✅ wagmi connected to unicorn');
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

  // Attempt autoconnect once when connectors are ready
  useEffect(() => {
    if (!hasTriedSync.current) {
      handleConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.connectors?.length]);

  // No UI rendering; silent autoconnect attempt
  return null;
}