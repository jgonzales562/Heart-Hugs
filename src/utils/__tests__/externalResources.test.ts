import { describe, expect, it, jest } from '@jest/globals';

import { tryOpenExternalResource } from '../externalResources';

describe('external resource helpers', () => {
  it('opens the requested URL and reports success', async () => {
    const openUrl = jest.fn(async () => undefined);

    await expect(tryOpenExternalResource('https://988lifeline.org', openUrl)).resolves.toBe(true);
    expect(openUrl).toHaveBeenCalledWith('https://988lifeline.org');
  });

  it('reports launch failures without rejecting', async () => {
    const error = new Error('No compatible application');
    const openUrl = jest.fn(async () => Promise.reject(error));
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(tryOpenExternalResource('tel:988', openUrl)).resolves.toBe(false);
    expect(consoleWarn).toHaveBeenCalledWith('Unable to open external resource: tel:988', error);

    consoleWarn.mockRestore();
  });
});
