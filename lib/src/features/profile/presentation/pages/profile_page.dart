import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../auth/pages/login_page.dart';
import '../../../orders/data/truck_repository.dart';
import 'documents_page.dart';
import 'personal_information_page.dart';
import 'vehicle_information_page.dart';

class DriverProfilePage extends StatefulWidget {
  final TruckRepository repository;

  const DriverProfilePage({super.key, required this.repository});

  @override
  State<DriverProfilePage> createState() => _DriverProfilePageState();
}

class _DriverProfilePageState extends State<DriverProfilePage> {
  TruckRepository get repository => widget.repository;

  @override
  void initState() {
    super.initState();
    repository.addListener(_refresh);
    if (repository.truck == null) {
      repository.refreshTruckProfile();
    }
  }

  void _refresh() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    repository.removeListener(_refresh);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final truck = repository.truck;
    final initials = _initials(truck?.driverName ?? '');
    final ratingLine = truck != null
        ? '${truck.rating?.toStringAsFixed(2) ?? '—'} · ${truck.totalTrips} deliveries'
        : '— · 0 deliveries';

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 22, 20, 120),
        children: [
          const Text(
            'Profile',
            style: TextStyle(
              color: AppColors.ink,
              fontSize: 30,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(26),
              boxShadow: [
                BoxShadow(
                  color: AppColors.royalBlue.withAlpha(45),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.blue,
                  child: Text(
                    initials,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        truck?.driverName ?? 'Driver',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        truck?.isVerified == true
                            ? 'Verified truck driver'
                            : 'Verification pending',
                        style: const TextStyle(color: Colors.white60),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Icons.star_rounded,
                            color: AppColors.amber,
                            size: 17,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            ratingLine,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Row(
              children: [
                const Icon(Icons.local_shipping_outlined, color: AppColors.blue),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        truck?.truckTypeName ?? 'No truck type set',
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        truck?.plate ?? 'No plate set',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  truck?.isVerified == true
                      ? Icons.verified_rounded
                      : Icons.hourglass_top_rounded,
                  color: truck?.isVerified == true
                      ? AppColors.green
                      : AppColors.amber,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Account',
            style: TextStyle(
              color: AppColors.muted,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: .8,
            ),
          ),
          const SizedBox(height: 9),
          _tile(
            Icons.person_outline_rounded,
            'Personal information',
            onTap: () => _open(context, const PersonalInformationPage()),
          ),
          _tile(
            Icons.description_outlined,
            'Documents & verification',
            onTap: () => _open(context, const DocumentsPage()),
          ),
          _tile(
            Icons.directions_car_outlined,
            'Vehicle information',
            onTap: () => _open(context, const VehicleInformationPage()),
          ),
          _tile(Icons.account_balance_outlined, 'Payout account'),
          const SizedBox(height: 20),
          const Text(
            'App',
            style: TextStyle(
              color: AppColors.muted,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: .8,
            ),
          ),
          const SizedBox(height: 9),
          _tile(Icons.notifications_none_rounded, 'Notifications'),
          _tile(Icons.translate_rounded, 'Language', trailing: 'English'),
          _tile(Icons.help_outline_rounded, 'Help & safety'),
          _tile(
            Icons.logout_rounded,
            'Sign out',
            danger: true,
            onTap: () => _signOut(context),
          ),
        ],
      ),
    );
  }

  Widget _tile(
    IconData icon,
    String label, {
    String? trailing,
    bool danger = false,
    VoidCallback? onTap,
  }) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(17),
    ),
    child: ListTile(
      leading: Icon(icon, color: danger ? AppColors.red : AppColors.navy),
      title: Text(
        label,
        style: TextStyle(
          color: danger ? AppColors.red : AppColors.ink,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: trailing == null
          ? const Icon(Icons.chevron_right_rounded, color: AppColors.muted)
          : Text(trailing, style: const TextStyle(color: AppColors.muted)),
      onTap: onTap,
    ),
  );

  void _open(BuildContext context, Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  Future<void> _signOut(BuildContext context) async {
    await AuthRepository.instance.logout();
    if (!context.mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
      (route) => false,
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }
}
