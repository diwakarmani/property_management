import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../index';

/**
 * Regression test for a real race condition in the eye-icon toggle guard: two toggles in quick
 * succession (e.g. a fast double-tap, as reported on the Login screen's password field) used to
 * race two independent setTimeout calls against the same `toggleInProgressRef`. The FIRST
 * toggle's 100ms timer could fire and clear the ref before the SECOND toggle's own 100ms window
 * should have closed, reopening a gap where a spurious native `onChangeText('')` (a known iOS
 * TextInput quirk when `secureTextEntry` toggles) would slip through unsuppressed and wipe out
 * whatever the user had typed.
 *
 * This can't be reproduced by driving real native secureTextEntry behavior in a JS test
 * environment, so instead it directly proves the guard's own timing logic: fire two toggles
 * 30ms apart, then simulate the spurious empty change at the exact point that only the FIRST
 * toggle's (buggy) timer would have already cleared, and assert it's still suppressed correctly.
 */
describe('Input — eye-icon double-toggle race condition', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps suppressing spurious onChangeText("") through the full window after a second toggle 30ms after the first', () => {
    const onChangeText = jest.fn();
    const screen = render(
      <Input
        secureTextEntry
        value="Test@123"
        onChangeText={onChangeText}
        placeholder="Enter your password"
      />
    );

    const eyeButton = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity)[0];

    fireEvent.press(eyeButton); // toggle #1 at t=0
    jest.advanceTimersByTime(30);
    fireEvent.press(eyeButton); // toggle #2 at t=30

    // Advance to t=101 overall (71ms after the second toggle). The buggy version's FIRST
    // timeout (armed at t=0, firing at t=100) would have already cleared the guard here, even
    // though we're still well within 100ms of the second toggle.
    jest.advanceTimersByTime(71);

    const textInput = screen.UNSAFE_getByType(require('react-native').TextInput);
    fireEvent(textInput, 'onChangeText', '');

    expect(onChangeText).not.toHaveBeenCalledWith('');
  });

  it('still lets a real onChangeText("") through once the full 100ms window after the LAST toggle has elapsed', () => {
    const onChangeText = jest.fn();
    const screen = render(
      <Input
        secureTextEntry
        value="Test@123"
        onChangeText={onChangeText}
        placeholder="Enter your password"
      />
    );

    const eyeButton = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity)[0];
    fireEvent.press(eyeButton);
    jest.advanceTimersByTime(150);

    const textInput = screen.UNSAFE_getByType(require('react-native').TextInput);
    fireEvent(textInput, 'onChangeText', '');

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
