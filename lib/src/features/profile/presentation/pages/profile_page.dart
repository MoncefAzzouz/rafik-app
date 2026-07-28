import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import 'documents_page.dart';
import 'personal_information_page.dart';
import 'vehicle_information_page.dart';

class DriverProfilePage extends StatelessWidget {
  const DriverProfilePage({super.key});

  @override
  Widget build(BuildContext context) => SafeArea(
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
          child: const Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: AppColors.blue,
                child: Text(
                  'MA',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Moncef Azzouz',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Verified parcel driver',
                      style: TextStyle(color: Colors.white60),
                    ),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.star_rounded,
                          color: AppColors.amber,
                          size: 17,
                        ),
                        SizedBox(width: 4),
                        Text(
                          '4.92 · 238 deliveries',
                          style: TextStyle(
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
          child: const Row(
            children: [
              Icon(Icons.local_shipping_outlined, color: AppColors.blue),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Renault Kangoo',
                      style: TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      'Van · 123456-116-19',
                      style: TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Icon(Icons.verified_rounded, color: AppColors.green),
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
        _tile(Icons.logout_rounded, 'Sign out', danger: true),
      ],
    ),
  );

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
}
