/// The logged-in user's profile, mirroring the `User` row shape returned by
/// the backend from `/api/auth/login`, `/api/auth/register` and
/// `/api/auth/me`.
class AppUser {
  final String id;
  final String email;
  final String phone;
  final String fullName;
  final String role;
  final String? profileImage;

  const AppUser({
    required this.id,
    required this.email,
    required this.phone,
    required this.fullName,
    required this.role,
    this.profileImage,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(),
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      profileImage: json['profileImage']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'phone': phone,
    'fullName': fullName,
    'role': role,
    'profileImage': profileImage,
  };
}
