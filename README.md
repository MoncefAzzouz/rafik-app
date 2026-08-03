# Rafik

Rafik is a Flutter multi-service application for taxi booking, food delivery,
parcel transport, and local home services.

## Project structure

The codebase follows a feature-first structure. New non-trivial features should
separate responsibilities into:

```text
lib/src/features/<feature>/
├── data/          # APIs, device integrations, DTOs, repository implementations
├── domain/        # Business entities and repository contracts
├── presentation/  # Pages, state controllers, and feature widgets
└── services/      # Temporary compatibility facades only
```

Cross-feature code belongs in `lib/src/core`, grouped by responsibility such as
theme, localization, errors, and result types. Widgets must not access mutable
state owned by another page.

## Quality checks

Run these before opening a pull request:

```sh
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```

Use profile mode and Flutter DevTools when evaluating performance:

```sh
flutter run --profile
```

Do not use debug-mode frame timing as a release performance measurement.
