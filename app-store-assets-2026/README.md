# Rafik App Store screenshots

Ready-to-upload screenshot sets created from the 10 supplied Rafik customer-app captures.

## Export sets

- `iphone-6.7/`: 10 PNG images at **1284 × 2778 px**
- `ipad-12.9/`: 10 PNG images at **2048 × 2732 px**
- `rafik-iphone-6.7-screenshots.zip`: packaged iPhone set
- `rafik-ipad-12.9-screenshots.zip`: packaged iPad set

Every final PNG is RGB and has no alpha channel.

## Gallery order

1. Delivery made simple
2. One app. Every move.
3. Set your route
4. Know the journey
5. Built around your needs
6. Review with confidence
7. You're all set
8. Every order, organized
9. Made for you
10. Track what matters

Only `rafik_app_icon.png` is used as the brand mark. The alternate `logoApp.PNG` is not used.

## Rebuilding

The source folder contains the reusable generated background and the build script. Run:

```sh
node source/build-app-store-assets.mjs
```

The iPad artwork uses the supplied iPhone captures inside an iPad-sized marketing layout. If the actual app interface is materially different on iPad, replace the inputs with native iPad Simulator captures before submission.
