import { useMemo } from 'react';
import { Abi, WalletClient } from 'viem';
import { getContract } from '../utils/getContract';
import { babtABI, collabABI, erc1155ABI } from '../abis';
import {
  Address,
  useContractRead,
  useNetwork,
  usePublicClient,
  useWalletClient,
} from 'wagmi';
import { BABT_ADDRESSES, COLLAB_ADDRESS } from '../constants/addresses';

/**
 * Generic hook for any contract
 */
export function useContract<TAbi extends Abi>(
  address?: Address,
  abi?: TAbi,
  chainId?: number
) {
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!address || !abi) return null;

    try {
      return getContract({
        abi,
        address,
        publicClient,
        walletClient: walletClient as WalletClient,
      });
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [abi, address, publicClient, walletClient]);
}

/**
 * BABT balance hook
 */
export function useBABTBalanceOf({ address }: { address?: Address }) {
  const { chain } = useNetwork();
  const babtAddress = chain ? BABT_ADDRESSES[chain.id] : undefined;

  return useContractRead({
    address: babtAddress,
    abi: babtABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  });
}

/**
 * Collab contract hook
 */
export function useCollabContract() {
  return useContract(COLLAB_ADDRESS, collabABI);
}

/**
 * ERC-1155 contract hook
 */
export function useERC1155Contract(address?: Address) {
  return useContract(address, erc1155ABI);
}

/**
 * ERC-1155 batch balance helper
 * (imperative, integration-level)
 */
export function useERC1155BatchBalance(address?: Address) {
  const contract = useERC1155Contract(address);

  const getBatchBalances = async (
    owner: Address,
    ids: number[]
  ): Promise<readonly bigint[] | null> => {
    if (!contract) return null;

    const accounts = new Array(ids.length).fill(owner);

    
    const result = await contract.read.balanceOfBatch([
      accounts,
      ids,
    ]);

    return result as readonly bigint[];
  };

  return { getBatchBalances };
}
