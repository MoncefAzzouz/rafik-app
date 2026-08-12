import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../orders/data/truck_repository.dart';

class DocumentsPage extends StatelessWidget {
  const DocumentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isVerified = TruckRepository.instance.truck?.isVerified ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Documents & verification')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isVerified
                  ? AppColors.green.withAlpha(20)
                  : AppColors.amber.withAlpha(20),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: isVerified ? AppColors.green : AppColors.amber,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isVerified
                      ? Icons.verified_rounded
                      : Icons.hourglass_top_rounded,
                  color: isVerified ? AppColors.green : AppColors.amber,
                  size: 38,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isVerified
                            ? 'Your account is verified'
                            : 'Verification pending',
                        style: TextStyle(
                          color: isVerified
                              ? AppColors.green
                              : AppColors.amber,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        isVerified
                            ? 'You can go online and receive delivery requests.'
                            : "An admin is reviewing your account — you'll be "
                                  'notified once verified.',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
