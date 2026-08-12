class DriverUser {
  final String id;
  final String email;
  final String? phone;
  final String fullName;
  final String role;
  final String? profileImage;

  const DriverUser({
    required this.id,
    required this.email,
    this.phone,
    required this.fullName,
    required this.role,
    this.profileImage,
  });

  factory DriverUser.fromJson(Map<String, dynamic> json) => DriverUser(
    id: json['id'].toString(),
    email: json['email'] as String? ?? '',
    phone: json['phone'] as String?,
    fullName: json['fullName'] as String? ?? '',
    role: json['role'] as String? ?? '',
    profileImage: json['profileImage'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'phone': phone,
    'fullName': fullName,
    'role': role,
    'profileImage': profileImage,
  };
}
