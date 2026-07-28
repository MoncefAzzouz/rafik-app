import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class DocumentsPage extends StatelessWidget {
  const DocumentsPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Documents & verification')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(22),
          ),
          child: const Row(
            children: [
              Icon(Icons.verified_rounded, color: Colors.white, size: 38),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Account verified',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'All required driver documents are approved.',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Required documents',
          style: TextStyle(
            color: AppColors.ink,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 12),
        _document(
          context,
          Icons.badge_outlined,
          'National identity card',
          'Expires May 2031',
          _DocumentStatus.verified,
        ),
        _document(
          context,
          Icons.drive_eta_outlined,
          'Driver’s license',
          'Expires September 2028',
          _DocumentStatus.verified,
        ),
        _document(
          context,
          Icons.article_outlined,
          'Criminal record',
          'Submitted July 2026',
          _DocumentStatus.verified,
        ),
        _document(
          context,
          Icons.medical_information_outlined,
          'Medical certificate',
          'Renew before August 12',
          _DocumentStatus.expiring,
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.royalBlue.withAlpha(15),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded, color: AppColors.royalBlue),
              SizedBox(width: 11),
              Expanded(
                child: Text(
                  'Keep documents current to continue receiving delivery requests without interruption.',
                  style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _document(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    _DocumentStatus status,
  ) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(19),
    ),
    child: Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: AppColors.royalBlue.withAlpha(16),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: AppColors.royalBlue),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        TextButton(
          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document update opened')),
          ),
          child: Text(
            status == _DocumentStatus.verified ? 'Verified' : 'Update',
            style: TextStyle(
              color: status == _DocumentStatus.verified
                  ? AppColors.green
                  : AppColors.amber,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    ),
  );
}

enum _DocumentStatus { verified, expiring }
