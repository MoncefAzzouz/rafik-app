sealed class AppFailure {
  final String message;
  final Object? cause;

  const AppFailure(this.message, [this.cause]);
}

final class NetworkFailure extends AppFailure {
  const NetworkFailure(super.message, [super.cause]);
}

final class AuthFailure extends AppFailure {
  const AuthFailure(super.message, [super.cause]);
}

final class LocationFailure extends AppFailure {
  const LocationFailure(super.message, [super.cause]);
}

final class UnexpectedFailure extends AppFailure {
  const UnexpectedFailure(super.message, [super.cause]);
}
