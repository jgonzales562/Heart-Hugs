import { describe, expect, it, jest } from '@jest/globals';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

import { AppErrorBoundary } from '../AppErrorBoundary';

type ElementWithChildren = ReactElement<{ readonly children?: ReactNode }>;
type PressableElement = ReactElement<{ readonly onPress: () => void }>;

function requireElementWithChildren(value: ReactNode): ElementWithChildren {
  if (!isValidElement<{ readonly children?: ReactNode }>(value)) {
    throw new TypeError('Expected a React element with children.');
  }

  return value;
}

describe('AppErrorBoundary', () => {
  it('renders its children while no error has been recorded', () => {
    const child = 'Healthy application';
    const boundary = new AppErrorBoundary({ children: child });

    expect(boundary.render()).toBe(child);
  });

  it('renders the fallback after deriving error state', () => {
    const boundary = new AppErrorBoundary({ children: 'Failed application' });
    boundary.state = AppErrorBoundary.getDerivedStateFromError();

    const fallback = requireElementWithChildren(boundary.render());
    const panel = requireElementWithChildren(Children.only(fallback.props.children));

    expect(panel.props).toMatchObject({
      accessibilityLiveRegion: 'assertive',
      accessibilityRole: 'alert',
    });
  });

  it('logs the captured error and component stack', () => {
    const boundary = new AppErrorBoundary({ children: null });
    const error = new Error('Render failed');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    boundary.componentDidCatch(error, { componentStack: '\n    at BrokenView' });

    expect(consoleError).toHaveBeenCalledWith(
      'Heart Hugs encountered an unexpected error.',
      error,
      '\n    at BrokenView'
    );
    consoleError.mockRestore();
  });

  it('requests an error-state reset when retry is pressed', () => {
    const boundary = new AppErrorBoundary({ children: null });
    boundary.state = AppErrorBoundary.getDerivedStateFromError();
    const setState = jest.spyOn(boundary, 'setState').mockImplementation(() => undefined);
    const fallback = requireElementWithChildren(boundary.render());
    const panel = requireElementWithChildren(Children.only(fallback.props.children));
    const panelChildren = Children.toArray(panel.props.children);
    const retryButton = panelChildren[2];

    if (!isValidElement<{ readonly onPress: () => void }>(retryButton)) {
      throw new TypeError('Expected the fallback retry button.');
    }

    (retryButton as PressableElement).props.onPress();

    expect(setState).toHaveBeenCalledWith({ hasError: false });
  });
});
