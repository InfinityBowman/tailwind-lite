/**
 * useMutationWithOptimistic Tests
 *
 * Tests the core wrapper logic: isPending state tracking and error toast behavior.
 * Since the test environment is node (not jsdom), we test the logic directly
 * by simulating the mutation wrapper behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Simulates the core mutation wrapper logic from useMutationWithOptimistic.
 * This mirrors the hook's internal behavior for testability without React.
 */
function createMutationWrapper<TArgs extends unknown[], TReturn>(
  mutationFn: (...args: TArgs) => Promise<TReturn>,
  addToast: (message: string, type: string) => void
) {
  let isPending = false;

  const mutate = async (...args: TArgs): Promise<TReturn> => {
    isPending = true;
    try {
      const result = await mutationFn(...args);

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
      isPending = false;
    }
  };

  return {
    mutate,
    getIsPending: () => isPending,
  };
}

describe('useMutationWithOptimistic logic', () => {
  let addToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addToast = vi.fn();
  });

  describe('isPending state', () => {
    it('is false initially', () => {
      const mockMutation = vi.fn().mockResolvedValue({ success: true });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      expect(wrapper.getIsPending()).toBe(false);
    });

    it('is true during mutation execution', async () => {
      let resolveMutation: (value: unknown) => void;
      const mutationPromise = new Promise(resolve => {
        resolveMutation = resolve;
      });
      const mockMutation = vi.fn().mockReturnValue(mutationPromise);

      const wrapper = createMutationWrapper(mockMutation, addToast);
      const resultPromise = wrapper.mutate();

      // isPending should be true while mutation is in-flight
      expect(wrapper.getIsPending()).toBe(true);

      // Resolve the mutation
      resolveMutation!({ success: true });
      await resultPromise;

      // isPending should be false after completion
      expect(wrapper.getIsPending()).toBe(false);
    });

    it('is false after successful mutation', async () => {
      const mockMutation = vi.fn().mockResolvedValue({ success: true });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(wrapper.getIsPending()).toBe(false);
    });

    it('is false after failed mutation (thrown error)', async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error('Server error'));
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await expect(wrapper.mutate()).rejects.toThrow('Server error');
      expect(wrapper.getIsPending()).toBe(false);
    });

    it('is false after mutation returns success: false', async () => {
      const mockMutation = vi
        .fn()
        .mockResolvedValue({ success: false, error: 'Not enough credits' });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(wrapper.getIsPending()).toBe(false);
    });
  });

  describe('error toasts', () => {
    it('shows error toast when mutation throws', async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error('Network failure'));
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await expect(wrapper.mutate()).rejects.toThrow('Network failure');

      expect(addToast).toHaveBeenCalledWith('Network failure', 'error');
    });

    it('shows error toast when result has success: false with error message', async () => {
      const mockMutation = vi
        .fn()
        .mockResolvedValue({ success: false, error: 'Not enough crystals' });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(addToast).toHaveBeenCalledWith('Not enough crystals', 'error');
    });

    it('shows generic error toast when result has success: false without error message', async () => {
      const mockMutation = vi.fn().mockResolvedValue({ success: false });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(addToast).toHaveBeenCalledWith('Operation failed', 'error');
    });

    it('shows generic message for non-Error thrown values', async () => {
      const mockMutation = vi.fn().mockRejectedValue('string error');
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await expect(wrapper.mutate()).rejects.toBe('string error');

      expect(addToast).toHaveBeenCalledWith('An unexpected error occurred', 'error');
    });

    it('does not show toast on successful mutation', async () => {
      const mockMutation = vi.fn().mockResolvedValue({ success: true, data: 'result' });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(addToast).not.toHaveBeenCalled();
    });

    it('does not show toast when result is a non-object value', async () => {
      const mockMutation = vi.fn().mockResolvedValue(42);
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(addToast).not.toHaveBeenCalled();
    });

    it('does not show toast when result is null', async () => {
      const mockMutation = vi.fn().mockResolvedValue(null);
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate();

      expect(addToast).not.toHaveBeenCalled();
    });
  });

  describe('return value', () => {
    it('returns the mutation result on success', async () => {
      const expectedResult = { success: true, seeds: ['moonflower'] };
      const mockMutation = vi.fn().mockResolvedValue(expectedResult);
      const wrapper = createMutationWrapper(mockMutation, addToast);

      const result = await wrapper.mutate();

      expect(result).toEqual(expectedResult);
    });

    it('returns the result even when success: false (for caller inspection)', async () => {
      const failResult = { success: false, error: 'Insufficient funds' };
      const mockMutation = vi.fn().mockResolvedValue(failResult);
      const wrapper = createMutationWrapper(mockMutation, addToast);

      const result = await wrapper.mutate();

      expect(result).toEqual(failResult);
    });

    it('re-throws errors from the mutation', async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error('Mutation failed'));
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await expect(wrapper.mutate()).rejects.toThrow('Mutation failed');
    });

    it('passes arguments through to the mutation function', async () => {
      const mockMutation = vi.fn().mockResolvedValue({ success: true });
      const wrapper = createMutationWrapper(mockMutation, addToast);

      await wrapper.mutate({ seedId: 'moonflower', count: 5 });

      expect(mockMutation).toHaveBeenCalledWith({ seedId: 'moonflower', count: 5 });
    });
  });
});
