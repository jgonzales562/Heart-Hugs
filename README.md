# Heart Hugs

Heart Hugs is a local-first Expo app for short guided wellness practices. It helps someone choose a practice by their current need and available time, then keeps saved sessions, recent activity, completions, and resume position on their device.

## Development

```bash
npm ci
npm run validate
npm start
```

Native development uses the EAS development profiles in `eas.json`. The app currently targets Expo SDK 57.

## Product structure

- **Today** recommends a session from a selected need and time preference and surfaces resumable activity.
- **Explore** supports text search and category filtering.
- **Saved** contains local bookmarks, recent activity, and completion totals.
- **Player** owns one mounted media session at a time, restores position, supports seeking and playback speed for audio, and records completion.
- **Settings** contains practitioner information, the complete wellness disclaimer, safety information, privacy behavior, and content status.

No account is required. The state stored under `@heart-hugs/wellness-state` is versioned and contains only session IDs, preferences, playback position, and completion timestamps.

## Content contract

The bundled catalog is validated at startup by `src/content/sessionRepository.ts`. Each session must include:

- a unique stable ID;
- HTTPS media and artwork URLs;
- at least one recognized wellness need;
- display metadata, benefits, and tags; and
- an explicit `contentStatus`.

A session marked `reviewed` must also provide a review date and transcript. The current bundled sessions remain marked `prototype` because their demonstration media, practitioner identity, transcripts, and clinical review are not production-ready.

The repository interface is intentionally independent of the bundled array. A remote manifest or CMS can replace the local source without changing screen behavior, provided it is validated before publication.

## Production release requirements

- Replace all demonstration media and artwork with licensed, production-owned assets.
- Verify practitioner identity and credentials.
- Add complete transcripts and video captions.
- Obtain clinical and legal review of content, claims, consent, and safety copy.
- Localize crisis resources for supported regions.
- Test Dynamic Type, screen readers, reduced-motion settings, and color contrast.
- Run physical-device playback tests on supported iOS and Android versions.
- Decide whether downloads and cross-device synchronization are required before adding an account system.

## Android audio-focus patch

`patches/expo-audio+57.0.3.patch` changes Expo Audio's Android `doNotMix` focus request from transient focus to normal media focus and explicitly configures media usage. It exists to support long-form background playback.

Whenever Expo Audio is upgraded:

1. Check whether the upstream implementation already resolves the focus behavior.
2. Re-run calls, alarms, navigation, backgrounding, headphone removal, and competing-media tests on a physical Android device.
3. Remove the patch if it is no longer required; otherwise regenerate it against the new package version.

Do not silently carry this patch across SDK upgrades.
