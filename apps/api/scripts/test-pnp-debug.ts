/**
 * PNP SDK Debug Script
 *
 * Deep exploration of the PNP SDK structure and API
 */

import { PNPClient } from 'pnp-sdk';
import { PublicKey, Connection } from '@solana/web3.js';

async function main() {
  console.log('='.repeat(70));
  console.log('🔬 PNP SDK Debug Exploration');
  console.log('='.repeat(70));

  // Try different RPCs
  const rpcs = [
    { name: 'Mainnet', url: 'https://api.mainnet-beta.solana.com' },
    { name: 'Devnet', url: 'https://api.devnet.solana.com' },
  ];

  for (const rpc of rpcs) {
    console.log(`\n${'━'.repeat(70)}`);
    console.log(`Testing: ${rpc.name} (${rpc.url})`);
    console.log(`${'━'.repeat(70)}`);

    try {
      const client = new PNPClient(rpc.url);

      console.log('\n📦 Client Structure:');
      console.log('   Keys:', Object.keys(client));

      // Check each module
      console.log('\n🔍 Market Module:');
      const marketModule = (client as any).market;
      if (marketModule) {
        console.log('   Type:', typeof marketModule);
        console.log('   Constructor:', marketModule.constructor?.name);

        // Get all methods from prototype chain
        let proto = Object.getPrototypeOf(marketModule);
        const methods: string[] = [];
        while (proto && proto !== Object.prototype) {
          methods.push(...Object.getOwnPropertyNames(proto));
          proto = Object.getPrototypeOf(proto);
        }
        console.log('   All Methods:', [...new Set(methods)].filter(m => m !== 'constructor'));
      }

      console.log('\n🔍 Trading Module:');
      const tradingModule = (client as any).trading;
      if (tradingModule) {
        console.log('   Type:', typeof tradingModule);
        console.log('   Constructor:', tradingModule.constructor?.name);

        let proto = Object.getPrototypeOf(tradingModule);
        const methods: string[] = [];
        while (proto && proto !== Object.prototype) {
          methods.push(...Object.getOwnPropertyNames(proto));
          proto = Object.getPrototypeOf(proto);
        }
        console.log('   All Methods:', [...new Set(methods)].filter(m => m !== 'constructor'));
      }

      // Try fetchMarkets
      console.log('\n🔍 Fetching Markets:');
      const markets = await client.fetchMarkets();
      console.log('   Type:', typeof markets);
      console.log('   Is Array:', Array.isArray(markets));
      console.log('   Length:', markets?.length);

      if (markets && typeof markets === 'object') {
        console.log('   Keys:', Object.keys(markets).slice(0, 10));
        console.log('   First entry:', JSON.stringify(markets[0] || Object.values(markets)[0], (k, v) => {
          if (typeof v === 'bigint') return v.toString();
          if (v instanceof PublicKey) return v.toString();
          return v;
        }, 2)?.slice(0, 500));
      }

      // Try fetching specific known markets
      console.log('\n🔍 Trying to fetch known markets...');

      // Known PNP markets from their docs/website
      const knownMarkets = [
        'FQ4TVsDZKUAJZuoL1hzGT5fbnBPoxGEoNqxBrZvmzCv8', // From our previous logs
        'HFa4MVqoVfgunnnmDB6YrXQVwV54bvg71bQKVbA7QY2k', // From web logs
      ];

      for (const addr of knownMarkets) {
        try {
          console.log(`\n   Fetching ${addr.slice(0, 8)}...`);
          const market = await client.fetchMarket(new PublicKey(addr));
          if (market) {
            console.log('   ✅ Found market!');
            console.log('   Question:', (market as any).account?.question || (market as any).question || 'N/A');
            console.log('   Data:', JSON.stringify(market, (k, v) => {
              if (typeof v === 'bigint') return v.toString();
              if (v instanceof PublicKey) return v.toString();
              return v;
            }, 2)?.slice(0, 800));
          } else {
            console.log('   ❌ Market not found');
          }
        } catch (e) {
          console.log('   ❌ Error:', (e as Error).message.slice(0, 100));
        }
      }

      // Check Anchor programs
      console.log('\n📦 Anchor Programs:');
      if ((client as any).anchorMarket) {
        const anchor = (client as any).anchorMarket;
        console.log('   anchorMarket programId:', anchor.programId?.toString());
      }
      if ((client as any).anchorMarketV3) {
        const anchor = (client as any).anchorMarketV3;
        console.log('   anchorMarketV3 programId:', anchor.programId?.toString());
      }
      if ((client as any).anchorClient) {
        const anchor = (client as any).anchorClient;
        console.log('   anchorClient programId:', anchor.programId?.toString());
      }

    } catch (error) {
      console.log('❌ Error:', error);
    }
  }

  // ════════════════════════════════════════════════════════════
  // Try direct Anchor account fetching
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(70));
  console.log('🔍 Direct Account Inspection');
  console.log('━'.repeat(70));

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Check known market address
  const marketAddr = new PublicKey('FQ4TVsDZKUAJZuoL1hzGT5fbnBPoxGEoNqxBrZvmzCv8');
  console.log('\nChecking market account:', marketAddr.toString());

  try {
    const accountInfo = await connection.getAccountInfo(marketAddr);
    if (accountInfo) {
      console.log('   ✅ Account exists!');
      console.log('   Owner:', accountInfo.owner.toString());
      console.log('   Data length:', accountInfo.data.length, 'bytes');
      console.log('   Lamports:', accountInfo.lamports);

      // Try to decode first 100 bytes as hex
      console.log('   Data (first 100 bytes):', accountInfo.data.slice(0, 100).toString('hex'));
    } else {
      console.log('   ❌ Account does not exist');
    }
  } catch (e) {
    console.log('   ❌ Error:', (e as Error).message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Debug Complete');
  console.log('='.repeat(70));
}

main().catch(console.error);
