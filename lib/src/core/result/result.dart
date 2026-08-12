import '../errors/app_failure.dart';

sealed class Result<T> {
  const Result();

  R fold<R>({
    required R Function(T value) onSuccess,
    required R Function(AppFailure failure) onFailure,
  });
}

final class Success<T> extends Result<T> {
  final T value;

  const Success(this.value);

  @override
  R fold<R>({
    required R Function(T value) onSuccess,
    required R Function(AppFailure failure) onFailure,
  }) => onSuccess(value);
}

final class Failure<T> extends Result<T> {
  final AppFailure failure;

  const Failure(this.failure);

  @override
  R fold<R>({
    required R Function(T value) onSuccess,
    required R Function(AppFailure failure) onFailure,
  }) => onFailure(failure);
}
