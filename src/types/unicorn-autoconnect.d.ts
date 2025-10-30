/**
 * Type augmentation for @unicorn.eth/autoconnect
 * 
 * The package exports unicornConnector in JavaScript but the TypeScript definitions
 * in dist/index.d.ts are missing it. This file adds the missing type declaration.
 */

import type { Chain, CreateConnectorFn } from 'wagmi';

declare module '@unicorn.eth/autoconnect' {
  export interface UnicornConnectorOptions {
    /**
   * Thirdweb client ID (required)
   * Get yours at: https://thirdweb.com/dashboard
   */
    clientId: string;

    /**
     * Smart account factory address (required)
     * Default: 0xD771615c873ba5a2149D5312448cE01D677Ee48A
     */
    factoryAddress: string;
  
    /**
     * Default chain ID to connect to
     * Examples: 8453 (Base), 137 (Polygon), 1 (Ethereum)
     * @default 8453
     */
    defaultChain?: number;
  
    /**
     * Optional wallet icon URL
     * @default Unicorn logo
     */
    icon?: string;
  
    /**
     * Enable debug logging
     * @default false
     */
    debug?: boolean;
  }

  /**
   * Creates a Wagmi connector for Unicorn wallet integration
   * 
   * @param options - Connector configuration options
   * @returns A Wagmi connector factory function
   * 
   * @example
   * ```ts
   * const connector = unicornConnector({
   *   clientId: 'your-client-id',
   *   factoryAddress: '0x...',
   *   defaultChain: 137 // Polygon
   * });
   * ```
   */
  export function unicornConnector(options: UnicornConnectorOptions): CreateConnectorFn;
}

