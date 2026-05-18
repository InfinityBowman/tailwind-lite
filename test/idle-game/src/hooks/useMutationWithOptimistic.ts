/**
 * useMutationWithOptimistic - Wraps Convex useMutation with optimistic updates,
 * loading state, and error toasts.
 *
 * Drop-in replacement for useMutationWithFeedback with an optional
 * optimisticUpdate parameter that wires up .withOptimisticUpdate().
 */

import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useToast } from '../components/ui/ToastProvider';
import type { FunctionReference, FunctionArgs } from 'convex/server';
import type { ReactMutation } from 'convex/react';
import type { OptimisticUpdate } from 'convex/browser';

type MutationArgs<M extends FunctionReference<'mutation'>> = Parameters<ReactMutation<M>>;
type MutationReturn<M extends FunctionReference<'mutation'>> = Awaited<
  ReturnType<ReactMutation<M>>
>;

export function useMutationWithOptimistic<M extends FunctionReference<'mutation'>>(
  mutation: M,
  optimisticUpdate?: OptimisticUpdate<FunctionArgs<M>>
) {
  const rawMutationFn = useMutation(mutation);
  const { addToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (...args: MutationArgs<M>): Promise<MutationReturn<M>> => {
      setIsPending(true);
      try {
        const mutationFn = optimisticUpdate
          ? rawMutationFn.withOptimisticUpdate(optimisticUpdate)
          : rawMutationFn;

        const result = await (
          mutationFn as (...args: MutationArgs<M>) => Promise<MutationReturn<M>>
        )(...args);

        // Check for { success: false, error: string } pattern
        if (
          result &&
          typeof result === 'object' &&
          'success' in result &&
          (result as Record<string, unknown>).success === false
        ) {
          const errorMsg = (result as Record<string, unknown>).error;
          addToast(typeof errorMsg === 'string' ? errorMsg : 'Operation failed', 'error');
        }

        return result;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        addToast(message, 'error');
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [rawMutationFn, optimisticUpdate, addToast]
  );

  return { mutate, isPending };
}
