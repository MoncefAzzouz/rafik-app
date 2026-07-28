# Rafik Driver

Flutter application for Rafik parcel delivery partners. Drivers can manage
availability, review nearby parcel offers, run the pickup/drop-off workflow,
and track earnings and delivery history.

## Architecture

The app follows the same feature-first structure as Rafik:

```text
lib/src/
├── core/
│   ├── theme/
│   └── widgets/
└── features/
    ├── activity/
    ├── deliveries/
    │   ├── data/
    │   ├── domain/
    │   └── presentation/
    ├── earnings/
    ├── home/
    └── profile/
```

`DeliveryRepository` is the current in-memory source of truth. It is designed
to be replaced by a remote repository implementation when the backend API and
driver authentication are ready.

## Run

```sh
flutter pub get
flutter run
```

## Verify

```sh
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```
